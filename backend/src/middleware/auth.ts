import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'psts-cybersecurity-lab-jwt-secret-key-2026-argon2id';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser, expiresIn: string = '8h'): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_name: user.role_name,
      permissions: user.permissions,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : queryToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in to access PSTS laboratory modules.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: 'User account no longer exists or session is invalid.' });
      return;
    }

    let perms: string[] = [];
    try {
      perms = JSON.parse(dbUser.role.permissions);
    } catch {
      perms = ['read', 'assess'];
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role_name: dbUser.role.role_name,
      permissions: perms,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication session.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role_name) && req.user.role_name !== 'Administrator') {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${req.user.role_name}`,
      });
      return;
    }
    next();
  };
}

export async function logAudit(params: {
  userId: string;
  activityType: string;
  assessmentId?: string | null;
  status?: 'SUCCESS' | 'WARNING' | 'BLOCKED' | 'ERROR';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Ensure no plaintext password or sensitive credential is ever logged
    const safeMetadata = { ...(params.metadata || {}) };
    delete safeMetadata.password;
    delete safeMetadata.plaintext;
    delete safeMetadata.token;
    delete safeMetadata.password_hash;

    await prisma.auditLog.create({
      data: {
        user_id: params.userId,
        activity_type: params.activityType,
        assessment_id: params.assessmentId || null,
        status: params.status || 'SUCCESS',
        metadata: JSON.stringify(safeMetadata),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

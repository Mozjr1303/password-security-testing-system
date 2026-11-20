import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db';
import { authenticate, logAudit, signToken } from '../middleware/auth';
import { evaluatePasswordStrength } from '../engines/passwordEngine';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Login rate limiting triggered (15-minute cooldown).',
  },
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, role_name } = req.body;
    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const requestedRole = role_name || 'Cybersecurity Student';
    let role = await prisma.role.findUnique({ where: { role_name: requestedRole } });
    if (!role) {
      role = await prisma.role.findFirst();
    }
    if (!role) {
      res.status(500).json({ error: 'System roles not initialized.' });
      return;
    }

    // Store password using Argon2id
    const passwordHash = await argon2.hash(String(password), {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const strengthEval = evaluatePasswordStrength(String(password));

    const user = await prisma.user.create({
      data: {
        full_name: String(full_name).trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role_id: role.id,
      },
      include: { role: true },
    });

    const permissions = JSON.parse(user.role.permissions || '["read","assess"]');
    const authUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_name: user.role.role_name,
      permissions,
    };

    await logAudit({
      userId: user.id,
      activityType: 'USER_REGISTRATION',
      status: 'SUCCESS',
      metadata: {
        role: user.role.role_name,
        hashing_algorithm: 'Argon2id (m=65536, t=3, p=4)',
        password_strength_category: strengthEval.strength_category,
      },
    });

    const token = signToken(authUser);
    res.status(201).json({
      message: 'Account registered and hashed securely with Argon2id.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await argon2.verify(user.password_hash, String(password));
    if (!valid) {
      await logAudit({
        userId: user.id,
        activityType: 'USER_LOGIN_FAILED',
        status: 'WARNING',
        metadata: { reason: 'Invalid password verification against Argon2id hash' },
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const permissions = JSON.parse(user.role.permissions || '["read","assess"]');
    const authUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_name: user.role.role_name,
      permissions,
    };

    const token = signToken(authUser, remember ? '7d' : '8h');

    await logAudit({
      userId: user.id,
      activityType: 'USER_LOGIN',
      status: 'SUCCESS',
      metadata: { role: user.role.role_name, session_duration: remember ? '7d' : '8h' },
    });

    res.json({
      message: 'Authenticated successfully.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service error.' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      activityType: 'USER_LOGOUT',
      status: 'SUCCESS',
      metadata: { email: req.user.email },
    });
  }
  res.json({ message: 'Logged out successfully.' });
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user) {
      // Prevent user enumeration while informing lab user
      res.json({
        message: 'If the account exists, an expiring CSPRNG reset token has been generated.',
      });
      return;
    }

    const rawResetToken = crypto.randomBytes(24).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: hashedToken,
        reset_token_expires: expiresAt,
      },
    });

    await logAudit({
      userId: user.id,
      activityType: 'PASSWORD_RESET_TOKEN_GENERATED',
      status: 'SUCCESS',
      metadata: {
        token_storage: 'SHA-256 Digest Only (CSPRNG 192-bit)',
        expires_in_minutes: 15,
      },
    });

    res.json({
      message: 'Expiring CSPRNG password reset token generated (SHA-256 hashed in DB, 15-min TTL).',
      lab_demo_reset_token: rawResetToken,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      res.status(400).json({ error: 'Reset token and new password are required.' });
      return;
    }

    if (String(new_password).length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    const hashedSubmitted = crypto.createHash('sha256').update(String(token).trim()).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        reset_token: hashedSubmitted,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }

    const newHash = await argon2.hash(String(new_password), {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    await logAudit({
      userId: user.id,
      activityType: 'PASSWORD_RESET_COMPLETED',
      status: 'SUCCESS',
      metadata: { algorithm: 'Argon2id', single_use_token_invalidated: true },
    });

    res.json({ message: 'Password reset successfully using Argon2id. Reset token has been invalidated.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        role: true,
        _count: {
          select: { assessments: true, laboratory_jobs: true, audit_logs: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_name: user.role.role_name,
      permissions: JSON.parse(user.role.permissions || '[]'),
      session_timeout_min: user.session_timeout_min,
      password_hash_algorithm: user.password_hash.startsWith('$argon2id$') ? 'Argon2id (PHC v19)' : 'bcrypt',
      created_at: user.created_at,
      stats: user._count,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, current_password, new_password, session_timeout_min } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { role: true } });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (full_name) {
      updateData.full_name = String(full_name).trim();
    }
    if (typeof session_timeout_min === 'number') {
      updateData.session_timeout_min = Math.min(Math.max(session_timeout_min, 5), 480);
    }

    if (new_password) {
      if (!current_password) {
        res.status(400).json({ error: 'Current password is required to change your password.' });
        return;
      }
      const matches = await argon2.verify(user.password_hash, String(current_password));
      if (!matches) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }
      updateData.password_hash = await argon2.hash(String(new_password), {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { role: true },
    });

    await logAudit({
      userId: user.id,
      activityType: 'USER_PROFILE_UPDATED',
      status: 'SUCCESS',
      metadata: { password_changed: Boolean(new_password), session_timeout_min: updated.session_timeout_min },
    });

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        role_name: updated.role.role_name,
        session_timeout_min: updated.session_timeout_min,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;

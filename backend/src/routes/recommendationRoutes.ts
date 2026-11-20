import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

export const REFERENCE_RECOMMENDATION_MATRIX = [
  {
    weakness: 'MD5 password storage',
    finding_title: 'Legacy Broken MD5 Password Hashing',
    severity: 'Critical',
    impact: 'Over 20 billion guesses/sec on commodity GPUs and practical collision attacks.',
    recommendation: 'Migrate to Argon2id',
    priority: 'Immediate',
    implementation_details: 'Wrap existing MD5 hashes with Argon2id immediately and re-hash with Argon2id (64 MB, t=3, p=4) upon user login.',
    code_snippet: `const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });`,
  },
  {
    weakness: 'SHA-256 used alone',
    finding_title: 'Unsuitable Fast General-Purpose Hash (SHA-256)',
    severity: 'High',
    impact: 'Lacks key stretching and memory hardness; allows multi-billion offline guesses per second.',
    recommendation: 'Adopt password-specific hashing',
    priority: 'Immediate',
    implementation_details: 'Replace single-pass SHA-256 with Argon2id, bcrypt (cost >= 12), or PBKDF2-HMAC-SHA256 (>= 600,000 iterations).',
    code_snippet: `const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });`,
  },
  {
    weakness: 'Missing unique salts',
    finding_title: 'Unsalted or Static-Salted Password Hashes',
    severity: 'Critical',
    impact: 'Identical passwords produce identical hashes and fall immediately to precomputed Rainbow Tables.',
    recommendation: 'Generate unique random salts',
    priority: 'Immediate',
    implementation_details: 'Generate a unique 128-bit (16-byte) cryptographically secure random salt for every user password.',
    code_snippet: `const salt = crypto.randomBytes(16); // Or use Argon2id / bcrypt built-in PHC salt`,
  },
  {
    weakness: 'Weak passwords',
    finding_title: 'Predictable Dictionary Words & Low-Entropy Passwords',
    severity: 'High',
    impact: 'Vulnerable to rapid dictionary, leetspeak rule-based, and credential-stuffing attacks.',
    recommendation: 'Introduce password strength guidance',
    priority: 'High',
    implementation_details: 'Enforce 12–16+ character minimum length, block common/breached dictionary words, and require >= 50 bits effective entropy.',
    code_snippet: `if (evaluatePasswordStrength(password).overall_score < 65) throw new Error('Weak password rejected');`,
  },
  {
    weakness: 'Missing rate limiting',
    finding_title: 'Unthrottled Authentication Endpoint',
    severity: 'High',
    impact: 'Allows automated online brute-force and credential stuffing at high request volume.',
    recommendation: 'Implement login rate limiting',
    priority: 'High',
    implementation_details: 'Apply sliding-window IP and account rate limiting (e.g., 5 failed attempts per 15 minutes) with exponential backoff.',
    code_snippet: `app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));`,
  },
  {
    weakness: 'No MFA',
    finding_title: 'Single-Factor Password Authentication Only',
    severity: 'Medium',
    impact: 'A single compromised password grants complete unauthorized account access.',
    recommendation: 'Introduce multi-factor authentication',
    priority: 'Medium',
    implementation_details: 'Support TOTP (RFC 6238) authenticator apps or FIDO2/WebAuthn hardware passkeys.',
    code_snippet: `const verified = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'base32', token: totpCode });`,
  },
  {
    weakness: 'Unlimited login attempts',
    finding_title: 'Absence of Account Lockout or Progressive Throttling',
    severity: 'High',
    impact: 'Attackers can continuously guess passwords against specific high-value user accounts.',
    recommendation: 'Introduce account protection',
    priority: 'High',
    implementation_details: 'Track consecutive failed login counters per account and trigger temporary lockout or step-up verification.',
    code_snippet: `if (user.failedAttempts >= 5) return res.status(423).json({ error: 'Account temporarily locked' });`,
  },
  {
    weakness: 'Insecure password reset',
    finding_title: 'Predictable, Unhashed, or Non-Expiring Password Reset Tokens',
    severity: 'High',
    impact: 'Account takeover via password recovery flow bypass.',
    recommendation: 'Implement expiring secure reset tokens',
    priority: 'High',
    implementation_details: 'Generate 32-byte CSPRNG single-use tokens, store only their SHA-256 digest in the DB, and expire within 15 minutes.',
    code_snippet: `const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');`,
  },
  {
    weakness: 'Weak hashing configuration',
    finding_title: 'Sub-Optimal Work Factor or Memory Cost Parameters',
    severity: 'Medium',
    impact: 'Under-configured adaptive hashes allow attackers to achieve higher cracking throughput than necessary.',
    recommendation: 'Increase work and memory costs appropriately',
    priority: 'Medium',
    implementation_details: 'Configure Argon2id with m=65536 KB (64 MB), t=3, p=4 or bcrypt with cost >= 12.',
    code_snippet: `await argon2.hash(pw, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });`,
  },
];

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const severityFilter = req.query.severity as string | undefined;
    const priorityFilter = req.query.priority as string | undefined;

    const recommendations = await prisma.recommendation.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        finding: {
          include: {
            assessment: { select: { id: true, assessment_name: true, assessment_type: true } },
          },
        },
      },
    });

    const filtered = recommendations.filter((r) => {
      if (severityFilter && severityFilter !== 'ALL' && r.finding.severity !== severityFilter) {
        return false;
      }
      if (priorityFilter && priorityFilter !== 'ALL' && r.priority !== priorityFilter) {
        return false;
      }
      return true;
    });

    res.json({
      recommendations: filtered,
      reference_matrix: REFERENCE_RECOMMENDATION_MATRIX,
    });
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Failed to load security recommendations.' });
  }
});

router.get('/findings', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const severity = req.query.severity as string | undefined;
    const where: Record<string, unknown> = {};
    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    const findings = await prisma.securityFinding.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        assessment: { select: { id: true, assessment_name: true, assessment_type: true, overall_score: true } },
        recommendations: true,
      },
    });

    res.json({ findings });
  } catch (err) {
    console.error('Get findings error:', err);
    res.status(500).json({ error: 'Failed to load security findings.' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const rec = await prisma.recommendation.findUnique({
      where: { id: String(req.params.id) },
      include: {
        finding: {
          include: { assessment: true },
        },
      },
    });

    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found.' });
      return;
    }

    res.json(rec);
  } catch (err) {
    console.error('Get recommendation by id error:', err);
    res.status(500).json({ error: 'Failed to load recommendation details.' });
  }
});

export default router;

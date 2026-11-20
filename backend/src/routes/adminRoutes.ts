import { Router, Request, Response } from 'express';
import argon2 from 'argon2';
import { prisma } from '../db';
import { authenticate, logAudit, requireRole } from '../middleware/auth';
import { generateEducationalHash } from '../engines/hashEngine';

const router = Router();

// Protect all admin routes with authenticate + Administrator/Lecturer/Supervisor check
const adminAccess = [authenticate, requireRole(['Administrator', 'Lecturer or Supervisor'])];

router.get('/roles', ...adminAccess, async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { role_name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
    res.json({
      roles: roles.map((r) => ({
        ...r,
        permissions: JSON.parse(r.permissions || '[]'),
      })),
    });
  } catch (err) {
    console.error('Admin get roles error:', err);
    res.status(500).json({ error: 'Failed to load system roles.' });
  }
});

router.get('/users', ...adminAccess, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        role: true,
        _count: { select: { assessments: true, laboratory_jobs: true, audit_logs: true } },
      },
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role_id: u.role_id,
        role_name: u.role.role_name,
        session_timeout_min: u.session_timeout_min,
        created_at: u.created_at,
        updated_at: u.updated_at,
        counts: u._count,
      })),
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to fetch user accounts.' });
  }
});

router.post('/users', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, role_name } = req.body;
    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      res.status(409).json({ error: 'User with this email already exists.' });
      return;
    }

    let role = await prisma.role.findUnique({ where: { role_name: role_name || 'Cybersecurity Student' } });
    if (!role) {
      role = await prisma.role.findFirst();
    }

    const passwordHash = await argon2.hash(String(password), {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const created = await prisma.user.create({
      data: {
        full_name: String(full_name).trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role_id: role!.id,
      },
      include: { role: true },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_USER_CREATED',
      status: 'SUCCESS',
      metadata: { target_email: created.email, role: created.role.role_name },
    });

    res.status(201).json({
      user: {
        id: created.id,
        full_name: created.full_name,
        email: created.email,
        role_name: created.role.role_name,
        created_at: created.created_at,
      },
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

router.put('/users/:id', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    const { full_name, role_name, password, session_timeout_min } = req.body;

    const updateData: Record<string, unknown> = {};
    if (full_name) updateData.full_name = String(full_name).trim();
    if (typeof session_timeout_min === 'number') updateData.session_timeout_min = session_timeout_min;

    if (role_name) {
      const role = await prisma.role.findUnique({ where: { role_name: String(role_name) } });
      if (role) updateData.role_id = role.id;
    }

    if (password && String(password).length >= 8) {
      updateData.password_hash = await argon2.hash(String(password), {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_USER_UPDATED',
      status: 'SUCCESS',
      metadata: { target_user_id: userId, new_role: updated.role.role_name },
    });

    res.json({
      user: {
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        role_name: updated.role.role_name,
        session_timeout_min: updated.session_timeout_min,
      },
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user account.' });
  }
});

router.delete('/users/:id', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    if (userId === req.user!.id) {
      res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_USER_DELETED',
      status: 'WARNING',
      metadata: { deleted_user_id: userId },
    });

    res.json({ message: 'User account deleted.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

router.get('/audit-logs', ...adminAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const activityType = req.query.activity_type as string | undefined;
    const where: Record<string, unknown> = {};
    if (activityType && activityType !== 'ALL') {
      where.activity_type = activityType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        user: { select: { full_name: true, email: true, role: { select: { role_name: true } } } },
      },
    });

    res.json({
      audit_logs: logs.map((l) => ({
        id: l.id,
        user_id: l.user_id,
        user_name: l.user.full_name,
        user_email: l.user.email,
        user_role: l.user.role.role_name,
        activity_type: l.activity_type,
        assessment_id: l.assessment_id,
        status: l.status,
        metadata: (() => {
          try {
            return JSON.parse(l.metadata);
          } catch {
            return {};
          }
        })(),
        created_at: l.created_at,
      })),
    });
  } catch (err) {
    console.error('Admin audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch system audit logs.' });
  }
});

router.get('/datasets', ...adminAccess, async (_req: Request, res: Response): Promise<void> => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { full_name: true, email: true } },
        hash_samples: true,
        _count: { select: { laboratory_jobs: true } },
      },
    });

    res.json({
      datasets: datasets.map((d) => ({
        ...d,
        entries: (() => {
          try {
            return JSON.parse(d.content_json);
          } catch {
            return [];
          }
        })(),
      })),
    });
  } catch (err) {
    console.error('Admin get datasets error:', err);
    res.status(500).json({ error: 'Failed to load laboratory datasets.' });
  }
});

router.post('/datasets', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      dataset_name,
      description,
      dataset_type = 'SYNTHETIC_PASSWORDS',
      category = 'Educational Lab',
      generation_mode = 'AUTO_SYNTHETIC',
      target_algorithms = ['MD5', 'SHA-256', 'bcrypt', 'Argon2id'],
      custom_entries = [],
    } = req.body;

    if (!dataset_name) {
      res.status(400).json({ error: 'Dataset name is required.' });
      return;
    }

    let entries: string[] = Array.isArray(custom_entries)
      ? custom_entries.map(String).map((s) => s.trim()).filter(Boolean)
      : [];

    if (entries.length === 0 || generation_mode === 'AUTO_SYNTHETIC') {
      if (dataset_type === 'EDUCATIONAL_WORDLIST') {
        entries = [
          'cyberlab', 'academic2026', 'campuswifi', 'student01', 'researcher1',
          'qwerty123', 'passw0rd!', 'sunshine99', 'dragon2026', 'letmein123',
          'football01', 'welcome2026'
        ];
      } else {
        entries = [
          'synthetic123',
          'LabPass@2026',
          'P@ssw0rd01',
          'Falcon#Orbit79!Nebula',
          'qwertyuiop',
          'Quantum$Shield88*Vector',
        ];
      }
    }

    const dataset = await prisma.dataset.create({
      data: {
        dataset_name: String(dataset_name).trim(),
        description: String(description || 'Authorised synthetic educational dataset created by administrator.'),
        dataset_type: String(dataset_type),
        category: String(category),
        record_count: entries.length,
        content_json: JSON.stringify(entries),
        created_by: req.user!.id,
      },
    });

    const createdSamples = [];
    if (dataset_type === 'HASH_SAMPLES') {
      const algos = Array.isArray(target_algorithms) && target_algorithms.length > 0
        ? target_algorithms
        : ['MD5', 'SHA-256', 'bcrypt', 'Argon2id'];

      for (let i = 0; i < Math.min(entries.length, 6); i++) {
        const algo = String(algos[i % algos.length]);
        const gen = await generateEducationalHash(entries[i], algo, {
          useRandomSalt: true,
          bcryptCost: 10,
          argon2MemoryKb: 19456,
          argon2TimeCost: 2,
        });
        const hs = await prisma.hashSample.create({
          data: {
            dataset_id: dataset.id,
            label: `Synthetic Sample #${i + 1} (${gen.algorithm})`,
            algorithm: gen.algorithm,
            sample_hash: gen.hash,
            salt: gen.salt,
            configuration: JSON.stringify(gen.configuration),
            hint: `Generated from synthetic pattern (${entries[i].length} chars)`,
          },
        });
        createdSamples.push(hs);
      }

      await prisma.dataset.update({
        where: { id: dataset.id },
        data: { record_count: createdSamples.length },
      });
    }

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_DATASET_CREATED',
      status: 'SUCCESS',
      metadata: {
        dataset_id: dataset.id,
        dataset_name: dataset.dataset_name,
        dataset_type: dataset.dataset_type,
        record_count: createdSamples.length || entries.length,
      },
    });

    res.status(201).json({
      dataset,
      hash_samples: createdSamples,
    });
  } catch (err) {
    console.error('Admin create dataset error:', err);
    res.status(500).json({ error: 'Failed to create synthetic dataset.' });
  }
});

router.post('/datasets/reset-lab', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedJobs = await prisma.laboratoryJob.deleteMany({});

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_LAB_EXPERIMENTS_RESET',
      status: 'WARNING',
      metadata: { cleared_jobs_count: deletedJobs.count },
    });

    res.json({
      message: `Reset ${deletedJobs.count} laboratory experiment execution logs while preserving core synthetic datasets.`,
      cleared_jobs_count: deletedJobs.count,
    });
  } catch (err) {
    console.error('Reset lab error:', err);
    res.status(500).json({ error: 'Failed to reset laboratory experiments.' });
  }
});

router.delete('/datasets/:id', authenticate, requireRole(['Administrator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetId = String(req.params.id);
    await prisma.dataset.delete({ where: { id: datasetId } });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ADMIN_DATASET_DELETED',
      status: 'WARNING',
      metadata: { dataset_id: datasetId },
    });

    res.json({ message: 'Dataset deleted successfully.' });
  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ error: 'Failed to delete dataset.' });
  }
});

router.get('/statistics', ...adminAccess, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      usersCount,
      rolesCount,
      datasetsCount,
      hashSamplesCount,
      assessmentsCount,
      reportsCount,
      auditLogsCount,
      labJobsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.dataset.count(),
      prisma.hashSample.count(),
      prisma.assessment.count(),
      prisma.report.count(),
      prisma.auditLog.count(),
      prisma.laboratoryJob.count(),
    ]);

    res.json({
      system_statistics: {
        users_count: usersCount,
        roles_count: rolesCount,
        datasets_count: datasetsCount,
        hash_samples_count: hashSamplesCount,
        assessments_count: assessmentsCount,
        reports_count: reportsCount,
        audit_logs_count: auditLogsCount,
        laboratory_jobs_count: labJobsCount,
        resource_limits: {
          max_attempts_per_job: Number(process.env.LAB_MAX_ATTEMPTS || 10000),
          max_execution_time_ms: Number(process.env.LAB_MAX_EXECUTION_MS || 5000),
          max_argon2_memory_kb: 131072,
          zero_plaintext_policy: 'ENFORCED',
        },
      },
    });
  } catch (err) {
    console.error('Admin statistics error:', err);
    res.status(500).json({ error: 'Failed to fetch administration statistics.' });
  }
});

export default router;

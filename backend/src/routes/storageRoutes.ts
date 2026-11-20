import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';
import { evaluateStorageConfiguration } from '../engines/storageEngine';

const router = Router();

router.post('/assess', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      algorithm = 'Argon2id',
      salt_configuration = 'Unique Random (>= 16 bytes)',
      salt_uniqueness = true,
      work_factor = 3,
      memory_cost = 65536,
      iteration_count = 3,
      storage_format = 'PHC String ($argon2id$...)',
      reset_implementation = 'Expiring Single-Use CSPRNG Token (Hashed)',
      mfa_enabled = true,
      rate_limiting = true,
      measured_password_score,
      assessment_id,
      assessment_name,
    } = req.body;

    const evaluation = evaluateStorageConfiguration({
      algorithm: String(algorithm),
      salt_configuration: String(salt_configuration),
      salt_uniqueness: Boolean(salt_uniqueness),
      work_factor: Number(work_factor),
      memory_cost: Number(memory_cost),
      iteration_count: Number(iteration_count),
      storage_format: String(storage_format),
      reset_implementation: String(reset_implementation),
      mfa_enabled: Boolean(mfa_enabled),
      rate_limiting: Boolean(rate_limiting),
      measured_password_score:
        typeof measured_password_score === 'number' ? measured_password_score : undefined,
    });

    let targetAssessmentId = assessment_id as string | undefined;
    if (!targetAssessmentId) {
      const created = await prisma.assessment.create({
        data: {
          user_id: req.user!.id,
          assessment_name:
            assessment_name ||
            `Storage Configuration Assessment (${algorithm} - ${evaluation.score_classification})`,
          description: `Evaluated ${algorithm} storage configuration, salt policy, reset tokens, MFA, and rate limiting.`,
          assessment_type: 'Storage Assessment',
          status: 'COMPLETED',
          overall_score: evaluation.overall_score,
          risk_classification: evaluation.score_classification,
          score_type: evaluation.score_type,
          completed_at: new Date(),
        },
      });
      targetAssessmentId = created.id;
    } else {
      await prisma.assessment.update({
        where: { id: targetAssessmentId },
        data: {
          overall_score: evaluation.overall_score,
          risk_classification: evaluation.score_classification,
          score_type: evaluation.score_type,
        },
      });
    }

    const saved = await prisma.storageAssessment.create({
      data: {
        assessment_id: targetAssessmentId,
        algorithm: String(algorithm),
        salt_configuration: String(salt_configuration),
        salt_uniqueness: Boolean(salt_uniqueness),
        work_factor: Number(work_factor),
        memory_cost: Number(memory_cost),
        iteration_count: Number(iteration_count),
        storage_format: String(storage_format),
        reset_implementation: String(reset_implementation),
        mfa_enabled: Boolean(mfa_enabled),
        rate_limiting: Boolean(rate_limiting),
        security_score: evaluation.overall_score,
        score_classification: evaluation.score_classification,
        score_type: evaluation.score_type,
        category_scores: JSON.stringify(evaluation.category_scores),
        findings_summary: JSON.stringify(evaluation.findings),
      },
    });

    // Save SecurityFindings and Recommendations in DB
    for (const f of evaluation.findings) {
      const createdFinding = await prisma.securityFinding.create({
        data: {
          assessment_id: targetAssessmentId,
          finding_title: f.finding_title,
          description: f.description,
          severity: f.severity,
          impact: f.impact,
          category: f.category,
        },
      });

      await prisma.recommendation.create({
        data: {
          finding_id: createdFinding.id,
          recommendation: f.recommendation,
          priority: f.priority,
          implementation_details: f.implementation_details,
          code_snippet: f.code_snippet,
        },
      });
    }

    await logAudit({
      userId: req.user!.id,
      activityType: 'STORAGE_CONFIG_ASSESSMENT',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        algorithm,
        overall_score: evaluation.overall_score,
        classification: evaluation.score_classification,
        critical_override: evaluation.critical_override_applied,
        findings_count: evaluation.findings.length,
      },
    });

    res.status(201).json({
      id: saved.id,
      assessment_id: targetAssessmentId,
      evaluation,
    });
  } catch (err) {
    console.error('Storage assessment error:', err);
    res.status(500).json({ error: 'Failed to evaluate password storage configuration.' });
  }
});

router.get('/history', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await prisma.storageAssessment.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
      include: { assessment: { select: { assessment_name: true } } },
    });

    res.json({
      history: records.map((r) => ({
        ...r,
        assessment_name: r.assessment.assessment_name,
        category_scores: JSON.parse(r.category_scores || '{}'),
        findings_summary: JSON.parse(r.findings_summary || '[]'),
      })),
    });
  } catch (err) {
    console.error('Storage history error:', err);
    res.status(500).json({ error: 'Failed to fetch storage assessment history.' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await prisma.storageAssessment.findUnique({
      where: { id: String(req.params.id) },
      include: { assessment: true },
    });
    if (!record) {
      res.status(404).json({ error: 'Storage assessment not found.' });
      return;
    }

    res.json({
      ...record,
      category_scores: JSON.parse(record.category_scores || '{}'),
      findings_summary: JSON.parse(record.findings_summary || '[]'),
    });
  } catch (err) {
    console.error('Get storage assessment error:', err);
    res.status(500).json({ error: 'Failed to load storage assessment details.' });
  }
});

export default router;

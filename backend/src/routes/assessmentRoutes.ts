import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const where: Record<string, unknown> = {};
    if (typeFilter && typeFilter !== 'ALL') {
      where.assessment_type = typeFilter;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { full_name: true, email: true } },
        _count: {
          select: {
            password_tests: true,
            hash_analyses: true,
            storage_assessments: true,
            security_findings: true,
            reports: true,
            laboratory_jobs: true,
          },
        },
      },
    });

    res.json({ assessments });
  } catch (err) {
    console.error('Get assessments error:', err);
    res.status(500).json({ error: 'Failed to load assessment history.' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessment_name, description, assessment_type = 'Full Security Assessment' } = req.body;
    if (!assessment_name) {
      res.status(400).json({ error: 'Assessment name is required.' });
      return;
    }

    const created = await prisma.assessment.create({
      data: {
        user_id: req.user!.id,
        assessment_name: String(assessment_name).trim(),
        description: description ? String(description).trim() : '10-Step Structured Password Security Assessment',
        assessment_type: String(assessment_type),
        status: 'IN_PROGRESS',
        overall_score: 0,
        risk_classification: 'Moderate',
        score_type: 'Measured',
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ASSESSMENT_CREATED',
      assessmentId: created.id,
      status: 'SUCCESS',
      metadata: { assessment_name: created.assessment_name, type: created.assessment_type },
    });

    res.status(201).json({ assessment: created });
  } catch (err) {
    console.error('Create assessment error:', err);
    res.status(500).json({ error: 'Failed to create assessment.' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { full_name: true, email: true } },
        password_tests: true,
        hash_analyses: true,
        benchmarks: true,
        storage_assessments: true,
        security_findings: { include: { recommendations: true } },
        reports: true,
        laboratory_jobs: true,
      },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    res.json({ assessment });
  } catch (err) {
    console.error('Get assessment details error:', err);
    res.status(500).json({ error: 'Failed to load assessment details.' });
  }
});

router.put('/:id/complete', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const assessmentId = String(req.params.id);
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        password_tests: true,
        hash_analyses: true,
        storage_assessments: true,
        security_findings: true,
      },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    let finalScore = assessment.overall_score;
    if (assessment.storage_assessments.length > 0) {
      finalScore = assessment.storage_assessments[assessment.storage_assessments.length - 1].security_score;
    } else if (assessment.password_tests.length > 0) {
      finalScore = assessment.password_tests[assessment.password_tests.length - 1].overall_score;
    }

    const hasCritical = assessment.security_findings.some((f) => f.severity === 'Critical');
    let classification = 'Moderate';
    if (finalScore >= 90) classification = 'Excellent';
    else if (finalScore >= 75) classification = 'Good';
    else if (finalScore >= 60) classification = 'Moderate';
    else if (finalScore >= 40) classification = 'Poor';
    else classification = 'Critical';

    if (hasCritical && ['Excellent', 'Good', 'Moderate'].includes(classification)) {
      classification = 'Critical';
      finalScore = Math.min(finalScore, 38);
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        overall_score: finalScore,
        risk_classification: classification,
        completed_at: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'ASSESSMENT_COMPLETED',
      assessmentId: updated.id,
      status: 'SUCCESS',
      metadata: { overall_score: finalScore, classification },
    });

    res.json({ assessment: updated });
  } catch (err) {
    console.error('Complete assessment error:', err);
    res.status(500).json({ error: 'Failed to complete assessment.' });
  }
});

export default router;

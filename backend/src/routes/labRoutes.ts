import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';
import { PREDEFINED_EXPERIMENTS, executeLaboratoryExperiment } from '../engines/labEngine';
import { requestCancelJob, runControlledAudit } from '../engines/hashEngine';

const router = Router();

router.get('/experiments', authenticate, (_req: Request, res: Response): void => {
  res.json({ experiments: PREDEFINED_EXPERIMENTS });
});

router.post('/experiments/:id/run', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const expId = String(req.params.id);
    const { inputs = {}, assessment_id, dataset_id } = req.body;

    const output = await executeLaboratoryExperiment(expId, inputs);

    let targetAssessmentId = assessment_id as string | undefined;
    if (!targetAssessmentId) {
      const created = await prisma.assessment.create({
        data: {
          user_id: req.user!.id,
          assessment_name: `${output.experiment.title}`,
          description: output.experiment.subtitle,
          assessment_type: 'Lab Experiment',
          status: 'COMPLETED',
          overall_score: 85,
          risk_classification: 'Good',
          score_type: 'Measured',
          completed_at: new Date(),
        },
      });
      targetAssessmentId = created.id;
    }

    const job = await prisma.laboratoryJob.create({
      data: {
        user_id: req.user!.id,
        dataset_id: dataset_id || null,
        assessment_id: targetAssessmentId,
        experiment_id: output.experiment.id,
        job_type: output.experiment.title,
        target_algorithm: String(inputs.target_algorithm || inputs.compare_algorithm || 'Multi-Algorithm'),
        status: 'COMPLETED',
        attempts_count: output.attempts_count,
        max_attempts: output.experiment.execution_controls.max_attempts,
        execution_time: output.execution_time_ms,
        matched_count: 1,
        total_targets: 1,
        result_summary: JSON.stringify(output),
        completed_at: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'LAB_EXPERIMENT_EXECUTED',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        experiment_id: output.experiment.id,
        title: output.experiment.title,
        execution_time_ms: output.execution_time_ms,
      },
    });

    res.status(201).json({
      job_id: job.id,
      assessment_id: targetAssessmentId,
      ...output,
    });
  } catch (err) {
    console.error('Run lab experiment error:', err);
    res.status(500).json({ error: 'Failed to run controlled laboratory experiment.' });
  }
});

router.post('/audit', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      job_type = 'DICTIONARY_AUDIT',
      algorithm = 'SHA-256',
      dataset_id,
      sample_hash,
      salt,
      charset = 'numeric',
      max_length = 3,
      max_attempts = 2000,
      max_execution_ms = 3500,
      assessment_id,
    } = req.body;

    // Build target list from either custom sample_hash or preloaded dataset
    const targets: Array<{ label: string; sample_hash: string; salt?: string | null }> = [];
    if (sample_hash && typeof sample_hash === 'string') {
      targets.push({
        label: `Custom Authorized Sample (${algorithm})`,
        sample_hash: sample_hash.trim(),
        salt: salt || null,
      });
    } else if (dataset_id) {
      const samples = await prisma.hashSample.findMany({
        where: { dataset_id: String(dataset_id) },
        take: 8,
      });
      for (const s of samples) {
        if (!algorithm || algorithm === 'ALL' || s.algorithm.toUpperCase() === String(algorithm).toUpperCase()) {
          targets.push({ label: s.label, sample_hash: s.sample_hash, salt: s.salt });
        }
      }
    }

    if (targets.length === 0) {
      const fallbackSamples = await prisma.hashSample.findMany({
        where: { algorithm: String(algorithm) },
        take: 4,
      });
      for (const s of fallbackSamples) {
        targets.push({ label: s.label, sample_hash: s.sample_hash, salt: s.salt });
      }
    }

    if (targets.length === 0) {
      res.status(400).json({ error: 'No synthetic target hashes selected for controlled auditing.' });
      return;
    }

    // Load local educational wordlist
    const wordlists = await prisma.dataset.findMany({
      where: { dataset_type: 'EDUCATIONAL_WORDLIST' },
      select: { content_json: true },
    });
    const customWords: string[] = [];
    for (const wl of wordlists) {
      try {
        const parsed = JSON.parse(wl.content_json);
        if (Array.isArray(parsed)) customWords.push(...parsed.map(String));
      } catch {
        // ignore
      }
    }

    // Create initial RUNNING job record
    const pendingJob = await prisma.laboratoryJob.create({
      data: {
        user_id: req.user!.id,
        dataset_id: dataset_id || null,
        assessment_id: assessment_id || null,
        experiment_id: job_type === 'DICTIONARY_AUDIT' ? 'EXP-4' : 'EXP-5',
        job_type: String(job_type),
        target_algorithm: String(algorithm),
        status: 'RUNNING',
        max_attempts: Number(max_attempts),
        total_targets: targets.length,
        result_summary: '{}',
      },
    });

    const auditResult = await runControlledAudit({
      jobId: pendingJob.id,
      jobType: job_type === 'BRUTE_FORCE_DEMO' ? 'BRUTE_FORCE_DEMO' : 'DICTIONARY_AUDIT',
      algorithm: String(algorithm),
      targets,
      wordlist: customWords.length > 0 ? customWords : undefined,
      charset,
      maxLength: Number(max_length),
      maxAttempts: Number(max_attempts),
      maxExecutionMs: Number(max_execution_ms),
    });

    const updatedJob = await prisma.laboratoryJob.update({
      where: { id: pendingJob.id },
      data: {
        status: auditResult.status,
        attempts_count: auditResult.attempts_count,
        execution_time: auditResult.execution_time_ms,
        matched_count: auditResult.matched_count,
        result_summary: JSON.stringify(auditResult),
        completed_at: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'CONTROLLED_PASSWORD_AUDIT',
      assessmentId: assessment_id || null,
      status: 'SUCCESS',
      metadata: {
        job_id: updatedJob.id,
        job_type,
        algorithm,
        attempts: auditResult.attempts_count,
        matched: auditResult.matched_count,
        execution_time_ms: auditResult.execution_time_ms,
      },
    });

    res.status(201).json({
      job_id: updatedJob.id,
      ...auditResult,
    });
  } catch (err) {
    console.error('Lab audit error:', err);
    res.status(500).json({ error: 'Controlled password auditing exercise failed.' });
  }
});

router.get('/jobs', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.laboratoryJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
      include: {
        user: { select: { full_name: true } },
        dataset: { select: { dataset_name: true } },
      },
    });

    res.json({
      jobs: jobs.map((j) => ({
        ...j,
        result_summary: (() => {
          try {
            return JSON.parse(j.result_summary);
          } catch {
            return {};
          }
        })(),
      })),
    });
  } catch (err) {
    console.error('Get lab jobs error:', err);
    res.status(500).json({ error: 'Failed to load laboratory job history.' });
  }
});

router.get('/results/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.laboratoryJob.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { full_name: true, email: true } },
        dataset: { select: { dataset_name: true, dataset_type: true } },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Laboratory job result not found.' });
      return;
    }

    res.json({
      ...job,
      result_summary: JSON.parse(job.result_summary || '{}'),
    });
  } catch (err) {
    console.error('Get lab result error:', err);
    res.status(500).json({ error: 'Failed to load laboratory result.' });
  }
});

router.post('/jobs/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = String(req.params.id);
    requestCancelJob(jobId);

    const job = await prisma.laboratoryJob.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ error: 'Laboratory job not found.' });
      return;
    }

    const updated = await prisma.laboratoryJob.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        completed_at: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'LAB_JOB_CANCELLED',
      status: 'WARNING',
      metadata: { job_id: jobId, job_type: updated.job_type },
    });

    res.json({ message: 'Laboratory job cancellation signal processed.', job: updated });
  } catch (err) {
    console.error('Cancel lab job error:', err);
    res.status(500).json({ error: 'Failed to cancel laboratory job.' });
  }
});

router.get('/datasets', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { full_name: true } },
        hash_samples: true,
      },
    });

    res.json({
      datasets: datasets.map((d) => ({
        ...d,
        content_preview: (() => {
          try {
            const arr = JSON.parse(d.content_json);
            return Array.isArray(arr) ? arr.slice(0, 15) : [];
          } catch {
            return [];
          }
        })(),
      })),
    });
  } catch (err) {
    console.error('Get datasets error:', err);
    res.status(500).json({ error: 'Failed to fetch laboratory datasets.' });
  }
});

export default router;

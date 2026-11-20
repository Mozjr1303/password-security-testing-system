import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';
import {
  SUPPORTED_ALGORITHMS,
  demonstrateSalting,
  generateEducationalHash,
  identifyAndAnalyzeHash,
  runAlgorithmBenchmarks,
  verifyEducationalHash,
} from '../engines/hashEngine';

const router = Router();

router.get('/algorithms', authenticate, (_req: Request, res: Response): void => {
  res.json({ algorithms: SUPPORTED_ALGORITHMS });
});

router.get('/samples', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const samples = await prisma.hashSample.findMany({
      orderBy: { created_at: 'desc' },
      include: { dataset: { select: { dataset_name: true, category: true } } },
    });
    res.json({ samples });
  } catch (err) {
    console.error('Get hash samples error:', err);
    res.status(500).json({ error: 'Failed to load preloaded synthetic hash samples.' });
  }
});

router.post('/analyze', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sample_hash, algorithm, salt, assessment_id, assessment_name } = req.body;
    if (!sample_hash || typeof sample_hash !== 'string') {
      res.status(400).json({ error: 'A sample password hash string is required for analysis.' });
      return;
    }

    const analysis = identifyAndAnalyzeHash(sample_hash, algorithm, salt);

    let targetAssessmentId = assessment_id as string | undefined;
    if (!targetAssessmentId) {
      const riskClass =
        analysis.security_rating >= 90
          ? 'Excellent'
          : analysis.security_rating >= 75
          ? 'Good'
          : analysis.security_rating >= 60
          ? 'Moderate'
          : analysis.security_rating >= 40
          ? 'Poor'
          : 'Critical';

      const created = await prisma.assessment.create({
        data: {
          user_id: req.user!.id,
          assessment_name: assessment_name || `Hash Analysis (${analysis.selected_algorithm})`,
          description: `Analyzed ${analysis.selected_algorithm} sample hash format, salt status, and work factor.`,
          assessment_type: 'Hash Analysis',
          status: 'COMPLETED',
          overall_score: analysis.security_rating,
          risk_classification: riskClass,
          score_type: 'Measured',
          completed_at: new Date(),
        },
      });
      targetAssessmentId = created.id;
    }

    const saved = await prisma.hashAnalysis.create({
      data: {
        assessment_id: targetAssessmentId,
        sample_hash_preview: analysis.sample_hash_preview,
        algorithm: analysis.selected_algorithm,
        hash_category: analysis.hash_category,
        hash_format_valid: analysis.hash_format_valid,
        salt_status: analysis.salt_status,
        work_factor: analysis.work_factor,
        memory_cost: analysis.memory_cost,
        suitability: analysis.suitability,
        audit_status: analysis.hash_format_valid ? 'VALID_FORMAT' : 'FORMAT_MISMATCH',
        execution_time: analysis.execution_time_ms,
        weaknesses: JSON.stringify(analysis.weaknesses),
        recommendations: JSON.stringify(analysis.recommendations),
      },
    });

    if (analysis.is_unsuitable_for_passwords) {
      const finding = await prisma.securityFinding.create({
        data: {
          assessment_id: targetAssessmentId,
          finding_title: `Unsuitable Password Hashing Algorithm Detected (${analysis.selected_algorithm})`,
          description: analysis.weaknesses.join(' '),
          severity: analysis.selected_algorithm === 'SHA-256' ? 'High' : 'Critical',
          impact: 'Allows rapid offline GPU cracking and rainbow-table lookups if unsalted.',
          category: 'Hash Analysis',
        },
      });

      await prisma.recommendation.create({
        data: {
          finding_id: finding.id,
          recommendation: analysis.recommendations.join(' '),
          priority: 'Immediate',
          implementation_details: 'Migrate password hashes to Argon2id (m=65536 KB, t=3, p=4) with unique 128-bit salts.',
          code_snippet: `const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });`,
        },
      });
    }

    await logAudit({
      userId: req.user!.id,
      activityType: 'HASH_FORMAT_ANALYSIS',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        algorithm: analysis.selected_algorithm,
        valid_format: analysis.hash_format_valid,
        salt_status: analysis.salt_status,
        suitability: analysis.suitability,
      },
    });

    res.status(201).json({
      id: saved.id,
      assessment_id: targetAssessmentId,
      analysis,
    });
  } catch (err) {
    console.error('Hash analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze hash format.' });
  }
});

router.post('/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate, sample_hash, algorithm, salt } = req.body;
    if (!candidate || !sample_hash || !algorithm) {
      res.status(400).json({ error: 'Candidate string, sample hash, and algorithm are required.' });
      return;
    }

    const result = await verifyEducationalHash(String(candidate), String(sample_hash), String(algorithm), salt);

    await logAudit({
      userId: req.user!.id,
      activityType: 'HASH_VERIFICATION_DEMO',
      status: 'SUCCESS',
      metadata: {
        algorithm,
        verified: result.verified,
        execution_time_ms: result.execution_time_ms,
      },
    });

    res.json(result);
  } catch (err) {
    console.error('Hash verify error:', err);
    res.status(500).json({ error: 'Failed to execute hash verification.' });
  }
});

router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { synthetic_input, algorithm, salt, use_random_salt, bcrypt_cost, argon2_memory_kb, argon2_time_cost, pbkdf2_iterations } =
      req.body;
    if (!synthetic_input || !algorithm) {
      res.status(400).json({ error: 'Synthetic input and target algorithm are required.' });
      return;
    }

    const generated = await generateEducationalHash(String(synthetic_input), String(algorithm), {
      salt,
      useRandomSalt: Boolean(use_random_salt),
      bcryptCost: bcrypt_cost ? Number(bcrypt_cost) : undefined,
      argon2MemoryKb: argon2_memory_kb ? Number(argon2_memory_kb) : undefined,
      argon2TimeCost: argon2_time_cost ? Number(argon2_time_cost) : undefined,
      pbkdf2Iterations: pbkdf2_iterations ? Number(pbkdf2_iterations) : undefined,
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'SYNTHETIC_HASH_GENERATED',
      status: 'SUCCESS',
      metadata: {
        algorithm: generated.algorithm,
        execution_time_ms: generated.execution_time_ms,
        salted: Boolean(generated.salt),
      },
    });

    res.json(generated);
  } catch (err) {
    console.error('Hash generate error:', err);
    res.status(500).json({ error: 'Failed to generate synthetic hash.' });
  }
});

router.post('/salted-compare', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { synthetic_input } = req.body;
    const result = await demonstrateSalting(String(synthetic_input || 'SyntheticLabPassword#2026'));
    res.json(result);
  } catch (err) {
    console.error('Salted compare error:', err);
    res.status(500).json({ error: 'Failed to run salted vs unsalted demonstration.' });
  }
});

router.get('/history', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const analyses = await prisma.hashAnalysis.findMany({
      orderBy: { created_at: 'desc' },
      take: 40,
      include: { assessment: { select: { assessment_name: true } } },
    });

    res.json({
      history: analyses.map((a) => ({
        ...a,
        assessment_name: a.assessment.assessment_name,
        weaknesses: JSON.parse(a.weaknesses || '[]'),
        recommendations: JSON.parse(a.recommendations || '[]'),
      })),
    });
  } catch (err) {
    console.error('Hash history error:', err);
    res.status(500).json({ error: 'Failed to load hash analysis history.' });
  }
});

router.post('/benchmark', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { algorithms, bcrypt_cost, argon2_memory_kb, argon2_time_cost, pbkdf2_iterations, assessment_id } = req.body;

    const results = await runAlgorithmBenchmarks({
      algorithms: Array.isArray(algorithms) ? algorithms : undefined,
      bcryptCost: bcrypt_cost ? Number(bcrypt_cost) : 10,
      argon2MemoryKb: argon2_memory_kb ? Number(argon2_memory_kb) : 65536,
      argon2TimeCost: argon2_time_cost ? Number(argon2_time_cost) : 3,
      pbkdf2Iterations: pbkdf2_iterations ? Number(pbkdf2_iterations) : 150000,
    });

    let targetAssessmentId = assessment_id as string | undefined;
    if (!targetAssessmentId) {
      const avgRating =
        results.reduce((acc, cur) => acc + cur.security_rating, 0) / Math.max(1, results.length);
      const created = await prisma.assessment.create({
        data: {
          user_id: req.user!.id,
          assessment_name: `Algorithm Benchmark Suite (${results.map((r) => r.algorithm).join(', ')})`,
          description: 'Controlled performance, CPU timing, and memory usage comparison across password hashing schemes.',
          assessment_type: 'Algorithm Comparison',
          status: 'COMPLETED',
          overall_score: Number(avgRating.toFixed(1)),
          risk_classification: avgRating >= 75 ? 'Good' : 'Moderate',
          score_type: 'Measured',
          completed_at: new Date(),
        },
      });
      targetAssessmentId = created.id;
    }

    const savedRecords = [];
    for (const r of results) {
      const rec = await prisma.algorithmBenchmark.create({
        data: {
          assessment_id: targetAssessmentId,
          algorithm: r.algorithm,
          execution_time: r.execution_time,
          memory_usage: r.memory_usage,
          configuration: JSON.stringify(r.configuration),
          salt_support: r.salt_support,
          suitability: r.suitability,
          security_rating: r.security_rating,
          resistance: r.resistance,
        },
      });
      savedRecords.push(rec);
    }

    await logAudit({
      userId: req.user!.id,
      activityType: 'ALGORITHM_BENCHMARK_EXECUTED',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        algorithms_tested: results.map((r) => r.algorithm),
        argon2_memory_kb: argon2_memory_kb || 65536,
      },
    });

    res.status(201).json({
      assessment_id: targetAssessmentId,
      benchmarks: results,
      records: savedRecords,
    });
  } catch (err) {
    console.error('Benchmark error:', err);
    res.status(500).json({ error: 'Failed to execute algorithm benchmarks.' });
  }
});

router.get('/benchmarks', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await prisma.algorithmBenchmark.findMany({
      orderBy: { created_at: 'desc' },
      take: 36,
    });
    res.json({
      benchmarks: records.map((r) => ({
        ...r,
        configuration: JSON.parse(r.configuration || '{}'),
      })),
    });
  } catch (err) {
    console.error('Get benchmarks error:', err);
    res.status(500).json({ error: 'Failed to fetch benchmark history.' });
  }
});

router.get('/benchmark/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await prisma.algorithmBenchmark.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!record) {
      res.status(404).json({ error: 'Benchmark record not found.' });
      return;
    }
    res.json({
      ...record,
      configuration: JSON.parse(record.configuration || '{}'),
    });
  } catch (err) {
    console.error('Get benchmark by id error:', err);
    res.status(500).json({ error: 'Failed to load benchmark details.' });
  }
});

export default router;

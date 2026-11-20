import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

async function buildDashboardPayload(req: Request) {
  const daysParam = req.query.days as string | undefined;
  const categoryParam = req.query.category as string | undefined;

  const dateFilter: { gte?: Date } = {};
  if (daysParam && daysParam !== 'all') {
    const days = parseInt(daysParam, 10);
    if (!isNaN(days) && days > 0) {
      dateFilter.gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
  }

  const assessmentWhere: Record<string, unknown> = {};
  if (dateFilter.gte) {
    assessmentWhere.created_at = dateFilter;
  }
  if (categoryParam && categoryParam !== 'ALL') {
    assessmentWhere.assessment_type = categoryParam;
  }

  const [
    assessments,
    passwordTests,
    hashAnalyses,
    benchmarks,
    storageAssessments,
    findings,
    reportsCount,
    auditLogs,
    labJobs,
  ] = await Promise.all([
    prisma.assessment.findMany({
      where: assessmentWhere,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { full_name: true, email: true } } },
    }),
    prisma.passwordTest.findMany({
      where: dateFilter.gte ? { created_at: dateFilter } : undefined,
      orderBy: { created_at: 'desc' },
    }),
    prisma.hashAnalysis.findMany({
      where: dateFilter.gte ? { created_at: dateFilter } : undefined,
      orderBy: { created_at: 'desc' },
    }),
    prisma.algorithmBenchmark.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
    }),
    prisma.storageAssessment.findMany({
      where: dateFilter.gte ? { created_at: dateFilter } : undefined,
      orderBy: { created_at: 'desc' },
    }),
    prisma.securityFinding.findMany({
      where: dateFilter.gte ? { created_at: dateFilter } : undefined,
      orderBy: { created_at: 'desc' },
    }),
    prisma.report.count(),
    prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
      include: { user: { select: { full_name: true, email: true } } },
    }),
    prisma.laboratoryJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 15,
    }),
  ]);

  // 1. Password strength distribution pie chart
  const strengthOrder = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
  const strengthColors: Record<string, string> = {
    'Very Weak': '#EF4444',
    Weak: '#F97316',
    Moderate: '#F59E0B',
    Strong: '#3B82F6',
    'Very Strong': '#10B981',
  };
  const strengthCounts: Record<string, number> = {
    'Very Weak': 0,
    Weak: 0,
    Moderate: 0,
    Strong: 0,
    'Very Strong': 0,
  };
  for (const pt of passwordTests) {
    if (strengthCounts[pt.strength_category] !== undefined) {
      strengthCounts[pt.strength_category]++;
    }
  }
  const passwordStrengthDistribution = strengthOrder.map((cat) => ({
    name: cat,
    value: strengthCounts[cat],
    color: strengthColors[cat],
  }));

  // 2. Hashing algorithm comparison bar chart
  const algoMap = new Map<string, { algorithm: string; execution_time: number; memory_usage: number; security_rating: number }>();
  const defaultOrder = ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'];
  for (const b of benchmarks) {
    if (!algoMap.has(b.algorithm)) {
      algoMap.set(b.algorithm, {
        algorithm: b.algorithm,
        execution_time: b.execution_time,
        memory_usage: b.memory_usage,
        security_rating: b.security_rating,
      });
    }
  }
  const algorithmComparisonChart = defaultOrder
    .filter((a) => algoMap.has(a))
    .map((a) => algoMap.get(a)!);

  // 3. Security risk distribution chart
  const riskLevels = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
  const riskColors: Record<string, string> = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#3B82F6',
    Informational: '#10B981',
  };
  const riskCounts: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0,
  };
  for (const f of findings) {
    if (riskCounts[f.severity] !== undefined) {
      riskCounts[f.severity]++;
    }
  }
  const riskDistributionChart = riskLevels.map((sev) => ({
    severity: sev,
    count: riskCounts[sev],
    color: riskColors[sev],
  }));

  // 4. Assessment score trend chart
  const scoreTrendChart = assessments
    .slice(0, 12)
    .reverse()
    .map((a, idx) => ({
      index: idx + 1,
      name: a.assessment_name.length > 20 ? `${a.assessment_name.substring(0, 18)}...` : a.assessment_name,
      score: Number(a.overall_score.toFixed(1)),
      type: a.assessment_type,
      classification: a.risk_classification,
      date: a.created_at.toISOString().split('T')[0],
    }));

  const avgScore =
    assessments.length > 0
      ? Number(
          (
            assessments.reduce((acc, cur) => acc + cur.overall_score, 0) /
            assessments.length
          ).toFixed(1)
        )
      : 0;

  const uniqueAlgorithms = new Set<string>();
  hashAnalyses.forEach((h) => uniqueAlgorithms.add(h.algorithm));
  benchmarks.forEach((b) => uniqueAlgorithms.add(b.algorithm));
  storageAssessments.forEach((s) => uniqueAlgorithms.add(s.algorithm));

  const nonInfoWeaknesses = findings.filter((f) => f.severity !== 'Informational').length;
  const criticalAndHighCount = riskCounts.Critical + riskCounts.High;

  return {
    statistics: {
      total_assessments: assessments.length,
      total_password_tests: passwordTests.length,
      total_hashes_analysed: hashAnalyses.length,
      algorithms_evaluated_count: uniqueAlgorithms.size || 6,
      algorithms_evaluated: Array.from(uniqueAlgorithms),
      security_weaknesses_identified: nonInfoWeaknesses,
      critical_and_high_findings: criticalAndHighCount,
      critical_findings: riskCounts.Critical,
      high_findings: riskCounts.High,
      average_security_score: avgScore,
      generated_reports: reportsCount,
      laboratory_jobs_run: labJobs.length,
    },
    charts: {
      password_strength_distribution: passwordStrengthDistribution,
      algorithm_comparison: algorithmComparisonChart,
      security_risk_distribution: riskDistributionChart,
      assessment_score_trend: scoreTrendChart,
    },
    recent_assessments: assessments.slice(0, 8),
    recent_activities: auditLogs.map((log) => ({
      id: log.id,
      activity_type: log.activity_type,
      status: log.status,
      user_name: log.user.full_name,
      metadata: (() => {
        try {
          return JSON.parse(log.metadata);
        } catch {
          return {};
        }
      })(),
      created_at: log.created_at,
    })),
  };
}

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await buildDashboardPayload(req);
    res.json(payload);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard telemetry.' });
  }
});

router.get('/statistics', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await buildDashboardPayload(req);
    res.json({ statistics: payload.statistics, charts: payload.charts });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

router.get('/activity', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await buildDashboardPayload(req);
    res.json({ recent_activities: payload.recent_activities, recent_assessments: payload.recent_assessments });
  } catch (err) {
    console.error('Dashboard activity error:', err);
    res.status(500).json({ error: 'Failed to load laboratory activity timeline.' });
  }
});

export default router;

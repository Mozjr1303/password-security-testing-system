import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';
import { evaluatePasswordStrength } from '../engines/passwordEngine';

const router = Router();

router.post('/test', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, assessment_id, assessment_name, save_to_history = true } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'A synthetic test password string is required.' });
      return;
    }

    // Load any custom local educational dictionary words
    const wordlists = await prisma.dataset.findMany({
      where: { dataset_type: 'EDUCATIONAL_WORDLIST' },
      select: { content_json: true },
    });
    const extraWords: string[] = [];
    for (const wl of wordlists) {
      try {
        const parsed = JSON.parse(wl.content_json);
        if (Array.isArray(parsed)) extraWords.push(...parsed.map(String));
      } catch {
        // ignore
      }
    }

    const evaluation = evaluatePasswordStrength(password, extraWords);

    if (!save_to_history) {
      res.json({ evaluation, persisted: false });
      return;
    }

    let targetAssessmentId = assessment_id as string | undefined;
    if (!targetAssessmentId) {
      const riskMap: Record<string, string> = {
        'Very Strong': 'Excellent',
        Strong: 'Good',
        Moderate: 'Moderate',
        Weak: 'Poor',
        'Very Weak': 'Critical',
      };
      const createdAssessment = await prisma.assessment.create({
        data: {
          user_id: req.user!.id,
          assessment_name:
            assessment_name ||
            `Password Strength Audit (${evaluation.strength_category} - ${evaluation.password_length} chars)`,
          description: 'Evaluated synthetic password entropy, character diversity, and pattern resistance.',
          assessment_type: 'Password Strength',
          status: 'COMPLETED',
          overall_score: evaluation.overall_score,
          risk_classification: riskMap[evaluation.strength_category] || 'Moderate',
          score_type: 'Measured',
          completed_at: new Date(),
        },
      });
      targetAssessmentId = createdAssessment.id;
    }

    // Store evaluation WITHOUT storing the plaintext password
    const savedTest = await prisma.passwordTest.create({
      data: {
        assessment_id: targetAssessmentId,
        password_length: evaluation.password_length,
        length_score: evaluation.length_score,
        complexity_score: evaluation.complexity_score,
        entropy_estimate: evaluation.entropy_estimate,
        strength_category: evaluation.strength_category,
        overall_score: evaluation.overall_score,
        estimated_crack_time: evaluation.estimated_crack_time,
        character_sets: JSON.stringify(evaluation.character_sets),
        pattern_findings: JSON.stringify(evaluation.pattern_findings),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        recommendations: JSON.stringify(evaluation.recommendations),
      },
    });

    // Generate findings & recommendations if password is Weak or Very Weak
    if (evaluation.overall_score < 65 && evaluation.weaknesses.length > 0) {
      const severity =
        evaluation.overall_score < 20
          ? 'Critical'
          : evaluation.overall_score < 40
          ? 'High'
          : 'Medium';
      const finding = await prisma.securityFinding.create({
        data: {
          assessment_id: targetAssessmentId,
          finding_title: `Weak Synthetic Password Pattern (${evaluation.strength_category})`,
          description: evaluation.weaknesses.join(' '),
          severity,
          impact: `Effective entropy is only ${evaluation.entropy_estimate} bits (estimated fast-hash offline recovery: ${evaluation.estimated_crack_time}).`,
          category: 'Password Strength',
        },
      });

      await prisma.recommendation.create({
        data: {
          finding_id: finding.id,
          recommendation: evaluation.recommendations.join(' '),
          priority: severity === 'Critical' ? 'Immediate' : 'High',
          implementation_details:
            'Enforce NIST SP 800-63B minimum length (12–16 characters), screen against local synthetic breach wordlists, and reject predictable leetspeak substitutions.',
          code_snippet: `// Reject passwords with effective entropy < 50 bits or dictionary matches
const result = evaluatePasswordStrength(candidate);
if (result.overall_score < 65 || result.breach_indicator) {
  return res.status(400).json({ weaknesses: result.weaknesses });
}`,
        },
      });
    }

    await logAudit({
      userId: req.user!.id,
      activityType: 'PASSWORD_STRENGTH_ASSESSMENT',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        password_length: evaluation.password_length,
        entropy_bits: evaluation.entropy_estimate,
        strength_category: evaluation.strength_category,
        score: evaluation.overall_score,
        plaintext_stored: false,
      },
    });

    res.status(201).json({
      id: savedTest.id,
      assessment_id: targetAssessmentId,
      evaluation,
      persisted: true,
    });
  } catch (err) {
    console.error('Password test error:', err);
    res.status(500).json({ error: 'Failed to evaluate password strength.' });
  }
});

router.get('/history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tests = await prisma.passwordTest.findMany({
      orderBy: { created_at: 'desc' },
      take: 40,
      include: {
        assessment: {
          select: { id: true, assessment_name: true, user_id: true },
        },
      },
    });

    const formatted = tests.map((t) => ({
      id: t.id,
      assessment_id: t.assessment_id,
      assessment_name: t.assessment.assessment_name,
      password_length: t.password_length,
      length_score: t.length_score,
      complexity_score: t.complexity_score,
      entropy_estimate: t.entropy_estimate,
      strength_category: t.strength_category,
      overall_score: t.overall_score,
      estimated_crack_time: t.estimated_crack_time,
      character_sets: JSON.parse(t.character_sets || '{}'),
      pattern_findings: JSON.parse(t.pattern_findings || '[]'),
      weaknesses: JSON.parse(t.weaknesses || '[]'),
      recommendations: JSON.parse(t.recommendations || '[]'),
      created_at: t.created_at,
    }));

    res.json({ history: formatted });
  } catch (err) {
    console.error('Password history error:', err);
    res.status(500).json({ error: 'Failed to fetch password test history.' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const test = await prisma.passwordTest.findUnique({
      where: { id: String(req.params.id) },
      include: { assessment: true },
    });

    if (!test) {
      res.status(404).json({ error: 'Password test record not found.' });
      return;
    }

    res.json({
      id: test.id,
      assessment_id: test.assessment_id,
      password_length: test.password_length,
      length_score: test.length_score,
      complexity_score: test.complexity_score,
      entropy_estimate: test.entropy_estimate,
      strength_category: test.strength_category,
      overall_score: test.overall_score,
      estimated_crack_time: test.estimated_crack_time,
      character_sets: JSON.parse(test.character_sets || '{}'),
      pattern_findings: JSON.parse(test.pattern_findings || '[]'),
      weaknesses: JSON.parse(test.weaknesses || '[]'),
      recommendations: JSON.parse(test.recommendations || '[]'),
      created_at: test.created_at,
    });
  } catch (err) {
    console.error('Get password test error:', err);
    res.status(500).json({ error: 'Failed to load password test details.' });
  }
});

export default router;

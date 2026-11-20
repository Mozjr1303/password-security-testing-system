import PDFDocument from 'pdfkit';
import { prisma } from '../db';

export interface StructuredAssessmentReport {
  report_id_number: string;
  assessment_id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_date: string;
  researcher_info: {
    full_name: string;
    email: string;
    role: string;
  };
  assessment_objectives: string[];
  testing_methodology: string[];
  algorithms_evaluated: string[];
  password_strength_results: Array<{
    length: number;
    entropy_bits: number;
    strength_category: string;
    score: number;
    estimated_crack_time: string;
    patterns: string[];
    weaknesses: string[];
  }>;
  hash_analysis_results: Array<{
    algorithm: string;
    category: string;
    format_valid: boolean;
    salt_status: string;
    work_factor: string;
    memory_cost: string;
    suitability: string;
    execution_time_ms: number;
  }>;
  password_storage_weaknesses: string[];
  authentication_weaknesses: string[];
  risk_classifications: {
    overall_classification: string;
    score_type: string;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    informational_count: number;
    findings: Array<{
      title: string;
      severity: string;
      category: string;
      description: string;
      impact: string;
    }>;
  };
  security_recommendations: Array<{
    finding_title: string;
    severity: string;
    recommendation: string;
    priority: string;
    implementation_details: string;
  }>;
  overall_security_score: number;
  conclusion: string;
}

export async function compileAssessmentReportPayload(
  assessmentId: string,
  reportNumber?: string
): Promise<StructuredAssessmentReport> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      user: { include: { role: true } },
      password_tests: true,
      hash_analyses: true,
      benchmarks: true,
      storage_assessments: true,
      security_findings: { include: { recommendations: true } },
      laboratory_jobs: true,
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  const rptNum =
    reportNumber ||
    `PSTS-RPT-${new Date().getFullYear()}-${assessment.id.substring(0, 6).toUpperCase()}`;

  const algoSet = new Set<string>();
  assessment.hash_analyses.forEach((h) => algoSet.add(h.algorithm));
  assessment.benchmarks.forEach((b) => algoSet.add(b.algorithm));
  assessment.storage_assessments.forEach((s) => algoSet.add(s.algorithm));
  assessment.laboratory_jobs.forEach((j) => algoSet.add(j.target_algorithm));
  if (algoSet.size === 0) {
    ['Argon2id', 'bcrypt', 'PBKDF2', 'SHA-256'].forEach((a) => algoSet.add(a));
  }

  const safeParseArray = (jsonStr: string): string[] => {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const pwResults = assessment.password_tests.map((pt) => ({
    length: pt.password_length,
    entropy_bits: pt.entropy_estimate,
    strength_category: pt.strength_category,
    score: pt.overall_score,
    estimated_crack_time: pt.estimated_crack_time,
    patterns: safeParseArray(pt.pattern_findings),
    weaknesses: safeParseArray(pt.weaknesses),
  }));

  const hashResults = assessment.hash_analyses.map((ha) => ({
    algorithm: ha.algorithm,
    category: ha.hash_category,
    format_valid: ha.hash_format_valid,
    salt_status: ha.salt_status,
    work_factor: ha.work_factor,
    memory_cost: ha.memory_cost,
    suitability: ha.suitability,
    execution_time_ms: ha.execution_time,
  }));

  const storageWeaknesses: string[] = [];
  const authWeaknesses: string[] = [];

  for (const sf of assessment.security_findings) {
    if (sf.severity === 'Informational') continue;
    if (sf.category.toLowerCase().includes('auth') || sf.category.toLowerCase().includes('reset')) {
      authWeaknesses.push(`${sf.finding_title}: ${sf.description}`);
    } else {
      storageWeaknesses.push(`${sf.finding_title}: ${sf.description}`);
    }
  }

  for (const sa of assessment.storage_assessments) {
    if (!sa.mfa_enabled) {
      authWeaknesses.push('Multi-Factor Authentication (MFA) is not enabled on evaluated configuration.');
    }
    if (!sa.rate_limiting) {
      authWeaknesses.push('Login rate limiting / brute-force throttling is disabled.');
    }
    if (!sa.salt_uniqueness) {
      storageWeaknesses.push(`Missing unique per-user cryptographic salts for ${sa.algorithm}.`);
    }
  }

  if (storageWeaknesses.length === 0) {
    storageWeaknesses.push('No critical password storage weaknesses detected in evaluated configuration.');
  }
  if (authWeaknesses.length === 0) {
    authWeaknesses.push('No major authentication control weaknesses detected in evaluated configuration.');
  }

  const findingsList = assessment.security_findings.map((f) => ({
    title: f.finding_title,
    severity: f.severity,
    category: f.category,
    description: f.description,
    impact: f.impact,
  }));

  const recsList: StructuredAssessmentReport['security_recommendations'] = [];
  for (const f of assessment.security_findings) {
    for (const r of f.recommendations) {
      recsList.push({
        finding_title: f.finding_title,
        severity: f.severity,
        recommendation: r.recommendation,
        priority: r.priority,
        implementation_details: r.implementation_details,
      });
    }
  }

  if (recsList.length === 0) {
    recsList.push({
      finding_title: 'Password Storage & Authentication Baseline',
      severity: 'Informational',
      recommendation: 'Standardize on Argon2id (64 MB memory, t=3, p=4) with unique 128-bit salts, MFA, and login rate limiting.',
      priority: 'Medium',
      implementation_details: 'Enforce NIST SP 800-63B and OWASP Password Storage Cheat Sheet parameters.',
    });
  }

  const countBySev = (sev: string) =>
    findingsList.filter((f) => f.severity.toLowerCase() === sev.toLowerCase()).length;

  const score = Number(assessment.overall_score.toFixed(1));
  const classification = assessment.risk_classification;

  return {
    report_id_number: rptNum,
    assessment_id: assessment.id,
    assessment_name: assessment.assessment_name,
    assessment_type: assessment.assessment_type,
    assessment_date: assessment.created_at.toISOString(),
    researcher_info: {
      full_name: assessment.user.full_name,
      email: assessment.user.email,
      role: assessment.user.role.role_name,
    },
    assessment_objectives: [
      'Evaluate synthetic password strength, bit entropy, and susceptibility to pattern/dictionary guessing.',
      'Validate cryptographic hash formats and compare fast general-purpose digests against memory-hard adaptive schemes.',
      'Assess password storage parameters (algorithm, salt uniqueness, memory/time work factors) and authentication controls.',
      'Provide prioritized, actionable remediation guidance without retaining any plaintext credentials.',
    ],
    testing_methodology: [
      '10-Step Structured PSTS Laboratory Methodology (SRS Section 8 & Section 9 Weighted Scoring).',
      'Shannon & effective pool entropy modeling with leetspeak/dictionary normalization.',
      'PHC & Modular Crypt format inspection and controlled synthetic dictionary/brute-force auditing.',
      'Weighted 5-category evaluation (25% Password Strength, 25% Algorithm Suitability, 20% Salt/Config, 20% Auth Controls, 10% Reset Security) with Critical-weakness override.',
    ],
    algorithms_evaluated: Array.from(algoSet),
    password_strength_results: pwResults,
    hash_analysis_results: hashResults,
    password_storage_weaknesses: Array.from(new Set(storageWeaknesses)),
    authentication_weaknesses: Array.from(new Set(authWeaknesses)),
    risk_classifications: {
      overall_classification: classification,
      score_type: assessment.score_type,
      critical_count: countBySev('Critical'),
      high_count: countBySev('High'),
      medium_count: countBySev('Medium'),
      low_count: countBySev('Low'),
      informational_count: countBySev('Informational'),
      findings: findingsList,
    },
    security_recommendations: recsList,
    overall_security_score: score,
    conclusion: `This Password Security Assessment ("${assessment.assessment_name}") achieved an overall ${assessment.score_type.toLowerCase()} security score of ${score}/100 (${classification} classification). ${
      countBySev('Critical') + countBySev('High') > 0
        ? `Immediate remediation is required to address ${countBySev('Critical')} Critical and ${countBySev('High')} High severity findings—specifically migrating away from fast/legacy hashes to Argon2id with unique 128-bit salts and enforcing login rate limiting & MFA.`
        : 'The evaluated configuration demonstrates strong adherence to modern OWASP and NIST password storage standards.'
    } No plaintext passwords or sensitive credentials were stored or exposed during this assessment.`,
  };
}

export function generatePdfBuffer(report: StructuredAssessmentReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(0, 0, doc.page.width, 95).fill('#0B1120');
      doc.fillColor('#38BDF8').fontSize(10).text('PASSWORD SECURITY TESTING AND ASSESSMENT SYSTEM (PSTS)', 45, 24);
      doc.fillColor('#FFFFFF').fontSize(18).text('PASSWORD SECURITY ASSESSMENT REPORT', 45, 42);
      doc
        .fillColor('#94A3B8')
        .fontSize(9)
        .text(`1. Report ID: ${report.report_id_number}   |   2. Date: ${new Date(report.assessment_date).toUTCString()}`, 45, 68);

      doc.y = 115;

      const sectionTitle = (num: number, title: string) => {
        if (doc.y > 710) doc.addPage();
        doc.moveDown(0.6);
        doc.fillColor('#0F172A').fontSize(12).text(`${num}. ${title.toUpperCase()}`, { underline: false });
        doc.moveTo(45, doc.y + 2).lineTo(550, doc.y + 2).strokeColor('#3B82F6').lineWidth(1).stroke();
        doc.moveDown(0.5);
      };

      // 3. Researcher Info & 13. Overall Score Summary Box
      sectionTitle(3, 'Researcher Information & Assessment Metadata');
      doc.fillColor('#1E293B').fontSize(10);
      doc.text(`Assessment Name: ${report.assessment_name} (${report.assessment_type})`);
      doc.text(`Researcher: ${report.researcher_info.full_name} <${report.researcher_info.email}>`);
      doc.text(`Assigned Role: ${report.researcher_info.role}`);
      doc.text(
        `13. Overall Security Score: ${report.overall_security_score} / 100 (${report.risk_classifications.overall_classification} - ${report.risk_classifications.score_type})`
      );

      // 4. Assessment Objectives
      sectionTitle(4, 'Assessment Objectives');
      report.assessment_objectives.forEach((obj) => {
        doc.fillColor('#334155').fontSize(9.5).text(`• ${obj}`, { indent: 10 });
      });

      // 5. Testing Methodology
      sectionTitle(5, 'Testing Methodology');
      report.testing_methodology.forEach((m) => {
        doc.fillColor('#334155').fontSize(9.5).text(`• ${m}`, { indent: 10 });
      });

      // 6. Algorithms Evaluated
      sectionTitle(6, 'Algorithms Evaluated');
      doc.fillColor('#1E293B').fontSize(10).text(report.algorithms_evaluated.join('   |   '));

      // 7. Password Strength Results
      sectionTitle(7, 'Password Strength Results (Zero-Plaintext Policy)');
      if (report.password_strength_results.length === 0) {
        doc.fillColor('#64748B').fontSize(9.5).text('No synthetic password strength tests recorded in this assessment.');
      } else {
        report.password_strength_results.forEach((pt, idx) => {
          doc
            .fillColor('#0F172A')
            .fontSize(10)
            .text(
              `Sample #${idx + 1}: Score ${pt.score}/100 [${pt.strength_category}] | Length: ${pt.length} chars | Effective Entropy: ${pt.entropy_bits} bits | Est. Fast-Hash Crack Time: ${pt.estimated_crack_time}`
            );
          if (pt.weaknesses.length > 0) {
            doc.fillColor('#B91C1C').fontSize(9).text(`   Weaknesses: ${pt.weaknesses.join('; ')}`);
          }
          doc.moveDown(0.3);
        });
      }

      // 8. Hash Analysis Results
      sectionTitle(8, 'Hash Analysis Results');
      if (report.hash_analysis_results.length === 0) {
        doc.fillColor('#64748B').fontSize(9.5).text('No sample hash analyses recorded in this assessment.');
      } else {
        report.hash_analysis_results.forEach((ha, idx) => {
          doc
            .fillColor('#0F172A')
            .fontSize(9.5)
            .text(
              `Analysis #${idx + 1}: ${ha.algorithm} (${ha.category}) | Salt: ${ha.salt_status} | Work Factor: ${ha.work_factor} | Memory: ${ha.memory_cost} | Suitability: ${ha.suitability}`
            );
          doc.moveDown(0.2);
        });
      }

      // 9. Password Storage Weaknesses
      sectionTitle(9, 'Password Storage Weaknesses');
      report.password_storage_weaknesses.forEach((w) => {
        doc.fillColor('#334155').fontSize(9.5).text(`• ${w}`, { indent: 10 });
      });

      // 10. Authentication Weaknesses
      sectionTitle(10, 'Authentication Weaknesses');
      report.authentication_weaknesses.forEach((w) => {
        doc.fillColor('#334155').fontSize(9.5).text(`• ${w}`, { indent: 10 });
      });

      // 11. Risk Classifications
      sectionTitle(11, 'Risk Classifications & Identified Findings');
      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .text(
          `Severity Summary — Critical: ${report.risk_classifications.critical_count} | High: ${report.risk_classifications.high_count} | Medium: ${report.risk_classifications.medium_count} | Low: ${report.risk_classifications.low_count} | Informational: ${report.risk_classifications.informational_count}`
        );
      doc.moveDown(0.4);
      report.risk_classifications.findings.forEach((f) => {
        if (doc.y > 720) doc.addPage();
        doc.fillColor('#0F172A').fontSize(9.5).text(`[${f.severity.toUpperCase()}] ${f.title} (${f.category})`);
        doc.fillColor('#475569').fontSize(9).text(`   ${f.description} Impact: ${f.impact}`);
        doc.moveDown(0.25);
      });

      // 12. Security Recommendations
      sectionTitle(12, 'Automated Security Recommendations');
      report.security_recommendations.forEach((rec, idx) => {
        if (doc.y > 710) doc.addPage();
        doc
          .fillColor('#0F172A')
          .fontSize(9.5)
          .text(`${idx + 1}. [${rec.priority} Priority] ${rec.recommendation} (Addresses: ${rec.finding_title})`);
        doc.fillColor('#475569').fontSize(9).text(`   Guidance: ${rec.implementation_details}`);
        doc.moveDown(0.25);
      });

      // 14. Conclusion
      sectionTitle(14, 'Conclusion & Confidentiality Attestation');
      doc.fillColor('#1E293B').fontSize(9.5).text(report.conclusion);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateCsvContent(report: StructuredAssessmentReport): string {
  const escapeCsv = (val: unknown): string => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[][] = [
    ['Section', 'Field / Category', 'Title / Metric', 'Severity / Value', 'Details / Recommendation'],
    ['1. Report ID', 'Report Number', report.report_id_number, report.assessment_type, report.assessment_name],
    ['2. Assessment Date', 'Timestamp', report.assessment_date, 'Status', 'COMPLETED'],
    ['3. Researcher', report.researcher_info.role, report.researcher_info.full_name, report.researcher_info.email, 'Authorised PSTS Lab User'],
    ['6. Algorithms', 'Evaluated', report.algorithms_evaluated.join('; '), 'Count', String(report.algorithms_evaluated.length)],
    [
      '13. Overall Score',
      report.risk_classifications.score_type,
      String(report.overall_security_score),
      report.risk_classifications.overall_classification,
      report.conclusion,
    ],
  ];

  report.password_strength_results.forEach((pt, i) => {
    rows.push([
      '7. Password Strength',
      `Sample #${i + 1} (${pt.length} chars)`,
      `${pt.strength_category} (${pt.score}/100)`,
      `${pt.entropy_bits} bits entropy`,
      pt.weaknesses.join('; ') || 'No major weaknesses',
    ]);
  });

  report.hash_analysis_results.forEach((ha, i) => {
    rows.push([
      '8. Hash Analysis',
      `Hash #${i + 1}: ${ha.algorithm}`,
      ha.category,
      ha.suitability,
      `Salt: ${ha.salt_status} | Work Factor: ${ha.work_factor} | Memory: ${ha.memory_cost}`,
    ]);
  });

  report.password_storage_weaknesses.forEach((w) => {
    rows.push(['9. Storage Weakness', 'Password Storage', 'Identified Weakness', 'High/Critical', w]);
  });

  report.authentication_weaknesses.forEach((w) => {
    rows.push(['10. Auth Weakness', 'Authentication Controls', 'Identified Weakness', 'Medium/High', w]);
  });

  report.risk_classifications.findings.forEach((f) => {
    rows.push(['11. Security Finding', f.category, f.title, f.severity, `${f.description} (Impact: ${f.impact})`]);
  });

  report.security_recommendations.forEach((r) => {
    rows.push(['12. Recommendation', r.finding_title, r.recommendation, `Priority: ${r.priority}`, r.implementation_details]);
  });

  return rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
}

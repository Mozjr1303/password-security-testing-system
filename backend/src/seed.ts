import argon2 from 'argon2';
import { prisma } from './db';
import { evaluatePasswordStrength } from './engines/passwordEngine';
import {
  generateEducationalHash,
  identifyAndAnalyzeHash,
  runAlgorithmBenchmarks,
} from './engines/hashEngine';
import { evaluateStorageConfiguration } from './engines/storageEngine';
import { compileAssessmentReportPayload } from './engines/reportEngine';

export async function ensureSeeded(): Promise<void> {
  const existingRoles = await prisma.role.count();
  if (existingRoles > 0) {
    return;
  }

  console.log('Seeding PSTS Cybersecurity Laboratory database...');

  // 1. Create the 5 SRS target roles
  const rolesData = [
    {
      role_name: 'Administrator',
      permissions: JSON.stringify(['admin', 'manage_users', 'manage_datasets', 'view_audit_logs', 'assess', 'report', 'read']),
    },
    {
      role_name: 'Cybersecurity Student',
      permissions: JSON.stringify(['assess', 'lab_experiments', 'report', 'read']),
    },
    {
      role_name: 'Security Researcher',
      permissions: JSON.stringify(['assess', 'lab_experiments', 'storage_audit', 'report', 'read']),
    },
    {
      role_name: 'Software Developer',
      permissions: JSON.stringify(['assess', 'storage_audit', 'benchmark', 'report', 'read']),
    },
    {
      role_name: 'Lecturer or Supervisor',
      permissions: JSON.stringify(['manage_datasets', 'view_audit_logs', 'assess', 'report', 'read']),
    },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const created = await prisma.role.create({ data: r });
    roleMap[r.role_name] = created.id;
  }

  // 2. Create demo user accounts with Argon2id hashes
  const adminHash = await argon2.hash('Admin#PSTS2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  const studentHash = await argon2.hash('Student#PSTS2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  const researcherHash = await argon2.hash('Researcher#PSTS2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const adminUser = await prisma.user.create({
    data: {
      full_name: 'Dr. Marcus Vance (Lab Administrator)',
      email: 'admin@psts.edu',
      password_hash: adminHash,
      role_id: roleMap['Administrator'],
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      full_name: 'Elena Rostova (Cybersecurity Student)',
      email: 'student@psts.edu',
      password_hash: studentHash,
      role_id: roleMap['Cybersecurity Student'],
    },
  });

  const researcherUser = await prisma.user.create({
    data: {
      full_name: 'Devon Thorne (Security Researcher)',
      email: 'researcher@psts.edu',
      password_hash: researcherHash,
      role_id: roleMap['Security Researcher'],
    },
  });

  await prisma.user.create({
    data: {
      full_name: 'Liam Chen (Software Developer)',
      email: 'developer@psts.edu',
      password_hash: studentHash,
      role_id: roleMap['Software Developer'],
    },
  });

  await prisma.user.create({
    data: {
      full_name: 'Prof. Sarah Jenkins (Supervisor)',
      email: 'lecturer@psts.edu',
      password_hash: adminHash,
      role_id: roleMap['Lecturer or Supervisor'],
    },
  });

  // 3. Create Approved Synthetic Laboratory Datasets
  const wordlistEntries = [
    'password', '123456', 'welcome123', 'admin123', 'qwertyuiop',
    'Dragon!', 'passw0rd', 'p@ssw0rd', 'student2026', 'cybersecurity',
    'letmein', 'sunshine', 'football', 'trustno1', 'university'
  ];

  await prisma.dataset.create({
    data: {
      dataset_name: 'PSTS Core Educational Wordlist v2026',
      description: 'Approved local synthetic dictionary wordlist for controlled password auditing exercises.',
      dataset_type: 'EDUCATIONAL_WORDLIST',
      category: 'Dictionary Auditing',
      record_count: wordlistEntries.length,
      content_json: JSON.stringify(wordlistEntries),
      created_by: adminUser.id,
    },
  });

  const syntheticPasswordEntries = [
    '123456',
    'password123',
    'P@ssw0rd2026',
    'CampusWifi#24',
    'Quantum#Falcon79!Orbit$Nebula',
  ];

  await prisma.dataset.create({
    data: {
      dataset_name: 'Synthetic Tiered Password Benchmark Set',
      description: 'Five-tier synthetic password samples spanning Very Weak to Very Strong classifications.',
      dataset_type: 'SYNTHETIC_PASSWORDS',
      category: 'Strength Evaluation',
      record_count: syntheticPasswordEntries.length,
      content_json: JSON.stringify(syntheticPasswordEntries),
      created_by: adminUser.id,
    },
  });

  const hashDataset = await prisma.dataset.create({
    data: {
      dataset_name: 'Multi-Algorithm Synthetic Hash Corpus',
      description: 'Preloaded synthetic password hashes across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id.',
      dataset_type: 'HASH_SAMPLES',
      category: 'Hash Analysis Lab',
      record_count: 6,
      content_json: JSON.stringify(['welcome123', 'admin123', 'Dragon!', 'student2026', 'letmein', 'Quantum#Falcon79!']),
      created_by: adminUser.id,
    },
  });

  const sampleSpecs = [
    { label: 'Legacy Unsalted MD5 Sample (Synthetic "welcome123")', algo: 'MD5', input: 'welcome123', hint: 'Common dictionary word + 123' },
    { label: 'Legacy Unsalted SHA-1 Sample (Synthetic "admin123")', algo: 'SHA-1', input: 'admin123', hint: 'Default admin pattern' },
    { label: 'Fast SHA-256 Sample (Synthetic "Dragon!")', algo: 'SHA-256', input: 'Dragon!', hint: 'Capitalized dictionary word + !' },
    { label: 'PBKDF2-HMAC-SHA256 Sample (100k iterations)', algo: 'PBKDF2', input: 'student2026', hint: 'Academic synthetic credential' },
    { label: 'bcrypt Adaptive Sample (Cost=10, 128-bit Salt)', algo: 'bcrypt', input: 'letmein', hint: 'Classic dictionary word' },
    { label: 'Argon2id Hardened PHC Sample (64 MB, t=3, p=4)', algo: 'Argon2id', input: 'Quantum#Falcon79!', hint: 'High-entropy synthetic phrase' },
  ];

  for (const sp of sampleSpecs) {
    const gen = await generateEducationalHash(sp.input, sp.algo, {
      useRandomSalt: ['PBKDF2', 'bcrypt', 'Argon2id'].includes(sp.algo),
      bcryptCost: 10,
      argon2MemoryKb: 65536,
      argon2TimeCost: 3,
      pbkdf2Iterations: 100000,
    });

    await prisma.hashSample.create({
      data: {
        dataset_id: hashDataset.id,
        label: sp.label,
        algorithm: gen.algorithm,
        sample_hash: gen.hash,
        salt: gen.salt,
        configuration: JSON.stringify(gen.configuration),
        hint: sp.hint,
      },
    });
  }

  // 4. Create realistic Assessments covering all 5 password strength categories, storage configs, benchmarks, and findings
  // Assessment 1: Legacy Financial Portal Audit (Critical Risk)
  const legacyAssessment = await prisma.assessment.create({
    data: {
      user_id: researcherUser.id,
      assessment_name: 'Legacy Portal Authentication Audit (MD5 Migration)',
      description: 'Comprehensive assessment of legacy unsalted MD5 password storage and missing rate-limiting controls.',
      assessment_type: 'Full Security Assessment',
      status: 'COMPLETED',
      overall_score: 24.5,
      risk_classification: 'Critical',
      score_type: 'Measured',
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Assessment 2: Mid-Tier Web API Assessment (Moderate Risk)
  const moderateAssessment = await prisma.assessment.create({
    data: {
      user_id: studentUser.id,
      assessment_name: 'Campus SSO Storage & Entropy Evaluation',
      description: 'Evaluation of SHA-256 / PBKDF2 transition and synthetic student credential patterns.',
      assessment_type: 'Storage Assessment',
      status: 'COMPLETED',
      overall_score: 68.0,
      risk_classification: 'Moderate',
      score_type: 'Measured',
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Assessment 3: Hardened Argon2id Reference Architecture (Excellent)
  const hardenedAssessment = await prisma.assessment.create({
    data: {
      user_id: adminUser.id,
      assessment_name: 'Argon2id Modern Identity Baseline Verification',
      description: 'Verification of OWASP-compliant Argon2id (64 MB, t=3, p=4) storage with MFA and rate limiting.',
      assessment_type: 'Full Security Assessment',
      status: 'COMPLETED',
      overall_score: 96.5,
      risk_classification: 'Excellent',
      score_type: 'Measured',
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed PasswordTests across all 5 categories (Zero Plaintext Stored!)
  const passwordSamplesToSeed = [
    { pw: '123456', assessmentId: legacyAssessment.id },
    { pw: 'welcome123', assessmentId: legacyAssessment.id },
    { pw: 'P@ssw0rd2026', assessmentId: moderateAssessment.id },
    { pw: 'Solar$Matrix84', assessmentId: moderateAssessment.id },
    { pw: 'Quantum#Falcon79!Orbit$Nebula', assessmentId: hardenedAssessment.id },
  ];

  for (const item of passwordSamplesToSeed) {
    const ev = evaluatePasswordStrength(item.pw);
    await prisma.passwordTest.create({
      data: {
        assessment_id: item.assessmentId,
        password_length: ev.password_length,
        length_score: ev.length_score,
        complexity_score: ev.complexity_score,
        entropy_estimate: ev.entropy_estimate,
        strength_category: ev.strength_category,
        overall_score: ev.overall_score,
        estimated_crack_time: ev.estimated_crack_time,
        character_sets: JSON.stringify(ev.character_sets),
        pattern_findings: JSON.stringify(ev.pattern_findings),
        weaknesses: JSON.stringify(ev.weaknesses),
        recommendations: JSON.stringify(ev.recommendations),
      },
    });
  }

  // Seed HashAnalyses
  const md5SampleHash = (await generateEducationalHash('welcome123', 'MD5')).hash;
  const argonSampleHash = (
    await generateEducationalHash('Quantum#Falcon79!', 'Argon2id', { argon2MemoryKb: 65536, argon2TimeCost: 3 })
  ).hash;

  for (const hItem of [
    { hash: md5SampleHash, algo: 'MD5', assessmentId: legacyAssessment.id },
    { hash: argonSampleHash, algo: 'Argon2id', assessmentId: hardenedAssessment.id },
  ]) {
    const analysis = identifyAndAnalyzeHash(hItem.hash, hItem.algo);
    await prisma.hashAnalysis.create({
      data: {
        assessment_id: hItem.assessmentId,
        sample_hash_preview: analysis.sample_hash_preview,
        algorithm: analysis.selected_algorithm,
        hash_category: analysis.hash_category,
        hash_format_valid: analysis.hash_format_valid,
        salt_status: analysis.salt_status,
        work_factor: analysis.work_factor,
        memory_cost: analysis.memory_cost,
        suitability: analysis.suitability,
        audit_status: 'VALID_FORMAT',
        execution_time: analysis.execution_time_ms,
        weaknesses: JSON.stringify(analysis.weaknesses),
        recommendations: JSON.stringify(analysis.recommendations),
      },
    });
  }

  // Seed AlgorithmBenchmarks for all 6 algorithms
  const initialBenchmarks = await runAlgorithmBenchmarks({
    bcryptCost: 10,
    argon2MemoryKb: 65536,
    argon2TimeCost: 3,
    pbkdf2Iterations: 150000,
  });

  for (const b of initialBenchmarks) {
    await prisma.algorithmBenchmark.create({
      data: {
        assessment_id: hardenedAssessment.id,
        algorithm: b.algorithm,
        execution_time: b.execution_time,
        memory_usage: b.memory_usage,
        configuration: JSON.stringify(b.configuration),
        salt_support: b.salt_support,
        suitability: b.suitability,
        security_rating: b.security_rating,
        resistance: b.resistance,
      },
    });
  }

  // Seed StorageAssessments + SecurityFindings + Recommendations
  const legacyStorageEval = evaluateStorageConfiguration({
    algorithm: 'MD5',
    salt_configuration: 'Unsalted',
    salt_uniqueness: false,
    work_factor: 1,
    memory_cost: 1,
    iteration_count: 1,
    storage_format: 'Raw Hex Digest',
    reset_implementation: 'Email Temporary Plaintext Password',
    mfa_enabled: false,
    rate_limiting: false,
    measured_password_score: 22,
  });

  await prisma.storageAssessment.create({
    data: {
      assessment_id: legacyAssessment.id,
      algorithm: 'MD5',
      salt_configuration: 'Unsalted',
      salt_uniqueness: false,
      work_factor: 1,
      memory_cost: 1,
      iteration_count: 1,
      storage_format: 'Raw Hex Digest',
      reset_implementation: 'Email Temporary Plaintext Password',
      mfa_enabled: false,
      rate_limiting: false,
      security_score: legacyStorageEval.overall_score,
      score_classification: legacyStorageEval.score_classification,
      score_type: 'Measured',
      category_scores: JSON.stringify(legacyStorageEval.category_scores),
      findings_summary: JSON.stringify(legacyStorageEval.findings),
    },
  });

  for (const f of legacyStorageEval.findings) {
    const cf = await prisma.securityFinding.create({
      data: {
        assessment_id: legacyAssessment.id,
        finding_title: f.finding_title,
        description: f.description,
        severity: f.severity,
        impact: f.impact,
        category: f.category,
      },
    });
    await prisma.recommendation.create({
      data: {
        finding_id: cf.id,
        recommendation: f.recommendation,
        priority: f.priority,
        implementation_details: f.implementation_details,
        code_snippet: f.code_snippet,
      },
    });
  }

  const hardenedStorageEval = evaluateStorageConfiguration({
    algorithm: 'Argon2id',
    salt_configuration: 'Unique Random (>= 16 bytes)',
    salt_uniqueness: true,
    work_factor: 3,
    memory_cost: 65536,
    iteration_count: 3,
    storage_format: 'PHC String ($argon2id$...)',
    reset_implementation: 'Expiring Single-Use CSPRNG Token (Hashed)',
    mfa_enabled: true,
    rate_limiting: true,
    measured_password_score: 94,
  });

  await prisma.storageAssessment.create({
    data: {
      assessment_id: hardenedAssessment.id,
      algorithm: 'Argon2id',
      salt_configuration: 'Unique Random (>= 16 bytes)',
      salt_uniqueness: true,
      work_factor: 3,
      memory_cost: 65536,
      iteration_count: 3,
      storage_format: 'PHC String ($argon2id$...)',
      reset_implementation: 'Expiring Single-Use CSPRNG Token (Hashed)',
      mfa_enabled: true,
      rate_limiting: true,
      security_score: hardenedStorageEval.overall_score,
      score_classification: hardenedStorageEval.score_classification,
      score_type: 'Measured',
      category_scores: JSON.stringify(hardenedStorageEval.category_scores),
      findings_summary: JSON.stringify(hardenedStorageEval.findings),
    },
  });

  for (const f of hardenedStorageEval.findings) {
    const cf = await prisma.securityFinding.create({
      data: {
        assessment_id: hardenedAssessment.id,
        finding_title: f.finding_title,
        description: f.description,
        severity: f.severity,
        impact: f.impact,
        category: f.category,
      },
    });
    await prisma.recommendation.create({
      data: {
        finding_id: cf.id,
        recommendation: f.recommendation,
        priority: f.priority,
        implementation_details: f.implementation_details,
        code_snippet: f.code_snippet,
      },
    });
  }

  // Generate 2 initial Security Assessment Reports
  const rpt1Payload = await compileAssessmentReportPayload(legacyAssessment.id, 'PSTS-RPT-2026-A101');
  await prisma.report.create({
    data: {
      assessment_id: legacyAssessment.id,
      report_number: 'PSTS-RPT-2026-A101',
      report_type: 'PDF',
      file_path: '/api/reports/PSTS-RPT-2026-A101/download',
      summary_json: JSON.stringify(rpt1Payload),
    },
  });

  const rpt2Payload = await compileAssessmentReportPayload(hardenedAssessment.id, 'PSTS-RPT-2026-B204');
  await prisma.report.create({
    data: {
      assessment_id: hardenedAssessment.id,
      report_number: 'PSTS-RPT-2026-B204',
      report_type: 'PDF',
      file_path: '/api/reports/PSTS-RPT-2026-B204/download',
      summary_json: JSON.stringify(rpt2Payload),
    },
  });

  // Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        user_id: adminUser.id,
        activity_type: 'SYSTEM_INITIALIZED',
        status: 'SUCCESS',
        metadata: JSON.stringify({ message: 'PSTS Cybersecurity Laboratory initialized with synthetic datasets' }),
      },
      {
        user_id: researcherUser.id,
        activity_type: 'STORAGE_CONFIG_ASSESSMENT',
        assessment_id: legacyAssessment.id,
        status: 'WARNING',
        metadata: JSON.stringify({ algorithm: 'MD5', classification: 'Critical', critical_override: true }),
      },
      {
        user_id: studentUser.id,
        activity_type: 'PASSWORD_STRENGTH_ASSESSMENT',
        assessment_id: moderateAssessment.id,
        status: 'SUCCESS',
        metadata: JSON.stringify({ strength_category: 'Moderate', plaintext_stored: false }),
      },
      {
        user_id: adminUser.id,
        activity_type: 'SECURITY_REPORT_GENERATED',
        assessment_id: hardenedAssessment.id,
        status: 'SUCCESS',
        metadata: JSON.stringify({ report_number: 'PSTS-RPT-2026-B204', format: 'PDF' }),
      },
    ],
  });

  console.log('PSTS database seeded successfully!');
}

if (require.main === module) {
  ensureSeeded()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

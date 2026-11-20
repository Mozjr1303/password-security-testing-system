import { evaluatePasswordStrength } from './passwordEngine';
import {
  demonstrateSalting,
  generateEducationalHash,
  runAlgorithmBenchmarks,
  runControlledAudit,
} from './hashEngine';
import { evaluateStorageConfiguration } from './storageEngine';

export interface LabExperimentSpec {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  learning_objectives: string[];
  required_inputs: Array<{
    name: string;
    label: string;
    type: 'text' | 'select' | 'number';
    default_value: string | number;
    options?: string[];
  }>;
  execution_controls: {
    max_attempts: number;
    max_execution_ms: number;
    memory_cap_kb: number;
    cancellable: boolean;
  };
}

export const PREDEFINED_EXPERIMENTS: LabExperimentSpec[] = [
  {
    id: 'EXP-1',
    number: 1,
    title: 'Experiment 1: Password Strength Comparison',
    subtitle: 'Compare weak, moderate, and strong synthetic passwords side by side',
    difficulty: 'Beginner',
    description:
      'Users evaluate three synthetic credentials representing common user habits (a dictionary word, a leetspeak substitution, and a high-entropy multi-word passphrase) to observe how entropy, patterns, and character pools impact guessing difficulty.',
    learning_objectives: [
      'Understand why arbitrary complexity rules (like P@ssw0rd1) fail against rule-based crackers.',
      'Quantify raw vs. effective bit entropy across weak, moderate, and strong credentials.',
      'Compare offline fast-hash GPU guessing times against memory-hard Argon2id resistance.',
    ],
    required_inputs: [
      {
        name: 'weak_sample',
        label: 'Weak Synthetic Sample',
        type: 'text',
        default_value: 'password123',
      },
      {
        name: 'moderate_sample',
        label: 'Moderate Synthetic Sample (Leetspeak)',
        type: 'text',
        default_value: 'P@ssw0rd2026!',
      },
      {
        name: 'strong_sample',
        label: 'Strong Synthetic Passphrase',
        type: 'text',
        default_value: 'Cobalt#Falcon79!Orbit$Nebula',
      },
    ],
    execution_controls: {
      max_attempts: 100,
      max_execution_ms: 2000,
      memory_cap_kb: 16384,
      cancellable: false,
    },
  },
  {
    id: 'EXP-2',
    number: 2,
    title: 'Experiment 2: Hashing Algorithm Comparison',
    subtitle: 'Compare execution speed, memory hardness, and security of 6 hashing algorithms',
    difficulty: 'Intermediate',
    description:
      'Execute controlled benchmarks across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id to observe why fast general-purpose digests are dangerous for password storage and how adaptive algorithms throttle attackers.',
    learning_objectives: [
      'Measure the execution time difference (microseconds vs. hundreds of milliseconds) between SHA-256 and Argon2id.',
      'Observe memory-hardness (64 MB vs. < 1 KB) and its impact on GPU/ASIC parallel cracking.',
      'Select appropriate work factors that keep user login under 300 ms while maximizing attacker cost.',
    ],
    required_inputs: [
      {
        name: 'bcrypt_cost',
        label: 'bcrypt Cost Factor (Rounds = 2^cost)',
        type: 'number',
        default_value: 10,
      },
      {
        name: 'argon2_memory_kb',
        label: 'Argon2id Memory Cost (KB)',
        type: 'number',
        default_value: 32768,
      },
      {
        name: 'pbkdf2_iterations',
        label: 'PBKDF2-HMAC-SHA256 Iterations',
        type: 'number',
        default_value: 150000,
      },
    ],
    execution_controls: {
      max_attempts: 500,
      max_execution_ms: 5000,
      memory_cap_kb: 131072,
      cancellable: true,
    },
  },
  {
    id: 'EXP-3',
    number: 3,
    title: 'Experiment 3: Salt Demonstration',
    subtitle: 'Examine the cryptographic difference between salted and unsalted password hashes',
    difficulty: 'Beginner',
    description:
      'Demonstrates what happens when two users independently choose the same synthetic password under unsalted SHA-256 versus uniquely salted SHA-256 and Argon2id.',
    learning_objectives: [
      'Observe how identical inputs create identical unsalted hashes, revealing shared passwords immediately.',
      'Understand how precomputed Rainbow Tables exploit unsalted or static-salted databases.',
      'Verify how unique 128-bit cryptographic salts produce completely distinct ciphertexts for identical passwords.',
    ],
    required_inputs: [
      {
        name: 'shared_synthetic_input',
        label: 'Shared Synthetic Test Credential (User A & User B)',
        type: 'text',
        default_value: 'SyntheticCampusLab#2026',
      },
    ],
    execution_controls: {
      max_attempts: 50,
      max_execution_ms: 2000,
      memory_cap_kb: 65536,
      cancellable: false,
    },
  },
  {
    id: 'EXP-4',
    number: 4,
    title: 'Experiment 4: Dictionary Auditing',
    subtitle: 'Run a controlled dictionary exercise against generated synthetic sample hashes',
    difficulty: 'Intermediate',
    description:
      'Generates synthetic hashes from common dictionary patterns and executes a controlled local dictionary + rule mutation audit to demonstrate how fast weak credentials fall.',
    learning_objectives: [
      'Understand how dictionary auditing combines base wordlists with common mutation rules (capitalization, +123, +!).',
      'Compare dictionary auditing throughput against MD5/SHA-256 versus bcrypt/Argon2id.',
      'Learn why screening against common/breached wordlists is mandatory at account creation.',
    ],
    required_inputs: [
      {
        name: 'target_algorithm',
        label: 'Target Hash Algorithm',
        type: 'select',
        default_value: 'SHA-256',
        options: ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'],
      },
      {
        name: 'max_attempts',
        label: 'Maximum Attempt Limit',
        type: 'number',
        default_value: 500,
      },
    ],
    execution_controls: {
      max_attempts: 5000,
      max_execution_ms: 5000,
      memory_cap_kb: 65536,
      cancellable: true,
    },
  },
  {
    id: 'EXP-5',
    number: 5,
    title: 'Experiment 5: Limited Brute-Force Demonstration',
    subtitle: 'Observe how password length and character sets affect keyspace exhaustion',
    difficulty: 'Advanced',
    description:
      'Performs a strictly bounded brute-force search against a short synthetic PIN/token hash while calculating exact keyspace growth as length increases from 3 to 16 characters.',
    learning_objectives: [
      'Observe how a 3–4 digit numeric PIN is exhausted in under a thousand guesses.',
      'Visualize exponential keyspace explosion (b^L) when expanding from digits (10^L) to full ASCII (94^L).',
      'Understand why length contributes more to entropy than small complexity tweaks on short strings.',
    ],
    required_inputs: [
      {
        name: 'synthetic_pin',
        label: 'Short Synthetic 3-Digit Target (000–999)',
        type: 'text',
        default_value: '247',
      },
      {
        name: 'target_algorithm',
        label: 'Hashing Algorithm',
        type: 'select',
        default_value: 'MD5',
        options: ['MD5', 'SHA-256'],
      },
      {
        name: 'max_attempts',
        label: 'Laboratory Attempt Cap',
        type: 'number',
        default_value: 1500,
      },
    ],
    execution_controls: {
      max_attempts: 5000,
      max_execution_ms: 4000,
      memory_cap_kb: 32768,
      cancellable: true,
    },
  },
  {
    id: 'EXP-6',
    number: 6,
    title: 'Experiment 6: Password Storage Evaluation',
    subtitle: 'Compare legacy vs. modern password storage configurations and security scores',
    difficulty: 'Intermediate',
    description:
      'Evaluates a legacy enterprise configuration (unsalted MD5 without MFA or rate limiting) against a hardened modern configuration (Argon2id 64MB + unique salt + MFA + rate limiting).',
    learning_objectives: [
      'Apply the 5-category weighted security scoring methodology (Section 9).',
      'Observe how a Critical weakness overrides a numerical score.',
      'Produce concrete technical remediation guidance for migrating legacy password databases.',
    ],
    required_inputs: [
      {
        name: 'compare_algorithm',
        label: 'Candidate Storage Algorithm to Evaluate',
        type: 'select',
        default_value: 'MD5',
        options: ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'],
      },
      {
        name: 'enable_mfa_and_ratelimit',
        label: 'Enable MFA & Login Rate Limiting',
        type: 'select',
        default_value: 'No',
        options: ['No', 'Yes'],
      },
    ],
    execution_controls: {
      max_attempts: 50,
      max_execution_ms: 2000,
      memory_cap_kb: 32768,
      cancellable: false,
    },
  },
];

export async function executeLaboratoryExperiment(
  experimentId: string,
  inputs: Record<string, unknown> = {}
): Promise<{
  experiment: LabExperimentSpec;
  execution_time_ms: number;
  attempts_count: number;
  results: unknown;
  explanation: string;
  security_lessons: string[];
  recommendations: string[];
}> {
  const start = performance.now();
  const exp = PREDEFINED_EXPERIMENTS.find((e) => e.id === experimentId) || PREDEFINED_EXPERIMENTS[0];

  if (exp.id === 'EXP-1') {
    const weakPw = String(inputs.weak_sample || 'password123');
    const modPw = String(inputs.moderate_sample || 'P@ssw0rd2026!');
    const strongPw = String(inputs.strong_sample || 'Cobalt#Falcon79!Orbit$Nebula');

    const weakRes = evaluatePasswordStrength(weakPw);
    const modRes = evaluatePasswordStrength(modPw);
    const strongRes = evaluatePasswordStrength(strongPw);

    return {
      experiment: exp,
      execution_time_ms: Number((performance.now() - start).toFixed(2)),
      attempts_count: 3,
      results: {
        samples: [
          { label: 'Weak Sample', length: weakRes.password_length, ...weakRes },
          { label: 'Moderate Sample', length: modRes.password_length, ...modRes },
          { label: 'Strong Sample', length: strongRes.password_length, ...strongRes },
        ],
      },
      explanation: `The weak sample scored ${weakRes.overall_score}/100 (${weakRes.entropy_estimate} bits effective entropy) due to dictionary presence. The leetspeak sample scored ${modRes.overall_score}/100 because predictable substitutions (@->a, 0->o) are normalized by auditing tools. The strong passphrase achieved ${strongRes.overall_score}/100 with ${strongRes.entropy_estimate} bits of effective entropy.`,
      security_lessons: [
        'Predictable character substitutions (leetspeak) add very little real security against rule-based auditing tools.',
        'Length and unpredictability drive exponential entropy growth.',
        'Combining high-entropy passphrases with Argon2id shifts offline cracking from seconds to centuries.',
      ],
      recommendations: [
        'Adopt NIST SP 800-63B guidance: require 12–16+ characters and screen against common password dictionaries.',
        'Encourage multi-word passphrases or password managers rather than forced periodic symbol substitutions.',
      ],
    };
  }

  if (exp.id === 'EXP-2') {
    const benchmarks = await runAlgorithmBenchmarks({
      bcryptCost: Number(inputs.bcrypt_cost || 10),
      argon2MemoryKb: Number(inputs.argon2_memory_kb || 32768),
      pbkdf2Iterations: Number(inputs.pbkdf2_iterations || 150000),
    });

    const md5Time = benchmarks.find((b) => b.algorithm === 'MD5')?.execution_time || 0.003;
    const argonTime = benchmarks.find((b) => b.algorithm === 'Argon2id')?.execution_time || 45;
    const slowdownFactor = Math.round(argonTime / Math.max(md5Time, 0.001));

    return {
      experiment: exp,
      execution_time_ms: Number((performance.now() - start).toFixed(2)),
      attempts_count: benchmarks.length,
      results: {
        benchmarks,
        slowdown_factor_vs_md5: slowdownFactor,
      },
      explanation: `Argon2id took ${argonTime} ms and ${inputs.argon2_memory_kb || 32768} KB of RAM per hash — roughly ${slowdownFactor.toLocaleString()}x slower on CPU than MD5 (${md5Time} ms) and tens of thousands of times more memory-intensive, neutralizing GPU parallel hardware advantage.`,
      security_lessons: [
        'Fast cryptographic digests (MD5, SHA-1, SHA-256) are designed for high-speed data integrity, making them hazardous for password storage.',
        'Adaptive algorithms allow administrators to scale CPU and memory costs as hardware improves.',
        'Memory hardness (Argon2id) forces attackers to allocate large RAM blocks per thread, starving GPU cores.',
      ],
      recommendations: [
        'Use Argon2id (64 MB memory, t=3, p=4) for all new authentication systems.',
        'Use bcrypt (cost 12–14) or PBKDF2-HMAC-SHA256 (600,000+ iterations) only when Argon2id is unavailable.',
      ],
    };
  }

  if (exp.id === 'EXP-3') {
    const sharedInput = String(inputs.shared_synthetic_input || 'SyntheticCampusLab#2026');
    const saltDemo = await demonstrateSalting(sharedInput);

    return {
      experiment: exp,
      execution_time_ms: Number((performance.now() - start).toFixed(2)),
      attempts_count: 6,
      results: saltDemo,
      explanation:
        'When User A and User B chose the exact same synthetic password, unsalted SHA-256 produced identical hex digests. Once a unique random salt was introduced per user (and in Argon2id PHC strings), the resulting hashes were 100% distinct.',
      security_lessons: [
        'Unsalted hashes leak whether two accounts share the same password and allow a single Rainbow Table to crack every user simultaneously.',
        'A salt does not need to be secret, but it MUST be cryptographically random and unique per password hash.',
        'Modern algorithms like Argon2id and bcrypt automatically generate and embed a 128-bit salt inside the hash string.',
      ],
      recommendations: [
        'Never use unsalted hashes or a single static application-wide pepper/salt alone.',
        'Generate at least 16 bytes (128 bits) of CSPRNG salt for every password creation and password change.',
      ],
    };
  }

  if (exp.id === 'EXP-4') {
    const algo = String(inputs.target_algorithm || 'SHA-256');
    const maxAttempts = Math.min(Math.max(Number(inputs.max_attempts || 500), 20), 5000);

    // Generate 3 synthetic target hashes (2 weak dictionary patterns, 1 strong hardened passphrase)
    const sample1 = await generateEducationalHash('welcome123', algo, { useRandomSalt: true, bcryptCost: 8, argon2MemoryKb: 8192, argon2TimeCost: 1 });
    const sample2 = await generateEducationalHash('Dragon!', algo, { useRandomSalt: true, bcryptCost: 8, argon2MemoryKb: 8192, argon2TimeCost: 1 });
    const sample3 = await generateEducationalHash('Nebula#94!Quantum$Falcon', algo, { useRandomSalt: true, bcryptCost: 8, argon2MemoryKb: 8192, argon2TimeCost: 1 });

    const auditRes = await runControlledAudit({
      jobType: 'DICTIONARY_AUDIT',
      algorithm: algo,
      maxAttempts,
      targets: [
        { label: 'Synthetic Account #1 (Common word + digits)', sample_hash: sample1.hash, salt: sample1.salt },
        { label: 'Synthetic Account #2 (Capitalized word + symbol)', sample_hash: sample2.hash, salt: sample2.salt },
        { label: 'Synthetic Account #3 (High-entropy passphrase)', sample_hash: sample3.hash, salt: sample3.salt },
      ],
    });

    return {
      experiment: exp,
      execution_time_ms: auditRes.execution_time_ms,
      attempts_count: auditRes.attempts_count,
      results: auditRes,
      explanation: auditRes.educational_summary,
      security_lessons: [
        'Dictionary words with minor mutations (Capitalization, trailing "123" or "!") are compromised within the first few hundred guesses.',
        'High-entropy passphrases absent from dictionaries remain unbroken even when the hash is exposed.',
        'Adaptive hashes drastically limit the number of dictionary candidates an attacker can test per second.',
      ],
      recommendations: auditRes.recommendations,
    };
  }

  if (exp.id === 'EXP-5') {
    const rawPin = String(inputs.synthetic_pin || '247').replace(/[^0-9a-f]/gi, '').substring(0, 3) || '247';
    const algo = String(inputs.target_algorithm || 'MD5');
    const maxAttempts = Math.min(Math.max(Number(inputs.max_attempts || 1500), 50), 5000);

    const targetSample = await generateEducationalHash(rawPin, algo);
    const auditRes = await runControlledAudit({
      jobType: 'BRUTE_FORCE_DEMO',
      algorithm: algo,
      charset: 'numeric',
      maxLength: 3,
      maxAttempts,
      targets: [{ label: `Synthetic ${rawPin.length}-Digit Numeric Target`, sample_hash: targetSample.hash }],
    });

    const keyspaceGrowth = [
      { length: 4, digits_only: Math.pow(10, 4).toLocaleString(), alphanumeric_62: Math.pow(62, 4).toLocaleString(), full_ascii_94: Math.pow(94, 4).toLocaleString() },
      { length: 8, digits_only: Math.pow(10, 8).toLocaleString(), alphanumeric_62: '2.18 x 10^14', full_ascii_94: '6.10 x 10^15' },
      { length: 12, digits_only: '1.00 x 10^12', alphanumeric_62: '3.23 x 10^21', full_ascii_94: '4.76 x 10^23' },
      { length: 16, digits_only: '1.00 x 10^16', alphanumeric_62: '4.77 x 10^28', full_ascii_94: '3.71 x 10^31' },
    ];

    return {
      experiment: exp,
      execution_time_ms: auditRes.execution_time_ms,
      attempts_count: auditRes.attempts_count,
      results: {
        audit: auditRes,
        keyspace_table: keyspaceGrowth,
      },
      explanation: `The 3-digit numeric keyspace (10^3 = 1,000 combinations) was exhausted in ${auditRes.attempts_count} attempts (${auditRes.execution_time_ms} ms). Expanding length to 16 characters across 94 ASCII characters increases the keyspace to 3.71 x 10^31 combinations.`,
      security_lessons: [
        'Short passwords or numeric PINs have tiny keyspaces that can be exhaustively searched in milliseconds offline.',
        'Every additional character multiplies the keyspace by the alphabet size (94x per character for full ASCII).',
        'Strict online rate limiting and account lockouts are essential whenever short OTPs or PINs are used online.',
      ],
      recommendations: [
        'Require minimum 12–16 characters for user passwords.',
        'Protect numeric OTPs/PINs with strict attempt limits (e.g., max 3–5 attempts before invalidation).',
      ],
    };
  }

  // EXP-6: Password Storage Evaluation
  const candidateAlgo = String(inputs.compare_algorithm || 'MD5');
  const hasMfa = String(inputs.enable_mfa_and_ratelimit || 'No') === 'Yes';

  const candidateEval = evaluateStorageConfiguration({
    algorithm: candidateAlgo,
    salt_configuration: ['Argon2id', 'bcrypt'].includes(candidateAlgo)
      ? 'Unique Random (>= 16 bytes)'
      : 'Unsalted',
    salt_uniqueness: ['Argon2id', 'bcrypt'].includes(candidateAlgo),
    work_factor: candidateAlgo === 'Argon2id' ? 3 : candidateAlgo === 'bcrypt' ? 12 : 1,
    memory_cost: candidateAlgo === 'Argon2id' ? 65536 : candidateAlgo === 'bcrypt' ? 4 : 1,
    iteration_count: candidateAlgo === 'PBKDF2' ? 600000 : 1,
    storage_format: candidateAlgo === 'Argon2id' ? 'PHC String ($argon2id$...)' : 'Raw Hex Digest',
    reset_implementation: hasMfa ? 'Expiring Single-Use CSPRNG Token (Hashed)' : 'Email Temporary Plaintext Password',
    mfa_enabled: hasMfa,
    rate_limiting: hasMfa,
  });

  const referenceHardenedEval = evaluateStorageConfiguration({
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
    measured_password_score: 92,
  });

  return {
    experiment: exp,
    execution_time_ms: Number((performance.now() - start).toFixed(2)),
    attempts_count: 2,
    results: {
      candidate_evaluation: candidateEval,
      reference_hardened_baseline: referenceHardenedEval,
    },
    explanation: `The candidate ${candidateAlgo} configuration scored ${candidateEval.overall_score}/100 (${candidateEval.score_classification}${
      candidateEval.critical_override_applied ? ' - Critical Weakness Override Applied' : ''
    }), whereas the reference Argon2id hardened configuration achieved ${referenceHardenedEval.overall_score}/100 (${referenceHardenedEval.score_classification}).`,
    security_lessons: [
      'A single critical flaw (such as MD5 hashing or missing unique salts) compromises the entire authentication posture regardless of other controls.',
      'Defense-in-depth requires strong password policy, Argon2id memory-hard storage, rate limiting, MFA, and hashed expiring reset tokens.',
    ],
    recommendations: candidateEval.findings.map((f) => f.recommendation),
  };
}

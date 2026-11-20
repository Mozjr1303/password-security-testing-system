import crypto from 'crypto';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export interface AlgorithmMetadata {
  id: string;
  name: string;
  category:
    | 'General-purpose cryptographic hashing'
    | 'Password-specific hashing'
    | 'Salted password hashing'
    | 'Adaptive password hashing';
  digest_length_bits: number;
  salt_support: string;
  memory_hard: boolean;
  configurable_work_factor: boolean;
  default_parameters: string;
  computational_cost: 'Extremely Low' | 'Low' | 'Moderate-High' | 'High (CPU + Memory)';
  suitability: 'Unsuitable (Legacy Broken)' | 'Unsuitable Alone (Fast General-Purpose)' | 'Acceptable (Compliance)' | 'Recommended' | 'Preferred Modern Standard';
  security_rating: number;
  gpu_asic_resistance: 'None (Billions/sec)' | 'Very Low' | 'Moderate (CPU-bound)' | 'High (64-byte Blowfish state)' | 'Very High (Memory-Hard L1/L2/RAM)';
  description: string;
  recommended_configuration: string;
}

export const SUPPORTED_ALGORITHMS: AlgorithmMetadata[] = [
  {
    id: 'MD5',
    name: 'MD5 (Legacy Demonstration Only)',
    category: 'General-purpose cryptographic hashing',
    digest_length_bits: 128,
    salt_support: 'None native (requires external manual concatenation)',
    memory_hard: false,
    configurable_work_factor: false,
    default_parameters: '128-bit single-pass Merkle-Damgård digest (64 operations)',
    computational_cost: 'Extremely Low',
    suitability: 'Unsuitable (Legacy Broken)',
    security_rating: 5,
    gpu_asic_resistance: 'None (Billions/sec)',
    description:
      'Designed in 1991 as a fast checksum. Cryptographically broken (collision vulnerabilities) and executes tens of billions of times per second on consumer GPUs.',
    recommended_configuration: 'DO NOT USE for password storage. Migrate immediately to Argon2id.',
  },
  {
    id: 'SHA-1',
    name: 'SHA-1 (Legacy Demonstration Only)',
    category: 'General-purpose cryptographic hashing',
    digest_length_bits: 160,
    salt_support: 'None native (requires external manual concatenation)',
    memory_hard: false,
    configurable_work_factor: false,
    default_parameters: '160-bit single-pass digest (80 rounds)',
    computational_cost: 'Extremely Low',
    suitability: 'Unsuitable (Legacy Broken)',
    security_rating: 12,
    gpu_asic_resistance: 'None (Billions/sec)',
    description:
      'Legacy 160-bit NSA-designed hash function. Suffers from practical collision attacks (SHAttered) and extreme execution speed that allows rapid offline brute-forcing.',
    recommended_configuration: 'DO NOT USE for passwords. Replace with Argon2id or bcrypt.',
  },
  {
    id: 'SHA-256',
    name: 'SHA-256 (General-Purpose Hash Demonstration)',
    category: 'General-purpose cryptographic hashing',
    digest_length_bits: 256,
    salt_support: 'Manual external salt only',
    memory_hard: false,
    configurable_work_factor: false,
    default_parameters: '256-bit single-pass SHA-2 family digest',
    computational_cost: 'Low',
    suitability: 'Unsuitable Alone (Fast General-Purpose)',
    security_rating: 28,
    gpu_asic_resistance: 'Very Low',
    description:
      'Cryptographically collision-resistant for file integrity and TLS, but dangerously fast when used directly for passwords because it lacks key stretching and memory hardness.',
    recommended_configuration: 'Only acceptable as an internal primitive inside PBKDF2-HMAC-SHA256, never raw SHA-256.',
  },
  {
    id: 'PBKDF2',
    name: 'PBKDF2-HMAC-SHA256',
    category: 'Password-specific hashing',
    digest_length_bits: 256,
    salt_support: 'Built-in cryptographic salt required (128-bit+)',
    memory_hard: false,
    configurable_work_factor: true,
    default_parameters: 'iterations=600,000, salt=16 bytes, digest=SHA-256',
    computational_cost: 'Moderate-High',
    suitability: 'Acceptable (Compliance)',
    security_rating: 76,
    gpu_asic_resistance: 'Moderate (CPU-bound)',
    description:
      'Applies a pseudorandom function (HMAC-SHA256) ratusan of thousands of times to slow down brute-force attacks. NIST/FIPS compliant, though less resistant to GPU parallelism than Argon2id.',
    recommended_configuration: 'OWASP recommends >= 600,000 iterations for PBKDF2-HMAC-SHA256 with a unique 16-byte random salt.',
  },
  {
    id: 'bcrypt',
    name: 'bcrypt (Eksblowfish Adaptive Hash)',
    category: 'Adaptive password hashing',
    digest_length_bits: 184,
    salt_support: 'Built-in 128-bit random salt encoded in modular crypt string',
    memory_hard: false,
    configurable_work_factor: true,
    default_parameters: 'cost=12 (2^12 = 4,096 key expansion rounds)',
    computational_cost: 'Moderate-High',
    suitability: 'Recommended',
    security_rating: 88,
    gpu_asic_resistance: 'High (64-byte Blowfish state)',
    description:
      'Battle-tested adaptive password hashing function based on the Blowfish cipher. Automatically embeds a 128-bit random salt and scales work exponentially via cost factor (2^cost).',
    recommended_configuration: 'Cost factor 12 to 14 ($2b$12$...), keeping verification under ~250–350 ms.',
  },
  {
    id: 'Argon2id',
    name: 'Argon2id (Password Hashing Competition Winner)',
    category: 'Adaptive password hashing',
    digest_length_bits: 256,
    salt_support: 'Built-in 128-bit cryptographic salt in PHC format',
    memory_hard: true,
    configurable_work_factor: true,
    default_parameters: 'm=65536 (64 MB), t=3 iterations, p=4 lanes',
    computational_cost: 'High (CPU + Memory)',
    suitability: 'Preferred Modern Standard',
    security_rating: 98,
    gpu_asic_resistance: 'Very High (Memory-Hard L1/L2/RAM)',
    description:
      'Hybrid Argon2 variant combining side-channel resistance (Argon2i) and GPU/ASIC memory-cracking resistance (Argon2d). Allows tuning memory cost, time cost, and parallelism.',
    recommended_configuration: 'OWASP preferred: memoryCost = 64 MB (65536 KB) or 19 MB minimum, timeCost = 3, parallelism = 4.',
  },
];

export interface HashAnalysisResult {
  sample_hash_preview: string;
  detected_algorithms: string[];
  selected_algorithm: string;
  hash_category: string;
  hash_format_valid: boolean;
  salt_status: string;
  extracted_salt: string | null;
  work_factor: string;
  memory_cost: string;
  parallelism: string;
  suitability: string;
  is_unsuitable_for_passwords: boolean;
  security_rating: number;
  execution_time_ms: number;
  algorithm_characteristics: AlgorithmMetadata;
  weaknesses: string[];
  recommendations: string[];
}

export function identifyAndAnalyzeHash(
  sampleHash: string,
  requestedAlgorithm?: string,
  externalSalt?: string
): HashAnalysisResult {
  const start = performance.now();
  const trimmed = sampleHash.trim();

  const detected: string[] = [];
  let parsedSalt: string | null = externalSalt || null;
  let workFactor = '1 pass (Fixed - No key stretching)';
  let memoryCost = 'Minimal (< 1 KB register state)';
  let parallelism = '1 thread';
  let saltStatus = externalSalt ? 'External Salt Provided' : 'Unsalted (Vulnerable to Rainbow Tables)';

  // Detect format
  if (/^\$argon2(id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(trimmed)) {
    detected.push('Argon2id');
    const parts = trimmed.split('$');
    const params = parts[3] || '';
    const mMatch = params.match(/m=(\d+)/);
    const tMatch = params.match(/t=(\d+)/);
    const pMatch = params.match(/p=(\d+)/);
    const mKb = mMatch ? parseInt(mMatch[1], 10) : 65536;
    const tVal = tMatch ? parseInt(tMatch[1], 10) : 3;
    const pVal = pMatch ? parseInt(pMatch[1], 10) : 4;
    parsedSalt = parts[4] || null;
    saltStatus = 'Embedded Cryptographic Random Salt (PHC String)';
    workFactor = `t=${tVal} iterations`;
    memoryCost = `${mKb} KB (${(mKb / 1024).toFixed(1)} MB)`;
    parallelism = `p=${pVal} parallel lanes`;
  } else if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmed)) {
    detected.push('bcrypt');
    const parts = trimmed.split('$');
    const cost = parseInt(parts[2] || '10', 10);
    parsedSalt = (parts[3] || '').substring(0, 22);
    saltStatus = 'Embedded 128-bit Random Salt (22 Base64 chars)';
    workFactor = `Cost=${cost} (2^${cost} = ${Math.pow(2, cost).toLocaleString()} rounds)`;
    memoryCost = '4 KB (Eksblowfish S-boxes)';
  } else if (/^pbkdf2_sha256\$\d+\$[^$]+\$[A-Za-z0-9+/=a-fA-F]+$/i.test(trimmed)) {
    detected.push('PBKDF2');
    const parts = trimmed.split('$');
    const iter = parseInt(parts[1] || '100000', 10);
    parsedSalt = parts[2] || null;
    saltStatus = 'Embedded Random Salt';
    workFactor = `${iter.toLocaleString()} HMAC-SHA256 iterations`;
    memoryCost = '32 KB';
  } else if (/^[a-fA-F0-9]{32}$/.test(trimmed)) {
    detected.push('MD5');
  } else if (/^[a-fA-F0-9]{40}$/.test(trimmed)) {
    detected.push('SHA-1');
  } else if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    detected.push('SHA-256');
    if (requestedAlgorithm === 'PBKDF2') {
      detected.unshift('PBKDF2');
      workFactor = '100,000+ iterations (Raw hex digest format)';
      memoryCost = '32 KB';
      saltStatus = externalSalt ? 'External Salt Provided' : 'Missing Embedded Salt Metadata';
    }
  }

  const chosenAlgoId =
    requestedAlgorithm && requestedAlgorithm !== 'AUTO'
      ? requestedAlgorithm
      : detected[0] || 'MD5';

  const meta =
    SUPPORTED_ALGORITHMS.find((a) => a.id.toLowerCase() === chosenAlgoId.toLowerCase()) ||
    SUPPORTED_ALGORITHMS[0];

  const isFormatValid = detected.some((d) => d.toLowerCase() === meta.id.toLowerCase());

  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (!isFormatValid) {
    weaknesses.push(
      `Submitted string does not match standard ${meta.id} format${
        detected.length > 0 ? ` (looks like ${detected.join(' or ')})` : ''
      }.`
    );
    recommendations.push(`Verify the hash encoding or switch the algorithm selector to ${detected[0] || 'the matching format'}.`);
  }

  if (meta.id === 'MD5' || meta.id === 'SHA-1') {
    weaknesses.push(`${meta.id} is a broken legacy general-purpose digest with zero memory hardness or key stretching.`);
    weaknesses.push('Vulnerable to multi-billion guess/sec GPU attacks and precomputed rainbow tables.');
    recommendations.push('Decommission legacy hash storage immediately. Re-hash passwords with Argon2id upon next login or wrap existing hashes in Argon2id.');
  } else if (meta.id === 'SHA-256') {
    weaknesses.push('Raw SHA-256 is a fast general-purpose cryptographic hash, not a password hashing function.');
    if (!externalSalt) {
      weaknesses.push('No salt detected; identical passwords yield identical 64-character hex digests.');
    }
    recommendations.push('Replace raw SHA-256 with an adaptive password hashing scheme (Argon2id, bcrypt, or PBKDF2-HMAC-SHA256).');
  } else if (meta.id === 'PBKDF2') {
    if (trimmed.startsWith('pbkdf2_sha256$')) {
      const iter = parseInt(trimmed.split('$')[1] || '0', 10);
      if (iter < 310000) {
        weaknesses.push(`PBKDF2 iteration count (${iter.toLocaleString()}) is below OWASP 600,000 iteration recommendation.`);
        recommendations.push('Increase PBKDF2-HMAC-SHA256 iterations to at least 600,000 or migrate to Argon2id.');
      }
    }
    weaknesses.push('PBKDF2 lacks memory hardness, allowing attackers with GPUs to run thousands of parallel cores.');
    recommendations.push('Consider migrating from PBKDF2 to memory-hard Argon2id (64 MB, t=3) for stronger GPU resistance.');
  } else if (meta.id === 'bcrypt') {
    const parts = trimmed.split('$');
    const cost = parseInt(parts[2] || '10', 10);
    if (cost < 12) {
      weaknesses.push(`bcrypt cost factor (${cost}) is below the recommended modern baseline of 12.`);
      recommendations.push('Upgrade bcrypt work factor to 12–14 rounds.');
    } else {
      recommendations.push('bcrypt configuration is strong. Keep note of bcrypt’s 72-byte input truncation limit.');
    }
  } else if (meta.id === 'Argon2id') {
    const mMatch = trimmed.match(/m=(\d+)/);
    const mKb = mMatch ? parseInt(mMatch[1], 10) : 65536;
    if (mKb < 19456) {
      weaknesses.push(`Argon2id memory cost (${mKb} KB) is below OWASP minimum recommendation (19,456 KB).`);
      recommendations.push('Increase Argon2id memoryCost to at least 65,536 KB (64 MB) with timeCost >= 3.');
    } else {
      recommendations.push('Configuration follows modern OWASP Argon2id best practices (memory-hard + unique salt).');
    }
  }

  const elapsed = Number((performance.now() - start).toFixed(3));
  const preview = trimmed.length > 48 ? `${trimmed.substring(0, 24)}...${trimmed.substring(trimmed.length - 16)}` : trimmed;

  return {
    sample_hash_preview: preview,
    detected_algorithms: detected.length > 0 ? detected : ['Unknown / Custom Format'],
    selected_algorithm: meta.id,
    hash_category: meta.category,
    hash_format_valid: isFormatValid,
    salt_status: saltStatus,
    extracted_salt: parsedSalt,
    work_factor: workFactor,
    memory_cost: memoryCost,
    parallelism,
    suitability: meta.suitability,
    is_unsuitable_for_passwords: ['MD5', 'SHA-1', 'SHA-256'].includes(meta.id),
    security_rating: meta.security_rating,
    execution_time_ms: elapsed,
    algorithm_characteristics: meta,
    weaknesses,
    recommendations,
  };
}

export async function generateEducationalHash(
  syntheticInput: string,
  algorithm: string,
  options?: {
    salt?: string;
    useRandomSalt?: boolean;
    bcryptCost?: number;
    argon2MemoryKb?: number;
    argon2TimeCost?: number;
    pbkdf2Iterations?: number;
  }
): Promise<{
  algorithm: string;
  hash: string;
  salt: string | null;
  configuration: Record<string, unknown>;
  execution_time_ms: number;
}> {
  const start = performance.now();
  const algo = algorithm.toUpperCase();
  const customSalt =
    options?.salt !== undefined
      ? options.salt
      : options?.useRandomSalt
      ? crypto.randomBytes(8).toString('hex')
      : '';

  if (algo === 'MD5') {
    const payload = customSalt ? `${customSalt}:${syntheticInput}` : syntheticInput;
    const hash = crypto.createHash('md5').update(payload).digest('hex');
    return {
      algorithm: 'MD5',
      hash,
      salt: customSalt || null,
      configuration: { passes: 1, salted: Boolean(customSalt), legacy_demo: true },
      execution_time_ms: Number((performance.now() - start).toFixed(3)),
    };
  }

  if (algo === 'SHA-1' || algo === 'SHA1') {
    const payload = customSalt ? `${customSalt}:${syntheticInput}` : syntheticInput;
    const hash = crypto.createHash('sha1').update(payload).digest('hex');
    return {
      algorithm: 'SHA-1',
      hash,
      salt: customSalt || null,
      configuration: { passes: 1, salted: Boolean(customSalt), legacy_demo: true },
      execution_time_ms: Number((performance.now() - start).toFixed(3)),
    };
  }

  if (algo === 'SHA-256' || algo === 'SHA256') {
    const payload = customSalt ? `${customSalt}:${syntheticInput}` : syntheticInput;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return {
      algorithm: 'SHA-256',
      hash,
      salt: customSalt || null,
      configuration: { passes: 1, salted: Boolean(customSalt) },
      execution_time_ms: Number((performance.now() - start).toFixed(3)),
    };
  }

  if (algo === 'PBKDF2') {
    const salt = customSalt || crypto.randomBytes(12).toString('hex');
    const iterations = Math.min(Math.max(options?.pbkdf2Iterations || 100000, 1000), 1000000);
    const derived = crypto.pbkdf2Sync(syntheticInput, salt, iterations, 32, 'sha256').toString('hex');
    const formatted = `pbkdf2_sha256$${iterations}$${salt}$${derived}`;
    return {
      algorithm: 'PBKDF2',
      hash: formatted,
      salt,
      configuration: { iterations, digest: 'sha256', keylen: 32 },
      execution_time_ms: Number((performance.now() - start).toFixed(3)),
    };
  }

  if (algo === 'BCRYPT') {
    const cost = Math.min(Math.max(options?.bcryptCost || 10, 4), 14);
    const salt = await bcrypt.genSalt(cost);
    const hash = await bcrypt.hash(syntheticInput, salt);
    return {
      algorithm: 'bcrypt',
      hash,
      salt,
      configuration: { cost, rounds: Math.pow(2, cost) },
      execution_time_ms: Number((performance.now() - start).toFixed(3)),
    };
  }

  // Default to Argon2id
  const memoryCost = Math.min(Math.max(options?.argon2MemoryKb || 65536, 4096), 131072);
  const timeCost = Math.min(Math.max(options?.argon2TimeCost || 3, 1), 6);
  const hash = await argon2.hash(syntheticInput, {
    type: argon2.argon2id,
    memoryCost,
    timeCost,
    parallelism: 4,
  });
  const extractedSalt = hash.split('$')[4] || null;
  return {
    algorithm: 'Argon2id',
    hash,
    salt: extractedSalt,
    configuration: { memoryCostKb: memoryCost, timeCost, parallelism: 4, variant: 'argon2id' },
    execution_time_ms: Number((performance.now() - start).toFixed(3)),
  };
}

export async function verifyEducationalHash(
  candidate: string,
  sampleHash: string,
  algorithm: string,
  externalSalt?: string
): Promise<{
  verified: boolean;
  algorithm: string;
  execution_time_ms: number;
  explanation: string;
}> {
  const start = performance.now();
  const trimmed = sampleHash.trim();
  const algo = algorithm.toUpperCase();
  let verified = false;

  try {
    if (algo === 'ARGON2ID' || algo === 'ARGON2' || trimmed.startsWith('$argon2')) {
      verified = await argon2.verify(trimmed, candidate);
    } else if (algo === 'BCRYPT' || /^\$2[aby]\$/.test(trimmed)) {
      verified = await bcrypt.compare(candidate, trimmed);
    } else if (algo === 'PBKDF2' || trimmed.startsWith('pbkdf2_sha256$')) {
      if (trimmed.startsWith('pbkdf2_sha256$')) {
        const parts = trimmed.split('$');
        const iterations = parseInt(parts[1] || '100000', 10);
        const salt = parts[2] || '';
        const expectedHex = parts[3] || '';
        const derived = crypto.pbkdf2Sync(candidate, salt, iterations, 32, 'sha256').toString('hex');
        verified = derived.toLowerCase() === expectedHex.toLowerCase();
      } else {
        const salt = externalSalt || 'psts_lab_salt';
        const derived = crypto.pbkdf2Sync(candidate, salt, 100000, 32, 'sha256').toString('hex');
        verified = derived.toLowerCase() === trimmed.toLowerCase();
      }
    } else if (algo === 'MD5') {
      const direct = crypto.createHash('md5').update(candidate).digest('hex');
      const saltedColon = externalSalt ? crypto.createHash('md5').update(`${externalSalt}:${candidate}`).digest('hex') : '';
      const saltedConcat = externalSalt ? crypto.createHash('md5').update(`${externalSalt}${candidate}`).digest('hex') : '';
      const target = trimmed.toLowerCase();
      verified = target === direct || (Boolean(externalSalt) && (target === saltedColon || target === saltedConcat));
    } else if (algo === 'SHA-1' || algo === 'SHA1') {
      const direct = crypto.createHash('sha1').update(candidate).digest('hex');
      const saltedColon = externalSalt ? crypto.createHash('sha1').update(`${externalSalt}:${candidate}`).digest('hex') : '';
      const saltedConcat = externalSalt ? crypto.createHash('sha1').update(`${externalSalt}${candidate}`).digest('hex') : '';
      const target = trimmed.toLowerCase();
      verified = target === direct || (Boolean(externalSalt) && (target === saltedColon || target === saltedConcat));
    } else if (algo === 'SHA-256' || algo === 'SHA256') {
      const direct = crypto.createHash('sha256').update(candidate).digest('hex');
      const saltedColon = externalSalt ? crypto.createHash('sha256').update(`${externalSalt}:${candidate}`).digest('hex') : '';
      const saltedConcat = externalSalt ? crypto.createHash('sha256').update(`${externalSalt}${candidate}`).digest('hex') : '';
      const target = trimmed.toLowerCase();
      verified = target === direct || (Boolean(externalSalt) && (target === saltedColon || target === saltedConcat));
    }
  } catch {
    verified = false;
  }

  const elapsed = Number((performance.now() - start).toFixed(3));
  return {
    verified,
    algorithm,
    execution_time_ms: elapsed,
    explanation: verified
      ? `Candidate input matched the target ${algorithm} hash in ${elapsed} ms by recomputing the transform with identical salt and parameters.`
      : `Candidate input produced a different digest than the target ${algorithm} hash (${elapsed} ms).`,
  };
}

export async function demonstrateSalting(syntheticInput: string): Promise<{
  input_length: number;
  unsalted_user1: string;
  unsalted_user2: string;
  unsalted_identical: boolean;
  salted_sha256_user1: { salt: string; hash: string };
  salted_sha256_user2: { salt: string; hash: string };
  argon2id_user1: string;
  argon2id_user2: string;
  lesson: string;
}> {
  const unsalted1 = crypto.createHash('sha256').update(syntheticInput).digest('hex');
  const unsalted2 = crypto.createHash('sha256').update(syntheticInput).digest('hex');

  const salt1 = crypto.randomBytes(8).toString('hex');
  const salt2 = crypto.randomBytes(8).toString('hex');
  const salted1 = crypto.createHash('sha256').update(`${salt1}:${syntheticInput}`).digest('hex');
  const salted2 = crypto.createHash('sha256').update(`${salt2}:${syntheticInput}`).digest('hex');

  const argonHash1 = await argon2.hash(syntheticInput, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 2,
  });
  const argonHash2 = await argon2.hash(syntheticInput, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 2,
  });

  return {
    input_length: syntheticInput.length,
    unsalted_user1: unsalted1,
    unsalted_user2: unsalted2,
    unsalted_identical: unsalted1 === unsalted2,
    salted_sha256_user1: { salt: salt1, hash: salted1 },
    salted_sha256_user2: { salt: salt2, hash: salted2 },
    argon2id_user1: argonHash1,
    argon2id_user2: argonHash2,
    lesson:
      'Without unique random salts, two users who choose the same password produce identical hashes, exposing both to a single precomputed rainbow-table lookup. Unique random salts ensure every stored hash is distinct even for identical inputs.',
  };
}

export interface BenchmarkEntry {
  algorithm: string;
  category: string;
  execution_time: number; // ms per operation
  hashes_per_second_cpu: number;
  memory_usage: number; // KB
  salt_support: string;
  configuration: Record<string, unknown>;
  computational_cost: string;
  suitability: string;
  security_rating: number;
  resistance: string;
}

export async function runAlgorithmBenchmarks(options?: {
  algorithms?: string[];
  bcryptCost?: number;
  argon2MemoryKb?: number;
  argon2TimeCost?: number;
  pbkdf2Iterations?: number;
}): Promise<BenchmarkEntry[]> {
  const selected = options?.algorithms?.length
    ? options.algorithms
    : ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'];

  const sampleInput = 'SyntheticBenchmarkInput#2026!';
  const results: BenchmarkEntry[] = [];

  for (const algo of selected) {
    const upper = algo.toUpperCase();
    if (upper === 'MD5') {
      const t0 = performance.now();
      for (let i = 0; i < 200; i++) {
        crypto.createHash('md5').update(`${sampleInput}${i}`).digest('hex');
      }
      const perOp = Math.max(0.002, Number(((performance.now() - t0) / 200).toFixed(4)));
      results.push({
        algorithm: 'MD5',
        category: 'General-purpose cryptographic hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.round(1000 / perOp),
        memory_usage: 1,
        salt_support: 'None native',
        configuration: { rounds: 1, digestBits: 128 },
        computational_cost: 'Extremely Low',
        suitability: 'Unsuitable (Legacy Broken)',
        security_rating: 5,
        resistance: 'Vulnerable (> 20 Billion guesses/sec on GPU)',
      });
    } else if (upper === 'SHA-1' || upper === 'SHA1') {
      const t0 = performance.now();
      for (let i = 0; i < 200; i++) {
        crypto.createHash('sha1').update(`${sampleInput}${i}`).digest('hex');
      }
      const perOp = Math.max(0.003, Number(((performance.now() - t0) / 200).toFixed(4)));
      results.push({
        algorithm: 'SHA-1',
        category: 'General-purpose cryptographic hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.round(1000 / perOp),
        memory_usage: 1,
        salt_support: 'None native',
        configuration: { rounds: 1, digestBits: 160 },
        computational_cost: 'Extremely Low',
        suitability: 'Unsuitable (Legacy Broken)',
        security_rating: 12,
        resistance: 'Vulnerable (> 10 Billion guesses/sec on GPU)',
      });
    } else if (upper === 'SHA-256' || upper === 'SHA256') {
      const t0 = performance.now();
      for (let i = 0; i < 200; i++) {
        crypto.createHash('sha256').update(`${sampleInput}${i}`).digest('hex');
      }
      const perOp = Math.max(0.004, Number(((performance.now() - t0) / 200).toFixed(4)));
      results.push({
        algorithm: 'SHA-256',
        category: 'General-purpose cryptographic hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.round(1000 / perOp),
        memory_usage: 2,
        salt_support: 'Manual external salt only',
        configuration: { rounds: 1, digestBits: 256 },
        computational_cost: 'Low',
        suitability: 'Unsuitable Alone (Fast General-Purpose)',
        security_rating: 28,
        resistance: 'Weak (~4 Billion guesses/sec on GPU)',
      });
    } else if (upper === 'PBKDF2') {
      const iterations = Math.min(Math.max(options?.pbkdf2Iterations || 150000, 10000), 600000);
      const t0 = performance.now();
      crypto.pbkdf2Sync(sampleInput, 'psts_benchmark_salt_16b', iterations, 32, 'sha256');
      const perOp = Number((performance.now() - t0).toFixed(2));
      results.push({
        algorithm: 'PBKDF2',
        category: 'Password-specific hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.max(1, Math.round(1000 / Math.max(perOp, 0.1))),
        memory_usage: 32,
        salt_support: 'Built-in random salt (128-bit+)',
        configuration: { iterations, prf: 'HMAC-SHA256', saltBytes: 16 },
        computational_cost: 'Moderate-High',
        suitability: 'Acceptable (Compliance Standard)',
        security_rating: iterations >= 310000 ? 80 : 72,
        resistance: 'Moderate (CPU-stretched, but low memory footprint)',
      });
    } else if (upper === 'BCRYPT') {
      const cost = Math.min(Math.max(options?.bcryptCost || 10, 6), 13);
      const t0 = performance.now();
      const salt = await bcrypt.genSalt(cost);
      await bcrypt.hash(sampleInput, salt);
      const perOp = Number((performance.now() - t0).toFixed(2));
      results.push({
        algorithm: 'bcrypt',
        category: 'Adaptive password hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.max(1, Math.round(1000 / Math.max(perOp, 0.1))),
        memory_usage: 4,
        salt_support: 'Built-in 128-bit random salt',
        configuration: { cost, keyExpansionRounds: Math.pow(2, cost) },
        computational_cost: 'Moderate-High',
        suitability: 'Recommended (Adaptive)',
        security_rating: cost >= 12 ? 90 : 84,
        resistance: 'High (Eksblowfish state resists cheap GPU parallelism)',
      });
    } else if (upper === 'ARGON2ID' || upper === 'ARGON2') {
      const memoryCost = Math.min(Math.max(options?.argon2MemoryKb || 65536, 8192), 131072);
      const timeCost = Math.min(Math.max(options?.argon2TimeCost || 3, 1), 6);
      const t0 = performance.now();
      await argon2.hash(sampleInput, {
        type: argon2.argon2id,
        memoryCost,
        timeCost,
        parallelism: 4,
      });
      const perOp = Number((performance.now() - t0).toFixed(2));
      results.push({
        algorithm: 'Argon2id',
        category: 'Adaptive password hashing',
        execution_time: perOp,
        hashes_per_second_cpu: Math.max(1, Math.round(1000 / Math.max(perOp, 0.1))),
        memory_usage: memoryCost,
        salt_support: 'Built-in 128-bit random salt (PHC format)',
        configuration: { memoryCostKb: memoryCost, timeCost, parallelism: 4 },
        computational_cost: 'High (CPU + Memory-Hard)',
        suitability: 'Preferred Modern Standard',
        security_rating: memoryCost >= 65536 ? 98 : 92,
        resistance: 'Very High (Memory-hardness defeats GPU/ASIC mass parallelism)',
      });
    }
  }

  return results;
}

// Active laboratory job cancellation registry
const cancelledJobIds = new Set<string>();

export function requestCancelJob(jobId: string): void {
  cancelledJobIds.add(jobId);
}

export interface ControlledAuditResult {
  status: 'COMPLETED' | 'LIMIT_REACHED' | 'CANCELLED';
  job_type: 'DICTIONARY_AUDIT' | 'BRUTE_FORCE_DEMO';
  target_algorithm: string;
  attempts_count: number;
  max_attempts: number;
  execution_time_ms: number;
  attempts_per_second: number;
  matched_count: number;
  total_targets: number;
  audit_findings: Array<{
    target_label: string;
    sample_hash_preview: string;
    matched: boolean;
    matched_pattern_label: string;
    attempts_to_match: number;
    time_ms: number;
  }>;
  educational_summary: string;
  recommendations: string[];
}

export async function runControlledAudit(params: {
  jobId?: string;
  jobType: 'DICTIONARY_AUDIT' | 'BRUTE_FORCE_DEMO';
  algorithm: string;
  targets: Array<{ label: string; sample_hash: string; salt?: string | null }>;
  wordlist?: string[];
  charset?: 'numeric' | 'lowercase_short' | 'alphanumeric_short';
  maxLength?: number;
  maxAttempts?: number;
  maxExecutionMs?: number;
}): Promise<ControlledAuditResult> {
  const start = performance.now();
  const maxAttempts = Math.min(Math.max(params.maxAttempts || 2500, 10), 10000);
  const maxExecutionMs = Math.min(Math.max(params.maxExecutionMs || 3500, 200), 8000);
  const algo = params.algorithm.toUpperCase();

  const defaultWordlist = [
    '123456', 'password', '12345678', 'qwerty', 'admin', 'welcome', 'letmein',
    'football', 'monkey', 'shadow', 'sunshine', 'dragon', 'passw0rd', 'p@ssw0rd',
    'admin123', 'welcome123', 'student', 'student123', 'cybersecurity', 'researcher',
    'developer', 'trustno1', 'abc123', 'password1', 'superman', 'batman', 'master',
    'hello123', 'university', 'labdemo2026', 'synthetic01', 'test1234'
  ];

  let candidates: string[] = [];
  if (params.jobType === 'DICTIONARY_AUDIT') {
    const baseWords = params.wordlist?.length ? params.wordlist : defaultWordlist;
    // Generate common rule variations (raw, capitalized, +123, +2026, +!)
    for (const w of baseWords) {
      candidates.push(w);
      candidates.push(`${w}123`);
      candidates.push(`${w}!`);
      candidates.push(w.charAt(0).toUpperCase() + w.slice(1));
      if (candidates.length >= maxAttempts) break;
    }
  } else {
    // Limited Brute-Force Demonstration on short synthetic keyspaces
    const alphabet =
      params.charset === 'numeric'
        ? '0123456789'
        : params.charset === 'lowercase_short'
        ? 'abcdefghijklmnopqrstuvwxyz'
        : '0123456789abcdef';
    const maxLen = Math.min(Math.max(params.maxLength || 4, 1), 4);

    const generateCombos = (prefix: string, depth: number) => {
      if (candidates.length >= maxAttempts) return;
      if (depth === 0) {
        candidates.push(prefix);
        return;
      }
      for (let i = 0; i < alphabet.length; i++) {
        if (candidates.length >= maxAttempts) return;
        generateCombos(prefix + alphabet[i], depth - 1);
      }
    };

    for (let len = 1; len <= maxLen; len++) {
      generateCombos('', len);
      if (candidates.length >= maxAttempts) break;
    }
  }

  let totalAttempts = 0;
  let matchedCount = 0;
  let status: ControlledAuditResult['status'] = 'COMPLETED';
  const findings: ControlledAuditResult['audit_findings'] = [];

  for (const target of params.targets) {
    let targetMatched = false;
    let targetAttempts = 0;
    let matchedLabel = 'Not recovered within laboratory cap';
    const tTargetStart = performance.now();

    for (const candidate of candidates) {
      if (params.jobId && cancelledJobIds.has(params.jobId)) {
        status = 'CANCELLED';
        break;
      }
      if (totalAttempts >= maxAttempts || performance.now() - start >= maxExecutionMs) {
        status = 'LIMIT_REACHED';
        break;
      }

      totalAttempts++;
      targetAttempts++;

      const res = await verifyEducationalHash(candidate, target.sample_hash, algo, target.salt || undefined);
      if (res.verified) {
        targetMatched = true;
        matchedCount++;
        // Describe pattern without storing real user sensitive secrets
        matchedLabel = `Synthetic candidate matched (${candidate.length} chars, pattern: ${
          /^\d+$/.test(candidate) ? 'Digits-only' : /^[a-z]+$/i.test(candidate) ? 'Dictionary word' : 'Alphanumeric/Rule'
        })`;
        break;
      }
    }

    const preview =
      target.sample_hash.length > 36
        ? `${target.sample_hash.substring(0, 18)}...${target.sample_hash.substring(target.sample_hash.length - 10)}`
        : target.sample_hash;

    findings.push({
      target_label: target.label,
      sample_hash_preview: preview,
      matched: targetMatched,
      matched_pattern_label: matchedLabel,
      attempts_to_match: targetAttempts,
      time_ms: Number((performance.now() - tTargetStart).toFixed(2)),
    });

    if (status !== 'COMPLETED') break;
  }

  if (params.jobId) {
    cancelledJobIds.delete(params.jobId);
  }

  const totalTimeMs = Math.max(0.5, Number((performance.now() - start).toFixed(2)));
  const aps = Math.round((totalAttempts / totalTimeMs) * 1000);

  return {
    status,
    job_type: params.jobType,
    target_algorithm: params.algorithm,
    attempts_count: totalAttempts,
    max_attempts: maxAttempts,
    execution_time_ms: totalTimeMs,
    attempts_per_second: aps,
    matched_count: matchedCount,
    total_targets: params.targets.length,
    audit_findings: findings,
    educational_summary:
      matchedCount > 0
        ? `Controlled ${params.jobType.replace('_', ' ').toLowerCase()} matched ${matchedCount}/${params.targets.length} synthetic target(s) in ${totalAttempts} attempts (${totalTimeMs} ms, ~${aps.toLocaleString()} attempts/sec). Fast hashes allow thousands of dictionary guesses per millisecond, whereas Argon2id/bcrypt severely throttle attempt throughput.`
        : `Controlled audit stopped after ${totalAttempts} attempts (${totalTimeMs} ms) with 0 matches. Strong high-entropy passphrases combined with adaptive hashing resist dictionary and bounded brute-force attacks.`,
    recommendations: [
      'Block common dictionary words and predictable mutations at registration time.',
      'Use Argon2id (64 MB memory, t=3) so each offline guess costs tens of milliseconds and megabytes of RAM.',
      'Enforce minimum password length of 12–16 characters to make brute-force keyspaces astronomically large.',
    ],
  };
}

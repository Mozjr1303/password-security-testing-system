export interface StorageConfigInput {
  algorithm: string;
  salt_configuration: string; // "Unique Random (>= 16 bytes)", "Short Salt (< 8 bytes)", "Static/Fixed Salt", "Unsalted"
  salt_uniqueness: boolean;
  work_factor: number; // e.g., Argon2 time_cost (3) or bcrypt cost (12)
  memory_cost: number; // KB (e.g., 65536 for Argon2id, 4 for bcrypt, 1 for MD5/SHA)
  iteration_count: number; // e.g., 600000 for PBKDF2, 3 for Argon2id, 4096 for bcrypt
  storage_format: string; // "PHC String ($argon2id$...)", "Modular Crypt ($2b$...)", "PBKDF2 Structured", "Raw Hex Digest", "Plaintext / Reversible Encryption"
  reset_implementation: string; // "Expiring Single-Use CSPRNG Token (Hashed)", "Long-Lived Unhashed Token", "Email Temporary Plaintext Password", "Static Security Questions"
  mfa_enabled: boolean;
  rate_limiting: boolean;
  account_lockout?: boolean;
  measured_password_score?: number; // If provided from a real password test, score_type = "Measured"
}

export interface GeneratedFinding {
  finding_title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  impact: string;
  category: string;
  recommendation: string;
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  implementation_details: string;
  code_snippet: string;
}

export interface StorageAssessmentResult {
  overall_score: number;
  numerical_score: number;
  score_classification: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
  critical_override_applied: boolean;
  score_type: 'Measured' | 'Estimated';
  category_scores: {
    password_strength: { weight: 25; raw_score: number; weighted_score: number };
    algorithm_suitability: { weight: 25; raw_score: number; weighted_score: number };
    salt_and_configuration: { weight: 20; raw_score: number; weighted_score: number };
    authentication_controls: { weight: 20; raw_score: number; weighted_score: number };
    password_reset_security: { weight: 10; raw_score: number; weighted_score: number };
  };
  preferred_recommendation: string;
  findings: GeneratedFinding[];
}

export function evaluateStorageConfiguration(input: StorageConfigInput): StorageAssessmentResult {
  const algo = input.algorithm.toUpperCase();
  const findings: GeneratedFinding[] = [];

  // 1. Password Strength Category (25%)
  const isMeasured = typeof input.measured_password_score === 'number';
  const pwRawScore = isMeasured ? Math.min(100, Math.max(0, input.measured_password_score!)) : 75;

  if (pwRawScore < 50) {
    findings.push({
      finding_title: 'Weak Password Policy / Low Entropy Credentials',
      description: `Assessed password strength score (${pwRawScore}/100) indicates susceptibility to dictionary and rule-based guessing.`,
      severity: pwRawScore < 25 ? 'Critical' : 'High',
      impact: 'Attackers can recover user accounts rapidly via credential stuffing or offline dictionary attacks.',
      category: 'Password Strength',
      recommendation: 'Introduce real-time entropy & dictionary strength validation and enforce a 12–16 character minimum.',
      priority: 'High',
      implementation_details:
        'Screen candidate passwords against a local breached/common password bloom filter or wordlist and require effective entropy >= 50 bits.',
      code_snippet: `// Enforce minimum length & dictionary screening before hashing
if (password.length < 12 || isInSyntheticBreachList(password)) {
  throw new Error("Password does not meet security policy requirements.");
}`,
    });
  }

  // 2. Hashing Algorithm Suitability Category (25%)
  let algoRawScore = 0;
  if (input.storage_format.toLowerCase().includes('plaintext') || algo === 'PLAINTEXT') {
    algoRawScore = 0;
    findings.push({
      finding_title: 'Plaintext or Reversible Password Storage',
      description: 'Passwords are stored in plaintext or reversible encryption instead of a one-way adaptive cryptographic hash.',
      severity: 'Critical',
      impact: 'Any database read or backup leak immediately compromises 100% of user credentials with zero cracking effort.',
      category: 'Password Storage',
      recommendation: 'Migrate immediately to Argon2id one-way adaptive password hashing.',
      priority: 'Immediate',
      implementation_details: 'Purge plaintext columns and store only PHC-formatted Argon2id hashes.',
      code_snippet: `import argon2 from 'argon2';
const passwordHash = await argon2.hash(plainPassword, {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4
});`,
    });
  } else if (algo === 'MD5' || algo === 'SHA-1' || algo === 'SHA1') {
    algoRawScore = algo === 'MD5' ? 5 : 10;
    findings.push({
      finding_title: `${input.algorithm} Used for Password Storage`,
      description: `The configuration uses ${input.algorithm}, a broken legacy general-purpose digest algorithm unsuitable for password storage.`,
      severity: 'Critical',
      impact: 'Commodity GPUs can compute over 10–25 billion MD5/SHA-1 hashes per second, allowing near-instant offline password recovery.',
      category: 'Hashing Algorithm',
      recommendation: 'Migrate from legacy hashing to Argon2id (or bcrypt cost >= 12).',
      priority: 'Immediate',
      implementation_details:
        'Wrap existing legacy hashes in Argon2id immediately (`Argon2id(MD5(pw))`) and replace with direct `Argon2id(pw)` as users authenticate.',
      code_snippet: `import argon2 from 'argon2';
// Transitional upgrade on user login:
const newArgon2Hash = await argon2.hash(userInputPassword, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
});`,
    });
  } else if (algo === 'SHA-256' || algo === 'SHA256') {
    algoRawScore = 25;
    findings.push({
      finding_title: 'SHA-256 Used Alone Without Password-Specific Key Stretching',
      description: 'Raw SHA-256 is a fast general-purpose cryptographic hash designed for speed, not password storage.',
      severity: 'High',
      impact: 'Lacks configurable work factors and memory hardness, enabling billions of offline guesses per second on GPU clusters.',
      category: 'Hashing Algorithm',
      recommendation: 'Adopt a dedicated password-specific adaptive hashing scheme (Argon2id preferred; bcrypt or PBKDF2 as alternatives).',
      priority: 'Immediate',
      implementation_details: 'Replace single-pass SHA-256 calls with Argon2id (m=65536, t=3, p=4) or PBKDF2-HMAC-SHA256 (600,000+ iterations).',
      code_snippet: `// Replace crypto.createHash('sha256') with Argon2id:
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3
});`,
    });
  } else if (algo === 'PBKDF2') {
    algoRawScore = 76;
    findings.push({
      finding_title: 'PBKDF2 Lacks Memory Hardness Against GPU/ASIC Parallelism',
      description: 'PBKDF2-HMAC-SHA256 provides CPU key stretching via iterations but uses minimal RAM (< 32 KB).',
      severity: 'Low',
      impact: 'Acceptable for FIPS-140 compliance, but significantly less resistant to modern GPU password cracking than Argon2id.',
      category: 'Hashing Algorithm',
      recommendation: 'Where compliance permits, upgrade to Argon2id for memory-hard protection.',
      priority: 'Low',
      implementation_details: 'If retaining PBKDF2, enforce at least 600,000 HMAC-SHA256 iterations per OWASP guidance.',
      code_snippet: `crypto.pbkdf2Sync(password, randomSalt16Bytes, 600000, 32, 'sha256');`,
    });
  } else if (algo === 'BCRYPT') {
    algoRawScore = 88;
  } else if (algo === 'ARGON2ID' || algo === 'ARGON2') {
    algoRawScore = 100;
  }

  // 3. Salt and Configuration Security Category (20%)
  let saltConfigScore = 100;
  const saltLower = input.salt_configuration.toLowerCase();

  if (!input.salt_uniqueness || saltLower.includes('unsalted') || saltLower.includes('none') || saltLower.includes('no salt')) {
    saltConfigScore -= 65;
    findings.push({
      finding_title: 'Missing Unique Cryptographic Salts',
      description: 'Passwords are hashed without a unique per-user random salt.',
      severity: 'Critical',
      impact: 'Identical passwords produce identical hashes across the database and enable precomputed Rainbow Table attacks.',
      category: 'Salt Configuration',
      recommendation: 'Generate a unique cryptographically random salt (at least 16 bytes / 128 bits) for every password hash.',
      priority: 'Immediate',
      implementation_details: 'Use a CSPRNG (`crypto.randomBytes(16)`) or rely on Argon2id/bcrypt built-in PHC salt generation.',
      code_snippet: `const uniqueSalt = crypto.randomBytes(16); // 128-bit CSPRNG salt`,
    });
  } else if (saltLower.includes('static') || saltLower.includes('fixed') || saltLower.includes('short')) {
    saltConfigScore -= 40;
    findings.push({
      finding_title: 'Weak or Static Salt Configuration',
      description: `Salt configuration ("${input.salt_configuration}") uses a global static salt or insufficient salt length.`,
      severity: 'High',
      impact: 'A single static salt allows an attacker to build one targeted lookup table for the entire user database.',
      category: 'Salt Configuration',
      recommendation: 'Ensure every password receives its own unique 128-bit random salt.',
      priority: 'High',
      implementation_details: 'Embed the unique random salt alongside the hash using standard PHC string format.',
      code_snippet: `// Argon2id automatically generates and embeds a unique 16-byte random salt:
const phcHash = await argon2.hash(password, { type: argon2.argon2id });`,
    });
  }

  // Work factor / memory cost checks
  if (algo === 'ARGON2ID' || algo === 'ARGON2') {
    if (input.memory_cost < 19456 || input.work_factor < 2) {
      saltConfigScore -= 30;
      findings.push({
        finding_title: 'Insufficient Argon2id Memory or Time Cost Parameters',
        description: `Configured Argon2id parameters (memory=${input.memory_cost} KB, timeCost=${input.work_factor}) are below OWASP recommended baselines.`,
        severity: 'Medium',
        impact: 'Reduced memory allocation weakens Argon2id’s primary defense against GPU/ASIC parallel cracking.',
        category: 'Configuration Parameters',
        recommendation: 'Increase Argon2id memory cost to at least 65,536 KB (64 MB) and time cost to 3 iterations.',
        priority: 'Medium',
        implementation_details: 'Tune memoryCost and timeCost so verification takes ~150–300 ms on target production hardware.',
        code_snippet: `await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4
});`,
      });
    }
  } else if (algo === 'BCRYPT') {
    if (input.work_factor < 12) {
      saltConfigScore -= 25;
      findings.push({
        finding_title: 'Weak bcrypt Work Factor (Cost < 12)',
        description: `bcrypt cost factor is set to ${input.work_factor} (${Math.pow(2, input.work_factor).toLocaleString()} rounds), below the modern minimum of 12.`,
        severity: 'Medium',
        impact: 'Lower cost factors double the speed at which attackers can test candidate passwords.',
        category: 'Configuration Parameters',
        recommendation: 'Increase bcrypt cost factor to 12–14.',
        priority: 'Medium',
        implementation_details: 'Update `bcrypt.genSalt(12)` and transparently re-hash existing users on next login.',
        code_snippet: `const hash = await bcrypt.hash(password, 12);`,
      });
    }
  } else if (algo === 'PBKDF2') {
    if (input.iteration_count < 310000) {
      saltConfigScore -= 35;
      findings.push({
        finding_title: 'Insufficient PBKDF2 Iteration Count',
        description: `PBKDF2 iteration count (${input.iteration_count.toLocaleString()}) is significantly below the OWASP 600,000 iteration standard.`,
        severity: 'High',
        impact: 'Low iteration counts make PBKDF2 vulnerable to high-throughput GPU dictionary attacks.',
        category: 'Configuration Parameters',
        recommendation: 'Increase PBKDF2-HMAC-SHA256 iterations to >= 600,000 or migrate to Argon2id.',
        priority: 'High',
        implementation_details: 'Update key derivation iteration count parameter.',
        code_snippet: `crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');`,
      });
    }
  } else if (['MD5', 'SHA-1', 'SHA1', 'SHA-256', 'SHA256'].includes(algo)) {
    saltConfigScore = Math.min(saltConfigScore, 20);
  }

  saltConfigScore = Math.max(0, saltConfigScore);

  // 4. Authentication Controls Category (20%)
  let authControlsScore = 100;
  if (!input.rate_limiting) {
    authControlsScore -= 55;
    findings.push({
      finding_title: 'Missing Login Rate Limiting and Brute-Force Throttling',
      description: 'Authentication endpoints do not enforce request rate limiting or progressive delays.',
      severity: 'High',
      impact: 'Exposes the application to automated online credential stuffing and dictionary spraying attacks.',
      category: 'Authentication Controls',
      recommendation: 'Implement IP and account-based login rate limiting with exponential backoff.',
      priority: 'High',
      implementation_details: 'Restrict failed login attempts (e.g., max 5 attempts per 15-minute window) and log anomalous spikes.',
      code_snippet: `import rateLimit from 'express-rate-limit';
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' }
});`,
    });
  }

  if (!input.mfa_enabled) {
    authControlsScore -= 45;
    findings.push({
      finding_title: 'No Multi-Factor Authentication (MFA) Enforcement',
      description: 'The authentication workflow relies solely on single-factor password verification.',
      severity: 'Medium',
      impact: 'Compromised, phished, or reused passwords directly grant full account takeover without a second barrier.',
      category: 'Authentication Controls',
      recommendation: 'Introduce Multi-Factor Authentication (TOTP / WebAuthn Passkeys).',
      priority: 'Medium',
      implementation_details: 'Require TOTP (RFC 6238) or FIDO2/WebAuthn verification for privileged and standard user logins.',
      code_snippet: `// Require second factor verification token before issuing full session JWT
if (user.mfaEnabled && !verifyTotpToken(user.mfaSecret, req.body.totpCode)) {
  return res.status(401).json({ error: 'Valid MFA code required.' });
}`,
    });
  }
  authControlsScore = Math.max(0, authControlsScore);

  // 5. Password Reset Security Category (10%)
  let resetScore = 100;
  const resetLower = input.reset_implementation.toLowerCase();
  if (resetLower.includes('plaintext') || resetLower.includes('temporary')) {
    resetScore = 15;
    findings.push({
      finding_title: 'Insecure Password Reset Sending Temporary Plaintext Passwords',
      description: 'The password recovery flow emails plaintext passwords or predictable temporary credentials.',
      severity: 'High',
      impact: 'Email transit interception or mailbox access exposes credentials in cleartext.',
      category: 'Password Reset',
      recommendation: 'Implement expiring single-use CSPRNG reset tokens stored as SHA-256 hashes.',
      priority: 'High',
      implementation_details: 'Generate a 32-byte random token, store only its SHA-256 digest with a 15-minute expiry, and invalidate upon use.',
      code_snippet: `const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins`,
    });
  } else if (resetLower.includes('question') || resetLower.includes('long-lived') || resetLower.includes('unhashed') || resetLower.includes('non-expiring')) {
    resetScore = 40;
    findings.push({
      finding_title: 'Weak Password Reset Token Lifecycle or Knowledge-Based Questions',
      description: `Password reset relies on "${input.reset_implementation}", which is vulnerable to OSINT guessing or token replay.`,
      severity: 'Medium',
      impact: 'Attackers can bypass strong passwords by exploiting weak recovery tokens or static security questions.',
      category: 'Password Reset',
      recommendation: 'Use short-lived (15–30 min), single-use cryptographic reset tokens hashed at rest.',
      priority: 'Medium',
      implementation_details: 'Hash reset tokens in the database and enforce strict TTL expiration.',
      code_snippet: `// Verify hashed token and TTL before allowing password update
const tokenHash = crypto.createHash('sha256').update(submittedToken).digest('hex');`,
    });
  }

  // If no weaknesses at all, add an Informational positive finding
  if (findings.length === 0) {
    findings.push({
      finding_title: 'Hardened Modern Password Storage & Authentication Configuration',
      description: 'Configuration utilizes Argon2id with unique 128-bit salts, strong memory/time work factors, MFA, rate limiting, and secure token recovery.',
      severity: 'Informational',
      impact: 'Provides high resilience against both online credential stuffing and offline GPU/ASIC cracking.',
      category: 'Security Posture',
      recommendation: 'Maintain periodic annual review of Argon2id memory and iteration work factors as hardware evolves.',
      priority: 'Low',
      implementation_details: 'Monitor login latency and increment memoryCost or timeCost as server capacity scales.',
      code_snippet: `// Current configuration aligns with OWASP Password Storage Cheat Sheet`,
    });
  }

  const weightedPw = Number(((pwRawScore * 25) / 100).toFixed(2));
  const weightedAlgo = Number(((algoRawScore * 25) / 100).toFixed(2));
  const weightedSalt = Number(((saltConfigScore * 20) / 100).toFixed(2));
  const weightedAuth = Number(((authControlsScore * 20) / 100).toFixed(2));
  const weightedReset = Number(((resetScore * 10) / 100).toFixed(2));

  const numericalScore = Number(
    Math.min(100, Math.max(0, weightedPw + weightedAlgo + weightedSalt + weightedAuth + weightedReset)).toFixed(1)
  );

  // Section 9 rule: "Critical security weaknesses must override a high numerical score when determining the final risk classification."
  const hasCriticalFinding = findings.some((f) => f.severity === 'Critical');
  let classification: StorageAssessmentResult['score_classification'] = 'Moderate';

  if (numericalScore >= 90) classification = 'Excellent';
  else if (numericalScore >= 75) classification = 'Good';
  else if (numericalScore >= 60) classification = 'Moderate';
  else if (numericalScore >= 40) classification = 'Poor';
  else classification = 'Critical';

  let criticalOverrideApplied = false;
  let effectiveOverallScore = numericalScore;

  if (hasCriticalFinding) {
    if (classification !== 'Critical') {
      classification = 'Critical';
      criticalOverrideApplied = true;
      effectiveOverallScore = Math.min(numericalScore, 38);
    }
  }

  return {
    overall_score: effectiveOverallScore,
    numerical_score: numericalScore,
    score_classification: classification,
    critical_override_applied: criticalOverrideApplied,
    score_type: isMeasured ? 'Measured' : 'Estimated',
    category_scores: {
      password_strength: { weight: 25, raw_score: pwRawScore, weighted_score: weightedPw },
      algorithm_suitability: { weight: 25, raw_score: algoRawScore, weighted_score: weightedAlgo },
      salt_and_configuration: { weight: 20, raw_score: saltConfigScore, weighted_score: weightedSalt },
      authentication_controls: { weight: 20, raw_score: authControlsScore, weighted_score: weightedAuth },
      password_reset_security: { weight: 10, raw_score: resetScore, weighted_score: weightedReset },
    },
    preferred_recommendation:
      'Argon2id (m=65536 KB, t=3, p=4) with unique 128-bit random salts is the preferred modern password hashing option, with bcrypt (cost >= 12) and PBKDF2-HMAC-SHA256 (>= 600,000 iterations) as compliant alternatives.',
    findings,
  };
}

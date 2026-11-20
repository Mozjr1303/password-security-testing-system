export interface PasswordStrengthResult {
  password_length: number;
  length_score: number;
  complexity_score: number;
  entropy_estimate: number;
  raw_entropy: number;
  overall_score: number;
  strength_category: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  estimated_crack_time: string;
  guessing_resistance: {
    online_rate_limited: string;
    offline_fast_hash_gpu: string;
    offline_argon2id_hardened: string;
  };
  character_sets: {
    lowercase: boolean;
    uppercase: boolean;
    digits: boolean;
    symbols: boolean;
    lowercase_count: number;
    uppercase_count: number;
    digits_count: number;
    symbols_count: number;
  };
  pattern_findings: string[];
  weaknesses: string[];
  recommendations: string[];
  breach_indicator: boolean;
}

export const SYNTHETIC_COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '123456789', '1234567890', 'qwerty', 'qwertyuiop',
  'admin', 'admin123', 'welcome', 'welcome123', 'letmein', 'football', 'iloveyou',
  'monkey', 'shadow', 'sunshine', 'princess', 'dragon', 'passw0rd', 'p@ssw0rd',
  'trustno1', 'abc123', 'password1', 'password123', 'baseball', 'superman', 'batman',
  'master', 'hello', 'hello123', 'charlie', 'donald', 'mustang', 'michael', 'ashley',
  'bailey', 'academia', 'university', 'student', 'student123', 'cybersecurity',
  'security', 'researcher', 'developer', 'changeme', 'secret', 'root', 'guest',
  'test', 'test123', 'default', 'system', 'network', 'server', 'database'
]);

const KEYBOARD_WALKS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1qaz2wsx',
  '12345', '23456', '34567', '45678', '56789', '67890',
  '09876', '98765', '87654', '76543', '65432', '54321'
];

function normalizeLeetspeak(input: string): string {
  const map: Record<string, string> = {
    '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
    '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', '8': 'b'
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] || ch)
    .join('');
}

function formatDuration(seconds: number): string {
  if (seconds < 0.001) return 'Instant (< 1 ms)';
  if (seconds < 1) return `${Math.max(1, Math.round(seconds * 1000))} milliseconds`;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${(years / 1e3).toFixed(1)} thousand years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`;
  return 'Centuries (> 1 billion years)';
}

export function evaluatePasswordStrength(
  password: string,
  extraDictionaryWords: string[] = []
): PasswordStrengthResult {
  const length = password.length;
  const lowercaseMatches = password.match(/[a-z]/g) || [];
  const uppercaseMatches = password.match(/[A-Z]/g) || [];
  const digitMatches = password.match(/\d/g) || [];
  const symbolMatches = password.match(/[^A-Za-z0-9]/g) || [];

  const hasLower = lowercaseMatches.length > 0;
  const hasUpper = uppercaseMatches.length > 0;
  const hasDigits = digitMatches.length > 0;
  const hasSymbols = symbolMatches.length > 0;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 32;

  const rawEntropy = Number((length * Math.log2(Math.max(poolSize, 1))).toFixed(2));

  const lowerPw = password.toLowerCase();
  const normalizedPw = normalizeLeetspeak(password);
  const baseWithoutTrailingDigits = normalizeLeetspeak(password.replace(/[0-9!@#$%^&*?]+$/g, ''));
  const strippedAlpha = baseWithoutTrailingDigits.replace(/[^a-z]/g, '');

  const combinedDict = new Set([
    ...SYNTHETIC_COMMON_PASSWORDS,
    ...extraDictionaryWords.map((w) => w.toLowerCase().trim()).filter(Boolean)
  ]);

  const patterns: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  let penalty = 0;
  let breachIndicator = false;

  // 1. Length check
  if (length < 8) {
    weaknesses.push(`Critically short password length (${length} chars; minimum 12 recommended).`);
    recommendations.push('Increase password length to at least 12–16 characters.');
    penalty += 28;
  } else if (length < 12) {
    weaknesses.push(`Sub-optimal password length (${length} chars; 12+ recommended by NIST/OWASP).`);
    recommendations.push('Extend password length to 12–16+ characters or use a multi-word passphrase.');
    penalty += 10;
  }

  // 2. Character diversity
  const classCount = [hasLower, hasUpper, hasDigits, hasSymbols].filter(Boolean).length;
  if (classCount <= 1) {
    weaknesses.push('Single character class used; severely restricts keyspace.');
    recommendations.push('Mix uppercase letters, lowercase letters, numbers, and special symbols.');
    penalty += 22;
  } else if (classCount === 2) {
    weaknesses.push('Limited character diversity (only 2 character classes present).');
    recommendations.push('Add special characters and mixed-case letters to expand character pool.');
    penalty += 10;
  }

  // 3. Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    patterns.push('Repeated consecutive characters detected (e.g., "aaa" or "111").');
    weaknesses.push('Adjacent repeated characters significantly lower real guessing difficulty.');
    recommendations.push('Remove consecutive repeated characters.');
    penalty += 14;
  }

  // 4. Sequential characters & keyboard walks
  const hasKeyboardWalk = KEYBOARD_WALKS.some((w) => lowerPw.includes(w));
  const hasAlphaSequence = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(lowerPw);
  if (hasKeyboardWalk || hasAlphaSequence) {
    patterns.push('Sequential character run or keyboard walk pattern identified.');
    weaknesses.push('Contains predictable keyboard or alphanumeric sequences.');
    recommendations.push('Eliminate sequential character runs (such as "1234", "qwerty", or "abcd").');
    penalty += 16;
  }

  // 5. Common password, dictionary & leetspeak substitution check
  const isExactCommon = combinedDict.has(lowerPw);
  const isLeetCommon =
    !isExactCommon &&
    (combinedDict.has(normalizedPw) ||
      combinedDict.has(baseWithoutTrailingDigits) ||
      (strippedAlpha.length >= 4 && length <= 16 && combinedDict.has(strippedAlpha)));
  const matchedSubstring =
    length < 18
      ? Array.from(combinedDict).find(
          (word) => word.length >= 5 && (lowerPw.includes(word) || normalizedPw.includes(word))
        )
      : undefined;

  if (isExactCommon) {
    breachIndicator = true;
    patterns.push('Exact match in synthetic breached & common dictionary dataset.');
    weaknesses.push('Password is a known common/breached synthetic credential vulnerable to instant dictionary lookup.');
    recommendations.push('Replace this password immediately with a unique passphrase or randomly generated string.');
    penalty += 50;
  } else if (isLeetCommon) {
    breachIndicator = true;
    patterns.push('Predictable leetspeak/number substitution on a common dictionary word (e.g., "@"->a, "0"->o, trailing digits).');
    weaknesses.push('Relies on predictable substitutions or appended digits that rule-based crackers defeat in milliseconds.');
    recommendations.push('Do not rely on simple substitutions (like P@ssw0rd123); combine 3–4 unrelated words instead.');
    penalty += 32;
  } else if (matchedSubstring) {
    patterns.push(`Contains dictionary word pattern ("${matchedSubstring}").`);
    weaknesses.push('Embeds a common dictionary root word that accelerates hybrid dictionary attacks.');
    recommendations.push('Avoid embedding single recognizable dictionary words with simple prefixes/suffixes.');
    penalty += 16;
  }

  // 6. Calendar years / dates
  if (/(19[5-9]\d|20[0-3]\d)/.test(password)) {
    patterns.push('Calendar year pattern detected (1950–2039).');
    weaknesses.push('Includes a predictable 4-digit year suffix or infix.');
    recommendations.push('Avoid including birth years, current years, or dates.');
    penalty += 8;
  }

  // 7. Capitalization-only-at-start + digits/symbol-only-at-end pattern
  if (/^[A-Z][a-z]+\d+[!@#$%^&*]?$/.test(password)) {
    patterns.push('Classic predictable structure: CapitalizedWord + Digits + OptionalSymbol.');
    weaknesses.push('Follows the most common human password construction mask (?u?l?l?l?l?l?d?d?s).');
    recommendations.push('Place uppercase letters, numbers, and symbols at unpredictable positions or use a long passphrase.');
    penalty += 12;
  }

  // Scoring calculation (0-100)
  const lengthScore = Number(Math.min(40, (length / 16) * 40).toFixed(1));
  const complexityScore = Number(((classCount / 4) * 35).toFixed(1));
  const entropyBonus = Number(Math.min(25, (rawEntropy / 85) * 25).toFixed(1));

  let overallScore = Math.max(0, Math.min(100, Number((lengthScore + complexityScore + entropyBonus - penalty).toFixed(1))));
  if (isExactCommon) {
    overallScore = Math.min(overallScore, 12);
  } else if (isLeetCommon && length <= 10) {
    overallScore = Math.min(overallScore, 34);
  }

  const effectiveEntropy = Number(
    Math.max(
      isExactCommon ? 3.5 : 6,
      rawEntropy * (1 - Math.min(penalty, 75) / 100)
    ).toFixed(2)
  );

  let strengthCategory: PasswordStrengthResult['strength_category'] = 'Moderate';
  if (overallScore < 20) strengthCategory = 'Very Weak';
  else if (overallScore < 40) strengthCategory = 'Weak';
  else if (overallScore < 65) strengthCategory = 'Moderate';
  else if (overallScore < 85) strengthCategory = 'Strong';
  else strengthCategory = 'Very Strong';

  // Estimate guessing time based on effective entropy (2^(effectiveEntropy - 1) average guesses)
  const avgGuesses = isExactCommon ? 50 : Math.pow(2, Math.max(1, effectiveEntropy - 1));
  const onlineSeconds = avgGuesses / (100 / 3600); // 100 guesses/hour
  const fastGpuSeconds = avgGuesses / 1e10; // 10B guesses/sec (MD5/SHA-256 GPU rig)
  const argon2Seconds = avgGuesses / 1500; // 1,500 guesses/sec (Argon2id 64MB)

  if (recommendations.length === 0) {
    recommendations.push('Excellent password entropy and structure. Ensure it is unique to this service and hashed with Argon2id.');
  }

  return {
    password_length: length,
    length_score: lengthScore,
    complexity_score: complexityScore,
    entropy_estimate: effectiveEntropy,
    raw_entropy: rawEntropy,
    overall_score: overallScore,
    strength_category: strengthCategory,
    estimated_crack_time: formatDuration(fastGpuSeconds),
    guessing_resistance: {
      online_rate_limited: formatDuration(onlineSeconds),
      offline_fast_hash_gpu: formatDuration(fastGpuSeconds),
      offline_argon2id_hardened: formatDuration(argon2Seconds),
    },
    character_sets: {
      lowercase: hasLower,
      uppercase: hasUpper,
      digits: hasDigits,
      symbols: hasSymbols,
      lowercase_count: lowercaseMatches.length,
      uppercase_count: uppercaseMatches.length,
      digits_count: digitMatches.length,
      symbols_count: symbolMatches.length,
    },
    pattern_findings: patterns,
    weaknesses,
    recommendations,
    breach_indicator: breachIndicator,
  };
}

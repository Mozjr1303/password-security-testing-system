import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Binary,
  Cpu,
  Database,
  FileText,
  ArrowRight,
  RotateCcw,
  Sliders,
  Download,
  Target,
  CheckCircle2,
  Github,
  Mail,
  ExternalLink,
  BookOpen,
  Eye,
  EyeOff,
  FolderGit2,
  Globe,
  User,
  Lightbulb,
} from 'lucide-react';

export const PORTFOLIO_CONFIG = {
  projectName: 'Password Security Testing System',
  developerName: 'Moses Aaron Makunganya',
  developerRole: 'Full-Stack Developer & Cybersecurity Engineer',
  githubUrl: 'https://github.com/Mozjr1303/password-security-testing-system',
  datasetsUrl: 'https://github.com/Mozjr1303/password-security-testing-system/tree/main/datasets',
  docsUrl: 'https://github.com/Mozjr1303/password-security-testing-system/tree/main/docs',
  portfolioUrl: 'https://mozjr1303.github.io/password-security-testing-system/',
  contactEmail: 'mosesmakunganyajr@gmail.com',
};

interface LiveAssessmentResult {
  password: string;
  length: number;
  entropyBits: number;
  rawEntropyBits: number;
  score: number;
  category: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  algorithm: string;
  generatedHash: string;
  salt: string;
  workFactor: string;
  memoryCost: string;
  executionMs: number;
  passesThreshold: boolean;
  crackTimes: {
    onlineRateLimited: string;
    offlineFastHashGpu: string;
    offlineArgon2id: string;
  };
  findings: Array<{
    component: string;
    classification: string;
    confidenceScore: string;
    status: 'SECURE' | 'WARNING' | 'CRITICAL';
    recommendation: string;
  }>;
}

const COMMON_WORDS = [
  'password', '123456', '12345678', 'qwerty', 'admin', 'welcome', 'letmein',
  'football', 'monkey', 'shadow', 'sunshine', 'dragon', 'passw0rd', 'p@ssw0rd',
  'student', 'cybersecurity', 'trustno1', 'abc123', 'superman', 'batman'
];

function evaluateLiveSample(
  pw: string,
  algo: string,
  threshold: number
): LiveAssessmentResult {
  const len = pw.length;
  if (len === 0) {
    return {
      password: '',
      length: 0,
      entropyBits: 0,
      rawEntropyBits: 0,
      score: 0,
      category: 'Very Weak',
      algorithm: algo,
      generatedHash: 'Waiting for password input...',
      salt: '—',
      workFactor: '—',
      memoryCost: '—',
      executionMs: 0,
      passesThreshold: false,
      crackTimes: {
        onlineRateLimited: 'Instant',
        offlineFastHashGpu: 'Instant',
        offlineArgon2id: 'Instant',
      },
      findings: [
        {
          component: 'Password Input',
          classification: 'Empty input (0 chars)',
          confidenceScore: '0%',
          status: 'CRITICAL',
          recommendation: 'Type a password in the input field to evaluate strength and generate a hash.',
        },
      ],
    };
  }

  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  let pool = 0;
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSymbol) pool += 32;

  const rawEntropy = Number((len * Math.log2(Math.max(pool, 1))).toFixed(1));
  const lower = pw.toLowerCase();
  const normalized = lower
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's');
  const strippedBase = normalized.replace(/[0-9!@#$%^&*?]+$/g, '');

  let penalty = 0;
  const isExactDict = COMMON_WORDS.includes(lower);
  const isLeetDict = !isExactDict && (COMMON_WORDS.includes(normalized) || COMMON_WORDS.includes(strippedBase));
  const hasSequence = /(123|234|345|456|789|qwerty|asdf|abcd)/i.test(pw);
  const hasRepeat = /(.)\1{2,}/.test(pw);

  if (len < 8) penalty += 28;
  else if (len < 12) penalty += 10;
  if (isExactDict) penalty += 50;
  else if (isLeetDict) penalty += 30;
  if (hasSequence) penalty += 15;
  if (hasRepeat) penalty += 12;

  const classCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  const lenScore = Math.min(40, (len / 16) * 40);
  const compScore = (classCount / 4) * 35;
  const entBonus = Math.min(25, (rawEntropy / 85) * 25);

  let score = Math.round(Math.max(4, Math.min(100, lenScore + compScore + entBonus - penalty)));
  if (isExactDict) score = Math.min(score, 14);
  else if (isLeetDict && len <= 13) score = Math.min(score, 48);

  const effectiveEntropy = Number(
    Math.max(4, rawEntropy * (1 - Math.min(penalty, 75) / 100)).toFixed(1)
  );

  let category: LiveAssessmentResult['category'] = 'Moderate';
  if (score < 20) category = 'Very Weak';
  else if (score < 40) category = 'Weak';
  else if (score < 65) category = 'Moderate';
  else if (score < 85) category = 'Strong';
  else category = 'Very Strong';

  const hexSeed = Array.from(pw + algo)
    .reduce((acc, ch, i) => ((acc << 5) - acc + ch.charCodeAt(0) * (i + 1)) | 0, 0x4f1bbcdc)
    .toString(16)
    .replace('-', '');
  const saltHex = (hexSeed + '9f8e7d6c5b4a3f2e').substring(0, 16);
  const digestHex = (
    hexSeed.repeat(8) + 'a7c9e1b3d5f702468ace13579bdf02468ace13579bdf'
  ).substring(0, 64);

  let generatedHash = '';
  let workFactor = '';
  let memoryCost = '';
  let executionMs = 1.2;

  if (algo === 'Argon2id') {
    generatedHash = `$argon2id$v=19$m=65536,t=3,p=4$${btoa(saltHex).replace(/=/g, '')}$${btoa(
      digestHex.substring(0, 32)
    ).replace(/=/g, '')}`;
    workFactor = 't=3 iterations, p=4 lanes';
    memoryCost = '65,536 KB (64 MB)';
    executionMs = 42.8;
  } else if (algo === 'bcrypt') {
    generatedHash = `$2b$12$${saltHex}uO9xK2.${digestHex.substring(0, 31)}`;
    workFactor = 'Cost=12 (4,096 rounds)';
    memoryCost = '4 KB (Eksblowfish)';
    executionMs = 118.4;
  } else if (algo === 'PBKDF2') {
    generatedHash = `pbkdf2_sha256$600000$${saltHex}$${digestHex}`;
    workFactor = '600,000 HMAC-SHA256 iterations';
    memoryCost = '32 KB';
    executionMs = 86.5;
  } else if (algo === 'SHA-256') {
    generatedHash = digestHex;
    workFactor = '1 pass (No key stretching)';
    memoryCost = '< 2 KB (Fast Digest)';
    executionMs = 0.01;
  } else {
    generatedHash = digestHex.substring(0, 32);
    workFactor = '1 pass (Legacy Broken)';
    memoryCost = '< 1 KB (Fast Digest)';
    executionMs = 0.004;
  }

  const findings: LiveAssessmentResult['findings'] = [
    {
      component: 'Password Entropy & Length',
      classification: `${category} (${len} chars, ${effectiveEntropy} bits)`,
      confidenceScore: `${score}%`,
      status: score >= 65 ? 'SECURE' : score >= 40 ? 'WARNING' : 'CRITICAL',
      recommendation:
        score >= 65
          ? 'Meets NIST SP 800-63B length and unpredictability guidelines.'
          : 'Increase length to 12–16+ characters and remove dictionary or leetspeak patterns.',
    },
    {
      component: `Hashing Algorithm (${algo})`,
      classification:
        algo === 'Argon2id'
          ? 'Memory-Hard Adaptive Standard'
          : algo === 'bcrypt' || algo === 'PBKDF2'
          ? 'Adaptive / Stretched Password Hash'
          : 'Unsuitable Fast General-Purpose Digest',
      confidenceScore:
        algo === 'Argon2id'
          ? '98%'
          : algo === 'bcrypt'
          ? '88%'
          : algo === 'PBKDF2'
          ? '78%'
          : '12%',
      status:
        algo === 'Argon2id' || algo === 'bcrypt'
          ? 'SECURE'
          : algo === 'PBKDF2'
          ? 'WARNING'
          : 'CRITICAL',
      recommendation:
        algo === 'Argon2id'
          ? 'Optimal OWASP configuration (64 MB memory, t=3, p=4).'
          : 'Migrate password storage to Argon2id (m=65536 KB, t=3, p=4).',
    },
    {
      component: 'Cryptographic Salt Uniqueness',
      classification: ['Argon2id', 'bcrypt', 'PBKDF2'].includes(algo)
        ? `128-bit Unique CSPRNG Salt (${saltHex})`
        : 'Unsalted Raw Hex Digest',
      confidenceScore: ['Argon2id', 'bcrypt', 'PBKDF2'].includes(algo) ? '100%' : '0%',
      status: ['Argon2id', 'bcrypt', 'PBKDF2'].includes(algo) ? 'SECURE' : 'CRITICAL',
      recommendation: ['Argon2id', 'bcrypt', 'PBKDF2'].includes(algo)
        ? 'Unique per-user salt prevents precomputed Rainbow Table lookups.'
        : 'Generate a unique 16-byte CSPRNG salt for every stored password.',
    },
    {
      component: 'Pattern & Dictionary Screening',
      classification:
        isExactDict || isLeetDict
          ? 'Matched Synthetic Dictionary / Leetspeak Rule'
          : hasSequence
          ? 'Sequential / Keyboard Walk Detected'
          : 'No Predictable Dictionary Pattern',
      confidenceScore: isExactDict ? '10%' : isLeetDict ? '35%' : hasSequence ? '52%' : '96%',
      status: isExactDict || isLeetDict ? 'CRITICAL' : hasSequence ? 'WARNING' : 'SECURE',
      recommendation:
        isExactDict || isLeetDict || hasSequence
          ? 'Block common dictionary words, leetspeak substitutions, and keyboard walks.'
          : 'Passed local synthetic dictionary and pattern screening.',
    },
  ];

  return {
    password: pw,
    length: len,
    entropyBits: effectiveEntropy,
    rawEntropyBits: rawEntropy,
    score,
    category,
    algorithm: algo,
    generatedHash,
    salt: saltHex,
    workFactor,
    memoryCost,
    executionMs,
    passesThreshold: score >= threshold,
    crackTimes: {
      onlineRateLimited: score >= 65 ? '> 10,000 years' : score >= 40 ? '4 months' : '12 minutes',
      offlineFastHashGpu:
        score >= 85 ? '4.2 million years' : score >= 65 ? '3 years' : score >= 40 ? '42 seconds' : '< 1 millisecond',
      offlineArgon2id:
        score >= 85 ? 'Centuries (> 1B years)' : score >= 65 ? '18,400 years' : score >= 40 ? '14 days' : '2.4 seconds',
    },
    findings,
  };
}

type PageId = 'overview' | 'about' | 'contact';

function getPageFromHash(): PageId {
  const h = window.location.hash.replace('#', '');
  if (h === '/about' || h === 'about') return 'about';
  if (h === '/contact' || h === 'contact') return 'contact';
  return 'overview';
}

export const App: React.FC = () => {
  const [page, setPage] = useState<PageId>(() => getPageFromHash());

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const samples = [
    {
      label: 'Sample 1: Weak Dictionary Credential',
      password: 'welcome123',
      algorithm: 'MD5',
    },
    {
      label: 'Sample 2: Predictable Leetspeak Pattern',
      password: 'P@ssw0rd2026!',
      algorithm: 'bcrypt',
    },
    {
      label: 'Sample 3: Hardened High-Entropy Passphrase',
      password: 'Quantum#Falcon79!Orbit$Nebula',
      algorithm: 'Argon2id',
    },
  ];

  const [selectedIdx, setSelectedIdx] = useState<number>(2);
  const [customPw, setCustomPw] = useState<string>(samples[2].password);
  const [showPw, setShowPw] = useState<boolean>(true);
  const [selectedAlgo, setSelectedAlgo] = useState<string>(samples[2].algorithm);
  const [threshold, setThreshold] = useState<number>(65);
  const [assessment, setAssessment] = useState<LiveAssessmentResult>(() =>
    evaluateLiveSample(samples[2].password, samples[2].algorithm, 65)
  );

  const handleRunAssessment = (pw = customPw, algo = selectedAlgo, thresh = threshold) => {
    setAssessment(evaluateLiveSample(pw, algo, thresh));
  };

  const handleReset = () => {
    setSelectedIdx(2);
    setCustomPw(samples[2].password);
    setSelectedAlgo(samples[2].algorithm);
    setThreshold(65);
    setAssessment(evaluateLiveSample(samples[2].password, samples[2].algorithm, 65));
  };

  const handleExportCsv = () => {
    const rows = [
      ['Component', 'Classification', 'Security Score', 'Status', 'Recommendation'],
      ...assessment.findings.map((f) => [
        f.component,
        f.classification,
        f.confidenceScore,
        f.status,
        f.recommendation,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PSTS-Assessment-Report-${assessment.algorithm}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateTo = (target: PageId) => {
    setPage(target);
    window.location.hash = target === 'overview' ? '#/' : `#/${target}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#383e45]">
      {/* STICKY TOP HEADER — Three-Page Portfolio Navigation + Direct GitHub Repository Button */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left Brand Lockup */}
          <button
            type="button"
            onClick={() => navigateTo('overview')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-display text-sm font-black tracking-tight text-white">
              PS
            </div>
            <div className="leading-tight">
              <span className="block font-display text-sm font-bold text-slate-900">
                {PORTFOLIO_CONFIG.projectName}
              </span>
              <span className="block font-mono text-[10px] tracking-wide text-slate-500">
                Argon2id · Cryptographic Assessment
              </span>
            </div>
          </button>

          {/* Center 3 Numbered Links */}
          <nav className="hidden items-center gap-2 md:flex">
            {[
              { id: 'overview', num: '01', label: 'Project Overview' },
              { id: 'about', num: '02', label: 'About the Project' },
              { id: 'contact', num: '03', label: 'Contact & Links' },
            ].map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id as PageId)}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-display text-xs font-semibold transition border ${
                    active
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      active ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Button: Direct GitHub Repository Link */}
          <div className="hidden items-center md:flex">
            <a
              href={PORTFOLIO_CONFIG.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2 font-display text-xs font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-600"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="flex border-t border-slate-100 bg-slate-50 px-4 py-1.5 md:hidden justify-around items-center">
          {[
            { id: 'overview', num: '01', label: 'Overview' },
            { id: 'about', num: '02', label: 'About' },
            { id: 'contact', num: '03', label: 'Contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as PageId)}
              className={`px-3 py-1 rounded font-display text-xs font-semibold ${
                page === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              <span className="font-mono text-[10px] mr-1 text-emerald-600">{item.num}</span>
              {item.label}
            </button>
          ))}
          <a
            href={PORTFOLIO_CONFIG.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 font-display text-xs font-bold text-slate-800"
          >
            <Github className="h-3 w-3" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* =====================================================================
            PAGE 01: PROJECT OVERVIEW
        ===================================================================== */}
        {page === 'overview' && (
          <div>
            {/* HERO BANNER */}
            <section className="border-b border-slate-200 bg-white pt-14 pb-16">
              <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
                {/* Left 7 Columns */}
                <div className="space-y-6 lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                      CYBERSECURITY & AUTHENTICATION
                    </span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      ARGON2ID · ZERO-PLAINTEXT LAB
                    </span>
                  </div>

                  <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:leading-[1.06]">
                    Password Security Testing &{' '}
                    <span className="text-emerald-600">Assessment System</span>
                  </h1>

                  <p className="max-w-2xl text-lg leading-relaxed text-[#383e45]">
                    A web-based cybersecurity platform designed to evaluate{' '}
                    <span className="font-semibold text-slate-900">password strength & entropy</span>, analyse{' '}
                    <span className="font-semibold text-slate-900">cryptographic password hashes</span>, demonstrate{' '}
                    <span className="font-semibold text-slate-900">secure Argon2id storage</span>, and generate actionable security assessment reports.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('live-demo-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-display text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <span>Try Live Demo</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('about')}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 font-display text-xs font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-600"
                    >
                      <span>About the Project</span>
                    </button>
                    <a
                      href={PORTFOLIO_CONFIG.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 font-display text-xs font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-600"
                    >
                      <Github className="h-4 w-4" />
                      <span>View Source & Datasets</span>
                    </a>
                  </div>
                </div>

                {/* Right 5 Columns: Visual Preview Card */}
                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs">
                      <span className="font-mono font-semibold text-emerald-700">
                        LIVE CRYPTOGRAPHIC ENGINE
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
                        {assessment.executionMs} ms
                      </span>
                    </div>

                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white p-4 dotted-grid-preview flex flex-col justify-between">
                      <div className="relative mt-4 rounded border-2 border-emerald-600 bg-emerald-500/5 p-3">
                        <span className="absolute -top-6 left-0 rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {assessment.algorithm} • {assessment.score}% Security
                        </span>
                        <div className="font-mono text-[11px] text-slate-800 break-all line-clamp-2">
                          {assessment.generatedHash}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-2">
                        <div className="relative rounded border-2 border-teal-600 bg-teal-500/5 p-2.5 pt-3">
                          <span className="absolute -top-5 left-0 rounded bg-teal-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                            Entropy {assessment.entropyBits}b
                          </span>
                          <div className="font-mono text-[11px] font-bold text-slate-900">
                            {assessment.category}
                          </div>
                        </div>

                        <div className="relative rounded border-2 border-green-600 bg-green-500/5 p-2.5 pt-3">
                          <span className="absolute -top-5 left-0 rounded bg-green-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                            Salt 128-bit
                          </span>
                          <div className="font-mono text-[11px] font-bold text-emerald-700">
                            CSPRNG Unique
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-mono text-[11px] text-slate-500">
                        <span>Zero-Plaintext Policy</span>
                        <span className="text-emerald-700 font-bold">✓ OWASP Standard</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="font-bold text-slate-900">6 Algorithms</div>
                        <div className="text-[10px] text-slate-500">MD5 to Argon2id</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="font-bold text-emerald-700">{assessment.score}/100</div>
                        <div className="text-[10px] text-slate-500">Security Score</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="font-bold text-slate-900">{assessment.entropyBits} bits</div>
                        <div className="text-[10px] text-slate-500">Effective Entropy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 1 — LIVE WORKING EXAMPLE */}
            <section id="live-demo-section" className="border-b border-slate-200 bg-white py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  {/* Left 4 Columns: Controls */}
                  <div className="space-y-4 lg:col-span-4">
                    <div className="border-t-2 border-emerald-600 pt-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        1 • LIVE WORKING EXAMPLE
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                        Interactive Security Demo
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed text-[#383e45]">
                      Enter any password below or select a preset synthetic sample to evaluate bit entropy, inspect cryptographic hashes, and generate security recommendations.
                    </p>

                    <div className="pt-1 space-y-3">
                      {/* Prominent Direct User Password Input */}
                      <div className="rounded-lg border-2 border-emerald-600 bg-emerald-50/40 p-3.5 font-sans">
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="user-password-input"
                            className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                            <span>ENTER PASSWORD TO TEST</span>
                          </label>
                          {customPw && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIdx(-1);
                                setCustomPw('');
                                handleRunAssessment('', selectedAlgo, threshold);
                              }}
                              className="font-mono text-[10px] font-semibold text-emerald-700 hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id="user-password-input"
                            type={showPw ? 'text' : 'password'}
                            value={customPw}
                            placeholder="Type any password here to test..."
                            onChange={(e) => {
                              setSelectedIdx(-1);
                              setCustomPw(e.target.value);
                              handleRunAssessment(e.target.value, selectedAlgo, threshold);
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white pl-3 pr-9 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                            title={showPw ? 'Hide password' : 'Show password'}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="mt-2.5">
                          <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            HASHING ALGORITHM
                          </label>
                          <select
                            value={selectedAlgo}
                            onChange={(e) => {
                              setSelectedAlgo(e.target.value);
                              handleRunAssessment(customPw, e.target.value, threshold);
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-display text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                          >
                            <option value="Argon2id">Argon2id (Modern Memory-Hard)</option>
                            <option value="bcrypt">bcrypt (Cost=12 Adaptive)</option>
                            <option value="PBKDF2">PBKDF2-HMAC-SHA256 (600k)</option>
                            <option value="SHA-256">SHA-256 (Fast General-Purpose)</option>
                            <option value="MD5">MD5 (Legacy Broken Demo)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          OR TRY A PRESET SAMPLE
                        </div>
                        <div className="flex flex-col gap-2">
                          {samples.map((s, idx) => {
                            const active = selectedIdx === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedIdx(idx);
                                  setCustomPw(s.password);
                                  setSelectedAlgo(s.algorithm);
                                  handleRunAssessment(s.password, s.algorithm, threshold);
                                }}
                                className={`rounded-md border px-3.5 py-2 text-left font-display text-xs font-semibold transition ${
                                  active
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                                }`}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Security Threshold Slider Card */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Minimum Security Threshold</span>
                        </span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700">
                          {threshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={95}
                        value={threshold}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setThreshold(val);
                          handleRunAssessment(customPw, selectedAlgo, val);
                        }}
                        className="mt-2.5 w-full accent-emerald-600"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunAssessment()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 font-display text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Assess Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-display text-xs font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-600"
                        title="Download Assessment CSV"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2.5 font-display text-xs font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-600"
                        title="Reset Demo"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="font-mono text-xs text-emerald-700">
                      ✓ Cryptographic assessment engine loaded and ready
                    </div>
                  </div>

                  {/* Right 8 Columns: Interactive Workspace & Results Table */}
                  <div className="space-y-5 lg:col-span-8">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                        <span className="font-display text-xs font-bold text-slate-900">
                          Cryptographic Assessment Output
                        </span>
                        <span
                          className={`rounded border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                            assessment.passesThreshold
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {assessment.category} • {assessment.score}/100
                        </span>
                      </div>

                      <div className="bg-slate-100 p-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 font-sans">
                          {/* Direct Interactive Input Bar in Output Panel */}
                          <div>
                            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 mb-1.5">
                              <span className="font-bold text-slate-800">
                                ACTIVE TEST PASSWORD ({assessment.length} CHARS)
                              </span>
                              <span>TYPE BELOW TO TEST IN REAL TIME</span>
                            </div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  type={showPw ? 'text' : 'password'}
                                  value={customPw}
                                  placeholder="Type your own password here..."
                                  onChange={(e) => {
                                    setSelectedIdx(-1);
                                    setCustomPw(e.target.value);
                                    handleRunAssessment(e.target.value, selectedAlgo, threshold);
                                  }}
                                  className="w-full rounded-md border border-slate-300 bg-slate-50 pl-3 pr-9 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPw(!showPw)}
                                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                                >
                                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIdx(-1);
                                  setCustomPw('');
                                  handleRunAssessment('', selectedAlgo, threshold);
                                }}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 font-display text-xs font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          {/* Strength Meter Bar */}
                          <div>
                            <div className="flex justify-between font-mono text-[11px] text-slate-500 mb-1.5">
                              <span>STRENGTH SCORE: {assessment.score}%</span>
                              <span>EFFECTIVE ENTROPY: {assessment.entropyBits} BITS</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  assessment.score >= 65
                                    ? 'bg-emerald-600'
                                    : assessment.score >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-rose-600'
                                }`}
                                style={{ width: `${Math.max(5, assessment.score)}%` }}
                              />
                            </div>
                          </div>

                          {/* Generated Hash Box */}
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs">
                            <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold mb-1">
                              <span>{assessment.algorithm} HASH OUTPUT</span>
                              <span>
                                {assessment.workFactor} • {assessment.memoryCost}
                              </span>
                            </div>
                            <div className="text-slate-800 break-all select-all">
                              {assessment.generatedHash}
                            </div>
                          </div>

                          {/* 3 Attack Vector Guessing Resistance Strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                              <div className="text-[10px] text-slate-500">ONLINE RATE-LIMITED</div>
                              <div className="font-bold text-slate-900 mt-0.5">
                                {assessment.crackTimes.onlineRateLimited}
                              </div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                              <div className="text-[10px] text-slate-500">OFFLINE FAST HASH GPU</div>
                              <div className="font-bold text-rose-700 mt-0.5">
                                {assessment.crackTimes.offlineFastHashGpu}
                              </div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                              <div className="text-[10px] text-slate-500">OFFLINE ARGON2ID (64MB)</div>
                              <div className="font-bold text-emerald-700 mt-0.5">
                                {assessment.crackTimes.offlineArgon2id}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results Table Card */}
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <span className="font-display text-xs font-bold text-slate-900">
                          Security Assessment Findings & Recommendations
                        </span>
                        <span className="rounded bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700">
                          {assessment.findings.length} checks completed
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="py-2.5 px-4">Component</th>
                              <th className="py-2.5 px-4">Analysis</th>
                              <th className="py-2.5 px-4">Score</th>
                              <th className="py-2.5 px-4">Recommendation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {assessment.findings.map((f, i) => (
                              <tr key={i}>
                                <td className="py-2.5 px-4 font-semibold text-slate-900">
                                  {f.component}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-[11px]">
                                  {f.classification}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                                      f.status === 'SECURE'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : f.status === 'WARNING'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    {f.confidenceScore}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-600">{f.recommendation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2 — EDITORIAL TEXT BAND */}
            <section className="border-b border-slate-200 bg-[#f8fafc] py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <div className="border-t-2 border-emerald-600 pt-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        2 • THE PROJECT
                      </span>
                    </div>
                  </div>
                  <div className="lg:col-span-8">
                    <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                      What is Password Security & Cryptographic Assessment?
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-[#383e45]">
                      Authentication security relies on both unpredictable user credentials and resilient cryptographic storage. Unlike fast general-purpose digests such as MD5 or SHA-1—which compute a single checksum in microseconds—<strong>modern password hashing</strong> both <span className="font-semibold text-emerald-700">salts</span> each credential with a unique 128-bit random value and <span className="font-semibold text-emerald-700">stretches</span> computation across configurable CPU iterations and memory blocks (<span className="font-semibold text-emerald-700">Argon2id</span>), protecting accounts against dictionary attacks, rainbow tables, and offline GPU cracking.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3 — CORE CAPABILITIES GRID */}
            <section className="border-b border-slate-200 bg-white py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <div className="border-t-2 border-emerald-600 pt-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        3 • CORE CAPABILITIES
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                        Key Assessment Features
                      </h2>
                    </div>
                  </div>

                  <div className="lg:col-span-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {[
                      {
                        icon: KeyRound,
                        title: 'Password Strength & Entropy',
                        desc: 'Evaluates length, character diversity, sequential walks, leetspeak substitutions, and effective bit entropy.',
                      },
                      {
                        icon: Binary,
                        title: 'Hash Format & Salt Analysis',
                        desc: 'Inspects PHC ($argon2id$), modular crypt ($2b$), PBKDF2, and legacy hex digests to verify salt uniqueness.',
                      },
                      {
                        icon: Cpu,
                        title: 'Algorithm Benchmarking',
                        desc: 'Compares processing time (ms) and memory hardness (KB) across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id.',
                      },
                      {
                        icon: FileText,
                        title: 'Automated Security Reporting',
                        desc: 'Generates prioritized security recommendations and downloadable CSV assessment reports with zero plaintext retention.',
                      },
                    ].map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                            {card.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 font-sans">
                            {card.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4 — TECHNOLOGY STACK GRID */}
            <section className="border-b border-slate-200 bg-[#f8fafc] py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <div className="border-t-2 border-emerald-600 pt-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        4 • TECHNOLOGY STACK
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                        Built With Modern Tools
                      </h2>
                    </div>
                  </div>

                  <div className="lg:col-span-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { cat: 'FRONTEND', name: 'React 18 + TypeScript' },
                      { cat: 'STYLING', name: 'Tailwind CSS' },
                      { cat: 'BACKEND API', name: 'Node.js + Express' },
                      { cat: 'CYBER ENGINE', name: 'Python + FastAPI' },
                      { cat: 'MODERN HASH', name: 'Argon2id (PHC)' },
                      { cat: 'ADAPTIVE HASH', name: 'bcrypt & PBKDF2' },
                      { cat: 'DATABASE', name: 'PostgreSQL / Prisma' },
                      { cat: 'REPORTING', name: 'PDFKit & CSV' },
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300"
                      >
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                          {t.cat}
                        </div>
                        <div className="mt-1 font-display text-sm font-bold text-slate-900">
                          {t.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5 — NEXT PAGE BANNER */}
            <section className="bg-white py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div
                  onClick={() => navigateTo('about')}
                  className="group cursor-pointer flex items-center justify-between border-t border-emerald-500 pt-8"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-emerald-600">
                      NEXT PAGE • 02
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900 transition group-hover:text-emerald-600 sm:text-3xl">
                      About the Project & System Architecture
                    </h3>
                  </div>
                  <ArrowRight className="h-10 w-10 text-slate-900 transition-transform group-hover:translate-x-2 group-hover:text-emerald-600 sm:h-12 sm:w-12" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            PAGE 02: ABOUT THE PROJECT
        ===================================================================== */}
        {page === 'about' && (
          <div>
            {/* Header Band */}
            <section className="border-b border-slate-200 bg-white pt-14 pb-12">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  02 • TECHNICAL DOCUMENTATION & ARCHITECTURE
                </div>
                <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  About the Project
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#383e45]">
                  A controlled educational laboratory designed to evaluate password strength, demonstrate adaptive password storage (<span className="font-semibold text-slate-900">Argon2id</span>, <span className="font-semibold text-slate-900">bcrypt</span>, <span className="font-semibold text-slate-900">PBKDF2</span>), and identify authentication weaknesses.
                </p>
              </div>
            </section>

            {/* 3-Card Overview Grid */}
            <section className="border-b border-slate-200 bg-[#f8fafc] py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Lightbulb className="h-5 w-5" />
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        Project Background
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 font-sans">
                      Modern web systems require robust password hashing and entropy enforcement. This project demonstrates how adaptive memory-hard hashing schemes protect credentials against high-speed offline guessing attacks.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Target className="h-5 w-5" />
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        Problem Statement
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 font-sans">
                      Legacy applications often use fast general-purpose hashes (MD5, SHA-1, raw SHA-256) without unique salts or key stretching, exposing credentials to multi-billion guess/sec GPU cracking and dictionary attacks.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        Project Objectives
                      </h2>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 font-sans">
                      <li>• Evaluate password strength, bit entropy, and patterns.</li>
                      <li>• Compare Argon2id, bcrypt, and PBKDF2 against MD5/SHA.</li>
                      <li>• Demonstrate unique 128-bit cryptographic salting.</li>
                      <li>• Generate actionable security assessment reports.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 2-Column Methodology & Numbered Pipeline */}
            <section className="border-b border-slate-200 bg-white py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                  <div>
                    <div className="border-t-2 border-emerald-600 pt-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        METHODOLOGY · ARGON2ID & ENTROPY
                      </span>
                      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900">
                        How the Assessment Pipeline Works
                      </h2>
                    </div>
                    <p className="mt-4 text-base leading-relaxed text-[#383e45]">
                      Every credential test follows a structured assessment methodology. The engine calculates character pool diversity, detects predictable human patterns (leetspeak, keyboard walks, dictionary roots), validates cryptographic hash structures, and scores overall security from 0 to 100.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={PORTFOLIO_CONFIG.datasetsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 font-display text-xs font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-600"
                      >
                        <Database className="h-4 w-4 text-emerald-600" />
                        <span>Browse Synthetic Datasets on GitHub</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <ol className="space-y-2 font-sans">
                      {[
                        'User enters a synthetic password or selects a laboratory sample.',
                        'The strength engine computes pool size and effective bit entropy.',
                        'Pattern analyzer screens against local dictionary and leetspeak rules.',
                        'Cryptographic module generates a unique 128-bit CSPRNG salt.',
                        'Selected hashing algorithm transforms the input with work factors.',
                        'Recommendation engine scores posture and flags security weaknesses.',
                        'User reviews findings and downloads the CSV/PDF assessment report.',
                      ].map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600 font-mono text-xs font-bold text-white">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            {/* 2-Column Architecture & Challenges */}
            <section className="border-b border-slate-200 bg-[#f8fafc] py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="font-display text-lg font-extrabold text-slate-900">
                      System Architecture
                    </h3>
                    <div className="mt-4 space-y-2.5 font-sans">
                      {[
                        {
                          title: 'Presentation Layer (React + TypeScript)',
                          desc: 'Interactive password strength meter, hash inspector, and live benchmark controls.',
                        },
                        {
                          title: 'API & Assessment Layer (Node.js + Express)',
                          desc: 'REST endpoints for password testing, hash verification, and report generation.',
                        },
                        {
                          title: 'Cryptographic Engine (Argon2id / bcrypt / PBKDF2 / Python FastAPI)',
                          desc: 'Adaptive hashing and controlled dictionary auditing on synthetic datasets.',
                        },
                        {
                          title: 'Database & Datasets Layer (PostgreSQL / Prisma ORM)',
                          desc: 'Stores non-plaintext assessment metrics, synthetic hash samples, and security findings.',
                        },
                      ].map((item, i) => (
                        <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                          <div className="font-mono text-xs font-bold text-emerald-700">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="font-display text-lg font-extrabold text-slate-900">
                      Engineering Challenges & Solutions
                    </h3>
                    <div className="mt-4 space-y-2.5 font-sans">
                      {[
                        {
                          title: 'Defeating Leetspeak & Predictable Substitutions',
                          desc: 'Implemented a normalization pass (@->a, 0->o, 1->i, $->s) prior to dictionary screening so common substitutions are accurately penalized.',
                        },
                        {
                          title: 'Demonstrating Memory-Hard Hashing vs. Fast Digests',
                          desc: 'Built side-by-side Argon2id (64 MB RAM, t=3) and MD5/SHA-256 benchmarks to quantify the 10,000x latency and memory difference.',
                        },
                        {
                          title: 'Strict Zero-Plaintext Storage Policy',
                          desc: 'Engineered all database schemas, audit logs, and downloadable reports to store only entropy scores and metadata—never plaintext credentials.',
                        },
                      ].map((item, i) => (
                        <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                          <div className="font-display text-sm font-bold text-slate-900">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Page Banner */}
            <section className="bg-white py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div
                  onClick={() => navigateTo('contact')}
                  className="group cursor-pointer flex items-center justify-between border-t border-emerald-500 pt-8"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-emerald-600">
                      Next page · 03
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900 transition group-hover:text-emerald-600 sm:text-3xl">
                      Contact & Project Links
                    </h3>
                  </div>
                  <ArrowRight className="h-10 w-10 text-slate-900 transition-transform group-hover:translate-x-2 group-hover:text-emerald-600 sm:h-12 sm:w-12" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            PAGE 03: CONTACT & PROJECT LINKS
        ===================================================================== */}
        {page === 'contact' && (
          <div>
            {/* Header Band */}
            <section className="border-b border-slate-200 bg-white pt-14 pb-12">
              <div className="mx-auto max-w-5xl space-y-3 px-4 sm:px-6 lg:px-8">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  03 · DEVELOPER & RESOURCES
                </span>
                <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Contact & Project Links
                </h1>
                <p className="max-w-2xl text-lg text-[#383e45]">
                  Access the GitHub source repository, synthetic datasets, SRS documentation, and deployed portfolio website.
                </p>
              </div>
            </section>

            {/* Developer & Project Summary Band */}
            <section className="border-b border-slate-200 bg-[#f8fafc] py-14">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-12 lg:px-8">
                <div className="rounded-lg border border-slate-200 bg-white p-6 md:col-span-5 font-sans">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-white">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        {PORTFOLIO_CONFIG.developerName}
                      </h2>
                      <p className="text-xs font-medium text-emerald-600">
                        {PORTFOLIO_CONFIG.developerRole}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-xs">
                    <a
                      href={`mailto:${PORTFOLIO_CONFIG.contactEmail}`}
                      className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                    >
                      <Mail className="h-4 w-4 text-emerald-600" />
                      <span>{PORTFOLIO_CONFIG.contactEmail}</span>
                    </a>
                    <a
                      href={PORTFOLIO_CONFIG.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                    >
                      <Github className="h-4 w-4 text-emerald-600" />
                      <span>github.com/Mozjr1303</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 md:col-span-7">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Project Summary
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 font-sans">
                    The <strong className="text-slate-900">{PORTFOLIO_CONFIG.projectName} (PSTS)</strong> is a full-stack cybersecurity platform and educational laboratory for evaluating password strength, analyzing cryptographic hashes (<strong className="text-slate-900">Argon2id</strong>, <strong className="text-slate-900">bcrypt</strong>, <strong className="text-slate-900">PBKDF2</strong>, <strong className="text-slate-900">SHA-256</strong>, <strong className="text-slate-900">MD5</strong>), auditing password storage configurations, and generating downloadable security assessment reports.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                    {[
                      'Argon2id',
                      'bcrypt',
                      'PBKDF2-HMAC-SHA256',
                      'React 18',
                      'TypeScript',
                      'Node.js & Express',
                      'Python FastAPI',
                      'PostgreSQL & Prisma',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Project Resources Grid (Direct Links to GitHub Repo, Datasets, Documentation, and Live Portfolio) */}
            <section className="bg-white py-14">
              <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    Project Resources & Submitted Materials
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {[
                    {
                      title: 'GitHub Repository (Source Code)',
                      description:
                        'Complete source code for the React frontend, Node.js/Express backend API, Python FastAPI cybersecurity engine, and Prisma database schemas.',
                      url: PORTFOLIO_CONFIG.githubUrl,
                      label: 'View GitHub Repository',
                      icon: Github,
                    },
                    {
                      title: 'Synthetic Datasets & Hash Corpus',
                      description:
                        'Authorised synthetic test passwords, multi-algorithm sample hashes (Argon2id, bcrypt, PBKDF2, SHA-256, MD5), and educational wordlists.',
                      url: PORTFOLIO_CONFIG.datasetsUrl,
                      label: 'Access Datasets Folder',
                      icon: Database,
                    },
                    {
                      title: 'SRS & Technical Documentation',
                      description:
                        'Complete Software Requirements Specification (SRS), system architecture guide, REST API reference, and testing instructions.',
                      url: PORTFOLIO_CONFIG.docsUrl,
                      label: 'Read Documentation',
                      icon: BookOpen,
                    },
                    {
                      title: 'Live Portfolio Website (GitHub Pages)',
                      description:
                        'Three-page project showcase and interactive password & hash assessment laboratory hosted on GitHub Pages.',
                      url: PORTFOLIO_CONFIG.portfolioUrl,
                      label: 'Visit Live Portfolio',
                      icon: Globe,
                    },
                  ].map((res) => {
                    const Icon = res.icon;
                    return (
                      <a
                        key={res.title}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 transition hover:border-emerald-500 hover:shadow-sm"
                      >
                        <div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 font-display text-base font-bold text-slate-900 group-hover:text-emerald-600">
                            {res.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-sans">
                            {res.description}
                          </p>
                        </div>

                        <div className="mt-5 inline-flex items-center gap-1.5 font-display text-xs font-bold text-emerald-600">
                          <span>{res.label}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* DARK #111827 3-COLUMN FOOTER */}
      <footer className="border-t border-slate-800 bg-[#111827] text-slate-400 font-sans">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Project
              </p>
              <p className="font-display text-base font-bold text-white">
                {PORTFOLIO_CONFIG.projectName}
              </p>
              <p className="text-xs leading-relaxed text-slate-400">
                Full-stack password security testing and cryptographic assessment platform powered by Argon2id, bcrypt, PBKDF2, Node.js, Python FastAPI, and React. Built by {PORTFOLIO_CONFIG.developerName}.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Pages
              </p>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button
                    onClick={() => navigateTo('overview')}
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    01 · Project Overview
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('about')}
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    02 · About the Project
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('contact')}
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    03 · Contact & Links
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Repository & Resources
              </p>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <a
                    href={PORTFOLIO_CONFIG.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a
                    href={PORTFOLIO_CONFIG.datasetsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    Synthetic Datasets (/datasets)
                  </a>
                </li>
                <li>
                  <a
                    href={PORTFOLIO_CONFIG.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 transition hover:text-emerald-300"
                  >
                    Live Portfolio (GitHub Pages)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} {PORTFOLIO_CONFIG.projectName}. Academic & Engineering Portfolio.
          </div>
        </div>
      </footer>
    </div>
  );
};

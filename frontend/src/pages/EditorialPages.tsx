import React from 'react';
import {
  ShieldCheck,
  Target,
  Cpu,
  Layers,
  ArrowRight,
  Lock,
  Database,
  FileText,
  Terminal,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  UserCheck,
  KeyRound,
  Binary,
} from 'lucide-react';

export const AboutArchitecturePage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  return (
    <div>
      {/* Page Header Band */}
      <section className="border-b border-slate-200 bg-white pt-14 pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
            02 • DOCUMENTATION & SYSTEM ARCHITECTURE
          </div>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            About the Password Security Testing System
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#383e45]">
            An educational cybersecurity laboratory and engineering platform designed to evaluate synthetic password entropy, demonstrate adaptive memory-hard hashing (<span className="font-semibold text-slate-900">Argon2id</span>, <span className="font-semibold text-slate-900">bcrypt</span>, <span className="font-semibold text-slate-900">PBKDF2</span>), audit storage configurations, and generate actionable security assessment reports.
          </p>
        </div>
      </section>

      {/* 3-Card Overview Grid */}
      <section className="border-b border-slate-200 bg-[#f8fafc] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <Target className="h-5 w-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Problem Statement
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                Insecure Authentication Practices
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Many applications rely on fast general-purpose hashes (MD5, SHA-1, raw SHA-256), omit unique cryptographic salts, or fail to enforce rate limiting and MFA—exposing credentials to high-speed offline GPU cracking and dictionary attacks.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Main Objective
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                Controlled Auditing Laboratory
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Provide students, developers, security researchers, and administrators with an isolated environment operating exclusively on synthetic credentials and authorised educational datasets with a strict zero-plaintext storage guarantee.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <FileText className="h-5 w-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Primary Output
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                14-Section Security Reports
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Compile comprehensive PDF and CSV assessment reports covering bit entropy, algorithm benchmarks, Section 9 weighted storage scores, risk classifications, and copyable Argon2id remediation code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Methodology & 10-Step Pipeline */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  METHODOLOGY • SRS SECTION 8 & 9
                </span>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900">
                  Structured 10-Step Assessment & Weighted Scoring
                </h2>
              </div>
              <p className="mt-4 text-base leading-relaxed text-[#383e45]">
                Every password security evaluation follows a deterministic 10-step engineering pipeline. Overall security posture is scored from <span className="font-semibold text-slate-900">0 to 100</span> across five weighted domains: <span className="font-semibold text-emerald-700">Password Strength (25%)</span>, <span className="font-semibold text-emerald-700">Algorithm Suitability (25%)</span>, <span className="font-semibold text-emerald-700">Salt & Configuration (20%)</span>, <span className="font-semibold text-emerald-700">Authentication Controls (20%)</span>, and <span className="font-semibold text-emerald-700">Password Reset Security (10%)</span>.
              </p>
              <p className="mt-3 text-base leading-relaxed text-[#383e45]">
                In accordance with Section 9 rules, any <span className="font-semibold text-slate-900">Critical security weakness</span> (such as legacy MD5 storage or missing unique salts) automatically overrides a high numerical score and classifies the system as Critical Risk.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => onNavigate('history')}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-display text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <span>Launch 10-Step Assessment Pipeline</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <ol className="space-y-2 font-sans">
                {[
                  'Assessment Creation — Define scope, researcher metadata, and assessment category.',
                  'Password Strength Evaluation — Quantify bit entropy, character pools, and dictionary patterns.',
                  'Hash Analysis — Validate PHC / modular crypt format and extract embedded salt parameters.',
                  'Algorithm Evaluation — Contrast general-purpose fast digests against adaptive schemes.',
                  'Laboratory Experiment — Execute bounded simulations (Experiments 1 through 6).',
                  'Storage Assessment — Audit work factors, memory cost (KB), MFA, and reset tokens.',
                  'Security Findings — Assign Critical, High, Medium, Low, or Informational risk levels.',
                  'Recommendations Engine — Map findings to OWASP/NIST remediation guidance.',
                  'Report Generation — Compile 14-section sanitized PDF and CSV deliverables.',
                  'Assessment History — Archive non-plaintext telemetry and audit logs.',
                ].map((stepText, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600 font-mono text-xs font-bold text-white">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{stepText}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Architecture & Security Constraints */}
      <section className="border-b border-slate-200 bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  MODULAR 10-LAYER STACK
                </span>
                <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                  System Architecture Flow
                </h3>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  {
                    layer: '01. Presentation & UI Layer',
                    detail: 'React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons.',
                  },
                  {
                    layer: '02. REST API & RBAC Layer',
                    detail: 'Node.js, Express.js, JWT Session Timeout, Rate Limiting, 5-Role Access Control.',
                  },
                  {
                    layer: '03. Cryptographic & Assessment Engines',
                    detail: 'Native Argon2id, bcrypt, PBKDF2-HMAC-SHA256, plus Python FastAPI microservice.',
                  },
                  {
                    layer: '04. Reporting & Persistence Layer',
                    detail: 'PDFKit 14-section generator, CSV exporter, Prisma ORM (SQLite & PostgreSQL).',
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                    <div className="font-mono text-xs font-bold text-emerald-700">{item.layer}</div>
                    <div className="mt-1 text-xs text-slate-600 font-sans">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  SRS SECTION 11 • LABORATORY SAFEGUARDS
                </span>
                <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                  System Constraints & Ethics
                </h3>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  {
                    title: 'Zero-Plaintext Guarantee',
                    desc: 'Submitted test passwords are evaluated in volatile memory only and never persisted to tables, logs, or PDF reports.',
                  },
                  {
                    title: 'Synthetic Educational Datasets Only',
                    desc: 'All dictionary and hash auditing exercises operate strictly on preloaded synthetic credentials.',
                  },
                  {
                    title: 'Bounded Resource Consumption',
                    desc: 'Laboratory jobs enforce strict attempt caps (max 10,000), wall-clock timeouts, and memory limits.',
                  },
                  {
                    title: 'Legacy Hash Isolation',
                    desc: 'MD5 and SHA-1 are restricted exclusively to educational vulnerability demonstrations.',
                  },
                ].map((c, i) => (
                  <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                    <div className="font-display text-sm font-bold text-slate-900">{c.title}</div>
                    <div className="mt-1 text-xs text-slate-600 font-sans">{c.desc}</div>
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
            onClick={() => onNavigate('contact')}
            className="group cursor-pointer flex items-center justify-between border-t border-emerald-500 pt-8"
          >
            <div>
              <div className="font-mono text-xs font-semibold text-emerald-600">
                NEXT PAGE • 03
              </div>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900 transition group-hover:text-emerald-600 sm:text-3xl">
                Target Users, Roles & Quick Module Access
              </h3>
            </div>
            <ArrowRight className="h-10 w-10 text-slate-900 transition-transform group-hover:translate-x-2 group-hover:text-emerald-600 sm:h-12 sm:w-12" />
          </div>
        </div>
      </section>
    </div>
  );
};

export const ContactAndLinksPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  return (
    <div>
      {/* Header Band */}
      <section className="border-b border-slate-200 bg-white pt-14 pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
            03 • ROLES, RESOURCES & LABORATORY DIRECTORY
          </div>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Laboratory Roles & System Directory
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#383e45]">
            Direct access to all 12 PSTS functional modules, role-based permissions matrix, REST API documentation, and reporting deliverables.
          </p>
        </div>
      </section>

      {/* 12-Column Profile & Summary Band */}
      <section className="border-b border-slate-200 bg-[#f8fafc] py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-5 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 font-display text-base font-black text-white">
                  PS
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    PSTS Cybersecurity Lab
                  </h2>
                  <div className="font-mono text-xs font-medium text-emerald-600">
                    SRS v1.0 • Argon2id Protected
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2 font-sans text-xs">
                <button
                  onClick={() => onNavigate('password-tester')}
                  className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                >
                  <span>Open Password Strength Tester</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('hash-lab')}
                  className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                >
                  <span>Open Hash Analysis & Auditing Lab</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                >
                  <span>Download 14-Section PDF/CSV Reports</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="md:col-span-7 rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Target User Roles (SRS Section 1.6)
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[#383e45]">
                The platform enforces role-based access control across five distinct academic and enterprise personas: <span className="font-semibold text-slate-900">Administrators</span> (manage users, synthetic datasets, and audit logs), <span className="font-semibold text-slate-900">Cybersecurity Students</span> (run experiments 1–6 and password tests), <span className="font-semibold text-slate-900">Security Researchers</span> (conduct controlled dictionary audits), <span className="font-semibold text-slate-900">Software Developers</span> (benchmark Argon2id and storage configurations), and <span className="font-semibold text-slate-900">Lecturers / Supervisors</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                {[
                  'Argon2id (64MB, t=3, p=4)',
                  'bcrypt (Eksblowfish)',
                  'PBKDF2-HMAC-SHA256',
                  'SHA-256 / SHA-1 / MD5 Demos',
                  'PDFKit 14-Section Reports',
                  'CSV Telemetry Export',
                  'Prisma ORM (SQLite/PostgreSQL)',
                  'Zero-Plaintext Policy',
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
        </div>
      </section>

      {/* 2-Column Resource Cards */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                id: 'lab-experiments',
                title: 'Controlled Laboratory Experiments (1–6)',
                desc: 'Execute predefined educational simulations comparing password strength, algorithm speed, salting, dictionary auditing, and bounded brute-force.',
                cta: 'Launch Experiments 1–6 →',
              },
              {
                id: 'storage',
                title: 'Password Storage Configuration Evaluator',
                desc: 'Calculate Section 9 weighted security scores (0–100) with automatic Critical-weakness overrides and remediation code.',
                cta: 'Open Storage Evaluator →',
              },
              {
                id: 'algorithm-comparison',
                title: 'Live Hashing Algorithm Benchmark Suite',
                desc: 'Measure real CPU execution time (ms) and memory footprint (KB) across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id.',
                cta: 'Run Live Benchmarks →',
              },
              {
                id: 'administration',
                title: 'Administration, Datasets & Audit Logs',
                desc: 'Provision users, generate synthetic hash datasets, import educational wordlists, and inspect non-sensitive activity logs.',
                cta: 'Open Admin Console →',
              },
            ].map((card) => (
              <div
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className="group cursor-pointer flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 transition hover:border-emerald-500 hover:shadow-sm"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 font-sans">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 font-display text-xs font-bold text-emerald-600">
                  {card.cta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

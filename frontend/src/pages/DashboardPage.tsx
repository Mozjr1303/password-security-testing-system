import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Activity,
  FileText,
  KeyRound,
  Cpu,
  AlertOctagon,
  Filter,
  RefreshCw,
  ArrowRight,
  Clock,
  FlaskConical,
  Binary,
  Database,
  Wrench,
  Layers,
  CheckCircle2,
  Sliders,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { apiFetch } from '../api';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [days, setDays] = useState<string>('all');
  const [category, setCategory] = useState<string>('ALL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Section 1: Live Working Example Interactive State (mirroring AI Object Detection layout)
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(0);
  const [customPassword, setCustomPassword] = useState<string>('P@ssw0rd2026!');
  const [entropyThreshold, setEntropyThreshold] = useState<number>(60);
  const [liveEval, setLiveEval] = useState<any>(null);
  const [liveHash, setLiveHash] = useState<any>(null);
  const [runningLive, setRunningLive] = useState<boolean>(false);

  const syntheticSamples = [
    {
      label: 'Sample 1: Weak Dictionary & Digits',
      value: 'welcome123',
      algo: 'MD5',
      tag: 'VERY WEAK • LEGACY MD5',
    },
    {
      label: 'Sample 2: Predictable Leetspeak Pattern',
      value: 'P@ssw0rd2026!',
      algo: 'bcrypt',
      tag: 'MODERATE • BCRYPT COST=10',
    },
    {
      label: 'Sample 3: Hardened High-Entropy Passphrase',
      value: 'Quantum#Falcon79!Orbit$Nebula',
      algo: 'Argon2id',
      tag: 'VERY STRONG • ARGON2ID 64MB',
    },
  ];

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/dashboard?days=${days}&category=${encodeURIComponent(category)}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const runInteractiveDemo = async (pw: string, algo: string) => {
    setRunningLive(true);
    try {
      const [pwRes, hashRes] = await Promise.all([
        apiFetch('/api/password/test', {
          method: 'POST',
          body: JSON.stringify({ password: pw, save_to_history: false }),
        }),
        apiFetch('/api/hash/generate', {
          method: 'POST',
          body: JSON.stringify({ synthetic_input: pw, algorithm: algo, use_random_salt: true }),
        }),
      ]);
      setLiveEval(pwRes.evaluation);
      setLiveHash(hashRes);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningLive(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    runInteractiveDemo(syntheticSamples[0].value, syntheticSamples[0].algo);
  }, [days, category]);

  const stats = data?.statistics || {
    total_assessments: 0,
    total_password_tests: 0,
    total_hashes_analysed: 0,
    algorithms_evaluated_count: 6,
    security_weaknesses_identified: 0,
    critical_and_high_findings: 0,
    average_security_score: 0,
    generated_reports: 0,
  };

  const charts = data?.charts || {
    password_strength_distribution: [],
    algorithm_comparison: [],
    security_risk_distribution: [],
    assessment_score_trend: [],
  };

  return (
    <div>
      {/* HERO BANNER (Exact layout of reference site with Green theme) */}
      <section className="border-b border-slate-200 bg-white pt-14 pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Left 7 Columns */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                CYBERSECURITY TESTING & ASSESSMENT
              </span>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                ARGON2ID • ZERO-PLAINTEXT LAB
              </span>
            </div>

            <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:leading-[1.06]">
              Password Security Testing &{' '}
              <span className="text-emerald-600">Assessment System</span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-[#383e45]">
              A controlled cybersecurity laboratory engineered to evaluate{' '}
              <span className="font-semibold text-slate-900">password strength & entropy</span>, analyse{' '}
              <span className="font-semibold text-slate-900">cryptographic password hashes</span>, benchmark{' '}
              <span className="font-semibold text-slate-900">Argon2id against legacy digests</span>, audit{' '}
              <span className="font-semibold text-slate-900">storage configurations</span>, and generate{' '}
              <span className="font-semibold text-slate-900">14-section PDF & CSV security reports</span>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  const el = document.getElementById('live-working-lab');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-display text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <span>Try Live Password & Hash Lab</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('history')}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 font-display text-xs font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-600"
              >
                <span>Launch 10-Step Assessment</span>
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 font-display text-xs font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-600"
              >
                <span>Architecture & Docs</span>
              </button>
            </div>
          </div>

          {/* Right 5 Columns: Visual Telemetry Preview Card (Dotted Grid with Detection-Style Overlay Boxes) */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs">
                <span className="font-mono font-semibold text-emerald-700">
                  CRYPTOGRAPHIC AUDIT ENGINE
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
                  {liveHash?.execution_time_ms || 24.6} ms
                </span>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white p-4 dotted-grid-preview flex flex-col justify-between">
                {/* Floating Bounding-Box Style Overlay 1 */}
                <div className="relative mt-4 rounded border-2 border-emerald-600 bg-emerald-500/5 p-3">
                  <span className="absolute -top-6 left-0 rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    Argon2id PHC • 98% Security Rating
                  </span>
                  <div className="font-mono text-[11px] text-slate-800 break-all">
                    $argon2id$v=19$m=65536,t=3,p=4$cHN0c19sYWI$K9xM...
                  </div>
                </div>

                {/* Floating Bounding-Box Style Overlay 2 */}
                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="relative rounded border-2 border-teal-600 bg-teal-500/5 p-2.5 pt-3">
                    <span className="absolute -top-5 left-0 rounded bg-teal-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      Entropy: {liveEval?.entropy_estimate || 82.4} bits
                    </span>
                    <div className="font-mono text-[11px] font-bold text-slate-900">
                      {liveEval?.strength_category || 'Very Strong'}
                    </div>
                  </div>

                  <div className="relative rounded border-2 border-green-600 bg-green-500/5 p-2.5 pt-3">
                    <span className="absolute -top-5 left-0 rounded bg-green-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      Salt: 128-bit CSPRNG
                    </span>
                    <div className="font-mono text-[11px] font-bold text-emerald-700">
                      Rainbow-Resistant
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-mono text-[11px] text-slate-500">
                  <span>Zero-Plaintext Storage: ENFORCED</span>
                  <span className="text-emerald-700 font-bold">✓ OWASP Compliant</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="font-bold text-slate-900">6 Algorithms</div>
                  <div className="text-[10px] text-slate-500">MD5 to Argon2id</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="font-bold text-emerald-700">{stats.average_security_score}/100</div>
                  <div className="text-[10px] text-slate-500">Avg Posture</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="font-bold text-slate-900">{stats.generated_reports} Reports</div>
                  <div className="text-[10px] text-slate-500">PDF & CSV</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — LIVE WORKING EXAMPLE (Exact match to Section 1 of reference site) */}
      <section id="live-working-lab" className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left 4 Columns: Controls */}
            <div className="space-y-4 lg:col-span-4">
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  1 • LIVE WORKING LABORATORY
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                  Interactive Password & Hash Sandbox
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-[#383e45]">
                Run real cryptographic password entropy evaluation, pattern detection, and PHC hash generation directly in the laboratory.
              </p>

              <div className="pt-1">
                <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  CHOOSE SYNTHETIC SAMPLE
                </div>
                <div className="flex flex-col gap-2">
                  {syntheticSamples.map((s, idx) => {
                    const isActive = selectedSampleIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedSampleIdx(idx);
                          setCustomPassword(s.value);
                          runInteractiveDemo(s.value, s.algo);
                        }}
                        className={`rounded-md border px-3.5 py-2.5 text-left font-display text-xs font-semibold transition flex items-center justify-between ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className="font-mono text-[10px] opacity-80">{s.algo}</span>
                      </button>
                    );
                  })}

                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5">
                    <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      OR ENTER CUSTOM SYNTHETIC CREDENTIAL
                    </label>
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Threshold Slider Card */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Target Security Score Threshold</span>
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700">
                    {entropyThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={entropyThreshold}
                  onChange={(e) => setEntropyThreshold(Number(e.target.value))}
                  className="mt-2.5 w-full accent-emerald-600"
                />
              </div>

              {/* Primary CTA Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={runningLive}
                  onClick={() =>
                    runInteractiveDemo(
                      customPassword,
                      syntheticSamples[selectedSampleIdx]?.algo || 'Argon2id'
                    )
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 font-display text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{runningLive ? 'Analyzing...' : 'Evaluate & Hash Sample'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('password-tester')}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-2.5 font-display text-xs font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-600"
                >
                  Full Tester →
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
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-slate-900">
                      Cryptographic Inspection Canvas
                    </span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                      {liveEval?.strength_category || 'Evaluated'} ({liveEval?.overall_score || 0}/100)
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('hash-lab')}
                    className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-display text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Open Hash Lab →
                  </button>
                </div>

                <div className="bg-slate-100 p-5 space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-[11px] uppercase text-slate-500">
                          EVALUATED SYNTHETIC CREDENTIAL ({liveEval?.password_length || 0} CHARS)
                        </div>
                        <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                          {customPassword}
                        </div>
                      </div>
                      <span
                        className={`rounded px-2.5 py-1 font-mono text-xs font-bold ${
                          (liveEval?.overall_score || 0) >= entropyThreshold
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {(liveEval?.overall_score || 0) >= entropyThreshold
                          ? `PASSES ${entropyThreshold}% THRESHOLD`
                          : `BELOW ${entropyThreshold}% THRESHOLD`}
                      </span>
                    </div>

                    {/* Strength Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          (liveEval?.overall_score || 0) >= 65
                            ? 'bg-emerald-600'
                            : (liveEval?.overall_score || 0) >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                        style={{ width: `${Math.max(5, liveEval?.overall_score || 0)}%` }}
                      />
                    </div>

                    {liveHash && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
                        <div className="text-[11px] font-bold text-emerald-700">
                          GENERATED {liveHash.algorithm} HASH ({liveHash.execution_time_ms} ms):
                        </div>
                        <div className="mt-1 break-all text-slate-800">{liveHash.hash}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Table Card */}
              {liveEval && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <span className="font-display text-xs font-bold text-slate-900">
                      Detected Cryptographic Metrics & Guessing Resistance
                    </span>
                    <span className="rounded bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700">
                      {liveEval.entropy_estimate} bits effective entropy
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-4">Metric / Attack Vector</th>
                          <th className="py-2.5 px-4">Measured Value</th>
                          <th className="py-2.5 px-4">Security Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            Online Rate-Limited API (100/hr)
                          </td>
                          <td className="py-2.5 px-4 font-mono text-emerald-700 font-semibold">
                            {liveEval.guessing_resistance?.online_rate_limited}
                          </td>
                          <td className="py-2.5 px-4">Throttled by Express login rate limiter</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            Offline Fast Hash GPU Rig (MD5/SHA-256)
                          </td>
                          <td className="py-2.5 px-4 font-mono text-rose-700 font-semibold">
                            {liveEval.guessing_resistance?.offline_fast_hash_gpu}
                          </td>
                          <td className="py-2.5 px-4">10 Billion guesses/sec on commodity GPUs</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            Offline Hardened Argon2id (64 MB, t=3)
                          </td>
                          <td className="py-2.5 px-4 font-mono text-emerald-700 font-semibold">
                            {liveEval.guessing_resistance?.offline_argon2id_hardened}
                          </td>
                          <td className="py-2.5 px-4">Memory-hardness neutralizes GPU parallelism</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — EDITORIAL TEXT BAND (Asymmetric 4/8 split on bg-[#f8fafc]) */}
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
            <div className="lg:col-span-8 space-y-4">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                What is Password Security Testing & Cryptographic Assessment?
              </h2>
              <p className="text-base leading-relaxed text-[#383e45]">
                Modern authentication security depends on both user credential entropy and how those credentials are transformed at rest. Unlike fast general-purpose checksums such as MD5, SHA-1, or raw SHA-256—which execute in microseconds and allow attackers to test billions of candidates per second—<strong>adaptive password hashing</strong> schemes like <span className="font-semibold text-emerald-700">Argon2id</span>, <span className="font-semibold text-emerald-700">bcrypt</span>, and <span className="font-semibold text-emerald-700">PBKDF2-HMAC-SHA256</span> deliberately enforce configurable CPU work factors, unique 128-bit salts, and memory hardness.
              </p>
              <p className="text-base leading-relaxed text-[#383e45]">
                The Password Security Testing and Assessment System provides a controlled academic and engineering laboratory where users conduct <span className="font-semibold text-emerald-700">synthetic dictionary audits</span>, benchmark algorithm latency and RAM consumption, evaluate storage configurations using weighted risk rules, and compile professional PDF and CSV security assessment reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — CORE CAPABILITIES GRID (Asymmetric 4/8 split on bg-white) */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  3 • CORE CAPABILITIES
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                  12 Integrated Laboratory Modules
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 font-sans">
                  Click any capability card to launch that dedicated assessment module.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                {
                  id: 'password-tester',
                  icon: KeyRound,
                  title: 'Password Strength & Entropy Tester',
                  desc: 'Evaluates length, character diversity, sequential walks, leetspeak substitutions, and synthetic breach wordlists with a 5-tier score out of 100.',
                },
                {
                  id: 'hash-lab',
                  icon: Binary,
                  title: 'Hash Analysis & Controlled Auditing Lab',
                  desc: 'Validates MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id formats, compares salted vs. unsalted digests, and runs bounded dictionary audits.',
                },
                {
                  id: 'algorithm-comparison',
                  icon: Cpu,
                  title: 'Hashing Algorithm Benchmark Engine',
                  desc: 'Executes live multi-algorithm benchmarks measuring CPU latency (ms) and memory footprint (KB) across configurable work factors.',
                },
                {
                  id: 'storage',
                  icon: Database,
                  title: 'Password Storage Security Assessment',
                  desc: 'Applies Section 9 weighted scoring (Password 25%, Algorithm 25%, Salt/Config 20%, Auth Controls 20%, Reset 10%) with Critical overrides.',
                },
                {
                  id: 'lab-experiments',
                  icon: FlaskConical,
                  title: 'Controlled Laboratory Experiments (1–6)',
                  desc: 'Interactive guided experiments covering strength comparison, algorithm speed, salting, dictionary auditing, and limited brute-force.',
                },
                {
                  id: 'reports',
                  icon: FileText,
                  title: '14-Section PDF & CSV Report Generator',
                  desc: 'Compiles downloadable PDFKit reports and CSV exports containing findings, risk classifications, and Argon2id remediation guidance.',
                },
              ].map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.id}
                    onClick={() => onNavigate(cap.id)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                      {cap.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 font-sans">
                      {cap.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — LIVE ANALYTICS & TELEMETRY CHARTS (SRS Section 3.9 on bg-[#f8fafc]) */}
      <section className="border-b border-slate-200 bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="border-t-2 border-emerald-600 pt-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                4 • LABORATORY ANALYTICS & TELEMETRY
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                Real-Time Assessment Metrics & Visualisations
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="Full Security Assessment">Full Security Assessment</option>
                <option value="Password Strength">Password Strength</option>
                <option value="Hash Analysis">Hash Analysis</option>
                <option value="Storage Assessment">Storage Assessment</option>
              </select>
              <button
                onClick={loadDashboard}
                className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:border-emerald-600 hover:text-emerald-600"
                title="Refresh Analytics"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 font-sans">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                TOTAL ASSESSMENTS
              </div>
              <div className="mt-1 font-display text-2xl font-black text-slate-900">
                {stats.total_assessments}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {stats.total_password_tests} password tests recorded
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                AVERAGE SECURITY SCORE
              </div>
              <div className="mt-1 font-display text-2xl font-black text-emerald-700">
                {stats.average_security_score} / 100
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Section 9 weighted methodology</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                HASHES & ALGORITHMS
              </div>
              <div className="mt-1 font-display text-2xl font-black text-slate-900">
                {stats.total_hashes_analysed} ({stats.algorithms_evaluated_count} Algos)
              </div>
              <div className="mt-0.5 text-xs text-slate-500">MD5, SHA-1, SHA-256, PBKDF2, bcrypt, Argon2id</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                CRITICAL & HIGH FINDINGS
              </div>
              <div className="mt-1 font-display text-2xl font-black text-rose-600">
                {stats.critical_and_high_findings}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {stats.generated_reports} PDF/CSV reports generated
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 font-sans">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Password Strength Distribution
                  </h3>
                  <p className="text-xs text-slate-500">5-category breakdown across synthetic tests</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.password_strength_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {charts.password_strength_distribution.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Algorithm Security Rating vs. Execution Latency (ms)
                  </h3>
                  <p className="text-xs text-slate-500">Adaptive schemes vs. legacy fast digests</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.algorithm_comparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="algorithm" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="security_rating" name="Security Rating (/100)" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="execution_time" name="Execution Time (ms)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Security Risk Distribution
                </h3>
                <p className="text-xs text-slate-500">Findings classified by severity</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.security_risk_distribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="severity" type="category" stroke="#64748b" fontSize={11} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" name="Findings" radius={[0, 4, 4, 0]}>
                      {charts.security_risk_distribution.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Assessment Security Score Trend
                </h3>
                <p className="text-xs text-slate-500">Historical 0–100 assessment scores</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.assessment_score_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Security Score"
                      stroke="#059669"
                      fill="#d1fae5"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — TECHNOLOGY STACK GRID (Exact match to Section 4 of reference site) */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="border-t-2 border-emerald-600 pt-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  5 • TECHNOLOGY STACK
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                  System Engineering & Cryptography
                </h2>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { cat: 'FRONTEND', name: 'React 18 + TypeScript' },
                { cat: 'STYLING & CHARTS', name: 'Tailwind + Recharts' },
                { cat: 'BACKEND API', name: 'Node.js + Express' },
                { cat: 'CYBER ENGINE', name: 'Python FastAPI' },
                { cat: 'PRIMARY HASHING', name: 'Argon2id (PHC v19)' },
                { cat: 'ADAPTIVE HASHES', name: 'bcrypt & PBKDF2' },
                { cat: 'DATABASE & ORM', name: 'PostgreSQL / Prisma' },
                { cat: 'REPORTING', name: 'PDFKit & CSV Export' },
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

      {/* SECTION 6 — NEXT PAGE BANNER (Exact match to Section 5 of reference site) */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            onClick={() => onNavigate('about')}
            className="group cursor-pointer flex items-center justify-between border-t border-emerald-500 pt-8"
          >
            <div>
              <div className="font-mono text-xs font-semibold text-emerald-600">
                NEXT PAGE • 02
              </div>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900 transition group-hover:text-emerald-600 sm:text-3xl">
                About the Project, Methodology & Architecture
              </h3>
            </div>
            <ArrowRight className="h-10 w-10 text-slate-900 transition-transform group-hover:translate-x-2 group-hover:text-emerald-600 sm:h-12 sm:w-12" />
          </div>
        </div>
      </section>
    </div>
  );
};

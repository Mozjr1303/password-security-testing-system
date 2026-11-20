import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  History,
  Lock,
} from 'lucide-react';
import { apiFetch } from '../api';

export const PasswordStrengthPage: React.FC = () => {
  const [password, setPassword] = useState('P@ssw0rd2026!');
  const [showPassword, setShowPassword] = useState(true);
  const [assessmentName, setAssessmentName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await apiFetch('/api/password/history');
      setHistory(res.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  const runLivePreview = async (candidate: string) => {
    if (!candidate) {
      setResult(null);
      return;
    }
    try {
      const res = await apiFetch('/api/password/test', {
        method: 'POST',
        body: JSON.stringify({ password: candidate, save_to_history: false }),
      });
      setResult(res.evaluation);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runLivePreview(password);
    loadHistory();
  }, []);

  const handleAnalyzeAndPersist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/password/test', {
        method: 'POST',
        body: JSON.stringify({
          password,
          assessment_name: assessmentName || undefined,
          save_to_history: true,
        }),
      });
      setResult(res.evaluation);
      setAssessmentName('');
      await loadHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applySample = (sample: string) => {
    setPassword(sample);
    runLivePreview(sample);
  };

  const generateStrongPassphrase = () => {
    const words = ['Quantum', 'Falcon', 'Nebula', 'Cobalt', 'Vector', 'Horizon', 'Aegis', 'Cipher', 'Zenith', 'Prism'];
    const syms = ['#', '$', '!', '*', '@', '%'];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const w3 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(10 + Math.random() * 89);
    const s1 = syms[Math.floor(Math.random() * syms.length)];
    const s2 = syms[Math.floor(Math.random() * syms.length)];
    const generated = `${w1}${s1}${w2}${num}${s2}${w3}`;
    applySample(generated);
  };

  const categoryColor = (cat?: string) => {
    switch (cat) {
      case 'Very Strong':
        return { text: 'text-emerald-700', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Strong':
        return { text: 'text-emerald-700', bg: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Moderate':
        return { text: 'text-amber-700', bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Weak':
        return { text: 'text-orange-700', bg: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { text: 'text-rose-700', bg: 'bg-red-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  const colors = categoryColor(result?.strength_category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password Strength Assessment Engine (SRS Section 3.2)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Synthetic Password Entropy, Pattern & Breach-Indicator Analyzer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates length, character diversity, repeated/sequential patterns, leetspeak substitutions, and local dictionary matches without storing plaintext credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Plaintext Storage Policy Active</span>
          </span>
        </div>
      </div>

      {/* Main Tester Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Panel */}
        <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Synthetic Password Input</h2>

          <form onSubmit={handleAnalyzeAndPersist} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Enter Synthetic Test Credential
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    runLivePreview(e.target.value);
                  }}
                  placeholder="Enter synthetic password to evaluate..."
                  className="w-full pl-4 pr-10 py-3 rounded-md bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-900"
                  title="Toggle Show/Hide Password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Optional Assessment Label
              </label>
              <input
                type="text"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="e.g., Student Lab Exercise #1"
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/15 transition"
              >
                {loading ? 'Analyzing & Saving...' : 'Analyse & Record Assessment (No Plaintext Saved)'}
              </button>
              <button
                type="button"
                onClick={generateStrongPassphrase}
                className="px-3.5 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Generate Strong</span>
              </button>
            </div>
          </form>

          {/* 5-Tier Synthetic Sample Presets */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 mb-2.5">
              Load Predefined 5-Category Synthetic Samples:
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => applySample('password')}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between"
              >
                <span className="font-mono text-slate-800">password</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px]">1. Very Weak (Dictionary)</span>
              </button>
              <button
                type="button"
                onClick={() => applySample('qwerty1234')}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between"
              >
                <span className="font-mono text-slate-800">qwerty1234</span>
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px]">2. Weak (Keyboard Walk)</span>
              </button>
              <button
                type="button"
                onClick={() => applySample('P@ssw0rd2026!')}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between"
              >
                <span className="font-mono text-slate-800">P@ssw0rd2026!</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px]">3. Moderate (Leetspeak)</span>
              </button>
              <button
                type="button"
                onClick={() => applySample('Solar$Matrix84!')}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between"
              >
                <span className="font-mono text-slate-800">Solar$Matrix84!</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px]">4. Strong</span>
              </button>
              <button
                type="button"
                onClick={() => applySample('Quantum#Falcon79!Orbit$Nebula')}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between"
              >
                <span className="font-mono text-slate-800">Quantum#Falcon79!Orbit$Nebula</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px]">5. Very Strong</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Assessment Output */}
        <div className="lg:col-span-7 space-y-5">
          {result && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-5">
              {/* Top Score & Strength Meter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Strength Classification</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-2xl font-bold ${colors.text}`}>
                      {result.strength_category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border ${colors.badge}`}>
                      Score: {result.overall_score} / 100
                    </span>
                    {result.breach_indicator && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800 border border-rose-300 font-semibold">
                        Synthetic Breach Dictionary Match
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Effective Bit Entropy</div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {result.entropy_estimate} <span className="text-xs font-normal text-slate-500">bits</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Raw Pool Entropy: {result.raw_entropy} bits
                  </div>
                </div>
              </div>

              {/* 5-Segment Visual Strength Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>1. Very Weak</span>
                  <span>2. Weak</span>
                  <span>3. Moderate</span>
                  <span>4. Strong</span>
                  <span>5. Very Strong</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${colors.bg}`}
                    style={{ width: `${Math.max(4, result.overall_score)}%` }}
                  />
                </div>
              </div>

              {/* Character Diversity Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Length</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{result.password_length} chars</div>
                </div>
                <div className={`p-3 rounded-md border ${result.character_sets?.lowercase ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <div>Lowercase (a-z)</div>
                  <div className="font-bold mt-0.5">{result.character_sets?.lowercase_count || 0} chars</div>
                </div>
                <div className={`p-3 rounded-md border ${result.character_sets?.uppercase ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <div>Uppercase (A-Z)</div>
                  <div className="font-bold mt-0.5">{result.character_sets?.uppercase_count || 0} chars</div>
                </div>
                <div className={`p-3 rounded-md border ${result.character_sets?.digits ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <div>Digits (0-9)</div>
                  <div className="font-bold mt-0.5">{result.character_sets?.digits_count || 0} chars</div>
                </div>
                <div className={`p-3 rounded-md border ${result.character_sets?.symbols ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <div>Symbols (!@#$)</div>
                  <div className="font-bold mt-0.5">{result.character_sets?.symbols_count || 0} chars</div>
                </div>
              </div>

              {/* Estimated Guessing Resistance Across Attack Models */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Estimated Guessing Resistance (Time to Exhaust Average Keyspace)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px]">Online Rate-Limited API (100/hr)</div>
                    <div className="font-mono font-semibold text-emerald-800 mt-1">
                      {result.guessing_resistance?.online_rate_limited}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px]">Offline Fast Hash GPU (MD5/SHA256)</div>
                    <div className="font-mono font-semibold text-amber-800 mt-1">
                      {result.guessing_resistance?.offline_fast_hash_gpu}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px]">Offline Argon2id (64 MB, t=3)</div>
                    <div className="font-mono font-semibold text-emerald-800 mt-1">
                      {result.guessing_resistance?.offline_argon2id_hardened}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pattern Analysis, Weaknesses & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-semibold text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Detected Weaknesses & Patterns</span>
                  </div>
                  {result.weaknesses?.length === 0 && result.pattern_findings?.length === 0 ? (
                    <p className="text-emerald-700">No predictable patterns or structural weaknesses detected.</p>
                  ) : (
                    <ul className="space-y-1.5 text-slate-700 list-disc pl-4">
                      {(result.pattern_findings || []).map((p: string, i: number) => (
                        <li key={`pat-${i}`} className="text-amber-800">{p}</li>
                      ))}
                      {(result.weaknesses || []).map((w: string, i: number) => (
                        <li key={`wk-${i}`}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Security Improvement Recommendations</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 list-disc pl-4">
                    {(result.recommendations || []).map((r: string, i: number) => (
                      <li key={`rec-${i}`}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zero-Plaintext Password Assessment History */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Recorded Password Strength Assessments (Zero Plaintext Retained)
            </h2>
          </div>
          <span className="text-xs text-slate-500">{history.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">Assessment Label</th>
                <th className="py-2.5 px-2">Length</th>
                <th className="py-2.5 px-2">Entropy</th>
                <th className="py-2.5 px-2">Score</th>
                <th className="py-2.5 px-2">Classification</th>
                <th className="py-2.5 px-2">Fast-Hash Resistance</th>
                <th className="py-2.5 px-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.slice(0, 12).map((h) => {
                const c = categoryColor(h.strength_category);
                return (
                  <tr key={h.id} className="hover:bg-emerald-50/40">
                    <td className="py-2.5 px-2 font-medium text-slate-900">{h.assessment_name}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-700">{h.password_length} chars</td>
                    <td className="py-2.5 px-2 font-mono text-emerald-800">{h.entropy_estimate} bits</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{h.overall_score}/100</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border ${c.badge}`}>
                        {h.strength_category}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-mono">{h.estimated_crack_time}</td>
                    <td className="py-2.5 px-2 text-slate-500">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

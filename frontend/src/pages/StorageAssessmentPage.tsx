import React, { useEffect, useState } from 'react';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Code2,
  Sliders,
} from 'lucide-react';
import { apiFetch } from '../api';

export const StorageAssessmentPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState('MD5');
  const [saltConfig, setSaltConfig] = useState('Unsalted');
  const [saltUnique, setSaltUnique] = useState(false);
  const [workFactor, setWorkFactor] = useState(1);
  const [memoryCost, setMemoryCost] = useState(1);
  const [iterationCount, setIterationCount] = useState(1);
  const [storageFormat, setStorageFormat] = useState('Raw Hex Digest');
  const [resetImpl, setResetImpl] = useState('Email Temporary Plaintext Password');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [rateLimiting, setRateLimiting] = useState(false);
  const [useMeasuredPwScore, setUseMeasuredPwScore] = useState(true);
  const [measuredPwScore, setMeasuredPwScore] = useState(45);
  const [assessmentName, setAssessmentName] = useState('');

  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset: 'legacy_md5' | 'raw_sha256' | 'pbkdf2' | 'argon2id') => {
    if (preset === 'legacy_md5') {
      setAlgorithm('MD5');
      setSaltConfig('Unsalted');
      setSaltUnique(false);
      setWorkFactor(1);
      setMemoryCost(1);
      setIterationCount(1);
      setStorageFormat('Raw Hex Digest');
      setResetImpl('Email Temporary Plaintext Password');
      setMfaEnabled(false);
      setRateLimiting(false);
      setMeasuredPwScore(30);
    } else if (preset === 'raw_sha256') {
      setAlgorithm('SHA-256');
      setSaltConfig('Static/Fixed Salt');
      setSaltUnique(false);
      setWorkFactor(1);
      setMemoryCost(2);
      setIterationCount(1);
      setStorageFormat('Raw Hex Digest');
      setResetImpl('Long-Lived Unhashed Token');
      setMfaEnabled(false);
      setRateLimiting(true);
      setMeasuredPwScore(62);
    } else if (preset === 'pbkdf2') {
      setAlgorithm('PBKDF2');
      setSaltConfig('Unique Random (>= 16 bytes)');
      setSaltUnique(true);
      setWorkFactor(600000);
      setMemoryCost(32);
      setIterationCount(600000);
      setStorageFormat('PBKDF2 Structured');
      setResetImpl('Expiring Single-Use CSPRNG Token (Hashed)');
      setMfaEnabled(true);
      setRateLimiting(true);
      setMeasuredPwScore(82);
    } else {
      setAlgorithm('Argon2id');
      setSaltConfig('Unique Random (>= 16 bytes)');
      setSaltUnique(true);
      setWorkFactor(3);
      setMemoryCost(65536);
      setIterationCount(3);
      setStorageFormat('PHC String ($argon2id$...)');
      setResetImpl('Expiring Single-Use CSPRNG Token (Hashed)');
      setMfaEnabled(true);
      setRateLimiting(true);
      setMeasuredPwScore(94);
    }
  };

  const handleAssess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/storage/assess', {
        method: 'POST',
        body: JSON.stringify({
          algorithm,
          salt_configuration: saltConfig,
          salt_uniqueness: saltUnique,
          work_factor: workFactor,
          memory_cost: memoryCost,
          iteration_count: iterationCount,
          storage_format: storageFormat,
          reset_implementation: resetImpl,
          mfa_enabled: mfaEnabled,
          rate_limiting: rateLimiting,
          measured_password_score: useMeasuredPwScore ? measuredPwScore : undefined,
          assessment_name: assessmentName || undefined,
        }),
      });
      setEvaluation(res.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAssess();
  }, []);

  const sevBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Database className="w-3.5 h-3.5" />
            <span>Password Storage Security Assessment Module (SRS Section 3.5 & Section 9)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Authentication & Password Storage Configuration Evaluator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate hashing algorithms, salt uniqueness, memory/time work factors, reset tokens, MFA, and rate limiting using Section 9 weighted scoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => applyPreset('legacy_md5')}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-medium"
          >
            Preset: Legacy MD5
          </button>
          <button
            type="button"
            onClick={() => applyPreset('raw_sha256')}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium"
          >
            Preset: Raw SHA-256
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pbkdf2')}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-700/20 border border-emerald-200 text-emerald-800 font-medium"
          >
            Preset: PBKDF2 (600k)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('argon2id')}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium"
          >
            Preset: Hardened Argon2id
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Configuration Inputs */}
        <form
          onSubmit={handleAssess}
          className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3.5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Laboratory Storage Configuration</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Hashing Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="Argon2id">Argon2id (Preferred Modern)</option>
                <option value="bcrypt">bcrypt (Adaptive)</option>
                <option value="PBKDF2">PBKDF2-HMAC-SHA256</option>
                <option value="SHA-256">SHA-256 (General-Purpose)</option>
                <option value="SHA-1">SHA-1 (Legacy Broken)</option>
                <option value="MD5">MD5 (Legacy Broken)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Salt Configuration</label>
              <select
                value={saltConfig}
                onChange={(e) => {
                  setSaltConfig(e.target.value);
                  setSaltUnique(e.target.value.includes('Unique'));
                }}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="Unique Random (>= 16 bytes)">Unique Random (&gt;= 16 bytes)</option>
                <option value="Short Salt (< 8 bytes)">Short Salt (&lt; 8 bytes)</option>
                <option value="Static/Fixed Salt">Static / Application-Wide Salt</option>
                <option value="Unsalted">Unsalted (No Salt)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Work Factor</label>
              <input
                type="number"
                min={1}
                value={workFactor}
                onChange={(e) => setWorkFactor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Memory (KB)</label>
              <input
                type="number"
                min={1}
                value={memoryCost}
                onChange={(e) => setMemoryCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Iterations</label>
              <input
                type="number"
                min={1}
                value={iterationCount}
                onChange={(e) => setIterationCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Password Storage Format</label>
              <select
                value={storageFormat}
                onChange={(e) => setStorageFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="PHC String ($argon2id$...)">PHC String ($argon2id$...)</option>
                <option value="Modular Crypt ($2b$...)">Modular Crypt ($2b$...)</option>
                <option value="PBKDF2 Structured">PBKDF2 Structured Digest</option>
                <option value="Raw Hex Digest">Raw Hex Digest</option>
                <option value="Plaintext / Reversible Encryption">Plaintext / Reversible Encryption</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password Reset Implementation</label>
              <select
                value={resetImpl}
                onChange={(e) => setResetImpl(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="Expiring Single-Use CSPRNG Token (Hashed)">Expiring Single-Use CSPRNG Token (Hashed)</option>
                <option value="Long-Lived Unhashed Token">Long-Lived Unhashed Token</option>
                <option value="Static Security Questions">Static Security Questions</option>
                <option value="Email Temporary Plaintext Password">Email Temporary Plaintext Password</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <label className="flex items-center gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={saltUnique}
                onChange={(e) => setSaltUnique(e.target.checked)}
              />
              <span className="text-slate-800">Unique Per-User Salt</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
              />
              <span className="text-slate-800">MFA Enabled</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={rateLimiting}
                onChange={(e) => setRateLimiting(e.target.checked)}
              />
              <span className="text-slate-800">Rate Limiting</span>
            </label>
          </div>

          {/* Measured vs Estimated Password Strength Score Toggle (SRS Section 9) */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMeasuredPwScore}
                  onChange={(e) => setUseMeasuredPwScore(e.target.checked)}
                />
                <span>Include Measured Password Strength Score (vs. Estimated Baseline)</span>
              </label>
              <span className="font-mono text-emerald-700 font-bold">
                {useMeasuredPwScore ? `${measuredPwScore}/100 (Measured)` : '75/100 (Estimated)'}
              </span>
            </div>
            {useMeasuredPwScore && (
              <input
                type="range"
                min={5}
                max={100}
                value={measuredPwScore}
                onChange={(e) => setMeasuredPwScore(Number(e.target.value))}
                className="w-full"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/15 transition"
          >
            {loading ? 'Evaluating Storage Posture...' : 'Evaluate Password Storage Configuration'}
          </button>
        </form>

        {/* Right Panel: Section 9 Score Breakdown & Findings */}
        <div className="lg:col-span-7 space-y-5">
          {evaluation && (
            <>
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Overall Security Score (SRS Section 9)</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200">
                        {evaluation.score_type} Result
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-mono font-bold text-slate-900">
                        {evaluation.overall_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          evaluation.score_classification === 'Excellent'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : evaluation.score_classification === 'Good'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : evaluation.score_classification === 'Moderate'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        Classification: {evaluation.score_classification}
                      </span>
                    </div>
                  </div>

                  {evaluation.critical_override_applied && (
                    <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs max-w-xs">
                      <strong>Critical Weakness Override Applied:</strong> Raw weighted score ({evaluation.numerical_score}/100) was overridden to <strong>Critical</strong> due to a Critical storage flaw.
                    </div>
                  )}
                </div>

                {/* 5-Category Weighted Breakdown Bars */}
                <div className="space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-700">
                    Section 9 Weighted Assessment Categories:
                  </div>
                  {[
                    {
                      label: '1. Password Strength (Weight: 25%)',
                      data: evaluation.category_scores.password_strength,
                    },
                    {
                      label: '2. Hashing Algorithm Suitability (Weight: 25%)',
                      data: evaluation.category_scores.algorithm_suitability,
                    },
                    {
                      label: '3. Salt & Configuration Security (Weight: 20%)',
                      data: evaluation.category_scores.salt_and_configuration,
                    },
                    {
                      label: '4. Authentication Controls — MFA & Rate Limiting (Weight: 20%)',
                      data: evaluation.category_scores.authentication_controls,
                    },
                    {
                      label: '5. Password Reset Security (Weight: 10%)',
                      data: evaluation.category_scores.password_reset_security,
                    },
                  ].map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-700">{cat.label}</span>
                        <span className="font-mono text-slate-900">
                          {cat.data.weighted_score} / {cat.data.weight} pts ({cat.data.raw_score}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            cat.data.raw_score >= 75
                              ? 'bg-emerald-500'
                              : cat.data.raw_score >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.data.raw_score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <strong>Preferred Modern Recommendation: </strong>
                  {evaluation.preferred_recommendation}
                </div>
              </div>

              {/* Identified Findings & Code Guidance */}
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Identified Storage & Authentication Findings ({evaluation.findings?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(evaluation.findings || []).map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{f.finding_title}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sevBadge(f.severity)}`}>
                          {f.severity} Risk ({f.priority} Priority)
                        </span>
                      </div>
                      <p className="text-slate-700">{f.description}</p>
                      <div className="text-amber-800/90">
                        <strong>Security Impact:</strong> {f.impact}
                      </div>
                      <div className="text-emerald-700">
                        <strong>Recommended Solution:</strong> {f.recommendation} — {f.implementation_details}
                      </div>
                      {f.code_snippet && (
                        <pre className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-emerald-800 overflow-x-auto">
                          {f.code_snippet}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

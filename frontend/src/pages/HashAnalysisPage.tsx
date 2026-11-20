import React, { useEffect, useState } from 'react';
import {
  Binary,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Play,
  Key,
  Layers,
  Terminal,
  RefreshCw,
  StopCircle,
  Lock,
} from 'lucide-react';
import { apiFetch } from '../api';

export const HashAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'salting' | 'auditing'>('analyze');
  const [samples, setSamples] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);

  // Hash Analysis state
  const [sampleHash, setSampleHash] = useState('$argon2id$v=19$m=65536,t=3,p=4$Qmbz2BQvw7UOl0dd88y4SA$MRFvXixDWIZIFSD7PUfYgqCi68hjyaX/eEXrKv2WzRQ');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('AUTO');
  const [externalSalt, setExternalSalt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Hash Verification & Generator state
  const [verifyCandidate, setVerifyCandidate] = useState('Quantum#Falcon79!');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [genInput, setGenInput] = useState('SyntheticLabDemo#2026');
  const [genAlgo, setGenAlgo] = useState('Argon2id');
  const [genRandomSalt, setGenRandomSalt] = useState(true);
  const [generatedOutput, setGeneratedOutput] = useState<any>(null);

  // Salted vs Unsalted Demo state
  const [saltDemoInput, setSaltDemoInput] = useState('SharedCampusPassword#2026');
  const [saltDemoResult, setSaltDemoResult] = useState<any>(null);

  // Controlled Password Auditing state
  const [auditJobType, setAuditJobType] = useState<'DICTIONARY_AUDIT' | 'BRUTE_FORCE_DEMO'>('DICTIONARY_AUDIT');
  const [auditAlgo, setAuditAlgo] = useState('MD5');
  const [auditCustomHash, setAuditCustomHash] = useState('');
  const [auditCharset, setAuditCharset] = useState<'numeric' | 'lowercase_short' | 'alphanumeric_short'>('numeric');
  const [auditMaxAttempts, setAuditMaxAttempts] = useState(1500);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [sRes, dRes] = await Promise.all([
          apiFetch('/api/hash/samples'),
          apiFetch('/api/lab/datasets'),
        ]);
        setSamples(sRes.samples || []);
        setDatasets(dRes.datasets || []);
        if (sRes.samples?.length > 0) {
          const first = sRes.samples[0];
          setSampleHash(first.sample_hash);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handleAnalyzeHash = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sampleHash) return;
    setAnalyzing(true);
    try {
      const res = await apiFetch('/api/hash/analyze', {
        method: 'POST',
        body: JSON.stringify({
          sample_hash: sampleHash,
          algorithm: selectedAlgorithm,
          salt: externalSalt || undefined,
        }),
      });
      setAnalysisResult(res.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCandidate || !sampleHash) return;
    try {
      const algoToUse =
        selectedAlgorithm !== 'AUTO'
          ? selectedAlgorithm
          : analysisResult?.selected_algorithm || 'Argon2id';
      const res = await apiFetch('/api/hash/verify', {
        method: 'POST',
        body: JSON.stringify({
          candidate: verifyCandidate,
          sample_hash: sampleHash,
          algorithm: algoToUse,
          salt: externalSalt || undefined,
        }),
      });
      setVerifyResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateHash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/hash/generate', {
        method: 'POST',
        body: JSON.stringify({
          synthetic_input: genInput,
          algorithm: genAlgo,
          use_random_salt: genRandomSalt,
        }),
      });
      setGeneratedOutput(res);
      setSampleHash(res.hash);
      setSelectedAlgorithm(res.algorithm);
      setVerifyCandidate(genInput);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSaltingDemo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await apiFetch('/api/hash/salted-compare', {
        method: 'POST',
        body: JSON.stringify({ synthetic_input: saltDemoInput }),
      });
      setSaltDemoResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunControlledAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditRunning(true);
    try {
      const res = await apiFetch('/api/lab/audit', {
        method: 'POST',
        body: JSON.stringify({
          job_type: auditJobType,
          algorithm: auditAlgo,
          sample_hash: auditCustomHash || undefined,
          charset: auditCharset,
          max_length: 3,
          max_attempts: auditMaxAttempts,
        }),
      });
      setAuditResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & 4-Tier Classification Banner */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <Binary className="w-3.5 h-3.5" />
              <span>Password Hash Analysis Laboratory (SRS Section 3.3)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Cryptographic Hash Identification, Salting & Controlled Auditing Lab
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect sample hashes across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id, compare salting strategies, and run bounded synthetic audits.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-200">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'analyze' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              1. Hash Inspector & Verifier
            </button>
            <button
              onClick={() => {
                setActiveTab('salting');
                if (!saltDemoResult) handleRunSaltingDemo();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'salting' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              2. Salted vs. Unsalted Lab
            </button>
            <button
              onClick={() => setActiveTab('auditing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'auditing' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              3. Controlled Password Auditing
            </button>
          </div>
        </div>

        {/* 4 Hashing Paradigms Distinction Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 text-xs">
          <div className="p-2.5 rounded-md bg-slate-50 border border-rose-200">
            <div className="font-semibold text-rose-700">1. General-Purpose Hashing</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              MD5, SHA-1, raw SHA-256. Designed for speed; unsuitable for password storage.
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-amber-200">
            <div className="font-semibold text-amber-700">2. Password-Specific Hashing</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              PBKDF2-HMAC-SHA256. Applies key stretching via hundreds of thousands of iterations.
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-emerald-200">
            <div className="font-semibold text-emerald-700">3. Salted Password Hashing</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Combines unique 128-bit CSPRNG salt per user to defeat Rainbow Tables.
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-emerald-500/20">
            <div className="font-semibold text-emerald-700">4. Adaptive Password Hashing</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Argon2id & bcrypt. Scales CPU time and RAM (memory-hardness) against GPUs/ASICs.
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: HASH INSPECTOR & VERIFICATION */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5">
            {/* Sample Hash Analyzer Form */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Submit or Select Sample Password Hash</h2>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Load Preloaded Synthetic Dataset Sample
                </label>
                <select
                  onChange={(e) => {
                    const found = samples.find((s) => s.id === e.target.value);
                    if (found) {
                      setSampleHash(found.sample_hash);
                      setSelectedAlgorithm(found.algorithm);
                      setExternalSalt(found.salt || '');
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <option value="">-- Choose a Preloaded Synthetic Sample Hash --</option>
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.algorithm}] {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleAnalyzeHash} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sample Password Hash String
                  </label>
                  <textarea
                    rows={3}
                    value={sampleHash}
                    onChange={(e) => setSampleHash(e.target.value)}
                    placeholder="Paste PHC string ($argon2id$...), modular crypt ($2b$...), or hex digest..."
                    className="w-full p-3 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Algorithm
                    </label>
                    <select
                      value={selectedAlgorithm}
                      onChange={(e) => setSelectedAlgorithm(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900"
                    >
                      <option value="AUTO">Auto-Detect Hash Format</option>
                      <option value="Argon2id">Argon2id (Modern Preferred)</option>
                      <option value="bcrypt">bcrypt (Adaptive)</option>
                      <option value="PBKDF2">PBKDF2-HMAC-SHA256</option>
                      <option value="SHA-256">SHA-256 (General-Purpose Demo)</option>
                      <option value="SHA-1">SHA-1 (Legacy Demo Only)</option>
                      <option value="MD5">MD5 (Legacy Demo Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      External Salt (if non-embedded)
                    </label>
                    <input
                      type="text"
                      value={externalSalt}
                      onChange={(e) => setExternalSalt(e.target.value)}
                      placeholder="Optional hex/text salt"
                      className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/15 transition"
                >
                  {analyzing ? 'Inspecting Hash Structure...' : 'Validate & Analyse Hash Format'}
                </button>
              </form>
            </div>

            {/* Synthetic Hash Generator & Verification Demo */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Synthetic Hash Generator & Verification Demonstration
              </h2>

              <form onSubmit={handleGenerateHash} className="space-y-3 pb-4 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Synthetic Input</label>
                    <input
                      type="text"
                      value={genInput}
                      onChange={(e) => setGenInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Algorithm</label>
                    <select
                      value={genAlgo}
                      onChange={(e) => setGenAlgo(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900"
                    >
                      <option value="Argon2id">Argon2id (64 MB, t=3, p=4)</option>
                      <option value="bcrypt">bcrypt (Cost=10)</option>
                      <option value="PBKDF2">PBKDF2-HMAC-SHA256 (100k)</option>
                      <option value="SHA-256">SHA-256</option>
                      <option value="SHA-1">SHA-1 (Legacy Demo)</option>
                      <option value="MD5">MD5 (Legacy Demo)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genRandomSalt}
                      onChange={(e) => setGenRandomSalt(e.target.checked)}
                    />
                    <span>Include Unique CSPRNG Salt</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Generate & Load Hash
                  </button>
                </div>
              </form>

              <form onSubmit={handleVerifyHash} className="space-y-3">
                <label className="block text-xs font-medium text-slate-700">
                  Verify Candidate Against Active Sample Hash
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCandidate}
                    onChange={(e) => setVerifyCandidate(e.target.value)}
                    placeholder="Enter candidate password to test match..."
                    className="flex-1 px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Verify Match
                  </button>
                </div>
                {verifyResult && (
                  <div
                    className={`p-3 rounded-md border text-xs ${
                      verifyResult.verified
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="font-bold">
                      {verifyResult.verified ? 'HASH VERIFICATION MATCHED' : 'VERIFICATION MISMATCH'} ({verifyResult.execution_time_ms} ms)
                    </div>
                    <div className="mt-0.5 text-slate-700">{verifyResult.explanation}</div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-6">
            {analysisResult ? (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-5">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500">Identified Algorithm & Paradigm</div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {analysisResult.selected_algorithm} — {analysisResult.hash_category}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      analysisResult.is_unsuitable_for_passwords
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {analysisResult.suitability}
                  </span>
                </div>

                {analysisResult.is_unsuitable_for_passwords && (
                  <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Unsuitable Password Storage Algorithm:</strong> {analysisResult.selected_algorithm} is a fast general-purpose digest with zero memory hardness, enabling billions of guesses per second on GPUs.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Format Validation</div>
                    <div className="font-semibold text-slate-900 mt-1">
                      {analysisResult.hash_format_valid ? 'Valid Standard Format' : 'Format Mismatch'}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Salt Status</div>
                    <div className="font-semibold text-emerald-800 mt-1">{analysisResult.salt_status}</div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Work Factor / Iterations</div>
                    <div className="font-mono font-semibold text-slate-900 mt-1">{analysisResult.work_factor}</div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Memory Cost</div>
                    <div className="font-mono font-semibold text-emerald-800 mt-1">{analysisResult.memory_cost}</div>
                  </div>
                </div>

                {analysisResult.extracted_salt && (
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500">Extracted Cryptographic Salt: </span>
                    <span className="font-mono text-amber-800 break-all">{analysisResult.extracted_salt}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900">Algorithm Characteristics</div>
                  <p className="text-slate-700 leading-relaxed">
                    {analysisResult.algorithm_characteristics?.description}
                  </p>
                  <div className="text-emerald-700 pt-1">
                    <strong>Recommended Configuration:</strong>{' '}
                    {analysisResult.algorithm_characteristics?.recommended_configuration}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {analysisResult.weaknesses?.length > 0 && (
                    <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 space-y-1.5">
                      <div className="font-semibold text-rose-700">Identified Weaknesses</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700">
                        {analysisResult.weaknesses.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3.5 rounded-md bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <div className="font-semibold text-emerald-700">Security Recommendations</div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {(analysisResult.recommendations || []).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                Click <strong>"Validate & Analyse Hash Format"</strong> to inspect the selected hash sample.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALTED VS UNSALTED DEMONSTRATION */}
      {activeTab === 'salting' && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Salted vs. Unsalted Password Hashing Demonstration
              </h2>
              <p className="text-xs text-slate-500">
                Observe what happens when User 1 and User 2 independently choose the exact same password.
              </p>
            </div>
            <form onSubmit={handleRunSaltingDemo} className="flex gap-2">
              <input
                type="text"
                value={saltDemoInput}
                onChange={(e) => setSaltDemoInput(e.target.value)}
                className="px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Re-Compute Hashes
              </button>
            </form>
          </div>

          {saltDemoResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-md bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700">1. Unsalted SHA-256</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px]">
                    IDENTICAL DIGESTS!
                  </span>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">User 1 Unsalted Digest:</div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-rose-800 break-all">
                    {saltDemoResult.unsalted_user1}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">User 2 Unsalted Digest:</div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-rose-800 break-all">
                    {saltDemoResult.unsalted_user2}
                  </div>
                </div>
                <p className="text-slate-700">
                  Because no salt is used, both users have the exact same hash. A single precomputed Rainbow Table entry compromises both accounts immediately.
                </p>
              </div>

              <div className="p-4 rounded-md bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700">2. Uniquely Salted SHA-256</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px]">
                    Unique Salts, Still Fast
                  </span>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">
                    User 1 (Salt: <span className="font-mono text-amber-800">{saltDemoResult.salted_sha256_user1.salt}</span>):
                  </div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-slate-800 break-all">
                    {saltDemoResult.salted_sha256_user1.hash}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">
                    User 2 (Salt: <span className="font-mono text-amber-800">{saltDemoResult.salted_sha256_user2.salt}</span>):
                  </div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-slate-800 break-all">
                    {saltDemoResult.salted_sha256_user2.hash}
                  </div>
                </div>
                <p className="text-slate-700">
                  Unique salts prevent Rainbow Tables, but single-pass SHA-256 is still too fast against direct GPU dictionary attacks.
                </p>
              </div>

              <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700">3. Argon2id (Salted + Memory-Hard)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                    OWASP Preferred
                  </span>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">User 1 Argon2id PHC String:</div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-emerald-800 break-all">
                    {saltDemoResult.argon2id_user1}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">User 2 Argon2id PHC String:</div>
                  <div className="p-2 rounded bg-slate-100 font-mono text-emerald-800 break-all">
                    {saltDemoResult.argon2id_user2}
                  </div>
                </div>
                <p className="text-slate-700">
                  Argon2id automatically embeds a unique 128-bit random salt AND enforces memory-hard key stretching.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTROLLED PASSWORD AUDITING */}
      {activeTab === 'auditing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Controlled Educational Auditing Exercise
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                Synthetic Targets Only
              </span>
            </div>

            <form onSubmit={handleRunControlledAudit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Auditing Mode</label>
                <select
                  value={auditJobType}
                  onChange={(e) => setAuditJobType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
                >
                  <option value="DICTIONARY_AUDIT">Controlled Dictionary + Rule Mutation Audit</option>
                  <option value="BRUTE_FORCE_DEMO">Limited Brute-Force Keyspace Demonstration (Max 3–4 chars)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Hashing Algorithm</label>
                <select
                  value={auditAlgo}
                  onChange={(e) => setAuditAlgo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
                >
                  <option value="MD5">MD5 (Preloaded Synthetic Sample)</option>
                  <option value="SHA-1">SHA-1 (Preloaded Synthetic Sample)</option>
                  <option value="SHA-256">SHA-256 (Preloaded Synthetic Sample)</option>
                  <option value="PBKDF2">PBKDF2-HMAC-SHA256</option>
                  <option value="bcrypt">bcrypt (Cost=10)</option>
                  <option value="Argon2id">Argon2id (Memory-Hard)</option>
                </select>
              </div>

              {auditJobType === 'BRUTE_FORCE_DEMO' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Bounded Brute-Force Character Set
                  </label>
                  <select
                    value={auditCharset}
                    onChange={(e) => setAuditCharset(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="numeric">Digits Only (0–9, up to 3 digits = 1,000 combinations)</option>
                    <option value="alphanumeric_short">Hexadecimal (0–9a–f)</option>
                    <option value="lowercase_short">Lowercase Alpha (a–z)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Optional Custom Synthetic Target Hash (Leave blank to audit preloaded dataset)
                </label>
                <input
                  type="text"
                  value={auditCustomHash}
                  onChange={(e) => setAuditCustomHash(e.target.value)}
                  placeholder="Optional synthetic hash..."
                  className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Configurable Attempt Limit (Max 10,000)
                </label>
                <input
                  type="number"
                  min={20}
                  max={10000}
                  value={auditMaxAttempts}
                  onChange={(e) => setAuditMaxAttempts(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={auditRunning}
                className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
              >
                <Play className="w-4 h-4" />
                <span>{auditRunning ? 'Executing Controlled Audit...' : 'Start Controlled Auditing Exercise'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            {auditResult ? (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500">Controlled Audit Telemetry</div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {auditResult.job_type} — {auditResult.target_algorithm}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Status: {auditResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Attempts Executed</div>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                      {auditResult.attempts_count} / {auditResult.max_attempts}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Execution Time</div>
                    <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                      {auditResult.execution_time_ms} ms
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Throughput</div>
                    <div className="text-lg font-mono font-bold text-amber-700 mt-0.5">
                      {Number(auditResult.attempts_per_second).toLocaleString()} /s
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Targets Matched</div>
                    <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                      {auditResult.matched_count} / {auditResult.total_targets}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-900">Target Hash Audit Results</div>
                  {(auditResult.audit_findings || []).map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        f.matched
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{f.target_label}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{f.sample_hash_preview}</div>
                        <div className="text-slate-700 mt-1">{f.matched_pattern_label}</div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className={f.matched ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                          {f.matched ? 'RECOVERED IN LAB' : 'RESISTED AUDIT'}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {f.attempts_to_match} attempts ({f.time_ms} ms)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-emerald-700">Audit Summary: </strong>
                  {auditResult.educational_summary}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                Configure an educational dictionary or bounded brute-force exercise and click <strong>"Start Controlled Auditing Exercise"</strong>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

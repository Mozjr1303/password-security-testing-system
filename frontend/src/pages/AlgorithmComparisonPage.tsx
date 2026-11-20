import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Play,
  ShieldAlert,
  ShieldCheck,
  Zap,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { apiFetch } from '../api';

export const AlgorithmComparisonPage: React.FC = () => {
  const [bcryptCost, setBcryptCost] = useState(10);
  const [argon2MemoryKb, setArgon2MemoryKb] = useState(65536);
  const [argon2TimeCost, setArgon2TimeCost] = useState(3);
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(150000);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [algorithmsMeta, setAlgorithmsMeta] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const loadInitial = async () => {
    try {
      const [metaRes, benchRes] = await Promise.all([
        apiFetch('/api/hash/algorithms'),
        apiFetch('/api/hash/benchmarks'),
      ]);
      setAlgorithmsMeta(metaRes.algorithms || []);
      // Deduplicate latest 6 algorithms
      const seen = new Set<string>();
      const latest6: any[] = [];
      for (const b of benchRes.benchmarks || []) {
        if (!seen.has(b.algorithm)) {
          seen.add(b.algorithm);
          latest6.push(b);
        }
      }
      const order = ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'];
      setBenchmarks(order.map((a) => latest6.find((x) => x.algorithm === a)).filter(Boolean));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleRunBenchmarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await apiFetch('/api/hash/benchmark', {
        method: 'POST',
        body: JSON.stringify({
          algorithms: ['MD5', 'SHA-1', 'SHA-256', 'PBKDF2', 'bcrypt', 'Argon2id'],
          bcrypt_cost: bcryptCost,
          argon2_memory_kb: argon2MemoryKb,
          argon2_time_cost: argon2TimeCost,
          pbkdf2_iterations: pbkdf2Iterations,
        }),
      });
      setBenchmarks(res.benchmarks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hashing Algorithm Comparison Module (SRS Section 3.4)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Cryptographic Execution Speed, Memory Cost & Guessing Resistance Benchmark
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare processing time, RAM requirements, salt support, and GPU resistance across MD5, SHA-1, SHA-256, PBKDF2, bcrypt, and Argon2id.
          </p>
        </div>
      </div>

      {/* Warning Banner about Fast General-Purpose Hashes */}
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-rose-800">
            CRITICAL ARCHITECTURAL DISTINCTION: Fast General-Purpose Hashes Are Unsuitable for Password Storage
          </div>
          <p className="text-slate-700 leading-relaxed">
            Algorithms such as <strong>MD5</strong>, <strong>SHA-1</strong>, and raw <strong>SHA-256</strong> are engineered to process gigabytes of data per second with less than 2 KB of register memory. When used for passwords, attackers with off-the-shelf GPUs can test <strong>10 to 25 billion candidates per second</strong>. Modern password storage requires purposefully slow, salted, and memory-hard adaptive functions—specifically <strong>Argon2id</strong> (or <strong>bcrypt</strong> / high-iteration <strong>PBKDF2</strong>).
          </p>
        </div>
      </div>

      {/* Benchmark Configuration Form */}
      <form
        onSubmit={handleRunBenchmarks}
        className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-xs"
      >
        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Argon2id Memory Cost (KB)
          </label>
          <select
            value={argon2MemoryKb}
            onChange={(e) => setArgon2MemoryKb(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
          >
            <option value={19456}>19,456 KB (19 MB - OWASP Min)</option>
            <option value={32768}>32,768 KB (32 MB)</option>
            <option value={65536}>65,536 KB (64 MB - Recommended)</option>
            <option value={131072}>131,072 KB (128 MB - High Security)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Argon2id Time Cost (Iterations)
          </label>
          <select
            value={argon2TimeCost}
            onChange={(e) => setArgon2TimeCost(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
          >
            <option value={2}>t = 2 iterations</option>
            <option value={3}>t = 3 iterations (Recommended)</option>
            <option value={4}>t = 4 iterations</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            bcrypt Work Factor (Cost)
          </label>
          <select
            value={bcryptCost}
            onChange={(e) => setBcryptCost(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
          >
            <option value={8}>Cost 8 (256 rounds - Fast Lab)</option>
            <option value={10}>Cost 10 (1,024 rounds)</option>
            <option value={12}>Cost 12 (4,096 rounds - Recommended)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            PBKDF2-HMAC-SHA256 Iterations
          </label>
          <select
            value={pbkdf2Iterations}
            onChange={(e) => setPbkdf2Iterations(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
          >
            <option value={50000}>50,000 iterations</option>
            <option value={150000}>150,000 iterations</option>
            <option value={310000}>310,000 iterations</option>
            <option value={600000}>600,000 iterations (OWASP Standard)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={running}
          className="py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
        >
          <Play className="w-4 h-4" />
          <span>{running ? 'Running Live Benchmark...' : 'Execute Live Benchmark'}</span>
        </button>
      </form>

      {/* Performance & Memory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Execution Time per Hash (Milliseconds)</h2>
              <p className="text-xs text-slate-500">Higher single-hash latency (~50–250 ms) throttles offline cracking</p>
            </div>
            <Zap className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="algorithm" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="execution_time" name="Execution Time (ms)" radius={[6, 6, 0, 0]}>
                  {benchmarks.map((b, i) => (
                    <Cell
                      key={i}
                      fill={
                        ['MD5', 'SHA-1', 'SHA-256'].includes(b.algorithm)
                          ? '#EF4444'
                          : b.algorithm === 'Argon2id'
                          ? '#10B981'
                          : '#059669'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Memory Usage per Hash (Kilobytes)</h2>
              <p className="text-xs text-slate-500">Memory hardness defeats massive GPU/ASIC core parallelism</p>
            </div>
            <HardDrive className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="algorithm" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="memory_usage" name="Memory Footprint (KB)" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive 7-Criteria Comparison Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Algorithm Comparison Matrix (SRS Section 3.4 Criteria)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">Algorithm</th>
                <th className="py-2.5 px-2">Processing Time</th>
                <th className="py-2.5 px-2">Memory Cost</th>
                <th className="py-2.5 px-2">Salt Support</th>
                <th className="py-2.5 px-2">Password Suitability</th>
                <th className="py-2.5 px-2">Security Rating</th>
                <th className="py-2.5 px-2">Resistance to Large-Scale Guessing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {benchmarks.map((b, idx) => {
                const isBad = ['MD5', 'SHA-1', 'SHA-256'].includes(b.algorithm);
                return (
                  <tr key={idx} className="hover:bg-emerald-50/40">
                    <td className="py-3 px-2 font-bold text-slate-900">{b.algorithm}</td>
                    <td className="py-3 px-2 font-mono text-emerald-800">{b.execution_time} ms</td>
                    <td className="py-3 px-2 font-mono text-emerald-800">
                      {Number(b.memory_usage).toLocaleString()} KB
                    </td>
                    <td className="py-3 px-2 text-slate-700">{b.salt_support}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] border ${
                          isBad
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : b.algorithm === 'Argon2id'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {b.suitability}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">{b.security_rating}/100</td>
                    <td className="py-3 px-2 text-slate-700">{b.resistance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Algorithm Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {algorithmsMeta.map((meta) => {
          const isLegacy = ['MD5', 'SHA-1', 'SHA-256'].includes(meta.id);
          return (
            <div
              key={meta.id}
              className="bg-white shadow-sm border border-slate-200 rounded-lg p-4 flex flex-col justify-between text-xs space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{meta.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      isLegacy ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Rating: {meta.security_rating}/100
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">{meta.category}</div>
                <p className="text-slate-500 leading-relaxed">{meta.description}</p>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                <strong className="text-slate-900">Recommended Config: </strong>
                {meta.recommended_configuration}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

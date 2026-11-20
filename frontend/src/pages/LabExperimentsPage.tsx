import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  BookOpen,
  Cpu,
  Clock,
  Lightbulb,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { apiFetch } from '../api';

export const LabExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExp, setSelectedExp] = useState<any>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/lab/experiments');
        const list = res.experiments || [];
        setExperiments(list);
        if (list.length > 0) {
          selectExperiment(list[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const selectExperiment = (exp: any) => {
    setSelectedExp(exp);
    const defaultInputs: Record<string, any> = {};
    for (const inp of exp.required_inputs || []) {
      defaultInputs[inp.name] = inp.default_value;
    }
    setInputs(defaultInputs);
    setOutput(null);
  };

  const handleRunExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;
    setRunning(true);
    try {
      const res = await apiFetch(`/api/lab/experiments/${selectedExp.id}/run`, {
        method: 'POST',
        body: JSON.stringify({ inputs }),
      });
      setOutput(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Controlled Laboratory Simulation Module (SRS Section 3.6)</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">
          Interactive Predefined Cybersecurity Laboratory Experiments (1–6)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select an experiment below to configure parameters, execute controlled simulations within resource limits, and review security lessons.
        </p>
      </div>

      {/* 6 Experiment Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {experiments.map((exp) => {
          const active = selectedExp?.id === exp.id;
          return (
            <button
              key={exp.id}
              onClick={() => selectExperiment(exp)}
              className={`text-left p-4 rounded-lg border transition ${
                active
                  ? 'bg-emerald-50/80 border-emerald-600 shadow-lg shadow-emerald-600/10'
                  : 'bg-white shadow-sm border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-emerald-700">{exp.id}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                  {exp.difficulty}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900">{exp.title}</div>
              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{exp.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Active Experiment Workbench */}
      {selectedExp && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Description, Objectives, Required Inputs & Execution Controls */}
          <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-5 text-xs">
            <div>
              <div className="text-emerald-700 font-semibold">{selectedExp.id} SPECIFICATION</div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedExp.title}</h2>
              <p className="text-slate-700 mt-2 leading-relaxed">{selectedExp.description}</p>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Learning Objectives</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                {(selectedExp.learning_objectives || []).map((obj: string, i: number) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleRunExperiment} className="space-y-3.5">
              <div className="font-semibold text-slate-900">Required Experiment Inputs</div>
              {(selectedExp.required_inputs || []).map((inp: any) => (
                <div key={inp.name}>
                  <label className="block text-slate-700 mb-1">{inp.label}</label>
                  {inp.type === 'select' ? (
                    <select
                      value={inputs[inp.name] ?? inp.default_value}
                      onChange={(e) => setInputs({ ...inputs, [inp.name]: e.target.value })}
                      className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
                    >
                      {(inp.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={inp.type}
                      value={inputs[inp.name] ?? inp.default_value}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          [inp.name]: inp.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                    />
                  )}
                </div>
              ))}

              {/* Execution Controls Summary */}
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Laboratory Resource & Execution Controls</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>
                    Max Attempts:{' '}
                    <strong className="text-slate-900 font-mono">
                      {selectedExp.execution_controls?.max_attempts}
                    </strong>
                  </div>
                  <div>
                    Time Cap:{' '}
                    <strong className="text-slate-900 font-mono">
                      {selectedExp.execution_controls?.max_execution_ms} ms
                    </strong>
                  </div>
                  <div>
                    RAM Limit:{' '}
                    <strong className="text-slate-900 font-mono">
                      {(selectedExp.execution_controls?.memory_cap_kb / 1024).toFixed(0)} MB
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={running}
                className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
              >
                <Play className="w-4 h-4" />
                <span>{running ? 'Running Experiment Simulation...' : `Start ${selectedExp.id}`}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Experiment Results, Explanation, Security Lessons & Recommendations */}
          <div className="lg:col-span-7">
            {output ? (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <div className="text-emerald-700 font-semibold">EXPERIMENT EXECUTION COMPLETED</div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{output.experiment?.title}</h3>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-slate-900 font-bold">{output.execution_time_ms} ms</div>
                    <div className="text-slate-500 text-[11px]">{output.attempts_count} operations</div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Experimental Analysis & Explanation</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{output.explanation}</p>
                </div>

                {/* Dynamic Results Renderer */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900">Structured Telemetry Output</div>

                  {output.results?.samples && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {output.results.samples.map((s: any, i: number) => (
                        <div key={i} className="p-3 rounded-md bg-slate-100 border border-slate-200 space-y-1">
                          <div className="font-bold text-slate-900">{s.label}</div>
                          <div className="text-emerald-700 font-mono">
                            Score: {s.overall_score}/100 ({s.strength_category})
                          </div>
                          <div className="text-slate-500">
                            Entropy: <strong className="text-slate-900">{s.entropy_estimate} bits</strong>
                          </div>
                          <div className="text-slate-500">
                            Fast GPU Crack: <strong className="text-amber-800">{s.estimated_crack_time}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {output.results?.benchmarks && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {output.results.benchmarks.map((b: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                          <div className="font-bold text-slate-900">{b.algorithm}</div>
                          <div className="font-mono text-emerald-800">{b.execution_time} ms</div>
                          <div className="text-slate-500 text-[11px]">
                            RAM: {b.memory_usage} KB | Rating: {b.security_rating}/100
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {output.results?.keyspace_table && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1.5 px-2">Length</th>
                            <th className="py-1.5 px-2">Digits Only (10^L)</th>
                            <th className="py-1.5 px-2">Alphanumeric (62^L)</th>
                            <th className="py-1.5 px-2">Full ASCII (94^L)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          {output.results.keyspace_table.map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="py-1.5 px-2 text-slate-900 font-bold">{row.length} chars</td>
                              <td className="py-1.5 px-2 text-amber-800">{row.digits_only}</td>
                              <td className="py-1.5 px-2 text-emerald-800">{row.alphanumeric_62}</td>
                              <td className="py-1.5 px-2 text-emerald-800">{row.full_ascii_94}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!output.results?.samples && !output.results?.benchmarks && !output.results?.keyspace_table && (
                    <pre className="p-3 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto max-h-56">
                      {JSON.stringify(output.results, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Security Lessons & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-amber-700 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Key Security Lessons</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                      {(output.security_lessons || []).map((l: string, i: number) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Actionable Recommendations</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                      {(output.recommendations || []).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-10 text-center space-y-2">
                <FlaskConical className="w-8 h-8 text-emerald-700 mx-auto" />
                <div className="text-sm font-bold text-slate-900">
                  Ready to Execute {selectedExp.title}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Review the learning objectives and inputs on the left, then click <strong>"Start {selectedExp.id}"</strong> to run the controlled simulation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

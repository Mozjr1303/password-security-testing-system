import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Filter,
  Code2,
  Copy,
  Check,
  Wrench,
} from 'lucide-react';
import { apiFetch } from '../api';

export const SecurityFindingsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFindings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/recommendations/findings?severity=${severityFilter}`);
      setFindings(res.findings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [severityFilter]);

  const badgeStyle = (sev: string) => {
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
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Identified Security Weaknesses & Risk Classifications</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Security Findings Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review all identified password strength, hash format, storage configuration, and authentication weaknesses across laboratory assessments.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'Critical', 'High', 'Medium', 'Low', 'Informational'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-md font-semibold border transition ${
                severityFilter === sev
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3.5">
        {findings.map((f) => {
          const primaryRec = f.recommendations?.[0];
          return (
            <div
              key={f.id}
              className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle(f.severity)}`}>
                    {f.severity}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">{f.finding_title}</h2>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Category: <strong className="text-slate-800">{f.category}</strong> | Assessment:{' '}
                  <strong className="text-emerald-700">{f.assessment?.assessment_name}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-slate-500 font-semibold">Weakness Description</div>
                  <p className="text-slate-800 leading-relaxed">{f.description}</p>
                  <div className="text-amber-800 pt-1">
                    <strong>Security Impact:</strong> {f.impact}
                  </div>
                </div>

                {primaryRec && (
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-700">Recommended Solution</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px]">
                        Priority: {primaryRec.priority}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{primaryRec.recommendation}</p>
                    <p className="text-slate-500">{primaryRec.implementation_details}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && findings.length === 0 && (
          <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
            No security findings match the selected severity filter.
          </div>
        )}
      </div>
    </div>
  );
};

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [referenceMatrix, setReferenceMatrix] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/recommendations?priority=${priorityFilter}`);
        setRecommendations(res.recommendations || []);
        setReferenceMatrix(res.reference_matrix || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [priorityFilter]);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(id);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Wrench className="w-3.5 h-3.5" />
            <span>Automated Security Recommendations Engine (SRS Section 3.7)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Actionable Remediation & Technical Implementation Guidance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rules-based security recommendations with risk levels, implementation priorities, and production-ready code guidance.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'Immediate', 'High', 'Medium', 'Low'].map((prio) => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-md font-semibold border transition ${
                priorityFilter === prio
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {prio === 'ALL' ? 'All Priorities' : `${prio} Priority`}
            </button>
          ))}
        </div>
      </div>

      {/* SRS Section 3.7 Rules Matrix Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          PSTS Standard Weakness-to-Recommendation Rules Matrix (SRS Section 3.7)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">Identified Weakness</th>
                <th className="py-2.5 px-2">Risk Level</th>
                <th className="py-2.5 px-2">Automated Recommendation</th>
                <th className="py-2.5 px-2">Priority</th>
                <th className="py-2.5 px-2">Technical Implementation Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {referenceMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/40">
                  <td className="py-2.5 px-2 font-semibold text-slate-900">{row.weakness}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        row.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-700'
                          : row.severity === 'High'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-semibold text-emerald-700">{row.recommendation}</td>
                  <td className="py-2.5 px-2 text-emerald-800 font-medium">{row.priority}</td>
                  <td className="py-2.5 px-2 text-slate-700">{row.implementation_details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Assessment Recommendations with Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-3 text-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {rec.priority} Priority
                </span>
                <span className="text-slate-500">
                  Risk: <strong className="text-slate-900">{rec.finding?.severity}</strong>
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{rec.recommendation}</h3>
              <div className="text-slate-500">
                Addresses Finding: <span className="text-slate-800">{rec.finding?.finding_title}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{rec.implementation_details}</p>
            </div>

            {rec.code_snippet && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Reference Implementation</span>
                  </span>
                  <button
                    onClick={() => copySnippet(rec.code_snippet, rec.id)}
                    className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    {copiedIdx === rec.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-md bg-slate-50 border border-slate-200 font-mono text-[11px] text-emerald-800 overflow-x-auto">
                  {rec.code_snippet}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

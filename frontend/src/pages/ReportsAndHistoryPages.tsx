import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Trash2,
  Eye,
  Plus,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  History,
  Layers,
} from 'lucide-react';
import { apiFetch, getReportDownloadUrl } from '../api';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeReport, setActiveReport] = useState<any>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  const loadReports = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('assessment_type', typeFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const [rRes, aRes] = await Promise.all([
        apiFetch(`/api/reports?${params.toString()}`),
        apiFetch('/api/assessments'),
      ]);
      const list = rRes.reports || [];
      setReports(list);
      setAssessments(aRes.assessments || []);
      if (aRes.assessments?.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(aRes.assessments[0].id);
      }
      if (list.length > 0 && !activeReport) {
        setActiveReport(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReports();
  }, [typeFilter, fromDate, toDate]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          assessment_id: selectedAssessmentId,
          report_type: 'PDF',
        }),
      });
      await loadReports();
      setActiveReport(res.report);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await apiFetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (activeReport?.id === reportId) {
        setActiveReport(null);
      }
      await loadReports();
    } catch (err) {
      console.error(err);
    }
  };

  const payload = activeReport?.payload;

  return (
    <div className="space-y-6">
      {/* Header & Report Generator Bar */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <FileText className="w-3.5 h-3.5" />
            <span>Security Assessment Report Module (SRS Section 3.8)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            14-Section Password Security Assessment Reports (PDF & CSV)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate, preview, filter, and download sanitized assessment reports with zero plaintext credentials.
          </p>
        </div>

        <form onSubmit={handleGenerateReport} className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 max-w-xs"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assessment_name} ({Number(a.overall_score).toFixed(1)}/100)
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generating || !selectedAssessmentId}
            className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/15"
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Compiling Report...' : 'Generate New Report'}</span>
          </button>
        </form>
      </div>

      {/* Filters Row */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by Type:</span>
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
          >
            <option value="ALL">All Assessment Types</option>
            <option value="Full Security Assessment">Full Security Assessment</option>
            <option value="Password Strength">Password Strength</option>
            <option value="Hash Analysis">Hash Analysis</option>
            <option value="Storage Assessment">Storage Assessment</option>
            <option value="Algorithm Comparison">Algorithm Comparison</option>
            <option value="Lab Experiment">Lab Experiment</option>
          </select>

          <span className="text-slate-500 ml-2">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
          />
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
          />
        </div>
        <div className="text-slate-500">{reports.length} report(s) available</div>
      </div>

      {/* Main Split View: Report List + 14-Section Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          {reports.map((rpt) => {
            const isSelected = activeReport?.id === rpt.id;
            return (
              <div
                key={rpt.id}
                onClick={() => setActiveReport(rpt)}
                className={`cursor-pointer p-4 rounded-lg border transition text-xs space-y-2.5 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-600 shadow-lg shadow-emerald-600/10'
                    : 'bg-white shadow-sm border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-700">{rpt.report_number}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                    {rpt.risk_classification} ({Number(rpt.overall_score).toFixed(1)}/100)
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900">{rpt.assessment_name}</div>
                <div className="text-slate-500 text-[11px]">
                  Type: {rpt.assessment_type} | Generated: {new Date(rpt.generated_at).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <a
                    href={getReportDownloadUrl(rpt.id, 'PDF')}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                  <a
                    href={getReportDownloadUrl(rpt.id, 'CSV')}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReport(rpt.id);
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                    title="Delete Report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Full 14-Section Report Preview */}
        <div className="lg:col-span-8">
          {payload ? (
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-emerald-700 font-mono font-bold">
                    1. REPORT ID: {payload.report_id_number}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{payload.assessment_name}</h2>
                  <div className="text-slate-500 mt-0.5">
                    2. Assessment Date: {new Date(payload.assessment_date).toUTCString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getReportDownloadUrl(activeReport.id, 'PDF')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={getReportDownloadUrl(activeReport.id, 'CSV')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                </div>
              </div>

              {/* Section 3 & 13 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-emerald-700">3. Researcher Information</div>
                  <div className="text-slate-900 font-semibold">{payload.researcher_info?.full_name}</div>
                  <div className="text-slate-500">{payload.researcher_info?.email}</div>
                  <div className="text-slate-700">Role: {payload.researcher_info?.role}</div>
                </div>
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-emerald-700">13. Overall Security Score & Classification</div>
                  <div className="text-2xl font-mono font-bold text-slate-900">
                    {payload.overall_security_score} / 100{' '}
                    <span className="text-sm text-emerald-700">
                      ({payload.risk_classifications?.overall_classification})
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Evaluation Type: {payload.risk_classifications?.score_type} Score
                  </div>
                </div>
              </div>

              {/* Section 4, 5, 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">4. Assessment Objectives</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(payload.assessment_objectives || []).map((o: string, i: number) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">5. Testing Methodology</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(payload.testing_methodology || []).map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">6. Algorithms Evaluated: </span>
                <span className="font-mono text-emerald-800">
                  {(payload.algorithms_evaluated || []).join('  •  ')}
                </span>
              </div>

              {/* Section 7 & 8 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">7. Password Strength Results (Zero Plaintext)</div>
                  {(payload.password_strength_results || []).length === 0 ? (
                    <div className="text-slate-500">No synthetic password tests attached.</div>
                  ) : (
                    (payload.password_strength_results || []).map((pt: any, i: number) => (
                      <div key={i} className="p-2.5 rounded bg-slate-100 border border-slate-200">
                        <div className="font-semibold text-slate-900">
                          Sample #{i + 1}: {pt.strength_category} ({pt.score}/100)
                        </div>
                        <div className="text-slate-500">
                          Length: {pt.length} chars | Entropy: {pt.entropy_bits} bits | Est. Crack: {pt.estimated_crack_time}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">8. Hash Analysis Results</div>
                  {(payload.hash_analysis_results || []).length === 0 ? (
                    <div className="text-slate-500">No sample hash analyses attached.</div>
                  ) : (
                    (payload.hash_analysis_results || []).map((ha: any, i: number) => (
                      <div key={i} className="p-2.5 rounded bg-slate-100 border border-slate-200">
                        <div className="font-semibold text-slate-900">
                          {ha.algorithm} — {ha.suitability}
                        </div>
                        <div className="text-slate-500">
                          Salt: {ha.salt_status} | Work: {ha.work_factor} | RAM: {ha.memory_cost}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 9 & 10 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-rose-700">9. Password Storage Weaknesses</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(payload.password_storage_weaknesses || []).map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-amber-700">10. Authentication Weaknesses</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(payload.authentication_weaknesses || []).map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section 11 & 12 */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">
                  11. Risk Classifications (Critical: {payload.risk_classifications?.critical_count} | High: {payload.risk_classifications?.high_count} | Medium: {payload.risk_classifications?.medium_count} | Low: {payload.risk_classifications?.low_count})
                </div>
                <div className="font-bold text-emerald-700 pt-1">12. Automated Security Recommendations</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {(payload.security_recommendations || []).map((r: any, i: number) => (
                    <li key={i}>
                      <strong>[{r.priority}] {r.recommendation}:</strong> {r.implementation_details}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 14 */}
              <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-800">14. Conclusion</div>
                <p className="text-slate-800 leading-relaxed">{payload.conclusion}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-sm">
              Select a report on the left or click <strong>"Generate New Report"</strong> to preview all 14 sections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AssessmentHistoryPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>('');
  const [wizName, setWizName] = useState('Enterprise Authentication Security Audit 2026');
  const [wizPw, setWizPw] = useState('P@ssw0rd2026!');
  const [wizAlgo, setWizAlgo] = useState('Argon2id');
  const [wizMfa, setWizMfa] = useState(true);
  const [wizLog, setWizLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const loadAssessments = async () => {
    try {
      const res = await apiFetch('/api/assessments');
      setAssessments(res.assessments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const executeTenStepMethodology = async () => {
    setBusy(true);
    const logs: string[] = [];
    try {
      // Step 1: Assessment Creation
      setWizardStep(1);
      const step1 = await apiFetch('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({
          assessment_name: wizName,
          description: 'Executed via 10-Step Structured PSTS Assessment Methodology (SRS Section 8)',
          assessment_type: 'Full Security Assessment',
        }),
      });
      const aId = step1.assessment.id;
      setActiveAssessmentId(aId);
      logs.push(`Step 1: Created Assessment "${wizName}" (ID: ${aId.substring(0, 8)})`);
      setWizLog([...logs]);

      // Step 2: Password Strength Evaluation
      setWizardStep(2);
      const step2 = await apiFetch('/api/password/test', {
        method: 'POST',
        body: JSON.stringify({ password: wizPw, assessment_id: aId, save_to_history: true }),
      });
      logs.push(
        `Step 2: Evaluated synthetic password (${step2.evaluation.strength_category}, ${step2.evaluation.overall_score}/100, ${step2.evaluation.entropy_estimate} bits entropy - Zero plaintext stored)`
      );
      setWizLog([...logs]);

      // Step 3 & 4: Hash Analysis & Algorithm Evaluation
      setWizardStep(3);
      const genHash = await apiFetch('/api/hash/generate', {
        method: 'POST',
        body: JSON.stringify({ synthetic_input: wizPw, algorithm: wizAlgo, use_random_salt: true }),
      });
      setWizardStep(4);
      const step4 = await apiFetch('/api/hash/analyze', {
        method: 'POST',
        body: JSON.stringify({ sample_hash: genHash.hash, algorithm: wizAlgo, assessment_id: aId }),
      });
      logs.push(
        `Step 3 & 4: Generated & analyzed ${wizAlgo} sample hash (${step4.analysis.suitability}, Salt: ${step4.analysis.salt_status})`
      );
      setWizLog([...logs]);

      // Step 5: Laboratory Experiment
      setWizardStep(5);
      const step5 = await apiFetch('/api/lab/experiments/EXP-2/run', {
        method: 'POST',
        body: JSON.stringify({ assessment_id: aId, inputs: { bcrypt_cost: 10, argon2_memory_kb: 32768 } }),
      });
      logs.push(`Step 5: Executed Controlled Lab Experiment (${step5.experiment.title})`);
      setWizLog([...logs]);

      // Step 6, 7, 8: Storage Assessment, Security Findings & Recommendations
      setWizardStep(6);
      const step6 = await apiFetch('/api/storage/assess', {
        method: 'POST',
        body: JSON.stringify({
          assessment_id: aId,
          algorithm: wizAlgo,
          salt_configuration: ['Argon2id', 'bcrypt'].includes(wizAlgo)
            ? 'Unique Random (>= 16 bytes)'
            : 'Unsalted',
          salt_uniqueness: ['Argon2id', 'bcrypt'].includes(wizAlgo),
          work_factor: wizAlgo === 'Argon2id' ? 3 : 10,
          memory_cost: wizAlgo === 'Argon2id' ? 65536 : 4,
          iteration_count: 3,
          storage_format: wizAlgo === 'Argon2id' ? 'PHC String ($argon2id$...)' : 'Raw Hex Digest',
          reset_implementation: 'Expiring Single-Use CSPRNG Token (Hashed)',
          mfa_enabled: wizMfa,
          rate_limiting: wizMfa,
          measured_password_score: step2.evaluation.overall_score,
        }),
      });
      setWizardStep(8);
      logs.push(
        `Step 6, 7 & 8: Storage Assessment scored ${step6.evaluation.overall_score}/100 (${step6.evaluation.score_classification}) with ${step6.evaluation.findings.length} finding(s) & recommendations`
      );
      setWizLog([...logs]);

      // Step 9: Report Generation
      setWizardStep(9);
      const step9 = await apiFetch('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ assessment_id: aId, report_type: 'PDF' }),
      });
      logs.push(`Step 9: Generated 14-Section Security Report (${step9.report.report_number})`);
      setWizLog([...logs]);

      // Step 10: Complete Assessment History
      setWizardStep(10);
      await apiFetch(`/api/assessments/${aId}/complete`, { method: 'PUT' });
      logs.push('Step 10: Completed & archived assessment in history without retaining any plaintext password.');
      setWizLog([...logs]);

      await loadAssessments();
    } catch (err: any) {
      logs.push(`Error: ${err.message}`);
      setWizLog([...logs]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <History className="w-3.5 h-3.5" />
            <span>Password Security Assessment Methodology & History (SRS Section 8)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            10-Step Structured Assessment Workflow & Historical Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Run a complete 10-step structured password security assessment from creation to PDF report generation, or inspect historical assessments.
          </p>
        </div>

        <button
          onClick={() => setWizardOpen(!wizardOpen)}
          className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/15"
        >
          <Layers className="w-4 h-4" />
          <span>{wizardOpen ? 'Hide 10-Step Methodology Runner' : 'Run 10-Step Structured Assessment'}</span>
        </button>
      </div>

      {/* 10-Step Methodology Interactive Runner (SRS Section 8) */}
      {wizardOpen && (
        <div className="bg-white shadow-sm border border-emerald-300 rounded-lg p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                10-Step Password Security Assessment Methodology Runner (SRS Section 8)
              </h2>
              <p className="text-slate-500">
                Automates Steps 1 through 10 sequentially and stores the completed assessment without retaining plaintext passwords.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
              Active Step: {wizardStep} / 10
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              '1. Assessment Creation',
              '2. Password Strength',
              '3. Hash Analysis',
              '4. Algorithm Evaluation',
              '5. Lab Experiment',
              '6. Storage Assessment',
              '7. Security Findings',
              '8. Recommendations',
              '9. Report Generation',
              '10. Assessment History',
            ].map((label, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-md border text-[11px] font-medium ${
                  wizardStep > idx + 1
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : wizardStep === idx + 1
                    ? 'bg-emerald-50 border-emerald-600 text-slate-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-slate-700 mb-1">Step 1: Assessment Name</label>
              <input
                type="text"
                value={wizName}
                onChange={(e) => setWizName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Step 2: Synthetic Test Password</label>
              <input
                type="text"
                value={wizPw}
                onChange={(e) => setWizPw(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Step 3–6: Storage Algorithm</label>
              <select
                value={wizAlgo}
                onChange={(e) => setWizAlgo(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="Argon2id">Argon2id (Modern Hardened)</option>
                <option value="bcrypt">bcrypt (Cost=10)</option>
                <option value="PBKDF2">PBKDF2-HMAC-SHA256</option>
                <option value="SHA-256">SHA-256 (Fast Digest)</option>
                <option value="MD5">MD5 (Legacy Broken)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={executeTenStepMethodology}
              disabled={busy}
              className="py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20"
            >
              {busy ? 'Executing 10-Step Pipeline...' : 'Execute Complete 10-Step Assessment'}
            </button>
          </div>

          {wizLog.length > 0 && (
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
              {wizLog.map((line, i) => (
                <div key={i} className="text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
              {wizardStep === 10 && !busy && (
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('reports')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-sans font-semibold text-xs"
                  >
                    Open Generated Assessment Report →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assessment History Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Completed Security Assessments ({assessments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">Assessment Name</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Overall Score</th>
                <th className="py-2.5 px-2">Classification</th>
                <th className="py-2.5 px-2">Score Basis</th>
                <th className="py-2.5 px-2">Findings</th>
                <th className="py-2.5 px-2">Researcher</th>
                <th className="py-2.5 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-emerald-50/40">
                  <td className="py-3 px-2 font-semibold text-slate-900">{a.assessment_name}</td>
                  <td className="py-3 px-2 text-slate-700">{a.assessment_type}</td>
                  <td className="py-3 px-2 font-mono font-bold text-slate-900">
                    {Number(a.overall_score).toFixed(1)}/100
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        a.risk_classification === 'Excellent'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.risk_classification === 'Good'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.risk_classification === 'Moderate'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {a.risk_classification}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-emerald-800">{a.score_type}</td>
                  <td className="py-3 px-2 font-mono text-slate-700">
                    {a._count?.security_findings || 0} findings / {a._count?.reports || 0} reports
                  </td>
                  <td className="py-3 px-2 text-slate-500">{a.user?.full_name}</td>
                  <td className="py-3 px-2 text-slate-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

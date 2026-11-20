import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Users,
  Database,
  ScrollText,
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { apiFetch, UserProfile } from '../api';

export const SettingsPage: React.FC<{
  user: UserProfile;
  onUserUpdated: (u: UserProfile) => void;
}> = ({ user, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [sessionTimeout, setSessionTimeout] = useState(user.session_timeout_min || 30);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/profile')
      .then((res) => {
        setProfileDetails(res);
        setFullName(res.full_name);
        setSessionTimeout(res.session_timeout_min || 30);
      })
      .catch(console.error);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          session_timeout_min: sessionTimeout,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });
      setMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      onUserUpdated({
        ...user,
        full_name: res.user.full_name,
        session_timeout_min: res.user.session_timeout_min,
      });
    } catch (error: any) {
      setErr(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <Settings className="w-3.5 h-3.5" />
          <span>Account Security & Session Preferences (SRS Section 3.1)</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">
          Researcher Profile, Argon2id Credentials & Session Timeout Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-white shadow-sm border border-slate-200 rounded-lg p-6 space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
            Update Account Profile & Argon2id Password
          </h2>

          {msg && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{msg}</span>
            </div>
          )}
          {err && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Inactivity Session Timeout (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Current Password (To Change Password)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                New Password (Hashed with Argon2id)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8+ characters"
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/15"
          >
            Save Security Settings
          </button>
        </form>

        <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-lg p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
            Cryptographic Session & Role Telemetry
          </h2>
          <div className="space-y-2.5">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
              <span className="text-slate-500">Account Email</span>
              <span className="font-mono text-slate-900">{user.email}</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
              <span className="text-slate-500">Assigned RBAC Role</span>
              <span className="font-semibold text-emerald-700">{user.role_name}</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
              <span className="text-slate-500">Password Storage Hash</span>
              <span className="font-mono text-emerald-700">
                {profileDetails?.password_hash_algorithm || 'Argon2id (PHC v19)'}
              </span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <div className="text-slate-500 mb-1.5">Granted Role Permissions</div>
              <div className="flex flex-wrap gap-1.5">
                {(user.permissions || []).map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdministrationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'datasets' | 'audit' | 'system'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sysStats, setSysStats] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Student#PSTS2026!');
  const [newUserRole, setNewUserRole] = useState('Cybersecurity Student');

  // New dataset form
  const [dsName, setDsName] = useState('Synthetic Campus Hash Batch #2');
  const [dsDesc, setDsDesc] = useState('Synthetic educational dataset generated in Admin Console');
  const [dsType, setDsType] = useState('HASH_SAMPLES');
  const [dsCategory, setDsCategory] = useState('Hash Analysis Lab');
  const [dsCustomText, setDsCustomText] = useState('synthetic2026, campuslab01, Argon2Demo#99, Quantum$Orbit77');

  const loadAdminData = async () => {
    try {
      const [uRes, rRes, dRes, aRes, sRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/roles'),
        apiFetch('/api/admin/datasets'),
        apiFetch('/api/admin/audit-logs'),
        apiFetch('/api/admin/statistics'),
      ]);
      setUsers(uRes.users || []);
      setRoles(rRes.roles || []);
      setDatasets(dRes.datasets || []);
      setAuditLogs(aRes.audit_logs || []);
      setSysStats(sRes.system_statistics || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          full_name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role_name: newUserRole,
        }),
      });
      setNewUserName('');
      setNewUserEmail('');
      setStatusMsg('User account created and hashed with Argon2id.');
      await loadAdminData();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleChangeUserRole = async (userId: string, roleName: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role_name: roleName }),
      });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      await loadAdminData();
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const entries = dsCustomText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await apiFetch('/api/admin/datasets', {
        method: 'POST',
        body: JSON.stringify({
          dataset_name: dsName,
          description: dsDesc,
          dataset_type: dsType,
          category: dsCategory,
          generation_mode: 'CUSTOM',
          custom_entries: entries,
        }),
      });
      setStatusMsg(`Synthetic dataset "${dsName}" generated and stored.`);
      await loadAdminData();
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      await apiFetch(`/api/admin/datasets/${datasetId}`, { method: 'DELETE' });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetLabExperiments = async () => {
    try {
      const res = await apiFetch('/api/admin/datasets/reset-lab', { method: 'POST' });
      setStatusMsg(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Shield className="w-3.5 h-3.5" />
            <span>Administration, Dataset Management & Audit Logs (SRS Section 3.10 & 3.11)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            PSTS Laboratory Administration Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Users & Roles ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
              activeTab === 'datasets' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Synthetic Datasets ({datasets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>3. Audit Logs ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
              activeTab === 'system' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>4. Resource Controls</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateUser}
            className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3.5 text-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">Provision New Laboratory User</h2>
            <div>
              <label className="block text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Dr. Alan Turing"
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="alan@psts.edu"
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Initial Password (Argon2id)</label>
              <input
                type="text"
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Assigned RBAC Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.role_name}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          </form>

          <div className="lg:col-span-8 bg-white shadow-sm border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Registered Laboratory Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-2">Full Name</th>
                    <th className="py-2.5 px-2">Email</th>
                    <th className="py-2.5 px-2">Role</th>
                    <th className="py-2.5 px-2">Assessments</th>
                    <th className="py-2.5 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-emerald-50/40">
                      <td className="py-2.5 px-2 font-semibold text-slate-900">{u.full_name}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-700">{u.email}</td>
                      <td className="py-2.5 px-2">
                        <select
                          value={u.role_name}
                          onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-emerald-800 text-xs"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.role_name}>
                              {r.role_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700">
                        {u.counts?.assessments || 0}
                      </td>
                      <td className="py-2.5 px-2">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LABORATORY DATASET MANAGEMENT */}
      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateDataset}
            className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3.5 text-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">
              Generate or Import Synthetic Educational Dataset
            </h2>
            <div>
              <label className="block text-slate-700 mb-1">Dataset Name</label>
              <input
                type="text"
                required
                value={dsName}
                onChange={(e) => setDsName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Dataset Type</label>
              <select
                value={dsType}
                onChange={(e) => setDsType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="HASH_SAMPLES">Synthetic Password Hash Samples (Multi-Algorithm)</option>
                <option value="SYNTHETIC_PASSWORDS">Synthetic Password Strength Set</option>
                <option value="EDUCATIONAL_WORDLIST">Approved Local Educational Wordlist</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Dataset Category</label>
              <input
                type="text"
                value={dsCategory}
                onChange={(e) => setDsCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">
                Synthetic Entries (Comma-separated educational strings)
              </label>
              <textarea
                rows={3}
                value={dsCustomText}
                onChange={(e) => setDsCustomText(e.target.value)}
                className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Generate & Save Synthetic Dataset
            </button>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetLabExperiments}
                className="w-full py-2 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Laboratory Experiment Runs</span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-8 space-y-3.5">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        {ds.dataset_type}
                      </span>
                      <span className="text-slate-500 text-[11px]">Category: {ds.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{ds.dataset_name}</h3>
                    <p className="text-slate-500 mt-0.5">{ds.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDataset(ds.id)}
                    className="p-2 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700"
                    title="Delete Dataset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>Records: <strong className="text-slate-900">{ds.record_count}</strong></span>
                  <span>Created By: <strong className="text-slate-800">{ds.creator?.full_name}</strong></span>
                  <span>Created At: <strong className="text-slate-800">{new Date(ds.created_at).toLocaleDateString()}</strong></span>
                </div>

                {ds.hash_samples?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    {ds.hash_samples.slice(0, 4).map((hs: any) => (
                      <div key={hs.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-emerald-800">[{hs.algorithm}] {hs.label}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                          {hs.sample_hash}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                System Audit Logs (SRS Section 3.11 — Zero Plaintext Policy)
              </h2>
              <p className="text-xs text-slate-500">
                Tracks user ID, activity type, assessment ID, timestamp, status, and non-sensitive operational metadata.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Sanitized Telemetry</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">User</th>
                  <th className="py-2.5 px-2">Role</th>
                  <th className="py-2.5 px-2">Activity Type</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Non-Sensitive Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/40">
                    <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-slate-900">{log.user_name}</td>
                    <td className="py-2.5 px-2 text-emerald-800">{log.user_role}</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-800">
                      {log.activity_type}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500 max-w-md truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM RESOURCE CONTROLS */}
      {activeTab === 'system' && sysStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Laboratory Resource Consumption Controls</h2>
            <div className="space-y-2">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500">Max Auditing Attempts per Job</span>
                <span className="font-mono font-bold text-slate-900">
                  {sysStats.resource_limits?.max_attempts_per_job} attempts
                </span>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500">Max Job Execution Wall-Clock Time</span>
                <span className="font-mono font-bold text-emerald-700">
                  {sysStats.resource_limits?.max_execution_time_ms} ms
                </span>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500">Max Argon2id Memory Allocation</span>
                <span className="font-mono font-bold text-emerald-700">
                  {sysStats.resource_limits?.max_argon2_memory_kb} KB (128 MB)
                </span>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500">Zero-Plaintext Storage Policy</span>
                <span className="font-mono font-bold text-emerald-700">
                  {sysStats.resource_limits?.zero_plaintext_policy}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Database Entity Counters</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Users / Roles</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {sysStats.users_count} / {sysStats.roles_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Datasets / Hash Samples</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">
                  {sysStats.datasets_count} / {sysStats.hash_samples_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Assessments / Reports</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">
                  {sysStats.assessments_count} / {sysStats.reports_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Audit Logs / Lab Jobs</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5">
                  {sysStats.audit_logs_count} / {sysStats.laboratory_jobs_count}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

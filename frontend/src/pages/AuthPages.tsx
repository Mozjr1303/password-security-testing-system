import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, setStoredAuth, UserProfile } from '../api';

interface AuthProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('admin@psts.edu');
  const [password, setPassword] = useState('Admin#PSTS2026!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleName, setRoleName] = useState('Cybersecurity Student');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [generatedDemoToken, setGeneratedDemoToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember }),
      });
      setStoredAuth(res.token, res.user);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role_name: roleName,
        }),
      });
      setStoredAuth(res.token, res.user);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccessMsg(res.message);
      if (res.lab_demo_reset_token) {
        setGeneratedDemoToken(res.lab_demo_reset_token);
        setResetTokenInput(res.lab_demo_reset_token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetTokenInput,
          new_password: newResetPassword,
        }),
      });
      setSuccessMsg(res.message);
      setGeneratedDemoToken(null);
      setTimeout(() => {
        setMode('login');
        setPassword(newResetPassword);
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-10 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Left Branding Column */}
        <div className="lg:col-span-5 bg-[#f8fafc] p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-display text-sm font-black tracking-tight text-white">
                PS
              </div>
              <div className="leading-tight">
                <span className="block font-display text-sm font-bold text-slate-900">
                  Password Security Testing System
                </span>
                <span className="block font-mono text-[10px] tracking-wide text-slate-500">
                  Argon2id • Cryptographic Assessment
                </span>
              </div>
            </div>

            <div className="border-t-2 border-emerald-600 pt-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                CONTROLLED CYBERSECURITY LAB
              </span>
              <h1 className="mt-1 font-display text-2xl font-black text-slate-900 leading-snug">
                Password Security Testing & Assessment Platform
              </h1>
            </div>

            <p className="text-[#383e45] font-serif text-sm mt-3 leading-relaxed">
              Evaluate password entropy, inspect PHC & modular crypt hashes, benchmark Argon2id vs. legacy digests, audit storage configurations, and generate 14-section security reports.
            </p>

            <div className="mt-6 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Argon2id Authentication:</span> Protected with memory-hard Argon2id (64 MB, t=3, p=4) and unique 128-bit salts.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Zero-Plaintext Policy:</span> Test passwords are never stored in the database, logs, or PDF reports.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div className="mt-8 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Quick-Fill Authorised Lab Accounts</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@psts.edu', 'Admin#PSTS2026!')}
                className="text-left px-3 py-2 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 transition flex items-center justify-between text-xs"
              >
                <span>
                  <strong className="text-emerald-700">Administrator:</strong>{' '}
                  <span className="text-slate-700 font-mono">admin@psts.edu</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Full Access
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('student@psts.edu', 'Student#PSTS2026!')}
                className="text-left px-3 py-2 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 transition flex items-center justify-between text-xs"
              >
                <span>
                  <strong className="text-slate-900">Student:</strong>{' '}
                  <span className="text-slate-700 font-mono">student@psts.edu</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  Lab & Reports
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('researcher@psts.edu', 'Researcher#PSTS2026!')}
                className="text-left px-3 py-2 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 transition flex items-center justify-between text-xs"
              >
                <span>
                  <strong className="text-slate-900">Researcher:</strong>{' '}
                  <span className="text-slate-700 font-mono">researcher@psts.edu</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  Audit & Storage
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-3.5 py-2 rounded-md font-display text-xs font-bold transition border ${
                mode === 'login'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              01 Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-3.5 py-2 rounded-md font-display text-xs font-bold transition border ${
                mode === 'register'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              02 Register Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-3.5 py-2 rounded-md font-display text-xs font-bold transition border ${
                mode === 'forgot'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              03 Password Reset
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  <span>Remember laboratory session (7 days)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-display font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Verifying Argon2id Hash...' : 'Access Cybersecurity Laboratory'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Laboratory Role</label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Cybersecurity Student">Cybersecurity Student</option>
                    <option value="Security Researcher">Security Researcher</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Lecturer or Supervisor">Lecturer or Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-sm transition"
              >
                {loading ? 'Hashing with Argon2id...' : 'Create Account (Argon2id Protected)'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-5">
              <form onSubmit={handleRequestResetToken} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates a single-use 192-bit CSPRNG token and stores only its SHA-256 digest with a 15-minute expiration.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-md bg-white border border-slate-300 text-sm text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Generate Token
                  </button>
                </div>
              </form>

              {generatedDemoToken && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-emerald-800">Laboratory CSPRNG Token Preview:</div>
                  <div className="font-mono text-slate-900 break-all bg-white p-2 rounded border border-emerald-200">
                    {generatedDemoToken}
                  </div>
                </div>
              )}

              <form onSubmit={handleConfirmReset} className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Single-Use Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">New Password (Argon2id)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Verify Hashed Token & Reset Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

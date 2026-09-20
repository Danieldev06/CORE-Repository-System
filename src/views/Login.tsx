import { useState } from 'react';
import { Eye, EyeOff, Shield, Lock, BookOpen, GraduationCap, Users } from 'lucide-react';
import { useApp } from '../context';
import { authApi, extractApiError } from '../services/api';
import type { User } from '../types';

const FEATURE_BULLETS = [
  { icon: <BookOpen size={15} />, text: '250+ academic resources — lecture notes, dissertations, past papers, and research publications' },
  { icon: <GraduationCap size={15} />, text: 'Structured by school, programme, and module across all CUZ faculties' },
  { icon: <Users size={15} />, text: 'Role-based access for students, lecturers, and library administrators' },
  { icon: <Shield size={15} />, text: 'Secure, institutional-grade digital repository managed by the CUZ Library' },
];

export default function Login() {
  const { login, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // ✅ Call Django backend
      const response = await authApi.login(email, password);

      // Map Django user to frontend User shape
      const apiUser = response.user;
      const loggedInUser: User = {
        id: String(apiUser.id),
        name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.email,
        email: apiUser.email,
        role: apiUser.role,
        studentId: apiUser.student_id,
        programme: apiUser.program,
        department: apiUser.faculty,
        yearOfStudy: apiUser.year,
        status: 'active',
        dateJoined: new Date().toISOString(),
      };

      // Persist token + navigate to correct dashboard
      login(loggedInUser, response.token);
    } catch (err: any) {
      setError(extractApiError(err) || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — institutional branding */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full border border-white/5" />
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full border border-white/5" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-navy-900 -translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 right-0 w-1 h-64 bg-white/5 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3.5 mb-14">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 border border-white/10">
              <svg viewBox="0 0 36 36" fill="none" width="28" height="28">
                <rect x="3" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.9" />
                <rect x="21" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.55" />
                <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
                <circle cx="9" cy="5" r="2" fill="#60a5fa" />
                <circle cx="18" cy="2.5" r="2" fill="#60a5fa" />
                <circle cx="27" cy="5" r="2" fill="#60a5fa" />
                <line x1="9" y1="5" x2="18" y2="2.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="18" y1="2.5" x2="27" y2="5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-2xl tracking-wide leading-none">CORE</div>
              <div className="text-white/35 text-[10px] tracking-widest uppercase font-medium mt-0.5">Cavendish Online Resource Exchange</div>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-white leading-tight mb-3">
              Centralizing Knowledge.<br />Empowering Learning.
            </h1>
            <p className="text-white/45 text-sm leading-relaxed mb-10">
              The official instructional and academic repository of Cavendish University Zambia. Access, manage, and share academic resources across all schools and programmes.
            </p>

            <div className="space-y-4">
              {FEATURE_BULLETS.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <p className="text-white/50 text-[13px] leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { val: '250+', label: 'Resources' },
                { val: '4', label: 'Schools' },
                { val: '12+', label: 'Programmes' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-white font-bold text-xl">{s.val}</div>
                  <div className="text-white/30 text-xs font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="text-white/20 text-[11px]">
              © {new Date().getFullYear()} Cavendish University Zambia · Library & Academic Resources
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" width="22" height="22">
                <rect x="3" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.9" />
                <rect x="21" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.55" />
                <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
              </svg>
            </div>
            <div>
              <div className="text-navy-900 font-bold text-xl">CORE</div>
              <div className="text-navy-400 text-[10px] uppercase tracking-widest">CUZ Repository</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[22px] font-bold text-navy-900 leading-tight">Sign in to CORE</h2>
            <p className="text-navy-500 text-sm mt-1.5">Sign in with your university account to access the academic repository.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                University Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@cavendish.ac.zm or @cavendish.co.zm"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition pr-10"
                />
                <button type="button" onClick={() => setShowPass(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-navy-600 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-navy-300 accent-navy-800" />
                Remember me
              </label>
              <button type="button" className="text-sm text-navy-600 hover:text-navy-800 font-medium transition">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <Shield size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                <><Lock size={14} /> Sign In to CORE</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-5">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('signup')}
              className="text-navy-800 font-semibold hover:underline transition bg-transparent border-none cursor-pointer"
            >
              Create one now
            </button>
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-navy-50 border border-navy-100">
            <div className="text-[11px] text-navy-500 leading-relaxed">
              <strong className="text-navy-700">First time here?</strong> Create an account using your Cavendish University email address. Students, lecturers, and librarians can all sign up.
            </div>
          </div>

          <p className="text-center text-[11px] text-navy-400 mt-6 leading-relaxed">
            Access is restricted to authorized Cavendish University Zambia users.<br />
            For account support, contact{' '}
            <span className="text-navy-600 font-medium">library@cavendish.ac.zm</span>
          </p>
        </div>
      </div>
    </div>
  );
}
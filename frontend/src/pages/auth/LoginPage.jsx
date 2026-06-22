import { useState, useRef } from 'react';
import Icon from '../../components/ui/Icon';
import { api } from '../../api';

const ALLOWED_DOMAIN = 'redcross.or.th';

export default function LoginPage({ onLogin, onRegister }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regErr, setRegErr] = useState({});

  const handleLogin = async () => {
    setErr(''); setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), pass);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const validateReg = () => {
    const e = {};
    if (!regName.trim()) e.name = 'Name is required';
    if (!regEmail.trim()) e.email = 'Email is required';
    else if (!regEmail.toLowerCase().endsWith('@' + ALLOWED_DOMAIN)) e.email = `Only @${ALLOWED_DOMAIN} emails allowed`;
    if (regPass.length < 6) e.pass = 'Min 6 characters';
    return e;
  };

  const handleRegister = async () => {
    const e = validateReg(); setRegErr(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await onRegister({ name: regName.trim(), email: regEmail.trim().toLowerCase(), password: regPass, dept: regDept.trim() || 'User', position: regPosition.trim() || null });
    } catch (e) {
      setRegErr({ email: e.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasErr) => `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all
    ${hasErr ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:bg-white'}`;

  const Header = (
    <div className="px-10 py-8 text-center" style={{ background: 'linear-gradient(135deg,#0D1B2A,#1A3A5C)' }}>
      <img src="/logo.png" alt="Logo" className="w-14 h-14 mx-auto mb-3.5 object-contain" />
      <div className="text-white text-lg font-semibold">Blood Testing Education Center</div>
      <div className="text-white/40 text-xs mt-1">National Blood Center, Thai Red Cross Society</div>
    </div>
  );

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg,#061523,#0D1B2A 40%,#1A3A5C 75%,#1A56DB)' }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          {Header}
          <div className="px-9 pb-8 pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="your@redcross.or.th" className={inputClass(false)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••" className={inputClass(false)} />
              </div>
            </div>
            {err && <div className="mt-3 flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg"><Icon name="x" size={12}/>{err}</div>}
            <button onClick={handleLogin} disabled={loading}
              className="mt-4 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="mt-3.5 text-center">
              <button onClick={() => { setView('register'); setRegErr({}); }} className="text-xs text-brand-500 font-medium hover:underline">
                Don't have an account? Register
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Forgot your password? Please contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg,#061523,#0D1B2A 40%,#1A3A5C 75%,#1A56DB)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {Header}
        <div className="px-9 pb-8 pt-6">
          <h3 className="font-semibold text-navy-900 mb-1">Create Account</h3>
          <p className="text-xs text-slate-400 mb-5">Requires <strong>@{ALLOWED_DOMAIN}</strong> email</p>
          <div className="space-y-3.5">
            {[
              { label: 'Full Name *', val: regName, set: setRegName, err: regErr.name, ph: 'Dr. Jane Doe' },
              { label: 'Email *', val: regEmail, set: setRegEmail, err: regErr.email, ph: `name@${ALLOWED_DOMAIN}`, type: 'email' },
              { label: 'Password *', val: regPass, set: setRegPass, err: regErr.pass, ph: 'min 6 characters', type: 'password' },
              { label: 'Department', val: regDept, set: setRegDept, ph: 'e.g. Blood Screening' },
              { label: 'Job Position', val: regPosition, set: setRegPosition, ph: 'e.g. Medical Technologist' },
            ].map(({ label, val, set, err, ph, type }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
                <input type={type || 'text'} value={val} onChange={e => set(e.target.value)} placeholder={ph} className={inputClass(!!err)} />
                {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
              </div>
            ))}
          </div>
          <button onClick={handleRegister} disabled={loading}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
          <button onClick={() => setView('login')} className="mt-2 w-full py-2 text-xs text-slate-400 hover:text-slate-600">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

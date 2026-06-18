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

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regErr, setRegErr] = useState({});

  // Forgot password
  const [fpEmail, setFpEmail] = useState('');
  const [fpErr, setFpErr] = useState('');
  const [fpSent, setFpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [otpInput, setOtpInput] = useState(['','','','','','']);
  const [otpErr, setOtpErr] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPass, setNewPass] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleLogin = async () => {
    setErr(''); setLoading(true);
    try {
      const user = await onLogin(email.trim().toLowerCase(), pass);
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
      await onRegister({ name: regName.trim(), email: regEmail.trim().toLowerCase(), password: regPass, dept: regDept.trim() || 'Staff' });
    } catch (e) {
      setRegErr({ email: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setFpErr('');
    try {
      const res = await api.forgotPassword(fpEmail.trim().toLowerCase());
      setDemoOtp(res.otp || '');
      setFpSent(true);
    } catch (e) {
      setFpErr(e.message);
    }
  };

  const handleOtpKey = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpInput]; next[i] = val; setOtpInput(next);
    if (val && i < 5) otpRefs[i + 1].current?.focus();
  };

  const handleVerifyOtp = () => {
    if (otpInput.join('') !== demoOtp) { setOtpErr('Invalid OTP'); return; }
    setOtpVerified(true); setOtpErr('');
  };

  const handleResetPass = async () => {
    if (newPass.length < 6) { setOtpErr('Min 6 characters'); return; }
    await api.resetPassword(fpEmail.trim().toLowerCase(), newPass);
    alert('Password reset successfully!');
    setView('login'); setFpSent(false); setOtpVerified(false); setOtpInput(['','','','','','']); setNewPass('');
  };

  const inputClass = (hasErr) => `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all
    ${hasErr ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:bg-white'}`;

  const Header = (
    <div className="px-10 py-8 text-center" style={{ background: 'linear-gradient(135deg,#0D1B2A,#1A3A5C)' }}>
      <div className="w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center font-mono font-bold text-white text-lg"
        style={{ background: 'rgba(26,86,219,.3)', border: '2px solid rgba(26,86,219,.5)' }}>HML</div>
      <div className="text-white text-lg font-semibold">HemoLabs LMS</div>
      <div className="text-white/40 text-xs mt-1">Blood Donation Screening Laboratory</div>
      <div className="mt-3 flex items-center justify-center gap-2 text-white/25 text-[10px] tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-danger" />
        ISO 15189 · AABB ACCREDITED
        <div className="w-1.5 h-1.5 rounded-full bg-danger" />
      </div>
    </div>
  );

  let body;

  if (view === 'login') {
    body = (
      <div className="px-9 pb-8 pt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com" className={inputClass(false)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••" className={inputClass(false)} />
          </div>
        </div>
        {err && <div className="mt-3 flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg"><Icon name="x" size={12}/>{err}</div>}
        <button onClick={handleLogin} disabled={loading}
          className="mt-4 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign In to LMS'}
        </button>
        <div className="flex justify-between mt-3.5 text-xs">
          <button onClick={() => { setView('register'); setRegErr({}); }} className="text-brand-500 font-medium hover:underline">Register</button>
          <button onClick={() => setView('forgot')} className="text-slate-400 hover:text-slate-600">Forgot Password?</button>
        </div>
      </div>
    );
  } else if (view === 'register') {
    body = (
      <div className="px-9 pb-8 pt-6">
        <h3 className="font-semibold text-navy-900 mb-1">Create Account</h3>
        <p className="text-xs text-slate-400 mb-5">Requires <strong>@{ALLOWED_DOMAIN}</strong> email</p>
        <div className="space-y-3.5">
          {[
            { label: 'Full Name *', val: regName, set: setRegName, err: regErr.name, ph: 'Dr. Jane Doe' },
            { label: 'Email *', val: regEmail, set: setRegEmail, err: regErr.email, ph: `name@${ALLOWED_DOMAIN}`, type: 'email' },
            { label: 'Password *', val: regPass, set: setRegPass, err: regErr.pass, ph: 'min 6 characters', type: 'password' },
            { label: 'Department', val: regDept, set: setRegDept, ph: 'e.g. Blood Screening' },
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
        <button onClick={() => setView('login')} className="mt-2 w-full py-2 text-xs text-slate-400 hover:text-slate-600">← Back to Login</button>
      </div>
    );
  } else if (view === 'forgot' && !fpSent) {
    body = (
      <div className="px-9 pb-8 pt-6">
        <h3 className="font-semibold text-navy-900 mb-1">Reset Password</h3>
        <p className="text-xs text-slate-500 mb-5">Enter your registered email to receive a 6-digit code.</p>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
        <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="your@email.com" className={inputClass(!!fpErr)} />
        {fpErr && <p className="text-red-500 text-xs mt-1">{fpErr}</p>}
        <button onClick={handleSendOtp} className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors">Send Code</button>
        <button onClick={() => setView('login')} className="mt-2 w-full py-2 text-xs text-slate-400 hover:text-slate-600">← Back</button>
      </div>
    );
  } else if (view === 'forgot' && fpSent && !otpVerified) {
    body = (
      <div className="px-9 pb-8 pt-6">
        <h3 className="font-semibold text-navy-900 mb-1">Enter Code</h3>
        <p className="text-xs text-slate-500 mb-1">Sent to <strong>{fpEmail}</strong></p>
        {demoOtp && <p className="text-xs text-amber-600 mb-4 bg-amber-50 px-3 py-1.5 rounded-lg">Demo OTP: {demoOtp}</p>}
        <div className="flex gap-2 justify-center mb-4">
          {otpInput.map((v, i) => (
            <input key={i} ref={otpRefs[i]} value={v} maxLength={1}
              onChange={e => handleOtpKey(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) otpRefs[i-1].current?.focus(); }}
              className="w-11 h-12 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:border-brand-500 outline-none bg-slate-50" />
          ))}
        </div>
        {otpErr && <p className="text-red-500 text-xs text-center mb-2">{otpErr}</p>}
        <button onClick={handleVerifyOtp} className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors">Verify Code</button>
      </div>
    );
  } else if (view === 'forgot' && otpVerified) {
    body = (
      <div className="px-9 pb-8 pt-6">
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm mb-5"><Icon name="check" size={14}/>Code verified! Set your new password.</div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="min 6 characters" className={inputClass(!!otpErr)} />
        {otpErr && <p className="text-red-500 text-xs mt-1">{otpErr}</p>}
        <button onClick={handleResetPass} className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors">Reset Password</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg,#061523,#0D1B2A 40%,#1A3A5C 75%,#1A56DB)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {Header}
        {body}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser, loginWithPassword, requestOtp, verifyOtp } from '../../lib/api';

type AuthView = 'login' | 'register' | 'otp-request' | 'otp-verify';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpChannel, setOtpChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');

  const clearMessages = () => { setError(''); setSuccessMessage(''); };

  // ── Password Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!phone || !password) { setError('Phone number/email and password are required.'); return; }
    setLoading(true);
    try {
      const res = await loginWithPassword({ phone, password });
      if (res.success) {
        setPhone('');
        setPassword('');
        router.push('/account');
        router.refresh();
      } else {
        setError(res.error || 'Login failed.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Registration ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!name || !phone || !password) { setError('Name, phone, and password are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await registerUser({ name, phone, email: email || undefined, password });
      if (res.success) {
        router.push('/account');
        router.refresh();
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── OTP Request ──
  const handleOtpRequest = async (channel: 'WHATSAPP' | 'SMS') => {
    clearMessages();
    if (!phone) { setError('Phone number is required.'); return; }
    setOtpChannel(channel);
    setLoading(true);
    try {
      const res = await requestOtp({ phone, channel });
      if (res.success) {
        setSuccessMessage(res.message || 'OTP sent.');
        setView('otp-verify');
      } else {
        setError(res.error || 'Failed to send OTP.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── OTP Verify ──
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!otp || otp.length !== 6) { setError('Enter a valid 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await verifyOtp({ phone, otp });
      if (res.success) {
        router.push('/account');
        router.refresh();
      } else {
        setError(res.error || 'OTP verification failed.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Shared Styles ──
  const inputClass = "w-full px-4 py-3 rounded-none border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors text-sm";
  const primaryBtn = "w-full py-4 bg-stone-900 text-white text-sm font-semibold tracking-wide uppercase hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryBtn = "w-full py-4 border border-stone-300 text-stone-900 text-sm font-semibold tracking-wide uppercase hover:border-stone-900 transition-colors disabled:opacity-50";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-black tracking-[0.2em] text-stone-900 uppercase font-serif">
              THE ANVOR
            </h1>
            <p className="text-[10px] tracking-[0.4em] text-stone-500 mt-2 uppercase font-medium">Boutique &amp; Accessories</p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">

          {/* ════════ LOGIN VIEW ════════ */}
          {view === 'login' && (
            <>
              <h2 className="text-2xl font-serif text-stone-900 mb-2 text-center">Welcome Back</h2>
              <p className="text-sm text-stone-500 mb-8 text-center">Sign in to your account</p>

              <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
                <div>
                  <label htmlFor="login-phone" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Phone Number or Email</label>
                  <input id="login-phone" type="text" autoComplete="off" placeholder="+91 98765 43210 or name@example.com" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Password</label>
                  <input id="login-password" type="password" autoComplete="off" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-stone-200"></div>
                <span className="text-[10px] text-stone-400 font-medium uppercase tracking-[0.2em]">Or continue with</span>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>

              {/* OTP Buttons */}
              <div className="space-y-4">
                <button onClick={() => { clearMessages(); setView('otp-request'); setOtpChannel('WHATSAPP'); }} className={secondaryBtn}>
                  WhatsApp OTP
                </button>
                <button onClick={() => { clearMessages(); setView('otp-request'); setOtpChannel('SMS'); }} className={secondaryBtn}>
                  SMS OTP
                </button>
              </div>

              <p className="text-center text-sm text-stone-500 mt-8">
                Don&apos;t have an account?{' '}
                <button onClick={() => { clearMessages(); setView('register'); }} className="text-stone-900 border-b border-stone-900 font-medium hover:text-amber-800 hover:border-amber-800 transition-colors">
                  Create Account
                </button>
              </p>
            </>
          )}

          {/* ════════ REGISTER VIEW ════════ */}
          {view === 'register' && (
            <>
              <h2 className="text-2xl font-serif text-stone-900 mb-2 text-center">Create Account</h2>
              <p className="text-sm text-stone-500 mb-8 text-center">Join The Anvor</p>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Full Name</label>
                  <input id="reg-name" type="text" autoComplete="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Phone Number</label>
                  <input id="reg-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Email <span className="text-stone-400 font-normal ml-1 capitalize">(Optional)</span></label>
                  <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Password</label>
                  <input id="reg-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-stone-500 mt-8">
                Already have an account?{' '}
                <button onClick={() => { clearMessages(); setView('login'); }} className="text-stone-900 border-b border-stone-900 font-medium hover:text-amber-800 hover:border-amber-800 transition-colors">
                  Sign In
                </button>
              </p>
            </>
          )}

          {/* ════════ OTP REQUEST VIEW ════════ */}
          {view === 'otp-request' && (
            <>
              <h2 className="text-2xl font-serif text-stone-900 mb-2 text-center">Sign in with OTP</h2>
              <p className="text-sm text-stone-500 mb-8 text-center">
                We&apos;ll send a 6-digit code via <strong className="text-stone-900">{otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</strong>
              </p>

              <div className="space-y-5">
                <div>
                  <label htmlFor="otp-phone" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">Phone Number</label>
                  <input id="otp-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button onClick={() => handleOtpRequest(otpChannel)} disabled={loading} className={primaryBtn}>
                  {loading ? 'Sending...' : `Send via ${otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}`}
                </button>
              </div>

              <div className="mt-8 text-center">
                <button onClick={() => { clearMessages(); setView('login'); }} className="text-xs text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors">
                  ← Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ════════ OTP VERIFY VIEW ════════ */}
          {view === 'otp-verify' && (
            <>
              <h2 className="text-2xl font-serif text-stone-900 mb-2 text-center">Verify Number</h2>
              <p className="text-sm text-stone-500 mb-8 text-center">
                Sent via {otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} to <strong>{phone}</strong>
              </p>

              {successMessage && <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-100 px-4 py-3 mb-6 text-center">{successMessage}</p>}

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
                  <p className="text-xs text-amber-800 font-medium text-center">🔧 DEV MODE: Check your Express terminal for the OTP code.</p>
                </div>
              )}

              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div>
                  <label htmlFor="otp-code" className="block text-xs font-bold text-stone-900 mb-2 uppercase tracking-widest">6-Digit Code</label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${inputClass} text-center text-xl tracking-[0.5em] font-mono`}
                  />
                </div>
                {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading || otp.length !== 6} className={primaryBtn}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
              </form>

              <div className="text-center mt-8 space-y-4">
                <button onClick={() => handleOtpRequest(otpChannel)} disabled={loading} className="text-xs text-stone-900 font-bold uppercase tracking-widest border-b border-stone-900 hover:text-amber-800 hover:border-amber-800 transition-colors disabled:opacity-50">
                  Resend OTP
                </button>
                <div className="pt-2">
                  <button onClick={() => { clearMessages(); setOtp(''); setView('login'); }} className="text-xs text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors">
                    ← Back to sign in
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-10 uppercase tracking-widest">
          Secure Login &bull; The Anvor
        </p>
      </div>
    </div>
  );
}

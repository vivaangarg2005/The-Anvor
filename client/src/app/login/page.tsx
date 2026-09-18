'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerUser, loginWithPassword, requestOtp, verifyOtp } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { Suspense } from 'react';

type AuthView = 'login' | 'register' | 'otp-request' | 'otp-verify';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/account';
  const { mergeGuestCartIfAny, clearCart } = useCart();
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
        clearCart();
        await mergeGuestCartIfAny();
        router.push(redirectUrl);
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
        clearCart();
        await mergeGuestCartIfAny();
        router.push(redirectUrl);
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
        clearCart();
        await mergeGuestCartIfAny();
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(res.error || 'OTP verification failed.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Shared Styles ──
  const inputClass = "w-full px-0 py-3 rounded-none border-0 border-b border-stone-300 bg-transparent text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-0 transition-colors text-base";
  const primaryBtn = "w-full py-4 bg-stone-900 text-white text-xs font-semibold tracking-widest uppercase hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4";
  const secondaryBtn = "w-full py-4 border border-stone-300 text-stone-900 text-xs font-semibold tracking-widest uppercase hover:border-stone-900 transition-colors disabled:opacity-50";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-2xl tracking-[0.25em] text-stone-900 uppercase font-serif">
              THE ANVOR
            </h1>
          </Link>
        </div>

        {/* Minimal Form Area */}
        <div>

          {/* ════════ LOGIN VIEW ════════ */}
          {view === 'login' && (
            <>
              <h2 className="text-3xl font-serif text-stone-900 mb-2 text-center tracking-tight">Welcome Back</h2>
              <p className="text-xs text-stone-500 mb-10 text-center uppercase tracking-widest">Sign in to your account</p>

              <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                <div>
                  <label htmlFor="login-phone" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Phone Number or Email</label>
                  <input id="login-phone" type="text" autoComplete="off" placeholder="Phone or Email" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Password</label>
                  <input id="login-password" type="password" autoComplete="off" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-xs bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-10">
                <div className="flex-1 h-px bg-stone-200"></div>
                <span className="text-[10px] text-stone-400 font-medium uppercase tracking-[0.2em]">Or use OTP</span>
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

              <div className="text-center mt-12">
                <button onClick={() => { clearMessages(); setView('register'); }} className="text-xs text-stone-900 border-b border-stone-900 tracking-widest uppercase hover:text-stone-500 hover:border-stone-500 transition-colors">
                  Create Account
                </button>
              </div>
            </>
          )}

          {/* ════════ REGISTER VIEW ════════ */}
          {view === 'register' && (
            <>
              <h2 className="text-3xl font-serif text-stone-900 mb-2 text-center tracking-tight">Create Account</h2>
              <p className="text-xs text-stone-500 mb-10 text-center uppercase tracking-widest">Join The Anvor</p>

              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label htmlFor="reg-name" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Full Name</label>
                  <input id="reg-name" type="text" autoComplete="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Phone Number</label>
                  <input id="reg-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Email <span className="text-stone-400 font-normal ml-1 capitalize">(Optional)</span></label>
                  <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Password</label>
                  <input id="reg-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-xs bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-12">
                <button onClick={() => { clearMessages(); setView('login'); }} className="text-xs text-stone-900 border-b border-stone-900 tracking-widest uppercase hover:text-stone-500 hover:border-stone-500 transition-colors">
                  Sign In to existing account
                </button>
              </div>
            </>
          )}

          {/* ════════ OTP REQUEST VIEW ════════ */}
          {view === 'otp-request' && (
            <>
              <h2 className="text-3xl font-serif text-stone-900 mb-2 text-center tracking-tight">Sign in with OTP</h2>
              <p className="text-xs text-stone-500 mb-10 text-center uppercase tracking-widest">
                Via <strong className="text-stone-900">{otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</strong>
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="otp-phone" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest">Phone Number</label>
                  <input id="otp-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                {error && <p className="text-red-700 text-xs bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button onClick={() => handleOtpRequest(otpChannel)} disabled={loading} className={primaryBtn}>
                  {loading ? 'Sending...' : `Send via ${otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}`}
                </button>
              </div>

              <div className="mt-12 text-center">
                <button onClick={() => { clearMessages(); setView('login'); }} className="text-[10px] text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors">
                  ← Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ════════ OTP VERIFY VIEW ════════ */}
          {view === 'otp-verify' && (
            <>
              <h2 className="text-3xl font-serif text-stone-900 mb-2 text-center tracking-tight">Verify Number</h2>
              <p className="text-xs text-stone-500 mb-10 text-center uppercase tracking-widest leading-relaxed">
                Sent via {otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} to <br/><strong className="text-stone-900">{phone}</strong>
              </p>

              {successMessage && <p className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-100 px-4 py-3 mb-6 text-center">{successMessage}</p>}

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
                  <p className="text-[10px] text-amber-800 font-bold text-center uppercase tracking-widest">🔧 DEV: Check Terminal for OTP</p>
                </div>
              )}

              <form onSubmit={handleOtpVerify} className="space-y-6">
                <div>
                  <label htmlFor="otp-code" className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-widest text-center">6-Digit Code</label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono border-stone-900`}
                  />
                </div>
                {error && <p className="text-red-700 text-xs bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading || otp.length !== 6} className={primaryBtn}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
              </form>

              <div className="text-center mt-12 space-y-6">
                <button onClick={() => handleOtpRequest(otpChannel)} disabled={loading} className="text-[10px] text-stone-900 font-bold uppercase tracking-widest border-b border-stone-900 hover:text-stone-500 hover:border-stone-500 transition-colors disabled:opacity-50">
                  Resend OTP
                </button>
                <div className="pt-2">
                  <button onClick={() => { clearMessages(); setOtp(''); setView('login'); }} className="text-[10px] text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors">
                    ← Back to sign in
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-stone-400 mt-16 uppercase tracking-widest">
          Secure Login &bull; The Anvor
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] bg-background"></div>}>
      <LoginContent />
    </Suspense>
  );
}

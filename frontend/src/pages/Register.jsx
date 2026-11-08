import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, ArrowLeft, KeyRound, RefreshCw } from 'lucide-react';

export default function Register() {
  const location = useLocation();
  const [step, setStep] = useState(location.state?.step === 'otp' ? 'otp' : 'form');
  const [form, setForm] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
  });
  const [registeredEmail, setRegisteredEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(location.state?.step === 'otp' ? 60 : 0);
  const [resending, setResending] = useState(false);

  const { register, verifyRegistrationOtp, resendRegistrationOtp, loading } = useAuth();
  const navigate = useNavigate();

  // 60-second cooldown timer for resending OTP
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Step 1: Initial user registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form.name, form.email, form.password, 'student');
    if (result.success) {
      if (result.requireVerification) {
        setRegisteredEmail(result.email || form.email);
        setStep('otp');
        setResendCooldown(60);
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Step 2: 6-Digit OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) return;
    const result = await verifyRegistrationOtp(registeredEmail, otp.trim());
    if (result.success) {
      navigate('/dashboard');
    }
  };

  // Resend fresh OTP to registered email
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const res = await resendRegistrationOtp(registeredEmail);
    setResending(false);
    if (res.success) {
      setResendCooldown(60);
    }
  };

  // Return to form in case of email typo
  const handleEditEmail = () => {
    setStep('form');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-ocean-600/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-dolphin-600/6 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {step === 'form' ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-xl shadow-dolphin-900/40 mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-gray-500 mt-1">Join DolphinCoder LMS as a student</p>
            </div>

            <div className="glass-card p-8 gradient-border">
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field pl-11"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field pl-11"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-field pl-11 pr-11"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-dolphin-400 hover:text-dolphin-300 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-xl shadow-dolphin-900/40 mb-4">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Verify Your Email</h1>
              <p className="text-gray-400 mt-2 text-sm">
                Enter the 6-digit verification code sent to <br />
                <span className="text-dolphin-300 font-semibold">{registeredEmail}</span>
              </p>
            </div>

            <div className="glass-card p-8 gradient-border">
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    6-Digit Verification Code
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field pl-11 text-center font-mono text-2xl tracking-[0.35em] font-bold"
                      placeholder="••••••"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Activate Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleEditEmail}
                  className="text-gray-400 hover:text-gray-200 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    resendCooldown > 0
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-dolphin-400 hover:text-dolphin-300'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs">
                  Didn't receive the email? Check your spam folder or click Resend code.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

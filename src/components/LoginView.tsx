import React, { useState, useEffect } from 'react';
import { UserAccount, LoginRecord, OtpSession, EmailDispatchLog } from '../types/portal';
import {
  verifyCredentials,
  createLoginRecord,
  createOtpSession,
  verifyOtp,
  requestNewOtp,
  getMaskedRecipient,
  getMaskedEmail,
  maskPhoneNumber,
  maskEmailAddress,
  PRIMARY_REGISTERED_PHONE,
  PRIMARY_REGISTERED_EMAIL,
  dispatchOtpSms,
  dispatchOtpEmail,
  SmsDispatchLog,
} from '../utils/auth';
import { ACADEMY_CAMPUS_IMG } from '../data/mockData';
import { AcademyCrest } from './AcademyCrest';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Shield,
  Smartphone,
  RotateCw,
  ArrowLeft,
  Clock,
  Fingerprint,
  MessageSquare,
  X,
  BellRing,
  Mail,
  Inbox,
  Send,
} from 'lucide-react';

interface LoginViewProps {
  accounts: UserAccount[];
  onLoginSuccess: (account: UserAccount) => void;
  onRecordLogin: (record: LoginRecord) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  accounts,
  onLoginSuccess,
  onRecordLogin,
}) => {
  // Step 1: Credential Authentication state
  const [authStep, setAuthStep] = useState<'credentials' | 'otp_challenge'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Step 2: Second Factor (OTP) state & Channel Selection (Email or SMS)
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const [lastSmsDispatch, setLastSmsDispatch] = useState<SmsDispatchLog | null>(null);
  const [lastEmailDispatch, setLastEmailDispatch] = useState<EmailDispatchLog | null>(null);

  // Inspection simulator modals (external to login screen)
  const [isPhoneSimulatorOpen, setIsPhoneSimulatorOpen] = useState(false);
  const [isEmailSimulatorOpen, setIsEmailSimulatorOpen] = useState(false);

  // Security lockout countdown for failed password attempts
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  // OTP Expiration countdown timer
  useEffect(() => {
    if (authStep === 'otp_challenge' && secondsRemaining > 0) {
      const timer = setTimeout(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authStep, secondsRemaining]);

  // ==========================================
  // FACTOR 1: PASSWORD AUTHENTICATION HANDLER
  // ==========================================
  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      // Execute credential verification against stored account database
      const result = verifyCredentials(username, password, accounts);

      if (!result.success) {
        // Access Denied: Record failed password attempt
        const isAttemptingAdmin =
          username.trim().toLowerCase() === 'admin' ||
          username.trim().toLowerCase() === 'admin.clara';

        const failureReason = isAttemptingAdmin
          ? `Unauthorized attempt to access Administrator account (${username.trim()}) with invalid credentials`
          : result.reason === 'Incorrect password'
          ? 'Incorrect password entered'
          : result.reason === 'Unrecognized username'
          ? 'Unrecognized username'
          : 'Missing credential parameter';

        const failedRecord = createLoginRecord(username, 'Denied', {
          account: result.account,
          failureReason,
          authFactor: 'Password',
          otpStatus: 'NOT_REACHED',
        });

        onRecordLogin(failedRecord);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= 4) {
          setLockoutSeconds(15);
          setErrorMessage(
            'Security Alert: Multiple unauthorized authentication failures detected from your network. Terminal is temporarily locked for 15 seconds. Unauthorized administrative attempts are monitored.'
          );
        } else {
          setErrorMessage(
            result.error ||
              'Access denied: The credentials entered do not match our stored academic records. Please try again.'
          );
        }
        setIsAuthenticating(false);
      } else if (result.account) {
        // First factor verified! Now introduce the Second Authentication Factor (OTP)
        const targetEmail = result.account.email || PRIMARY_REGISTERED_EMAIL;
        const targetPhone = result.account.phone || PRIMARY_REGISTERED_PHONE;
        const targetChannel = otpChannel;

        const newSession = createOtpSession(result.account, {
          validitySeconds: 90,
          channel: targetChannel,
          deliveryAddress: targetChannel === 'email' ? targetEmail : targetPhone,
        });

        if (targetChannel === 'email') {
          const emailLog = dispatchOtpEmail(targetEmail, newSession.code, result.account.fullName);
          setLastEmailDispatch(emailLog);
          setInfoMessage(
            `Credentials verified. A 6-digit One-Time Password has been dispatched via Email to your registered address (${getMaskedEmail(result.account)}).`
          );
        } else {
          const smsLog = dispatchOtpSms(targetPhone, newSession.code, result.account.fullName);
          setLastSmsDispatch(smsLog);
          setInfoMessage(
            `Credentials verified. A 6-digit One-Time Password has been sent via SMS to your registered phone number (${getMaskedRecipient(result.account)}).`
          );
        }

        setOtpSession(newSession);
        setOtpInput('');
        setSecondsRemaining(90);
        setAuthStep('otp_challenge');
        setIsAuthenticating(false);
      }
    }, 350);
  };

  // ==========================================
  // SWITCH 2FA DELIVERY CHANNEL (EMAIL vs SMS)
  // ==========================================
  const handleSwitchChannel = (newChannel: 'email' | 'sms') => {
    if (!otpSession) return;
    setOtpChannel(newChannel);
    const targetEmail = otpSession.account.email || PRIMARY_REGISTERED_EMAIL;
    const targetPhone = otpSession.account.phone || PRIMARY_REGISTERED_PHONE;

    const freshSession = requestNewOtp(otpSession, {
      validitySeconds: 90,
      channel: newChannel,
      deliveryAddress: newChannel === 'email' ? targetEmail : targetPhone,
    });

    setOtpSession(freshSession);
    setOtpInput('');
    setSecondsRemaining(90);
    setErrorMessage(null);

    if (newChannel === 'email') {
      const emailLog = dispatchOtpEmail(targetEmail, freshSession.code, otpSession.account.fullName);
      setLastEmailDispatch(emailLog);
      setInfoMessage(
        `Channel changed: A new One-Time Password has been sent to your verified email address (${getMaskedEmail(otpSession.account)}).`
      );
    } else {
      const smsLog = dispatchOtpSms(targetPhone, freshSession.code, otpSession.account.fullName);
      setLastSmsDispatch(smsLog);
      setInfoMessage(
        `Channel changed: A new One-Time Password has been sent via SMS to your registered phone number (${getMaskedRecipient(otpSession.account)}).`
      );
    }
  };

  // ==========================================
  // FACTOR 2: ONE-TIME PASSWORD (OTP) HANDLER
  // ==========================================
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSession) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setIsAuthenticating(true);

    const activeAuthFactor =
      otpChannel === 'email' ? 'Two-Factor (Email OTP)' : 'Two-Factor (SMS OTP)';

    setTimeout(() => {
      const isExpired = secondsRemaining <= 0;

      if (isExpired) {
        // Access Denied: OTP Expired
        const expiredRecord = createLoginRecord(otpSession.username, 'Denied', {
          account: otpSession.account,
          failureReason: `Access Denied: One-Time Password expired for 2FA session (${otpChannel.toUpperCase()})`,
          authFactor: activeAuthFactor,
          otpStatus: 'EXPIRED_OTP',
        });

        onRecordLogin(expiredRecord);
        setErrorMessage(
          'Access denied: One-Time Password has expired. Verification codes are time-limited for security. Please request a new OTP to try again.'
        );
        setIsAuthenticating(false);
        return;
      }

      // Verify OTP code
      const verification = verifyOtp(otpSession, otpInput);

      if (!verification.success) {
        // Access Denied: Invalid OTP
        const invalidRecord = createLoginRecord(otpSession.username, 'Denied', {
          account: otpSession.account,
          failureReason: `Access Denied: Invalid One-Time Password entered for 2FA (${otpChannel.toUpperCase()})`,
          authFactor: activeAuthFactor,
          otpStatus: 'INVALID_OTP',
        });

        onRecordLogin(invalidRecord);
        setErrorMessage(
          verification.error ||
            'Access denied: Invalid One-Time Password. The verification code does not match our records. Please verify the code or request a new OTP.'
        );
        setIsAuthenticating(false);
      } else {
        // Access Granted: Valid OTP! Complete the process with a Login Successful outcome.
        const successRecord = createLoginRecord(otpSession.username, 'Granted', {
          account: otpSession.account,
          authFactor: activeAuthFactor,
          otpStatus: 'VERIFIED',
        });

        onRecordLogin(successRecord);
        setSuccessMessage(
          `Login Successful! Two-Factor Authentication confirmed via ${
            otpChannel === 'email' ? 'Email OTP' : 'SMS OTP'
          }. Welcome to Excellence Academy, ${otpSession.account.fullName}.`
        );

        setTimeout(() => {
          setIsAuthenticating(false);
          onLoginSuccess(otpSession.account);
        }, 600);
      }
    }, 350);
  };

  // ==========================================
  // REQUEST NEW OTP ACTION
  // ==========================================
  const handleRequestNewOtp = () => {
    if (!otpSession) return;
    const targetEmail = otpSession.account.email || PRIMARY_REGISTERED_EMAIL;
    const targetPhone = otpSession.account.phone || PRIMARY_REGISTERED_PHONE;

    const freshSession = requestNewOtp(otpSession, {
      validitySeconds: 90,
      channel: otpChannel,
      deliveryAddress: otpChannel === 'email' ? targetEmail : targetPhone,
    });

    setOtpSession(freshSession);
    setOtpInput('');
    setSecondsRemaining(90);
    setErrorMessage(null);

    if (otpChannel === 'email') {
      const emailLog = dispatchOtpEmail(targetEmail, freshSession.code, otpSession.account.fullName);
      setLastEmailDispatch(emailLog);
      setInfoMessage(
        `A new One-Time Password has been dispatched to your academic email (${getMaskedEmail(otpSession.account)}).`
      );
    } else {
      const smsLog = dispatchOtpSms(targetPhone, freshSession.code, otpSession.account.fullName);
      setLastSmsDispatch(smsLog);
      setInfoMessage(
        `A new One-Time Password has been dispatched via SMS to your registered phone number (${getMaskedRecipient(otpSession.account)}).`
      );
    }
  };

  // Back to username & password stage
  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setOtpSession(null);
    setOtpInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setInfoMessage(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] flex flex-col justify-between relative">
      {/* Top Bar for Login Screen */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-200 bg-purple-50">
              <AcademyCrest className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-serif font-bold text-purple-950 text-base">
                Excellence Academy
              </span>
              <span className="text-[11px] text-purple-600 block -mt-0.5 font-medium">
                Established 1928 · Academic Security Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-700/80 font-medium">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Two-Factor Authentication Active</span>
          </div>
        </div>
      </header>

      {/* Main Login Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Campus Visual & Heritage Panel */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-2xl overflow-hidden border border-purple-200/80 bg-gradient-to-b from-purple-900 via-purple-950 to-[#230b3b] text-white p-8 relative shadow-lg">
            {/* Background image overlay */}
            <div className="absolute inset-0 opacity-25 mix-blend-overlay overflow-hidden">
              <img
                src={ACADEMY_CAMPUS_IMG}
                alt="Excellence Academy Campus"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 mb-6 flex items-center justify-center shadow-inner overflow-hidden">
                <AcademyCrest className="w-full h-full object-contain" />
              </div>

              <span className="text-purple-300 text-xs font-semibold tracking-wider uppercase block mb-1">
                Security Gateway Protocol
              </span>
              <h1 className="text-2xl font-serif font-bold text-white leading-snug mb-3">
                Excellence Academy Academic Portal
              </h1>
              <p className="text-purple-200/90 text-sm leading-relaxed">
                Multi-layer verification safeguards student records and administrative privileges. A confidential One-Time Password is sent via Academic Email or SMS to your registered device upon password verification.
              </p>
            </div>

            <div className="relative z-10 pt-8 border-t border-purple-800/60 mt-8">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Factor 1: Confidential Password</h2>
                    <p className="text-[11px] text-purple-300">
                      Primary verification checks credentials against stored academy records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Factor 2: Email OTP Authentication</h2>
                    <p className="text-[11px] text-purple-300">
                      6-digit confidential code sent instantly to verified academic email address.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Alternative: Cellular SMS OTP</h2>
                    <p className="text-[11px] text-purple-300">
                      Dispatched to registered telephone number ({maskPhoneNumber(PRIMARY_REGISTERED_PHONE)}).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Strict Privacy Standard</h2>
                    <p className="text-[11px] text-purple-300">
                      Verification codes are never exposed on this login screen to prevent unauthorized interception.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-800/40 text-[11px] text-purple-300 font-serif italic">
                "Scientia, Integritas, Excellentia"
              </div>
            </div>
          </div>

          {/* Right Column: Portal Authentication Flow Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-purple-100 p-6 sm:p-10 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header: Changes with Authentication Step */}
              <div className="flex items-center justify-between pb-6 border-b border-purple-100 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-purple-100 text-purple-900">
                      {authStep === 'credentials' ? 'Step 1 of 2 · Factor 1' : 'Step 2 of 2 · Factor 2'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-purple-950">
                    {authStep === 'credentials'
                      ? 'Sign In to Portal'
                      : otpChannel === 'email'
                      ? 'Email OTP Verification'
                      : 'SMS OTP Verification'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {authStep === 'credentials'
                      ? 'Enter your Excellence Academy username and confidential password.'
                      : otpChannel === 'email'
                      ? `Enter the 6-digit verification code dispatched to ${otpSession?.account.fullName}'s academic email.`
                      : `Enter the 6-digit SMS verification code sent to authenticate ${otpSession?.account.fullName}.`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                  {authStep === 'credentials' ? (
                    <Lock className="w-6 h-6" />
                  ) : otpChannel === 'email' ? (
                    <Mail className="w-6 h-6 text-purple-800" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-purple-800" />
                  )}
                </div>
              </div>

              {/* Status Alert Messages */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 transition-all animate-fadeIn"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-rose-900">Access Denied</h3>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        {errorMessage}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-rose-700 font-medium">
                        {authStep === 'credentials' ? (
                          <>
                            <span>Failed attempts: {failedAttempts}</span>
                            <span>·</span>
                            <span>Logged in security audit registry</span>
                            {lockoutSeconds > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-bold text-rose-900">
                                  Cooldown: {lockoutSeconds}s
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span>Recorded in audit log</span>
                            <span>·</span>
                            <span>You may request a new OTP to try again</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {infoMessage && !errorMessage && !successMessage && (
                <div
                  role="status"
                  className="mb-6 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <Fingerprint className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-900 leading-relaxed">
                      {infoMessage}
                    </p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">Login Successful</h3>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: CREDENTIALS (USERNAME & PASSWORD) FORM */}
              {authStep === 'credentials' && (
                <form onSubmit={handleCredentialSubmit} className="space-y-4">
                  {/* Username input */}
                  <div>
                    <label
                      htmlFor="username-input"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Academy Username or ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="username-input"
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="e.g. sarah.jenkins or marcus.vance"
                        autoComplete="username"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password-input"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Account Password
                      </label>
                      <span className="text-[11px] text-purple-700 font-medium">
                        Primary Factor (Password)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="Enter confidential password"
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-11 py-2.5 text-sm bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-700 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthenticating || lockoutSeconds > 0}
                      className="w-full py-3 px-4 bg-purple-800 hover:bg-purple-900 active:bg-purple-950 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isAuthenticating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying Password...</span>
                        </>
                      ) : lockoutSeconds > 0 ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Security Cooldown ({lockoutSeconds}s)</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Password & Request OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: SECOND AUTHENTICATION FACTOR (OTP) FORM */}
              {authStep === 'otp_challenge' && otpSession && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Account Summary & Masked Contact */}
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-800 text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                        {otpSession.account.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-purple-950">
                            {otpSession.account.fullName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-purple-100 text-purple-900 capitalize">
                            {otpSession.account.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block">
                          User ID: {otpSession.account.studentOrStaffId}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToCredentials}
                      className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Account</span>
                    </button>
                  </div>

                  {/* 2FA DELIVERY CHANNEL SELECTOR TABS */}
                  <div className="flex items-center gap-2 p-1 bg-purple-100/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleSwitchChannel('email')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        otpChannel === 'email'
                          ? 'bg-white text-purple-950 shadow-xs'
                          : 'text-purple-800 hover:text-purple-950 hover:bg-white/50'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-purple-700" />
                      <span>Email OTP</span>
                      <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                        ({getMaskedEmail(otpSession.account)})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchChannel('sms')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        otpChannel === 'sms'
                          ? 'bg-white text-purple-950 shadow-xs'
                          : 'text-purple-800 hover:text-purple-950 hover:bg-white/50'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-700" />
                      <span>SMS OTP</span>
                      <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                        ({getMaskedRecipient(otpSession.account)})
                      </span>
                    </button>
                  </div>

                  {/* SECURE DELIVERY STATUS BANNER (Zero OTP Code Displayed on Screen!) */}
                  {otpChannel === 'email' ? (
                    <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/90 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-5 h-5 text-sky-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-purple-950">
                              OTP Dispatched to Academic Email
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            A confidential 6-digit One-Time Password has been sent to your verified institutional email:
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="font-mono font-bold text-sm text-purple-950 bg-white px-3 py-1 rounded-md border border-purple-200 shadow-2xs tracking-wider">
                              {getMaskedEmail(otpSession.account)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEmailSimulatorOpen(true)}
                              className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                              <span>Open Email Inbox Simulator</span>
                            </button>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-800">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Security Notice: To prevent unauthorized access, the code is not shown here.</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSwitchChannel('sms')}
                              className="text-purple-700 hover:text-purple-950 font-medium underline cursor-pointer"
                            >
                              Send via SMS instead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/90 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Smartphone className="w-5 h-5 text-purple-800" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-purple-950">
                              SMS Dispatched to Registered Mobile Number
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            A 6-digit One-Time Password has been dispatched via cellular SMS to your registered telephone number:
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="font-mono font-bold text-sm text-purple-950 bg-white px-3 py-1 rounded-md border border-purple-200 shadow-2xs tracking-wider">
                              {getMaskedRecipient(otpSession.account)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              (Nigeria Gateway)
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsPhoneSimulatorOpen(true)}
                              className="text-xs text-purple-700 hover:text-purple-950 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Open Handset Simulator</span>
                            </button>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-800">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Security Notice: To prevent unauthorized access, the code is not shown here.</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSwitchChannel('email')}
                              className="text-purple-700 hover:text-purple-950 font-medium underline cursor-pointer"
                            >
                              Send via Email instead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OTP Submission Form */}
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="otp-code-input"
                          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        >
                          Enter 6-Digit One-Time Password
                        </label>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          {secondsRemaining <= 0 ? (
                            <span className="font-bold text-rose-600">Expired</span>
                          ) : (
                            <span className="font-mono text-purple-800 font-semibold">
                              Expires in {formatCountdown(secondsRemaining)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="otp-code-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={7}
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder={
                            otpChannel === 'email'
                              ? 'Enter 6-digit code from email'
                              : 'Enter 6-digit code from SMS'
                          }
                          autoComplete="one-time-code"
                          autoFocus
                          required
                          className="w-full pl-10 pr-4 py-3 text-lg font-mono tracking-widest bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-center sm:text-left"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {otpChannel === 'email'
                          ? 'Enter the 6-digit code sent to your academic inbox. Valid for 90 seconds. If expired, click Resend Email OTP.'
                          : 'Enter the 6-digit code sent to your phone. Valid for 90 seconds. If expired, click Resend SMS.'}
                      </p>
                    </div>

                    {/* Action buttons: Verify OTP and Resend */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="submit"
                        disabled={isAuthenticating || !otpInput.trim()}
                        className="w-full sm:flex-1 py-3 px-4 bg-purple-800 hover:bg-purple-900 active:bg-purple-950 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isAuthenticating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify OTP & Sign In</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRequestNewOtp}
                        disabled={isAuthenticating}
                        className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-purple-50 active:bg-purple-100 text-purple-900 font-medium text-sm rounded-lg border border-purple-200 hover:border-purple-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <RotateCw className="w-4 h-4 text-purple-700" />
                        <span>{otpChannel === 'email' ? 'Resend Email OTP' : 'Resend SMS'}</span>
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleBackToCredentials}
                        className="text-xs text-slate-500 hover:text-purple-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to re-enter username & password</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Security Policy Information (Zero auto-fill, Zero exposed passwords) */}
            <div className="mt-8 pt-6 border-t border-purple-100 space-y-3">
              <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200/80">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-purple-950">
                      Two-Factor Authentication Security Standard
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Excellence Academy enforces a mandatory second authentication factor via verified Email or SMS OTP. Verification codes are strictly withheld from the browser interface to prevent unauthorized interception.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Email & SMS 2FA active · Protected terminal
                </span>
                <span className="text-slate-400 text-[11px]">
                  Institutional Security Compliance
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer with testing simulators */}
      <footer className="border-t border-purple-100 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Excellence Academy Portal · 400 Grandview Boulevard, Academic Heights
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span>Registrar: (555) 234-9000</span>
            <span>·</span>
            <span>IT Support: it@excellence.edu</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsEmailSimulatorOpen(true)}
              className="text-purple-700 hover:text-purple-950 font-medium underline flex items-center gap-1 cursor-pointer"
              title="Open Academic Email Inbox Simulator"
            >
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              <span>Simulate Email Inbox</span>
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsPhoneSimulatorOpen(true)}
              className="text-purple-700 hover:text-purple-950 font-medium underline flex items-center gap-1 cursor-pointer"
              title="Open Registered Handset (+2348161759263) Device Simulator"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-600" />
              <span>Simulate Handset (+2348161759263)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* SEPARATE EMAIL INBOX SIMULATOR DIALOG                     */}
      {/* (Represents academic email inbox outside of login screen)  */}
      {/* ========================================================= */}
      {isEmailSimulatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-simulator-title"
        >
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl border border-purple-200 shadow-2xl overflow-hidden flex flex-col relative animate-scaleUp">
            {/* Window header */}
            <div className="bg-purple-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <h3 id="email-simulator-title" className="text-xs font-bold font-serif text-white">
                    Excellence Academy Webmail
                  </h3>
                  <span className="text-[10px] text-purple-300 block -mt-0.5">
                    Mailbox: {otpSession?.account.email || PRIMARY_REGISTERED_EMAIL}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailSimulatorOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
                aria-label="Close email simulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Message View */}
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-50">
              {lastEmailDispatch ? (
                <div className="bg-white border border-purple-200/80 rounded-xl p-5 shadow-xs space-y-4">
                  {/* Metadata Header */}
                  <div className="border-b border-slate-100 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">
                        {lastEmailDispatch.subject}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lastEmailDispatch.timestamp}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">From:</span>
                      <span>Excellence Academy Security &lt;security@excellence.edu&gt;</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">To:</span>
                      <span className="font-mono text-purple-900">{lastEmailDispatch.recipient}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                    <p>
                      Hello <strong>{otpSession?.account.fullName || 'Scholar'}</strong>,
                    </p>
                    <p>
                      A login attempt was initiated for your Excellence Academy portal account. Use the following 6-digit One-Time Password to complete your Two-Factor Authentication:
                    </p>

                    {/* Highlighted OTP Box */}
                    <div className="my-3 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center space-y-1">
                      <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">
                        Your Verification Code
                      </span>
                      <div className="font-mono text-3xl font-extrabold text-purple-950 tracking-widest py-1">
                        {lastEmailDispatch.code}
                      </div>
                      <span className="text-[10px] text-purple-600 block">
                        Expires in 90 seconds · Do not disclose to anyone
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      If you did not initiate this authentication request, please report this incident immediately to the Excellence Academy Office of Information Security.
                    </p>
                  </div>

                  {/* Copy Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Institutional Security Protocol
                    </span>
                    {authStep === 'otp_challenge' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInput(lastEmailDispatch.code);
                          setIsEmailSimulatorOpen(false);
                          setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-purple-800 hover:bg-purple-900 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Copy Code to Login Input</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-700">Your Inbox is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Enter valid username and password on the portal to receive a 2FA One-Time Password email at your registered academic address.
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Official Excellence Academy Webmail Simulator
              </span>
              <button
                type="button"
                onClick={() => setIsEmailSimulatorOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md transition-colors"
              >
                Close Mailbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SEPARATE MOBILE HANDSET SIMULATOR DIALOG (+2348161759263)  */}
      {/* (Represents physical device inbox outside of login screen)  */}
      {/* ========================================================= */}
      {isPhoneSimulatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-simulator-title"
        >
          <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col relative animate-scaleUp">
            
            {/* Phone Speaker & Camera Notch */}
            <div className="bg-slate-950 py-2 px-6 flex items-center justify-between border-b border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">MTN-NG · 5G</span>
              <div className="w-16 h-3 bg-slate-800 rounded-full" />
              <button
                type="button"
                onClick={() => setIsPhoneSimulatorOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close handset simulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Handset Header */}
            <div className="p-4 bg-slate-850 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="phone-simulator-title" className="text-xs font-bold text-white">
                    Messages · +234 816 175 9263
                  </h3>
                  <span className="text-[10px] text-purple-300 block">
                    Registered Mobile Handset Terminal
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Content */}
            <div className="p-4 bg-slate-900 min-h-[260px] flex flex-col justify-end space-y-3">
              {lastSmsDispatch ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-100 shadow-sm space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] text-purple-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <BellRing className="w-3 h-3 text-purple-400" />
                      EXCELLENCE-ACADEMY
                    </span>
                    <span>{lastSmsDispatch.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-slate-200">
                    {lastSmsDispatch.message}
                  </p>
                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Code: <strong className="text-purple-300 font-mono text-xs">{lastSmsDispatch.code}</strong>
                    </span>
                    {authStep === 'otp_challenge' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInput(lastSmsDispatch.code);
                          setIsPhoneSimulatorOpen(false);
                          setErrorMessage(null);
                        }}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                      >
                        Copy to Input
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No SMS messages received yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Enter valid username and password to trigger SMS dispatch to +2348161759263.
                  </p>
                </div>
              )}
            </div>

            {/* Handset Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setIsPhoneSimulatorOpen(false)}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition-colors"
              >
                Put Away Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

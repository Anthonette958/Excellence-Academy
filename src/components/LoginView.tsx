import React, { useState, useEffect } from 'react';
import { UserAccount, LoginRecord } from '../types/portal';
import { verifyCredentials, createLoginRecord } from '../utils/auth';
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
  AlertTriangle,
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Security lockout countdown
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      // Execute credential verification against stored account database
      const result = verifyCredentials(username, password, accounts);

      if (!result.success) {
        // Access Denied: Record failed login attempt to the audit logs
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
        });

        onRecordLogin(failedRecord);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        // Security rate-limiting after repeated failures
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
        // Access Granted: Record successful login attempt
        const successRecord = createLoginRecord(username, 'Granted', {
          account: result.account,
        });

        onRecordLogin(successRecord);
        setSuccessMessage(`Access Granted! Welcome to Excellence Academy, ${result.account.fullName}.`);

        setTimeout(() => {
          setIsAuthenticating(false);
          onLoginSuccess(result.account!);
        }, 600);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] flex flex-col justify-between">
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
                Established 1928 · Campus Authentication Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-700/80 font-medium">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Secure Academic Gateway</span>
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
                Portal Security Gateway
              </span>
              <h1 className="text-2xl font-serif font-bold text-white leading-snug mb-3">
                Excellence Academy Academic Portal
              </h1>
              <p className="text-purple-200/90 text-sm leading-relaxed">
                Single secure gateway for students, faculty, guardians, and administration. Authorized password verification safeguards all academic records and student dossiers.
              </p>
            </div>

            <div className="relative z-10 pt-8 border-t border-purple-800/60 mt-8">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Password-Only Verification</h2>
                    <p className="text-[11px] text-purple-300">
                      Access is granted only when credentials match stored academy records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-800/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Restricted Administrator Access</h2>
                    <p className="text-[11px] text-purple-300">
                      Administrative console and account creation privileges require valid administrator authentication. Strangers and unauthorized users are denied.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-800/40 text-[11px] text-purple-300 font-serif italic">
                "Scientia, Integritas, Excellentia"
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-purple-100 p-6 sm:p-10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-purple-100 mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-purple-950">
                    Sign In to Portal
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter your Excellence Academy username and confidential password to proceed.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                  <Lock className="w-6 h-6" />
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
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">Access Denied</h3>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        {errorMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-rose-700 font-medium">
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
                      </div>
                    </div>
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
                      <h3 className="text-sm font-bold text-emerald-900">Authentication Confirmed</h3>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      placeholder="e.g. username"
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
                      Password-Only Verification
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
                    className="w-full py-3 px-4 bg-purple-800 hover:bg-purple-900 active:bg-purple-950 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : lockoutSeconds > 0 ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Security Cooldown ({lockoutSeconds}s)</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Policy Information (Zero auto-fill, Zero exposed passwords) */}
            <div className="mt-8 pt-6 border-t border-purple-100 space-y-3">
              <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200/80">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-purple-950">
                      Strict Access Control Policy
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Only authorized personnel with valid passwords may sign in. Stored accounts, credentials, and student registration consoles are restricted and protected from unauthorized access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Password-only verification active
                </span>
                <span className="text-slate-400 text-[11px]">
                  Authorized Access Only
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Excellence Academy Portal · 400 Grandview Boulevard, Academic Heights
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Registrar: (555) 234-9000</span>
            <span>·</span>
            <span>IT Support: it@excellence.edu</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

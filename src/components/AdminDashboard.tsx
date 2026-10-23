import React, { useState } from 'react';
import { UserAccount, LoginRecord } from '../types/portal';
import { ACADEMY_DIRECTORY } from '../data/mockData';
import { isUsernameTaken, createStudentAccount, createLoginRecord } from '../utils/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  CheckCircle2,
  Lock,
  Download,
  Trash2,
  Clock,
  Radio,
  Send,
  AlertTriangle,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  auditRecords: LoginRecord[];
  onClearAuditRecords: () => void;
  onOpenAuditLogs: () => void;
  accounts: UserAccount[];
  onCreateStudent: (newAccount: UserAccount) => void;
  onRecordLogin: (record: LoginRecord) => void;
  onSwitchAccount: (account: UserAccount) => void;
  onUpdateAccountPassword?: (accountId: string, newPassword: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  auditRecords,
  onClearAuditRecords,
  onOpenAuditLogs,
  accounts,
  onCreateStudent,
  onRecordLogin,
  onSwitchAccount,
  onUpdateAccountPassword,
}) => {
  const [directorySearch, setDirectorySearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Vault state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin password change state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // New Student Creation Form state
  const [studentName, setStudentName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState(
    `EA-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [studentGrade, setStudentGrade] = useState('Grade 11 · STEM Honors');
  const [studentEmail, setStudentEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] = useState<UserAccount | null>(null);

  // Handle student name change to auto-suggest username and email
  const handleStudentNameChange = (name: string) => {
    setStudentName(name);
    setCreateError(null);
    if (!studentUsername || studentUsername.includes('.')) {
      const parts = name.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        const suggestedUser = `${parts[0]}.${parts[parts.length - 1]}`;
        setStudentUsername(suggestedUser);
        setStudentEmail(`${suggestedUser}@excellence.edu`);
      } else if (parts.length === 1 && parts[0]) {
        setStudentUsername(parts[0]);
        setStudentEmail(`${parts[0]}@excellence.edu`);
      }
    }
  };

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanUsername = studentUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setCreateError('Please enter a username for the student.');
      return;
    }

    if (isUsernameTaken(cleanUsername, accounts)) {
      setCreateError(
        `The username "${cleanUsername}" is already assigned to another account in the Excellence Academy registry. Please choose a unique username.`
      );
      return;
    }

    if (!studentPassword || studentPassword.length < 6) {
      setCreateError('Student password must be at least 6 characters long.');
      return;
    }

    const newStudent = createStudentAccount({
      fullName: studentName,
      username: cleanUsername,
      password: studentPassword,
      studentId: studentIdNumber,
      grade: studentGrade,
      email: studentEmail || `${cleanUsername}@excellence.edu`,
    });

    onCreateStudent(newStudent);
    setCreatedStudent(newStudent);

    // Record an audit log for student creation
    const adminActionRecord = createLoginRecord(currentUser.username, 'Granted', {
      account: currentUser,
      failureReason: `Admin provisioned new student account: ${newStudent.username} (${newStudent.studentOrStaffId})`,
    });
    onRecordLogin(adminActionRecord);

    // Reset form fields with new random ID
    setStudentName('');
    setStudentUsername('');
    setStudentPassword('');
    setStudentEmail('');
    setStudentIdNumber(`EA-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const togglePasswordVisibility = (accId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [accId]: !prev[accId],
    }));
  };

  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `Username: ${acc.username}\nPassword: ${acc.password}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter directory
  const filteredDirectory = ACADEMY_DIRECTORY.filter((item) => {
    const matchesRole = roleFilter === 'All' ? true : item.role === roleFilter;
    if (!matchesRole) return false;
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.idNumber.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.division.toLowerCase().includes(q)
    );
  });

  const grantedCount = auditRecords.filter((r) => r.status === 'Granted').length;
  const deniedCount = auditRecords.filter((r) => r.status === 'Denied').length;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;
    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setBroadcastText('');
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 6) return;
    if (onUpdateAccountPassword) {
      onUpdateAccountPassword(currentUser.id, newAdminPassword);
      setPasswordChangeSuccess(true);
      setNewAdminPassword('');
      const auditRec = createLoginRecord(currentUser.username, 'Granted', {
        account: currentUser,
        failureReason: 'Administrator updated master confidential password',
      });
      onRecordLogin(auditRec);
      setTimeout(() => setPasswordChangeSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-[#1e082b] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-purple-200">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                  Academy Administration & Registrar Console
                </span>
                <span className="text-purple-400">·</span>
                <span className="text-xs text-purple-200 bg-purple-800/80 px-2 py-0.5 rounded-full font-mono">
                  {currentUser.studentOrStaffId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {currentUser.fullName}
              </h1>
              <p className="text-purple-200/90 text-xs sm:text-sm mt-1">
                {currentUser.titleOrGrade} · {currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('create-student')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Student</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className="px-4 py-2 bg-purple-800/80 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-purple-300" />
              <span>Credentials Vault</span>
            </button>
          </div>
        </div>

        {/* Security & System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-800/60 text-white">
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Stored Accounts</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              {accounts.length}
            </span>
            <span className="text-[10px] text-purple-300/80">Admin Protected Vault</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Access Granted Events</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-emerald-300 block mt-0.5">
              {grantedCount}
            </span>
            <span className="text-[10px] text-purple-300/80">Valid Password Matches</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Access Denied Events</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-rose-300 block mt-0.5">
              {deniedCount}
            </span>
            <span className="text-[10px] text-purple-300/80">Failed or Invalid Logins</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Security Audit Logs</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              {auditRecords.length}
            </span>
            <span className="text-[10px] text-purple-300/80">Chronological Events</span>
          </div>
        </div>
      </div>

      {/* Tab: Stored Accounts & Credentials Vault (Only Admin can see with password) */}
      {(activeTab === 'vault' || activeTab === 'overview') && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-700" />
                <h2 className="text-xl font-bold font-serif text-purple-950">
                  Stored Fictional Accounts & Credentials Vault
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Confidential registry accessible exclusively to Administrator Clara Oswald. Review account passwords or switch sessions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create-student')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-800 hover:bg-purple-900 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New Student</span>
              </button>
            </div>
          </div>

          {/* Master Admin Password Security Panel */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Master Administrator Access Protection
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Set a private, confidential administrator password to prevent any stranger from signing in as admin.
                </p>
              </div>

              <form onSubmit={handleChangeAdminPassword} className="flex items-center gap-2">
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="New Admin Password"
                  required
                  className="px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 w-44 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs"
                >
                  Update Admin Pass
                </button>
              </form>
            </div>

            {passwordChangeSuccess && (
              <div className="mt-2.5 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Administrator password successfully updated! Only you now have administrative access.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const isRevealed = !!visiblePasswords[acc.id];
              const isCopied = copiedId === acc.id;

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-purple-200/90 bg-purple-50/30 hover:bg-purple-50/60 hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-purple-950 font-serif">
                          {acc.fullName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-purple-200/80 text-purple-900">
                          {acc.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-700">
                        {acc.studentOrStaffId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {acc.titleOrGrade}
                    </p>

                    {/* Credentials Box */}
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">Username:</span>
                        <span className="font-bold text-purple-950 select-all">{acc.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-900 select-all">
                            {isRevealed ? acc.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            aria-label={isRevealed ? 'Hide password' : 'Show password'}
                            className="text-slate-400 hover:text-purple-700 transition-colors"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this account */}
                  <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(acc)}
                      className="px-2.5 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSwitchAccount(acc)}
                      className="px-3 py-1 text-xs font-semibold text-purple-950 bg-white hover:bg-purple-100 border border-purple-200 rounded-md transition-colors shadow-2xs"
                      title={`Switch active session to ${acc.fullName}`}
                    >
                      Sign In as {acc.role} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Create New Student Account */}
      {activeTab === 'create-student' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-700" />
              <h2 className="text-xl font-bold font-serif text-purple-950">
                Enroll New Student & Provision Portal Credentials
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Role: Registrar / Administrator. New student accounts are immediately authenticated by the password-only engine.
            </p>
          </div>

          {/* Success Banner if just created */}
          {createdStudent && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 animate-fadeIn">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900">
                      Student Account Provisioned Successfully!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      New student <span className="font-bold">{createdStudent.fullName}</span> has been enrolled with Student ID <span className="font-mono">{createdStudent.studentOrStaffId}</span>.
                    </p>
                    <div className="mt-2.5 p-2.5 bg-white/80 rounded-lg border border-emerald-200 text-xs font-mono space-y-1">
                      <div><span className="font-sans text-slate-500">Username:</span> {createdStudent.username}</div>
                      <div><span className="font-sans text-slate-500">Password:</span> {createdStudent.password}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSwitchAccount(createdStudent)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Test Student Login →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vault')}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-medium"
                  >
                    View in Vault
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          {/* Creation Form */}
          <form onSubmit={handleCreateStudentSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => handleStudentNameChange(e.target.value)}
                  placeholder="e.g. Lucas Montgomery"
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Username *
                </label>
                <input
                  type="text"
                  value={studentUsername}
                  onChange={(e) => {
                    setStudentUsername(e.target.value.toLowerCase().trim());
                    setCreateError(null);
                  }}
                  placeholder="e.g. lucas.montgomery"
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confidential Password *
                </label>
                <input
                  type="text"
                  value={studentPassword}
                  onChange={(e) => {
                    setStudentPassword(e.target.value);
                    setCreateError(null);
                  }}
                  placeholder="e.g. LucasPass2026!"
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Academy ID
                </label>
                <input
                  type="text"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Grade & Standing
                </label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option>Grade 9 · Freshman Honors</option>
                  <option>Grade 10 · Sophomore Honors</option>
                  <option>Grade 11 · STEM Honors</option>
                  <option>Grade 12 · Senior Scholar</option>
                  <option>Grade 12 · Advanced Placement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. lucas.montgomery@excellence.edu"
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enroll Student & Save Credentials</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Module: Authentication & Login Records Center */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <h2 className="text-xl font-bold font-serif text-purple-950">
                Live Login Audit & Access Control Registry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Records every login result in real-time with timestamp, username, IP, and status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuditLogs}
              className="px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
            >
              Expand Search & Filter View
            </button>
          </div>
        </div>

        {/* Live records feed (latest 5 attempts) */}
        <div className="space-y-2.5">
          {auditRecords.slice(0, 6).map((rec) => {
            const isGranted = rec.status === 'Granted';
            return (
              <div
                key={rec.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isGranted
                    ? 'bg-purple-50/20 border-purple-100'
                    : 'bg-rose-50/30 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isGranted ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-purple-950">
                        {rec.username}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isGranted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status === 'Granted' ? 'Access Granted' : 'Access Denied'}
                      </span>
                      {rec.role && (
                        <span className="text-[11px] text-slate-500 capitalize">· {rec.role}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isGranted ? 'Password verified · Session authenticated' : `Reason: ${rec.failureReason || 'Failed password'}`}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
                  <div className="text-purple-900 font-sans font-medium">{rec.formattedDate}</div>
                  <div className="text-[11px] text-slate-400">IP: {rec.ipAddress}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academy Directory */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-purple-950">
              Academy Registry Directory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official records of students, faculty, and authorized guardians
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search directory..."
                className="pl-9 pr-3 py-1.5 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-purple-100/60 rounded-lg">
              {['All', 'Student', 'Faculty', 'Parent', 'Staff'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    roleFilter === role
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-purple-800 hover:text-purple-950'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-purple-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Academy ID</th>
                <th className="py-3 px-3">Email Contact</th>
                <th className="py-3 px-4">Division / Standing</th>
                <th className="py-3 px-3 text-right">Registry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredDirectory.map((user) => (
                <tr key={user.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-purple-950 text-sm">
                    {user.name}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-purple-700">{user.idNumber}</td>
                  <td className="py-3.5 px-3 text-slate-600">{user.email}</td>
                  <td className="py-3.5 px-4 text-slate-700">{user.division}</td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-semibold text-emerald-700 text-xs">
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcaster */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold font-serif text-purple-950 mb-1">
          Broadcast Campus Bulletin
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Publish immediate announcement to all student, faculty, and guardian portal dashboards.
        </p>

        {broadcastSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Announcement dispatched and pinned to the campus bulletin board!</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Bulletin Subject Title
            </label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Schedule Update for Fall Convocation"
              required
              className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Announcement Message Body
            </label>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              rows={3}
              placeholder="Enter details..."
              required
              className="w-full p-3 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Bulletin Notice</span>
          </button>
        </form>
      </div>
    </div>
  );
};

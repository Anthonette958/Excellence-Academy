import React, { useState, useEffect } from 'react';
import { UserAccount, LoginRecord } from './types/portal';
import { INITIAL_LOGIN_RECORDS, FICTIONAL_ACCOUNTS } from './data/mockData';
import { LoginView } from './components/LoginView';
import { TopBar } from './components/TopBar';
import { StudentDashboard } from './components/StudentDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginAuditModal } from './components/LoginAuditModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Dynamic accounts state (persisted in localStorage)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ea_portal_accounts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return FICTIONAL_ACCOUNTS;
  });

  // Dynamic login audit records (persisted in localStorage)
  const [auditRecords, setAuditRecords] = useState<LoginRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ea_audit_records_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_LOGIN_RECORDS;
  });

  // Support ?autostart=1 or ?role=admin for browser automation & testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const role = params.get('role') || 'student';
        const target = accounts.find((a) => a.role === role) || accounts[0];
        setCurrentUser(target);
      }
    }
  }, [accounts]);

  // Save audit logs to localStorage
  const handleRecordLogin = (newRecord: LoginRecord) => {
    setAuditRecords((prev) => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem('ea_audit_records_v1', JSON.stringify(updated));
      } catch {
        // quota safety
      }
      return updated;
    });
  };

  // Admin role: create new student account
  const handleCreateStudent = (newAccount: UserAccount) => {
    setAccounts((prev) => {
      const updated = [...prev, newAccount];
      try {
        localStorage.setItem('ea_portal_accounts_v1', JSON.stringify(updated));
      } catch {
        // safety
      }
      return updated;
    });
  };

  // Admin role: update account password
  const handleUpdateAccountPassword = (accountId: string, newPassword: string) => {
    setAccounts((prev) => {
      const updated = prev.map((a) => (a.id === accountId ? { ...a, password: newPassword } : a));
      try {
        localStorage.setItem('ea_portal_accounts_v1', JSON.stringify(updated));
      } catch {
        // safety
      }
      return updated;
    });
    if (currentUser && currentUser.id === accountId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPassword } : null));
    }
  };

  const handleClearAuditRecords = () => {
    if (window.confirm('Are you sure you want to reset the login audit records to baseline?')) {
      setAuditRecords(INITIAL_LOGIN_RECORDS);
      try {
        localStorage.setItem('ea_audit_records_v1', JSON.stringify(INITIAL_LOGIN_RECORDS));
      } catch {
        // safety
      }
    }
  };

  const handleLoginSuccess = (account: UserAccount) => {
    setCurrentUser(account);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('overview');
  };

  const handleSwitchAccount = (targetAccount: UserAccount) => {
    setCurrentUser(targetAccount);
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-slate-900 flex flex-col justify-between selection:bg-purple-200 selection:text-purple-900">
      {/* If not logged in, display the Excellence Academy Login View */}
      {!currentUser ? (
        <LoginView
          accounts={accounts}
          onLoginSuccess={handleLoginSuccess}
          onRecordLogin={handleRecordLogin}
        />
      ) : (
        /* If logged in, display the Authenticated School Portal Workspace */
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Top Bar with brand crest, navigation links, and logout */}
            <TopBar
              currentUser={currentUser}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenAuditLogs={() => setIsAuditModalOpen(true)}
              onLogout={handleLogout}
              totalLogCount={auditRecords.length}
            />

            {/* Main Portal Viewport */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {currentUser.role === 'student' && (
                <StudentDashboard
                  currentUser={currentUser}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.role === 'faculty' && (
                <FacultyDashboard
                  currentUser={currentUser}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.role === 'parent' && (
                <ParentDashboard
                  currentUser={currentUser}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.role === 'admin' && (
                <AdminDashboard
                  currentUser={currentUser}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  auditRecords={auditRecords}
                  onClearAuditRecords={handleClearAuditRecords}
                  onOpenAuditLogs={() => setIsAuditModalOpen(true)}
                  accounts={accounts}
                  onCreateStudent={handleCreateStudent}
                  onRecordLogin={handleRecordLogin}
                  onSwitchAccount={handleSwitchAccount}
                  onUpdateAccountPassword={handleUpdateAccountPassword}
                />
              )}
            </main>
          </div>

          <Footer
            isAdmin={currentUser.role === 'admin'}
            onOpenAuditLogs={() => setIsAuditModalOpen(true)}
            onSwitchUser={handleLogout}
          />
        </div>
      )}

      {/* Administrator-Only Login Audit Records Modal */}
      {currentUser?.role === 'admin' && (
        <LoginAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          records={auditRecords}
          onClearRecords={handleClearAuditRecords}
        />
      )}
    </div>
  );
}

import React from 'react';
import { UserAccount } from '../types/portal';
import { ACADEMY_CREST_IMG } from '../data/mockData';
import { ShieldCheck, LogOut, ShieldAlert, User, Bell } from 'lucide-react';

interface TopBarProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuditLogs: () => void;
  onLogout: () => void;
  totalLogCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuditLogs,
  onLogout,
  totalLogCount,
}) => {
  // Navigation tabs tailored to user role
  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'overview', label: 'Overview' },
          { id: 'grades', label: 'Academics & Grades' },
          { id: 'schedule', label: 'Class Timetable' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'bulletin', label: 'Campus Bulletin' },
        ];
      case 'faculty':
        return [
          { id: 'overview', label: 'Faculty Hub' },
          { id: 'roster', label: 'Class Roster & Grades' },
          { id: 'attendance', label: 'Attendance Sheet' },
          { id: 'assignments', label: 'Curriculum & Tasks' },
          { id: 'bulletin', label: 'Announcements' },
        ];
      case 'parent':
        return [
          { id: 'overview', label: 'Ward Summary' },
          { id: 'grades', label: 'Academic Report' },
          { id: 'tuition', label: 'Tuition & Fees' },
          { id: 'schedule', label: 'Daily Timetable' },
          { id: 'bulletin', label: 'Academy Notices' },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Administration' },
          { id: 'vault', label: 'Stored Accounts Vault' },
          { id: 'create-student', label: '+ New Student Account' },
          { id: 'directory', label: 'Academy Directory' },
          { id: 'announcements', label: 'Broadcasts' },
        ];
      default:
        return [{ id: 'overview', label: 'Overview' }];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element Brand mark with crest */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-purple-200 shadow-xs bg-purple-50 flex items-center justify-center">
              <img
                src={ACADEMY_CREST_IMG}
                alt="Excellence Academy Crest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-purple-950 font-serif block leading-none">
                Excellence Academy
              </span>
              <span className="text-[10px] tracking-wider uppercase text-purple-600 font-semibold mt-0.5 block">
                Official Portal
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean hover states) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-purple-100/80 text-purple-900 font-semibold'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Security Login Records Action + User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Audit Log Trigger */}
            <button
              onClick={onOpenAuditLogs}
              title="View recorded login history and authentication logs"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">Login Records</span>
              <span className="bg-purple-200 text-purple-900 text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold">
                {totalLogCount}
              </span>
            </button>

            {/* User Profile Mini */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-purple-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <span className="font-semibold text-purple-950 block leading-tight truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-slate-500 text-[10px] capitalize block">
                  {currentUser.role} · {currentUser.studentOrStaffId}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors whitespace-nowrap shrink-0"
              title="Sign out of Excellence Academy Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-purple-50 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-purple-700 text-white font-semibold'
                    : 'text-slate-600 bg-purple-50/70 hover:bg-purple-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

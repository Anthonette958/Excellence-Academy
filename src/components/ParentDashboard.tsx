import React, { useState } from 'react';
import { UserAccount } from '../types/portal';
import { TUITION_INVOICE } from '../data/mockData';
import {
  CreditCard,
  UserCheck,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Award,
} from 'lucide-react';

interface ParentDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuditLogs: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuditLogs,
}) => {
  const [messageSent, setMessageSent] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim()) return;
    setMessageSent(true);
    setAdvisorMessage('');
    setTimeout(() => setMessageSent(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Parent Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-purple-200">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                  Parent & Guardian Portal
                </span>
                <span className="text-purple-400">·</span>
                <span className="text-xs text-purple-200 bg-purple-700/60 px-2 py-0.5 rounded-full font-mono">
                  {currentUser.studentOrStaffId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {currentUser.fullName}
              </h1>
              <p className="text-purple-200/90 text-xs sm:text-sm mt-1">
                Guardian of <span className="font-semibold text-white">{currentUser.wardName}</span> ({currentUser.wardGrade})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('tuition')}
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors"
            >
              Fee Statement
            </button>
            <button
              onClick={onOpenAuditLogs}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-purple-100 rounded-xl text-xs font-semibold border border-white/20 transition-colors"
            >
              Security Logs
            </button>
          </div>
        </div>

        {/* Ward Academic Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-700/60 text-white">
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Ward Current GPA</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              3.91
            </span>
            <span className="text-[10px] text-purple-300/80">Honor Roll Standing</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Attendance Record</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              99.1%
            </span>
            <span className="text-[10px] text-purple-300/80">61 of 62 Days Present</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Tuition Account</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-emerald-300 block mt-0.5">
              $0.00 Due
            </span>
            <span className="text-[10px] text-emerald-200/90">Fall 2026 Paid in Full</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Next PTA Conference</span>
            <span className="text-sm font-bold font-sans text-white block mt-1">
              Nov 12, 2026
            </span>
            <span className="text-[10px] text-purple-300/80">Room 105 · Ms. Holloway</span>
          </div>
        </div>
      </div>

      {/* Tuition & Financial Ledger */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-purple-950">
              Tuition & Academic Fees Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice #{TUITION_INVOICE.id} · {TUITION_INVOICE.term}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {TUITION_INVOICE.status}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {TUITION_INVOICE.items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-purple-50/20 border border-purple-100 flex items-center justify-between text-xs"
            >
              <span className="font-semibold text-purple-950">{item.description}</span>
              <span className="font-mono font-bold text-slate-700 tabular-nums">
                ${item.amount.toLocaleString()}.00
              </span>
            </div>
          ))}

          <div className="pt-3 border-t border-purple-200 flex items-center justify-between text-sm font-bold text-purple-950">
            <span>Total Term Tuition & Facilities</span>
            <span className="font-mono tabular-nums">
              ${TUITION_INVOICE.totalAmount.toLocaleString()}.00
            </span>
          </div>
        </div>
      </div>

      {/* Direct Communication with Academic Advisor */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold font-serif text-purple-950 mb-1">
          Direct Note to Maya's Academic Advisor
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Messages are dispatched immediately to Dean Clara Oswald & Faculty Advisor Dr. Marcus Vance.
        </p>

        {messageSent && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Note securely dispatched to academic advisor. A response will be returned within 24 hours.</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            value={advisorMessage}
            onChange={(e) => setAdvisorMessage(e.target.value)}
            rows={3}
            placeholder="Type your question regarding academic schedule, college prep counseling, or health updates..."
            required
            className="w-full p-3 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Advisor Inquiry</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { LoginRecord } from '../types/portal';
import { filterAuditLogs } from '../utils/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  X,
  Download,
  Trash2,
  Filter,
  Clock,
  Laptop,
  Globe,
  CheckCircle2,
} from 'lucide-react';

interface LoginAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: LoginRecord[];
  onClearRecords: () => void;
}

export const LoginAuditModal: React.FC<LoginAuditModalProps> = ({
  isOpen,
  onClose,
  records,
  onClearRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Granted' | 'Denied'>('all');

  if (!isOpen) return null;

  const filtered = filterAuditLogs(records, searchQuery, statusFilter);

  const grantedCount = records.filter((r) => r.status === 'Granted').length;
  const deniedCount = records.filter((r) => r.status === 'Denied').length;

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Username', 'Status', 'Role', 'Failure Reason', 'IP Address', 'Device', 'Location'];
    const rows = filtered.map((r) => [
      `"${r.formattedDate}"`,
      `"${r.username}"`,
      `"${r.status}"`,
      `"${r.role || 'N/A'}"`,
      `"${r.failureReason || 'None (Access Granted)'}"`,
      `"${r.ipAddress}"`,
      `"${r.deviceInfo}"`,
      `"${r.location}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `excellence_academy_login_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-purple-200 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="text-lg font-bold font-serif text-purple-950">
                Authentication Audit & Login Registry
              </h2>
              <p className="text-xs text-slate-500">
                Official chronological log of all access granted and denied events for Excellence Academy.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric summary strip */}
        <div className="px-6 py-3 bg-white border-b border-purple-100 grid grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Total Attempts:</span>
            <span className="text-sm font-bold text-purple-950 tabular-nums">{records.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-medium">Access Granted:</span>
            <span className="text-sm font-bold text-emerald-800 tabular-nums">{grantedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-rose-700 font-medium">Access Denied:</span>
            <span className="text-sm font-bold text-rose-800 tabular-nums">{deniedCount}</span>
          </div>
        </div>

        {/* Toolbar: Search, Filter Tabs, Actions */}
        <div className="p-4 sm:px-6 bg-[#FAF8FC] border-b border-purple-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, reason, or IP..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Filter segment tabs */}
          <div className="flex items-center gap-1 p-1 bg-purple-100/60 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('Granted')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Granted'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              Granted ({grantedCount})
            </button>
            <button
              onClick={() => setStatusFilter('Denied')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Denied'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              Denied ({deniedCount})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-900 bg-white hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors shadow-xs"
              title="Download security audit log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClearRecords}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
              title="Reset recorded logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Scrollable Records Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShieldAlert className="w-10 h-10 text-purple-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No matching login records</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing search terms or changing your status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((record) => {
                const isGranted = record.status === 'Granted';
                return (
                  <div
                    key={record.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isGranted
                        ? 'bg-purple-50/20 border-purple-200/80 hover:border-purple-300'
                        : 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Left: User & Status */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isGranted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isGranted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <ShieldAlert className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-purple-950 font-mono">
                              {record.username}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isGranted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {record.status === 'Granted' ? 'Access Granted' : 'Access Denied'}
                            </span>
                            {record.role && (
                              <span className="text-xs text-slate-500 capitalize hidden sm:inline">
                                · {record.role}
                              </span>
                            )}
                          </div>

                          {/* Failure reason or successful notification */}
                          <div className="text-xs text-slate-600 mt-0.5">
                            {isGranted ? (
                              <span className="text-emerald-700 font-medium">
                                Password authentication verified against academy records
                              </span>
                            ) : (
                              <span className="text-rose-700 font-medium">
                                Reason: {record.failureReason || 'Authentication failed'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Timestamp & IP */}
                      <div className="text-left sm:text-right text-xs text-slate-500 font-mono tabular-nums">
                        <div className="flex items-center sm:justify-end gap-1.5 text-slate-700 font-sans">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>{record.formattedDate}</span>
                        </div>
                        <div className="flex items-center sm:justify-end gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>IP: {record.ipAddress}</span>
                          <span>·</span>
                          <span>{record.deviceInfo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#FAF8FC] border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
          <span>Security Protocol: Password-Only Gateway Hash Compliance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-800 hover:bg-purple-900 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { ACADEMY_CREST_IMG } from '../data/mockData';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenAuditLogs?: () => void;
  onSwitchUser?: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAuditLogs, onSwitchUser, isAdmin }) => {
  return (
    <footer className="mt-16 border-t border-purple-100 bg-white/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Crest info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-200 bg-purple-50 flex items-center justify-center shrink-0">
            <img
              src={ACADEMY_CREST_IMG}
              alt="Excellence Academy"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-purple-950 block">
              Excellence Academy · Academic Portal
            </span>
            <span className="text-xs text-purple-700/80 italic font-serif block">
              "Scientia, Integritas, Excellentia" · Est. 1928
            </span>
          </div>
        </div>

        {/* Links & Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          {isAdmin && onOpenAuditLogs && (
            <>
              <button
                onClick={onOpenAuditLogs}
                className="hover:text-purple-900 transition-colors flex items-center gap-1 font-medium text-purple-700"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Admin Audit Registry</span>
              </button>
              <span>·</span>
            </>
          )}
          <span>Terms of Academic Integrity</span>
          <span>·</span>
          <span>Campus Security (555) 234-9911</span>
          {onSwitchUser && (
            <>
              <span>·</span>
              <button
                onClick={onSwitchUser}
                className="text-purple-700 font-semibold hover:text-purple-900 underline"
              >
                Switch Account
              </button>
            </>
          )}
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 text-center md:text-right">
          © 2026 Excellence Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

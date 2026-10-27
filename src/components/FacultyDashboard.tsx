import React, { useState } from 'react';
import { UserAccount } from '../types/portal';
import { FACULTY_ROSTER, ANNOUNCEMENTS } from '../data/mockData';
import {
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  PlusCircle,
  FileCheck,
  Award,
  AlertCircle,
} from 'lucide-react';

interface FacultyDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
}) => {
  const [roster, setRoster] = useState(FACULTY_ROSTER);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New assignment modal / form state
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('AP Physics C');
  const [newPoints, setNewPoints] = useState('50');
  const [newDueDate, setNewDueDate] = useState('Nov 04, 2026');

  const toggleAttendance = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const nextState =
            s.attendance === 'Present'
              ? 'Tardy'
              : s.attendance === 'Tardy'
              ? 'Absent'
              : 'Present';
          return { ...s, attendance: nextState };
        }
        return s;
      })
    );
    setSuccessToast('Attendance record updated in central registry.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSuccessToast(`Assignment "${newTitle}" published to student portal!`);
    setNewTitle('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-purple-200">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                  Faculty Workspace · Academic Term
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('roster')}
              className="px-4 py-2 bg-purple-700/80 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors"
            >
              Class Rosters
            </button>
          </div>
        </div>

        {/* Metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-800/60 text-white">
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Total Students</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              128
            </span>
            <span className="text-[10px] text-purple-300/80">3 Active Course Sections</span>
          </div>
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Roster Attendance</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              96.8%
            </span>
            <span className="text-[10px] text-purple-300/80">4 Students Marked Present</span>
          </div>
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Pending Submissions</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              14
            </span>
            <span className="text-[10px] text-purple-300/80">Needs Assessment</span>
          </div>
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Next Session</span>
            <span className="text-sm font-bold font-sans text-white block mt-1 truncate">
              AP Physics C (Sci 304)
            </span>
            <span className="text-[10px] text-purple-300/80">08:30 AM Tomorrow</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-purple-900 text-white rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-300" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-purple-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Roster & Grade Management */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-purple-950">
              AP Physics C Course Roster & Grade Submission
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click attendance to toggle: Present → Tardy → Absent
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Section 1 · Science Center 304</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-purple-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3">Standing</th>
                <th className="py-3 px-3 text-right">Current Score</th>
                <th className="py-3 px-3 text-center">Today's Attendance</th>
                <th className="py-3 px-4 text-right">Last Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {roster.map((student) => (
                <tr key={student.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-purple-950 text-sm">
                    {student.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-purple-700 text-xs">
                    {student.studentId}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{student.grade}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-purple-950 tabular-nums">
                    {student.currentScore}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        student.attendance === 'Present'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : student.attendance === 'Tardy'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {student.attendance}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {student.lastAssignment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Curriculum & Assignment Publishing Form */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold font-serif text-purple-950 mb-2">
          Dispatch New Course Assignment
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Publishes task directly to enrolled student portals and academic schedules.
        </p>

        <form onSubmit={handleCreateAssignment} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Electromagnetic Resonance Laboratory Report"
              required
              className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Course
              </label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option>AP Physics C</option>
                <option>Autonomous Robotics</option>
                <option>Senior Physics Seminar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Points
              </label>
              <input
                type="number"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

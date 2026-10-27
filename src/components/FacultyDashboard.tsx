import React, { useState } from 'react';
import { UserAccount, Assignment } from '../types/portal';
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
  Calendar,
  Sparkles,
  Layers,
  Send,
} from 'lucide-react';

interface FacultyDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  assignments: Assignment[];
  onAddAssignment: (assignment: Assignment) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  assignments,
  onAddAssignment,
}) => {
  const [roster, setRoster] = useState(FACULTY_ROSTER);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New assignment form state
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('AP Physics C');
  const [newPoints, setNewPoints] = useState('50');
  const [newDueDate, setNewDueDate] = useState('Nov 05, 2026');
  const [newDescription, setNewDescription] = useState('');

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
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    const points = parseInt(newPoints, 10) || 50;
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now);

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      course: newCourse,
      dueDate: newDueDate.trim() || 'Nov 12, 2026',
      status: 'Pending',
      pointsPossible: points,
      description:
        newDescription.trim() ||
        `Comprehensive curriculum deliverable assigned by ${currentUser.fullName}. Submit solution report via portal before deadline.`,
      assignedBy: currentUser.fullName,
      assignedDate: formattedDate,
    };

    onAddAssignment(newAssignment);
    setSuccessToast(
      `Assignment "${cleanTitle}" successfully published! It is now live on the Student Portal.`
    );

    // Reset inputs
    setNewTitle('');
    setNewDescription('');
    setNewPoints('50');
    setNewDueDate('Nov 08, 2026');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Filter assignments relevant to this faculty member or AP Physics C
  const activeFacultyAssignments = assignments.filter(
    (a) => a.course.includes('Physics') || a.course.includes('Robotics') || a.assignedBy === currentUser.fullName
  );

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
              onClick={() => setActiveTab('assignments')}
              className="px-4 py-2 bg-purple-700/80 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-purple-200" />
              <span>Assign Coursework</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className="px-4 py-2 bg-purple-800/80 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors"
            >
              Class Roster
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
            <span className="text-[11px] text-purple-300 font-medium block">Total Course Tasks</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-purple-200 block mt-0.5">
              {assignments.length}
            </span>
            <span className="text-[10px] text-purple-300/80">Live in Student Portals</span>
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
        <div className="p-3 bg-purple-900 text-white rounded-xl text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-300 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-purple-300 hover:text-white shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary: Curriculum & Assignment Dispatch Form */}
      {(activeTab === 'assignments' || activeTab === 'overview' || !activeTab) && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
            <div>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-700" />
                <h2 className="text-xl font-bold font-serif text-purple-950">
                  Assign Coursework to Students
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assignments published here immediately reflect on enrolled student dashboards, coursework lists, and upcoming task schedules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg border border-purple-200">
                Live Dynamic Sync
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Electromagnetic Induction & Maxwell Equations Problem Set"
                required
                className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course *
                </label>
                <select
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="AP Physics C">AP Physics C</option>
                  <option value="Autonomous Robotics">Autonomous Robotics</option>
                  <option value="Multivariable Calculus">Multivariable Calculus</option>
                  <option value="AP Chemistry">AP Chemistry</option>
                  <option value="World Literature">World Literature</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Points Possible *
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date *
                </label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="e.g. Nov 06, 2026"
                  required
                  className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Instructions & Submission Requirements
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Detail laboratory procedures, computational guidelines, or required problem sets..."
                className="w-full p-3 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Assign to Student Portals</span>
              </button>

              <span className="text-[11px] text-slate-500">
                Immediately updates student upcoming task widgets and homework tab.
              </span>
            </div>
          </form>

          {/* Active Dispatched Assignments Feed */}
          <div className="pt-6 border-t border-purple-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif text-purple-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-700" />
                <span>Current Active Assignments ({assignments.length})</span>
              </h3>
              <span className="text-xs text-slate-500">Synced with Student Workspace</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/20 hover:bg-purple-50/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-semibold text-purple-800">{asg.course}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                        {asg.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-purple-950 line-clamp-1">
                      {asg.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      {asg.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">Due: {asg.dueDate}</span>
                    <span className="font-mono font-bold text-purple-950">
                      {asg.pointsPossible} pts max
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Roster & Grade Management */}
      {(activeTab === 'roster' || activeTab === 'overview' || !activeTab) && (
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
      )}
    </div>
  );
};

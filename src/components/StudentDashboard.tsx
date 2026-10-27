import React, { useState } from 'react';
import { UserAccount, Assignment, ScheduleItem } from '../types/portal';
import {
  STUDENT_COURSES,
  WEEKLY_SCHEDULE,
  ANNOUNCEMENTS,
  ATTENDANCE_DATA,
} from '../data/mockData';
import { calculateGPA } from '../utils/auth';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Send,
  FileText,
  User,
  Award,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  assignments: Assignment[];
  onToggleAssignmentStatus: (assignmentId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  assignments,
  onToggleAssignmentStatus,
}) => {
  const [selectedDay, setSelectedDay] = useState<
    'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  >('Monday');
  const [submittedToast, setSubmittedToast] = useState<string | null>(null);

  const gpa = calculateGPA(STUDENT_COURSES);

  const handleToggle = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return;
    const nextStatus = target.status === 'Submitted' ? 'Pending' : 'Submitted';
    onToggleAssignmentStatus(assignmentId);
    setSubmittedToast(
      nextStatus === 'Submitted'
        ? `"${target.title}" successfully marked as submitted!`
        : `Submission withdrawn for "${target.title}".`
    );
    setTimeout(() => setSubmittedToast(null), 3500);
  };

  const daySchedule = WEEKLY_SCHEDULE.filter((item) => item.day === selectedDay);
  const pendingCount = assignments.filter((a) => a.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-purple-200 shadow-inner">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                  Academic Portal · Fall Session
                </span>
                <span className="text-purple-400">·</span>
                <span className="text-xs text-purple-200 bg-purple-700/60 px-2 py-0.5 rounded-full font-mono">
                  {currentUser.studentOrStaffId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                Welcome back, {currentUser.fullName}
              </h1>
              <p className="text-purple-200/90 text-xs sm:text-sm mt-1">
                {currentUser.titleOrGrade} · {currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('assignments')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors shadow-xs"
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className="px-4 py-2 bg-purple-700/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors shadow-xs"
            >
              View Gradebook
            </button>
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-700/60 text-white">
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Cumulative GPA</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-serif tabular-nums text-white">{gpa}</span>
              <span className="text-xs text-purple-300">/ 4.00</span>
            </div>
            <span className="text-[10px] text-purple-300/80">Summa Cum Laude Track</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Term Attendance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-serif tabular-nums text-white">
                {ATTENDANCE_DATA.overallRate}%
              </span>
            </div>
            <span className="text-[10px] text-purple-300/80">
              {ATTENDANCE_DATA.presentDays} of {ATTENDANCE_DATA.totalDays} sessions
            </span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Active Courses</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-serif tabular-nums text-white">5</span>
              <span className="text-xs text-purple-300">Enrolled</span>
            </div>
            <span className="text-[10px] text-purple-300/80">22 Upper Credits</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Pending Tasks</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-serif tabular-nums text-purple-200">
                {pendingCount}
              </span>
              <span className="text-xs text-purple-300">Active</span>
            </div>
            <span className="text-[10px] text-purple-300/80">Live Faculty Assignments</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {submittedToast && (
        <div className="p-3 bg-purple-900 text-white rounded-xl text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-300" />
            <span>{submittedToast}</span>
          </div>
          <button
            onClick={() => setSubmittedToast(null)}
            className="text-purple-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab: Overview */}
      {(activeTab === 'overview' || !activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Schedule Snapshot */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-purple-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-700" />
                <h3 className="font-serif font-bold text-base text-purple-950">
                  Today's Course Schedule
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900"
              >
                Full Week →
              </button>
            </div>

            <div className="space-y-3">
              {daySchedule.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-purple-50/40 border border-purple-100/80 flex items-center justify-between hover:bg-purple-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs tabular-nums">
                      P{item.period}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-purple-950">
                        {item.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.instructor} · {item.room}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-purple-900 block tabular-nums">
                      {item.timeRange}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Deadlines & Faculty Assigned Work */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <h3 className="font-serif font-bold text-base text-purple-950">
                    Faculty Assigned Work
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  All ({assignments.length}) →
                </button>
              </div>

              <div className="space-y-2.5">
                {assignments.slice(0, 4).map((asg) => (
                  <div
                    key={asg.id}
                    className="p-3 rounded-xl border border-purple-100/70 bg-purple-50/20 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {asg.course}
                        </span>
                        {asg.assignedBy && (
                          <span className="text-[10px] text-slate-400">by {asg.assignedBy}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-purple-950 leading-snug mt-1">
                        {asg.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-purple-800">Due {asg.dueDate}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">{asg.pointsPossible} pts</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(asg.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        asg.status === 'Submitted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-800 text-white hover:bg-purple-900 shadow-2xs'
                      }`}
                    >
                      {asg.status === 'Submitted' ? 'Submitted ✓' : 'Submit'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Academy Motto & Notice */}
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Excellence Honor Code</span>
              </div>
              <p className="text-xs text-purple-900/80 leading-relaxed font-serif italic">
                "Excellence Academy students hold high the ideals of scholarly inquiry, personal honor, and mutual respect."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Academics & Gradebook */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-100">
            <div>
              <h2 className="text-xl font-bold font-serif text-purple-950">
                Official Academic Gradebook
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fall 2026 Term · Verified by Office of the Registrar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-950">
                Cumulative GPA: <span className="text-purple-700 font-bold font-mono">{gpa}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Course Name & Code</th>
                  <th className="py-3 px-3">Instructor</th>
                  <th className="py-3 px-3">Period & Room</th>
                  <th className="py-3 px-3 text-right">Credits</th>
                  <th className="py-3 px-3 text-right">Score</th>
                  <th className="py-3 px-3 text-center">Letter</th>
                  <th className="py-3 px-4">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {STUDENT_COURSES.map((crs) => (
                  <tr key={crs.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-sm text-purple-950">{crs.courseName}</div>
                      <div className="text-[11px] font-mono text-purple-700">{crs.courseCode}</div>
                    </td>
                    <td className="py-4 px-3 font-medium text-slate-700">{crs.instructor}</td>
                    <td className="py-4 px-3 text-slate-500">
                      <div>{crs.period}</div>
                      <div className="text-[10px] text-slate-400">{crs.room}</div>
                    </td>
                    <td className="py-4 px-3 text-right font-mono text-slate-700 font-semibold">
                      {crs.credits}.0
                    </td>
                    <td className="py-4 px-3 text-right font-mono font-bold text-purple-950 tabular-nums">
                      {crs.percentage}%
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-purple-100 text-purple-900 border border-purple-200">
                        {crs.letterGrade}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                      {crs.recentFeedback}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Schedule Timetable */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
            <div>
              <h2 className="text-xl font-bold font-serif text-purple-950">
                Weekly Academic Timetable
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard schedule for Grade 12 STEM Honors Cohort
              </p>
            </div>

            {/* Day Selector Buttons */}
            <div className="flex items-center gap-1 p-1 bg-purple-100/70 rounded-xl overflow-x-auto">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-purple-800 hover:text-purple-950 hover:bg-white/50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {daySchedule.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      Period {item.period}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-purple-950 leading-snug">
                    {item.subject}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.instructor}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{item.room}</span>
                  <span className="font-semibold text-purple-900">{item.timeRange}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assignments (Dynamic shared assignments) */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-100">
            <div>
              <h2 className="text-xl font-bold font-serif text-purple-950">
                Coursework & Submissions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks assigned by faculty members are updated here in real time.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Completed:{' '}
              <span className="font-bold text-purple-900 tabular-nums">
                {assignments.filter((a) => a.status === 'Graded' || a.status === 'Submitted').length}
              </span>{' '}
              / {assignments.length} total tasks
            </div>
          </div>

          <div className="space-y-4">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="p-5 rounded-xl border border-purple-100 bg-purple-50/20 hover:bg-purple-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                      {asg.course}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">Due {asg.dueDate}</span>
                    {asg.assignedBy && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-purple-900 font-medium">
                          Assigned by {asg.assignedBy}
                        </span>
                      </>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        asg.status === 'Graded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : asg.status === 'Submitted'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {asg.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-purple-950">{asg.title}</h3>
                  <p className="text-xs text-slate-600 max-w-2xl">{asg.description}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div className="text-right text-xs">
                    {asg.pointsEarned !== undefined ? (
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {asg.pointsEarned} / {asg.pointsPossible} pts
                      </span>
                    ) : (
                      <span className="font-mono text-slate-500 text-xs">
                        {asg.pointsPossible} pts max
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(asg.id)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      asg.status === 'Submitted'
                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200'
                        : asg.status === 'Graded'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                        : 'bg-purple-800 hover:bg-purple-900 text-white shadow-xs'
                    }`}
                  >
                    {asg.status === 'Submitted'
                      ? 'Mark Incomplete'
                      : asg.status === 'Graded'
                      ? 'Graded & Closed'
                      : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Campus Bulletin */}
      {activeTab === 'bulletin' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-purple-100">
            <h2 className="text-xl font-bold font-serif text-purple-950">
              Excellence Academy Campus Bulletin
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official communiqués from the Office of the Headmaster & Faculty
            </p>
          </div>

          <div className="space-y-4">
            {ANNOUNCEMENTS.map((anc) => (
              <div
                key={anc.id}
                className="p-5 rounded-xl border border-purple-100 bg-purple-50/20 space-y-2 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-900">{anc.sender}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{anc.role}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{anc.date}</span>
                </div>

                <h3 className="font-bold text-base text-purple-950 font-serif">{anc.title}</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{anc.content}</p>

                <div className="pt-2 flex items-center gap-2 text-[11px] text-purple-700 font-medium">
                  <span className="bg-purple-100/80 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold">
                    {anc.category}
                  </span>
                  {anc.priority === 'urgent' && (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">
                      Urgent Action
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

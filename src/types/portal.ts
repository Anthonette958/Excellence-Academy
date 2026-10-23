export type UserRole = 'student' | 'faculty' | 'parent' | 'admin';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Fictional account password for password verification
  fullName: string;
  email: string;
  role: UserRole;
  studentOrStaffId: string;
  titleOrGrade: string;
  department?: string;
  wardName?: string;
  wardGrade?: string;
  phone?: string;
  avatarSeed: string;
  bio?: string;
}

export interface LoginRecord {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string;
  username: string;
  status: 'Granted' | 'Denied';
  role?: UserRole | 'Unrecognized';
  failureReason?: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

export interface CourseGrade {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  credits: number;
  period: string;
  room: string;
  percentage: number;
  letterGrade: string;
  assignmentsCompleted: number;
  totalAssignments: number;
  recentFeedback: string;
}

export interface ScheduleItem {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  timeRange: string;
  subject: string;
  room: string;
  instructor: string;
  category: 'STEM' | 'Humanities' | 'Arts' | 'Athletics' | 'Advisory';
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'Submitted' | 'Pending' | 'Graded' | 'Late';
  pointsPossible: number;
  pointsEarned?: number;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  sender: string;
  role: string;
  date: string;
  category: 'Academic' | 'Campus Life' | 'Administrative' | 'Events';
  priority: 'normal' | 'important' | 'urgent';
  content: string;
}

export interface AttendanceSummary {
  overallRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  tardyDays: number;
  excusedDays: number;
}

export interface TuitionInvoice {
  id: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: 'Paid in Full' | 'Partial' | 'Pending';
  items: { description: string; amount: number }[];
}

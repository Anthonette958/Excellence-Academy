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
  authFactor?: 'Password' | 'Two-Factor (OTP)' | 'Two-Factor (SMS OTP)' | 'Two-Factor (Email OTP)';
  otpStatus?: 'VERIFIED' | 'INVALID_OTP' | 'EXPIRED_OTP' | 'NOT_REACHED';
}

export interface OtpSession {
  sessionId: string;
  username: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  account: UserAccount;
  attempts: number;
  channel?: 'sms' | 'email';
  deliveryAddress?: string;
}

export interface EmailDispatchLog {
  id: string;
  recipient: string;
  subject: string;
  message: string;
  code: string;
  timestamp: string;
  status: 'Delivered' | 'Pending';
}

export interface OtpVerificationResult {
  success: boolean;
  reason?: 'INVALID_OTP' | 'EXPIRED_OTP' | 'EMPTY_OTP';
  error?: string;
  account?: UserAccount;
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
  assignedBy?: string;
  assignedDate?: string;
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

export interface FeeReceipt {
  id: string;
  transactionRef: string;
  invoiceId: string;
  term: string;
  amountPaid: number;
  date: string;
  paymentMethod: string;
  payerName: string;
  remainingBalance: number;
  status: 'Confirmed' | 'Settled';
}

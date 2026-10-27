import { UserAccount, LoginRecord, CourseGrade, UserRole, TuitionInvoice, FeeReceipt } from '../types/portal';

export interface VerificationResult {
  success: boolean;
  account?: UserAccount;
  error?: string;
  reason?: 'Incorrect password' | 'Unrecognized username' | 'Missing credentials';
}

/**
 * Verifies username and password against stored fictional account credentials.
 * Implements password-only authentication check against stored academy records.
 */
export function verifyCredentials(
  usernameInput: string,
  passwordInput: string,
  accounts: UserAccount[]
): VerificationResult {
  const trimmedUser = (usernameInput || '').trim();
  const rawPass = passwordInput || '';

  if (!trimmedUser) {
    return {
      success: false,
      error: 'Please enter your academy username or ID.',
      reason: 'Missing credentials',
    };
  }

  if (!rawPass) {
    return {
      success: false,
      error: 'Please enter your password to authenticate.',
      reason: 'Missing credentials',
    };
  }

  // Find account by case-insensitive username match or admin alias
  const matchedAccount = accounts.find((acc) => {
    const accUser = acc.username.toLowerCase();
    const query = trimmedUser.toLowerCase();
    if (accUser === query) return true;
    if (acc.role === 'admin' && query === 'admin') return true;
    return false;
  });

  if (!matchedAccount) {
    return {
      success: false,
      error: 'Access denied: Unrecognized username. Please verify your credentials with the Excellence Academy registrar.',
      reason: 'Unrecognized username',
    };
  }

  // Exact password check against stored account credentials
  if (matchedAccount.password !== rawPass) {
    const isTargetAdmin = matchedAccount.role === 'admin';
    return {
      success: false,
      account: matchedAccount,
      error: isTargetAdmin
        ? 'Access denied: Administrative authentication failed. Valid administrator password is required. Unauthorized attempts are logged.'
        : 'Access denied: Incorrect password. Access is restricted to authorized personnel with valid credentials. Please try again.',
      reason: 'Incorrect password',
    };
  }

  return {
    success: true,
    account: matchedAccount,
  };
}

/**
 * Creates a structured login record when access is granted or denied
 */
export function createLoginRecord(
  username: string,
  status: 'Granted' | 'Denied',
  options?: {
    account?: UserAccount;
    failureReason?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): LoginRecord {
  const now = new Date();
  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const defaultUserAgent =
    typeof navigator !== 'undefined'
      ? navigator.userAgent.includes('Mac')
        ? 'macOS · Chrome 134'
        : navigator.userAgent.includes('Windows')
        ? 'Windows 11 · Chrome 134'
        : 'Linux x86_64 · Browser'
      : 'Workstation · Web Client';

  return {
    id,
    timestamp: now.toISOString(),
    formattedDate,
    username: username.trim() || 'anonymous',
    status,
    role: options?.account ? options.account.role : (status === 'Denied' ? 'Unrecognized' : undefined),
    failureReason: options?.failureReason,
    ipAddress: options?.ipAddress || '192.168.10.42',
    deviceInfo: options?.userAgent || defaultUserAgent,
    location: 'Campus Network · West Hall Gateway',
  };
}

/**
 * Calculates cumulative unweighted / weighted GPA from course grade objects
 */
export function calculateGPA(grades: CourseGrade[]): number {
  if (!grades || grades.length === 0) return 4.0;

  const letterScale: Record<string, number> = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0,
  };

  let totalPoints = 0;
  let totalCredits = 0;

  for (const grade of grades) {
    const credits = grade.credits || 1;
    const baseGpa = letterScale[grade.letterGrade] ?? 3.5;
    totalPoints += baseGpa * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return 4.0;
  return Number((totalPoints / totalCredits).toFixed(2));
}

/**
 * Checks if a username is already taken (case-insensitive)
 */
export function isUsernameTaken(username: string, accounts: UserAccount[]): boolean {
  const normalized = username.trim().toLowerCase();
  return accounts.some((acc) => acc.username.toLowerCase() === normalized);
}

/**
 * Parameters for creating an account with any role
 */
export interface CreateAccountParams {
  role: UserRole;
  fullName: string;
  username: string;
  password: string;
  studentOrStaffId: string;
  titleOrGrade: string;
  email: string;
  department?: string;
  wardName?: string;
  wardGrade?: string;
  phone?: string;
}

/**
 * Creates and formats an account for any role: Student, Faculty, Parent, or Admin.
 */
export function createAccount(params: CreateAccountParams): UserAccount {
  const cleanUsername = params.username.trim().toLowerCase();
  let bio = '';
  if (params.role === 'student') {
    bio = `Enrolled student in ${params.titleOrGrade.trim()}. Account provisioned by Office of the Registrar.`;
  } else if (params.role === 'faculty') {
    bio = `${params.titleOrGrade.trim()} · ${params.department?.trim() || 'Academic Department'}. Official faculty member.`;
  } else if (params.role === 'parent') {
    bio = `Authorized parent/guardian of ${params.wardName?.trim() || 'Student'} (${params.wardGrade?.trim() || 'Excellence Academy'}).`;
  } else {
    bio = `Administrator · Excellence Academy Executive Console.`;
  }

  return {
    id: `acc_${params.role}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    password: params.password,
    fullName: params.fullName.trim(),
    email: params.email.trim(),
    role: params.role,
    studentOrStaffId: params.studentOrStaffId.trim(),
    titleOrGrade: params.titleOrGrade.trim(),
    department:
      params.department?.trim() ||
      (params.role === 'student'
        ? 'Upper School Academic Division'
        : params.role === 'faculty'
        ? 'Department of Academic Studies'
        : undefined),
    wardName: params.wardName?.trim(),
    wardGrade: params.wardGrade?.trim(),
    phone: params.phone?.trim(),
    avatarSeed: cleanUsername,
    bio,
  };
}

/**
 * Creates and formats a new student account (backward compatible alias)
 */
export function createStudentAccount(params: {
  fullName: string;
  username: string;
  password: string;
  studentId: string;
  grade: string;
  email: string;
  department?: string;
}): UserAccount {
  return createAccount({
    role: 'student',
    fullName: params.fullName,
    username: params.username,
    password: params.password,
    studentOrStaffId: params.studentId,
    titleOrGrade: params.grade,
    email: params.email,
    department: params.department,
  });
}

/**
 * Processes a tuition / school fee payment, updating balance and generating a verifiable receipt
 */
export function processFeePayment(
  invoice: TuitionInvoice,
  amount: number,
  params: {
    paymentMethod: string;
    payerName: string;
  }
): { updatedInvoice: TuitionInvoice; receipt: FeeReceipt } {
  const validAmount = Math.max(0, Math.min(amount, invoice.dueAmount));
  const newPaidAmount = invoice.paidAmount + validAmount;
  const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount);
  const newStatus: TuitionInvoice['status'] = newDueAmount === 0 ? 'Paid in Full' : 'Partial';

  const updatedInvoice: TuitionInvoice = {
    ...invoice,
    paidAmount: newPaidAmount,
    dueAmount: newDueAmount,
    status: newStatus,
  };

  const receipt: FeeReceipt = {
    id: `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transactionRef: `EA-PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceId: invoice.id,
    term: invoice.term,
    amountPaid: validAmount,
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date()),
    paymentMethod: params.paymentMethod,
    payerName: params.payerName,
    remainingBalance: newDueAmount,
    status: 'Confirmed',
  };

  return { updatedInvoice, receipt };
}

/**
 * Filters audit logs by search keyword and status
 */
export function filterAuditLogs(
  logs: LoginRecord[],
  query: string,
  statusFilter: 'all' | 'Granted' | 'Denied'
): LoginRecord[] {
  return logs.filter((log) => {
    const matchesStatus =
      statusFilter === 'all' ? true : log.status === statusFilter;
    if (!matchesStatus) return false;

    if (!query.trim()) return true;

    const q = query.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(q)) ||
      log.formattedDate.toLowerCase().includes(q) ||
      (log.role && log.role.toLowerCase().includes(q)) ||
      log.ipAddress.toLowerCase().includes(q)
    );
  });
}


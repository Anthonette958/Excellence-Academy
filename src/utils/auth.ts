import {
  UserAccount,
  LoginRecord,
  CourseGrade,
  UserRole,
  TuitionInvoice,
  FeeReceipt,
  OtpSession,
  OtpVerificationResult,
  EmailDispatchLog,
} from '../types/portal';

export interface VerificationResult {
  success: boolean;
  account?: UserAccount;
  error?: string;
  reason?: 'Incorrect password' | 'Unrecognized username' | 'Missing credentials';
}

/**
 * Verifies username and password against stored fictional account credentials.
 * Implements password authentication check as Factor 1.
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
 * Generates a random 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates an active OTP session for a user whose password was verified.
 * Standard validity duration is 90 seconds (configurable).
 */
export function createOtpSession(
  account: UserAccount,
  options?: {
    customCode?: string;
    validitySeconds?: number;
    channel?: 'sms' | 'email';
    deliveryAddress?: string;
  }
): OtpSession {
  const code = options?.customCode || generateOtpCode();
  const validitySeconds = options?.validitySeconds ?? 90;
  const now = Date.now();
  const channel = options?.channel || 'email';
  const deliveryAddress =
    options?.deliveryAddress ||
    (channel === 'sms'
      ? account.phone || PRIMARY_REGISTERED_PHONE
      : account.email || PRIMARY_REGISTERED_EMAIL);

  return {
    sessionId: `otp_${now}_${Math.random().toString(36).substring(2, 7)}`,
    username: account.username,
    code,
    createdAt: now,
    expiresAt: now + validitySeconds * 1000,
    account,
    attempts: 0,
    channel,
    deliveryAddress,
  };
}

/**
 * Requests and generates a new OTP session for the user, replacing previous expired/invalid code.
 */
export function requestNewOtp(
  previousSession: OtpSession,
  options?: {
    customCode?: string;
    validitySeconds?: number;
    channel?: 'sms' | 'email';
    deliveryAddress?: string;
  }
): OtpSession {
  return createOtpSession(previousSession.account, {
    channel: options?.channel || previousSession.channel,
    deliveryAddress: options?.deliveryAddress || previousSession.deliveryAddress,
    ...options,
  });
}

/**
 * Verifies a user-entered OTP against the active OTP session.
 * Checks for empty input, expiration, and code correctness.
 */
export function verifyOtp(
  session: OtpSession | null | undefined,
  inputOtp: string,
  currentTimeMs?: number
): OtpVerificationResult {
  if (!session) {
    return {
      success: false,
      reason: 'EMPTY_OTP',
      error: 'Access denied: No active OTP verification session found. Please enter your credentials first.',
    };
  }

  const cleanedInput = (inputOtp || '').replace(/[\s-]/g, '').trim();

  if (!cleanedInput) {
    return {
      success: false,
      reason: 'EMPTY_OTP',
      error: 'Please enter the 6-digit One-Time Password sent to your authorized device.',
    };
  }

  const now = currentTimeMs ?? Date.now();

  // Check if OTP has expired
  if (now > session.expiresAt) {
    return {
      success: false,
      reason: 'EXPIRED_OTP',
      error: 'Access denied: One-Time Password has expired. Verification codes are time-limited. Please request a new OTP to try again.',
      account: session.account,
    };
  }

  // Check code match
  if (cleanedInput !== session.code) {
    return {
      success: false,
      reason: 'INVALID_OTP',
      error: 'Access denied: Invalid One-Time Password entered. Please re-enter the code or request a new OTP.',
      account: session.account,
    };
  }

  return {
    success: true,
    account: session.account,
  };
}

export const PRIMARY_REGISTERED_PHONE = '+2348161759263';
export const PRIMARY_REGISTERED_EMAIL = 'olivia.chen@excellence.edu';

/**
 * Masks a telephone number for secure display on the login page
 * e.g., '+2348161759263' -> '+234 816 ••• 9263'
 */
export function maskPhoneNumber(phone?: string): string {
  const target = (phone || PRIMARY_REGISTERED_PHONE).trim();
  const digits = target.replace(/[^\d+]/g, '');
  if (digits.startsWith('+234') && digits.length >= 13) {
    const country = digits.slice(0, 4); // +234
    const prefix = digits.slice(4, 7); // 816
    const last = digits.slice(-4); // 9263
    return `${country} ${prefix} ••• ${last}`;
  }
  if (digits.length >= 10) {
    const start = digits.slice(0, 4);
    const end = digits.slice(-4);
    return `${start} ••• ${end}`;
  }
  return '+234 816 ••• 9263';
}

/**
 * Masks an email address for secure display on the login page
 * e.g., 'olivia.chen@excellence.edu' -> 'o•••••••••n@excellence.edu'
 * e.g., 'm.vance@excellence.edu' -> 'm•••••e@excellence.edu'
 */
export function maskEmailAddress(email?: string): string {
  const target = (email || PRIMARY_REGISTERED_EMAIL).trim();
  const atIndex = target.indexOf('@');
  if (atIndex === -1) {
    return '••••••••@excellence.edu';
  }

  const localPart = target.slice(0, atIndex);
  const domain = target.slice(atIndex);

  if (localPart.length <= 1) {
    return `${localPart}••${domain}`;
  }
  if (localPart.length === 2) {
    return `${localPart[0]}•${localPart[1]}${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const bulletCount = Math.min(Math.max(localPart.length - 2, 3), 9);
  const maskedLocal = `${firstChar}${'•'.repeat(bulletCount)}${lastChar}`;

  return `${maskedLocal}${domain}`;
}

/**
 * Secure recipient display for 2FA challenge showing registered phone number
 */
export function getMaskedRecipient(account?: UserAccount): string {
  const phone = account?.phone || PRIMARY_REGISTERED_PHONE;
  return maskPhoneNumber(phone);
}

/**
 * Secure recipient display for 2FA challenge showing registered email address
 */
export function getMaskedEmail(account?: UserAccount): string {
  const email = account?.email || PRIMARY_REGISTERED_EMAIL;
  return maskEmailAddress(email);
}

export interface SmsDispatchLog {
  id: string;
  recipient: string;
  message: string;
  timestamp: string;
  code: string;
  status: 'Delivered' | 'Pending';
}

/**
 * Dispatches the OTP to the registered phone number (+2348161759263).
 * Securely logs to dev console and memory dispatch store.
 */
export function dispatchOtpSms(
  recipientPhone: string,
  otpCode: string,
  userName: string
): SmsDispatchLog {
  const targetPhone = recipientPhone || PRIMARY_REGISTERED_PHONE;
  const message = `Excellence Academy Security: Hello ${userName}, your 2FA verification code is ${otpCode}. Valid for 90 seconds. Do not disclose this code.`;

  if (typeof console !== 'undefined') {
    console.log(
      `%c[SMS Gateway Dispatch → ${targetPhone}]`,
      'color: #9333ea; font-weight: bold; background: #f5f3ff; border: 1px solid #c084fc; padding: 4px 8px; border-radius: 4px;',
      message
    );
  }

  // Trigger outbound carrier dispatch via full-stack API route
  if (typeof fetch !== 'undefined') {
    fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        code: otpCode,
        fullName: userName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof console !== 'undefined') {
          console.log('[Cellular Equipment Gateway Response]', data);
        }
      })
      .catch(() => {
        // network fallback
      });
  }

  const log: SmsDispatchLog = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipient: targetPhone,
    message,
    timestamp: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date()),
    code: otpCode,
    status: 'Delivered',
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ea_last_sms_dispatch', JSON.stringify(log));
    }
  } catch {}

  return log;
}

/**
 * Dispatches the OTP to the registered academic email address.
 * Securely logs to dev console, server endpoint, and memory dispatch store.
 */
export function dispatchOtpEmail(
  recipientEmail: string,
  otpCode: string,
  userName: string
): EmailDispatchLog {
  const targetEmail = recipientEmail || PRIMARY_REGISTERED_EMAIL;
  const subject = 'Excellence Academy Security: 2FA One-Time Password';
  const message = `Excellence Academy Security: Hello ${userName}, your 2FA verification code is ${otpCode}. Valid for 90 seconds. Do not disclose this code.`;

  if (typeof console !== 'undefined') {
    console.log(
      `%c[Email Gateway Dispatch → ${targetEmail}]`,
      'color: #0284c7; font-weight: bold; background: #f0f9ff; border: 1px solid #7dd3fc; padding: 4px 8px; border-radius: 4px;',
      `Subject: ${subject} | Code: ${otpCode}`
    );
  }

  // Trigger outbound email dispatch via full-stack API route
  if (typeof fetch !== 'undefined') {
    fetch('/api/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        code: otpCode,
        fullName: userName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof console !== 'undefined') {
          console.log('[Email Gateway Response]', data);
        }
      })
      .catch(() => {
        // network fallback
      });
  }

  const log: EmailDispatchLog = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipient: targetEmail,
    subject,
    message,
    timestamp: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date()),
    code: otpCode,
    status: 'Delivered',
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ea_last_email_dispatch', JSON.stringify(log));
    }
  } catch {}

  return log;
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
    authFactor?: 'Password' | 'Two-Factor (OTP)' | 'Two-Factor (SMS OTP)' | 'Two-Factor (Email OTP)';
    otpStatus?: 'VERIFIED' | 'INVALID_OTP' | 'EXPIRED_OTP' | 'NOT_REACHED';
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
    authFactor: options?.authFactor || (status === 'Granted' ? 'Two-Factor (OTP)' : 'Password'),
    otpStatus: options?.otpStatus,
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


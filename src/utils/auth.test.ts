import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyCredentials,
  createLoginRecord,
  calculateGPA,
  filterAuditLogs,
  createStudentAccount,
  createAccount,
  processFeePayment,
  isUsernameTaken,
  createOtpSession,
  verifyOtp,
  requestNewOtp,
  generateOtpCode,
  maskPhoneNumber,
  PRIMARY_REGISTERED_PHONE,
  dispatchOtpSms,
  getMaskedRecipient,
  maskEmailAddress,
  PRIMARY_REGISTERED_EMAIL,
  getMaskedEmail,
  dispatchOtpEmail,
} from './auth';
import { UserAccount, CourseGrade, TuitionInvoice } from '../types/portal';

const mockAccounts: UserAccount[] = [
  {
    id: 'usr_1',
    username: 'olivia.chen',
    password: 'Excellence2026!',
    fullName: 'Olivia Chen',
    email: 'olivia.chen@excellence.edu',
    role: 'student',
    studentOrStaffId: 'EA-2026-8812',
    titleOrGrade: 'Grade 12 · STEM Honors',
    avatarSeed: 'olivia',
  },
  {
    id: 'usr_2',
    username: 'marcus.vance',
    password: 'TeacherPass2026!',
    fullName: 'Dr. Marcus Vance',
    email: 'm.vance@excellence.edu',
    role: 'faculty',
    studentOrStaffId: 'FAC-0419',
    titleOrGrade: 'Department Chair · Physics & Robotics',
    avatarSeed: 'marcus',
  },
];

test('verifyCredentials: grants access when username and password match stored account', () => {
  const result = verifyCredentials('olivia.chen', 'Excellence2026!', mockAccounts);
  assert.equal(result.success, true);
  assert.equal(result.account?.fullName, 'Olivia Chen');
  assert.equal(result.account?.role, 'student');
  assert.equal(result.error, undefined);
});

test('verifyCredentials: is case-insensitive for username but exact for password', () => {
  const result = verifyCredentials('OLIVIA.CHEN', 'Excellence2026!', mockAccounts);
  assert.equal(result.success, true);
  assert.equal(result.account?.username, 'olivia.chen');
});

test('verifyCredentials: denies access with incorrect password and returns helpful error', () => {
  const result = verifyCredentials('olivia.chen', 'WrongPassword!', mockAccounts);
  assert.equal(result.success, false);
  assert.equal(result.reason, 'Incorrect password');
  assert.match(result.error || '', /Access denied: Incorrect password/);
});

test('verifyCredentials: denies access with unknown username', () => {
  const result = verifyCredentials('stranger.danger', 'AnyPass123', mockAccounts);
  assert.equal(result.success, false);
  assert.equal(result.reason, 'Unrecognized username');
  assert.match(result.error || '', /Unrecognized username/);
});

test('verifyCredentials: strictly blocks admin access with wrong password and logs security message', () => {
  const adminAccount = {
    id: 'adm_1',
    username: 'admin.clara',
    password: 'AdminAcademy2026!',
    fullName: 'Clara Oswald',
    email: 'admin@excellence.edu',
    role: 'admin' as const,
    studentOrStaffId: 'ADM-0012',
    titleOrGrade: 'Registrar',
    avatarSeed: 'clara',
  };

  // Stranger tries to guess admin password
  const failedResult = verifyCredentials('admin.clara', 'randomGuess123', [
    ...mockAccounts,
    adminAccount,
  ]);
  assert.equal(failedResult.success, false);
  assert.equal(failedResult.reason, 'Incorrect password');
  assert.match(failedResult.error || '', /Administrative authentication failed/);

  // Stranger tries alias 'admin' with wrong password
  const failedAlias = verifyCredentials('admin', '123456', [
    ...mockAccounts,
    adminAccount,
  ]);
  assert.equal(failedAlias.success, false);
  assert.match(failedAlias.error || '', /Administrative authentication failed/);

  // Real admin enters correct password
  const successResult = verifyCredentials('admin.clara', 'AdminAcademy2026!', [
    ...mockAccounts,
    adminAccount,
  ]);
  assert.equal(successResult.success, true);
  assert.equal(successResult.account?.role, 'admin');
});

test('verifyCredentials: validates empty inputs', () => {
  const noUser = verifyCredentials('', 'Excellence2026!', mockAccounts);
  assert.equal(noUser.success, false);
  assert.equal(noUser.reason, 'Missing credentials');

  const noPass = verifyCredentials('olivia.chen', '', mockAccounts);
  assert.equal(noPass.success, false);
  assert.equal(noPass.reason, 'Missing credentials');
});

test('createLoginRecord: records successful login attempt with timestamp and Granted status', () => {
  const account = mockAccounts[0];
  const record = createLoginRecord(account.username, 'Granted', {
    account,
    ipAddress: '10.0.4.15',
  });

  assert.equal(record.status, 'Granted');
  assert.equal(record.username, 'olivia.chen');
  assert.equal(record.role, 'student');
  assert.equal(record.ipAddress, '10.0.4.15');
  assert.ok(record.timestamp);
  assert.ok(record.formattedDate);
});

test('createLoginRecord: records denied login attempt with failure reason', () => {
  const record = createLoginRecord('olivia.chen', 'Denied', {
    failureReason: 'Incorrect password entered',
    ipAddress: '192.168.1.55',
  });

  assert.equal(record.status, 'Denied');
  assert.equal(record.username, 'olivia.chen');
  assert.equal(record.failureReason, 'Incorrect password entered');
});

test('calculateGPA: computes weighted grade point average accurately', () => {
  const grades: CourseGrade[] = [
    {
      id: 'c1',
      courseCode: 'AP-PHYS',
      courseName: 'AP Physics C',
      instructor: 'Dr. Vance',
      credits: 4,
      period: 'P1',
      room: 'Sci-301',
      percentage: 97,
      letterGrade: 'A+',
      assignmentsCompleted: 14,
      totalAssignments: 15,
      recentFeedback: 'Exemplary work',
    },
    {
      id: 'c2',
      courseCode: 'MATH-CALC',
      courseName: 'Multivariable Calculus',
      instructor: 'Prof. Diaz',
      credits: 4,
      period: 'P3',
      room: 'Math-204',
      percentage: 92,
      letterGrade: 'A-',
      assignmentsCompleted: 18,
      totalAssignments: 18,
      recentFeedback: 'Solid integration proofs',
    },
  ];

  // A+ (4.0 * 4) + A- (3.7 * 4) = 16.0 + 14.8 = 30.8 / 8 = 3.85
  const gpa = calculateGPA(grades);
  assert.equal(gpa, 3.85);
});

test('filterAuditLogs: filters by status and query', () => {
  const records = [
    createLoginRecord('olivia.chen', 'Granted'),
    createLoginRecord('olivia.chen', 'Denied', { failureReason: 'Wrong pass' }),
    createLoginRecord('marcus.vance', 'Granted'),
  ];

  const onlyDenied = filterAuditLogs(records, '', 'Denied');
  assert.equal(onlyDenied.length, 1);
  assert.equal(onlyDenied[0].status, 'Denied');

  const vanceLogs = filterAuditLogs(records, 'marcus', 'all');
  assert.equal(vanceLogs.length, 1);
  assert.equal(vanceLogs[0].username, 'marcus.vance');
});

test('createStudentAccount: creates a valid student account with all properties', () => {
  const newStudent = createStudentAccount({
    fullName: 'Lucas Vance',
    username: 'lucas.vance',
    password: 'LucasPass2026!',
    studentId: 'EA-2026-9042',
    grade: 'Grade 10 · Honors Science',
    email: 'lucas.vance@excellence.edu',
  });

  assert.equal(newStudent.fullName, 'Lucas Vance');
  assert.equal(newStudent.username, 'lucas.vance');
  assert.equal(newStudent.password, 'LucasPass2026!');
  assert.equal(newStudent.role, 'student');
  assert.equal(newStudent.studentOrStaffId, 'EA-2026-9042');

  // Verify the new account can authenticate successfully
  const authResult = verifyCredentials('lucas.vance', 'LucasPass2026!', [
    ...mockAccounts,
    newStudent,
  ]);
  assert.equal(authResult.success, true);
  assert.equal(authResult.account?.fullName, 'Lucas Vance');
});

test('isUsernameTaken: accurately identifies existing usernames', () => {
  assert.equal(isUsernameTaken('olivia.chen', mockAccounts), true);
  assert.equal(isUsernameTaken('OLIVIA.CHEN', mockAccounts), true);
  assert.equal(isUsernameTaken('brand.new.student', mockAccounts), false);
});

test('createAccount: creates valid faculty account and verifies password login', () => {
  const newFaculty = createAccount({
    role: 'faculty',
    fullName: 'Prof. Julian Croft',
    username: 'julian.croft',
    password: 'CroftFaculty2026!',
    studentOrStaffId: 'FAC-8831',
    titleOrGrade: 'Associate Professor of Mathematics',
    department: 'Department of Mathematical Sciences',
    email: 'j.croft@excellence.edu',
  });

  assert.equal(newFaculty.role, 'faculty');
  assert.equal(newFaculty.fullName, 'Prof. Julian Croft');
  assert.equal(newFaculty.studentOrStaffId, 'FAC-8831');
  assert.equal(newFaculty.department, 'Department of Mathematical Sciences');

  const authResult = verifyCredentials('julian.croft', 'CroftFaculty2026!', [
    ...mockAccounts,
    newFaculty,
  ]);
  assert.equal(authResult.success, true);
  assert.equal(authResult.account?.role, 'faculty');
});

test('createAccount: creates valid parent account linked to ward and verifies password login', () => {
  const newParent = createAccount({
    role: 'parent',
    fullName: 'Elena Sterling',
    username: 'elena.sterling',
    password: 'SterlingParent2026!',
    studentOrStaffId: 'PAR-4491',
    titleOrGrade: 'Parent / Legal Guardian',
    wardName: 'Liam Sterling',
    wardGrade: 'Grade 12 · Humanities',
    phone: '+1 (555) 928-1122',
    email: 'elena@sterlingfamily.org',
  });

  assert.equal(newParent.role, 'parent');
  assert.equal(newParent.wardName, 'Liam Sterling');
  assert.equal(newParent.wardGrade, 'Grade 12 · Humanities');

  const authResult = verifyCredentials('elena.sterling', 'SterlingParent2026!', [
    ...mockAccounts,
    newParent,
  ]);
  assert.equal(authResult.success, true);
  assert.equal(authResult.account?.role, 'parent');
});

test('processFeePayment: processes partial and full fee payments correctly', () => {
  const invoice: TuitionInvoice = {
    id: 'INV-2026-T1',
    term: 'Fall Term 2026',
    totalAmount: 4250,
    paidAmount: 0,
    dueAmount: 4250,
    dueDate: 'Nov 15, 2026',
    status: 'Pending',
    items: [{ description: 'Term 1 Tuition', amount: 4250 }],
  };

  // 1. Partial payment of $1,500
  const partial = processFeePayment(invoice, 1500, {
    paymentMethod: 'Credit Card (••4242)',
    payerName: 'Sarah Jenkins',
  });
  assert.equal(partial.updatedInvoice.paidAmount, 1500);
  assert.equal(partial.updatedInvoice.dueAmount, 2750);
  assert.equal(partial.updatedInvoice.status, 'Partial');
  assert.equal(partial.receipt.amountPaid, 1500);
  assert.equal(partial.receipt.remainingBalance, 2750);
  assert.ok(partial.receipt.transactionRef.startsWith('EA-PAY-2026-'));

  // 2. Full remaining balance payment
  const full = processFeePayment(partial.updatedInvoice, 2750, {
    paymentMethod: 'Bank ACH Transfer',
    payerName: 'Sarah Jenkins',
  });
  assert.equal(full.updatedInvoice.paidAmount, 4250);
  assert.equal(full.updatedInvoice.dueAmount, 0);
  assert.equal(full.updatedInvoice.status, 'Paid in Full');
  assert.equal(full.receipt.remainingBalance, 0);
});

test('generateOtpCode: creates a 6-digit numeric string', () => {
  const code = generateOtpCode();
  assert.equal(code.length, 6);
  assert.match(code, /^\d{6}$/);
});

test('createOtpSession: initializes session with valid expiration', () => {
  const user = mockAccounts[0];
  const now = Date.now();
  const session = createOtpSession(user, { validitySeconds: 90 });

  assert.equal(session.username, 'olivia.chen');
  assert.equal(session.account.id, user.id);
  assert.equal(session.code.length, 6);
  assert.ok(session.expiresAt >= now + 89000);
  assert.ok(session.expiresAt <= now + 91000);
});

test('verifyOtp: grants access when code is correct and not expired', () => {
  const user = mockAccounts[0];
  const session = createOtpSession(user, { customCode: '741258', validitySeconds: 60 });

  const result = verifyOtp(session, '741258', session.createdAt + 10000);
  assert.equal(result.success, true);
  assert.equal(result.account?.fullName, 'Olivia Chen');
  assert.equal(result.error, undefined);
});

test('verifyOtp: allows formatted codes with spaces or hyphens', () => {
  const user = mockAccounts[0];
  const session = createOtpSession(user, { customCode: '741258', validitySeconds: 60 });

  const withSpaces = verifyOtp(session, '741 258', session.createdAt + 5000);
  assert.equal(withSpaces.success, true);

  const withHyphen = verifyOtp(session, '741-258', session.createdAt + 5000);
  assert.equal(withHyphen.success, true);
});

test('verifyOtp: denies access with invalid OTP code', () => {
  const user = mockAccounts[0];
  const session = createOtpSession(user, { customCode: '741258', validitySeconds: 60 });

  const result = verifyOtp(session, '999999', session.createdAt + 5000);
  assert.equal(result.success, false);
  assert.equal(result.reason, 'INVALID_OTP');
  assert.match(result.error || '', /Access denied: Invalid One-Time Password/);
});

test('verifyOtp: denies access when OTP is expired and prompts for a new OTP', () => {
  const user = mockAccounts[0];
  const session = createOtpSession(user, { customCode: '741258', validitySeconds: 30 });

  // Test at timestamp after expiration
  const expiredTime = session.expiresAt + 1000;
  const result = verifyOtp(session, '741258', expiredTime);

  assert.equal(result.success, false);
  assert.equal(result.reason, 'EXPIRED_OTP');
  assert.match(result.error || '', /Access denied: One-Time Password has expired/);
});

test('requestNewOtp: generates a fresh OTP session with renewed validity', () => {
  const user = mockAccounts[0];
  const initialSession = createOtpSession(user, { customCode: '111111', validitySeconds: 30 });
  const freshSession = requestNewOtp(initialSession, { customCode: '222222', validitySeconds: 90 });

  assert.notEqual(freshSession.sessionId, initialSession.sessionId);
  assert.equal(freshSession.code, '222222');
  assert.equal(freshSession.account.id, user.id);
  assert.ok(freshSession.expiresAt > initialSession.expiresAt);

  // Verifying old code against new session fails
  const oldCodeCheck = verifyOtp(freshSession, '111111');
  assert.equal(oldCodeCheck.success, false);
  assert.equal(oldCodeCheck.reason, 'INVALID_OTP');

  // Verifying new code succeeds
  const newCodeCheck = verifyOtp(freshSession, '222222');
  assert.equal(newCodeCheck.success, true);
});

test('createLoginRecord: records 2FA OTP outcome accurately', () => {
  const user = mockAccounts[0];

  // 1. Success with 2FA
  const successRecord = createLoginRecord(user.username, 'Granted', {
    account: user,
    authFactor: 'Two-Factor (OTP)',
    otpStatus: 'VERIFIED',
  });
  assert.equal(successRecord.status, 'Granted');
  assert.equal(successRecord.authFactor, 'Two-Factor (OTP)');
  assert.equal(successRecord.otpStatus, 'VERIFIED');

  // 2. Denied due to invalid OTP
  const invalidOtpRecord = createLoginRecord(user.username, 'Denied', {
    account: user,
    failureReason: 'Access Denied: Invalid One-Time Password entered for 2FA',
    authFactor: 'Two-Factor (OTP)',
    otpStatus: 'INVALID_OTP',
  });
  assert.equal(invalidOtpRecord.status, 'Denied');
  assert.equal(invalidOtpRecord.otpStatus, 'INVALID_OTP');
  assert.match(invalidOtpRecord.failureReason || '', /Invalid One-Time Password/);

  // 3. Denied due to expired OTP
  const expiredOtpRecord = createLoginRecord(user.username, 'Denied', {
    account: user,
    failureReason: 'Access Denied: One-Time Password expired for 2FA session',
    authFactor: 'Two-Factor (OTP)',
    otpStatus: 'EXPIRED_OTP',
  });
  assert.equal(expiredOtpRecord.status, 'Denied');
  assert.equal(expiredOtpRecord.otpStatus, 'EXPIRED_OTP');
  assert.match(expiredOtpRecord.failureReason || '', /expired/);
});

test('PRIMARY_REGISTERED_PHONE: is configured to +2348161759263', () => {
  assert.equal(PRIMARY_REGISTERED_PHONE, '+2348161759263');
});

test('maskPhoneNumber: masks registered phone number accurately', () => {
  const masked = maskPhoneNumber('+2348161759263');
  assert.equal(masked, '+234 816 ••• 9263');
  // Ensures middle digits are masked and not completely revealed
  assert.ok(!masked.includes('175'));
});

test('getMaskedRecipient: returns masked phone by default or from user account', () => {
  const userWithoutPhone = { ...mockAccounts[0], phone: undefined };
  assert.equal(getMaskedRecipient(userWithoutPhone), '+234 816 ••• 9263');

  const userWithPhone = { ...mockAccounts[0], phone: '+2348161759263' };
  assert.equal(getMaskedRecipient(userWithPhone), '+234 816 ••• 9263');
});

test('dispatchOtpSms: dispatches SMS with secure message payload and 6-digit code', () => {
  const result = dispatchOtpSms('+2348161759263', '492810', 'Olivia Chen');
  assert.equal(result.recipient, '+2348161759263');
  assert.equal(result.code, '492810');
  assert.match(result.message, /492810/);
  assert.match(result.message, /Excellence Academy/);
  assert.equal(result.status, 'Delivered');
});

test('PRIMARY_REGISTERED_EMAIL: is configured to olivia.chen@excellence.edu', () => {
  assert.equal(PRIMARY_REGISTERED_EMAIL, 'olivia.chen@excellence.edu');
});

test('maskEmailAddress: securely masks email address without exposing username', () => {
  const masked1 = maskEmailAddress('olivia.chen@excellence.edu');
  assert.match(masked1, /^o•+n@excellence\.edu$/);
  // Ensures middle characters of name are hidden
  assert.ok(!masked1.includes('livia'));

  const masked2 = maskEmailAddress('omeakpotuanthonette@gmail.com');
  assert.match(masked2, /^o•+e@gmail\.com$/);
  assert.ok(!masked2.includes('anth'));

  const maskedShort = maskEmailAddress('ab@excellence.edu');
  assert.equal(maskedShort, 'a•b@excellence.edu');
});

test('getMaskedEmail: returns masked email from account or default', () => {
  const user = mockAccounts[0]; // olivia.chen@excellence.edu
  const masked = getMaskedEmail(user);
  assert.match(masked, /^o•+n@excellence\.edu$/);

  const fallback = getMaskedEmail();
  assert.match(fallback, /^o•+n@excellence\.edu$/);
});

test('dispatchOtpEmail: dispatches email with academic 2FA message, subject and 6-digit code', () => {
  const result = dispatchOtpEmail('olivia.chen@excellence.edu', '852963', 'Olivia Chen');
  assert.equal(result.recipient, 'olivia.chen@excellence.edu');
  assert.equal(result.code, '852963');
  assert.equal(result.subject, 'Excellence Academy Security: 2FA One-Time Password');
  assert.match(result.message, /852963/);
  assert.match(result.message, /Excellence Academy/);
  assert.equal(result.status, 'Delivered');
});

test('createOtpSession: initializes session with email channel and deliveryAddress', () => {
  const user = mockAccounts[0];
  const session = createOtpSession(user, {
    channel: 'email',
    deliveryAddress: 'olivia.chen@excellence.edu',
  });

  assert.equal(session.channel, 'email');
  assert.equal(session.deliveryAddress, 'olivia.chen@excellence.edu');
  assert.equal(session.code.length, 6);
});

test('createLoginRecord: records Email OTP 2FA factor accurately', () => {
  const user = mockAccounts[0];

  const emailGrantedRecord = createLoginRecord(user.username, 'Granted', {
    account: user,
    authFactor: 'Two-Factor (Email OTP)',
    otpStatus: 'VERIFIED',
  });
  assert.equal(emailGrantedRecord.status, 'Granted');
  assert.equal(emailGrantedRecord.authFactor, 'Two-Factor (Email OTP)');
  assert.equal(emailGrantedRecord.otpStatus, 'VERIFIED');

  const emailDeniedRecord = createLoginRecord(user.username, 'Denied', {
    account: user,
    failureReason: 'Access Denied: Invalid One-Time Password entered for 2FA (EMAIL)',
    authFactor: 'Two-Factor (Email OTP)',
    otpStatus: 'INVALID_OTP',
  });
  assert.equal(emailDeniedRecord.status, 'Denied');
  assert.equal(emailDeniedRecord.authFactor, 'Two-Factor (Email OTP)');
  assert.equal(emailDeniedRecord.otpStatus, 'INVALID_OTP');
});



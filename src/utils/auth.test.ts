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


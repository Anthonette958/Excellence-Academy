import React, { useState } from 'react';
import { UserAccount, TuitionInvoice, FeeReceipt, Assignment } from '../types/portal';
import {
  CreditCard,
  UserCheck,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Award,
  DollarSign,
  Receipt,
  Download,
  Printer,
  ShieldCheck,
  X,
  AlertCircle,
  Clock,
  BookOpen,
} from 'lucide-react';

interface ParentDashboardProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tuitionInvoice: TuitionInvoice;
  paymentReceipts: FeeReceipt[];
  onPayFees: (amount: number, method: string, payerName: string) => FeeReceipt;
  assignments?: Assignment[];
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  tuitionInvoice,
  paymentReceipts,
  onPayFees,
  assignments = [],
}) => {
  const [messageSent, setMessageSent] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');

  // Fee payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('1500');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach' | 'wallet'>('card');
  const [payerName, setPayerName] = useState(currentUser.fullName);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('382');
  const [billingZip, setBillingZip] = useState('94016');
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<FeeReceipt | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim()) return;
    setMessageSent(true);
    setAdvisorMessage('');
    setTimeout(() => setMessageSent(false), 4000);
  };

  const handleOpenPayment = () => {
    setLatestReceipt(null);
    setPaymentType('full');
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (tuitionInvoice.dueAmount <= 0) return;

    let amountToPay =
      paymentType === 'full'
        ? tuitionInvoice.dueAmount
        : Math.min(parseFloat(partialAmount) || 0, tuitionInvoice.dueAmount);

    if (amountToPay <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      let methodLabel = '';
      if (paymentMethod === 'card') {
        methodLabel = `Credit Card (Ending in ${cardNumber.slice(-4) || '8821'})`;
      } else if (paymentMethod === 'ach') {
        methodLabel = 'ACH Electronic Direct Debit (Checking ··4192)';
      } else {
        methodLabel = 'Apple Pay / Digital Wallet';
      }

      const receipt = onPayFees(amountToPay, methodLabel, payerName.trim() || currentUser.fullName);
      setIsProcessing(false);
      setLatestReceipt(receipt);
    }, 700);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Parent Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-purple-200">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                  Parent & Guardian Portal
                </span>
                <span className="text-purple-400">·</span>
                <span className="text-xs text-purple-200 bg-purple-700/60 px-2 py-0.5 rounded-full font-mono">
                  {currentUser.studentOrStaffId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {currentUser.fullName}
              </h1>
              <p className="text-purple-200/90 text-xs sm:text-sm mt-1">
                Guardian of <span className="font-semibold text-white">{currentUser.wardName || 'Maya Jenkins'}</span> ({currentUser.wardGrade || 'Grade 10 · Sophomore Honors'})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenPayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay School Fees</span>
            </button>
            <button
              onClick={() => setActiveTab('tuition')}
              className="px-4 py-2 bg-purple-700/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold border border-purple-400/30 transition-colors shadow-xs"
            >
              Fee Statement
            </button>
          </div>
        </div>

        {/* Ward Academic & Financial Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-700/60 text-white">
          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Ward Current GPA</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              3.91
            </span>
            <span className="text-[10px] text-purple-300/80">Honor Roll Standing</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Attendance Record</span>
            <span className="text-2xl font-bold font-serif tabular-nums text-white block mt-0.5">
              99.1%
            </span>
            <span className="text-[10px] text-purple-300/80">61 of 62 Days Present</span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Outstanding Balance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl font-bold font-serif tabular-nums block ${
                  tuitionInvoice.dueAmount > 0 ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                ${tuitionInvoice.dueAmount.toLocaleString()}.00
              </span>
            </div>
            <span className="text-[10px] text-purple-200/90">
              {tuitionInvoice.status === 'Paid in Full'
                ? 'All Fees Settled ✓'
                : `Due ${tuitionInvoice.dueDate}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-purple-300 font-medium block">Next PTA Conference</span>
            <span className="text-sm font-bold font-sans text-white block mt-1">
              Nov 12, 2026
            </span>
            <span className="text-[10px] text-purple-300/80">Room 105 · Ms. Holloway</span>
          </div>
        </div>
      </div>

      {/* Tuition & Financial Ledger: Option to Pay Fees */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-700" />
              <h2 className="text-xl font-bold font-serif text-purple-950">
                School Fees & Tuition Payment Portal
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice #{tuitionInvoice.id} · {tuitionInvoice.term} · Student: {currentUser.wardName || 'Maya Jenkins'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${
                tuitionInvoice.status === 'Paid in Full'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tuitionInvoice.status}
            </span>

            {tuitionInvoice.dueAmount > 0 ? (
              <button
                onClick={handleOpenPayment}
                className="px-4 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Pay Balance (${tuitionInvoice.dueAmount.toLocaleString()})</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Account Fully Paid
              </span>
            )}
          </div>
        </div>

        {/* Balance Card Banner */}
        <div
          className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            tuitionInvoice.dueAmount > 0
              ? 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-amber-50/40 border-purple-200'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              Current Term Billing Summary
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-bold text-purple-950 tabular-nums">
                ${tuitionInvoice.dueAmount.toLocaleString()}.00
              </span>
              <span className="text-xs text-slate-500">
                remaining of ${tuitionInvoice.totalAmount.toLocaleString()}.00 term total
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Due Date: <span className="font-semibold text-purple-900">{tuitionInvoice.dueDate}</span> · Electronic receipt issued immediately upon settlement.
            </p>
          </div>

          {tuitionInvoice.dueAmount > 0 && (
            <button
              onClick={handleOpenPayment}
              className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <CreditCard className="w-4 h-4" />
              <span>Make Secure Payment</span>
            </button>
          )}
        </div>

        {/* Itemized Line Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Itemized Academy Fees Breakdown
          </h3>
          {tuitionInvoice.items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-purple-50/30 border border-purple-100 flex items-center justify-between text-xs hover:bg-purple-50/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="font-semibold text-purple-950">{item.description}</span>
              </div>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                ${item.amount.toLocaleString()}.00
              </span>
            </div>
          ))}

          <div className="pt-3 border-t border-purple-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Assessed Term Fees</span>
              <span className="font-mono font-semibold tabular-nums">
                ${tuitionInvoice.totalAmount.toLocaleString()}.00
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-700">
              <span>Payments Credited to Date</span>
              <span className="font-mono font-semibold tabular-nums">
                - ${tuitionInvoice.paidAmount.toLocaleString()}.00
              </span>
            </div>
            <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-sm font-bold text-purple-950">
              <span>Net Outstanding Balance Due</span>
              <span
                className={`font-mono tabular-nums text-base ${
                  tuitionInvoice.dueAmount > 0 ? 'text-purple-950' : 'text-emerald-700'
                }`}
              >
                ${tuitionInvoice.dueAmount.toLocaleString()}.00
              </span>
            </div>
          </div>
        </div>

        {/* Payment History & Verifiable Receipts Ledger */}
        <div className="pt-6 border-t border-purple-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-serif text-purple-950 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-700" />
              <span>Payment & Receipt History ({paymentReceipts.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Official Registrar Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Transaction Reference</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Payer Name</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 font-mono">
                {paymentReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-purple-50/40 transition-colors font-sans">
                    <td className="py-3 px-3 text-slate-600 text-xs font-mono">{rec.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-800 text-xs">
                      {rec.transactionRef}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">{rec.paymentMethod}</td>
                    <td className="py-3 px-3 text-purple-950 font-medium text-xs">
                      {rec.payerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums text-xs">
                      ${rec.amountPaid.toLocaleString()}.00
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setLatestReceipt(rec);
                          setIsPayModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ward Academic Work & Active Coursework */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-700" />
            <h3 className="font-serif font-bold text-base text-purple-950">
              Ward Coursework & Assignments Progress
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {assignments.filter((a) => a.status === 'Submitted' || a.status === 'Graded').length} of{' '}
            {assignments.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.slice(0, 4).map((asg) => (
            <div
              key={asg.id}
              className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/20 flex items-start justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                  {asg.course}
                </span>
                <h4 className="text-xs font-bold text-purple-950 mt-1">{asg.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Due: {asg.dueDate}</p>
              </div>
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
          ))}
        </div>
      </div>

      {/* Direct Communication with Academic Advisor */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold font-serif text-purple-950 mb-1">
          Direct Note to Maya's Academic Advisor
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Messages are dispatched immediately to Dean Clara Oswald & Faculty Advisor Dr. Marcus Vance.
        </p>

        {messageSent && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Note securely dispatched to academic advisor. A response will be returned within 24 hours.</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            value={advisorMessage}
            onChange={(e) => setAdvisorMessage(e.target.value)}
            rows={3}
            placeholder="Type your question regarding academic schedule, tuition payments, or counseling..."
            required
            className="w-full p-3 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Advisor Inquiry</span>
          </button>
        </form>
      </div>

      {/* Pay Fees & Receipt Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-200 relative my-8">
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* If Receipt view */}
            {latestReceipt ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-purple-950">
                    Payment Confirmed
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your school fee transaction has been processed and credited to the registrar.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                    <span className="text-slate-500">Transaction Reference:</span>
                    <span className="font-mono font-bold text-purple-950 text-sm">
                      {latestReceipt.transactionRef}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date & Timestamp:</span>
                    <span className="font-medium text-slate-800">{latestReceipt.date}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Payer Name:</span>
                    <span className="font-semibold text-purple-950">{latestReceipt.payerName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="text-slate-700">{latestReceipt.paymentMethod}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Academic Term:</span>
                    <span className="text-slate-700">{latestReceipt.term}</span>
                  </div>

                  <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-sm">
                    <span className="font-bold text-purple-950">Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-700 text-base">
                      ${latestReceipt.amountPaid.toLocaleString()}.00
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Remaining Balance:</span>
                    <span className="font-mono font-semibold text-purple-900">
                      ${latestReceipt.remainingBalance.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPayModalOpen(false);
                      setLatestReceipt(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Form */
              <form onSubmit={handleSubmitPayment} className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold font-serif text-purple-950 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-700" />
                    <span>Pay Excellence Academy Fees</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized payment portal for {currentUser.wardName || 'Maya Jenkins'} ({currentUser.wardGrade || 'Grade 10'})
                  </p>
                </div>

                {/* Amount options */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Select Payment Amount
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentType('full')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentType === 'full'
                          ? 'bg-purple-100/70 border-purple-600 text-purple-950 font-semibold'
                          : 'bg-purple-50/20 border-purple-200 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">Full Remaining Balance</div>
                      <div className="text-base font-serif font-bold text-purple-900 mt-0.5">
                        ${tuitionInvoice.dueAmount.toLocaleString()}.00
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType('partial')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentType === 'partial'
                          ? 'bg-purple-100/70 border-purple-600 text-purple-950 font-semibold'
                          : 'bg-purple-50/20 border-purple-200 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">Custom Partial Payment</div>
                      <div className="text-base font-serif font-bold text-purple-900 mt-0.5">
                        Flexible Amount
                      </div>
                    </button>
                  </div>

                  {paymentType === 'partial' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Enter Partial Amount ($ USD)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max={tuitionInvoice.dueAmount}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Payment method selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'card', label: 'Credit Card' },
                      { id: 'ach', label: 'Bank ACH' },
                      { id: 'wallet', label: 'Apple Pay' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                          paymentMethod === m.id
                            ? 'bg-purple-800 text-white border-purple-800'
                            : 'bg-purple-50/30 border-purple-200 text-slate-700 hover:bg-purple-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Fields */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Payer Full Name
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {paymentMethod === 'card' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            value={billingZip}
                            onChange={(e) => setBillingZip(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'ach' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Bank Routing Transit Number (9 digits)
                        </label>
                        <input
                          type="text"
                          defaultValue="121000358"
                          required
                          className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Checking Account Number
                        </label>
                        <input
                          type="text"
                          defaultValue="982348194192"
                          required
                          className="w-full px-3 py-2 text-xs bg-purple-50/30 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
                      <span>Ready to authorize via Biometric Device Passkey / Apple Pay on completion.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-purple-800 hover:bg-purple-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span>Processing Settlement...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          Authorize Payment (
                          {paymentType === 'full'
                            ? `$${tuitionInvoice.dueAmount.toLocaleString()}.00`
                            : `$${(parseFloat(partialAmount) || 0).toLocaleString()}.00`}
                          )
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Encrypted via Excellence Academy TLS 1.3 Registrar Gateway
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

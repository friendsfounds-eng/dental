import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Wallet,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { exportToCsv } from '../../../utils/excelExport';
import { getGeneratedTime } from '../../../utils/timeFormat';

export default function IncomeBillingHub({
  patients = [],
  receipts = [],
  advanceDeposits = [],
  currency = 'Rs.',
  onOpenReceiptModal,
  onRecordIncome,
  onRecordDeposit,
  onApplyDeposit,
  onOpenWhatsApp
}) {
  const [subSection, setSubSection] = useState('invoices'); // 'invoices' | 'deposits' | 'receipts'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Collect Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('FonePay / QR');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [useAdvanceCredit, setUseAdvanceCredit] = useState(false);

  // Quick Direct Income Modal state
  const [directIncomeModalOpen, setDirectIncomeModalOpen] = useState(false);
  const [directIncomeForm, setDirectIncomeForm] = useState({
    patientName: '',
    category: 'Consultation & Registration OPD Fees',
    amount: '500',
    paymentMethod: 'Cash',
    notes: 'Doctor OPD consultation and digital X-ray evaluation'
  });

  // Advance Deposit Modal state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({
    patientId: patients[0]?.id || '',
    amount: '10000',
    paymentMethod: 'Bank Transfer',
    notes: 'Advance booking credit deposit'
  });

  // Apply Deposit Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedDepositToApply, setSelectedDepositToApply] = useState(null);
  const [targetInvoiceId, setTargetInvoiceId] = useState('');
  const [applyAmount, setApplyAmount] = useState('');

  // Flatten all invoices across patients
  const allInvoices = patients.flatMap(p =>
    (p.invoices || []).map(inv => ({
      ...inv,
      patientId: p.id,
      patientName: p.name,
      patientPhone: p.phone,
      patientCredit: p.advanceCreditBalance || 0
    }))
  );

  // Filter invoices
  let filteredInvoices = allInvoices.filter(inv => {
    const matchSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Filter receipts
  let filteredReceipts = receipts.filter(r => {
    return (
      r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.refNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter deposits
  let filteredDeposits = advanceDeposits.filter(d => {
    return (
      d.depositNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle opening payment modal for an invoice
  const handleOpenPaymentModal = (inv) => {
    setSelectedInvoiceForPay(inv);
    const balanceDue = Math.max(0, (inv.total || 0) - (inv.paid || 0));
    setPaymentAmount(String(balanceDue));
    setPaymentMethod('FonePay / QR');
    setPaymentNotes(`Settlement payment for invoice #${inv.invoiceNumber}`);
    setUseAdvanceCredit(false);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay || !paymentAmount || Number(paymentAmount) <= 0) return;

    await onRecordIncome({
      invoiceId: selectedInvoiceForPay.id || selectedInvoiceForPay.invoiceNumber,
      patientId: selectedInvoiceForPay.patientId,
      patientName: selectedInvoiceForPay.patientName,
      amount: Number(paymentAmount),
      paymentMethod: useAdvanceCredit ? 'Advance Deposit Credit' : paymentMethod,
      notes: paymentNotes,
      useAdvanceCredit
    });

    setPaymentModalOpen(false);
  };

  const handleOpenApplyDepositModal = (deposit) => {
    setSelectedDepositToApply(deposit);
    const patientInvs = allInvoices.filter(i => i.patientId === deposit.patientId && (i.balance || 0) > 0);
    const firstUnpaid = patientInvs[0];
    setTargetInvoiceId(firstUnpaid?.invoiceNumber || firstUnpaid?.id || '');
    const maxCanApply = Math.min(deposit.balanceRemaining, firstUnpaid ? (firstUnpaid.balance || firstUnpaid.total) : deposit.balanceRemaining);
    setApplyAmount(String(maxCanApply));
    setApplyModalOpen(true);
  };

  const handleSubmitApplyDeposit = async (e) => {
    e.preventDefault();
    if (!selectedDepositToApply || !targetInvoiceId || !applyAmount) return;

    await onApplyDeposit(selectedDepositToApply.id, targetInvoiceId, Number(applyAmount));
    setApplyModalOpen(false);
  };

  const handleExportReceiptsCsv = () => {
    const headers = ['Receipt No', 'Date', 'Patient Name', 'Amount', 'Payment Method', 'Payment Type', 'Ref Number', 'Issued By', 'Notes'];
    const rows = filteredReceipts.map(r => [
      r.receiptNumber,
      r.date,
      r.patientName,
      r.amount,
      r.paymentMethod,
      r.paymentType,
      r.refNumber,
      r.issuedBy,
      r.notes
    ]);
    exportToCsv(`ApexDental_Receipts_${Date.now()}`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-navigation & Header Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubSection('invoices')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              subSection === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient Invoices ({allInvoices.length})
          </button>
          <button
            onClick={() => setSubSection('deposits')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              subSection === 'deposits' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Advance Deposits & Wallets ({advanceDeposits.length})
          </button>
          <button
            onClick={() => setSubSection('receipts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              subSection === 'receipts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receipts Registry ({receipts.length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-xl transition"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>+ Advance Deposit</span>
          </button>

          <button
            onClick={() => setDirectIncomeModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Direct Income / OPD Fee</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PATIENT INVOICES */}
      {subSection === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by invoice # or patient name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial Balance</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Procedures / Items</th>
                  <th className="px-4 py-3 text-right">Billed Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Receipt #</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv, idx) => {
                  const balanceDue = Math.max(0, (inv.total || 0) - (inv.paid || 0));
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber || inv.id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium">{inv.date}</div>
                        <div className="text-[10px] text-blue-600 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{getGeneratedTime(inv)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{inv.patientName}</div>
                        {inv.patientCredit > 0 && (
                          <span className="text-[10px] text-blue-600 font-semibold">
                            Wallet: {currency} {inv.patientCredit.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-600">
                        {(inv.items || []).map(i => i.description).join(', ') || 'Dental Treatment'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {currency} {Number(inv.total || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">
                        {currency} {Number(inv.paid || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                        {balanceDue > 0 ? `${currency} ${balanceDue.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500">
                        {inv.receiptNumber ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            #{inv.receiptNumber}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition"
                            >
                              Collect Pay
                            </button>
                          )}
                          {inv.receiptNumber && (
                            <button
                              onClick={() => {
                                const matchedReceipt = receipts.find(r => r.receiptNumber === inv.receiptNumber) || {
                                  receiptNumber: inv.receiptNumber,
                                  patientName: inv.patientName,
                                  patientId: inv.patientId,
                                  date: inv.date,
                                  amount: inv.paid,
                                  paymentMethod: inv.paymentMethod,
                                  paymentType: 'INVOICE_PAYMENT',
                                  notes: `Payment for invoice ${inv.invoiceNumber}`
                                };
                                onOpenReceiptModal(matchedReceipt);
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-600 rounded-md transition"
                              title="View Official Receipt Voucher"
                            >
                              <Eye className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: ADVANCE DEPOSITS & WALLETS */}
      {subSection === 'deposits' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Patient Advance Deposit Credit Wallets</h3>
              <p className="text-xs text-slate-500">
                Holds unearned treatment deposits safely in trust until clinical procedures are executed.
              </p>
            </div>
            <button
              onClick={() => setDepositModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Deposit</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Deposit #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Original Deposit</th>
                  <th className="px-4 py-3 text-right">Remaining Balance</th>
                  <th className="px-4 py-3 text-center">Receipt #</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDeposits.map((dep, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {dep.depositNumber || dep.id}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(dep.date || dep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {dep.patientName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dep.paymentMethod || 'Bank Transfer'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                      {currency} {Number(dep.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {currency} {Number(dep.balanceRemaining || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500 text-[11px]">
                      #{dep.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {dep.balanceRemaining > 0 ? (
                        <button
                          onClick={() => handleOpenApplyDepositModal(dep)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] rounded-lg transition"
                        >
                          Apply to Invoice
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Fully Applied
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: OFFICIAL RECEIPTS REGISTRY */}
      {subSection === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Official Payment Receipts Registry</h3>
              <p className="text-xs text-slate-500">
                All auto-generated unique receipts with auditable numbers (RCP-2026-XXXXX).
              </p>
            </div>
            <button
              onClick={handleExportReceiptsCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export to Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Ref / Txn #</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3 text-center">Issued By</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                      #{r.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {r.patientName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {r.paymentType || 'INVOICE_PAYMENT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {r.refNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {currency} {Number(r.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-[11px]">
                      {r.issuedBy || 'Cashier'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onOpenReceiptModal(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] transition"
                      >
                        View Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: COLLECT PAYMENT */}
      {paymentModalOpen && selectedInvoiceForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Collect Treatment Payment & Issue Receipt
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice #{selectedInvoiceForPay.invoiceNumber} • Patient: {selectedInvoiceForPay.patientName}
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Patient Advance Credit Available Callout */}
              {selectedInvoiceForPay.patientCredit > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-900 block">Advance Credit Wallet</span>
                    <span className="text-blue-700 font-mono font-bold">
                      Available: {currency} {selectedInvoiceForPay.patientCredit.toLocaleString()}
                    </span>
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAdvanceCredit}
                      onChange={e => setUseAdvanceCredit(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900">Use Wallet</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {!useAdvanceCredit && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="FonePay / QR">FonePay QR (Nepal)</option>
                    <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
                    <option value="Bank Transfer">Bank Transfer (Nabil Bank)</option>
                    <option value="eSewa / Digital Wallet">eSewa Mobile Wallet</option>
                    <option value="Khalti Digital Wallet">Khalti Digital Wallet</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Remarks / Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Generate Official Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT INCOME / CONSULTATION FEE */}
      {directIncomeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Consultation OPD Fee / Other Income
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct counter collection with automatic receipt generation.
            </p>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await onRecordIncome({
                  patientName: directIncomeForm.patientName || 'Walk-in Consultation Patient',
                  category: directIncomeForm.category,
                  amount: Number(directIncomeForm.amount),
                  paymentMethod: directIncomeForm.paymentMethod,
                  notes: directIncomeForm.notes
                });
                setDirectIncomeModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient / Payer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={directIncomeForm.patientName}
                  onChange={e => setDirectIncomeForm({ ...directIncomeForm, patientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Income Category
                </label>
                <select
                  value={directIncomeForm.category}
                  onChange={e => setDirectIncomeForm({ ...directIncomeForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value="Consultation & Registration OPD Fees">Consultation & Registration OPD Fees</option>
                  <option value="Dental Treatment & Procedure Revenue">Dental Treatment & Procedure Revenue</option>
                  <option value="Pharmacy & Medication Sales">Pharmacy & Medication Sales</option>
                  <option value="Dental Lab Markup & Appliances">Dental Lab Markup & Appliances</option>
                  <option value="Other Clinic Income">Other Clinic Income (Medical Certificates / Records)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={directIncomeForm.amount}
                    onChange={e => setDirectIncomeForm({ ...directIncomeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={directIncomeForm.paymentMethod}
                    onChange={e => setDirectIncomeForm({ ...directIncomeForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Cash">Cash in Drawer</option>
                    <option value="FonePay / QR">FonePay QR</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={directIncomeForm.notes}
                  onChange={e => setDirectIncomeForm({ ...directIncomeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDirectIncomeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PATIENT ADVANCE DEPOSIT */}
      {depositModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Patient Advance Deposit
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Stored as advance credit in the patient's trust ledger.
            </p>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await onRecordDeposit({
                  patientId: depositForm.patientId,
                  amount: Number(depositForm.amount),
                  paymentMethod: depositForm.paymentMethod,
                  notes: depositForm.notes
                });
                setDepositModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  value={depositForm.patientId}
                  onChange={e => setDepositForm({ ...depositForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) - Current Credit: {currency} {(p.advanceCreditBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deposit Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={depositForm.amount}
                    onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={depositForm.paymentMethod}
                    onChange={e => setDepositForm({ ...depositForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer (Nabil)</option>
                    <option value="FonePay / QR">FonePay QR</option>
                    <option value="Cash">Cash in Drawer</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deposit Purpose / Notes
                </label>
                <input
                  type="text"
                  value={depositForm.notes}
                  onChange={e => setDepositForm({ ...depositForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Record Deposit & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: APPLY ADVANCE DEPOSIT TO INVOICE */}
      {applyModalOpen && selectedDepositToApply && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Apply Advance Deposit Credit to Invoice
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Deposit #{selectedDepositToApply.depositNumber} • Available: {currency} {selectedDepositToApply.balanceRemaining.toLocaleString()}
            </p>

            <form onSubmit={handleSubmitApplyDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Unpaid Treatment Invoice
                </label>
                <select
                  value={targetInvoiceId}
                  onChange={e => {
                    setTargetInvoiceId(e.target.value);
                    const inv = allInvoices.find(i => i.invoiceNumber === e.target.value || i.id === e.target.value);
                    if (inv) {
                      const balance = inv.balance || Math.max(0, inv.total - (inv.paid || 0));
                      setApplyAmount(String(Math.min(selectedDepositToApply.balanceRemaining, balance)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                >
                  {allInvoices
                    .filter(i => i.patientId === selectedDepositToApply.patientId && (i.balance || Math.max(0, i.total - (i.paid || 0))) > 0)
                    .map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber || inv.id}>
                        Inv #{inv.invoiceNumber} - Total: {currency} {inv.total} | Balance Due: {currency} {inv.balance || (inv.total - (inv.paid || 0))}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apply Amount ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedDepositToApply.balanceRemaining}
                  value={applyAmount}
                  onChange={e => setApplyAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Apply Credit & Post JE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Users,
  Search,
  Wallet,
  CreditCard,
  DollarSign,
  Receipt,
  RotateCcw,
  Plus,
  Printer,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { exportToCsv } from '../../../utils/excelExport';

export default function PatientAccountsHub({
  patients = [],
  creditNotes = [],
  receipts = [],
  advanceDeposits = [],
  currency = 'Rs.',
  onIssueCreditNote,
  onIssueRefund,
  onOpenReceiptModal,
  onOpenWhatsApp
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [patientSearch, setPatientSearch] = useState('');

  // Modals
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [creditNoteForm, setCreditNoteForm] = useState({
    invoiceId: '',
    amount: '',
    reason: 'Approved fee concession / waiver post-treatment'
  });

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    paymentMethod: 'FonePay / QR',
    reason: 'Advance deposit refund upon treatment completion'
  });

  // Selected Patient
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Calculate Patient Totals
  let totalBilled = 0;
  let totalPaid = 0;
  let totalDiscounts = 0;

  (selectedPatient?.invoices || []).forEach(inv => {
    totalBilled += (Number(inv.total) || 0) + (Number(inv.discount) || 0);
    totalDiscounts += (Number(inv.discount) || 0);
    totalPaid += (Number(inv.paid) || 0);
  });

  // Add credit notes to discounts
  const ptCreditNotes = creditNotes.filter(cn => cn.patientId === selectedPatient?.id);
  const totalCreditNotesAmount = ptCreditNotes.reduce((s, cn) => s + (Number(cn.amount) || 0), 0);
  const grandTotalDiscountsAndAdjustments = totalDiscounts + totalCreditNotesAmount;

  const outstandingBalance = Math.max(0, totalBilled - grandTotalDiscountsAndAdjustments - totalPaid);
  const advanceCreditBalance = selectedPatient?.advanceCreditBalance || 0;

  // Build Chronological Payment Ledger
  const ledgerEntries = [];

  // Invoices (Debit charges)
  (selectedPatient?.invoices || []).forEach(inv => {
    ledgerEntries.push({
      date: inv.date || '2026-10-01',
      refNumber: inv.invoiceNumber || inv.id,
      type: 'INVOICE',
      description: `Dental Treatment: ${(inv.items || []).map(i => i.description).join(', ') || 'Procedures'}`,
      debit: Number(inv.total) || 0,
      credit: 0
    });

    if (inv.paid > 0) {
      ledgerEntries.push({
        date: inv.date || '2026-10-01',
        refNumber: inv.receiptNumber || `RCP-${inv.invoiceNumber}`,
        type: 'PAYMENT',
        description: `Payment for Inv #${inv.invoiceNumber} (${inv.paymentMethod || 'Cash'})`,
        debit: 0,
        credit: Number(inv.paid)
      });
    }
  });

  // Advance Deposits (Credit balances)
  advanceDeposits
    .filter(d => d.patientId === selectedPatient?.id)
    .forEach(dep => {
      ledgerEntries.push({
        date: dep.date?.split('T')[0] || '2026-10-10',
        refNumber: dep.depositNumber || dep.id,
        type: 'ADVANCE_DEPOSIT',
        description: `Advance Deposit (${dep.paymentMethod}) - ${dep.notes || 'Wallet Credit'}`,
        debit: 0,
        credit: Number(dep.amount)
      });
    });

  // Credit Notes (Adjustments)
  ptCreditNotes.forEach(cn => {
    ledgerEntries.push({
      date: cn.date?.split('T')[0] || '2026-10-19',
      refNumber: cn.creditNoteNumber || cn.id,
      type: 'CREDIT_NOTE',
      description: `Approved Credit Adjustment: ${cn.reason}`,
      debit: 0,
      credit: Number(cn.amount)
    });
  });

  // Sort chronological
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate Running Balance
  let running = 0;
  const ledgerWithRunning = ledgerEntries.map(entry => {
    running += (entry.debit - entry.credit);
    return {
      ...entry,
      runningBalance: running
    };
  });

  const handleExportLedgerCsv = () => {
    if (!selectedPatient) return;
    const headers = ['Date', 'Reference / Doc #', 'Type', 'Description', 'Debit (+ Charges)', 'Credit (- Payments)', 'Running Balance'];
    const rows = ledgerWithRunning.map(l => [
      l.date,
      l.refNumber,
      l.type,
      l.description,
      l.debit,
      l.credit,
      l.runningBalance
    ]);
    exportToCsv(`ApexDental_Patient_Ledger_${selectedPatient.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`, headers, rows);
  };

  const handleShareWhatsApp = () => {
    if (!onOpenWhatsApp || !selectedPatient?.phone) {
      alert('Patient phone number is not available for WhatsApp sharing.');
      return;
    }
    const msg = `Dear *${selectedPatient.name}*,\n\nHere is your official *Patient Financial Statement* from *Nepal Dental & Healthcare Wellness Centre*:\n\n🦷 *Total Treatment Cost Billed:* ${currency} ${totalBilled.toLocaleString()}\n🎁 *Approved Discounts & Adjustments:* ${currency} ${grandTotalDiscountsAndAdjustments.toLocaleString()}\n✅ *Total Amount Paid:* ${currency} ${totalPaid.toLocaleString()}\n${outstandingBalance > 0 ? `⚠️ *Outstanding Balance Due:* ${currency} ${outstandingBalance.toLocaleString()}\n` : '🎉 *Outstanding Balance Due:* Nil (All settled)\n'}${advanceCreditBalance > 0 ? `💰 *Advance Credit Wallet:* ${currency} ${advanceCreditBalance.toLocaleString()}\n` : ''}\nFor queries or appointment bookings, call +977 1 4782910. Thank you!`;
    onOpenWhatsApp(selectedPatient.phone, msg);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Patient Selection & Quick Stats Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              Select Patient Account:
            </label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - Phone: {p.phone || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCreditNoteForm({
                invoiceId: selectedPatient?.invoices?.[0]?.invoiceNumber || '',
                amount: '',
                reason: 'Approved fee concession / waiver post-treatment'
              });
              setCreditNoteModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Issue Credit Note</span>
          </button>

          <button
            onClick={() => {
              setRefundForm({
                amount: String(advanceCreditBalance > 0 ? advanceCreditBalance : ''),
                paymentMethod: 'FonePay / QR',
                reason: 'Refund of unutilized credit deposit'
              });
              setRefundModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>+ Issue Refund</span>
          </button>

          {selectedPatient?.phone && (
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Ledger</span>
            </button>
          )}

          <button
            onClick={handleExportLedgerCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5-Key Patient Account Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Treatment Cost */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Treatment Cost
          </span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {currency} {totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Gross invoiced treatments</span>
        </div>

        {/* Discounts & Adjustments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Approved Adjustments
          </span>
          <div className="text-xl font-black text-amber-700 font-mono mt-1">
            {currency} {grandTotalDiscountsAndAdjustments.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Discounts & Credit Notes</span>
        </div>

        {/* Amount Paid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Amount Paid
          </span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">
            {currency} {totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Fully cleared collections</span>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Outstanding Balance
          </span>
          <div className="text-xl font-black text-rose-700 font-mono mt-1">
            {currency} {outstandingBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold">Current receivable due</span>
        </div>

        {/* Advance Credit Wallet */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Advance Credit Wallet
          </span>
          <div className="text-xl font-black text-blue-700 font-mono mt-1">
            {currency} {advanceCreditBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Stored patient deposit</span>
        </div>
      </div>

      {/* COMPLETE PATIENT PAYMENT LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Complete Patient Financial Ledger • {selectedPatient?.name}
            </h3>
            <p className="text-xs text-slate-500">
              Immutable, auditable chronological history of all invoices, payments, credit notes, and adjustments.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Audit Protected • No Transaction Erasing</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference / Doc #</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Financial Description</th>
                <th className="px-4 py-3 text-right">Debit (+ Charges)</th>
                <th className="px-4 py-3 text-right">Credit (- Paid/Adj)</th>
                <th className="px-4 py-3 text-right">Running Balance</th>
                <th className="px-4 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledgerWithRunning.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {entry.date}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {entry.refNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      entry.type === 'INVOICE' ? 'bg-amber-100 text-amber-800' :
                      entry.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-800' :
                      entry.type === 'ADVANCE_DEPOSIT' ? 'bg-blue-100 text-blue-800' :
                      entry.type === 'CREDIT_NOTE' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-sm">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {entry.debit > 0 ? `${currency} ${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {entry.credit > 0 ? `${currency} ${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                    {currency} {entry.runningBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(entry.type === 'PAYMENT' || entry.type === 'ADVANCE_DEPOSIT') && (
                      <button
                        onClick={() => {
                          const r = receipts.find(rc => rc.receiptNumber === entry.refNumber || rc.invoiceId === entry.refNumber) || {
                            receiptNumber: entry.refNumber,
                            patientName: selectedPatient.name,
                            patientId: selectedPatient.id,
                            patientPhone: selectedPatient.phone,
                            date: entry.date,
                            amount: entry.credit,
                            paymentMethod: 'Cleared',
                            paymentType: entry.type,
                            notes: entry.description
                          };
                          onOpenReceiptModal(r);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition"
                      >
                        Voucher
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ISSUE APPROVED CREDIT NOTE */}
      {creditNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Issue Approved Credit Note / Fee Adjustment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {selectedPatient?.name} • Corrects invoice balance without erasing historical records.
            </p>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await onIssueCreditNote({
                  patientId: selectedPatient.id,
                  invoiceId: creditNoteForm.invoiceId,
                  amount: Number(creditNoteForm.amount),
                  reason: creditNoteForm.reason
                });
                setCreditNoteModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Treatment Invoice (Optional)
                </label>
                <select
                  value={creditNoteForm.invoiceId}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">General Patient Account Adjustment</option>
                  {(selectedPatient?.invoices || []).map(inv => (
                    <option key={inv.id} value={inv.invoiceNumber || inv.id}>
                      #{inv.invoiceNumber} - Total: {currency} {inv.total} | Balance: {currency} {inv.balance || (inv.total - (inv.paid || 0))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adjustment Amount ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 1500"
                  value={creditNoteForm.amount}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Audit Justification / Reason
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Approved 10% Senior Citizen or student discount waiver"
                  value={creditNoteForm.reason}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreditNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE PATIENT REFUND */}
      {refundModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Issue Patient Refund
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {selectedPatient?.name} • Offsets ledger safely via authorized contra-reversal.
            </p>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await onIssueRefund(selectedPatient.id, {
                  amount: Number(refundForm.amount),
                  paymentMethod: refundForm.paymentMethod,
                  reason: refundForm.reason
                });
                setRefundModalOpen(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Refund Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={refundForm.amount}
                    onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Refund Method
                  </label>
                  <select
                    value={refundForm.paymentMethod}
                    onChange={e => setRefundForm({ ...refundForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="FonePay / QR">FonePay / QR Transfer</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Refund Reason (Audit Required)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Unutilized implant advance deposit refund requested by patient"
                  value={refundForm.reason}
                  onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Authorize & Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

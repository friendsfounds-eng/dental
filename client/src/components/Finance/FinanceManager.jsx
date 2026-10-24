import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Building2,
  QrCode,
  Scale,
  FileSpreadsheet,
  Layers,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

import AccountingDashboard from './components/AccountingDashboard';
import IncomeBillingHub from './components/IncomeBillingHub';
import ExpensesPayableHub from './components/ExpensesPayableHub';
import StaffSalariesAdvancesHub from './components/StaffSalariesAdvancesHub';
import PatientAccountsHub from './components/PatientAccountsHub';
import DoubleEntryEngine from './components/DoubleEntryEngine';
import AccountingReportsHub from './components/AccountingReportsHub';
import BankAccountsHub from './components/BankAccountsHub';
import ReceiptVoucherModal from './components/ReceiptVoucherModal';

export default function FinanceManager({
  clinicProfile = {},
  patients = [],
  authToken,
  activeTenant,
  currentUser,
  onOpenWhatsApp
}) {
  const currency = clinicProfile.currency || 'Rs.';

  // Top Tabs: 'overview' | 'income' | 'expenses' | 'patient_accounts' | 'double_entry' | 'reports' | 'banking'
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Accounting Core Data States
  const [accountDetails, setAccountDetails] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [generalLedger, setGeneralLedger] = useState([]);
  const [trialBalance, setTrialBalance] = useState({ rows: [], totalDebits: 0, totalCredits: 0, isBalanced: true });
  const [expenseVouchers, setExpenseVouchers] = useState([]);
  const [advanceDeposits, setAdvanceDeposits] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [taxConfig, setTaxConfig] = useState({});
  const [summaryData, setSummaryData] = useState(null);

  // Staff Payroll, Advances & Payouts States
  const [staffPayments, setStaffPayments] = useState([]);
  const [staffAdvances, setStaffAdvances] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Active Receipt Modal
  const [activeReceiptModal, setActiveReceiptModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
  });

  // Load All Accounting Data
  const loadAccountingData = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();

      const [
        resAccount,
        resCOA,
        resJEs,
        resGL,
        resTB,
        resExpenses,
        resDeposits,
        resCreditNotes,
        resReceipts,
        resRecs,
        resTax,
        resSummary,
        resStaffPayments,
        resStaffAdvances,
        resPayouts,
        resStaffList
      ] = await Promise.all([
        fetch('/api/finance/account', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/accounting/chart-of-accounts', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/journal-entries', { headers }).then(r => r.ok ? r.json() : { entries: [] }),
        fetch('/api/accounting/general-ledger', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/trial-balance', { headers }).then(r => r.ok ? r.json() : {}),
        fetch('/api/accounting/expenses', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/advance-deposits', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/credit-notes', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/receipts', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/reconciliations', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/tax-config', { headers }).then(r => r.ok ? r.json() : {}),
        fetch('/api/finance/summary', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/finance/staff-payments', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/finance/staff-advances', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/finance/payouts', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/admin/staff', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      if (resAccount) setAccountDetails(resAccount);
      if (Array.isArray(resCOA)) setChartOfAccounts(resCOA);
      if (resJEs?.entries) setJournalEntries(resJEs.entries);
      if (Array.isArray(resGL)) setGeneralLedger(resGL);
      if (resTB) setTrialBalance(resTB);
      if (Array.isArray(resExpenses)) setExpenseVouchers(resExpenses);
      if (Array.isArray(resDeposits)) setAdvanceDeposits(resDeposits);
      if (Array.isArray(resCreditNotes)) setCreditNotes(resCreditNotes);
      if (Array.isArray(resReceipts)) setReceipts(resReceipts);
      if (Array.isArray(resRecs)) setReconciliations(resRecs);
      if (resTax) setTaxConfig(resTax);
      if (resSummary) setSummaryData(resSummary);
      if (Array.isArray(resStaffPayments)) setStaffPayments(resStaffPayments);
      if (Array.isArray(resStaffAdvances)) setStaffAdvances(resStaffAdvances);
      if (Array.isArray(resPayouts)) setPayouts(resPayouts);
      if (Array.isArray(resStaffList)) setStaffList(resStaffList);
    } catch (err) {
      console.error('Error loading accounting data:', err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, [activeTenant]);

  // Action: Record Income / Collect Payment
  const handleRecordIncome = async (incomeData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/receipts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(incomeData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record income');

      showToast(`✅ Payment received! Official Receipt #${data.receipt?.receiptNumber} generated.`);
      await loadAccountingData();

      if (data.receipt) {
        setActiveReceiptModal(data.receipt);
      }
    } catch (err) {
      alert(`[Income Record Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Advance Deposit
  const handleRecordDeposit = async (depositData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/advance-deposits', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(depositData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record advance deposit');

      showToast(`✅ Advance Deposit #${data.deposit?.depositNumber} recorded in patient wallet.`);
      await loadAccountingData();

      if (data.deposit?.receiptNumber) {
        const rc = (receipts || []).find(r => r.receiptNumber === data.deposit.receiptNumber) || {
          receiptNumber: data.deposit.receiptNumber,
          patientName: data.deposit.patientName,
          patientId: data.deposit.patientId,
          date: data.deposit.date?.split('T')[0],
          amount: data.deposit.amount,
          paymentMethod: data.deposit.paymentMethod,
          paymentType: 'ADVANCE_DEPOSIT',
          notes: data.deposit.notes
        };
        setActiveReceiptModal(rc);
      }
    } catch (err) {
      alert(`[Advance Deposit Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Apply Advance Deposit to Invoice
  const handleApplyDeposit = async (depositId, invoiceId, amount) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/accounting/advance-deposits/${depositId}/apply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ invoiceId, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply advance deposit');

      showToast(`✅ Applied ${currency} ${amount} advance deposit credit to Invoice #${invoiceId}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Apply Deposit Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Expense Voucher
  const handleRecordExpense = async (voucherData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(voucherData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record expense voucher');

      showToast(`✅ Expense Voucher #${data.voucher?.voucherNumber} recorded & posted to ledger.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Expense Voucher Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Expense Status (Approve or Mark Paid)
  const handleUpdateExpenseStatus = async (voucherId, updates) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/accounting/expenses/${voucherId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update voucher status');

      showToast(`✅ Voucher #${data.voucher?.voucherNumber} status updated to ${updates.paymentStatus || updates.approvalStatus}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Voucher Status Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Issue Credit Note
  const handleIssueCreditNote = async (cnData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/credit-notes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cnData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue credit note');

      showToast(`✅ Approved Credit Note #${data.creditNote?.creditNoteNumber} issued. Ledger adjusted.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Credit Note Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Issue Refund
  const handleIssueRefund = async (patientId, refundData) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/patient-transactions/${patientId}/refund`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(refundData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue patient refund');

      showToast(`✅ Patient refund processed with audit voucher. Transaction history preserved.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Refund Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Create Account in COA
  const handleCreateAccount = async (accountData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/chart-of-accounts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(accountData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      showToast(`✅ Account "${data.account?.code} - ${data.account?.name}" added to Chart of Accounts.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Chart of Accounts Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Create Manual Journal Entry
  const handleCreateJournalEntry = async (jeData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jeData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create journal entry');

      showToast(`✅ Double-entry journal entry #${data.entry?.id} posted to general ledger.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Journal Entry Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Reverse Journal Entry (Authorized Reversal)
  const handleReverseJournalEntry = async (entryId, reason) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/accounting/journal-entries/${entryId}/reverse`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reverse journal entry');

      showToast(`✅ Authorized Contra-Reversal #${data.reversalEntry?.id} posted. Historical record preserved.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Reversal Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Bank Reconciliation
  const handleRecordReconciliation = async (recData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/reconciliations', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(recData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bank reconciliation');

      showToast(`✅ Reconciliation session signed-off. Status: ${data.reconciliation?.status}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Reconciliation Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Tax Config
  const handleUpdateTaxConfig = async (configData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/tax-config', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(configData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tax rules');

      showToast(`✅ Tax configuration updated to ${data.taxConfig?.taxRate}% ${data.taxConfig?.taxName}.`);
      setTaxConfig(data.taxConfig);
    } catch (err) {
      alert(`[Tax Config Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Receiving Bank Account
  const handleUpdateAccountDetails = async (accData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/account', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(accData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update account');

      showToast(`✅ Clinic organization receiving account details updated.`);
      setAccountDetails(data.account);
    } catch (err) {
      alert(`[Bank Account Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record / Disburse Staff Salary Payment
  const handleRecordSalaryPayment = async (paymentData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/staff-payments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(paymentData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record salary payment');

      showToast(`✅ Salary voucher #${data.payment?.refNumber || data.payment?.id} disbursed to ${data.payment?.staffName}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Salary Payment Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Staff Payment Status
  const handleUpdatePaymentStatus = async (paymentId, updates) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/staff-payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment status');

      showToast(`✅ Salary payment status updated to ${updates.status}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Payment Status Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Issue Staff Salary Advance
  const handleRecordAdvance = async (advanceData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/staff-advances', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(advanceData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue staff advance');

      showToast(`✅ Advance #${data.advance?.advanceNumber} of ${currency} ${Number(data.advance?.amount).toLocaleString()} disbursed to ${data.advance?.staffName}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Staff Advance Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Staff Advance Status
  const handleUpdateAdvanceStatus = async (advanceId, status) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/staff-advances/${advanceId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update advance status');

      showToast(`✅ Advance #${data.advance?.advanceNumber} status updated to ${status}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Advance Status Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Manual Repayment against Staff Advance
  const handleRepayAdvance = async (advanceId, repaymentData) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/staff-advances/${advanceId}/repay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(repaymentData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record advance repayment');

      showToast(`✅ Recorded repayment of ${currency} ${Number(repaymentData.amount).toLocaleString()} against Advance #${data.advance?.advanceNumber}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Advance Repay Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Ad-hoc Payout / Doctor Incentive
  const handleRecordPayout = async (payoutData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/payouts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payoutData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payout');

      showToast(`✅ Payout #${data.payout?.refNumber || data.payout?.id} recorded for ${data.payout?.recipient}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Payout Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Payout Status
  const handleUpdatePayoutStatus = async (payoutId, status) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/payouts/${payoutId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payout status');

      showToast(`✅ Payout status updated to ${status}.`);
      await loadAccountingData();
    } catch (err) {
      alert(`[Payout Status Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Accounting & Billing ERP Suite
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              GAAP Double-Entry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized general ledger, patient accounts, auditable reversals, accounts payable & 7 statutory financial reports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAccountingData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            title="Reload financial ledgers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Books</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 overflow-x-auto no-print">
        {[
          { id: 'overview', label: '📊 Accounting Overview', icon: Layers },
          { id: 'income', label: '💰 Income & Billing Hub', icon: Receipt },
          { id: 'expenses', label: '🧾 Expenses & Accounts Payable', icon: TrendingDown },
          { id: 'staff_payroll', label: '👥 Staff Salaries & Advances', icon: Users },
          { id: 'patient_accounts', label: '👤 Patient Accounts & Ledgers', icon: Users },
          { id: 'double_entry', label: '⚖️ Double-Entry Engine', icon: Scale },
          { id: 'reports', label: '📈 Accounting Reports (7)', icon: FileSpreadsheet },
          { id: 'banking', label: '🏦 Bank Accounts & QR', icon: Landmark }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT SECTIONS */}
      {activeTab === 'overview' && (
        <AccountingDashboard
          summaryData={summaryData}
          chartOfAccounts={chartOfAccounts}
          journalEntries={journalEntries}
          expenseVouchers={expenseVouchers}
          receipts={receipts}
          currency={currency}
          onNavigateTab={setActiveTab}
          onOpenNewIncome={() => setActiveTab('income')}
          onOpenNewExpense={() => setActiveTab('expenses')}
          onOpenNewDeposit={() => setActiveTab('income')}
          onOpenNewJournalEntry={() => setActiveTab('double_entry')}
          onOpenReceiptModal={setActiveReceiptModal}
        />
      )}

      {activeTab === 'income' && (
        <IncomeBillingHub
          patients={patients}
          receipts={receipts}
          advanceDeposits={advanceDeposits}
          currency={currency}
          onOpenReceiptModal={setActiveReceiptModal}
          onRecordIncome={handleRecordIncome}
          onRecordDeposit={handleRecordDeposit}
          onApplyDeposit={handleApplyDeposit}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesPayableHub
          expenseVouchers={expenseVouchers}
          currency={currency}
          onRecordExpense={handleRecordExpense}
          onUpdateStatus={handleUpdateExpenseStatus}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'staff_payroll' && (
        <StaffSalariesAdvancesHub
          staffPayments={staffPayments}
          staffAdvances={staffAdvances}
          payouts={payouts}
          staffList={staffList}
          currency={currency}
          clinicProfile={clinicProfile}
          onRecordSalaryPayment={handleRecordSalaryPayment}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onRecordAdvance={handleRecordAdvance}
          onUpdateAdvanceStatus={handleUpdateAdvanceStatus}
          onRepayAdvance={handleRepayAdvance}
          onRecordPayout={handleRecordPayout}
          onUpdatePayoutStatus={handleUpdatePayoutStatus}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

      {activeTab === 'patient_accounts' && (
        <PatientAccountsHub
          patients={patients}
          creditNotes={creditNotes}
          receipts={receipts}
          advanceDeposits={advanceDeposits}
          currency={currency}
          onIssueCreditNote={handleIssueCreditNote}
          onIssueRefund={handleIssueRefund}
          onOpenReceiptModal={setActiveReceiptModal}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

      {activeTab === 'double_entry' && (
        <DoubleEntryEngine
          chartOfAccounts={chartOfAccounts}
          journalEntries={journalEntries}
          trialBalance={trialBalance}
          generalLedger={generalLedger}
          reconciliations={reconciliations}
          currency={currency}
          onCreateAccount={handleCreateAccount}
          onCreateJournalEntry={handleCreateJournalEntry}
          onReverseJournalEntry={handleReverseJournalEntry}
          onRecordReconciliation={handleRecordReconciliation}
        />
      )}

      {activeTab === 'reports' && (
        <AccountingReportsHub
          clinicProfile={clinicProfile}
          patients={patients}
          currency={currency}
          taxConfig={taxConfig}
          onUpdateTaxConfig={handleUpdateTaxConfig}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

      {activeTab === 'banking' && (
        <BankAccountsHub
          accountDetails={accountDetails}
          currency={currency}
          onUpdateAccount={handleUpdateAccountDetails}
        />
      )}

      {/* OFFICIAL RECEIPT VOUCHER MODAL */}
      {activeReceiptModal && (
        <ReceiptVoucherModal
          receipt={activeReceiptModal}
          clinicProfile={clinicProfile}
          onClose={() => setActiveReceiptModal(null)}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}
    </div>
  );
}

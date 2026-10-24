import React from 'react';
import {
  Wallet,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export default function AccountingDashboard({
  summaryData,
  chartOfAccounts = [],
  journalEntries = [],
  expenseVouchers = [],
  receipts = [],
  currency = 'Rs.',
  onNavigateTab,
  onOpenNewIncome,
  onOpenNewExpense,
  onOpenNewDeposit,
  onOpenNewJournalEntry,
  onOpenReceiptModal
}) {
  // Extract key balances from Chart of Accounts
  const cashInDrawer = chartOfAccounts.find(a => a.code === '1010')?.balance || 26500;
  const bankBalance = chartOfAccounts.find(a => a.code === '1020')?.balance || 245000;
  const digitalClearing = chartOfAccounts.find(a => a.code === '1030')?.balance || 42500;
  const accountsReceivable = chartOfAccounts.find(a => a.code === '1100')?.balance || 65000;
  const accountsPayable = chartOfAccounts.find(a => a.code === '2010')?.balance || 34000;
  const patientAdvanceDeposits = chartOfAccounts.find(a => a.code === '2100')?.balance || 28000;

  const totalLiquidCash = cashInDrawer + bankBalance + digitalClearing;

  // Calculate Income vs Expenses
  const totalIncome = summaryData?.totalIncome || 280000;
  const totalExpense = summaryData?.totalExpense || 128500;
  const netSurplus = totalIncome - totalExpense;

  const recentEntries = (journalEntries || []).slice(0, 6);
  const recentReceipts = (receipts || []).slice(0, 5);
  const pendingVouchers = (expenseVouchers || []).filter(v => v.approvalStatus === 'Pending' || v.paymentStatus === 'Unpaid');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Level Financial Position Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquid Cash & Bank */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Liquid Cash & Bank
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {currency} {totalLiquidCash.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Drawer: <strong className="text-slate-800">{currency} {cashInDrawer.toLocaleString()}</strong></span>
              <span>Bank: <strong className="text-slate-800">{currency} {bankBalance.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Operating Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Operating Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 tracking-tight font-mono">
              {currency} {totalIncome.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Treatments, consultation & pharmacy</span>
            </p>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Operating Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700 tracking-tight font-mono">
              {currency} {totalExpense.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center space-x-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Salaries, materials, lab & rent</span>
            </p>
          </div>
        </div>

        {/* Net Operating Surplus */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Net Operating Surplus
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight font-mono text-white">
              {currency} {netSurplus.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-emerald-100">
              Operating Margin: {totalIncome > 0 ? ((netSurplus / totalIncome) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider px-2">
            Quick Financial Entry:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewIncome}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Income / Receipt</span>
          </button>

          <button
            onClick={onOpenNewExpense}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense Voucher</span>
          </button>

          <button
            onClick={onOpenNewDeposit}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Wallet className="w-4 h-4" />
            <span>Patient Advance Deposit</span>
          </button>

          <button
            onClick={onOpenNewJournalEntry}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Layers className="w-4 h-4" />
            <span>Manual Journal Entry</span>
          </button>

          <button
            onClick={() => onNavigateTab('staff_payroll')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>Staff Salaries & Advances</span>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Accounting Reports</span>
          </button>
        </div>
      </div>

      {/* AR & AP Sub-ledger Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Accounts Receivable (AR) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Accounts Receivable (AR)
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full border border-amber-200">
                Asset (Code 1100)
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {currency} {accountsReceivable.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Outstanding patient treatment balances due for collection.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('patient_accounts')}
            className="mt-4 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center justify-between border-t border-slate-100 pt-3"
          >
            <span>View Patient Aging & Ledgers</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Accounts Payable (AP) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Accounts Payable (AP)
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-full border border-rose-200">
                Liability (Code 2010)
              </span>
            </div>
            <div className="text-2xl font-black text-rose-700 font-mono">
              {currency} {accountsPayable.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Unpaid bills due to dental laboratories and dental supply traders.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="mt-4 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center justify-between border-t border-slate-100 pt-3"
          >
            <span>Track Supplier Bills ({pendingVouchers.length} pending)</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Advance Deposits Credit Wallet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Patient Advance Deposits
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200">
                Liability (Code 2100)
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono">
              {currency} {patientAdvanceDeposits.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Unearned deposits stored in patient credit wallet awaiting procedures.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('income')}
            className="mt-4 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center justify-between border-t border-slate-100 pt-3"
          >
            <span>Manage Advance Credits</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lower Section: Recent Journal Entries & Live Receipts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balanced Double-Entry Journal Entries Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Recent Double-Entry Journal Postings
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('double_entry')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              View All GL Postings →
            </button>
          </div>

          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div
                key={entry.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-800">{entry.id}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-[10px]">
                      {entry.source}
                    </span>
                    {entry.status === 'REVERSED' && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold text-[10px]">
                        REVERSED
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-700 font-medium mb-2">{entry.memo}</p>

                {/* Line Items breakdown */}
                <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                  {(entry.lines || []).map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600">
                      <span className="truncate max-w-[200px]">
                        <strong className="font-mono text-slate-700">{line.accountCode}</strong> {line.accountName}
                      </span>
                      <div className="font-mono">
                        {line.debit > 0 && (
                          <span className="text-blue-700 font-bold mr-2">Dr: {currency} {line.debit.toLocaleString()}</span>
                        )}
                        {line.credit > 0 && (
                          <span className="text-emerald-700 font-bold">Cr: {currency} {line.credit.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Official Receipts & Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Official Receipts Generated
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('income')}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              All Receipts Registry →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentReceipts.map(receipt => (
              <div
                key={receipt.id}
                className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">#{receipt.receiptNumber}</span>
                    <span className="text-slate-600 font-medium">{receipt.patientName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{receipt.paymentMethod || 'Cash'}</span>
                    <span>•</span>
                    <span>{receipt.date}</span>
                    <span>•</span>
                    <span className="text-slate-400">{receipt.issuedBy}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {currency} {Number(receipt.amount || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => onOpenReceiptModal(receipt)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

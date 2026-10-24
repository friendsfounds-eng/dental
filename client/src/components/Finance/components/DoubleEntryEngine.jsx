import React, { useState } from 'react';
import {
  Scale,
  Layers,
  BookOpen,
  Landmark,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { exportToCsv } from '../../../utils/excelExport';

export default function DoubleEntryEngine({
  chartOfAccounts = [],
  journalEntries = [],
  trialBalance = {},
  generalLedger = [],
  reconciliations = [],
  currency = 'Rs.',
  onCreateAccount,
  onCreateJournalEntry,
  onReverseJournalEntry,
  onRecordReconciliation
}) {
  const [activeEngineTab, setActiveEngineTab] = useState('coa'); // 'coa' | 'journal' | 'gl' | 'trial_balance' | 'reconciliation'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    code: '',
    name: '',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: '',
    balance: '0'
  });

  const [newJEModalOpen, setNewJEModalOpen] = useState(false);
  const [newJEForm, setNewJEForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: `MAN-${Date.now().toString().slice(-4)}`,
    memo: '',
    lines: [
      { accountCode: '1010', debit: '', credit: '' },
      { accountCode: '4010', debit: '', credit: '' }
    ]
  });

  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [targetEntryForReversal, setTargetEntryForReversal] = useState(null);
  const [reversalReason, setReversalReason] = useState('');

  // GL Account Filter
  const [glAccountFilter, setGlAccountFilter] = useState(chartOfAccounts[0]?.code || '1010');

  // Reconciliation State
  const [recAccountCode, setRecAccountCode] = useState('1020');
  const [recStatementDate, setRecStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [recStatementBalance, setRecStatementBalance] = useState('245000');
  const [recClearedItems, setRecClearedItems] = useState([true, true, true, true, true]);
  const [recNotes, setRecNotes] = useState('Monthly mid-period bank statement matching');

  // Reconciled Account Book Balance
  const recAccount = chartOfAccounts.find(a => a.code === recAccountCode);
  const bookBalance = recAccount?.balance || 0;
  const numStatement = Number(recStatementBalance) || 0;
  const recDiff = Math.abs(numStatement - bookBalance);

  // Filter COA
  const filteredCOA = chartOfAccounts.filter(a => {
    return (
      a.code?.includes(searchTerm) ||
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter Journal Entries
  const filteredJEs = journalEntries.filter(je => {
    return (
      je.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      je.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      je.memo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleExportJECsv = () => {
    const headers = ['Entry ID', 'Date', 'Reference', 'Source', 'Memo', 'Status', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Reversal Of'];
    const rows = [];
    journalEntries.forEach(je => {
      (je.lines || []).forEach(l => {
        rows.push([
          je.id,
          je.date,
          je.reference,
          je.source,
          je.memo,
          je.status,
          l.accountCode,
          l.accountName,
          l.debit,
          l.credit,
          je.reversalOf || ''
        ]);
      });
    });
    exportToCsv(`ApexDental_Journal_Entries_${Date.now()}`, headers, rows);
  };

  const handleAddJELine = () => {
    setNewJEForm(prev => ({
      ...prev,
      lines: [...prev.lines, { accountCode: chartOfAccounts[0]?.code || '1010', debit: '', credit: '' }]
    }));
  };

  const handleRemoveJELine = (index) => {
    if (newJEForm.lines.length <= 2) return;
    setNewJEForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleJELineChange = (index, field, value) => {
    const updated = [...newJEForm.lines];
    updated[index][field] = value;
    setNewJEForm(prev => ({ ...prev, lines: updated }));
  };

  // Calculate live JE totals
  const jeTotalDebits = newJEForm.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const jeTotalCredits = newJEForm.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isJEBalanced = Math.abs(jeTotalDebits - jeTotalCredits) < 0.01 && jeTotalDebits > 0;

  const handleSubmitNewJE = async (e) => {
    e.preventDefault();
    if (!isJEBalanced) {
      alert(`Journal entry is unbalanced. Total Debits (${jeTotalDebits}) must equal Total Credits (${jeTotalCredits}).`);
      return;
    }

    await onCreateJournalEntry({
      ...newJEForm,
      lines: newJEForm.lines.map(l => ({
        accountCode: l.accountCode,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0
      }))
    });

    setNewJEModalOpen(false);
  };

  const handleExecuteReversal = async (e) => {
    e.preventDefault();
    if (!targetEntryForReversal || !reversalReason.trim()) return;

    await onReverseJournalEntry(targetEntryForReversal.id, reversalReason);
    setReversalModalOpen(false);
    setTargetEntryForReversal(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Navigation & Sub-Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Pills */}
        <div className="flex flex-wrap items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveEngineTab('coa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeEngineTab === 'coa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chart of Accounts ({chartOfAccounts.length})
          </button>
          <button
            onClick={() => setActiveEngineTab('journal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeEngineTab === 'journal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Journal Entries & Reversals ({journalEntries.length})
          </button>
          <button
            onClick={() => setActiveEngineTab('gl')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeEngineTab === 'gl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Ledger (GL)
          </button>
          <button
            onClick={() => setActiveEngineTab('trial_balance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeEngineTab === 'trial_balance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setActiveEngineTab('reconciliation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeEngineTab === 'reconciliation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bank & Cash Reconciliation
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {activeEngineTab === 'coa' && (
            <button
              onClick={() => setNewAccountModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Account</span>
            </button>
          )}

          {activeEngineTab === 'journal' && (
            <>
              <button
                onClick={handleExportJECsv}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setNewJEModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Journal Entry</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. CHART OF ACCOUNTS (COA) */}
      {activeEngineTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search account code, name or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-3">
              <span>Assets (1000s)</span>
              <span>•</span>
              <span>Liabilities (2000s)</span>
              <span>•</span>
              <span>Equity (3000s)</span>
              <span>•</span>
              <span>Revenue (4000s)</span>
              <span>•</span>
              <span>Expenses (5000s)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Normal Balance</th>
                  <th className="px-4 py-3 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCOA.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {acc.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{acc.name}</div>
                      {acc.description && <p className="text-[11px] text-slate-400 font-normal">{acc.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        acc.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                        acc.type === 'LIABILITY' ? 'bg-rose-100 text-rose-800' :
                        acc.type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
                        acc.type === 'REVENUE' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {acc.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {acc.normalBalance}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {currency} {Number(acc.balance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. JOURNAL ENTRIES & AUDITABLE REVERSALS */}
      {activeEngineTab === 'journal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Double-Entry General Journal Entries
              </h3>
              <p className="text-xs text-slate-500">
                Immutable financial record. Errors are corrected through authorized reversal entries.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>GAAP Double-Entry Enforced</span>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredJEs.map(entry => (
              <div key={entry.id} className="p-5 hover:bg-slate-50/60 transition space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{entry.id}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                      {entry.source}
                    </span>
                    <span className="font-mono text-slate-500 text-xs">Ref: {entry.reference}</span>
                    {entry.status === 'REVERSED' ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold text-[10px]">
                        REVERSED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                        POSTED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500 font-mono">
                      {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                    </span>
                    {entry.status !== 'REVERSED' && (
                      <button
                        onClick={() => {
                          setTargetEntryForReversal(entry);
                          setReversalReason('');
                          setReversalModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition"
                        title="Authorized Reversal of this Journal Entry"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reverse Entry</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800">{entry.memo}</p>

                {/* Debits / Credits Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-3 py-1.5">Account Code</th>
                        <th className="px-3 py-1.5">Account Name</th>
                        <th className="px-3 py-1.5 text-right">Debit ({currency})</th>
                        <th className="px-3 py-1.5 text-right">Credit ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                      {(entry.lines || []).map((line, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 font-bold text-slate-900">{line.accountCode}</td>
                          <td className="px-3 py-1.5 font-sans font-medium text-slate-800">{line.accountName}</td>
                          <td className="px-3 py-1.5 text-right text-blue-700 font-bold">
                            {line.debit > 0 ? Number(line.debit).toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-1.5 text-right text-emerald-700 font-bold">
                            {line.credit > 0 ? Number(line.credit).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GENERAL LEDGER (GL) */}
      {activeEngineTab === 'gl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">General Ledger Account Movements</h3>
              <p className="text-xs text-slate-500">
                Running debit and credit ledger with chronological audit history.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Account:</span>
              <select
                value={glAccountFilter}
                onChange={e => setGlAccountFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-hidden"
              >
                {chartOfAccounts.map(a => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GL Account Transactions */}
          {(() => {
            const currentGl = generalLedger.find(g => g.accountCode === glAccountFilter) || generalLedger[0];
            if (!currentGl) {
              return <div className="p-8 text-center text-xs text-slate-400">Loading General Ledger...</div>;
            }

            return (
              <div className="overflow-x-auto">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{currentGl.accountName}</span>
                    <span className="ml-2 font-mono text-slate-500">Code: {currentGl.accountCode}</span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                      {currentGl.normalBalance} NORMAL
                    </span>
                  </div>
                  <div className="font-mono text-slate-800">
                    Closing Balance: <strong className="text-slate-900 text-sm">{currency} {Number(currentGl.closingBalance || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Journal Ref</th>
                      <th className="px-4 py-2.5">Source</th>
                      <th className="px-4 py-2.5">Narrative Memo</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Credit</th>
                      <th className="px-4 py-2.5 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(currentGl.transactions || []).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{t.date?.split('T')[0]}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{t.reference || t.journalEntryId}</td>
                        <td className="px-4 py-2.5 text-slate-600">{t.source}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-sm truncate">{t.memo}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700">
                          {t.debit > 0 ? `${currency} ${t.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                          {t.credit > 0 ? `${currency} ${t.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-slate-900">
                          {currency} {t.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. TRIAL BALANCE */}
      {activeEngineTab === 'trial_balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Trial Balance Verification Sheet</h3>
              <p className="text-xs text-slate-500">
                Mathematical proof that Total Debits strictly equal Total Credits across all clinical ledger accounts.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {trialBalance.isBalanced ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Balanced (Debits = Credits)</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Difference: {trialBalance.difference}</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Account Code</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit Balance ({currency})</th>
                  <th className="px-4 py-3 text-right">Credit Balance ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {(trialBalance.rows || []).map(r => (
                  <tr key={r.code} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{r.code}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{r.name}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-500 text-[11px]">{r.type}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                      {r.debit > 0 ? Number(r.debit).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                      {r.credit > 0 ? Number(r.credit).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-mono font-bold text-xs">
                <tr>
                  <td colSpan="3" className="px-4 py-3 font-sans uppercase tracking-wider text-right">
                    Total Trial Balance Sum:
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {currency} {Number(trialBalance.totalDebits || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {currency} {Number(trialBalance.totalCredits || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. BANK & CASH RECONCILIATION */}
      {activeEngineTab === 'reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Bank & Cash Drawer Reconciliation
              </h3>
              <p className="text-xs text-slate-500">
                Reconcile physical bank statements and cash drawer logs against ERP general ledger books.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={recAccountCode}
                onChange={e => setRecAccountCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 text-slate-800 focus:outline-hidden"
              >
                <option value="1010">1010 - Cash in Drawer / Register</option>
                <option value="1020">1020 - Bank Current Account (Nabil Bank)</option>
                <option value="1030">1030 - Digital Payments Clearing</option>
              </select>
            </div>
          </div>

          {/* Statement Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statement Date
              </label>
              <input
                type="date"
                value={recStatementDate}
                onChange={e => setRecStatementDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Statement Ending Balance ({currency})
              </label>
              <input
                type="number"
                step="any"
                value={recStatementBalance}
                onChange={e => setRecStatementBalance(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ERP General Ledger Book Balance
              </label>
              <div className="px-3 py-2 bg-slate-200 text-slate-900 rounded-xl text-xs font-mono font-black">
                {currency} {bookBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Reconciliation Balance Math Display */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Statement Balance</span>
              <span className="text-lg font-mono font-bold text-slate-900 mt-1 block">
                {currency} {numStatement.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">ERP Book Balance</span>
              <span className="text-lg font-mono font-bold text-slate-900 mt-1 block">
                {currency} {bookBalance.toLocaleString()}
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${recDiff < 0.05 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              <span className="text-[10px] font-bold uppercase block">Variance / Difference</span>
              <span className="text-lg font-mono font-black mt-1 block">
                {currency} {recDiff.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              onClick={async () => {
                await onRecordReconciliation({
                  accountCode: recAccountCode,
                  statementDate: recStatementDate,
                  statementBalance: numStatement,
                  bookBalance,
                  clearedItemsCount: 5,
                  notes: recNotes
                });
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Sign-Off & Complete Reconciliation
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NEW MANUAL JOURNAL ENTRY */}
      {newJEModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-fadeIn my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  New Balanced Manual Journal Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Debits must strictly equal Credits before posting to the general ledger.
                </p>
              </div>
              <button onClick={() => setNewJEModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewJE} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={newJEForm.date}
                    onChange={e => setNewJEForm({ ...newJEForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference / Voucher #
                  </label>
                  <input
                    type="text"
                    value={newJEForm.reference}
                    onChange={e => setNewJEForm({ ...newJEForm, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Narrative Description / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transfer funds from drawer to current account"
                  value={newJEForm.memo}
                  onChange={e => setNewJEForm({ ...newJEForm, memo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="p-2.5 bg-slate-100 flex items-center justify-between font-bold text-slate-700">
                  <span>Double-Entry Account Allocations</span>
                  <button
                    type="button"
                    onClick={handleAddJELine}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="divide-y divide-slate-100 p-2 space-y-2">
                  {newJEForm.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          value={line.accountCode}
                          onChange={e => handleJELineChange(idx, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        >
                          {chartOfAccounts.map(a => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="any"
                          placeholder="Debit"
                          value={line.debit}
                          onChange={e => handleJELineChange(idx, 'debit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Credit"
                          value={line.credit}
                          onChange={e => handleJELineChange(idx, 'credit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {newJEForm.lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveJELine(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance Verification Footer */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span>Debits: <strong className="text-blue-700">{currency} {jeTotalDebits.toLocaleString()}</strong></span>
                  <span>Credits: <strong className="text-emerald-700">{currency} {jeTotalCredits.toLocaleString()}</strong></span>
                  <span className={isJEBalanced ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {isJEBalanced ? '✓ Balanced' : `Diff: ${currency} ${Math.abs(jeTotalDebits - jeTotalCredits).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewJEModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJEBalanced}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUTHORIZED REVERSAL */}
      {reversalModalOpen && targetEntryForReversal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Authorized Financial Reversal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Posting an authorized contra-reversal for {targetEntryForReversal.id} ({targetEntryForReversal.memo}).
            </p>

            <form onSubmit={handleExecuteReversal} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <p className="font-bold flex items-center space-x-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Immutable Accounting Rule</span>
                </p>
                <p>
                  This action will NOT delete historical financial records. It will post a balanced contra-entry that reverses all debits and credits with an audit trail.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Audit Justification / Reason
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Erroneous account allocation corrected per auditor request"
                  value={reversalReason}
                  onChange={e => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReversalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Authorize Contra-Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

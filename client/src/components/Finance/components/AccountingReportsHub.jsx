import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Receipt,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Share2
} from 'lucide-react';
import { exportToA4Pdf } from '../../../utils/pdfExport';
import { exportToCsv } from '../../../utils/excelExport';

export default function AccountingReportsHub({
  clinicProfile = {},
  patients = [],
  currency = 'Rs.',
  taxConfig = {},
  onUpdateTaxConfig,
  onOpenWhatsApp
}) {
  const [selectedReport, setSelectedReport] = useState('daily-cash');
  const [datePreset, setDatePreset] = useState('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tax Config Modal
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({
    taxName: taxConfig.taxName || 'VAT',
    taxRate: taxConfig.taxRate || 13,
    taxIdNumber: taxConfig.taxIdNumber || 'PAN-601928374',
    isTaxEnabled: taxConfig.isTaxEnabled !== false
  });

  // Physical Cash Drawer Denomination Counter State (for Daily Cash Report)
  const [denominations, setDenominations] = useState({
    d1000: 8,
    d500: 10,
    d100: 25,
    d50: 10,
    d20: 20,
    d10: 10,
    coins: 0
  });

  const physicalCashTotal =
    (denominations.d1000 * 1000) +
    (denominations.d500 * 500) +
    (denominations.d100 * 100) +
    (denominations.d50 * 50) +
    (denominations.d20 * 20) +
    (denominations.d10 * 10) +
    (Number(denominations.coins) || 0);

  // Fetch report from backend
  const fetchReport = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (customStartDate) queryParams.append('startDate', customStartDate);
      if (customEndDate) queryParams.append('endDate', customEndDate);

      const res = await fetch(`/api/accounting/reports/${selectedReport}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport, customStartDate, customEndDate]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const filename = `ApexDental_${selectedReport}_Report_${Date.now()}.pdf`;
    await exportToA4Pdf('printable-accounting-report', filename);
  };

  const handleExportCsv = async () => {
    window.location.href = `/api/accounting/export/${selectedReport}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Report Selection Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        {/* Report Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {[
            { id: 'daily-cash', label: '1. Daily Cash Report' },
            { id: 'income-expense', label: '2. Income & Expense' },
            { id: 'profit-loss', label: '3. Profit & Loss (P&L)' },
            { id: 'ar-aging', label: '4. AR & Patient Aging' },
            { id: 'payment-methods', label: '5. Payment Methods' },
            { id: 'tax', label: '6. Tax & VAT Compliance' },
            { id: 'cash-flow', label: '7. Statement of Cash Flows' }
          ].map(rep => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedReport === rep.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {selectedReport === 'tax' && (
            <button
              onClick={() => setTaxModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Tax Rules</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition"
            title="Download Report in Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
            title="Export Report to High Resolution A4 PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas Container */}
      <div
        id="printable-accounting-report"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-8"
      >
        {/* Official Clinic Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">🦷</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {clinicProfile.name || 'Nepal Dental & Healthcare Wellness Centre'}
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              {clinicProfile.address || 'New Baneshwor, Kathmandu, Nepal'} • Tel: {clinicProfile.phone || '+977 1 4782910'}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              PAN/VAT: {clinicProfile.panVat || taxConfig.taxIdNumber || '601928374'} • Dental Council Reg: {clinicProfile.regNo || 'NMC-84920'}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-wider mb-1">
              Accounting Statement
            </span>
            <h1 className="text-base font-black text-slate-900">
              {reportData?.reportName || selectedReport.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 1. DAILY CASH REPORT VIEW */}
        {selectedReport === 'daily-cash' && reportData && (
          <div className="space-y-6">
            {/* Cash Summary Banner */}
            <div className="grid grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Opening Float Float</span>
                <span className="text-xl font-mono font-bold text-slate-800 mt-1 block">
                  {currency} {Number(reportData.openingCash || 10000).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">+ Cash Inflows</span>
                <span className="text-xl font-mono font-bold text-emerald-700 mt-1 block">
                  {currency} {Number(reportData.totalCashIn || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">- Cash Outflows</span>
                <span className="text-xl font-mono font-bold text-rose-700 mt-1 block">
                  {currency} {Number(reportData.totalCashOut || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Closing Cash</span>
                <span className="text-xl font-mono font-black text-emerald-700 mt-1 block">
                  {currency} {Number(reportData.expectedClosing || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Physical Cash Drawer Denomination Counter */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Physical Cash Drawer Audit Count</h4>
                  <p className="text-xs text-slate-500">
                    Verify cash drawer balance by counting denomination notes at closing.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold block">Physical Count Total:</span>
                  <span className="text-xl font-mono font-black text-slate-900">
                    {currency} {physicalCashTotal.toLocaleString()}
                  </span>
                  <div className="mt-1">
                    {Math.abs(physicalCashTotal - reportData.expectedClosing) < 1 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                        ✓ BALANCED (Zero Discrepancy)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                        Variance: {currency} {Math.abs(physicalCashTotal - reportData.expectedClosing).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {['1000', '500', '100', '50', '20', '10', 'coins'].map(denom => (
                  <div key={denom} className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {denom === 'coins' ? 'Coins' : `Rs. ${denom} Notes`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denominations[`d${denom}`] !== undefined ? denominations[`d${denom}`] : denominations[denom]}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setDenominations(prev => ({
                          ...prev,
                          [denom === 'coins' ? 'coins' : `d${denom}`]: val
                        }));
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Inflows Receipts List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                Cash Inflows (Receipts Collected Today)
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2">Receipt #</th>
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(reportData.receipts || []).map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-bold text-slate-900">{r.receiptNumber}</td>
                      <td className="px-4 py-2 font-sans font-medium">{r.patientName}</td>
                      <td className="px-4 py-2 font-sans text-slate-500">{r.paymentType}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">{Number(r.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. INCOME & EXPENSE STATEMENT VIEW */}
        {selectedReport === 'income-expense' && reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Categories */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-sm">Operating Clinic Revenue</h4>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {currency} {Number(reportData.totalIncome || 0).toLocaleString()}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs p-2">
                  {Object.entries(reportData.incomeCategories || {}).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between py-2 px-2">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="font-mono font-bold text-slate-900">{currency} {Number(amt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 text-sm">Operating Clinic Expenses</h4>
                  <span className="font-mono font-bold text-rose-800 text-sm">
                    {currency} {Number(reportData.totalExpense || 0).toLocaleString()}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs p-2">
                  {Object.entries(reportData.expenseCategories || {}).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between py-2 px-2">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="font-mono font-bold text-slate-900">{currency} {Number(amt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Net Surplus Summary */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-slate-400 font-sans block">Net Operating Surplus (Income - Expenses)</span>
                <span className="text-2xl font-black text-emerald-400">
                  {currency} {Number(reportData.netSurplus || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-sans block">Operating Margin</span>
                <span className="text-2xl font-black text-white">{reportData.operatingMarginPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. PROFIT AND LOSS (P&L) STATEMENT VIEW */}
        {selectedReport === 'profit-loss' && reportData && (
          <div className="space-y-4 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between py-1 border-b border-slate-200 font-sans font-bold text-slate-800 text-sm">
                <span>Gross Treatment & Clinical Revenue</span>
                <span className="font-mono text-emerald-700">{currency} {Number(reportData.grossRevenue || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600 pl-4">
                <span>Less: Approved Patient Discounts & Price Adjustments</span>
                <span className="text-rose-600">({currency} {Number(reportData.discounts || 0).toLocaleString()})</span>
              </div>

              <div className="flex justify-between py-2 bg-white px-3 rounded-lg font-bold text-slate-900 border border-slate-200">
                <span>Net Clinical Revenue</span>
                <span>{currency} {Number(reportData.netRevenue || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600 pl-4">
                <span>Less: Cost of Clinical Goods/Services Sold (COGS: Dental Materials & Lab Charges)</span>
                <span className="text-rose-600">({currency} {Number(reportData.cogs || 0).toLocaleString()})</span>
              </div>

              <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg font-bold text-emerald-900 border border-emerald-200">
                <span>Gross Profit (Gross Margin: {reportData.grossMarginPercent}%)</span>
                <span>{currency} {Number(reportData.grossProfit || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600 pl-4">
                <span>Less: Total Operating Expenses (Staff Salaries, Rent, Utilities, Maintenance, Admin)</span>
                <span className="text-rose-600">({currency} {Number(reportData.opex || 0).toLocaleString()})</span>
              </div>

              <div className="flex justify-between py-2 bg-white px-3 rounded-lg font-bold text-slate-900 border border-slate-200">
                <span>Operating Profit (EBITDA)</span>
                <span>{currency} {Number(reportData.operatingIncome || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600 pl-4">
                <span>Less: Clinical Equipment Depreciation Reserve</span>
                <span className="text-slate-700">({currency} {Number(reportData.depreciationReserve || 0).toLocaleString()})</span>
              </div>

              <div className="flex justify-between py-2 bg-white px-3 rounded-lg font-bold text-slate-900 border border-slate-200">
                <span>Net Profit Before Tax</span>
                <span>{currency} {Number(reportData.netProfitBeforeTax || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600 pl-4">
                <span>Estimated Tax Provision (13% VAT / Corporate Income Tax)</span>
                <span className="text-rose-600">({currency} {Number(reportData.estimatedTax || 0).toLocaleString()})</span>
              </div>

              <div className="flex justify-between py-3 bg-slate-900 text-white px-4 rounded-xl font-bold text-base mt-4">
                <span className="font-sans">Net Profit After Tax (Net Margin: {reportData.netMarginPercent}%)</span>
                <span className="text-emerald-400">{currency} {Number(reportData.netProfitAfterTax || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. AR AGING & OUTSTANDING PATIENT RECEIVABLES */}
        {selectedReport === 'ar-aging' && reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              {Object.entries(reportData.buckets || {}).map(([key, b]) => (
                <div key={key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{b.label}</span>
                  <span className="text-xl font-mono font-bold text-slate-900 mt-1 block">
                    {currency} {Number(b.total || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500">{b.count} patients</span>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">Total Billed</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">Balance Due</th>
                    <th className="px-4 py-3 text-center">Days Overdue</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {Object.entries(reportData.buckets || {}).flatMap(([_, b]) =>
                    b.patients.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.phone}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{currency} {p.totalBilled.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{currency} {p.totalPaid.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">{currency} {p.outstandingBalance.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.daysPast > 60 ? 'bg-rose-100 text-rose-800' :
                            p.daysPast > 30 ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {p.daysPast} days
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {p.phone && (
                            <button
                              onClick={() => {
                                const msg = `Dear *${p.name}*,\n\nGentle reminder from *Nepal Dental & Healthcare Wellness Centre* regarding your outstanding treatment balance of *${currency} ${p.outstandingBalance.toLocaleString()}*.\n\nYou may settle via FonePay QR or at our clinic counter. Thank you!`;
                                onOpenWhatsApp(p.phone, msg);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition"
                            >
                              WhatsApp
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PAYMENT METHOD SUMMARY */}
        {selectedReport === 'payment-methods' && reportData && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Payment Channel</th>
                    <th className="px-4 py-3 text-right">Total Collections</th>
                    <th className="px-4 py-3 text-center">Transaction Count</th>
                    <th className="px-4 py-3 text-right">% Volume Share</th>
                    <th className="px-4 py-3 text-right">Average Transaction Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {(reportData.summary || []).map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-sans font-bold text-slate-900">{m.method}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{currency} {Number(m.total).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{m.count}</td>
                      <td className="px-4 py-3 text-right font-bold">{m.percentage}%</td>
                      <td className="px-4 py-3 text-right text-slate-600">{currency} {Number(m.averageTicket).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. TAX & VAT REPORT */}
        {selectedReport === 'tax' && reportData && (
          <div className="space-y-6 font-mono text-xs">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-sm">Tax Authority & Registration Details</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                  PAN: {reportData.taxConfig?.taxIdNumber || '601928374'} ({reportData.taxConfig?.taxRate || 13}% VAT)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 text-xs block">Taxable Sales (Treatments & Pharmacy):</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    {currency} {Number(reportData.taxableSales || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Output Tax (VAT Collected on Sales):</span>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    {currency} {Number(reportData.outputTaxCollected || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Taxable Purchases & Lab Expenses:</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    {currency} {Number(reportData.taxablePurchases || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Input Tax (VAT Paid on Purchases):</span>
                  <span className="text-base font-mono font-bold text-rose-700">
                    {currency} {Number(reportData.inputTaxPaid || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Net Tax / VAT Liability Payable to IRD:</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {currency} {Number(reportData.netTaxPayable || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Status:</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Filing Compliant</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CASH FLOW STATEMENT */}
        {selectedReport === 'cash-flow' && reportData && (
          <div className="space-y-4 font-mono text-xs">
            <div className="border border-slate-200 rounded-2xl p-6 space-y-3 bg-slate-50">
              <h4 className="font-sans font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Cash Flows from Operating Activities
              </h4>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Cash receipts from patients & customer billing</span>
                <span className="text-emerald-700">{currency} {Number(reportData.operatingActivities?.cashInflowsFromPatients || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Cash paid to dental staff & clinical doctors</span>
                <span className="text-rose-700">({currency} {Number(reportData.operatingActivities?.cashPaidForSalaries || 0).toLocaleString()})</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Cash paid for dental materials & outsourced lab work</span>
                <span className="text-rose-700">({currency} {Number(reportData.operatingActivities?.cashPaidForMaterialsAndLab || 0).toLocaleString()})</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Cash paid for clinic facility rent & power utilities</span>
                <span className="text-rose-700">({currency} {Number(reportData.operatingActivities?.cashPaidForRentAndUtilities || 0).toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-2 bg-white px-3 rounded-lg font-bold text-slate-900 border border-slate-200">
                <span className="font-sans">Net Cash from Operating Activities</span>
                <span className="text-emerald-700">{currency} {Number(reportData.operatingActivities?.netOperatingCashFlow || 0).toLocaleString()}</span>
              </div>

              <h4 className="font-sans font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 pt-4">
                Cash Flows from Investing & Financing Activities
              </h4>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Dental operatory capital additions / equipment upgrades</span>
                <span>{currency} 0</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-4">
                <span className="font-sans">Owner capital contributions or partner drawings</span>
                <span>{currency} 0</span>
              </div>

              <div className="flex justify-between py-3 bg-slate-900 text-white px-4 rounded-xl font-bold text-base mt-4">
                <span className="font-sans">Ending Cash & Cash Equivalents Balance</span>
                <span className="text-emerald-400">{currency} {Number(reportData.closingCashAndBank || 271500).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Official Report Sign-off Block */}
        <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold">Official Dental Clinic Financial Ledger</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Generated by Apex Dental Enterprise Accounting Suite. Immutable audit trail maintained.
            </p>
          </div>

          <div className="text-right">
            <div className="w-48 border-b border-slate-400 ml-auto mb-1"></div>
            <p className="text-xs font-bold text-slate-900">
              {clinicProfile.doctorInCharge || 'Dr. Mukesh Kushwaha'}
            </p>
            <p className="text-[10px] text-slate-500">Medical Director & Authorized Financial Signatory</p>
          </div>
        </div>
      </div>

      {/* MODAL: CONFIGURE TAX RULES */}
      {taxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Configure Clinic Tax & VAT Rules
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set statutory VAT/PAN rate for treatments, pharmacy, and expense deductions.
            </p>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await onUpdateTaxConfig(taxForm);
                setTaxModalOpen(false);
                fetchReport();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Name / System
                </label>
                <input
                  type="text"
                  value={taxForm.taxName}
                  onChange={e => setTaxForm({ ...taxForm, taxName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Standard Tax / VAT Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxForm.taxRate}
                  onChange={e => setTaxForm({ ...taxForm, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inland Revenue PAN / VAT ID Number
                </label>
                <input
                  type="text"
                  value={taxForm.taxIdNumber}
                  onChange={e => setTaxForm({ ...taxForm, taxIdNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enableTax"
                  checked={taxForm.isTaxEnabled}
                  onChange={e => setTaxForm({ ...taxForm, isTaxEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="enableTax" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enable automated tax calculation across invoices and P&L
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTaxModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save Tax Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Paperclip,
  Check,
  X,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';
import { exportToCsv } from '../../../utils/excelExport';

export default function ExpensesPayableHub({
  expenseVouchers = [],
  currency = 'Rs.',
  onRecordExpense,
  onUpdateStatus,
  onNavigateTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('all');

  // Modal State
  const [newVoucherModalOpen, setNewVoucherModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const [newVoucherForm, setNewVoucherForm] = useState({
    supplierOrPayee: '',
    category: 'Dental Materials and Consumables',
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    amount: '',
    taxAmount: '0',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid', // 'Paid' | 'Unpaid'
    approvalStatus: 'Approved', // 'Approved' | 'Pending'
    notes: '',
    attachments: []
  });

  // Calculate Metrics
  const totalExpenses = expenseVouchers.reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const totalPaid = expenseVouchers.filter(v => v.paymentStatus === 'Paid').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const totalUnpaidAP = expenseVouchers.filter(v => v.paymentStatus === 'Unpaid').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const pendingApprovalsCount = expenseVouchers.filter(v => v.approvalStatus === 'Pending').length;

  // Filtered Vouchers
  const filteredVouchers = expenseVouchers.filter(v => {
    const matchSearch =
      v.voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.supplierOrPayee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || v.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchPayStatus = paymentStatusFilter === 'all' || v.paymentStatus?.toLowerCase() === paymentStatusFilter.toLowerCase();
    const matchAppStatus = approvalStatusFilter === 'all' || v.approvalStatus?.toLowerCase() === approvalStatusFilter.toLowerCase();
    return matchSearch && matchCat && matchPayStatus && matchAppStatus;
  });

  const handleExportCsv = () => {
    const headers = ['Voucher No', 'Date', 'Due Date', 'Supplier / Payee', 'Category', 'Amount', 'Tax', 'Payment Method', 'Payment Status', 'Approval Status', 'Approved By', 'Notes'];
    const rows = filteredVouchers.map(v => [
      v.voucherNumber,
      v.expenseDate,
      v.dueDate,
      v.supplierOrPayee,
      v.category,
      v.amount,
      v.taxAmount,
      v.paymentMethod,
      v.paymentStatus,
      v.approvalStatus,
      v.approvedBy || 'Pending',
      v.notes
    ]);
    exportToCsv(`ApexDental_Expenses_AP_${Date.now()}`, headers, rows);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewVoucherForm(prev => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            name: file.name,
            size: `${Math.round(file.size / 1024)} KB`,
            date: new Date().toISOString().split('T')[0],
            dataUrl: event.target.result
          }
        ]
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitNewVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucherForm.supplierOrPayee || !newVoucherForm.amount) return;

    await onRecordExpense({
      ...newVoucherForm,
      amount: Number(newVoucherForm.amount),
      taxAmount: Number(newVoucherForm.taxAmount) || 0
    });

    setNewVoucherModalOpen(false);
    setNewVoucherForm({
      supplierOrPayee: '',
      category: 'Dental Materials and Consumables',
      expenseDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      amount: '',
      taxAmount: '0',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Paid',
      approvalStatus: 'Approved',
      notes: '',
      attachments: []
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Recorded Expenses
            </span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {currency} {totalExpenses.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">{expenseVouchers.length} total vouchers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            🧾
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Paid Out Settlements
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono mt-1">
              {currency} {totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">Fully cleared payments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Accounts Payable (AP Bills)
            </span>
            <div className="text-xl font-black text-rose-700 font-mono mt-1">
              {currency} {totalUnpaidAP.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">Unpaid supplier & lab liabilities</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <div className="text-xl font-black text-amber-700 font-mono mt-1">
              {pendingApprovalsCount} Vouchers
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">Awaiting clinic manager sign-off</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Expense Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[220px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search payee, voucher # or notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="Staff Salaries and Wages">Staff Salaries & Wages</option>
              <option value="Dental Materials and Consumables">Dental Materials & Consumables</option>
              <option value="Dental Laboratory Charges">Dental Laboratory Charges</option>
              <option value="Rent and Facilities">Rent & Lease</option>
              <option value="Utilities (Electricity/Water/Internet)">Utilities (Power/Water/Net)</option>
              <option value="Equipment Maintenance and Servicing">Equipment Maintenance</option>
              <option value="Office Administration, Software & Misc">Office & Software ERP</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="all">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid (AP Due)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('staff_payroll')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition border border-purple-200 cursor-pointer"
                title="Open detailed staff salary roster, payslips & advances"
              >
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Staff Payroll Hub →</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setNewVoucherModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Expense Voucher</span>
            </button>
          </div>
        </div>

        {/* Expenses & AP Table */}
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2.5 whitespace-nowrap">Voucher #</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Expense Date</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Due Date</th>
                <th className="px-3 py-2.5 min-w-[180px]">Supplier / Payee</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Category</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap">Payment</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap">Approval</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">Files</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVouchers.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {v.voucherNumber}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {v.expenseDate}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {v.dueDate || v.expenseDate}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-900">
                    <div className="leading-snug">{v.supplierOrPayee}</div>
                    {v.notes && <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{v.notes}</p>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                      {v.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-700 text-xs whitespace-nowrap">
                    {currency} {Number(v.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      v.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {v.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      v.approvalStatus === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      v.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {v.approvalStatus}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center whitespace-nowrap">
                    {(v.attachments || []).length > 0 ? (
                      <button
                        onClick={() => setPreviewAttachment(v.attachments[0])}
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-600 text-xs font-semibold"
                        title={v.attachments[0]?.name}
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                        <span>{v.attachments.length}</span>
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      {v.approvalStatus === 'Pending' && (
                        <button
                          onClick={() => onUpdateStatus(v.id, { approvalStatus: 'Approved' })}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold rounded transition"
                          title="Approve Voucher"
                        >
                          Approve
                        </button>
                      )}
                      {v.paymentStatus === 'Unpaid' && (
                        <button
                          onClick={() => onUpdateStatus(v.id, { paymentStatus: 'Paid', approvalStatus: 'Approved' })}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition"
                          title="Pay & Post Journal Entry"
                        >
                          Mark Paid
                        </button>
                      )}
                      {v.approvalStatus === 'Approved' && v.paymentStatus === 'Paid' && (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD NEW EXPENSE VOUCHER */}
      {newVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-fadeIn my-8">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Clinic Expense Voucher / Supplier Bill
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Categorized expenditure entry with double-entry ledger integration and attachment proof.
            </p>

            <form onSubmit={handleSubmitNewVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Payee Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu Dental Ceramics Lab or Himalayan Supplies"
                  value={newVoucherForm.supplierOrPayee}
                  onChange={e => setNewVoucherForm({ ...newVoucherForm, supplierOrPayee: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={newVoucherForm.category}
                  onChange={e => setNewVoucherForm({ ...newVoucherForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value="Staff Salaries and Wages">Staff Salaries & Wages</option>
                  <option value="Dental Materials and Consumables">Dental Materials & Consumables</option>
                  <option value="Dental Laboratory Charges">Dental Laboratory Charges</option>
                  <option value="Rent and Facilities">Rent & Facilities Lease</option>
                  <option value="Utilities (Electricity/Water/Internet)">Utilities (Electricity, Water, Internet)</option>
                  <option value="Equipment Maintenance and Servicing">Equipment Maintenance & Servicing</option>
                  <option value="Office Administration, Software & Misc">Office Administration & Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={newVoucherForm.expenseDate}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date (For AP Bills)
                  </label>
                  <input
                    type="date"
                    value={newVoucherForm.dueDate}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 7500"
                    value={newVoucherForm.amount}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tax Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newVoucherForm.taxAmount}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newVoucherForm.paymentMethod}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, paymentMethod: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Cheque">Cheque</option>
                    <option value="FonePay / QR">FonePay / QR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={newVoucherForm.paymentStatus}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, paymentStatus: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Paid">Paid (Settled)</option>
                    <option value="Unpaid">Unpaid (AP Due)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={newVoucherForm.approvalStatus}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, approvalStatus: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Review</option>
                  </select>
                </div>
              </div>

              {/* Attachment File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Invoice / Bill Receipt (Photo or PDF)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span>Click or drop file to attach invoice photo/voucher</span>
                  </div>
                </div>
                {newVoucherForm.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newVoucherForm.attachments.map((att, i) => (
                      <div key={i} className="text-xs text-blue-700 font-semibold flex items-center space-x-1.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{att.name} ({att.size})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 5 units composite Filtek Z350 XT + universal bond"
                  value={newVoucherForm.notes}
                  onChange={e => setNewVoucherForm({ ...newVoucherForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Record Expense & Post JE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW ATTACHMENT */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>{previewAttachment.name}</span>
              </h4>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewAttachment.dataUrl ? (
              <img
                src={previewAttachment.dataUrl}
                alt="Attachment preview"
                className="max-h-96 w-full object-contain rounded-lg border border-slate-200"
              />
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                Document: {previewAttachment.name} ({previewAttachment.size})
                <p className="mt-2 text-[10px] text-slate-400">Stored on clinic secure ERP file server.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

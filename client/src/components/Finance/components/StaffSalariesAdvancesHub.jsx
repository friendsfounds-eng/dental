import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  ChevronRight,
  Filter,
  Check,
  Building2,
  Banknote,
  Send,
  HelpCircle,
  Eye,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Receipt,
  UserCheck
} from 'lucide-react';
import SalaryPayslipModal from './SalaryPayslipModal';

export default function StaffSalariesAdvancesHub({
  staffPayments = [],
  staffAdvances = [],
  payouts = [],
  staffList = [],
  currency = 'Rs.',
  clinicProfile = {},
  onRecordSalaryPayment,
  onUpdatePaymentStatus,
  onRecordAdvance,
  onUpdateAdvanceStatus,
  onRepayAdvance,
  onRecordPayout,
  onUpdatePayoutStatus,
  onOpenWhatsApp
}) {
  // Sub-tabs: 'payroll' | 'advances' | 'payouts'
  const [subTab, setSubTab] = useState('payroll');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [newSalaryModalOpen, setNewSalaryModalOpen] = useState(false);
  const [newAdvanceModalOpen, setNewAdvanceModalOpen] = useState(false);
  const [newPayoutModalOpen, setNewPayoutModalOpen] = useState(false);
  const [repayAdvanceModal, setRepayAdvanceModal] = useState(null);
  const [viewHistoryAdvanceModal, setViewHistoryAdvanceModal] = useState(null);
  const [selectedPayslipPayment, setSelectedPayslipPayment] = useState(null);

  // Default standard staff list if staffList is empty
  const defaultStaffRoster = [
    { id: 'usr-dr-mukesh', name: 'Dr. Mukesh Kushwaha', role: 'Lead Dental Surgeon / Director', baseSalary: 100000, phone: '+977-9801201928' },
    { id: 'usr-dr-anita', name: 'Dr. Anita Sharma', role: 'Consultant Orthodontist', baseSalary: 65000, phone: '+977-9851083921' },
    { id: 'usr-sita-recep', name: 'Sita Thapa', role: 'Front Desk & Receptionist Manager', baseSalary: 32000, phone: '+977-9841289110' },
    { id: 'usr-anjali-nurse', name: 'Anjali Maharjan', role: 'Chairside Dental Assistant & Nurse', baseSalary: 28000, phone: '+977-9812903847' },
    { id: 'usr-bikash-tech', name: 'Bikash Shrestha', role: 'In-House CAD/CAM Milling Technician', baseSalary: 38000, phone: '+977-9860192837' },
    { id: 'usr-ramesh-pharma', name: 'Ramesh Adhikari', role: 'Clinical Pharmacist & Inventory', baseSalary: 30000, phone: '+977-9803928172' }
  ];

  const availableStaff = useMemo(() => {
    if (Array.isArray(staffList) && staffList.length > 0) {
      return staffList.map(s => ({
        id: s.id || `staff-${s.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: s.name,
        role: Array.isArray(s.roles) ? s.roles.join(', ') : (s.role || s.specialization || 'Staff Member'),
        baseSalary: Number(s.baseSalary) || 30000,
        phone: s.phone || ''
      }));
    }
    return defaultStaffRoster;
  }, [staffList]);

  // Unique periods from existing payments
  const availablePeriods = useMemo(() => {
    const set = new Set();
    staffPayments.forEach(p => {
      if (p.period) set.add(p.period);
    });
    set.add('October 2026');
    set.add('November 2026');
    set.add('September 2026');
    return Array.from(set);
  }, [staffPayments]);

  // Form State: New Salary Payment
  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    staffName: '',
    role: '',
    period: 'October 2026',
    salaryType: 'Fixed Monthly',
    baseSalary: 30000,
    allowances: 0,
    deductions: 0,
    advanceDeduction: 0,
    advanceId: '',
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Form State: New Staff Advance
  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    staffName: '',
    role: '',
    amount: '',
    reason: '',
    paymentMethod: 'Bank Transfer',
    disbursedDate: new Date().toISOString().split('T')[0],
    repaymentType: 'MONTHLY_INSTALLMENT',
    installmentAmount: '',
    totalInstallments: 3,
    notes: ''
  });

  // Form State: Repay Advance
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Form State: New Quick Payout
  const [payoutForm, setPayoutForm] = useState({
    recipient: '',
    recipientType: 'Doctor',
    amount: '',
    purpose: '',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Find active advance for a staff member
  const getActiveAdvanceForStaff = (staffId, staffName) => {
    return (staffAdvances || []).find(a => 
      ((staffId && a.staffId === staffId) || (staffName && a.staffName?.toLowerCase() === staffName?.toLowerCase())) &&
      (a.status === 'Active' || a.status === 'Disbursed') &&
      Number(a.balanceRemaining) > 0
    );
  };

  // Staff Selection Change in Salary Modal
  const handleSelectStaffForSalary = (selectedId) => {
    const found = availableStaff.find(s => s.id === selectedId);
    if (!found) return;

    const activeAdv = getActiveAdvanceForStaff(found.id, found.name);
    const suggestedAdvanceRecovery = activeAdv ? Math.min(Number(activeAdv.installmentAmount || activeAdv.balanceRemaining), Number(activeAdv.balanceRemaining)) : 0;

    setSalaryForm(prev => ({
      ...prev,
      staffId: found.id,
      staffName: found.name,
      role: found.role,
      baseSalary: found.baseSalary || 30000,
      advanceDeduction: suggestedAdvanceRecovery,
      advanceId: activeAdv ? activeAdv.id : ''
    }));
  };

  // Staff Selection Change in Advance Modal
  const handleSelectStaffForAdvance = (selectedId) => {
    const found = availableStaff.find(s => s.id === selectedId);
    if (!found) return;
    setAdvanceForm(prev => ({
      ...prev,
      staffId: found.id,
      staffName: found.name,
      role: found.role
    }));
  };

  // Submit New Salary Disbursal
  const handleSubmitSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.staffName) {
      alert('Please select or specify a staff member.');
      return;
    }
    const base = Number(salaryForm.baseSalary) || 0;
    const allowances = Number(salaryForm.allowances) || 0;
    const deductions = Number(salaryForm.deductions) || 0;
    const advanceDeduction = Number(salaryForm.advanceDeduction) || 0;
    const netAmount = Math.max(0, base + allowances - deductions - advanceDeduction);

    await onRecordSalaryPayment({
      ...salaryForm,
      baseSalary: base,
      allowances,
      incentivesOrBonus: allowances,
      deductions,
      advanceDeduction,
      grossEarnings: base + allowances,
      amount: netAmount,
      netAmount
    });

    setNewSalaryModalOpen(false);
  };

  // Submit New Staff Advance
  const handleSubmitAdvance = async (e) => {
    e.preventDefault();
    if (!advanceForm.staffName || !advanceForm.amount) {
      alert('Please specify staff member and advance amount.');
      return;
    }
    const amount = Number(advanceForm.amount);
    const installments = Number(advanceForm.totalInstallments) || 1;
    const installmentAmt = advanceForm.installmentAmount ? Number(advanceForm.installmentAmount) : Math.round(amount / installments);

    await onRecordAdvance({
      ...advanceForm,
      amount,
      installmentAmount: installmentAmt,
      totalInstallments: installments,
      status: 'Active'
    });

    setNewAdvanceModalOpen(false);
    setAdvanceForm({
      staffId: '',
      staffName: '',
      role: '',
      amount: '',
      reason: '',
      paymentMethod: 'Bank Transfer',
      disbursedDate: new Date().toISOString().split('T')[0],
      repaymentType: 'MONTHLY_INSTALLMENT',
      installmentAmount: '',
      totalInstallments: 3,
      notes: ''
    });
  };

  // Submit Manual Advance Repayment
  const handleSubmitRepayment = async (e) => {
    e.preventDefault();
    if (!repayAdvanceModal || !repaymentForm.amount) return;
    const amount = Number(repaymentForm.amount);
    if (amount <= 0 || amount > Number(repayAdvanceModal.balanceRemaining)) {
      alert(`Repayment amount must be between 1 and ${currency} ${Number(repayAdvanceModal.balanceRemaining).toLocaleString()}`);
      return;
    }

    await onRepayAdvance(repayAdvanceModal.id, {
      ...repaymentForm,
      amount
    });

    setRepayAdvanceModal(null);
    setRepaymentForm({
      amount: '',
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Submit New Quick Payout
  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    if (!payoutForm.recipient || !payoutForm.amount) {
      alert('Recipient and amount are required.');
      return;
    }
    await onRecordPayout({
      ...payoutForm,
      amount: Number(payoutForm.amount),
      approvalStatus: 'Paid'
    });
    setNewPayoutModalOpen(false);
    setPayoutForm({
      recipient: '',
      recipientType: 'Doctor',
      amount: '',
      purpose: '',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalPayrollPaid = staffPayments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalPayrollGross = staffPayments
      .reduce((sum, p) => sum + (Number(p.baseSalary || 0) + Number(p.allowances || p.incentivesOrBonus || 0)), 0);

    const pendingPayrollCount = staffPayments.filter(p => p.status === 'Pending').length;

    const totalActiveAdvances = staffAdvances
      .filter(a => a.status === 'Active' || a.status === 'Disbursed')
      .reduce((sum, a) => sum + (Number(a.balanceRemaining) || 0), 0);

    const totalRecoveredAdvances = staffAdvances
      .reduce((sum, a) => sum + (Number(a.recoveredAmount) || 0), 0);

    const activeStaffCount = availableStaff.length;

    return {
      totalPayrollPaid,
      totalPayrollGross,
      pendingPayrollCount,
      totalActiveAdvances,
      totalRecoveredAdvances,
      activeStaffCount
    };
  }, [staffPayments, staffAdvances, availableStaff]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return staffPayments.filter(p => {
      if (periodFilter !== 'all' && p.period?.toLowerCase() !== periodFilter.toLowerCase()) return false;
      if (roleFilter !== 'all' && !p.role?.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.staffName?.toLowerCase().includes(q);
        const matchRole = p.role?.toLowerCase().includes(q);
        const matchRef = (p.refNumber || p.id)?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchRef) return false;
      }
      return true;
    });
  }, [staffPayments, periodFilter, roleFilter, statusFilter, searchQuery]);

  // Filtered Advances
  const filteredAdvances = useMemo(() => {
    return staffAdvances.filter(a => {
      if (statusFilter !== 'all' && a.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.staffName?.toLowerCase().includes(q);
        const matchNum = a.advanceNumber?.toLowerCase().includes(q);
        const matchReason = a.reason?.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchReason) return false;
      }
      return true;
    });
  }, [staffAdvances, statusFilter, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    let rows = [];
    if (subTab === 'payroll') {
      rows = filteredPayments.map(p => ({
        Voucher: p.refNumber || p.id,
        StaffName: p.staffName,
        Role: p.role,
        Period: p.period,
        BaseSalary: p.baseSalary,
        Allowances: p.allowances || p.incentivesOrBonus || 0,
        Deductions: p.deductions || 0,
        AdvanceDeducted: p.advanceDeduction || 0,
        NetPaid: p.amount,
        PaymentMethod: p.paymentMethod,
        Date: p.paymentDate,
        Status: p.status
      }));
    } else if (subTab === 'advances') {
      rows = filteredAdvances.map(a => ({
        AdvanceNumber: a.advanceNumber,
        StaffName: a.staffName,
        Role: a.role,
        PrincipalAmount: a.amount,
        RecoveredSoFar: a.recoveredAmount,
        BalanceRemaining: a.balanceRemaining,
        DisbursedDate: a.disbursedDate,
        RepaymentType: a.repaymentType,
        Installment: a.installmentAmount,
        Status: a.status,
        Reason: a.reason
      }));
    } else {
      rows = payouts.map(p => ({
        PayoutRef: p.refNumber || p.id,
        Recipient: p.recipient,
        Type: p.recipientType,
        Amount: p.amount,
        Purpose: p.purpose,
        Date: p.paymentDate,
        Status: p.approvalStatus
      }));
    }

    if (rows.length === 0) {
      alert('No records to export in the current selection.');
      return;
    }

    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map(r => Object.values(r).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Staff_${subTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Payroll Disbursed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Monthly Payroll Disbursed
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono mt-1">
              {currency} {metrics.totalPayrollPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {staffPayments.filter(p => p.status === 'Paid').length} salaries cleared
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Advances Outstanding */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Staff Advances (Due)
            </span>
            <div className="text-xl font-black text-amber-700 font-mono mt-1">
              {currency} {metrics.totalActiveAdvances.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              {currency} {metrics.totalRecoveredAdvances.toLocaleString()} recovered so far
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Pending Payroll Liabilities */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Payroll Actions
            </span>
            <div className="text-xl font-black text-rose-700 font-mono mt-1">
              {metrics.pendingPayrollCount} Unpaid
            </div>
            <span className="text-[11px] text-slate-500">
              Needs sign-off & disbursement
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Active Payroll Roster */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Enrolled Clinic Staff
            </span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {metrics.activeStaffCount} Employees
            </div>
            <span className="text-[11px] text-slate-500">
              Surgeons, Nurses, Admin, Tech
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation Sub-Tabs & Action Buttons Header */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          
          {/* Sub-Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => { setSubTab('payroll'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                subTab === 'payroll' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📑 Monthly Payroll Sheets</span>
              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px]">
                {staffPayments.length}
              </span>
            </button>

            <button
              onClick={() => { setSubTab('advances'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                subTab === 'advances' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🤝 Staff Advances & Loans</span>
              {staffAdvances.filter(a => a.status === 'Active').length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                  {staffAdvances.filter(a => a.status === 'Active').length} Active
                </span>
              )}
            </button>

            <button
              onClick={() => { setSubTab('payouts'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                subTab === 'payouts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚡ Ad-hoc Payouts & Doctor Fees</span>
              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px]">
                {payouts.length}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {subTab === 'payroll' && (
              <button
                onClick={() => {
                  const defaultStaff = availableStaff[0] || {};
                  const activeAdv = getActiveAdvanceForStaff(defaultStaff.id, defaultStaff.name);
                  setSalaryForm({
                    staffId: defaultStaff.id || '',
                    staffName: defaultStaff.name || '',
                    role: defaultStaff.role || '',
                    period: 'October 2026',
                    salaryType: 'Fixed Monthly',
                    baseSalary: defaultStaff.baseSalary || 30000,
                    allowances: 0,
                    deductions: 0,
                    advanceDeduction: activeAdv ? Math.min(Number(activeAdv.installmentAmount || activeAdv.balanceRemaining), Number(activeAdv.balanceRemaining)) : 0,
                    advanceId: activeAdv ? activeAdv.id : '',
                    paymentMethod: 'Bank Transfer',
                    status: 'Paid',
                    paymentDate: new Date().toISOString().split('T')[0],
                    notes: ''
                  });
                  setNewSalaryModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Disburse / Record Salary</span>
              </button>
            )}

            {subTab === 'advances' && (
              <button
                onClick={() => {
                  const defaultStaff = availableStaff[0] || {};
                  setAdvanceForm({
                    staffId: defaultStaff.id || '',
                    staffName: defaultStaff.name || '',
                    role: defaultStaff.role || '',
                    amount: '',
                    reason: '',
                    paymentMethod: 'Bank Transfer',
                    disbursedDate: new Date().toISOString().split('T')[0],
                    repaymentType: 'MONTHLY_INSTALLMENT',
                    installmentAmount: '',
                    totalInstallments: 3,
                    notes: ''
                  });
                  setNewAdvanceModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Issue Staff Advance</span>
              </button>
            )}

            {subTab === 'payouts' && (
              <button
                onClick={() => setNewPayoutModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Payout / Commission</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={subTab === 'payroll' ? "Search staff name, role, voucher #..." : "Search staff name, advance #, purpose..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            {subTab === 'payroll' && (
              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="all">All Pay Periods</option>
                {availablePeriods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}

            {subTab === 'payroll' && (
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="Doctor">Doctors / Surgeons</option>
                <option value="Receptionist">Front Desk / Reception</option>
                <option value="Assistant">Dental Assistant / Nurse</option>
                <option value="Technician">Lab & CAD/CAM Tech</option>
                <option value="Pharmacist">Pharmacist</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              {subTab === 'payroll' && (
                <>
                  <option value="Paid">Paid / Settled</option>
                  <option value="Pending">Pending Calculation</option>
                  <option value="Approved">Approved</option>
                </>
              )}
              {subTab === 'advances' && (
                <>
                  <option value="Active">Active (In Recovery)</option>
                  <option value="Fully Recovered">Fully Recovered</option>
                  <option value="Pending Approval">Pending Approval</option>
                </>
              )}
            </select>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Showing {subTab === 'payroll' ? filteredPayments.length : (subTab === 'advances' ? filteredAdvances.length : payouts.length)} records
          </div>
        </div>

        {/* SUB-TAB 1: MONTHLY PAYROLL SHEETS TABLE */}
        {subTab === 'payroll' && (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 whitespace-nowrap">Voucher / Pay Ref</th>
                  <th className="px-3 py-2.5 min-w-[170px]">Staff Member & Role</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Pay Period</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Base Salary</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Bonus / Allowances</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Deductions</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Advance Deducted</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Net Paid</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p, idx) => {
                  const base = Number(p.baseSalary) || 0;
                  const allow = Number(p.allowances !== undefined ? p.allowances : p.incentivesOrBonus) || 0;
                  const ded = Number(p.deductions) || 0;
                  const advDed = Number(p.advanceDeduction) || 0;
                  const net = Number(p.netAmount !== undefined ? p.netAmount : p.amount) || Math.max(0, base + allow - ded - advDed);
                  const activeAdv = getActiveAdvanceForStaff(p.staffId, p.staffName);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.refNumber || p.id}
                        <div className="text-[10px] text-slate-400 font-normal font-sans">
                          {p.paymentDate || 'Settled'}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold uppercase">
                            {p.staffName?.slice(0, 2) || 'ST'}
                          </div>
                          <div>
                            <div className="leading-snug">{p.staffName}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{p.role}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                          {p.period}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {currency} {base.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                        {allow > 0 ? `+ ${currency} ${allow.toLocaleString()}` : '-'}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono text-rose-600 whitespace-nowrap">
                        {ded > 0 ? `- ${currency} ${ded.toLocaleString()}` : '-'}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                        {advDed > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-bold">
                            - {currency} {advDed.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        {currency} {net.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Payslip View Button */}
                          <button
                            onClick={() => {
                              const matched = availableStaff.find(s => s.id === p.staffId || s.name === p.staffName);
                              setSelectedPayslipPayment({
                                payment: {
                                  ...p,
                                  phone: p.phone || matched?.phone || ''
                                },
                                advance: activeAdv
                              });
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="Generate / Print official salary slip"
                          >
                            <Printer className="w-3 h-3 text-blue-400" />
                            <span>Payslip</span>
                          </button>

                          {/* Quick Mark as Paid */}
                          {p.status !== 'Paid' && (
                            <button
                              onClick={() => onUpdatePaymentStatus(p.id, { status: 'Paid' })}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Mark Disbursed & Paid"
                            >
                              Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-slate-400 text-xs">
                      No payroll records found matching the current period and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 2: STAFF ADVANCES & LOANS LEDGER */}
        {subTab === 'advances' && (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 whitespace-nowrap">Advance Ref #</th>
                  <th className="px-3 py-2.5 min-w-[170px]">Staff Member & Role</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Disbursed Date</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Principal Advance</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Recovered So Far</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Balance Due</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Repayment Terms</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Reason / Notes</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAdvances.map((a, idx) => {
                  const balance = Number(a.balanceRemaining) || 0;
                  const recovered = Number(a.recoveredAmount) || 0;
                  const principal = Number(a.amount) || 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {a.advanceNumber || a.id}
                        <div className="text-[10px] text-slate-400 font-sans">{a.paymentMethod}</div>
                      </td>

                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        <div className="leading-snug">{a.staffName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{a.role}</div>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {a.disbursedDate}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {currency} {principal.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                        {currency} {recovered.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                        {currency} {balance.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {currency} {Number(a.installmentAmount || principal).toLocaleString()} / month
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {a.installmentsDeducted || 0} of {a.totalInstallments || 1} installments deducted
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-slate-600">
                        <p className="text-[11px] truncate max-w-xs" title={a.reason}>
                          {a.reason || 'Staff Advance'}
                        </p>
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === 'Fully Recovered' ? 'bg-emerald-100 text-emerald-800' :
                          a.status === 'Active' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Manual Repayment Return */}
                          {balance > 0 && (
                            <button
                              onClick={() => {
                                setRepayAdvanceModal(a);
                                setRepaymentForm({
                                  amount: balance,
                                  paymentMethod: 'Cash',
                                  date: new Date().toISOString().split('T')[0],
                                  notes: `Direct cash return against ${a.advanceNumber}`
                                });
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Record direct cash/bank return"
                            >
                              Repay
                            </button>
                          )}

                          {/* View Deductions Timeline */}
                          <button
                            onClick={() => setViewHistoryAdvanceModal(a)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="View payroll deduction history"
                          >
                            History ({a.recoveryHistory?.length || 0})
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAdvances.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-slate-400 text-xs">
                      No staff advance records found. Click "+ Issue Staff Advance" to disburse a new salary advance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 3: AD-HOC PAYOUTS & COMMISSIONS */}
        {subTab === 'payouts' && (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 whitespace-nowrap">Payout Ref #</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Recipient & Classification</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Payment Date</th>
                  <th className="px-3 py-2.5 min-w-[180px]">Purpose / Clinical Service</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Payment Mode</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Approval</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payouts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {p.refNumber || p.id}
                    </td>

                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      <div className="leading-snug">{p.recipient}</div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-normal">
                        {p.recipientType || 'Staff'}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {p.paymentDate?.split('T')[0] || 'N/A'}
                    </td>

                    <td className="px-3 py-2.5 text-slate-700">
                      <div className="leading-snug">{p.purpose}</div>
                      {p.notes && <p className="text-[10px] text-slate-400">{p.notes}</p>}
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {currency} {Number(p.amount).toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {p.paymentMethod}
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.approvalStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        p.approvalStatus === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.approvalStatus}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {p.approvalStatus !== 'Paid' ? (
                        <button
                          onClick={() => onUpdatePayoutStatus(p.id, 'Paid')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {payouts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400 text-xs">
                      No ad-hoc doctor commissions or payouts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROCESS NEW SALARY DISBURSAL */}
      {/* ========================================================================= */}
      {newSalaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💼</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Disburse Staff Salary</h3>
                  <p className="text-xs text-slate-500">Calculate net payout with automated advance recovery</p>
                </div>
              </div>
              <button
                onClick={() => setNewSalaryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSalary} className="space-y-4 text-xs">
              {/* Staff Member Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Employee / Doctor *</label>
                <select
                  value={salaryForm.staffId}
                  onChange={e => handleSelectStaffForSalary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                  required
                >
                  <option value="">-- Choose Staff Member --</option>
                  {availableStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Base: {currency} {(s.baseSalary || 30000).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Advance Warning Banner if Employee has an active advance */}
              {(() => {
                const activeAdv = getActiveAdvanceForStaff(salaryForm.staffId, salaryForm.staffName);
                if (!activeAdv) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                        <span>⚠️</span>
                        <span>Active Salary Advance Found (#{activeAdv.advanceNumber})</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                        Remaining: {currency} {Number(activeAdv.balanceRemaining).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Standard monthly installment: <strong>{currency} {Number(activeAdv.installmentAmount || activeAdv.balanceRemaining).toLocaleString()}</strong>.
                      Advance deduction will automatically reduce the remaining loan balance and log to recovery history.
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Period *</label>
                  <input
                    type="text"
                    value={salaryForm.period}
                    onChange={e => setSalaryForm({ ...salaryForm, period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    placeholder="e.g. October 2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Disbursal Date *</label>
                  <input
                    type="date"
                    value={salaryForm.paymentDate}
                    onChange={e => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Earnings & Deductions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Base Salary ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.baseSalary}
                    onChange={e => setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Allowances / Bonus (+)</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.allowances}
                    onChange={e => setSalaryForm({ ...salaryForm, allowances: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Statutory Deductions (-)</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.deductions}
                    onChange={e => setSalaryForm({ ...salaryForm, deductions: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Advance Deducted (-)</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.advanceDeduction}
                    onChange={e => setSalaryForm({ ...salaryForm, advanceDeduction: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-amber-50 font-mono text-amber-800 font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Net Pay Calculation Display */}
              {(() => {
                const base = Number(salaryForm.baseSalary) || 0;
                const allow = Number(salaryForm.allowances) || 0;
                const ded = Number(salaryForm.deductions) || 0;
                const advDed = Number(salaryForm.advanceDeduction) || 0;
                const net = Math.max(0, base + allow - ded - advDed);

                return (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Net Disbursed Take-Home Pay
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {base.toLocaleString()} + {allow.toLocaleString()} - {ded.toLocaleString()} - {advDed.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {currency} {net.toLocaleString()}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={salaryForm.paymentMethod}
                    onChange={e => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Bank Transfer">Bank Transfer (Nabil Current)</option>
                    <option value="Cash">Cash in Register</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Digital Clearing">Digital Clearing / Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={salaryForm.status}
                    onChange={e => setSalaryForm({ ...salaryForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Paid">Disbursed & Paid (Auto Journal Entry)</option>
                    <option value="Pending">Pending Month-End Verification</option>
                    <option value="Approved">Approved for Disbursal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Voucher Notes</label>
                <input
                  type="text"
                  value={salaryForm.notes}
                  onChange={e => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  placeholder="e.g. Includes surgical implant bonus & overtime"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewSalaryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Post Salary Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ISSUE NEW STAFF ADVANCE */}
      {/* ========================================================================= */}
      {newAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤝</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Issue Staff Salary Advance</h3>
                  <p className="text-xs text-slate-500">Record employee advance with automated installment schedule</p>
                </div>
              </div>
              <button
                onClick={() => setNewAdvanceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Employee *</label>
                <select
                  value={advanceForm.staffId}
                  onChange={e => handleSelectStaffForAdvance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium"
                  required
                >
                  <option value="">-- Choose Staff Member --</option>
                  {availableStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Advance Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={advanceForm.amount}
                    onChange={e => {
                      const amt = Number(e.target.value);
                      const inst = Number(advanceForm.totalInstallments) || 1;
                      setAdvanceForm({
                        ...advanceForm,
                        amount: amt,
                        installmentAmount: Math.round(amt / inst)
                      });
                    }}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Disbursal Date *</label>
                  <input
                    type="date"
                    value={advanceForm.disbursedDate}
                    onChange={e => setAdvanceForm({ ...advanceForm, disbursedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Advance Purpose / Reason *</label>
                <input
                  type="text"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="e.g. Family medical emergency, festival advance, home renovation"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  required
                />
              </div>

              {/* Repayment Schedule */}
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Repayment Plan</label>
                  <select
                    value={advanceForm.repaymentType}
                    onChange={e => setAdvanceForm({ ...advanceForm, repaymentType: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="MONTHLY_INSTALLMENT">Monthly Installments</option>
                    <option value="LUMP_SUM">Lump Sum on Next Pay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Total Installments</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={advanceForm.totalInstallments}
                    onChange={e => {
                      const inst = Number(e.target.value) || 1;
                      const amt = Number(advanceForm.amount) || 0;
                      setAdvanceForm({
                        ...advanceForm,
                        totalInstallments: inst,
                        installmentAmount: Math.round(amt / inst)
                      });
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">Deduction / Mo ({currency})</label>
                  <input
                    type="number"
                    value={advanceForm.installmentAmount}
                    onChange={e => setAdvanceForm({ ...advanceForm, installmentAmount: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursal Payment Method</label>
                <select
                  value={advanceForm.paymentMethod}
                  onChange={e => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (Corporate Account)</option>
                  <option value="Cash">Cash in Reception Drawer</option>
                  <option value="Digital Payments Clearing">Digital Clearing / FonePay</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewAdvanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MANUAL CASH / BANK ADVANCE RETURN */}
      {/* ========================================================================= */}
      {repayAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Direct Advance Return</h3>
                <p className="text-xs text-slate-500">Record cash/bank return against Advance #{repayAdvanceModal.advanceNumber}</p>
              </div>
              <button
                onClick={() => setRepayAdvanceModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRepayment} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-bold text-slate-900">{repayAdvanceModal.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {currency} {Number(repayAdvanceModal.balanceRemaining).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Repayment Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  max={repayAdvanceModal.balanceRemaining}
                  value={repaymentForm.amount}
                  onChange={e => setRepaymentForm({ ...repaymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={repaymentForm.paymentMethod}
                    onChange={e => setRepaymentForm({ ...repaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Cash">Cash in Drawer</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Digital Wallet">Digital Clearing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={repaymentForm.date}
                    onChange={e => setRepaymentForm({ ...repaymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes</label>
                <input
                  type="text"
                  value={repaymentForm.notes}
                  onChange={e => setRepaymentForm({ ...repaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRepayAdvanceModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Record Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADVANCE RECOVERY HISTORY TIMELINE */}
      {/* ========================================================================= */}
      {viewHistoryAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Advance Recovery History</h3>
                <p className="text-xs text-slate-500">#{viewHistoryAdvanceModal.advanceNumber} • {viewHistoryAdvanceModal.staffName}</p>
              </div>
              <button
                onClick={() => setViewHistoryAdvanceModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Principal</span>
                  <span className="font-bold text-slate-800">{currency} {Number(viewHistoryAdvanceModal.amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Recovered</span>
                  <span className="font-bold text-emerald-700">{currency} {Number(viewHistoryAdvanceModal.recoveredAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Balance Due</span>
                  <span className="font-bold text-rose-700">{currency} {Number(viewHistoryAdvanceModal.balanceRemaining).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Deduction & Repayment Timeline
                </span>
                {(viewHistoryAdvanceModal.recoveryHistory || []).length > 0 ? (
                  <div className="space-y-1.5">
                    {viewHistoryAdvanceModal.recoveryHistory.map((h, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">
                            {h.payrollPeriod || 'Direct Repayment Return'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {h.date} • {h.voucherNumber || h.paymentMethod || 'Payroll deduction'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          - {currency} {Number(h.amountDeducted).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-3 text-center">
                    No installments recovered yet. Deduction will start upon next payroll disbursal.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewHistoryAdvanceModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECORD AD-HOC PAYOUT / DOCTOR COMMISSION */}
      {/* ========================================================================= */}
      {newPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Payout / Doctor Incentive</h3>
                <p className="text-xs text-slate-500">Ad-hoc surgical shares, overtime, or consultant clinical fees</p>
              </div>
              <button
                onClick={() => setNewPayoutModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recipient Name *</label>
                <input
                  type="text"
                  value={payoutForm.recipient}
                  onChange={e => setPayoutForm({ ...payoutForm, recipient: e.target.value })}
                  placeholder="e.g. Dr. Anita Sharma (Consultant Fee)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recipient Type</label>
                  <select
                    value={payoutForm.recipientType}
                    onChange={e => setPayoutForm({ ...payoutForm, recipientType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Doctor">Doctor / Dental Surgeon</option>
                    <option value="Staff">Clinical Staff</option>
                    <option value="Consultant">Visiting Consultant</option>
                    <option value="Laboratory">Dental Laboratory</option>
                    <option value="Other">Other Payout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={payoutForm.amount}
                    onChange={e => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })}
                    placeholder="e.g. 12500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Purpose / Clinical Procedure *</label>
                <input
                  type="text"
                  value={payoutForm.purpose}
                  onChange={e => setPayoutForm({ ...payoutForm, purpose: e.target.value })}
                  placeholder="e.g. 50% Share for 2 Full Mouth Clear Aligner Cases"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={e => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash in Drawer</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payoutForm.paymentDate}
                    onChange={e => setPayoutForm({ ...payoutForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewPayoutModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Record Disbursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: OFFICIAL SALARY PAYSLIP VIEWER */}
      {/* ========================================================================= */}
      {selectedPayslipPayment && (
        <SalaryPayslipModal
          payment={selectedPayslipPayment.payment}
          advance={selectedPayslipPayment.advance}
          clinicProfile={clinicProfile}
          onClose={() => setSelectedPayslipPayment(null)}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

    </div>
  );
}

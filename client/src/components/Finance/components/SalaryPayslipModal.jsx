import React from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

export default function SalaryPayslipModal({
  payment,
  advance,
  clinicProfile = {},
  onClose,
  onOpenWhatsApp
}) {
  if (!payment) return null;

  const currency = clinicProfile.currency || 'Rs.';
  const clinicName = clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre';
  const clinicAddress = clinicProfile.address || 'New Baneshwor, Kathmandu, Nepal';
  const clinicPhone = clinicProfile.phone || '+977-1-4782910';
  const clinicEmail = clinicProfile.email || 'accounts@nepaldental.com.np';

  const baseSalary = Number(payment.baseSalary) || 0;
  const allowances = Number(payment.allowances !== undefined ? payment.allowances : payment.incentivesOrBonus) || 0;
  const grossEarnings = payment.grossEarnings || (baseSalary + allowances);
  const deductions = Number(payment.deductions) || 0;
  const advanceDeduction = Number(payment.advanceDeduction) || 0;
  const totalDeductions = deductions + advanceDeduction;
  const netAmount = Number(payment.netAmount !== undefined ? payment.netAmount : payment.amount) || (grossEarnings - totalDeductions);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!onOpenWhatsApp) return;
    const text = `*SALARY PAYSLIP - ${clinicName.toUpperCase()}*\n` +
      `--------------------------------\n` +
      `*Staff Member:* ${payment.staffName} (${payment.role})\n` +
      `*Pay Period:* ${payment.period}\n` +
      `*Voucher Ref:* ${payment.refNumber || payment.id}\n` +
      `*Date:* ${payment.paymentDate || 'N/A'}\n\n` +
      `*Gross Earnings:* ${currency} ${grossEarnings.toLocaleString()}\n` +
      `• Basic Salary: ${currency} ${baseSalary.toLocaleString()}\n` +
      (allowances > 0 ? `• Allowances/Bonuses: ${currency} ${allowances.toLocaleString()}\n` : '') +
      `\n*Deductions:* ${currency} ${totalDeductions.toLocaleString()}\n` +
      (deductions > 0 ? `• Statutory/PF Deductions: ${currency} ${deductions.toLocaleString()}\n` : '') +
      (advanceDeduction > 0 ? `• Advance Recovery: ${currency} ${advanceDeduction.toLocaleString()}\n` : '') +
      `\n*NET SALARY PAID:* ${currency} ${netAmount.toLocaleString()}\n` +
      `*Payment Method:* ${payment.paymentMethod || 'Bank Transfer'}\n` +
      `*Status:* ${payment.status}\n` +
      `--------------------------------\n` +
      `_This is a computer-generated salary payment voucher._`;

    onOpenWhatsApp({
      phone: payment.phone || '',
      message: text
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Modal Top Bar (Non-Printable) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xl">💼</span>
            <div>
              <h2 className="text-sm font-black tracking-tight">Staff Salary Payslip</h2>
              <p className="text-[11px] text-slate-400 font-mono">Ref: {payment.refNumber || payment.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              title="Print official pay slip"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print</span>
            </button>
            {onOpenWhatsApp && (
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                title="Send via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTAINER */}
        <div className="p-8 space-y-6 printable-receipt text-slate-800" id="payslip-printable-area">
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🦷</span>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {clinicName}
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">{clinicAddress}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Phone: {clinicPhone} | Email: {clinicEmail}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase rounded">
                CONFIDENTIAL PAYSLIP
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1.5 font-mono">
                {payment.period}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Date: {payment.paymentDate || new Date().toISOString().split('T')[0]}
              </p>
            </div>
          </div>

          {/* Employee & Disbursal Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Staff Member</span>
              <span className="font-black text-slate-900 block mt-0.5">{payment.staffName}</span>
              <span className="text-[11px] text-slate-600 block">{payment.role}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Voucher Ref #</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">{payment.refNumber || payment.id}</span>
              <span className="text-[10px] text-slate-500 font-mono">{payment.salaryType || 'Fixed Monthly'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Mode</span>
              <span className="font-bold text-slate-900 block mt-0.5">{payment.paymentMethod || 'Bank Transfer'}</span>
              <span className="text-[10px] text-slate-500">Corporate Current Account</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Disbursal Status</span>
              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 ${
                payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>{payment.status}</span>
              </span>
            </div>
          </div>

          {/* Detailed Earnings vs Deductions Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Gross Earnings
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">Credit (+)</span>
              </div>
              <div className="p-3 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Basic Monthly Salary</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currency} {baseSalary.toLocaleString()}
                  </span>
                </div>
                {allowances > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Incentives / Procedure Bonus / Overtime</span>
                    <span className="font-mono font-bold text-emerald-700">
                      + {currency} {allowances.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-slate-900">
                  <span>Total Gross Earnings</span>
                  <span className="font-mono font-black text-emerald-800">
                    {currency} {grossEarnings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions & Advance Recovery Column */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex items-center justify-between">
                <span className="text-xs font-black text-rose-900 uppercase tracking-wider">
                  Deductions & Recoveries
                </span>
                <span className="text-[10px] text-rose-700 font-bold">Debit (-)</span>
              </div>
              <div className="p-3 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Statutory Tax / TDS / PF</span>
                  <span className="font-mono font-bold text-slate-900">
                    {deductions > 0 ? `- ${currency} ${deductions.toLocaleString()}` : 'Rs. 0'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600 block">Staff Advance Deduction</span>
                    {payment.advanceId && (
                      <span className="text-[10px] text-amber-600 font-mono block">
                        Linked Advance #{payment.advanceId}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-amber-700">
                    {advanceDeduction > 0 ? `- ${currency} ${advanceDeduction.toLocaleString()}` : 'Rs. 0'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="font-mono font-black text-rose-700">
                    - {currency} {totalDeductions.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NET TAKE-HOME SALARY HIGHLIGHT BOX */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Net Disbursed Take-Home Salary
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated as (Gross Earnings - Statutory Deductions - Salary Advance Recovery)
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {currency} {netAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                Transferred via {payment.paymentMethod || 'Bank Transfer'}
              </span>
            </div>
          </div>

          {/* Active Advance Summary Note if Applicable */}
          {advance && advance.balanceRemaining > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs flex items-center justify-between text-amber-900">
              <div className="flex items-center space-x-2">
                <span>🤝</span>
                <span>
                  <strong>Staff Advance Status:</strong> Installment recovered this period: {currency} {advanceDeduction.toLocaleString()}.
                  Remaining advance loan balance: <strong>{currency} {Number(advance.balanceRemaining).toLocaleString()}</strong>.
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">
                In Recovery
              </span>
            </div>
          )}

          {payment.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Voucher Notes: </span>
              {payment.notes}
            </div>
          )}

          {/* Signatures & Verification Seal */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-12 flex items-end justify-center font-serif italic text-slate-600">
                {payment.disbursedBy || 'Dr. Mukesh Kushwaha'}
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                Clinic Director / Authorized Signatory
              </div>
              <span className="text-[10px] text-slate-400 block">{clinicName}</span>
            </div>
            <div>
              <div className="h-12 flex items-end justify-center font-serif italic text-slate-600">
                {payment.staffName}
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                Employee Signature / Acknowledgement
              </div>
              <span className="text-[10px] text-slate-400 block">{payment.role}</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 pt-2 font-mono">
            System Generated Voucher #{payment.refNumber || payment.id} • GAAP Double-Entry Payroll Module
          </p>
        </div>

        {/* Modal Bottom Footer (Non-Printable) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500 font-mono">
            Audit ID: {payment.id}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

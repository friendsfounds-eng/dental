import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Receipt,
  Building,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';
import { exportToA4Pdf } from '../../../utils/pdfExport';

export default function ReceiptVoucherModal({
  receipt,
  clinicProfile = {},
  onClose,
  onOpenWhatsApp
}) {
  if (!receipt) return null;

  const currency = clinicProfile.currency || 'Rs.';
  const receiptElementId = `printable-receipt-${receipt.receiptNumber || receipt.id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const filename = `Receipt_${receipt.receiptNumber}_${(receipt.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    await exportToA4Pdf(receiptElementId, filename);
  };

  const handleShareWhatsApp = () => {
    if (!onOpenWhatsApp || !receipt.patientPhone) {
      alert('Patient phone number not found for direct WhatsApp message.');
      return;
    }
    const msg = `Dear *${receipt.patientName}*,\n\nHere is your official *Payment Receipt* from *${clinicProfile.name || 'Apex Dental'}*:\n\n🧾 *Receipt No:* #${receipt.receiptNumber}\n📅 *Date:* ${receipt.date}\n💰 *Amount Paid:* ${currency} ${Number(receipt.amount || 0).toLocaleString()}\n💳 *Payment Method:* ${receipt.paymentMethod || 'Cash'}\n🏷️ *Payment Type:* ${receipt.paymentType || 'Treatment Payment'}\n${receipt.refNumber ? `🔢 *Ref:* ${receipt.refNumber}\n` : ''}${receipt.notes ? `📝 *Notes:* ${receipt.notes}\n` : ''}\nThank you for choosing ${clinicProfile.name || 'Apex Dental'}! For inquiries, call ${clinicProfile.phone || '+977 98012 34567'}.`;
    onOpenWhatsApp(receipt.patientPhone, msg);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fadeIn my-8">
        {/* Header Controls */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Official Payment Receipt Voucher</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              title="Download Receipt as A4 PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              title="Print Receipt Voucher"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print</span>
            </button>
            {receipt.patientPhone && (
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                title="Send Receipt via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 bg-white" id={receiptElementId}>
          {/* Clinic Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  🦷
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {clinicProfile.name || 'Nepal Dental & Healthcare Wellness Centre'}
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                {clinicProfile.address || 'New Baneshwor, Kathmandu, Nepal'}
              </p>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                <span>Tel: {clinicProfile.phone || '+977 1 4782910'}</span>
                <span>•</span>
                <span>PAN / VAT: {clinicProfile.panVat || '601928374'}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                Verified Receipt
              </span>
              <p className="text-sm font-black text-slate-900">
                #{receipt.receiptNumber}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(receipt.date || receipt.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Patient Details & Voucher Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Received From (Patient)
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{receipt.patientName}</p>
              {receipt.patientId && (
                <p className="text-slate-500">Patient ID: <span className="font-mono">{receipt.patientId}</span></p>
              )}
              {receipt.patientPhone && (
                <p className="text-slate-500">Phone: {receipt.patientPhone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Payment Specification
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {receipt.paymentType === 'ADVANCE_DEPOSIT' ? 'Advance Deposit Credit' :
                 receipt.paymentType === 'CONSULTATION_FEE' ? 'Doctor Consultation Fee' :
                 'Treatment Invoice Settlement'}
              </p>
              <p className="text-slate-500">Method: <span className="font-semibold text-slate-700">{receipt.paymentMethod || 'Cash'}</span></p>
              {receipt.refNumber && (
                <p className="text-slate-500">Ref / Txn: <span className="font-mono text-slate-700">{receipt.refNumber}</span></p>
              )}
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 text-center my-6">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-1">
              Amount Paid & Settled
            </span>
            <div className="text-4xl font-black text-emerald-700 font-mono">
              {currency} {Number(receipt.amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Payment Confirmed • Fully Auditable Ledger Entry
            </p>
          </div>

          {/* Notes or Memo */}
          {receipt.notes && (
            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-700">Remarks: </span>
              {receipt.notes}
            </div>
          )}

          {/* Footer & Authorized Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold">System Generated & Digitally Verified</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Printed via Apex Dental Cloud ERP • Valid official tax receipt for all medical tax rebates.
              </p>
            </div>

            <div className="text-right">
              <div className="w-40 border-b border-slate-400 ml-auto mb-1"></div>
              <p className="text-xs font-bold text-slate-800">
                {receipt.issuedBy || clinicProfile.doctorInCharge || 'Authorized Cashier'}
              </p>
              <p className="text-[10px] text-slate-500">Authorized Signature & Stamp</p>
            </div>
          </div>
        </div>

        {/* Modal Close Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

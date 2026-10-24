import React, { useState } from 'react';
import {
  Building2,
  QrCode,
  Edit3,
  CreditCard,
  Wallet,
  CheckCircle2,
  Lock,
  UploadCloud,
  Layers,
  X
} from 'lucide-react';

export default function BankAccountsHub({
  accountDetails,
  currency = 'Rs.',
  onUpdateAccount
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: accountDetails?.accountHolderName || '',
    bankName: accountDetails?.bankName || '',
    accountNumber: accountDetails?.accountNumber || '',
    branch: accountDetails?.branch || '',
    routingOrSwift: accountDetails?.routingOrSwift || '',
    paymentIdentifier: accountDetails?.paymentIdentifier || '',
    fonepayMerchantId: accountDetails?.fonepayMerchantId || '',
    qrCodeUrl: accountDetails?.qrCodeUrl || '',
    notes: accountDetails?.notes || ''
  });

  const handleOpenEdit = () => {
    setForm({
      accountHolderName: accountDetails?.accountHolderName || '',
      bankName: accountDetails?.bankName || '',
      accountNumber: accountDetails?.accountNumber || '',
      branch: accountDetails?.branch || '',
      routingOrSwift: accountDetails?.routingOrSwift || '',
      paymentIdentifier: accountDetails?.paymentIdentifier || '',
      fonepayMerchantId: accountDetails?.fonepayMerchantId || '',
      qrCodeUrl: accountDetails?.qrCodeUrl || '',
      notes: accountDetails?.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdateAccount(form);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Clinic Receiving Bank Accounts & Digital Payment Gateways
          </h3>
          <p className="text-xs text-slate-500">
            Official banking channels for patient collections, FonePay QR scanning, and corporate financial settlements.
          </p>
        </div>

        <button
          onClick={handleOpenEdit}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Account Details</span>
        </button>
      </div>

      {/* Main Grid: Bank Card & QR Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nabil Bank Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Primary Operating Account
              </span>
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bank Institution</span>
                <span className="text-lg font-bold text-white tracking-wide">
                  {accountDetails?.bankName || 'Nabil Bank Limited'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Number</span>
                <span className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
                  {accountDetails?.accountNumber || '01201017500982'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Holder Name</span>
                <span className="text-xs font-semibold text-slate-200">
                  {accountDetails?.accountHolderName || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/60 mt-6 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 block">Branch:</span>
              <span>{accountDetails?.branch || 'New Baneshwor, Kathmandu'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SWIFT / Routing:</span>
              <span className="font-mono">{accountDetails?.routingOrSwift || 'NARBNPKA'}</span>
            </div>
          </div>
        </div>

        {/* FonePay & Digital Clearing Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">FonePay QR & Digital Gateway</h4>
              <p className="text-xs text-slate-500">
                Instant patient payment scanning for eSewa, Khalti, and all Nepalese commercial banking apps.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center space-x-6 p-4 bg-slate-50 rounded-xl border border-slate-200 my-2">
            <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-300 flex items-center justify-center shrink-0">
              {accountDetails?.qrCodeUrl ? (
                <img
                  src={accountDetails.qrCodeUrl}
                  alt="Fonepay QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-16 h-16 text-slate-400" />
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Merchant Phone / ID</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {accountDetails?.fonepayMerchantId || '9841987654'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">UPI / Identifier</span>
                <span className="font-mono text-slate-700">
                  {accountDetails?.paymentIdentifier || 'nepaldental@nabil'}
                </span>
              </div>
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                Instant Settlement Active
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Dynamic QR codes are generated automatically on each patient invoice and printed bill for touchless payments.
          </p>
        </div>
      </div>

      {/* Cash Drawer Float Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-1">Front Desk Reception Cash Drawer Float</h4>
        <p className="text-xs text-slate-500 mb-4">
          Base cash float retained in register counter for daily change return and petty transactions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Standard Opening Float</span>
            <span className="text-lg font-mono font-bold text-slate-900 mt-1 block">
              {currency} 10,000
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Maximum Drawer Vault Limit</span>
            <span className="text-lg font-mono font-bold text-slate-900 mt-1 block">
              {currency} 50,000
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Bank Deposit Schedule</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">
              Daily at 5:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-fadeIn my-8">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Edit Organization Receiving Account
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update clinic bank details, branch, SWIFT, and FonePay merchant identifiers.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={form.accountHolderName}
                  onChange={e => setForm({ ...form, accountHolderName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Location
                  </label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SWIFT / Routing Code
                  </label>
                  <input
                    type="text"
                    value={form.routingOrSwift}
                    onChange={e => setForm({ ...form, routingOrSwift: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    FonePay Merchant ID / Phone
                  </label>
                  <input
                    type="text"
                    value={form.fonepayMerchantId}
                    onChange={e => setForm({ ...form, fonepayMerchantId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment ID / UPI Handle
                  </label>
                  <input
                    type="text"
                    value={form.paymentIdentifier}
                    onChange={e => setForm({ ...form, paymentIdentifier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  QR Code Image URL / Path
                </label>
                <input
                  type="text"
                  value={form.qrCodeUrl}
                  onChange={e => setForm({ ...form, qrCodeUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save Banking Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

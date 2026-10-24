import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  Check,
  User,
  Sparkles,
  PhoneCall,
  Receipt,
  FileCheck,
  Link2,
  ExternalLink,
  Share2,
  Smartphone,
  Globe,
  RefreshCw,
  Search,
  CheckCheck
} from 'lucide-react';
import {
  formatNepalWhatsAppPhone,
  generateWhatsAppAutoLink,
  generateClientPortalLink
} from '../../utils/whatsapp';

export default function WhatsAppCRM({
  patients = [],
  appointments = [],
  templates = [],
  clinicProfile = {}
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [customPhone, setCustomPhone] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || 'TPL-APPT-CONFIRM');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const currency = clinicProfile.currency || 'Rs.';

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const patientAppt = appointments.find(a => a.patientId === selectedPatient?.id) || appointments[0];

  // Effective phone number (allows manual phone input or defaults to selected patient's phone)
  const targetPhone = customPhone || selectedPatient?.phone || '';
  const formattedNepalPhone = formatNepalWhatsAppPhone(targetPhone);

  // Client Digital Portal Link for template replacement & sharing
  const clientPortalUrl = generateClientPortalLink(selectedPatient?.id, clinicProfile);

  // Replace template variables
  const generateMessage = (templateBody) => {
    if (!templateBody) return '';

    const patientName = selectedPatient?.name || 'Patient';
    const clinicName = clinicProfile.name || 'Apex Dentocare & Implant Center';
    const clinicPhone = clinicProfile.phone || '+977 98012 34567';
    const clinicAddress = clinicProfile.address || 'Kathmandu, Nepal';
    const apptDate = patientAppt?.date || '2026-10-22';
    const apptTime = patientAppt?.time || '10:30 AM';
    const doctorName = patientAppt?.doctorName || clinicProfile.doctorInCharge || 'Dr. Yugal Sharma';
    const toothNumber = selectedPatient?.treatmentPlans?.[0]?.tooth || '16';
    const invNumber = selectedPatient?.invoices?.[0]?.invoiceNumber || 'INV-2026-0042';
    const invTotal = `${currency} ${(selectedPatient?.invoices?.[0]?.total || 1500).toLocaleString()}`;
    const invPaid = `${currency} ${(selectedPatient?.invoices?.[0]?.paid || 1500).toLocaleString()}`;
    const invBalance = `${currency} ${(selectedPatient?.invoices?.[0]?.balance || 0).toLocaleString()}`;

    return templateBody
      .replace(/{patientName}/g, patientName)
      .replace(/{clinicName}/g, clinicName)
      .replace(/{clinicPhone}/g, clinicPhone)
      .replace(/{clinicAddress}/g, clinicAddress)
      .replace(/{appointmentDate}/g, apptDate)
      .replace(/{appointmentTime}/g, apptTime)
      .replace(/{doctorName}/g, doctorName)
      .replace(/{toothNumber}/g, toothNumber)
      .replace(/{invoiceNumber}/g, invNumber)
      .replace(/{totalAmount}/g, invTotal)
      .replace(/{paidAmount}/g, invPaid)
      .replace(/{balanceDue}/g, invBalance)
      .replace(/{autoLink}/g, clientPortalUrl)
      .replace(/{portalLink}/g, clientPortalUrl)
      .replace(/{clientLink}/g, clientPortalUrl);
  };

  const activeMessage = customMessage || generateMessage(selectedTemplate?.body);

  // Auto generated universal WhatsApp links
  const autoWhatsAppLink = generateWhatsAppAutoLink(targetPhone, activeMessage);
  const shortAutoLink = generateWhatsAppAutoLink(targetPhone, '');

  const handleSendWhatsApp = (e) => {
    if (e) e.preventDefault();
    if (!formattedNepalPhone) {
      alert('Please select a patient or enter a valid mobile number.');
      return;
    }
    window.open(autoWhatsAppLink, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAutoLink = () => {
    if (!autoWhatsAppLink) return;
    navigator.clipboard.writeText(autoWhatsAppLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleInsertPortalLink = () => {
    const linkNote = `\n\n🔗 *Patient Digital Portal Auto Link:*\n${clientPortalUrl}`;
    if (!activeMessage.includes(clientPortalUrl)) {
      setCustomMessage(activeMessage + linkNote);
    }
  };

  const handleInsertPaymentInfo = () => {
    const payNote = `\n\n💳 *Digital Payment Options:*\neSewa / Khalti / Fonepay to clinic number: ${clinicProfile.phone || '+977 98012 34567'}`;
    if (!activeMessage.includes('Fonepay')) {
      setCustomMessage(activeMessage + payNote);
    }
  };

  const handleInsertLocation = () => {
    const locNote = `\n\n📍 *Clinic Location:*\n${clinicProfile.address || 'Kathmandu, Nepal'}\nGoogle Maps: https://maps.google.com/?q=${encodeURIComponent(clinicProfile.name || 'Apex Dental Kathmandu')}`;
    if (!activeMessage.includes('Google Maps')) {
      setCustomMessage(activeMessage + locNote);
    }
  };

  const handleResetTemplate = () => {
    setCustomMessage('');
  };

  // Filter patients for dropdown
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch) ||
    p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>WhatsApp Automation & Practice CRM</span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {clinicProfile.name || 'Apex Dentocare & Implant Center'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Auto-generate direct WhatsApp messaging links (`wa.me`) to instantly send confirmations, digital bills, prescriptions & recall notices to clients.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Meta WhatsApp Auto Link Active (+977 Nepal)</span>
        </div>
      </div>

      {/* AUTO LINK HIGHLIGHT BANNER */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border-2 border-emerald-400/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                  ⚡ Client Direct WhatsApp Auto Link
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  wa.me Gateway
                </span>
                {formattedNepalPhone && (
                  <span className="text-[11px] font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                    Target: +{formattedNepalPhone}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Click <strong>"Send via Auto Link"</strong> to launch WhatsApp instantly, or <strong>"Copy Auto Link"</strong> to share this exact chat link via any device or browser.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on Auto Link Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyAutoLink}
              disabled={!formattedNepalPhone}
              className="flex items-center space-x-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              title="Copy the direct wa.me auto link to clipboard"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-700" />}
              <span>{copiedLink ? 'Auto Link Copied!' : 'Copy Auto Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!formattedNepalPhone}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-md disabled:opacity-50"
              title="Open WhatsApp chat with client directly"
            >
              <Send className="w-4 h-4" />
              <span>Send via Auto Link</span>
            </button>
          </div>
        </div>

        {/* Live Auto Link URL Bar */}
        <div className="flex items-center space-x-2 bg-white rounded-xl p-2.5 border border-emerald-300 shadow-2xs">
          <Globe className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-1" />
          <input
            type="text"
            readOnly
            value={autoWhatsAppLink || 'Select a patient with a valid mobile number to generate auto link...'}
            className="w-full text-xs font-mono text-emerald-900 bg-transparent border-none focus:outline-none truncate select-all font-medium cursor-text"
            title="Click and copy this live WhatsApp link"
            onClick={(e) => e.target.select()}
          />
          {formattedNepalPhone && (
            <button
              type="button"
              onClick={handleCopyAutoLink}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition flex-shrink-0"
            >
              {copiedLink ? 'Copied' : 'Copy URL'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Patient & Template */}
        <div className="space-y-4">
          {/* Patient Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select Recipient Client
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {patients.length} Registered
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient by name or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                setCustomPhone('');
                setCustomMessage('');
              }}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.phone} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Manual / Custom Client Phone Input Option */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Direct Mobile Override (Nepal +977)
              </label>
              {customPhone && (
                <button
                  type="button"
                  onClick={() => setCustomPhone('')}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  Reset to Patient Phone
                </button>
              )}
            </div>
            <input
              type="tel"
              placeholder={selectedPatient?.phone || 'e.g. 9801197710'}
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Leave blank to use selected patient's phone number ({selectedPatient?.phone || 'None'}).
            </p>
          </div>

          {/* Selected Patient Quick Card */}
          {selectedPatient && (
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{selectedPatient.name}</span>
                <span className="text-emerald-700 font-mono font-bold">
                  {targetPhone}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Age: {selectedPatient.age} yrs | Blood: {selectedPatient.bloodGroup || 'N/A'} | ID: {selectedPatient.id}
              </div>
              {patientAppt && (
                <div className="pt-1.5 border-t border-emerald-200/60 text-slate-700 text-[11px] space-y-0.5">
                  <div><strong>Next Appointment:</strong> {patientAppt.date} at {patientAppt.time}</div>
                  <div className="text-slate-500 text-[10px]">Procedure: {patientAppt.treatmentType} ({patientAppt.doctorName})</div>
                </div>
              )}
            </div>
          )}

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Select Message Template
            </label>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setCustomMessage('');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                    selectedTemplateId === tpl.id
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="pr-2">
                    <span className="block leading-tight">{tpl.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{tpl.category}</span>
                  </div>
                  {selectedTemplateId === tpl.id && (
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Live WhatsApp Preview & Action */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Live WhatsApp Preview & Auto Link Editor
            </label>
            <span className="text-[11px] text-slate-500">
              {activeMessage.length} characters
            </span>
          </div>

          {/* Quick Insert Auto Links Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Quick Insert:
            </span>
            <button
              type="button"
              onClick={handleInsertPortalLink}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center space-x-1"
              title="Add clickable patient portal auto link inside message"
            >
              <Link2 className="w-3 h-3 text-emerald-600" />
              <span>+ Portal Auto Link</span>
            </button>
            <button
              type="button"
              onClick={handleInsertPaymentInfo}
              className="bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center space-x-1"
              title="Add eSewa / Khalti / Fonepay payment details"
            >
              <Receipt className="w-3 h-3 text-blue-600" />
              <span>+ Payment Options</span>
            </button>
            <button
              type="button"
              onClick={handleInsertLocation}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center space-x-1"
              title="Add clinic location & Google Maps link"
            >
              <Globe className="w-3 h-3 text-slate-600" />
              <span>+ Maps Location</span>
            </button>
            {customMessage && (
              <button
                type="button"
                onClick={handleResetTemplate}
                className="ml-auto text-slate-500 hover:text-red-600 text-[11px] font-bold flex items-center space-x-1 transition"
                title="Reset message back to original template"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* WhatsApp UI Simulation Box */}
          <div className="rounded-2xl border-2 border-emerald-600/30 overflow-hidden shadow-lg bg-[#efeae2]">
            {/* WhatsApp Top Bar */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shadow-inner">
                  {selectedPatient?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                    <span>{selectedPatient?.name || 'Client'}</span>
                    <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded font-mono font-normal">
                      +{formattedNepalPhone || '977'}
                    </span>
                  </h4>
                  <span className="text-[11px] text-emerald-200 font-mono">
                    {targetPhone}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                  WhatsApp Web / App Gateway
                </span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 sm:p-5 min-h-[260px] flex flex-col justify-end">
              <div className="self-end bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-none p-4 w-full max-w-xl shadow-sm border border-emerald-200/50 space-y-2">
                <textarea
                  rows="9"
                  value={activeMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs bg-transparent border-none focus:outline-none resize-none leading-relaxed text-slate-800 font-sans"
                  placeholder="Type or customize your WhatsApp message..."
                />
                <div className="flex items-center justify-end space-x-1.5 text-[10px] text-slate-500 font-mono pt-1 border-t border-emerald-200/40">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-600 inline" />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-[#f0f2f5] px-4 py-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition"
                  title="Copy plain message text"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMsg ? 'Message Copied' : 'Copy Message'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAutoLink}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs transition"
                  title="Copy direct wa.me auto link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Auto Link'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="bg-[#25d366] hover:bg-[#20ba59] text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition transform active:scale-95"
                title="Launch and send this message via WhatsApp Web or Mobile"
              >
                <Send className="w-4 h-4" />
                <span>Launch & Send in WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Quick Recall Campaign Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Automated 6-Month Dental Recall Automation</span>
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                Reach out to all completed patients after 6 months to maintain preventive dental care & boost practice retention.
              </p>
            </div>
            <button
              onClick={() => {
                const recallTpl = templates.find(t => t.id === 'TPL-RECALL-6MO');
                if (recallTpl) {
                  setSelectedTemplateId(recallTpl.id);
                  setCustomMessage('');
                }
              }}
              className="bg-white text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-emerald-50 transition flex-shrink-0"
            >
              Load Recall Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  Armchair,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function DoctorAllocationModal({
  isOpen,
  onClose,
  appointment,
  doctors = [],
  patients = [],
  clinicProfile = {},
  onNavigate,
  onOpenWhatsApp
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  // Look up doctor in clinic doctors catalog
  const assignedDoctor = doctors.find(
    d => d.name?.toLowerCase() === appointment.doctorName?.toLowerCase()
  ) || {
    name: appointment.doctorName || 'Dr. Mukesh Kushwaha',
    specialty: 'General & Conservative Dentistry',
    qualification: 'BDS, MDS',
    phone: '+977 98012 34567',
    color: '#2563eb'
  };

  // Look up patient
  const patient = patients.find(
    p => p.id === appointment.patientId || p.phone === appointment.patientPhone
  ) || {
    name: appointment.patientName || 'Patient',
    phone: appointment.patientPhone || '+977 98000 00000'
  };

  const doctorPhone = assignedDoctor.phone || '+977 98012 34567';
  const clinicName = clinicProfile.name || 'Nepal Dental Clinic';

  // Format WhatsApp message for the allocated doctor
  const handleNotifyDoctorWhatsApp = () => {
    if (!onOpenWhatsApp) return;
    const msg = `Namaste *${assignedDoctor.name}*,\n\n` +
      `A new dental appointment has been *CONFIRMED* and allocated to you at *${clinicName}*:\n\n` +
      `👤 *Patient:* ${appointment.patientName} (${appointment.patientPhone})\n` +
      `📅 *Date:* ${appointment.date}\n` +
      `⏰ *Time:* ${appointment.time} (${appointment.durationMinutes || 45} mins)\n` +
      `💺 *Operatory:* ${appointment.chair || 'Operatory Chair'}\n` +
      `🩺 *Procedure:* ${appointment.treatmentType || 'Consultation'}\n` +
      (appointment.notes ? `📝 *Notes:* ${appointment.notes}\n\n` : '\n') +
      `This patient is queued for your clinical attention.\n\n` +
      `*${clinicName} Practice Management*`;
    onOpenWhatsApp(doctorPhone, msg);
  };

  // Format WhatsApp message for the patient
  const handleNotifyPatientWhatsApp = () => {
    if (!onOpenWhatsApp) return;
    const apptLink = typeof window !== 'undefined' ? `${window.location.origin}/?patientId=${appointment.patientId}` : '';
    const msg = `Hello *${appointment.patientName}*,\n\n` +
      `Your dental appointment at *${clinicName}* is *CONFIRMED*!\n\n` +
      `👨‍⚕️ *Allocated Doctor:* ${assignedDoctor.name} (${assignedDoctor.specialty || 'Dental Specialist'})\n` +
      `📅 *Date:* ${appointment.date}\n` +
      `⏰ *Time:* ${appointment.time}\n` +
      `💺 *Chair:* ${appointment.chair || 'Chair 1'}\n` +
      (apptLink ? `🔗 *Digital Pass:* ${apptLink}\n\n` : '\n') +
      `Please arrive 10 minutes before your slot. Call ${clinicProfile.phone || '+977 98012 34567'} for inquiries.\n\n` +
      `Warm regards,\n*${clinicName}*`;
    onOpenWhatsApp(appointment.patientPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Appointment Confirmed!
                  </h3>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                    Allocated
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Allocated Doctor has been assigned and scheduled.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition text-base font-bold"
              title="Close popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. HERO ALLOCATED DOCTOR CARD */}
          <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 rounded-2xl border-2 border-blue-200/90 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md flex-shrink-0"
                  style={{ backgroundColor: assignedDoctor.color || '#2563eb' }}
                >
                  {assignedDoctor.name
                    ? assignedDoctor.name.replace('Dr.', '').trim().charAt(0)
                    : 'D'}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                      Allocated Attending Doctor
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                      ● Active
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                    {assignedDoctor.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {assignedDoctor.qualification && `${assignedDoctor.qualification} • `}
                    {assignedDoctor.specialty || 'Dental Specialist'}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Contact Quick Bar */}
            <div className="pt-2 border-t border-blue-200/70 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono font-bold text-slate-800">
                  {assignedDoctor.phone || '+977 98012 34567'}
                </span>
                {assignedDoctor.regNumber && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-500">
                      {assignedDoctor.regNumber}
                    </span>
                  </>
                )}
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Queued on Doctor Roster</span>
              </span>
            </div>
          </div>

          {/* 2. APPOINTMENT SUMMARY MATRIX */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Confirmed Appointment Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Patient */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Patient Name
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block truncate">
                  {appointment.patientName}
                </strong>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold block">
                  {appointment.patientPhone}
                </span>
              </div>

              {/* Schedule */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Date & Time Slot
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block">
                  {appointment.date}
                </strong>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-semibold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{appointment.time}</span>
                  <span className="text-slate-400">({appointment.durationMinutes || 45} mins)</span>
                </div>
              </div>

              {/* Operatory Chair */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Armchair className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Operatory Unit
                  </span>
                </div>
                <strong className="text-xs font-bold text-slate-800 block">
                  {appointment.chair || 'Chair 1 (Main Operatory)'}
                </strong>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded inline-block">
                  Reserved
                </span>
              </div>

              {/* Clinical Procedure */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Clinical Procedure
                  </span>
                </div>
                <strong className="text-xs font-bold text-slate-800 block truncate" title={appointment.treatmentType}>
                  {appointment.treatmentType || 'Consultation & Examination'}
                </strong>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                  Status: Confirmed ✓
                </span>
              </div>
            </div>

            {appointment.notes && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Chairside Instructions:</strong> {appointment.notes}
              </div>
            )}
          </div>

          {/* 3. MULTI-CHANNEL DISPATCH ACTIONS */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              1-Click Notifications & Navigation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* WhatsApp Allocated Doctor */}
              <button
                type="button"
                onClick={handleNotifyDoctorWhatsApp}
                className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notify Doctor (WhatsApp)</span>
              </button>

              {/* WhatsApp Patient */}
              <button
                type="button"
                onClick={handleNotifyPatientWhatsApp}
                className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notify Patient (WhatsApp)</span>
              </button>
            </div>

            {/* Navigate to Doctor's Queue */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('doctor-dashboard');
                  onClose();
                }}
                className="w-full p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center space-x-1.5 transition text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>View {assignedDoctor.name}'s Queue in Doctor Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Appointment #{appointment.id || 'APT-NEW'} allocated.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition"
          >
            Acknowledge & Done
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { isCurrentUserAssignedDoctor } from '../../utils/rbac';
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
  AlertCircle,
  Bell,
  Check,
  Ban,
  Activity,
  Timer
} from 'lucide-react';

/**
 * Plays a pleasant medical clinic alert chime using the Web Audio API.
 * Completely self-contained with no external audio file dependencies.
 */
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    // Audio blocked or not supported
  }
}

export default function DoctorAllocationModal({
  isOpen,
  onClose,
  onAccept,
  appointment,
  doctors = [],
  patients = [],
  clinicProfile = {},
  currentUser,
  onNavigate,
  onOpenWhatsApp
}) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAccepted, setIsAccepted] = useState(false);

  // 30-Second Countdown Timer: Automatically dismisses if doctor does not respond
  useEffect(() => {
    if (!isOpen || !appointment) {
      setTimeLeft(30);
      setIsAccepted(false);
      return;
    }

    setTimeLeft(30);
    setIsAccepted(false);
    playChime();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 30 seconds expired without doctor response: automatically dismiss and leave status unchanged
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  // Strict Enforce: Only show this alert on the screen of the doctor assigned to the appointment
  if (!appointment.isManualPreview && currentUser && !isCurrentUserAssignedDoctor(appointment, currentUser, doctors)) {
    return null;
  }

  // Look up doctor in clinic doctors catalog
  const assignedDoctor = doctors.find(
    (d) => d.name?.toLowerCase() === appointment.doctorName?.toLowerCase()
  ) || {
    name: appointment.doctorName || 'Dr. Mukesh Kushwaha',
    specialty: 'General & Conservative Dentistry',
    qualification: 'BDS, MDS',
    phone: '+977 98012 34567',
    color: '#2563eb'
  };

  // Look up patient
  const patient = patients.find(
    (p) => p.id === appointment.patientId || p.phone === appointment.patientPhone
  ) || {
    name: appointment.patientName || 'Patient',
    phone: appointment.patientPhone || '+977 98000 00000'
  };

  const doctorPhone = assignedDoctor.phone || '+977 98012 34567';
  const clinicName = clinicProfile.name || 'Nepal Dental Clinic';

  // Doctor clicks "Accept Appointment"
  const handleAcceptAppointment = () => {
    setIsAccepted(true);
    if (onAccept) {
      onAccept({
        ...appointment,
        doctorAcceptanceStatus: 'Accepted',
        acceptedByDoctor: true,
        acceptedAt: new Date().toISOString()
      });
    }
    setTimeout(() => {
      onClose();
    }, 1100);
  };

  // Doctor clicks "Skip" (dismisses immediately, leaves appointment status unchanged)
  const handleSkip = () => {
    onClose();
  };

  // WhatsApp helper for doctor
  const handleNotifyDoctorWhatsApp = () => {
    if (!onOpenWhatsApp) return;
    const msg =
      `Namaste *${assignedDoctor.name}*,\n\n` +
      `A new dental appointment has been *CONFIRMED* and allocated to you at *${clinicName}*:\n\n` +
      `👤 *Patient:* ${appointment.patientName} (${appointment.patientPhone})\n` +
      `📅 *Date:* ${appointment.date}\n` +
      `⏰ *Time:* ${appointment.time} (${appointment.durationMinutes || 45} mins)\n` +
      `💺 *Operatory:* ${appointment.chair || 'Operatory Chair'}\n` +
      `🩺 *Procedure:* ${appointment.treatmentType || appointment.chiefComplaint || 'Consultation'}\n` +
      (appointment.notes ? `📝 *Notes:* ${appointment.notes}\n\n` : '\n') +
      `This patient is queued for your clinical attention.\n\n` +
      `*${clinicName} Practice Management*`;
    onOpenWhatsApp(doctorPhone, msg);
  };

  // WhatsApp helper for patient
  const handleNotifyPatientWhatsApp = () => {
    if (!onOpenWhatsApp) return;
    const apptLink =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?patientId=${appointment.patientId}`
        : '';
    const msg =
      `Hello *${appointment.patientName}*,\n\n` +
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

  // Progress percentage (30s down to 0s)
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));

  // Dynamic timer badge style
  const timerBadgeColor =
    timeLeft > 10
      ? 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      : timeLeft > 5
      ? 'bg-amber-400/30 text-amber-200 border-amber-400/60'
      : 'bg-rose-500/40 text-rose-200 border-rose-400/80 animate-pulse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp">
        {/* Modal Header with Live 30s Countdown Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 relative overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 text-emerald-300">
                <Bell className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Confirmed Appointment Alert
                  </h3>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Allocated to <strong>{assignedDoctor.name}</strong>
                </p>
              </div>
            </div>

            {/* 30s Countdown Display Badge */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black font-mono border shadow-inner ${timerBadgeColor}`}
                title="Time remaining to accept before auto-dismiss"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>

              <button
                onClick={handleSkip}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                title="Skip & Dismiss immediately"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Animated 30-Second Progress Indicator Bar */}
          <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeLeft > 10
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : timeLeft > 5
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {isAccepted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-emerald-950">
                Appointment Accepted!
              </h4>
              <p className="text-xs text-emerald-800">
                {assignedDoctor.name} has accepted the confirmed appointment for {appointment.patientName}.
              </p>
            </div>
          ) : (
            <>
              {/* 1. ATTENDING DOCTOR IDENTITY CARD */}
              <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 rounded-2xl border-2 border-blue-200/90 shadow-2xs space-y-3">
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
                          Attending Doctor
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                          ● Allocated
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                        {assignedDoctor.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-600">
                        {assignedDoctor.qualification && `${assignedDoctor.qualification} • `}
                        {assignedDoctor.specialty || 'General Dental Surgeon'}
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
                  </div>

                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>Awaiting Doctor Acceptance</span>
                  </span>
                </div>
              </div>

              {/* 2. APPOINTMENT SUMMARY MATRIX */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Confirmed Booking Details
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Status: Confirmed ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Patient Name & Contact */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
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
                      {appointment.patientPhone || patient.phone}
                    </span>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
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
                      <span className="text-slate-400">
                        ({appointment.durationMinutes || 45} mins)
                      </span>
                    </div>
                  </div>

                  {/* Operatory Unit */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Armchair className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Dental Operatory
                      </span>
                    </div>
                    <strong className="text-xs font-bold text-slate-800 block">
                      {appointment.chair || 'Chair 1 (Main Operatory)'}
                    </strong>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded inline-block">
                      Chair Reserved
                    </span>
                  </div>

                  {/* Chief Complaint / Treatment */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Chief Complaint
                      </span>
                    </div>
                    <strong
                      className="text-xs font-bold text-slate-800 block truncate"
                      title={appointment.chiefComplaint || appointment.treatmentType}
                    >
                      {appointment.chiefComplaint || appointment.treatmentType || 'Consultation & Examination'}
                    </strong>
                    {appointment.painScale !== undefined && appointment.painScale !== null && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                          appointment.painScale === 0
                            ? 'bg-slate-100 text-slate-600'
                            : appointment.painScale <= 3
                            ? 'bg-emerald-100 text-emerald-800'
                            : appointment.painScale <= 6
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        Pain: {appointment.painScale}/10
                      </span>
                    )}
                  </div>
                </div>

                {appointment.notes && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                    <strong>Chairside Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>

              {/* 30s NOTICE BANNER */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-700 flex items-start space-x-2.5">
                <Timer className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  The doctor has <strong>{timeLeft} seconds</strong> to accept this appointment. Click <strong>Skip</strong> to dismiss immediately. If not responded within 30 seconds, this notification will automatically dismiss with the appointment status unchanged.
                </div>
              </div>

              {/* MULTI-CHANNEL WHATSAPP DISPATCH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleNotifyDoctorWhatsApp}
                  className="w-full p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center justify-center space-x-1.5 transition text-[11px] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Notify Doctor via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleNotifyPatientWhatsApp}
                  className="w-full p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold flex items-center justify-center space-x-1.5 transition text-[11px] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send Pass to Patient</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Accept & Skip Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center space-x-1.5"
            title="Dismiss notification immediately and keep status unchanged"
          >
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            <span>Skip ({timeLeft}s)</span>
          </button>

          <button
            type="button"
            onClick={handleAcceptAppointment}
            disabled={isAccepted}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Accept Appointment ({timeLeft}s)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

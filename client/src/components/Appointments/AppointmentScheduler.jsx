import React, { useState } from 'react';
import { assessTicketValidity } from '../../utils/ticketValidity';
import DoctorAllocationModal from './DoctorAllocationModal';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Armchair,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Ticket
} from 'lucide-react';

// Pre-defined clinic time slots in 15-minute intervals grouped by time of day
const TIME_SLOT_GROUPS = [
  {
    label: '🌅 Morning (07:00 AM - 11:45 AM)',
    slots: [
      '07:00 AM', '07:15 AM', '07:30 AM', '07:45 AM',
      '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM',
      '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
      '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
      '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM'
    ]
  },
  {
    label: '☀️ Afternoon (12:00 PM - 04:45 PM)',
    slots: [
      '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
      '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
      '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
      '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
      '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM'
    ]
  },
  {
    label: '🌙 Evening (05:00 PM - 09:00 PM)',
    slots: [
      '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM',
      '06:00 PM', '06:15 PM', '06:30 PM', '06:45 PM',
      '07:00 PM', '07:15 PM', '07:30 PM', '07:45 PM',
      '08:00 PM', '08:15 PM', '08:30 PM', '08:45 PM',
      '09:00 PM'
    ]
  }
];

const ALL_TIME_SLOTS = TIME_SLOT_GROUPS.flatMap(g => g.slots);

export default function AppointmentScheduler({
  appointments = [],
  patients = [],
  doctors = [],
  chairs = [],
  currentUser,
  onAddAppointment,
  onUpdateStatus,
  onOpenWhatsApp,
  clinicProfile = {},
  onSelectPatient,
  onNavigate,
  onViewDoctorAllocation
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedChair, setSelectedChair] = useState('all');

  // Doctor Allocation Popup Modal State
  const [allocatedApt, setAllocatedApt] = useState(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [customTimeMode, setCustomTimeMode] = useState(false);

  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorName: doctors[0]?.name || 'Dr. Mukesh Kushwaha',
    chair: chairs[0] || 'Chair 1 (Main Operatory)',
    date: todayStr,
    time: '11:00 AM',
    durationMinutes: 45,
    treatmentType: 'Consultation & Examination',
    chiefComplaint: 'Consultation & Examination',
    painScale: 0,
    notes: '',
    status: 'Confirmed'
  });

  const filtered = appointments.filter(a => {
    const matchDate = !selectedDate || a.date === selectedDate;
    const matchChair = selectedChair === 'all' || a.chair === selectedChair;
    return matchDate && matchChair;
  });

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId) || patients[0];
    const complaintText = formData.treatmentType || formData.chiefComplaint || 'Consultation & Examination';
    const newApt = {
      ...formData,
      treatmentType: complaintText,
      chiefComplaint: complaintText,
      patientName: patient?.name || 'Walk-in Patient',
      patientPhone: patient?.phone || '+977 98012 34567',
      status: formData.status || 'Confirmed'
    };

    setModalOpen(false);

    if (onAddAppointment) {
      const created = await onAddAppointment(newApt);
      // If confirmed, trigger popup message for allocated doctor
      if (newApt.status === 'Confirmed') {
        if (onViewDoctorAllocation) {
          onViewDoctorAllocation(created || newApt);
        } else {
          setAllocatedApt(created || newApt);
          setDoctorModalOpen(true);
        }
      }
    }
  };

  const handleStatusChange = (apt, newStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(apt.id, newStatus);
    }
    // If status is changed to Confirmed, trigger popup message for allocated doctor
    if (newStatus === 'Confirmed') {
      const updated = { ...apt, status: 'Confirmed' };
      if (onViewDoctorAllocation) {
        onViewDoctorAllocation(updated);
      } else {
        setAllocatedApt(updated);
        setDoctorModalOpen(true);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Chair':
        return 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse';
      case 'Checked In':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dental Appointments & Chair Schedule</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
              {filtered.length} Bookings
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operatory chair management, patient flow tracking, and automated reminder dispatch.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Date & Chair Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800"
          />
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs font-semibold text-blue-600 hover:underline px-2"
          >
            Today
          </button>
        </div>

        {/* Chair Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-600">Chair Filter:</span>
          <select
            value={selectedChair}
            onChange={(e) => setSelectedChair(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800"
          >
            <option value="all">All Operatory Chairs</option>
            {chairs.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments List / Chair Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No appointments scheduled for this date and chair selection.
          </div>
        ) : (
          filtered.map((apt) => {
            const aptPatient = patients.find(p => p.id === apt.patientId || p.phone === apt.patientPhone);
            const ticketInfo = aptPatient ? assessTicketValidity(aptPatient, clinicProfile) : null;

            return (
              <div
                key={apt.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  {/* Time Badge */}
                  <div className="bg-blue-50 text-blue-900 border border-blue-200 p-2.5 rounded-xl text-center min-w-[85px]">
                    <Clock className="w-4 h-4 mx-auto text-blue-600 mb-0.5" />
                    <span className="text-xs font-black block">{apt.time}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{apt.durationMinutes} mins</span>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                      <span className="text-xs font-mono text-emerald-700 font-semibold">{apt.patientPhone}</span>
                      {ticketInfo?.enabled && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ticketInfo.status === 'VALID_REVISIT'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : ticketInfo.status === 'EXPIRED'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {ticketInfo.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700 inline-flex items-center gap-1.5">
                        <span>🩺 {apt.chiefComplaint || apt.treatmentType}</span>
                        {apt.painScale > 0 && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            apt.painScale <= 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.painScale <= 6
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            Pain: {apt.painScale}/10
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-blue-700 flex items-center gap-1.5 flex-wrap">
                        <span>👨‍⚕️ {apt.doctorName}</span>
                        {apt.doctorAcceptanceStatus === 'Accepted' && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md border border-emerald-300">
                            Doctor Accepted ✓
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500">
                        💺 {apt.chair}
                      </span>
                    </div>

                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        Note: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {/* Status Dropdown */}
                  <select
                    value={apt.status}
                    onChange={(e) => handleStatusChange(apt, e.target.value)}
                    className={`text-xs font-bold py-1.5 px-3 rounded-lg border ${getStatusBadge(apt.status)}`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked In">Checked In</option>
                    <option value="In Chair">In Chair</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  {/* 1-Click Ticket Billing / Revisit Navigation */}
                  {ticketInfo?.enabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (aptPatient && onSelectPatient) onSelectPatient(aptPatient);
                        if (onNavigate) onNavigate('billing');
                      }}
                      className={`text-xs font-bold py-1.5 px-2.5 rounded-lg border transition flex items-center space-x-1 shadow-2xs ${
                        ticketInfo.status === 'VALID_REVISIT'
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                      title={ticketInfo.message}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{ticketInfo.status === 'VALID_REVISIT' ? 'Free Revisit' : 'Bill Ticket'}</span>
                    </button>
                  )}

                  {/* WhatsApp button with Auto Link */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!onOpenWhatsApp) return;
                      const apptAutoLink = `${window.location.origin}/?patientId=${apt.patientId}`;
                      const msg = `Hello *${apt.patientName}*,\n\nYour dental visit at *${clinicProfile.name || 'Apex Dental'}* is confirmed for *${apt.date}* at *${apt.time}* with *${apt.doctorName}* (${apt.chair || 'Operatory Chair'}).\n\n🔗 *Appointment Auto Link:* ${apptAutoLink}\n\nPlease arrive 10 minutes before your slot. For assistance, call ${clinicProfile.phone || '+977 98012 34567'}.\n\nWarm regards,\n*${clinicProfile.name || 'Apex Dental'}*`;
                      onOpenWhatsApp(apt.patientPhone, msg);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                    title="Send WhatsApp confirmation with auto link"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Link</span>
                  </button>

                  {/* Allocated Doctor Info Card Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewDoctorAllocation) {
                        onViewDoctorAllocation(apt);
                      } else {
                        setAllocatedApt(apt);
                        setDoctorModalOpen(true);
                      }
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition shadow-2xs"
                    title="View Allocated Doctor Details"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Doctor Info</span>
                  </button>
                </div>
            </div>
          );
        })
      )}
      </div>

      {/* BOOKING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-100" />
                <span>Schedule Dental Appointment</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body with Vertical Slider/Scrollbar */}
            <form onSubmit={handleCreateAppointment} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase">Select Patient *</label>
                    {(() => {
                      const selP = patients.find(p => p.id === formData.patientId);
                      const tInf = selP ? assessTicketValidity(selP, clinicProfile) : null;
                      if (!tInf || !tInf.enabled) return null;
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          tInf.status === 'VALID_REVISIT'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : tInf.status === 'EXPIRED'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {tInf.badgeText}
                        </span>
                      );
                    })()}
                  </div>
                  <select
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
                    ))}
                  </select>
                  {(() => {
                    const selP = patients.find(p => p.id === formData.patientId);
                    const tInf = selP ? assessTicketValidity(selP, clinicProfile) : null;
                    if (!tInf || !tInf.enabled) return null;
                    return (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {tInf.message}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Attending Doctor *</label>
                  <select
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dental Chair / Operatory</label>
                  <select
                    value={formData.chair}
                    onChange={(e) => setFormData({ ...formData, chair: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {chairs.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 uppercase">Time *</label>
                      <button
                        type="button"
                        onClick={() => setCustomTimeMode(prev => !prev)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        title={customTimeMode ? 'Switch back to standard time slot dropdown' : 'Enter a custom exact minute'}
                      >
                        {customTimeMode ? '← Pick from dropdown' : '+ Custom Time'}
                      </button>
                    </div>

                    {customTimeMode ? (
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          placeholder="e.g. 02:55 PM"
                          autoFocus
                          className="w-full p-2.5 rounded-lg border border-blue-400 focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        />
                      </div>
                    ) : (
                      <select
                        required
                        value={formData.time}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setCustomTimeMode(true);
                          } else {
                            setFormData({ ...formData, time: e.target.value });
                          }
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {formData.time && !ALL_TIME_SLOTS.includes(formData.time) && (
                          <option value={formData.time}>
                            🕒 {formData.time} (Selected Time)
                          </option>
                        )}
                        {TIME_SLOT_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.slots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__custom__">✏️ Custom Time...</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Chief Complaint & Pain Severity Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase">Chief Complaint *</label>
                    <span className="text-[10px] text-slate-400 font-medium">Primary symptom / purpose of visit</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.treatmentType}
                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value, chiefComplaint: e.target.value })}
                    placeholder="e.g. Toothache, Bleeding gums, Sensitivity, Cavity, Cleaning"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />

                  {/* Common Chief Complaints Quick Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      'Toothache / Pain',
                      'Bleeding Gums',
                      'Sensitivity',
                      'Dental Caries / Cavity',
                      'Cleaning / Scaling',
                      'Swelling / Abscess',
                      'Broken Tooth',
                      'Routine Checkup'
                    ].map((complaint) => (
                      <button
                        key={complaint}
                        type="button"
                        onClick={() => setFormData({ ...formData, treatmentType: complaint, chiefComplaint: complaint })}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          formData.treatmentType === complaint
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {complaint}
                      </button>
                    ))}
                  </div>

                  {/* Pain Severity Level Slider (1 - 10) */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Pain Severity Level</span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          (formData.painScale || 0) === 0
                            ? 'bg-slate-200 text-slate-700'
                            : (formData.painScale || 0) <= 3
                            ? 'bg-emerald-100 text-emerald-800'
                            : (formData.painScale || 0) <= 6
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {(formData.painScale || 0) === 0
                            ? 'No Pain (0)'
                            : (formData.painScale || 0) <= 3
                            ? `Mild (${formData.painScale}/10)`
                            : (formData.painScale || 0) <= 6
                            ? `Moderate (${formData.painScale}/10)`
                            : `Severe (${formData.painScale}/10)`}
                        </span>
                      </span>
                      <span className="font-mono font-bold text-blue-600 text-xs">
                        {formData.painScale || 0} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={formData.painScale || 0}
                      onChange={(e) => setFormData({ ...formData, painScale: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                      <span>0 (None)</span>
                      <span>3 (Mild)</span>
                      <span>6 (Moderate)</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chairside Notes</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special instructions or patient preferences"
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                {/* Appointment Booking Status */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Appointment Allocation Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                        formData.status === 'Confirmed'
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bookingStatus"
                        value="Confirmed"
                        checked={formData.status === 'Confirmed'}
                        onChange={() => setFormData({ ...formData, status: 'Confirmed' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <span className="block font-bold text-blue-950">Confirmed ✓</span>
                        <span className="text-[10px] text-blue-700/80">Allocates & alerts doctor</span>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                        formData.status === 'Scheduled'
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bookingStatus"
                        value="Scheduled"
                        checked={formData.status === 'Scheduled'}
                        onChange={() => setFormData({ ...formData, status: 'Scheduled' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="block font-bold text-slate-800">Scheduled</span>
                        <span className="text-[10px] text-slate-500">Tentative slot</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save & Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Notification for Allocated Attending Doctor (Fallback if not handled globally) */}
      {!onViewDoctorAllocation && (
        <DoctorAllocationModal
          isOpen={doctorModalOpen}
          onClose={() => setDoctorModalOpen(false)}
          onAccept={(apt) => {
            if (onUpdateStatus) {
              onUpdateStatus(apt.id, 'Confirmed');
            }
          }}
          appointment={allocatedApt}
          doctors={doctors}
          patients={patients}
          clinicProfile={clinicProfile}
          currentUser={currentUser}
          onNavigate={onNavigate}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}
    </div>
  );
}

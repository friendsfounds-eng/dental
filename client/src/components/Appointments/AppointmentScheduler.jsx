import React, { useState } from 'react';
import { assessTicketValidity } from '../../utils/ticketValidity';
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

export default function AppointmentScheduler({
  appointments = [],
  patients = [],
  doctors = [],
  chairs = [],
  onAddAppointment,
  onUpdateStatus,
  onOpenWhatsApp,
  clinicProfile = {},
  onSelectPatient,
  onNavigate
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-10-21');
  const [selectedChair, setSelectedChair] = useState('all');

  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorName: doctors[0]?.name || 'Dr. Yugal Sharma',
    chair: chairs[0] || 'Chair 1 (Main Operatory)',
    date: '2026-10-21',
    time: '11:00 AM',
    durationMinutes: 45,
    treatmentType: 'Consultation & Examination',
    notes: ''
  });

  const filtered = appointments.filter(a => {
    const matchDate = !selectedDate || a.date === selectedDate;
    const matchChair = selectedChair === 'all' || a.chair === selectedChair;
    return matchDate && matchChair;
  });

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId) || patients[0];
    onAddAppointment({
      ...formData,
      patientName: patient?.name || 'Walk-in Patient',
      patientPhone: patient?.phone || '+91 98765 00000',
      status: 'Scheduled'
    });
    setModalOpen(false);
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
            onClick={() => setSelectedDate('2026-10-21')}
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
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                        🩺 {apt.treatmentType}
                      </span>
                      <span className="font-semibold text-blue-700">
                        👨‍⚕️ {apt.doctorName}
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
                    onChange={(e) => onUpdateStatus && onUpdateStatus(apt.id, e.target.value)}
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
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* BOOKING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Schedule Dental Appointment</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 text-xs">
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Treatment / Reason for Visit</label>
                <input
                  type="text"
                  required
                  value={formData.treatmentType}
                  onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                  placeholder="e.g. Root Canal Sitting 2, Crown Cementation, Scaling"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
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

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg shadow-sm"
                >
                  Save & Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

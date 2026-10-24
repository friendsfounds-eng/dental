import React, { useState } from 'react';
import { assessTicketValidity } from '../../utils/ticketValidity';
import {
  Calendar,
  Users,
  Receipt,
  UserPlus,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Ticket
} from 'lucide-react';

export default function ReceptionistDashboard({
  currentUser,
  clinicProfile = {},
  patients = [],
  appointments = [],
  onNavigate,
  onSelectPatient,
  onOpenWhatsApp
}) {
  const receptionistName = currentUser?.name || 'Sita Thapa (Front Desk)';
  const todayDate = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter(a => a.date === todayDate || a.status === 'Scheduled' || a.status === 'In Chair');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500 text-white uppercase tracking-wider">
              Front Desk & Patient Services Active
            </span>
            <span className="text-teal-200 font-mono text-xs font-semibold">
              {clinicProfile.name || 'Nepal Dental Wellness Centre'}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">{receptionistName}</h2>
          <p className="text-xs text-teal-100 mt-0.5">
            Patient registration, appointment scheduling, queue check-ins, tax invoices, and WhatsApp confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('patients')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>New Patient Registration</span>
          </button>

          <button
            onClick={() => onNavigate('appointments')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition"
          >
            <Calendar className="w-4 h-4 text-teal-300" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Security & Boundary Notice */}
      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs flex items-center justify-between text-amber-900">
        <div className="flex items-center space-x-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Role Boundary Enforced:</strong> Front desk receptionists can manage appointments, registrations, and payment collections. Clinical decisions, prescriptions, and dental charting are strictly doctor-only.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase flex-shrink-0 ml-2">
          RBAC Protected
        </span>
      </div>

      {/* Front Desk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('patients')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-teal-500 hover:shadow-md transition"
          title="Click to view Patients (EHR) Directory"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</span>
          <div className="text-2xl font-black text-slate-900">{patients.length}</div>
          <div className="text-[11px] text-teal-700 font-bold">Active in Clinic</div>
        </div>

        <div
          onClick={() => onNavigate('appointments')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-blue-500 hover:shadow-md transition"
          title="Click to view Today's Appointments"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Appointments</span>
          <div className="text-2xl font-black text-blue-600">{todayAppointments.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Scheduled & Walk-ins</div>
        </div>

        <div
          onClick={() => onNavigate('whatsapp')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-emerald-500 hover:shadow-md transition"
          title="Click to open WhatsApp CRM"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Gateway</span>
          <div className="text-2xl font-black text-emerald-600">Active</div>
          <div className="text-[11px] text-slate-500 font-medium">+977 Nepal Auto-Link</div>
        </div>

        <div
          onClick={() => onNavigate('billing')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-purple-500 hover:shadow-md transition"
          title="Click to view Billing & Invoices"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Methods</span>
          <div className="text-2xl font-black text-purple-600">4 Types</div>
          <div className="text-[11px] text-slate-500 font-medium">Fonepay, eSewa, Khalti, Cash</div>
        </div>
      </div>

      {/* Live Chair & Reception Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Today's Front Desk Reception & Chair Queue</span>
            </h3>
            <p className="text-xs text-slate-500">Live patient check-in status, operatory assignment & WhatsApp links</p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            Manage Queue Calendar →
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No patient appointments in queue for today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayAppointments.map((apt) => {
              const aptPatient = patients.find(p => p.id === apt.patientId || p.phone === apt.patientPhone);
              const ticketInfo = aptPatient ? assessTicketValidity(aptPatient, clinicProfile) : null;

              return (
                <div
                  key={apt.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-teal-100 text-teal-800">
                        {apt.chair || 'Chair 1'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-700">
                        {apt.status}
                      </span>
                      {ticketInfo?.enabled && (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          ticketInfo.status === 'VALID_REVISIT'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : ticketInfo.status === 'EXPIRED'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`} title={ticketInfo.message}>
                          {ticketInfo.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>⏰ <strong>{apt.time}</strong></span>
                      <span>👨‍⚕️ <strong>{apt.doctorName}</strong></span>
                      <span className="font-mono text-emerald-700 font-semibold">{apt.patientPhone}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ticketInfo?.enabled && (
                      <button
                        onClick={() => {
                          const pt = aptPatient || { id: apt.patientId, name: apt.patientName, phone: apt.patientPhone };
                          onSelectPatient(pt);
                          onNavigate('billing');
                        }}
                        className={`font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center space-x-1 border ${
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

                    <button
                      onClick={() => {
                        if (onOpenWhatsApp && apt.patientPhone) {
                          onOpenWhatsApp(
                            apt.patientPhone,
                            `Namaste ${apt.patientName},\nThis is a friendly reminder for your dental appointment at ${clinicProfile.name || 'Nepal Dental'} today at ${apt.time} with ${apt.doctorName}.`
                          );
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1"
                      title="Send WhatsApp appointment reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Link</span>
                    </button>

                    <button
                      onClick={() => {
                        const pt = aptPatient || { id: apt.patientId, name: apt.patientName, phone: apt.patientPhone };
                        onSelectPatient(pt);
                        onNavigate('billing');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Invoice / Pay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

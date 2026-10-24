import React from 'react';
import {
  Stethoscope,
  Activity,
  Pill,
  Calendar,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  FileCheck,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

export default function DoctorDashboard({
  currentUser,
  clinicProfile = {},
  patients = [],
  appointments = [],
  onNavigate,
  onSelectPatient,
  onOpenWhatsApp
}) {
  const doctorName = currentUser?.name || 'Dr. Mukesh Kushwaha';
  const todayDate = new Date().toISOString().split('T')[0];

  // Filter today's appointments for this doctor
  const todayAppointments = appointments.filter(a => a.date === todayDate || a.status === 'In Chair');

  return (
    <div className="space-y-6">
      {/* Doctor Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white uppercase tracking-wider">
              Clinical Authority Active
            </span>
            <span className="text-emerald-200 font-mono text-xs font-semibold">
              NMC-67890
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">{doctorName}</h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            {clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'} — Prosthodontics & Implantology
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('chart')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
          >
            <Activity className="w-4 h-4 text-slate-950" />
            <span>Open Odontogram</span>
          </button>

          <button
            onClick={() => onNavigate('prescriptions')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition"
          >
            <Pill className="w-4 h-4 text-emerald-300" />
            <span>Prescription Pad</span>
          </button>
        </div>
      </div>

      {/* Quick Clinical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('patients')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-blue-500 hover:shadow-md transition"
          title="Click to view Patients (EHR) Directory"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Patient Records</span>
          <div className="text-2xl font-black text-slate-900">{patients.length}</div>
          <div className="text-[11px] text-emerald-600 font-bold">Charted & Documented</div>
        </div>

        <div
          onClick={() => onNavigate('appointments')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-blue-500 hover:shadow-md transition"
          title="Click to view Chair Schedule & Appointments"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Chair Queue</span>
          <div className="text-2xl font-black text-blue-600">{todayAppointments.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Scheduled & In Chair</div>
        </div>

        <div
          onClick={() => onNavigate('chart')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-purple-500 hover:shadow-md transition"
          title="Click to view Dental Chart & Treatment Plans"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Treatment Plans</span>
          <div className="text-2xl font-black text-purple-600">
            {patients.reduce((acc, p) => acc + (p.treatmentPlans || []).length, 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">In Progress & Planned</div>
        </div>

        <div
          onClick={() => onNavigate('ai')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-indigo-500 hover:shadow-md transition"
          title="Click to open AI Clinical Assistant"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Diagnostics</span>
          <div className="text-2xl font-black text-indigo-600">Active</div>
          <div className="text-[11px] text-slate-500 font-medium">Differential diagnosis ready</div>
        </div>
      </div>

      {/* Today's Clinical Queue & Chair Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Today's Clinical Chair Queue</span>
            </h3>
            <p className="text-xs text-slate-500">Patients scheduled for clinical examination and procedures today</p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            View Full Schedule →
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No chair appointments remaining for today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                      {apt.chair || 'Chair 1'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      apt.status === 'In Chair' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center space-x-3">
                    <span>⏰ <strong>{apt.time}</strong></span>
                    <span>🦷 Procedure: <strong>{apt.treatmentType}</strong></span>
                    <span className="font-mono text-emerald-700">{apt.patientPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const pt = patients.find(p => p.id === apt.patientId) || { id: apt.patientId, name: apt.patientName, phone: apt.patientPhone };
                      onSelectPatient(pt);
                      onNavigate('chart');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition"
                  >
                    Open Chart
                  </button>

                  <button
                    onClick={() => {
                      const pt = patients.find(p => p.id === apt.patientId) || { id: apt.patientId, name: apt.patientName, phone: apt.patientPhone };
                      onSelectPatient(pt);
                      onNavigate('prescriptions');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition"
                  >
                    Rx Pad
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Directory Quick View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Active Patients Under Treatment</span>
            </h3>
            <p className="text-xs text-slate-500">Quickly select a patient to record odontogram findings or update treatment plan</p>
          </div>
          <button
            onClick={() => onNavigate('patients')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Patients Directory →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {patients.slice(0, 6).map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectPatient(p);
                onNavigate('chart');
              }}
              className="p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-400 transition cursor-pointer text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{p.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{p.id}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {p.gender}, {p.age} yrs | Phone: <span className="font-mono text-emerald-700">{p.phone}</span>
              </div>
              {p.treatmentPlans?.length > 0 && (
                <div className="text-[11px] bg-blue-100/70 text-blue-900 px-2 py-0.5 rounded font-medium">
                  {p.treatmentPlans[0].procedure} ({p.treatmentPlans[0].status})
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Layers,
  Armchair,
  Stethoscope
} from 'lucide-react';

export default function ClinicDashboard({
  patients = [],
  appointments = [],
  clinicProfile = {},
  onNavigate,
  onSelectPatient,
  onOpenWhatsApp
}) {
  const todayStr = '2026-10-21';
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const totalPatients = patients.length;
  const inChairApts = todayAppointments.filter(a => a.status === 'In Chair');
  const completedApts = todayAppointments.filter(a => a.status === 'Completed');

  // Revenue calculation
  const allInvoices = patients.flatMap(p => p.invoices || []);
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const totalDues = allInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  // Chair occupancy
  const chairs = [
    { name: "Chair 1 (Main Operatory)", type: "General & Restorative", currentPatient: "Rohit Malhotra", procedure: "Composite Restoration #16", status: "Occupied" },
    { name: "Chair 2 (Surgical & Implants)", type: "Implants & Surgery", currentPatient: "Pooja Singhania", procedure: "Veneer Consultation", status: "Available" },
    { name: "Chair 3 (Hygiene & Pediatric)", type: "Pediatric & Scaling", currentPatient: "Master Aarav Gupta", procedure: "Pediatric Pulpotomy", status: "Scheduled" }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          {clinicProfile.logo && (
            <div className="w-16 h-16 rounded-2xl bg-white/95 p-1.5 shadow-lg border border-white/20 flex-shrink-0 flex items-center justify-center">
              <img src={clinicProfile.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Digital Dental ERP & AI Assistant Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome to {clinicProfile.name}
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              {clinicProfile.tagline} • Managing Doctor: {clinicProfile.doctorInCharge}
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('chart')}
            className="bg-white text-blue-900 hover:bg-blue-50 text-xs font-black px-4 py-3 rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Open Odontogram Chart</span>
          </button>
          <button
            onClick={() => onNavigate('ai')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-3 rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Clinical Tool</span>
          </button>
          <button
            onClick={() => onNavigate('whatsapp')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-3 rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Hub</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Today's Appointments
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {todayAppointments.length}
            </div>
            <span className="text-xs text-blue-600 font-semibold mt-0.5 block">
              {inChairApts.length} In-Chair • {completedApts.length} Done
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition"
          title="Click to view Patients (EHR) Directory"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Patients
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalPatients}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">
              100% Digital EHR Charted
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Revenue Collected
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {clinicProfile.currency || 'Rs.'} {totalRevenue.toLocaleString()}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">
              Via eSewa, Khalti, Fonepay & Cash
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Balance Due
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {clinicProfile.currency || 'Rs.'} {totalDues.toLocaleString()}
            </div>
            <span className="text-xs text-red-500 font-semibold mt-0.5 block">
              Automated Reminders Ready
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Operatory Chairs Live Status Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Armchair className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Operatory Dental Chairs Live Status</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Real-time Operatory Monitor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chairs.map((c, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition ${
                c.status === 'Occupied'
                  ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-400/30'
                  : c.status === 'Available'
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">{c.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'Occupied'
                      ? 'bg-purple-200 text-purple-900 animate-pulse'
                      : c.status === 'Available'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{c.type}</p>
              <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs">
                <div className="font-bold text-slate-900">{c.currentPatient}</div>
                <div className="text-blue-700 font-semibold">{c.procedure}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Queue & Quick Patient Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Today's Patient Schedule</span>
            </h3>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View Full Calendar
            </button>
          </div>

          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{apt.patientName}</div>
                  <div className="text-slate-500">{apt.time} • {apt.treatmentType}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {apt.status}
                  </span>
                  <button
                    onClick={() => onOpenWhatsApp && onOpenWhatsApp(apt.patientPhone, `Hi ${apt.patientName}, checking in regarding your visit today at ${apt.time}.`)}
                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Recent Patient Charts</span>
            </h3>
            <button
              onClick={() => onNavigate('patients')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View All Patients
            </button>
          </div>

          <div className="space-y-3">
            {patients.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPatient(p);
                  onNavigate('chart');
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name} ({p.id})</div>
                  <div className="text-slate-500">{p.gender}, {p.age} yrs • {p.phone}</div>
                </div>
                <button className="text-blue-600 font-bold text-xs flex items-center">
                  <span>Open Chart</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  UserPlus,
  Lock,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Settings,
  RefreshCw,
  Slash,
  Building
} from 'lucide-react';

export default function SuperAdminDashboard({
  clinicProfile = {},
  authToken,
  activeTenant,
  availableTenants = [],
  onSwitchTenant,
  onNavigate,
  onSelectPatient
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'staff' | 'duplicates' | 'audit' | 'policies'
  const [staff, setStaff] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'DOCTOR',
    password: ''
  });

  const [billingPolicy, setBillingPolicy] = useState({
    maxDiscountPercent: 15,
    requireApprovalAbovePercent: 10
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : '',
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resStaff, resDup, resFin, resAudit] = await Promise.all([
        fetch('/api/admin/staff', { headers }).then(r => r.json()),
        fetch('/api/admin/duplicates', { headers }).then(r => r.json()),
        fetch('/api/admin/financial-summary', { headers }).then(r => r.json()),
        fetch('/api/admin/audit-logs', { headers }).then(r => r.json())
      ]);

      setStaff(Array.isArray(resStaff) ? resStaff : []);
      setDuplicates(Array.isArray(resDup) ? resDup : []);
      setFinancials(resFin);
      setAuditLogs(Array.isArray(resAudit) ? resAudit : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [authToken, activeTenant?.id]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const assignedRoles = Array.isArray(newStaff.roles) && newStaff.roles.length > 0 ? newStaff.roles : [newStaff.role || 'DOCTOR'];
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...newStaff,
          roles: assignedRoles,
          role: assignedRoles.includes('CLINIC_ADMIN') ? 'CLINIC_ADMIN' : assignedRoles[0]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setToast(`✅ Staff account for ${newStaff.name} (${newStaff.role}) provisioned!`);
      setTimeout(() => setToast(null), 4000);
      setAddStaffModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'DOCTOR', password: '' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStaffStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/staff/${userId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      setToast(`Staff status updated to ${newStatus}`);
      setTimeout(() => setToast(null), 3000);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevokeSessions = async (userId) => {
    try {
      const res = await fetch(`/api/admin/staff/${userId}/revoke`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Revocation failed');
      setToast('Staff active sessions revoked successfully.');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSavePolicy = async () => {
    try {
      const res = await fetch('/api/admin/billing-policy', {
        method: 'PUT',
        headers,
        body: JSON.stringify(billingPolicy)
      });
      if (!res.ok) throw new Error('Failed to update billing policy');
      setToast('Billing & discount policy updated.');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500 text-white uppercase tracking-wider">
              Overall Super Admin
            </span>
            <span className="text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {clinicProfile.name || 'Nepal Dental Wellness Centre'}
            </span>
            <span className="bg-white/10 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Multi-Clinic Central Control
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">Practice Administration & Governance</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Clinic operations, staff accounts, financial policies, and security administration for {clinicProfile.name || 'Dental Clinic'}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAddStaffModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black transition shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Financial & Practice KPIs', icon: DollarSign },
          { id: 'staff', label: `Staff & Accounts (${staff.length})`, icon: Users },
          { id: 'duplicates', label: `Duplicate Reviews (${duplicates.length})`, icon: AlertTriangle },
          { id: 'audit', label: `Clinic Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'policies', label: 'Billing Policies & Limits', icon: Settings }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <div className="text-2xl font-black text-slate-900">
                {financials?.currency || 'Rs.'} {(financials?.totalBilled || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{financials?.invoicesCount || 0} Total Tax Invoices</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Collected Revenue</span>
              <div className="text-2xl font-black text-emerald-600">
                {financials?.currency || 'Rs.'} {(financials?.totalCollected || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">Fonepay, eSewa, Khalti & Cash</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
              <div className="text-2xl font-black text-amber-600">
                {financials?.currency || 'Rs.'} {(financials?.totalOutstanding || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Pending collections</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & USER MANAGEMENT */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Clinic Staff & RBAC Accounts
            </h3>
            <button
              onClick={() => setAddStaffModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Name & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{s.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {((Array.isArray(s.roles) && s.roles.length > 0) ? s.roles : [s.role]).map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                              r === 'DOCTOR'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : r === 'CLINIC_ADMIN'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : r === 'PHARMACIST'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : r === 'NURSE'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{s.phone || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStaffStatus(s.id, s.status)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                          s.status === 'active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {s.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => handleRevokeSessions(s.id)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                        title="Force logout all devices for this user"
                      >
                        Revoke Sessions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DUPLICATE PATIENTS REVIEW */}
      {activeSubTab === 'duplicates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Duplicate Patient Registration Review
              </h3>
              <p className="text-xs text-slate-500">
                Identify matching phone numbers and names to prevent duplicate chart fragmentation.
              </p>
            </div>
          </div>

          {duplicates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">No duplicate records detected</div>
              <p className="text-xs text-slate-500">Patient records in this clinic have distinct phone numbers and names.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((dup, i) => {
                const isExact = dup.isExactDuplicate || dup.type === 'MATCHING_NAME_AND_PHONE';
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                      isExact
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black uppercase tracking-wide">
                          {isExact
                            ? `🚫 Exact Duplicate (Same Name & Mobile): ${dup.key}`
                            : `ℹ️ Shared Contact (Family / Different Names): ${dup.key}`}
                        </span>
                        {isExact && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                            New Saves Blocked
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold ${isExact ? 'text-rose-700' : 'text-amber-700'}`}>
                        {dup.patients.length} Profiles
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dup.patients.map(p => (
                        <div
                          key={p.id}
                          className={`p-3 bg-white rounded-lg border text-slate-800 space-y-1 shadow-2xs ${
                            isExact ? 'border-rose-200' : 'border-amber-200'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{p.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] font-mono">
                            Phone: {p.phone} | Age: {p.age || 'N/A'}
                          </div>
                          <button
                            onClick={() => {
                              if (onSelectPatient) onSelectPatient(p);
                              if (onNavigate) onNavigate('chart');
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <span>View Odontogram</span>
                            <span>→</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLINIC AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Clinic Action & Security Audit Log
            </h3>
            <span className="text-xs text-slate-500 font-mono">Protected Clinic Store</span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {auditLogs.map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">{log.userEmail || 'System'}</span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-600 mt-1">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BILLING POLICIES */}
      {activeSubTab === 'policies' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-lg">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Billing, Discount Limits & Refund Controls
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Maximum Discount Percentage Allowed (Receptionist Limit)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={billingPolicy.maxDiscountPercent}
                onChange={(e) => setBillingPolicy({ ...billingPolicy, maxDiscountPercent: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">Front desk staff cannot discount bills beyond this limit.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Discounts Requiring Super Admin Approval Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={billingPolicy.requireApprovalAbovePercent}
                onChange={(e) => setBillingPolicy({ ...billingPolicy, requireApprovalAbovePercent: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <button
              onClick={handleSavePolicy}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition"
            >
              Save Billing Policy
            </button>
          </div>
        </div>
      )}

      {/* ADD STAFF ACCOUNT MODAL */}
      {addStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Provision Staff Account</h3>
                <p className="text-xs text-blue-100">Assign role-based access for your clinic</p>
              </div>
              <button onClick={() => setAddStaffModal(false)} className="text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Role & Authority Assignment *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'DOCTOR_ADMIN') {
                      setNewStaff({ ...newStaff, role: 'CLINIC_ADMIN', roles: ['DOCTOR', 'CLINIC_ADMIN'] });
                    } else if (val === 'DOCTOR_PHARM') {
                      setNewStaff({ ...newStaff, role: 'DOCTOR', roles: ['DOCTOR', 'PHARMACIST'] });
                    } else if (val === 'ALL_ACCESS') {
                      setNewStaff({ ...newStaff, role: 'CLINIC_ADMIN', roles: ['DOCTOR', 'CLINIC_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'NURSE'] });
                    } else {
                      setNewStaff({ ...newStaff, role: val, roles: [val] });
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-blue-900"
                >
                  <option value="DOCTOR">🩺 Doctor (Clinical Chart, Prescriptions, Diagnosis)</option>
                  <option value="RECEPTIONIST">📋 Receptionist (Front Desk, Appointments, Billing)</option>
                  <option value="PHARMACIST">💊 Pharmacist (Medicine Stock & POS Sales)</option>
                  <option value="NURSE">👩‍⚕️ Nurse / Dental Assistant (Queue & Vitals)</option>
                  <option value="CLINIC_ADMIN">🛡️ Clinic Super Admin (Practice Governance)</option>
                  <option value="DOCTOR_ADMIN">✨ Combo: Doctor + Clinic Admin</option>
                  <option value="DOCTOR_PHARM">✨ Combo: Doctor + Pharmacist</option>
                  <option value="ALL_ACCESS">🌟 Combo: Full Access (All Roles)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@nepaldental.com.np"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mobile Phone (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="+977 98012 34567"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Boxes,
  HeartPulse,
  Search,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  LogOut,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
  Shield,
  Activity,
  Pill,
  DollarSign,
  Scan,
  Package,
  Calendar,
  Receipt,
  Sparkles,
  Settings,
  Sliders,
  CheckCheck,
  FolderCog,
  Building,
  UserCog,
  MessageSquare,
  CreditCard
} from 'lucide-react';

export const SYSTEM_MODULES = [
  {
    id: 'chart',
    label: 'Dental Chart (Odontogram)',
    badgeText: 'Interactive',
    description: 'Tooth surface charting, restorative procedures & perio diagnosis',
    icon: Activity,
    color: 'emerald',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'prescriptions',
    label: 'Prescription Pad (Rx)',
    badgeText: 'Digital Rx',
    description: 'Medication formulary, dosage calculators & prescription printing',
    icon: Pill,
    color: 'blue',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy & Stock POS',
    badgeText: 'Inventory',
    description: 'Drug inventory, POS dispensing, batch numbers & stock alerts',
    icon: Boxes,
    color: 'purple',
    defaultRoles: ['PHARMACIST', 'CLINIC_ADMIN']
  },
  {
    id: 'finance',
    label: 'Finance & Ledger',
    badgeText: 'Accounts',
    description: 'Financial ledger, revenue analysis, staff payroll & expenses',
    icon: DollarSign,
    color: 'emerald',
    defaultRoles: ['ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'patients',
    label: 'Patients (EHR)',
    badgeText: 'Records',
    description: 'Electronic health records, patient registration & medical tags',
    icon: Users,
    color: 'indigo',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'xray',
    label: 'Dental X-Ray & PACS',
    badgeText: 'DICOM',
    description: 'Digital radiograph viewer, contrast enhancement & imaging',
    icon: Scan,
    color: 'cyan',
    defaultRoles: ['DOCTOR', 'NURSE', 'CLINIC_ADMIN']
  },
  {
    id: 'orders',
    label: 'Dental Lab Orders',
    badgeText: 'Prosthetics',
    description: 'Crown, bridge & denture orders, shade tracking & delivery',
    icon: Package,
    color: 'amber',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'CLINIC_ADMIN']
  },
  {
    id: 'appointments',
    label: 'Appointments & Chairs',
    badgeText: 'Scheduler',
    description: 'Multi-chair calendar, doctor schedules & patient queue',
    icon: Calendar,
    color: 'rose',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'CLINIC_ADMIN']
  },
  {
    id: 'billing',
    label: 'Billing & Invoices',
    badgeText: 'Invoicing',
    description: 'Invoice generation, itemized fee billing & payment collection',
    icon: Receipt,
    color: 'teal',
    defaultRoles: ['RECEPTIONIST', 'ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'ai',
    label: 'AI Clinical Assistant',
    badgeText: 'AI Diagnostics',
    description: 'Smart clinical diagnostic insights & radiographic analysis',
    icon: Sparkles,
    color: 'violet',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'settings',
    label: 'Settings',
    badgeText: 'Admin Config',
    description: 'Clinic configuration, staff management, WhatsApp CRM & plan',
    icon: Settings,
    color: 'slate',
    defaultRoles: ['CLINIC_ADMIN']
  }
];

export const getDefaultModulesForRoles = (roles = []) => {
  const roleList = Array.isArray(roles) && roles.length > 0 ? roles : ['DOCTOR'];
  if (roleList.includes('CLINIC_ADMIN')) {
    return SYSTEM_MODULES.map(m => m.id);
  }
  const set = new Set();
  roleList.forEach(r => {
    SYSTEM_MODULES.forEach(mod => {
      if (mod.defaultRoles.includes(r)) {
        set.add(mod.id);
      }
    });
  });
  return Array.from(set);
};

const ROLE_OPTIONS = [
  {
    id: 'DOCTOR',
    label: 'Doctor / Dental Surgeon',
    subtitle: 'Clinical Chart, Prescriptions, Diagnosis & Planning',
    icon: Stethoscope,
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBorder: 'border-emerald-500 bg-emerald-50/50 text-emerald-950',
    checkColor: 'bg-emerald-600 border-emerald-600'
  },
  {
    id: 'CLINIC_ADMIN',
    label: 'Clinic Admin / Manager',
    subtitle: 'Full Clinic Governance, Staff & All Operations',
    icon: ShieldCheck,
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    accentBorder: 'border-blue-500 bg-blue-50/50 text-blue-950',
    checkColor: 'bg-blue-600 border-blue-600'
  },
  {
    id: 'RECEPTIONIST',
    label: 'Receptionist / Front Desk',
    subtitle: 'Appointments, Patient Registration, Queue & Invoicing',
    icon: UserCheck,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    accentBorder: 'border-amber-500 bg-amber-50/50 text-amber-950',
    checkColor: 'bg-amber-600 border-amber-600'
  },
  {
    id: 'PHARMACIST',
    label: 'Pharmacist / Inventory',
    subtitle: 'Medicine Catalog, Stock Batches, Expiry & POS Sales',
    icon: Boxes,
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    accentBorder: 'border-purple-500 bg-purple-50/50 text-purple-950',
    checkColor: 'bg-purple-600 border-purple-600'
  },
  {
    id: 'NURSE',
    label: 'Dental Assistant / Nurse',
    subtitle: 'Clinical Queue, Chairside Assistance, Vitals & Prep',
    icon: HeartPulse,
    badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    accentBorder: 'border-cyan-500 bg-cyan-50/50 text-cyan-950',
    checkColor: 'bg-cyan-600 border-cyan-600'
  }
];

export default function StaffManagement({
  authToken,
  activeTenant,
  currentUser
}) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalStaff, setDeleteModalStaff] = useState(null);
  const [editingRoleStaff, setEditingRoleStaff] = useState(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    roles: ['DOCTOR'],
    allowedModules: getDefaultModulesForRoles(['DOCTOR']),
    specialization: 'General Dental Surgeon',
    password: ''
  });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/staff', { headers: getHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Failed to fetch staff members.');
      }
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeTenant?.id]);

  // Toggle role in new staff multi-select
  const handleToggleNewStaffRole = (roleId) => {
    setNewStaff(prev => {
      const current = Array.isArray(prev.roles) && prev.roles.length > 0 ? prev.roles : (prev.role ? [prev.role] : []);
      let updated;
      if (current.includes(roleId)) {
        if (current.length === 1) {
          showToast('Staff account must have at least one assigned role.', 'error');
          return prev;
        }
        updated = current.filter(r => r !== roleId);
      } else {
        updated = [...current, roleId];
      }
      return {
        ...prev,
        roles: updated,
        role: updated.includes('CLINIC_ADMIN') ? 'CLINIC_ADMIN' : updated[0],
        allowedModules: getDefaultModulesForRoles(updated)
      };
    });
  };

  // Toggle navigation module permission in new staff
  const handleToggleNewStaffModule = (moduleId) => {
    setNewStaff(prev => {
      const current = Array.isArray(prev.allowedModules) ? prev.allowedModules : [];
      let updated;
      if (current.includes(moduleId)) {
        updated = current.filter(m => m !== moduleId);
      } else {
        updated = [...current, moduleId];
      }
      return { ...prev, allowedModules: updated };
    });
  };

  // Handle Add Staff
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    const assignedRoles = Array.isArray(newStaff.roles) && newStaff.roles.length > 0 ? newStaff.roles : ['DOCTOR'];
    const assignedModules = Array.isArray(newStaff.allowedModules) && newStaff.allowedModules.length > 0
      ? newStaff.allowedModules
      : getDefaultModulesForRoles(assignedRoles);

    const cleanUsername = (newStaff.username || newStaff.email || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleanUsername) {
      alert('Username must contain only letters and numbers.');
      return;
    }

    const payload = {
      name: newStaff.name,
      username: cleanUsername,
      email: newStaff.email || `${cleanUsername}@platform.local`,
      phone: newStaff.phone,
      password: newStaff.password || 'admin@123',
      specialization: newStaff.specialization,
      roles: assignedRoles,
      role: assignedRoles.includes('CLINIC_ADMIN') ? 'CLINIC_ADMIN' : assignedRoles[0],
      allowedModules: assignedModules
    };

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to add staff member.');

      showToast(`Staff account for "${newStaff.name}" added successfully with ${assignedRoles.length} role(s) & ${assignedModules.length} module permissions!`);
      setAddModalOpen(false);
      setNewStaff({
        name: '',
        username: '',
        email: '',
        phone: '',
        roles: ['DOCTOR'],
        allowedModules: getDefaultModulesForRoles(['DOCTOR']),
        specialization: 'General Dental Surgeon',
        password: ''
      });
      fetchStaff();
    } catch (err) {
      alert(`[Add Staff Error] ${err.message}`);
    }
  };

  // Handle Remove Staff
  const handleConfirmDelete = async () => {
    if (!deleteModalStaff) return;
    try {
      const res = await fetch(`/api/admin/staff/${deleteModalStaff.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to remove staff member.');

      showToast(`Staff member "${deleteModalStaff.name}" has been removed.`);
      setDeleteModalStaff(null);
      fetchStaff();
    } catch (err) {
      alert(`[Remove Staff Error] ${err.message}`);
    }
  };

  // Handle Toggle Status (Active / Suspended)
  const handleToggleStatus = async (staffMember) => {
    const nextStatus = staffMember.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/staff/${staffMember.id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff status.');

      showToast(`Account for "${staffMember.name}" is now ${nextStatus.toUpperCase()}.`);
      fetchStaff();
    } catch (err) {
      alert(`[Status Update Error] ${err.message}`);
    }
  };

  // Handle Revoke Sessions
  const handleRevokeSessions = async (staffMember) => {
    try {
      const res = await fetch(`/api/admin/staff/${staffMember.id}/revoke`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to revoke sessions.');

      showToast(`Active sessions for "${staffMember.name}" have been revoked.`);
    } catch (err) {
      alert(`[Revoke Error] ${err.message}`);
    }
  };

  // Handle Save Edited Roles & Module Access (Multiple Roles & Granular Privileges)
  const handleSaveEditedRoles = async (staffId, rolesToSave, modulesToSave) => {
    if (!rolesToSave || rolesToSave.length === 0) {
      alert('At least one role must remain selected.');
      return;
    }
    const finalModules = Array.isArray(modulesToSave) && modulesToSave.length > 0
      ? modulesToSave
      : getDefaultModulesForRoles(rolesToSave);

    try {
      const res = await fetch(`/api/admin/staff/${staffId}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          roles: rolesToSave,
          role: rolesToSave.includes('CLINIC_ADMIN') ? 'CLINIC_ADMIN' : rolesToSave[0],
          allowedModules: finalModules
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update roles.');

      showToast(`Roles & module permissions updated successfully (${finalModules.length} modules granted).`);
      setEditingRoleStaff(null);
      fetchStaff();
    } catch (err) {
      alert(`[Role Update Error] ${err.message}`);
    }
  };

  // Toggle module in edit modal
  const handleToggleEditStaffModule = (moduleId) => {
    setEditingRoleStaff(prev => {
      if (!prev) return null;
      const current = Array.isArray(prev.allowedModules) ? prev.allowedModules : [];
      let updated;
      if (current.includes(moduleId)) {
        updated = current.filter(m => m !== moduleId);
      } else {
        updated = [...current, moduleId];
      }
      return { ...prev, allowedModules: updated };
    });
  };

  // Role metadata helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'DOCTOR':
        return {
          label: 'Doctor / Surgeon',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: Stethoscope
        };
      case 'RECEPTIONIST':
        return {
          label: 'Receptionist / Front Desk',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: UserCheck
        };
      case 'PHARMACIST':
        return {
          label: 'Pharmacist / Inventory',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: Boxes
        };
      case 'NURSE':
        return {
          label: 'Dental Assistant / Nurse',
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          icon: HeartPulse
        };
      case 'CLINIC_ADMIN':
        return {
          label: 'Clinic Admin / Manager',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: ShieldCheck
        };
      default:
        return {
          label: role || 'Staff',
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: Users
        };
    }
  };

  // Filtered staff (supports multi-role matching)
  const filteredStaff = staff.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.username && s.username.toLowerCase().includes(q)) || s.email.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
    const userRoles = Array.isArray(s.roles) && s.roles.length > 0 ? s.roles : (s.role ? [s.role] : []);
    const matchesRole = roleFilter === 'ALL' || userRoles.includes(roleFilter);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role counts (counts members possessing each role)
  const doctorCount = staff.filter(s => (s.roles || [s.role]).includes('DOCTOR')).length;
  const receptionistCount = staff.filter(s => (s.roles || [s.role]).includes('RECEPTIONIST')).length;
  const pharmacistCount = staff.filter(s => (s.roles || [s.role]).includes('PHARMACIST')).length;
  const nurseCount = staff.filter(s => (s.roles || [s.role]).includes('NURSE')).length;
  const adminCount = staff.filter(s => (s.roles || [s.role]).includes('CLINIC_ADMIN')).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold transition shadow-lg ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-300'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono font-bold tracking-wider text-blue-300 mb-1">
            <span>Clinic RBAC Administration</span>
            <span>•</span>
            <span>{activeTenant?.name || 'Clinic Team'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <span>Staff & Team Management</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Add or remove clinical personnel (Doctor, Receptionist, Pharmacist, Nurse, Admin) with granular role-based permissions and session management.
          </p>
        </div>

        <button
          onClick={() => {
            setNewStaff({
              name: '',
              email: '',
              phone: '',
              roles: ['DOCTOR'],
              allowedModules: getDefaultModulesForRoles(['DOCTOR']),
              specialization: 'General Dental Surgeon',
              password: ''
            });
            setAddModalOpen(true);
          }}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-blue-500/20 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase mb-1">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{staff.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active team roster</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase mb-1">
            <span>Doctors</span>
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{doctorCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Surgeons & Clinicians</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase mb-1">
            <span>Receptionists</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{receptionistCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Front desk & billing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 text-[11px] font-bold uppercase mb-1">
            <span>Pharmacists</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{pharmacistCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Inventory & POS</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-[11px] font-bold uppercase mb-1">
            <span>Admins / Nurses</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{adminCount + nurseCount}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Governance & Care</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="DOCTOR">Doctors</option>
            <option value="RECEPTIONIST">Receptionists</option>
            <option value="PHARMACIST">Pharmacists</option>
            <option value="NURSE">Dental Assistants / Nurses</option>
            <option value="CLINIC_ADMIN">Clinic Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>

          <button
            onClick={fetchStaff}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Refresh staff list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Clinic Staff Directory
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {filteredStaff.length} Member{filteredStaff.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading clinic staff directory...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No staff members found</h4>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add a new team member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Permitted Modules (Menu Options)</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredStaff.map((s) => {
                  const roleMeta = getRoleBadge(s.role);
                  const RoleIcon = roleMeta.icon;
                  const isSelf = currentUser?.id === s.id;
                  const staffModules = Array.isArray(s.allowedModules) && s.allowedModules.length > 0
                    ? s.allowedModules
                    : getDefaultModulesForRoles(Array.isArray(s.roles) && s.roles.length > 0 ? s.roles : [s.role]);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs border border-blue-200 flex-shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{s.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                              <User className="w-3 h-3 text-blue-600" />
                              <span className="font-bold text-slate-700">@{s.username || (s.email ? s.email.split('@')[0] : 'user')}</span>
                              {s.email && !s.email.endsWith('@platform.local') && (
                                <span className="text-slate-400 font-normal">({s.email})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role (Multiple Badges) */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {((Array.isArray(s.roles) && s.roles.length > 0) ? s.roles : [s.role]).map((r) => {
                            const rMeta = getRoleBadge(r);
                            const RIcon = rMeta.icon;
                            return (
                              <span
                                key={r}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${rMeta.bg}`}
                              >
                                <RIcon className="w-3 h-3 flex-shrink-0" />
                                <span>{rMeta.label}</span>
                              </span>
                            );
                          })}
                          <button
                            onClick={() => {
                              const existingRoles = Array.isArray(s.roles) && s.roles.length > 0 ? [...s.roles] : [s.role];
                              const existingModules = Array.isArray(s.allowedModules) && s.allowedModules.length > 0
                                ? [...s.allowedModules]
                                : getDefaultModulesForRoles(existingRoles);
                              setEditingRoleStaff({
                                ...s,
                                roles: existingRoles,
                                allowedModules: existingModules
                              });
                            }}
                            className="text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2 py-0.5 font-bold transition flex items-center gap-0.5 ml-1"
                            title="Edit roles & module authorities"
                          >
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>

                      {/* Permitted Modules (Menu Options) */}
                      <td className="p-3.5">
                        <div className="space-y-1 max-w-[280px]">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {staffModules.length} of {SYSTEM_MODULES.length} Allowed
                            </span>
                            {staffModules.length === SYSTEM_MODULES.length ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                Full Access
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                                Customized
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {SYSTEM_MODULES.filter(m => staffModules.includes(m.id)).map(m => {
                              const MIcon = m.icon;
                              return (
                                <span
                                  key={m.id}
                                  title={`${m.label}: ${m.description}`}
                                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition cursor-help"
                                >
                                  <MIcon className="w-2.5 h-2.5 text-blue-600 flex-shrink-0" />
                                  <span className="truncate max-w-[70px]">{m.label.split(' ')[0]}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1 font-mono text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                          <span className="capitalize">{s.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-2">
                        {/* Suspend / Reactivate */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition ${
                              s.status === 'active'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                            title={s.status === 'active' ? 'Temporarily suspend account' : 'Reactivate account'}
                          >
                            {s.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}

                        {/* Revoke Sessions */}
                        <button
                          onClick={() => handleRevokeSessions(s)}
                          className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                          title="Force logout active sessions"
                        >
                          Revoke
                        </button>

                        {/* Remove Staff */}
                        {!isSelf && (
                          <button
                            onClick={() => setDeleteModalStaff(s)}
                            className="text-xs font-bold px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                            title="Remove staff member from clinic"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW STAFF MEMBER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Provision New Staff Account</h3>
                <p className="text-xs text-blue-100 mt-0.5">Add Doctor, Receptionist, Pharmacist, Nurse, or Admin</p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma or Sita Thapa"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Username (Letters & Numbers Only) *
                </label>
                <input
                  type="text"
                  required
                  pattern="[a-zA-Z0-9]+"
                  title="Only letters and numbers are allowed (no spaces or special characters)"
                  placeholder="e.g. drsarita or staff01"
                  value={newStaff.username || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                    setNewStaff({ ...newStaff, username: clean, email: clean ? `${clean.toLowerCase()}@platform.local` : '' });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Multi-Select Roles & Authorities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase text-xs">
                    Select Roles & Authorities * <span className="text-blue-600 font-normal lowercase">(multiple selection supported)</span>
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {(newStaff.roles || []).length} Selected
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] font-semibold text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, roles: ['DOCTOR', 'CLINIC_ADMIN'] }))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                  >
                    + Doctor & Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, roles: ['DOCTOR', 'PHARMACIST'] }))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                  >
                    + Doctor & Pharmacist
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, roles: ['RECEPTIONIST', 'PHARMACIST'] }))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                  >
                    + Reception & Pharmacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, roles: ['DOCTOR', 'CLINIC_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'NURSE'] }))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold transition"
                  >
                    All Roles (Full Access)
                  </button>
                </div>

                {/* Role Options Cards */}
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = (newStaff.roles || []).includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleNewStaffRole(opt.id)}
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? `${opt.accentBorder} shadow-sm ring-1 ring-blue-400/30`
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Custom Checkbox */}
                        <div className="pt-0.5 flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{opt.label}</h4>
                            {isSelected && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 italic pt-1">
                  💡 Staff members assigned multiple roles will receive combined privileges across all selected departments.
                </p>
              </div>

              {/* Specialization if Doctor role is selected */}
              {(newStaff.roles || []).includes('DOCTOR') && (
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200 animate-fadeIn">
                  <label className="block font-bold text-emerald-900 uppercase mb-1 text-[11px] flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                    Doctor Clinical Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oral & Maxillofacial Surgeon, Orthodontist, BDS, Endodontist"
                    value={newStaff.specialization}
                    onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                  <p className="text-[10px] text-emerald-700 mt-1">
                    This specialization will appear on digital prescriptions, doctor selection queues, and invoices.
                  </p>
                </div>
              )}

              {/* Navigation Menu & Module Access Privileges (11 Options from Sidebar) */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase text-xs">
                      Navigation Menu & Module Access Privileges *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Toggle which sections this staff member can access from the navigation sidebar
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {(newStaff.allowedModules || []).length} / {SYSTEM_MODULES.length} Permitted
                  </span>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] font-semibold text-slate-400">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, allowedModules: SYSTEM_MODULES.map(m => m.id) }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition"
                  >
                    Select All (11 Modules)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaff(prev => ({ ...prev, allowedModules: [] }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defs = getDefaultModulesForRoles(newStaff.roles || ['DOCTOR']);
                      setNewStaff(prev => ({ ...prev, allowedModules: defs }));
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                {/* Modules Grid (All 11 from the Sidebar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/70">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = (newStaff.allowedModules || []).includes(mod.id);
                    const ModIcon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleNewStaffModule(mod.id)}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'border-blue-500 bg-white ring-1 ring-blue-500/30 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5 flex-shrink-0">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <ModIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold truncate ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                              {mod.label}
                            </span>
                            {mod.badgeText && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1 rounded ml-1">
                                {mod.badgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mod.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phone & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+977 98000 00000"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    placeholder="Defaults to Staff@123"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition"
                >
                  Provision Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE STAFF */}
      {deleteModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Remove Staff Member?
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to remove <strong className="text-slate-900">{deleteModalStaff.name}</strong> ({deleteModalStaff.role}) from this clinic?
            </p>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              All active sessions will be terminated immediately and their account will be unlinked from {activeTenant?.name || 'this clinic'}.
            </p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModalStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition"
              >
                Yes, Remove Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROLES & AUTHORITIES FOR EXISTING STAFF */}
      {editingRoleStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Edit Staff Roles & Authorities</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Updating: <strong className="text-white">{editingRoleStaff.name}</strong> ({editingRoleStaff.email})
                </p>
              </div>
              <button
                onClick={() => setEditingRoleStaff(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">
                  Assigned Roles ({(editingRoleStaff.roles || []).length} Active)
                </span>
                <span className="text-[11px] text-slate-500">
                  Select 1 or more authorities
                </span>
              </div>

              {/* Quick Presets for Edit Modal */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[10px] font-semibold text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setEditingRoleStaff(prev => ({ ...prev, roles: ['DOCTOR', 'CLINIC_ADMIN'] }))}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                >
                  Doctor + Admin
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoleStaff(prev => ({ ...prev, roles: ['DOCTOR', 'PHARMACIST'] }))}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                >
                  Doctor + Pharmacist
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoleStaff(prev => ({ ...prev, roles: ['RECEPTIONIST', 'PHARMACIST'] }))}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition"
                >
                  Reception + Pharmacy
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoleStaff(prev => ({ ...prev, roles: ['DOCTOR', 'CLINIC_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'NURSE'] }))}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold transition"
                >
                  All Roles (Full Access)
                </button>
              </div>

              {/* Role Options Cards */}
              <div className="space-y-2">
                {ROLE_OPTIONS.map((opt) => {
                  const currentRoles = Array.isArray(editingRoleStaff.roles) ? editingRoleStaff.roles : [editingRoleStaff.role];
                  const isSelected = currentRoles.includes(opt.id);
                  const Icon = opt.icon;

                  const handleToggle = () => {
                    if (isSelected) {
                      if (currentRoles.length === 1) {
                        alert('A staff member must have at least one assigned role.');
                        return;
                      }
                      setEditingRoleStaff(prev => ({
                        ...prev,
                        roles: currentRoles.filter(r => r !== opt.id)
                      }));
                    } else {
                      setEditingRoleStaff(prev => ({
                        ...prev,
                        roles: [...currentRoles, opt.id]
                      }));
                    }
                  };

                  return (
                    <div
                      key={opt.id}
                      onClick={handleToggle}
                      className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? `${opt.accentBorder} shadow-sm ring-1 ring-blue-400/30`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5 flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{opt.label}</h4>
                          {isSelected && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Menu & Module Access Privileges (11 Options from Sidebar) */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase text-xs">
                      Permitted Navigation Menu & Modules *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Grant or revoke individual sidebar module access for this account
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {(editingRoleStaff.allowedModules || []).length} / {SYSTEM_MODULES.length} Permitted
                  </span>
                </div>

                {/* Quick Selection Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] font-semibold text-slate-400">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setEditingRoleStaff(prev => ({ ...prev, allowedModules: SYSTEM_MODULES.map(m => m.id) }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition"
                  >
                    Select All (11 Modules)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRoleStaff(prev => ({ ...prev, allowedModules: [] }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentRoles = Array.isArray(editingRoleStaff.roles) ? editingRoleStaff.roles : [editingRoleStaff.role];
                      const defs = getDefaultModulesForRoles(currentRoles);
                      setEditingRoleStaff(prev => ({ ...prev, allowedModules: defs }));
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition"
                  >
                    Apply Role Defaults
                  </button>
                </div>

                {/* Modules Grid (All 11 from the Sidebar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/70">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = (editingRoleStaff.allowedModules || []).includes(mod.id);
                    const ModIcon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleEditStaffModule(mod.id)}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'border-blue-500 bg-white ring-1 ring-blue-500/30 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5 flex-shrink-0">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <ModIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold truncate ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                              {mod.label}
                            </span>
                            {mod.badgeText && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1 rounded ml-1">
                                {mod.badgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mod.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Session Enforcement
                </div>
                <p>
                  Active logins for this staff member will automatically adopt these new roles & module permissions on their next API request or when they re-login.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRoleStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedRoles(editingRoleStaff.id, editingRoleStaff.roles, editingRoleStaff.allowedModules)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition"
                >
                  Save Role & Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

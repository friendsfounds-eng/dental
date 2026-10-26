import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DentalChart from './components/DentalChart/DentalChart';
import PatientManager from './components/Patients/PatientManager';
import AppointmentScheduler from './components/Appointments/AppointmentScheduler';
import AIAssistant from './components/AIAssistant/AIAssistant';
import WhatsAppCRM from './components/WhatsApp/WhatsAppCRM';
import BillingManager from './components/Billing/BillingManager';
import PrescriptionPad from './components/Prescription/PrescriptionPad';
import ClinicDashboard from './components/Dashboard/ClinicDashboard';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';
import ReceptionistDashboard from './components/Dashboard/ReceptionistDashboard';
import SuperAdminDashboard from './components/Dashboard/SuperAdminDashboard';
import DeveloperControlPanel from './components/Developer/DeveloperControlPanel';
import LoginModal from './components/Auth/LoginModal';
import SettingsHub from './components/Settings/SettingsHub';
import ClinicSettings from './components/Settings/ClinicSettings';
import PharmacyManager from './components/Pharmacy/PharmacyManager';
import StaffManagement from './components/Staff/StaffManagement';
import AccountAndSubscription from './components/Account/AccountAndSubscription';
import PatientOrders from './components/Patients/PatientOrders';
import FinanceManager from './components/Finance/FinanceManager';
import XRayImagingHub from './components/XRay/XRayImagingHub';
import ErrorBoundary from './components/Common/ErrorBoundary';
import {
  Package,
  LayoutDashboard,
  Activity,
  Users,
  Calendar,
  Menu
} from 'lucide-react';
import { openWhatsAppAutoLink } from './utils/whatsapp';
import AnayaCraftLogo from './components/Common/AnayaCraftLogo';
import DoctorAllocationModal from './components/Appointments/DoctorAllocationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('doctor-dashboard'); // Default directly to Dr. Mukesh Kushwaha's Clinical Queue
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allocatedDoctorModal, setAllocatedDoctorModal] = useState(null);

  // Authentication & Tenant State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dental_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'usr-dr-mukesh',
      name: 'Dr. Mukesh Kushwaha',
      email: 'dr.mukesh@nepaldental.com.np',
      role: 'DOCTOR',
      globalRole: null,
      tenantId: 'tenant-nepal-dental'
    };
  });

  const [activeTenant, setActiveTenant] = useState(() => {
    try {
      const saved = localStorage.getItem('dental_tenant');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'tenant-nepal-dental',
      name: 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.',
      slug: 'nepal-dental'
    };
  });

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('dental_auth_token') || '';
  });

  // Core Data
  const [clinicProfile, setClinicProfile] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [chairs, setChairs] = useState([]);
  const [treatmentCatalog, setTreatmentCatalog] = useState([]);
  const [medicineFormulary, setMedicineFormulary] = useState([]);
  const [pharmacyCatalog, setPharmacyCatalog] = useState([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availableTenants, setAvailableTenants] = useState([]);

  // Fetch all clinics accessible to current user
  const fetchMyTenants = async (token) => {
    try {
      const activeTok = token || authToken;
      const res = await fetch('/api/auth/my-tenants', {
        headers: {
          'Authorization': activeTok ? `Bearer ${activeTok}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableTenants(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to fetch accessible tenants:', e);
    }
  };

  // Switch active clinic for unified Super Admin
  const handleSwitchTenant = async (tenantId) => {
    if (!tenantId || tenantId === activeTenant?.id) return;
    try {
      setLoading(true);
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to switch clinic');

      localStorage.setItem('dental_auth_token', data.token);
      localStorage.setItem('dental_tenant', JSON.stringify(data.activeTenant));
      setAuthToken(data.token);
      setActiveTenant(data.activeTenant);
      if (data.user) setCurrentUser(data.user);

      await fetchData(data.token, data.activeTenant.id);
    } catch (err) {
      alert(`[Switch Clinic Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper for generating standard auth & tenant headers
  const getHeaders = (token = authToken, tenantId = activeTenant?.id) => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'x-tenant-id': tenantId || 'tenant-nepal-dental'
  });

  // Fetch initial data for the active clinic tenant
  const fetchData = async (overrideToken, overrideTenantId) => {
    try {
      setLoading(true);
      const token = overrideToken !== undefined ? overrideToken : authToken;
      const tenantId = overrideTenantId !== undefined ? overrideTenantId : (activeTenant?.id || 'tenant-nepal-dental');
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-tenant-id': tenantId
      };

      const [
        resClinic,
        resDocs,
        resChairs,
        resTrt,
        resMeds,
        resPharmMeds,
        resTpls,
        resPts,
        resApts
      ] = await Promise.all([
        fetch('/api/clinic', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/doctors', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/chairs', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/treatment-catalog', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/medicine-formulary', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/pharmacy/available-medicines', { headers: reqHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/whatsapp-templates', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/patients', { headers: reqHeaders }).then(r => r.json()),
        fetch('/api/appointments', { headers: reqHeaders }).then(r => r.json())
      ]);

      setClinicProfile(resClinic || {});
      setDoctors(Array.isArray(resDocs) ? resDocs : []);
      setChairs(Array.isArray(resChairs) ? resChairs : []);
      setTreatmentCatalog(Array.isArray(resTrt) ? resTrt : []);
      setMedicineFormulary(Array.isArray(resMeds) ? resMeds : []);
      setPharmacyCatalog(Array.isArray(resPharmMeds) ? resPharmMeds : []);
      setWhatsappTemplates(Array.isArray(resTpls) ? resTpls : []);

      const validPts = Array.isArray(resPts) ? resPts : [];
      setPatients(validPts);
      if (validPts.length > 0) {
        setSelectedPatientId(validPts[0].id);
      } else {
        setSelectedPatientId(null);
      }

      setAppointments(Array.isArray(resApts) ? resApts : []);
    } catch (err) {
      console.error('Error loading data from API:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auth Initialization on Mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('dental_auth_token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            if (data.activeTenant) setActiveTenant(data.activeTenant);
            setAuthToken(savedToken);
            fetchData(savedToken, data.activeTenant?.id);
            fetchMyTenants(savedToken);
            return;
          }
        } catch (e) {
          console.warn('Session verification failed, logging in default doctor:', e);
        }
      }

      // Default Login as Dr. Mukesh Kushwaha at Nepal Dental
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'dr.mukesh@nepaldental.com.np',
            password: 'Doctor@123'
          })
        });
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('dental_auth_token', data.token);
          localStorage.setItem('dental_user', JSON.stringify(data.user));
          localStorage.setItem('dental_tenant', JSON.stringify(data.activeTenant));
          setAuthToken(data.token);
          setCurrentUser(data.user);
          setActiveTenant(data.activeTenant);
          fetchData(data.token, data.activeTenant?.id);
          fetchMyTenants(data.token);
        } else {
          fetchData('', 'tenant-nepal-dental');
        }
      } catch (err) {
        console.error('Default login failed:', err);
        fetchData('', 'tenant-nepal-dental');
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (loginData) => {
    setAuthToken(loginData.token);
    setCurrentUser(loginData.user);
    setActiveTenant(loginData.activeTenant);

    // Switch to role-appropriate initial tab
    if (loginData.user.globalRole === 'PLATFORM_ADMIN') {
      setActiveTab('platform');
    } else if (loginData.user.role === 'CLINIC_ADMIN') {
      setActiveTab('dashboard');
    } else if (loginData.user.role === 'DOCTOR') {
      setActiveTab('doctor-dashboard');
    } else if (loginData.user.role === 'RECEPTIONIST') {
      setActiveTab('reception-dashboard');
    }

    fetchData(loginData.token, loginData.activeTenant?.id);
    fetchMyTenants(loginData.token);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getHeaders()
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('dental_auth_token');
    localStorage.removeItem('dental_user');
    localStorage.removeItem('dental_tenant');
    setAuthToken('');
    setLoginModalOpen(true);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // =====================
  // MUTATION HANDLERS
  // =====================

  // Tooth update (Odontogram)
  const handleUpdateTooth = async (toothId, toothData) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/teeth/${toothId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(toothData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied: Unable to modify dental chart.'}`);
        return;
      }
      const updatedChart = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === selectedPatient.id ? { ...p, dentalChart: updatedChart } : p
        )
      );
    } catch (err) {
      console.error('Error updating tooth:', err);
    }
  };

  // Treatment plan add
  const handleAddTreatmentPlan = async (plan) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/treatment-plans`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(plan)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const newPlan = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === selectedPatient.id
            ? { ...p, treatmentPlans: [...(p.treatmentPlans || []), newPlan] }
            : p
        )
      );
    } catch (err) {
      console.error('Error adding treatment plan:', err);
    }
  };

  // Treatment plan status update
  const handleUpdateTreatmentPlanStatus = async (planId, status) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/treatment-plans/${planId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const updated = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === selectedPatient.id
            ? {
                ...p,
                treatmentPlans: (p.treatmentPlans || []).map(tp =>
                  tp.id === planId ? updated : tp
                )
              }
            : p
        )
      );
    } catch (err) {
      console.error('Error updating plan status:', err);
    }
  };

  // Add Patient
  const handleAddPatient = async (patientData) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(patientData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || err.error || 'Could not register patient.');
        return;
      }
      const created = await res.json();
      setPatients(prev => [created, ...prev]);
      setSelectedPatientId(created.id);
      setActiveTab(currentUser?.role === 'RECEPTIONIST' ? 'patients' : 'chart');
    } catch (err) {
      console.error('Error adding patient:', err);
    }
  };

  // Update Patient
  const handleUpdatePatient = async (id, updates) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || err.error || 'Could not update patient.');
        return;
      }
      const updated = await res.json();
      setPatients(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };

  // Add Appointment
  const handleAddAppointment = async (aptData) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(aptData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Could not create appointment.'}`);
        return null;
      }
      const created = await res.json();
      setAppointments(prev => [created, ...prev]);

      // Pop-up message for allocated doctor when appointment is confirmed
      if (created.status === 'Confirmed') {
        setAllocatedDoctorModal(created);
      }
      return created;
    } catch (err) {
      console.error('Error adding appointment:', err);
      return null;
    }
  };

  // Update Appointment Status
  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Could not update appointment.'}`);
        return null;
      }
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));

      // Pop-up message for allocated doctor when status is updated to Confirmed
      if (status === 'Confirmed') {
        setAllocatedDoctorModal(updated);
      }
      return updated;
    } catch (err) {
      console.error('Error updating appointment:', err);
      return null;
    }
  };

  // Add Clinical SOAP Note
  const handleSaveSoapNote = async (noteData) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(noteData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Only clinical personnel may save SOAP notes.'}`);
        return;
      }
      const created = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === selectedPatient.id
            ? { ...p, notes: [created, ...(p.notes || [])] }
            : p
        )
      );
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  // Add Prescription
  const handleAddPrescription = async (targetPatientId, rxData) => {
    try {
      const res = await fetch(`/api/patients/${targetPatientId}/prescriptions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rxData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Policy Enforced] ${err.message || 'Only authenticated Doctors can prescribe medication.'}`);
        return;
      }
      const created = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === targetPatientId
            ? { ...p, prescriptions: [created, ...(p.prescriptions || [])] }
            : p
        )
      );
    } catch (err) {
      console.error('Error adding prescription:', err);
    }
  };

  // Add Invoice
  const handleAddInvoice = async (targetPatientId, invData) => {
    try {
      const res = await fetch(`/api/patients/${targetPatientId}/invoices`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(invData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Could not create invoice.'}`);
        return;
      }
      const created = await res.json();
      setPatients(prev =>
        prev.map(p =>
          p.id === targetPatientId
            ? {
                ...p,
                invoices: [created, ...(p.invoices || [])],
                ...(created.patientTicket || {})
              }
            : p
        )
      );
    } catch (err) {
      console.error('Error adding invoice:', err);
    }
  };

  // Update Clinic Profile
  const handleUpdateClinicProfile = async (newProfile) => {
    try {
      const res = await fetch('/api/clinic', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(newProfile)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Clinic configuration requires Super Admin role.'}`);
        return;
      }
      const updated = await res.json();
      setClinicProfile(updated);
    } catch (err) {
      console.error('Error updating clinic profile:', err);
    }
  };

  // Doctors Management
  const handleAddDoctor = async (doctorData) => {
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(doctorData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const created = await res.json();
      setDoctors(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Error adding doctor:', err);
    }
  };

  const handleUpdateDoctor = async (id, updates) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const updated = await res.json();
      setDoctors(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } catch (err) {
      console.error('Error updating doctor:', err);
    }
  };

  const handleDeleteDoctor = async (id) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting doctor:', err);
    }
  };

  // Dental Chairs Management
  const handleAddChair = async (chairName) => {
    try {
      const res = await fetch('/api/chairs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: chairName })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const updatedChairs = await res.json();
      if (Array.isArray(updatedChairs)) {
        setChairs(updatedChairs);
      }
      return updatedChairs;
    } catch (err) {
      console.error('Error adding chair:', err);
    }
  };

  const handleDeleteChair = async (chairName) => {
    try {
      const res = await fetch('/api/chairs', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ name: chairName })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const data = await res.json();
      if (data?.chairs) {
        setChairs(data.chairs);
      } else {
        setChairs(prev => prev.filter(c => c !== chairName));
      }
    } catch (err) {
      console.error('Error deleting chair:', err);
    }
  };

  // Treatment Catalog Management
  const handleAddTreatment = async (treatmentData) => {
    try {
      const res = await fetch('/api/treatment-catalog', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(treatmentData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const created = await res.json();
      setTreatmentCatalog(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Error adding treatment:', err);
    }
  };

  const handleUpdateTreatment = async (id, updates) => {
    try {
      const res = await fetch(`/api/treatment-catalog/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      const updated = await res.json();
      setTreatmentCatalog(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      console.error('Error updating treatment:', err);
    }
  };

  const handleDeleteTreatment = async (id) => {
    try {
      const res = await fetch(`/api/treatment-catalog/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`[RBAC Notice] ${err.message || 'Action denied.'}`);
        return;
      }
      setTreatmentCatalog(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting treatment:', err);
    }
  };

  // Global WhatsApp Messenger Launcher with Nepal format & wa.me auto link
  const handleOpenWhatsApp = (phone, text) => {
    if (!phone) return;
    openWhatsAppAutoLink(phone, text);
  };

  // Re-fetch live pharmacy stock & catalog for prescription pad
  const fetchPharmacyCatalog = async () => {
    try {
      const res = await fetch('/api/pharmacy/available-medicines', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPharmacyCatalog(Array.isArray(data) ? data : []);
        return data;
      }
    } catch (e) {
      console.warn('Failed to refresh pharmacy catalog:', e);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -top-32 -left-32 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -bottom-32 -right-32 pointer-events-none" />

        {/* Official Anaya Craft Logo Card - New Branding */}
        <div className="p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-sm w-full animate-fadeIn relative z-10 hover:shadow-blue-500/10 transition-shadow">
          <AnayaCraftLogo variant="stacked" size="lg" />
        </div>

        {/* Active Clinic Tenant Initializing Badge */}
        {activeTenant?.name && (
          <div className="mt-6 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2.5 shadow-xl backdrop-blur-md relative z-10 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-white tracking-wide">{activeTenant.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400 font-sans text-[11px] font-semibold">Dental Cloud SaaS Active</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        clinicProfile={clinicProfile}
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={(p) => setSelectedPatientId(p.id)}
        onQuickBook={() => setActiveTab('appointments')}
        currentUser={currentUser}
        activeTenant={activeTenant}
        availableTenants={availableTenants}
        onSwitchTenant={handleSwitchTenant}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenSubscription={() => setActiveTab('subscription')}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar with Dynamic Role-Based Menu (Responsive Drawer on Mobile/Tablet) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          activeTenant={activeTenant}
          patientCount={patients.length}
          appointmentCount={appointments.length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area (Auto-fits Mobile, Tablet & Desktop) */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 lg:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <ErrorBoundary key={activeTab}>
            {/* Active Patient Notification Pill in Odontogram View */}
          {selectedPatient && activeTab === 'chart' && (
            <div className="mb-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 sm:px-5 sm:py-3 rounded-2xl shadow-md flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-sm truncate">{selectedPatient.name}</span>
                    <span className="bg-white/20 font-mono text-[10px] px-2 py-0.5 rounded">
                      {selectedPatient.id}
                    </span>
                    <span className="text-xs text-blue-200">
                      ({selectedPatient.gender}, {selectedPatient.age} yrs • Blood: {selectedPatient.bloodGroup || 'N/A'})
                    </span>
                  </div>
                  <span className="text-xs text-emerald-300 font-mono block mt-0.5">
                    WhatsApp: {selectedPatient.phone}
                  </span>
                </div>
              </div>

              {/* Allergies / Medical alert */}
              <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
                {selectedPatient.allergies?.length > 0 && (
                  <span className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                    ⚠️ ALLERGY: {selectedPatient.allergies.join(', ')}
                  </span>
                )}
                <button
                  onClick={() => setActiveTab('ai')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-lg transition"
                >
                  Consult AI
                </button>
              </div>
            </div>
          )}

          {/* Platform Console (Developer Admin Only) */}
          {activeTab === 'platform' && (
            <DeveloperControlPanel
              authToken={authToken}
              onTenantUpdated={(updatedTenant) => {
                if (updatedTenant && updatedTenant.id === activeTenant?.id) {
                  setActiveTenant(updatedTenant);
                  try {
                    localStorage.setItem('dental_tenant', JSON.stringify(updatedTenant));
                  } catch (e) {}
                }
              }}
            />
          )}

          {/* Unified Dashboard Tab (Routes to Role-Specific Dashboard) */}
          {activeTab === 'dashboard' && (
            currentUser?.role === 'CLINIC_ADMIN' ? (
              <SuperAdminDashboard
                clinicProfile={clinicProfile}
                authToken={authToken}
                activeTenant={activeTenant}
                availableTenants={availableTenants}
                onSwitchTenant={handleSwitchTenant}
                onNavigate={setActiveTab}
                onSelectPatient={(p) => {
                  setSelectedPatientId(p.id);
                  setActiveTab('chart');
                }}
              />
            ) : currentUser?.role === 'DOCTOR' ? (
              <DoctorDashboard
                currentUser={currentUser}
                clinicProfile={clinicProfile}
                patients={patients}
                appointments={appointments}
                onNavigate={setActiveTab}
                onSelectPatient={(p) => {
                  setSelectedPatientId(p.id);
                  setActiveTab('chart');
                }}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            ) : currentUser?.role === 'RECEPTIONIST' ? (
              <ReceptionistDashboard
                currentUser={currentUser}
                clinicProfile={clinicProfile}
                patients={patients}
                appointments={appointments}
                onNavigate={setActiveTab}
                onSelectPatient={(p) => {
                  setSelectedPatientId(p.id);
                  setActiveTab('patients');
                }}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            ) : (
              <ClinicDashboard
                patients={patients}
                appointments={appointments}
                clinicProfile={clinicProfile}
                onNavigate={setActiveTab}
                onSelectPatient={(p) => setSelectedPatientId(p.id)}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )
          )}

          {/* Doctor Dedicated Dashboard */}
          {activeTab === 'doctor-dashboard' && (
            <DoctorDashboard
              currentUser={currentUser}
              clinicProfile={clinicProfile}
              patients={patients}
              appointments={appointments}
              onNavigate={setActiveTab}
              onSelectPatient={(p) => {
                setSelectedPatientId(p.id);
                setActiveTab('chart');
              }}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Receptionist Dedicated Dashboard */}
          {activeTab === 'reception-dashboard' && (
            <ReceptionistDashboard
              currentUser={currentUser}
              clinicProfile={clinicProfile}
              patients={patients}
              appointments={appointments}
              onNavigate={setActiveTab}
              onSelectPatient={(p) => {
                setSelectedPatientId(p.id);
                setActiveTab('patients');
              }}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Dental Chart (Odontogram) */}
          {activeTab === 'chart' && (
            <DentalChart
              patient={selectedPatient}
              patients={patients}
              treatmentCatalog={treatmentCatalog}
              onUpdateTooth={handleUpdateTooth}
              onAddTreatmentPlan={handleAddTreatmentPlan}
              onUpdateTreatmentPlanStatus={handleUpdateTreatmentPlanStatus}
              onOpenWhatsApp={handleOpenWhatsApp}
              clinicProfile={clinicProfile}
              currentUser={currentUser}
              activeTenant={activeTenant}
              authToken={authToken}
            />
          )}

          {/* Patients Directory */}
          {activeTab === 'patients' && (
            <PatientManager
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={(p) => {
                setSelectedPatientId(p.id);
              }}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onOpenWhatsApp={handleOpenWhatsApp}
              clinicProfile={clinicProfile}
              currentUser={currentUser}
              activeTenant={activeTenant}
              authToken={authToken}
              appointments={appointments}
              onNavigateTab={(tab, patient) => {
                if (patient) setSelectedPatientId(patient.id);
                setActiveTab(tab);
              }}
            />
          )}

          {/* Dedicated Tab: Dental Lab & Custom Orders Linked to Patient */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {/* Patient Selector Switcher Banner */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Dental Laboratory & Custom Orders
                    </h2>
                    <p className="text-xs text-slate-500">
                      Orders directly linked to each patient by unique Patient ID
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Active Patient:</span>
                  <select
                    value={selectedPatient?.id || (patients[0]?.id || '')}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} — {p.name} ({p.orders?.length || 0} orders)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <PatientOrders
                patient={selectedPatient || patients[0]}
                patients={patients}
                currentUser={currentUser}
                activeTenant={activeTenant}
                clinicProfile={clinicProfile}
                authToken={authToken}
                onSelectPatient={(p) => setSelectedPatientId(p.id)}
              />
            </div>
          )}

          {/* Dental X-Ray & Diagnostic Imaging PACS Hub */}
          {(activeTab === 'xray' || activeTab === 'imaging') && (
            <XRayImagingHub
              patients={patients}
              appointments={appointments}
              currentUser={currentUser}
              activeTenant={activeTenant}
              authToken={authToken}
              onNavigateTab={(tab, patient) => {
                if (patient) setSelectedPatientId(patient.id);
                setActiveTab(tab);
              }}
            />
          )}

          {/* Appointment Scheduler */}
          {activeTab === 'appointments' && (
            <AppointmentScheduler
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              chairs={chairs}
              onAddAppointment={handleAddAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onOpenWhatsApp={handleOpenWhatsApp}
              clinicProfile={clinicProfile}
              onSelectPatient={(p) => setSelectedPatientId(p?.id || p)}
              onNavigate={setActiveTab}
              onViewDoctorAllocation={(apt) => setAllocatedDoctorModal(apt)}
            />
          )}

          {/* AI Dental Assistant */}
          {activeTab === 'ai' && (
            <AIAssistant
              patient={selectedPatient}
              doctors={doctors}
              onSaveSoapNote={handleSaveSoapNote}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Billing & Invoices */}
          {activeTab === 'billing' && (
            <BillingManager
              patients={patients}
              selectedPatient={selectedPatient}
              doctors={doctors}
              clinicProfile={clinicProfile}
              treatmentCatalog={treatmentCatalog}
              onAddInvoice={handleAddInvoice}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Tab: Clinical Pharmacy & Stock Management */}
          {activeTab === 'pharmacy' && (
            <PharmacyManager
              clinicProfile={clinicProfile}
              patients={patients}
              authToken={authToken}
              activeTenant={activeTenant}
              currentUser={currentUser}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Tab: Finance Management & Revenue Ledger */}
          {activeTab === 'finance' && (
            <FinanceManager
              clinicProfile={clinicProfile}
              patients={patients}
              authToken={authToken}
              activeTenant={activeTenant}
              currentUser={currentUser}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Digital Prescription */}
          {activeTab === 'prescriptions' && (
            <PrescriptionPad
              patients={patients}
              selectedPatient={selectedPatient}
              doctors={doctors}
              clinicProfile={clinicProfile}
              medicineFormulary={medicineFormulary}
              pharmacyCatalog={pharmacyCatalog}
              onRefreshPharmacyCatalog={fetchPharmacyCatalog}
              onUpdateClinicProfile={handleUpdateClinicProfile}
              onAddPrescription={handleAddPrescription}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Clinic Settings Hub (Central Settings Folder: Clinic Config, Staff Management, WhatsApp Automation & Subscription) */}
          {['settings', 'staff', 'whatsapp', 'subscription'].includes(activeTab) && (
            <SettingsHub
              activeTab={activeTab}
              onTabChange={setActiveTab}
              currentUser={currentUser}
              activeTenant={activeTenant}
              authToken={authToken}
              clinicProfile={clinicProfile}
              doctors={doctors}
              chairs={chairs}
              treatmentCatalog={treatmentCatalog}
              pharmacyCatalog={pharmacyCatalog}
              patients={patients}
              appointments={appointments}
              whatsappTemplates={whatsappTemplates}
              onUpdateClinicProfile={handleUpdateClinicProfile}
              onAddDoctor={handleAddDoctor}
              onUpdateDoctor={handleUpdateDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onAddChair={handleAddChair}
              onDeleteChair={handleDeleteChair}
              onAddTreatment={handleAddTreatment}
              onUpdateTreatment={handleUpdateTreatment}
              onDeleteTreatment={handleDeleteTreatment}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (Sticky on Mobile Phones & Small Tablets) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden px-2 py-1 flex items-center justify-around shadow-lg no-print">
        <button
          onClick={() => setActiveTab('doctor-dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'doctor-dashboard' || activeTab === 'dashboard'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Clinical Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'chart'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Odontogram Chart"
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dental Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'patients'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Patient Records"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Patients</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'appointments'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Appointments & Chairs"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Bookings</span>
        </button>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-500 hover:text-blue-600 transition"
          title="More Features & Menus"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </div>

      {/* Role & Tenant Switcher / Authentication Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        currentUser={currentUser}
        activeTenant={activeTenant}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Pop-up Message for Allocated Doctor */}
      <DoctorAllocationModal
        isOpen={!!allocatedDoctorModal}
        onClose={() => setAllocatedDoctorModal(null)}
        appointment={allocatedDoctorModal}
        doctors={doctors}
        patients={patients}
        clinicProfile={clinicProfile}
        onNavigate={setActiveTab}
        onOpenWhatsApp={handleOpenWhatsApp}
      />
    </div>
  );
}

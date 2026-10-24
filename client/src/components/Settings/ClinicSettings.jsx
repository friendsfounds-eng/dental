import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  Check,
  DollarSign,
  UserCheck,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Search,
  X,
  UploadCloud,
  ImageIcon,
  Armchair,
  Ticket,
  CheckCircle2
} from 'lucide-react';

export default function ClinicSettings({
  clinicProfile = {},
  doctors = [],
  chairs = [],
  treatmentCatalog = [],
  onUpdateClinicProfile,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onAddChair,
  onDeleteChair,
  onAddTreatment,
  onUpdateTreatment,
  onDeleteTreatment
}) {
  const [profile, setProfile] = useState({ ...clinicProfile });
  const [profileSaved, setProfileSaved] = useState(false);
  const [newChairName, setNewChairName] = useState('');
  const [chairActionMsg, setChairActionMsg] = useState(null);
  const logoInputRef = useRef(null);

  // Sync state when clinicProfile updates
  useEffect(() => {
    if (clinicProfile && Object.keys(clinicProfile).length > 0) {
      setProfile(clinicProfile);
    }
  }, [clinicProfile]);

  // Logo file upload handler
  const handleLogoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Logo image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setProfile(prev => ({
        ...prev,
        logo: base64Data
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile(prev => ({
      ...prev,
      logo: ''
    }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Doctors Modal State
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialty: '',
    qualification: '',
    regNumber: '',
    phone: '',
    color: '#2563eb'
  });

  // Treatment Modal State
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] = useState(null);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [treatmentForm, setTreatmentForm] = useState({
    code: '',
    name: '',
    category: 'Restorative',
    defaultCost: ''
  });

  // Categories list
  const procedureCategories = [
    'Diagnostic',
    'Preventive',
    'Restorative',
    'Endodontics',
    'Prosthodontics',
    'Oral Surgery',
    'Implantology',
    'Periodontics',
    'Orthodontics',
    'Cosmetic',
    'Pediatric',
    'General'
  ];

  // Save Clinic Identity
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateClinicProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // DOCTOR HANDLERS
  const handleOpenAddDoctor = () => {
    setEditingDoctorId(null);
    setDoctorForm({
      name: '',
      specialty: 'General Dentistry',
      qualification: 'BDS',
      regNumber: '',
      phone: '',
      color: '#2563eb'
    });
    setDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctorId(doc.id);
    setDoctorForm({
      name: doc.name || '',
      specialty: doc.specialty || '',
      qualification: doc.qualification || '',
      regNumber: doc.regNumber || '',
      phone: doc.phone || '',
      color: doc.color || '#2563eb'
    });
    setDoctorModalOpen(true);
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!doctorForm.name.trim()) return;

    if (editingDoctorId) {
      await onUpdateDoctor(editingDoctorId, doctorForm);
    } else {
      await onAddDoctor(doctorForm);
    }
    setDoctorModalOpen(false);
  };

  const handleDeleteDoctorClick = async (docId, docName) => {
    if (window.confirm(`Are you sure you want to remove ${docName}?`)) {
      await onDeleteDoctor(docId);
    }
  };

  // CHAIR HANDLERS
  const handleAddNewChair = async (e) => {
    e.preventDefault();
    if (!newChairName.trim()) return;
    if (chairs.includes(newChairName.trim())) {
      setChairActionMsg('Chair name already exists!');
      setTimeout(() => setChairActionMsg(null), 3000);
      return;
    }
    if (onAddChair) {
      await onAddChair(newChairName.trim());
    }
    setNewChairName('');
    setChairActionMsg('Dental chair added successfully!');
    setTimeout(() => setChairActionMsg(null), 3000);
  };

  const handleRemoveChair = async (chairName) => {
    if (window.confirm(`Are you sure you want to remove "${chairName}"?`)) {
      if (onDeleteChair) {
        await onDeleteChair(chairName);
      }
      setChairActionMsg(`Removed "${chairName}"`);
      setTimeout(() => setChairActionMsg(null), 3000);
    }
  };

  // TREATMENT HANDLERS
  const handleOpenAddTreatment = () => {
    setEditingTreatmentId(null);
    setTreatmentForm({
      code: `D${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Restorative',
      defaultCost: ''
    });
    setTreatmentModalOpen(true);
  };

  const handleOpenEditTreatment = (trt) => {
    setEditingTreatmentId(trt.id);
    setTreatmentForm({
      code: trt.code || '',
      name: trt.name || '',
      category: trt.category || 'General',
      defaultCost: trt.defaultCost !== undefined ? String(trt.defaultCost) : ''
    });
    setTreatmentModalOpen(true);
  };

  const handleTreatmentSubmit = async (e) => {
    e.preventDefault();
    if (!treatmentForm.name.trim()) return;

    const payload = {
      code: treatmentForm.code || `D${Math.floor(1000 + Math.random() * 9000)}`,
      name: treatmentForm.name.trim(),
      category: treatmentForm.category,
      defaultCost: parseFloat(treatmentForm.defaultCost) || 0
    };

    if (editingTreatmentId) {
      await onUpdateTreatment(editingTreatmentId, payload);
    } else {
      await onAddTreatment(payload);
    }
    setTreatmentModalOpen(false);
  };

  const handleDeleteTreatmentClick = async (trtId, trtName) => {
    if (window.confirm(`Are you sure you want to delete procedure "${trtName}"?`)) {
      await onDeleteTreatment(trtId);
    }
  };

  const filteredTreatments = treatmentCatalog.filter(t =>
    (t.name || '').toLowerCase().includes(treatmentSearch.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(treatmentSearch.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(treatmentSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Clinic Settings & Master Practice Config</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your clinic identity, attending doctors & specialists, and master treatment procedure pricing catalog.
          </p>
        </div>

        {profileSaved && (
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Clinic Profile Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* 1. CLINIC IDENTITY SECTION */}
      <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Clinic Identity & Letterhead Header</span>
            </h3>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm flex items-center space-x-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Clinic Info</span>
            </button>
          </div>

          {/* Clinic Logo Customizer Box */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Clinic Logo (Custom Branding)
                </label>
                <span className="text-[11px] text-slate-500">
                  Upload your clinic logo in image format (PNG, JPG, SVG, WebP). Used on header, invoices, and Rx pad.
                </span>
              </div>
              {profile.logo && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Custom Logo Active
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Preview Box */}
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-blue-300 bg-slate-50 flex items-center justify-center p-2 shadow-inner overflow-hidden">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt="Clinic Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-1">
                      <span className="text-2xl block mb-1">🦷</span>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-tight">Default Tooth</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Actions */}
              <div className="flex-1 space-y-2 text-xs">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{profile.logo ? 'Change Logo Image' : 'Upload Clinic Logo'}</span>
                  </button>

                  {profile.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold px-3 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Supported formats: <strong>PNG, JPG, JPEG, SVG, WebP</strong> (Square or landscape, up to 5MB).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Currency Symbol</label>
              <input
                type="text"
                value={profile.currency || 'Rs.'}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={profile.tagline || ''}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Doctor In Charge (Head)</label>
              <input
                type="text"
                value={profile.doctorInCharge || ''}
                onChange={(e) => setProfile({ ...profile, doctorInCharge: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                NMC Reg. No. (Nepal Medical Council)
              </label>
              <input
                type="text"
                placeholder="e.g. NMC-84920"
                value={profile.regNo || ''}
                onChange={(e) => setProfile({ ...profile, regNo: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Primary Phone (+977)
              </label>
              <input
                type="text"
                placeholder="e.g. +977 98012 34567 / 01-4412345"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                PAN / VAT No.
              </label>
              <input
                type="text"
                placeholder="e.g. 601234567 (9-digit PAN / VAT)"
                value={profile.panVat !== undefined ? profile.panVat : (profile.gstin || '')}
                onChange={(e) => setProfile({ ...profile, panVat: e.target.value, gstin: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Email</label>
              <input
                type="email"
                placeholder="e.g. info@apexdental.com.np"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Clinic Physical Address
              </label>
              <input
                type="text"
                placeholder="e.g. Metro Healthcare Towers, New Baneshwor, Ward 10, Kathmandu, Nepal"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>

            {/* PATIENT TICKET CHARGE & REVISIT VALIDITY WINDOW (Automated OPD Consultation Fee & Free Revisit Expiry) */}
            <div className="sm:col-span-2 lg:col-span-3 mt-1 pt-4 border-t border-slate-200">
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 rounded-2xl border border-blue-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-blue-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        Patient Ticket Charge & Revisit Validity Window
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Automated OPD consultation / registration fee on visit creation with configurable free revisit window.
                      </p>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={profile.enableTicketCharge !== false}
                      onChange={(e) => setProfile({ ...profile, enableTicketCharge: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[8px] after:left-[14px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2.5 text-xs font-bold text-slate-800">
                      {profile.enableTicketCharge !== false ? 'Ticket Charge Active' : 'Ticket Charge Disabled'}
                    </span>
                  </label>
                </div>

                {profile.enableTicketCharge !== false && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Standard Ticket / OPD Fee */}
                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                          Standard Ticket / OPD Fee ({profile.currency || 'Rs.'}) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                            {profile.currency || 'Rs.'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            required
                            value={profile.ticketFee !== undefined ? profile.ticketFee : 200}
                            onChange={(e) => setProfile({ ...profile, ticketFee: parseFloat(e.target.value) || 0 })}
                            placeholder="200"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Billed on first visit or when revisit window expires
                        </span>
                      </div>

                      {/* Revisit Validity Window (visit_validity_days) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-slate-700 uppercase text-[11px]">
                            Revisit Validity Window (Days) *
                          </label>
                          <span className="text-[10px] font-bold text-blue-600 font-mono">
                            visit_validity_days
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            required
                            value={profile.visitValidityDays !== undefined ? profile.visitValidityDays : 7}
                            onChange={(e) => setProfile({ ...profile, visitValidityDays: parseInt(e.target.value) || 7 })}
                            placeholder="7"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                          />
                          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Days</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                          {[7, 10, 14, 30].map(days => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setProfile({ ...profile, visitValidityDays: days })}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                                (profile.visitValidityDays ?? 7) === days
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {days} Days
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ticket Item Label on Invoices */}
                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                          Ticket Label on Invoice & Bill
                        </label>
                        <input
                          type="text"
                          value={profile.ticketName || 'Registration & OPD Consultation Fee'}
                          onChange={(e) => setProfile({ ...profile, ticketName: e.target.value })}
                          placeholder="Registration & OPD Consultation Fee"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Appears as invoice procedure description
                        </span>
                      </div>
                    </div>

                    {/* Visual 3-Stage Business Logic Explainer Cards */}
                    <div className="p-3 bg-white rounded-xl border border-blue-200/90 text-xs space-y-2 shadow-2xs">
                      <span className="font-bold text-blue-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Automated Business Logic (Configured for {profile.visitValidityDays ?? 7} Days Window):</span>
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] pt-0.5">
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                          <div className="flex items-center space-x-1 text-blue-900 font-black">
                            <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center">1</span>
                            <span>First Visit / Expired</span>
                          </div>
                          <p className="text-slate-600 leading-snug">
                            No active ticket exists. Standard fee of <strong className="text-blue-900">{profile.currency || 'Rs.'} {profile.ticketFee ?? 200}</strong> is billed. Starts new {profile.visitValidityDays ?? 7}-day cycle.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                          <div className="flex items-center space-x-1 text-emerald-900 font-black">
                            <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center">2</span>
                            <span>Revisit ≤ {profile.visitValidityDays ?? 7} Days</span>
                          </div>
                          <p className="text-slate-600 leading-snug">
                            Within validity window. Fee is <strong className="text-emerald-700">waived ({profile.currency || 'Rs.'} 0.00 / Free Revisit)</strong>. Follow-up consultation is free of ticket charge.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                          <div className="flex items-center space-x-1 text-amber-900 font-black">
                            <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] flex items-center justify-center">3</span>
                            <span>Revisit &gt; {profile.visitValidityDays ?? 7} Days</span>
                          </div>
                          <p className="text-slate-600 leading-snug">
                            Validity has elapsed. Patient must pay <strong className="text-amber-900">{profile.currency || 'Rs.'} {profile.ticketFee ?? 200}</strong> for a new ticket, resetting validity for {profile.visitValidityDays ?? 7} days.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 2. DOCTORS & SPECIALISTS SECTION (EDITABLE) */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Doctors & Specialists in Practice ({doctors.length})</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Add attending dentists, visiting consultants, surgeons, and specialists.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddDoctor}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center space-x-1.5 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                      style={{ backgroundColor: d.color || '#2563eb' }}
                    >
                      {d.name ? d.name.replace('Dr.', '').trim().charAt(0) : 'D'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block leading-tight">{d.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{d.qualification}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditDoctor(d)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit Doctor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoctorClick(d.id, d.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete Doctor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-slate-600 text-[11px]">
                  <div className="font-semibold text-blue-700">
                    🩺 {d.specialty || 'General Dentistry'}
                  </div>
                  {d.regNumber && (
                    <div className="font-mono text-slate-500">
                      Reg: {d.regNumber}
                    </div>
                  )}
                  {d.phone && (
                    <div>
                      📞 {d.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DENTAL OPERATORY CHAIRS MANAGEMENT */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Armchair className="w-4 h-4 text-emerald-600" />
              <span>Dental Operatory Chairs ({chairs.length})</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Add or remove dental chairs for multi-operatory appointment scheduling and clinical chair tracking.
            </p>
          </div>

          {chairActionMsg && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200 animate-fadeIn">
              ✓ {chairActionMsg}
            </span>
          )}
        </div>

        {/* Add New Chair Form */}
        <form onSubmit={handleAddNewChair} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <input
            type="text"
            placeholder="e.g. Chair 4 (Orthodontics & Implants) or Pedo Chair"
            value={newChairName}
            onChange={(e) => setNewChairName(e.target.value)}
            className="flex-1 p-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dental Chair</span>
          </button>
        </form>

        {/* Chairs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chairs.map((chair, idx) => (
            <div
              key={chair || idx}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex items-center justify-between gap-2"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Armchair className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 text-xs block truncate">{chair}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">● Active Operatory</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveChair(chair)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                title={`Remove ${chair}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MASTER TREATMENT PROCEDURE CATALOG (EDITABLE) */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Master Dental Procedure Fee Catalog ({treatmentCatalog.length} Procedures)</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Customize procedure pricing, add new treatment plans, CDT codes, and standard clinic fees.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search procedures..."
                value={treatmentSearch}
                onChange={(e) => setTreatmentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddTreatment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Treatment</span>
            </button>
          </div>
        </div>

        {/* Procedures Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white max-h-96 shadow-inner">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">CDT / Code</th>
                <th className="py-2.5 px-3">Procedure Name</th>
                <th className="py-2.5 px-3">Clinical Category</th>
                <th className="py-2.5 px-3 text-right">Standard Fee ({profile.currency || 'Rs.'})</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    No matching procedures found. Click "Add New Treatment" to create one.
                  </td>
                </tr>
              ) : (
                filteredTreatments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {t.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded text-[10px]">
                        {t.category || 'General'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-right text-slate-900">
                      {profile.currency || 'Rs.'} {Number(t.defaultCost || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTreatment(t)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Edit Procedure"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTreatmentClick(t.id, t.name)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Procedure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCTOR MODAL (ADD / EDIT) */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>{editingDoctorId ? 'Edit Doctor Information' : 'Add New Doctor / Specialist'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                className="text-white/80 hover:text-white p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Karki"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BDS, MDS"
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Medical / NMC Reg. No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NMC-18294"
                    value={doctorForm.regNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, regNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Specialty / Department *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Endodontics, Orthodontics, Oral Surgery, Prosthodontics"
                  value={doctorForm.specialty}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Mobile Number / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+977 98412 34567"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Doctor Profile Color Tag
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0284c7'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDoctorForm({ ...doctorForm, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        doctorForm.color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDoctorModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow-sm"
                >
                  {editingDoctorId ? 'Save Changes' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TREATMENT PROCEDURE MODAL (ADD / EDIT) */}
      {treatmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>{editingTreatmentId ? 'Edit Procedure & Fee' : 'Add New Dental Procedure'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setTreatmentModalOpen(false)}
                className="text-white/80 hover:text-white p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTreatmentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="D2391"
                    value={treatmentForm.code}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, code: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Clinical Category *
                  </label>
                  <select
                    value={treatmentForm.category}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {procedureCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Composite Resin Restoration (Class II)"
                  value={treatmentForm.name}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Standard Fee / Price ({profile.currency || 'Rs.'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  placeholder="e.g. 2500"
                  value={treatmentForm.defaultCost}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, defaultCost: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-emerald-400 bg-emerald-50/20 font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTreatmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg shadow-sm"
                >
                  {editingTreatmentId ? 'Update Procedure' : 'Add Procedure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

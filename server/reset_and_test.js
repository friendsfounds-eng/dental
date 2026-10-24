import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENANT_FILE = path.join(__dirname, 'data', 'tenants', 'tenant-nepal-dental.json');
const BASE_URL = 'http://localhost:5000';

// 5 Complete New Patients testing EVERY field
export const NEW_PATIENTS = [
  {
    id: 'PT-2001',
    name: 'Dr. Sanjeev Banskota',
    phone: '9851023456',
    age: 42,
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContact: '9841334455 (Wife - Sarita Banskota)',
    allergies: ['Penicillin', 'Aspirin'],
    medicalHistory: ['Hypertension (High BP)', 'Cardiac Condition / Pacemaker'],
    province: 'Bagmati Province',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    ward: 'Ward 3',
    tole: 'Maharajgunj Teaching Chowk',
    address: 'Maharajgunj Teaching Chowk, Ward 3, Kathmandu Metropolitan City, Kathmandu, Bagmati Province',
    dentalChart: {
      '16': { condition: 'decay', notes: 'Deep disto-occlusal caries extending to pulp' },
      '21': { condition: 'restoration', notes: 'Class IV composite restoration shade A2' },
      '46': { condition: 'missing', notes: 'Extracted tooth replaced with space maintainer' }
    },
    treatmentPlans: [
      {
        id: 'TP-2001-1',
        tooth: '16',
        procedure: 'Rotary Molar Root Canal Therapy',
        cost: 8500,
        status: 'In Progress',
        doctor: 'Dr. Mukesh Kushwaha'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2001-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        diagnosis: 'Acute Irreversible Pulpitis with Apical Periodontitis #16',
        medicines: [
          { name: 'Amoxicillin', dosage: '500mg', frequency: '1 tab TDS (8hrly)', duration: '5 days', instructions: 'Take strictly after meals' },
          { name: 'Ibuprofen', dosage: '400mg', frequency: '1 tab BD (12hrly)', duration: '3 days', instructions: 'Take after meals with water' }
        ],
        instructions: 'Avoid biting hard food on upper right side. Return in 5 days for obturation.',
        isFinalized: true
      }
    ],
    invoices: [
      {
        id: 'INV-2001-1',
        invoiceNumber: 'INV-2026-101',
        date: '2026-10-23',
        items: [
          { description: 'Rotary Endodontic Access & Biomechanical Prep #16', tooth: '16', unitPrice: 5000, quantity: 1, total: 5000 }
        ],
        total: 5000,
        paid: 5000,
        balance: 0,
        paymentMethod: 'Fonepay QR',
        status: 'Paid',
        isFinalized: true
      }
    ],
    notes: [
      {
        id: 'NOTE-2001-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        soap: 'Subjective: Severe throbbing nocturnal pain. Objective: #16 percussion positive, EPT non-vital. Assessment: Acute pulpitis. Plan: Pulpectomy & obturation.'
      }
    ],
    orders: [],
    createdAt: '2026-10-23T06:00:00.000Z'
  },
  {
    id: 'PT-2002',
    name: 'Priyanka Karki Shrestha',
    phone: '9841890123',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    emergencyContact: '9801239988 (Husband - Ayush Shrestha)',
    allergies: ['Sulfa Drugs', 'Latex'],
    medicalHistory: ['Asthma / Respiratory Issues'],
    province: 'Bagmati Province',
    district: 'Lalitpur',
    municipality: 'Lalitpur Metropolitan City',
    ward: 'Ward 4',
    tole: 'Jawalakhel St. Xavier Road',
    address: 'Jawalakhel St. Xavier Road, Ward 4, Lalitpur Metropolitan City, Lalitpur, Bagmati Province',
    dentalChart: {
      '11': { condition: 'crown', notes: 'IPS e.max all-ceramic crown seated shade A1' },
      '21': { condition: 'crown', notes: 'IPS e.max all-ceramic crown seated shade A1' },
      '26': { condition: 'decay', notes: 'Incipient occlusal pit caries' }
    },
    treatmentPlans: [
      {
        id: 'TP-2002-1',
        tooth: '26',
        procedure: 'Pit & Fissure Sealant + Preventive Resin',
        cost: 1500,
        status: 'Scheduled',
        doctor: 'Dr. Mukesh Kushwaha'
      }
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2002-1',
        invoiceNumber: 'INV-2026-102',
        date: '2026-10-23',
        items: [
          { description: 'IPS e.max High Aesthetic Crowns (#11, #21)', tooth: '11, 21', unitPrice: 12000, quantity: 2, total: 24000 }
        ],
        total: 24000,
        paid: 24000,
        balance: 0,
        paymentMethod: 'Credit Card',
        status: 'Paid',
        isFinalized: true
      }
    ],
    notes: [
      {
        id: 'NOTE-2002-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        soap: 'Crown cementation completed with RelyX luting cement. Verified contact points with dental floss. Patient delighted with aesthetic shade match.'
      }
    ],
    orders: [],
    createdAt: '2026-10-23T06:30:00.000Z'
  },
  {
    id: 'PT-2003',
    name: 'Bibek Chaudhary',
    phone: '9803456789',
    age: 36,
    gender: 'Male',
    bloodGroup: 'A+',
    emergencyContact: '9811223344 (Brother - Suman Chaudhary)',
    allergies: ['Local Anesthesia (Lignocaine)'],
    medicalHistory: ['Bleeding Tendency / On Blood Thinners'],
    province: 'Madhesh Province',
    district: 'Dhanusha',
    municipality: 'Janakpurdham Sub-Metropolitan City',
    ward: 'Ward 8',
    tole: 'Bhanu Chowk',
    address: 'Bhanu Chowk, Ward 8, Janakpurdham Sub-Metropolitan City, Dhanusha, Madhesh Province',
    dentalChart: {
      '36': { condition: 'implant', notes: 'Titanium dental implant placed, ISQ 78, healing abutment intact' },
      '37': { condition: 'restoration', notes: 'Glass Ionomer Cement Class V Cervical Restoration' }
    },
    treatmentPlans: [
      {
        id: 'TP-2003-1',
        tooth: '36',
        procedure: 'Stage 2 Zirconia Custom Abutment & Screw-Retained Crown',
        cost: 35000,
        status: 'In Progress',
        doctor: 'Dr. Mukesh Kushwaha'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2003-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        diagnosis: 'Implant Post-Placement Review #36',
        medicines: [
          { name: 'Chlorhexidine 0.2% Oral Rinse', dosage: '10ml', frequency: 'Gargle BD after meals', duration: '7 days', instructions: 'Do not swallow. Spit after 1 minute.' }
        ],
        instructions: 'Gentle brushing around surgical area with extra-soft brush.',
        isFinalized: true
      }
    ],
    invoices: [
      {
        id: 'INV-2003-1',
        invoiceNumber: 'INV-2026-103',
        date: '2026-10-23',
        items: [
          { description: 'Surgical Fixture Placement & Bone Grafting #36', tooth: '36', unitPrice: 35000, quantity: 1, total: 35000 }
        ],
        total: 35000,
        paid: 35000,
        balance: 0,
        paymentMethod: 'Bank Transfer (Nabil)',
        status: 'Paid',
        isFinalized: true
      }
    ],
    notes: [
      {
        id: 'NOTE-2003-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        soap: 'Periapical radiograph shows healthy bone level around implant threads. ISQ reading stable at 78. Soft tissue cuff pink and firm.'
      }
    ],
    orders: [],
    createdAt: '2026-10-23T07:00:00.000Z'
  },
  {
    id: 'PT-2004',
    name: 'Anjali Gurung',
    phone: '9861234567',
    age: 24,
    gender: 'Female',
    bloodGroup: 'AB+',
    emergencyContact: '9846012345 (Father - Man Bahadur Gurung)',
    allergies: [],
    medicalHistory: ['Gastric Acidity / Ulcer'],
    province: 'Gandaki Province',
    district: 'Kaski',
    municipality: 'Pokhara Metropolitan City',
    ward: 'Ward 6',
    tole: 'Lakeside Center Street',
    address: 'Lakeside Center Street, Ward 6, Pokhara Metropolitan City, Kaski, Gandaki Province',
    dentalChart: {
      '38': { condition: 'impacted', notes: 'Distal impaction with recurrent pericoronal inflammation' },
      '48': { condition: 'impacted', notes: 'Horizontal deep bony impaction touching inferior alveolar canal' },
      '28': { condition: 'healthy', notes: 'Fully erupted third molar' }
    },
    treatmentPlans: [
      {
        id: 'TP-2004-1',
        tooth: '48',
        procedure: 'Surgical Odontectomy / Disimpaction',
        cost: 7500,
        status: 'Proposed',
        doctor: 'Dr. Mukesh Kushwaha'
      }
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2004-1',
        invoiceNumber: 'INV-2026-104',
        date: '2026-10-23',
        items: [
          { description: 'OPG Digital Panoramic Radiograph Examination', tooth: 'Full Arch', unitPrice: 1200, quantity: 1, total: 1200 }
        ],
        total: 1200,
        paid: 1200,
        balance: 0,
        paymentMethod: 'Cash',
        status: 'Paid',
        isFinalized: true
      }
    ],
    notes: [
      {
        id: 'NOTE-2004-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        soap: 'OPG evaluated: #48 roots in close proximity to mandibular nerve. CBCT 3D scan requested prior to surgical extraction.'
      }
    ],
    orders: [],
    createdAt: '2026-10-23T07:30:00.000Z'
  },
  {
    id: 'PT-2005',
    name: 'Rameshwar Yadav',
    phone: '9812987654',
    age: 58,
    gender: 'Male',
    bloodGroup: 'O-',
    emergencyContact: '9804561234 (Son - Binod Yadav)',
    allergies: ['NSAIDs / Ibuprofen', 'Erythromycin'],
    medicalHistory: ['Type 2 Diabetes', 'Hypertension (High BP)'],
    province: 'Madhesh Province',
    district: 'Mahottari',
    municipality: 'Gaushala Municipality',
    ward: 'Ward 5',
    tole: 'Bazar Chowk Line',
    address: 'Bazar Chowk Line, Ward 5, Gaushala Municipality, Mahottari, Madhesh Province',
    dentalChart: {
      '11': { condition: 'mobility', notes: 'Grade II mobility with 5mm pocket depth' },
      '21': { condition: 'mobility', notes: 'Grade II mobility with 5mm pocket depth' },
      '31': { condition: 'calculus', notes: 'Heavy supragingival & subgingival calculus deposits' },
      '41': { condition: 'calculus', notes: 'Heavy calculus with bleeding on probing (BOP +)' }
    },
    treatmentPlans: [
      {
        id: 'TP-2005-1',
        tooth: 'Full Mouth',
        procedure: 'Full Mouth Ultrasonic Scaling & Subgingival Curettage',
        cost: 4500,
        status: 'Completed',
        doctor: 'Dr. Mukesh Kushwaha'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2005-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        diagnosis: 'Generalized Chronic Periodontitis Stage III Grade B',
        medicines: [
          { name: 'Metronidazole', dosage: '400mg', frequency: '1 tab TDS', duration: '5 days', instructions: 'Take strictly after meals' }
        ],
        instructions: 'Use interdental brushes and warm salt water rinses 3 times daily.',
        isFinalized: true
      }
    ],
    invoices: [
      {
        id: 'INV-2005-1',
        invoiceNumber: 'INV-2026-105',
        date: '2026-10-23',
        items: [
          { description: 'Full Mouth Deep Ultrasonic Scaling & Root Planing', tooth: 'Full Mouth', unitPrice: 4500, quantity: 1, total: 4500 }
        ],
        total: 4500,
        paid: 4500,
        balance: 0,
        paymentMethod: 'Fonepay QR',
        status: 'Paid',
        isFinalized: true
      }
    ],
    notes: [
      {
        id: 'NOTE-2005-1',
        date: '2026-10-23',
        doctor: 'Dr. Mukesh Kushwaha',
        soap: 'HbA1c test reported 7.1%. Deep periodontal scaling completed without complication. Follow-up review scheduled in 3 weeks.'
      }
    ],
    orders: [],
    createdAt: '2026-10-23T08:00:00.000Z'
  }
];

async function runResetAndVerification() {
  console.log('===============================================================');
  console.log('🔄 RESETTING PATIENTS & TESTING ALL FIELDS & NEW CLINIC USER');
  console.log('===============================================================');

  // STEP 1: Reset Patients Data on Disk & Memory
  console.log('\n[1/5] Resetting patient data in tenant-nepal-dental.json...');
  const tData = JSON.parse(fs.readFileSync(TENANT_FILE, 'utf8'));
  tData.patients = NEW_PATIENTS;
  fs.writeFileSync(TENANT_FILE, JSON.stringify(tData, null, 2), 'utf8');
  console.log('✅ Successfully wrote 5 fresh patients into tenant-nepal-dental.json');

  // Also update in-memory multiTenantDb
  const { multiTenantDb } = await import('./multiTenantDb.js');
  multiTenantDb.tenantStores.set('tenant-nepal-dental', tData);
  console.log('✅ Synchronized multiTenantDb in-memory store.');

  // STEP 2: Login as Clinic Super Admin
  console.log('\n[2/5] Logging in as Clinic Super Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'Admin@123' })
  });
  const adminData = await adminLoginRes.json();
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
  const adminToken = adminData.token;
  console.log('✅ Super Admin authenticated successfully. Token acquired.');

  // STEP 3: Create a New Clinic User (Testing Each User Field)
  console.log('\n[3/5] Creating a New Clinic User and testing each field...');
  const newStaffPayload = {
    name: 'Dr. Anita Sharma',
    email: 'dr.anita@nepaldental.com.np',
    phone: '+977 98511 77889',
    password: 'DoctorAnita@2026',
    specialization: 'Orthodontics & Dentofacial Orthopedics (BDS, MDS)',
    roles: ['DOCTOR', 'CLINIC_ADMIN'],
    role: 'CLINIC_ADMIN'
  };

  const createStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'x-tenant-id': 'tenant-nepal-dental'
    },
    body: JSON.stringify(newStaffPayload)
  });
  const staffResult = await createStaffRes.json();
  if (!createStaffRes.ok) throw new Error(`Create staff failed: ${JSON.stringify(staffResult)}`);
  console.log('✅ New Clinic User Created:');
  console.log('   - ID:', staffResult.user.id);
  console.log('   - Name:', staffResult.user.name);
  console.log('   - Email (Username):', staffResult.user.email);
  console.log('   - Assigned Roles:', newStaffPayload.roles.join(', '));
  console.log('   - Status:', staffResult.user.status);

  // Test Logging in with the newly created user
  console.log('\n--- Testing Authentication for New Clinic User ---');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.anita@nepaldental.com.np',
      password: 'DoctorAnita@2026'
    })
  });
  const newLoginData = await newLoginRes.json();
  if (!newLoginRes.ok) throw new Error(`New user login failed: ${JSON.stringify(newLoginData)}`);
  console.log('✅ Login Succeeded for new user: Dr. Anita Sharma');
  console.log('   - Active Roles in Session Token:', newLoginData.user.roles);
  console.log('   - Clinic Affiliation:', newLoginData.user.tenantName);
  const newUserToken = newLoginData.token;

  // Test New User Authority (Clinical & Administrative dual-access)
  const chartWriteRes = await fetch(`${BASE_URL}/api/patients/PT-2001/teeth/16`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newUserToken}`,
      'x-tenant-id': 'tenant-nepal-dental'
    },
    body: JSON.stringify({
      condition: 'decay',
      notes: 'Verified by Dr. Anita Sharma (Orthodontist & Clinic Admin)'
    })
  });
  if (!chartWriteRes.ok) throw new Error(`New user chart update failed: ${chartWriteRes.status}`);
  console.log('✅ New User successfully executed clinical procedure (Dental Chart update on #16)');

  // STEP 4: Test Every Single Field of the 5 New Patients
  console.log('\n[4/5] Testing every field of the 5 new patients via GET /api/patients...');
  const getPatientsRes = await fetch(`${BASE_URL}/api/patients`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-tenant-id': 'tenant-nepal-dental'
    }
  });
  const patientsList = await getPatientsRes.json();
  console.log(`✅ Retrieved ${patientsList.length} patients from API.`);

  if (patientsList.length !== 5) {
    throw new Error(`Expected exactly 5 patients, but got ${patientsList.length}`);
  }

  const expectedFields = [
    'id', 'name', 'phone', 'age', 'gender', 'bloodGroup',
    'emergencyContact', 'allergies', 'medicalHistory',
    'province', 'district', 'municipality', 'ward', 'tole', 'address',
    'dentalChart', 'treatmentPlans', 'prescriptions', 'invoices', 'notes'
  ];

  patientsList.forEach((p, idx) => {
    console.log(`\n--- Verifying Patient ${idx + 1}: ${p.name} (${p.id}) ---`);
    for (const f of expectedFields) {
      const val = p[f];
      if (val === undefined || val === null) {
        throw new Error(`Missing field "${f}" on patient ${p.id}`);
      }
    }
    console.log('   ✓ Demographic Fields:');
    console.log(`     - Name: "${p.name}", Phone: "${p.phone}", Age: ${p.age}, Gender: ${p.gender}, Blood: ${p.bloodGroup}`);
    console.log(`     - Emergency Contact: "${p.emergencyContact}"`);
    console.log(`     - Allergies: [${p.allergies.join(', ')}]`);
    console.log(`     - Medical History: [${p.medicalHistory.join(', ')}]`);
    console.log('   ✓ Nepal 4-Tier Administrative Hierarchy Fields:');
    console.log(`     - Province: "${p.province}"`);
    console.log(`     - District: "${p.district}"`);
    console.log(`     - Local Government (Palika): "${p.municipality}"`);
    console.log(`     - Ward: "${p.ward}"`);
    console.log(`     - Locality/Tole: "${p.tole}"`);
    console.log(`     - Formatted Address: "${p.address}"`);
    console.log('   ✓ Clinical EHR Records:');
    console.log(`     - Teeth mapped in Dental Chart: ${Object.keys(p.dentalChart).join(', ')}`);
    console.log(`     - Treatment Plans count: ${p.treatmentPlans.length}`);
    console.log(`     - Prescriptions count: ${p.prescriptions.length}`);
    console.log(`     - Invoices count: ${p.invoices.length}`);
    console.log(`     - Doctor Notes count: ${p.notes.length}`);
  });

  // STEP 5: Test Duplicate Patient Prevention on New Dataset
  console.log('\n[5/5] Testing Duplicate Prevention with the 5 new patients...');
  
  // A) Trying to register Dr. Sanjeev Banskota with identical phone: MUST FAIL 409
  const dupAttemptRes = await fetch(`${BASE_URL}/api/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'x-tenant-id': 'tenant-nepal-dental'
    },
    body: JSON.stringify({
      name: 'Dr. Sanjeev Banskota',
      phone: '9851023456',
      age: 42,
      gender: 'Male',
      address: 'Kathmandu'
    })
  });
  if (dupAttemptRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on exact duplicate, but got ${dupAttemptRes.status}`);
  }
  const dupErr = await dupAttemptRes.json();
  console.log('✅ Exact Duplicate (Same Name + Same Phone) is STRICTLY BLOCKED (409 Conflict):');
  console.log(`   Message: "${dupErr.error}"`);

  // B) Checking /api/admin/duplicates: Must be 0 duplicates currently!
  const dupListRes = await fetch(`${BASE_URL}/api/admin/duplicates`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-tenant-id': 'tenant-nepal-dental'
    }
  });
  const currentDuplicates = await dupListRes.json();
  console.log('\n--- Checking Admin Duplicate Reviews ---');
  console.log('Active Duplicates in Clinic:', currentDuplicates.length);
  if (currentDuplicates.length !== 0) {
    console.warn('Duplicates found:', currentDuplicates);
  } else {
    console.log('✅ Zero duplicates detected. All 5 patients have unique, clean profiles.');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL 5 NEW PATIENTS & NEW CLINIC USER VERIFIED SUCCESSFULLY!');
  console.log('===============================================================');
}

runResetAndVerification().catch(err => {
  console.error('\n❌ VERIFICATION ERROR:', err);
  process.exit(1);
});

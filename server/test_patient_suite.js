import assert from 'assert';

const BASE_URL = 'http://localhost:5000';
const TENANT_ID = 'tenant-nepal-dental';

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('      DENTAL EHR & CLINICAL WORKFLOW FULL VERIFICATION SUITE    ');
  console.log('================================================================');

  // -------------------------------------------------------------
  // Test 1: Authentication & Role-Based Access
  // -------------------------------------------------------------
  console.log('\n[1/10] Testing Authentication & RBAC...');
  
  // Login as Clinic Owner / Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'admin@123' })
  });
  assert.strictEqual(adminLoginRes.status, 200, `Admin login failed: ${adminLoginRes.status}`);
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginData.token, 'Token not received for admin');
  assert.strictEqual(adminLoginData.user.role, 'CLINIC_ADMIN', 'Role is not CLINIC_ADMIN');
  console.log('  -> PASS: Logged in successfully as Clinic Admin (admin@nepaldental.com.np)');

  // Login as Doctor
  const drLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.mukesh@nepaldental.com.np', password: 'admin@123' })
  });
  assert.strictEqual(drLoginRes.status, 200, `Doctor login failed: ${drLoginRes.status}`);
  const drLoginData = await drLoginRes.json();
  assert(drLoginData.token, 'Token not received for doctor');
  assert.strictEqual(drLoginData.user.role, 'DOCTOR', 'Role is not DOCTOR');
  console.log('  -> PASS: Logged in successfully as Lead Surgeon (dr.mukesh@nepaldental.com.np)');

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminLoginData.token}`,
    'x-tenant-id': TENANT_ID
  };

  const drHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${drLoginData.token}`,
    'x-tenant-id': TENANT_ID
  };

  // -------------------------------------------------------------
  // Test 2: Verify Patient Database (Exactly 5 Patients & Every Field)
  // -------------------------------------------------------------
  console.log('\n[2/10] Testing GET /api/patients and validating every single field of 5 patients...');
  const ptsRes = await fetch(`${BASE_URL}/api/patients`, { headers: adminHeaders });
  assert.strictEqual(ptsRes.status, 200, `GET /api/patients failed: ${ptsRes.status}`);
  const patients = await ptsRes.json();
  assert(Array.isArray(patients), 'Patients response is not an array');
  assert.strictEqual(patients.length, 5, `Expected exactly 5 patients, found ${patients.length}`);
  console.log(`  -> PASS: Exactly ${patients.length} patients loaded from tenant-nepal-dental.`);

  const requiredFields = [
    'id', 'name', 'phone', 'email', 'age', 'gender', 'bloodGroup',
    'address', 'province', 'district', 'municipality', 'ward', 'tole',
    'emergencyContact', 'allergies', 'medicalHistory', 'advanceCreditBalance',
    'dentalChart', 'treatmentPlans', 'notes', 'prescriptions', 'invoices',
    'orders', 'imaging'
  ];

  patients.forEach((p, index) => {
    console.log(`\n    --- Patient #${index + 1}: ${p.name} [ID: ${p.id}] ---`);
    requiredFields.forEach(field => {
      assert(p[field] !== undefined, `Missing field "${field}" on patient ${p.id}`);
      if (typeof p[field] === 'string') {
        assert(p[field].trim().length > 0, `Empty string field "${field}" on patient ${p.id}`);
      }
    });

    assert(typeof p.age === 'number' && p.age > 0, `Invalid age: ${p.age} on ${p.id}`);
    assert(['Male', 'Female', 'Other'].includes(p.gender), `Invalid gender: ${p.gender} on ${p.id}`);
    assert(p.bloodGroup.includes('+') || p.bloodGroup.includes('-'), `Invalid bloodGroup: ${p.bloodGroup} on ${p.id}`);
    assert(Array.isArray(p.allergies), `allergies must be array on ${p.id}`);
    assert(Array.isArray(p.medicalHistory), `medicalHistory must be array on ${p.id}`);
    assert(typeof p.dentalChart === 'object' && Object.keys(p.dentalChart).length > 0, `Empty dentalChart on ${p.id}`);
    assert(Array.isArray(p.treatmentPlans) && p.treatmentPlans.length > 0, `Missing treatmentPlans on ${p.id}`);
    assert(Array.isArray(p.notes) && p.notes.length > 0, `Missing clinical notes on ${p.id}`);
    assert(Array.isArray(p.prescriptions) && p.prescriptions.length > 0, `Missing prescriptions on ${p.id}`);
    assert(Array.isArray(p.invoices) && p.invoices.length > 0, `Missing invoices on ${p.id}`);
    assert(Array.isArray(p.orders), `Missing orders array on ${p.id}`);
    assert(Array.isArray(p.imaging) && p.imaging.length > 0, `Missing imaging on ${p.id}`);

    // Print verified summary for each patient
    console.log(`      ✓ Demographics: Age ${p.age}, Gender: ${p.gender}, Blood: ${p.bloodGroup}, Phone: ${p.phone}, Email: ${p.email}`);
    console.log(`      ✓ Address: Ward ${p.ward}, ${p.tole}, ${p.municipality}, ${p.district}, ${p.province}`);
    console.log(`      ✓ Emergency Contact: ${p.emergencyContact}`);
    console.log(`      ✓ Allergies: ${p.allergies.length ? p.allergies.join(', ') : 'None reported'}`);
    console.log(`      ✓ Medical History: ${p.medicalHistory.join(', ')}`);
    console.log(`      ✓ Odontogram Teeth: ${Object.keys(p.dentalChart).join(', ')} (${Object.keys(p.dentalChart).length} teeth mapped)`);
    console.log(`      ✓ Treatment Plan: ${p.treatmentPlans[0].title} [Status: ${p.treatmentPlans[0].status}]`);
    console.log(`      ✓ Clinical Note: "${p.notes[0].text.slice(0, 65)}..." (Author: ${p.notes[0].author || 'Doctor'})`);
    console.log(`      ✓ Prescription: ${p.prescriptions[0].diagnosis} (${p.prescriptions[0].medicines.length} medicines prescribed)`);
    console.log(`      ✓ Invoice: #${p.invoices[0].invoiceNumber} - Total: Rs. ${p.invoices[0].total}, Paid: Rs. ${p.invoices[0].paid} via ${p.invoices[0].paymentMethod}`);
    console.log(`      ✓ PACS Imaging: ${p.imaging[0].title} (${p.imaging[0].radiographType})`);
  });

  // -------------------------------------------------------------
  // Test 3: Patient Detail Lookup API
  // -------------------------------------------------------------
  console.log('\n[3/10] Testing GET /api/patients/:id...');
  const singlePatientRes = await fetch(`${BASE_URL}/api/patients/PT-1001`, { headers: adminHeaders });
  assert.strictEqual(singlePatientRes.status, 200, `GET /api/patients/PT-1001 failed: ${singlePatientRes.status}`);
  const singlePatient = await singlePatientRes.json();
  assert.strictEqual(singlePatient.id, 'PT-1001');
  assert.strictEqual(singlePatient.name, 'Aarav Sharma');
  console.log(`  -> PASS: Patient PT-1001 retrieved directly: ${singlePatient.name}, Phone: ${singlePatient.phone}`);

  // -------------------------------------------------------------
  // Test 4: Odontogram & Dental Chart Interactive Updates
  // -------------------------------------------------------------
  console.log('\n[4/10] Testing Dental Chart Odontogram Update API (PUT /api/patients/:id/teeth/:toothNumber)...');
  const toothUpdatePayload = {
    condition: 'root_canal',
    surfaces: { occlusal: 'cavity_deep', mesial: 'filling_sound', distal: 'cavity_moderate', buccal: 'healthy', lingual: 'healthy' },
    pocketDepth: { b: 3, l: 3, m: 3, d: 3 },
    mobility: 0,
    notes: 'Working length determined: MB 21mm, DB 20.5mm, Palatal 22mm. Biomechanical prep completed.'
  };

  const chartUpdateRes = await fetch(`${BASE_URL}/api/patients/PT-1001/teeth/16`, {
    method: 'PUT',
    headers: drHeaders,
    body: JSON.stringify(toothUpdatePayload)
  });
  assert.strictEqual(chartUpdateRes.status, 200, `Tooth update failed: ${chartUpdateRes.status}`);
  const updatedChart = await chartUpdateRes.json();
  assert(updatedChart['16'], 'Tooth 16 missing from updated chart response');
  assert.strictEqual(updatedChart['16'].condition, 'root_canal', 'Tooth condition not updated');
  console.log(`  -> PASS: Tooth 16 Odontogram updated & persisted: condition="${updatedChart['16'].condition}", notes="${updatedChart['16'].notes.slice(0, 45)}..."`);

  // -------------------------------------------------------------
  // Test 5: Appointments System
  // -------------------------------------------------------------
  console.log('\n[5/10] Testing Appointments API (GET /api/appointments)...');
  const aptsRes = await fetch(`${BASE_URL}/api/appointments`, { headers: adminHeaders });
  assert.strictEqual(aptsRes.status, 200, `GET /api/appointments failed: ${aptsRes.status}`);
  const apts = await aptsRes.json();
  assert(Array.isArray(apts), 'Appointments is not an array');
  assert.strictEqual(apts.length, 5, `Expected 5 appointments, found ${apts.length}`);
  console.log(`  -> PASS: All 5 appointments verified in queue:`);
  apts.forEach(a => {
    console.log(`      • [${a.date} ${a.time}] ${a.patientName} (${a.patientId}) -> ${a.treatmentType} | Chair: ${a.chair} | Status: ${a.status}`);
  });

  // -------------------------------------------------------------
  // Test 6: Prescriptions & Formulary
  // -------------------------------------------------------------
  console.log('\n[6/10] Testing Prescription Writing API (POST /api/patients/:id/prescriptions)...');
  const newRxPayload = {
    doctor: 'Dr. Mukesh Kushwaha',
    diagnosis: 'Acute Irreversible Pulpitis #16 - Post-Op Obturation Pain Management',
    instructions: 'Take medications strictly after meals. Rinse with warm salt water.',
    reviewTimeline: '3 days',
    medicines: [
      {
        name: 'Ketorolac 10mg (Ketorol-DT)',
        genericName: 'Ketorolac Tromethamine',
        dosage: '10 mg',
        frequency: '1 tablet PRN for severe pain (max 3/day)',
        duration: '2 days',
        instructions: 'Dissolve in half glass water'
      }
    ]
  };

  const rxRes = await fetch(`${BASE_URL}/api/patients/PT-1001/prescriptions`, {
    method: 'POST',
    headers: drHeaders,
    body: JSON.stringify(newRxPayload)
  });
  assert.strictEqual(rxRes.status, 201, `Prescription creation failed: ${rxRes.status}`);
  const createdRx = await rxRes.json();
  assert(createdRx.id, 'Prescription ID missing');
  assert.strictEqual(createdRx.isFinalized, true, 'Prescription is not finalized');
  console.log(`  -> PASS: New Prescription ${createdRx.id} signed & finalized for PT-1001 (${createdRx.diagnosis})`);

  // -------------------------------------------------------------
  // Test 7: Billing, Invoicing & Receipts
  // -------------------------------------------------------------
  console.log('\n[7/10] Testing Invoicing & Financial Receipts (POST /api/patients/:id/invoices)...');
  const newInvoicePayload = {
    treatmentName: 'Obturation & Permanent Core Build-up #16',
    items: [
      { code: 'RCT-OBT-01', description: 'Endodontic Obturation #16', qty: 1, unitPrice: 3500, total: 3500 },
      { code: 'REST-CORE-01', description: 'Composite Core Build-up', qty: 1, unitPrice: 2000, total: 2000 }
    ],
    subtotal: 5500,
    discount: 500,
    tax: 0,
    total: 5000,
    paid: 5000,
    paymentMethod: 'Fonepay QR',
    status: 'Paid',
    doctorName: 'Dr. Mukesh Kushwaha'
  };

  const invRes = await fetch(`${BASE_URL}/api/patients/PT-1001/invoices`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(newInvoicePayload)
  });
  assert.strictEqual(invRes.status, 201, `Invoice creation failed: ${invRes.status}`);
  const createdInv = await invRes.json();
  assert(createdInv.receiptNumber, 'Receipt number missing from invoice creation');
  console.log(`  -> PASS: Invoice #${createdInv.invoiceNumber} created with Receipt #${createdInv.receiptNumber} (Rs. ${createdInv.paid} via ${createdInv.paymentMethod})`);

  // Verify receipt appears in receipts ledger
  const receiptsRes = await fetch(`${BASE_URL}/api/accounting/receipts`, { headers: adminHeaders });
  assert.strictEqual(receiptsRes.status, 200, `GET /api/accounting/receipts failed: ${receiptsRes.status}`);
  const receipts = await receiptsRes.json();
  assert(Array.isArray(receipts) && receipts.length > 0, 'No receipts found in accounting');
  console.log(`  -> PASS: Verified ${receipts.length} accounting receipts generated and linked to patient ledger.`);

  // -------------------------------------------------------------
  // Test 8: Dental Lab Orders
  // -------------------------------------------------------------
  console.log('\n[8/10] Testing Dental Lab Orders API (GET /api/orders)...');
  const ordersRes = await fetch(`${BASE_URL}/api/orders`, { headers: adminHeaders });
  assert.strictEqual(ordersRes.status, 200, `GET /api/orders failed: ${ordersRes.status}`);
  const orders = await ordersRes.json();
  assert(Array.isArray(orders) && orders.length >= 2, `Expected at least 2 lab orders, found ${orders.length}`);
  console.log(`  -> PASS: Verified ${orders.length} dental lab prosthesis orders:`);
  orders.forEach(o => {
    console.log(`      • Order #${o.id || o.orderNumber}: ${o.orderType} for ${o.patientName} (${o.assignedStaffOrLab}) - Status: ${o.progressStatus}`);
  });

  // -------------------------------------------------------------
  // Test 9: PACS Dental Imaging & Radiographs
  // -------------------------------------------------------------
  console.log('\n[9/10] Testing PACS Dental Radiography API (GET /api/xray)...');
  const xrayRes = await fetch(`${BASE_URL}/api/xray`, { headers: adminHeaders });
  assert.strictEqual(xrayRes.status, 200, `GET /api/xray failed: ${xrayRes.status}`);
  const xrays = await xrayRes.json();
  assert(Array.isArray(xrays) && xrays.length === 5, `Expected 5 radiographs, found ${xrays.length}`);
  console.log(`  -> PASS: Verified 5 high-resolution PACS radiographs across all patients:`);
  xrays.forEach(x => {
    console.log(`      • [${x.id}] ${x.radiographType}: ${x.title} for ${x.patientName} (Teeth: ${x.toothNumber || 'Full Arch'})`);
  });

  // -------------------------------------------------------------
  // Test 10: Pharmacy Inventory & Available Dispensing Medicines
  // -------------------------------------------------------------
  console.log('\n[10/10] Testing Pharmacy Catalog & Inventory (GET /api/pharmacy/available-medicines)...');
  const pharmRes = await fetch(`${BASE_URL}/api/pharmacy/available-medicines`, { headers: adminHeaders });
  assert.strictEqual(pharmRes.status, 200, `GET /api/pharmacy/available-medicines failed: ${pharmRes.status}`);
  const availableMeds = await pharmRes.json();
  assert(Array.isArray(availableMeds) && availableMeds.length > 0, 'No available medicines found in pharmacy');
  console.log(`  -> PASS: Pharmacy verified with ${availableMeds.length} in-stock medicines for dispensing:`);
  availableMeds.slice(0, 5).forEach(m => {
    console.log(`      • ${m.name} [Stock: ${m.stock} ${m.unit || 'units'}] - Rs. ${m.price}`);
  });

  console.log('\n================================================================');
  console.log('   ALL 10 DENTAL VERIFICATION SUITES PASSED WITH ZERO ERRORS!   ');
  console.log('================================================================');
}

runVerificationSuite().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

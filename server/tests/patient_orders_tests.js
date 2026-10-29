const BASE_URL = 'http://localhost:5000';

async function runPatientOrdersTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PATIENT ORDERS & DENTAL LAB WORK TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Doctor, Receptionist, and Clinic Admin
    console.log('--- 1. Authentication & Role Issuance ---');
    const docLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.mukesh@nepaldental.com.np', password: 'Doctor@123' })
    });
    const docLogin = await docLoginRes.json();
    assert(docLoginRes.ok && docLogin.token, 'Doctor login succeeds (Dr. Mukesh Kushwaha)');
    const docToken = docLogin.token;

    const recepLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@nepaldental.com.np', password: 'Reception@123' })
    });
    const recepLogin = await recepLoginRes.json();
    assert(recepLoginRes.ok && recepLogin.token, 'Receptionist login succeeds (Sita Thapa)');
    const recepToken = recepLogin.token;

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'Admin@123' })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLogin.token, 'Clinic Admin login succeeds');
    const adminToken = adminLogin.token;

    const docHeaders = {
      'Authorization': `Bearer ${docToken}`,
      'x-tenant-id': 'tenant-nepal-dental',
      'Content-Type': 'application/json'
    };
    const recepHeaders = {
      'Authorization': `Bearer ${recepToken}`,
      'x-tenant-id': 'tenant-nepal-dental',
      'Content-Type': 'application/json'
    };

    // 2. Fetch Existing Patient Orders directly linked to Patient ID
    console.log('\n--- 2. Retrieve Patient Orders Linked to Patient ID ---');
    const patientId = 'PT-1001';
    const ordersRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders`, {
      headers: docHeaders
    });
    const orders = await ordersRes.json();
    assert(ordersRes.ok, `Retrieved orders list for patient [${patientId}]`);
    assert(Array.isArray(orders) && orders.length >= 2, `Patient has ${orders.length} orders linked directly to ID`);

    const firstOrder = orders[0];
    assert(firstOrder.patientId === patientId, `Order directly holds patientId: "${firstOrder.patientId}"`);
    assert(firstOrder.orderType, `Order type present: "${firstOrder.orderType}"`);
    assert(firstOrder.toothOrImplantDetails, `Tooth or implant details: "${firstOrder.toothOrImplantDetails}"`);
    assert(firstOrder.clinicalSpecifications, `Clinical specifications: "${firstOrder.clinicalSpecifications.slice(0, 35)}..."`);
    assert(firstOrder.materials, `Material selected: "${firstOrder.materials}"`);
    assert(firstOrder.assignedStaffOrLab, `Assigned lab: "${firstOrder.assignedStaffOrLab}"`);
    assert(firstOrder.expectedCompletionDate, `Expected completion date: "${firstOrder.expectedCompletionDate}"`);
    assert(firstOrder.cost > 0, `Order cost recorded: Rs. ${firstOrder.cost}`);
    assert(firstOrder.paymentStatus, `Payment status: "${firstOrder.paymentStatus}"`);
    assert(firstOrder.progressStatus, `Progress status: "${firstOrder.progressStatus}"`);

    // 3. Create a New Custom Dental Order linked directly to patient
    console.log('\n--- 3. Create New Custom Dental Lab Order ---');
    const newOrderPayload = {
      orderType: 'Implant Custom Work',
      toothOrImplantDetails: 'Tooth #46 (Mandibular Right First Molar Implant)',
      clinicalSpecifications: 'Shade: VITA Classical A2. Custom Titanium Abutment with 2.5mm gingival collar height. Screw-retained monolithic zirconia crown. Torque to 30 Ncm.',
      materials: 'Titanium Grade 5 + Monolithic Zirconia',
      assignedStaffOrLab: 'Kathmandu Dental Ceramics & Milling Lab',
      orderDate: new Date().toISOString(),
      expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      cost: 16500,
      paymentStatus: 'Unpaid',
      progressStatus: 'Requested',
      notes: 'Patient requested natural staining on occlusal fissures to match adjacent #47.'
    };

    const createRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders`, {
      method: 'POST',
      headers: docHeaders,
      body: JSON.stringify(newOrderPayload)
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, 'Doctor successfully created custom dental order');
    const createdOrderId = createData.order?.id;
    assert(createdOrderId, `New order assigned unique ID: ${createdOrderId}`);
    assert(createData.order.patientId === patientId, `Order correctly linked to patient ID [${patientId}]`);
    assert(createData.order.progressStatus === 'Requested', 'Initial stage correctly set to "Requested"');
    assert(Array.isArray(createData.order.notes) && createData.order.notes.length >= 1, 'Initial clinical note created');

    // 4. Update Order Details & Specifications
    console.log('\n--- 4. Update Order Specifications & Materials ---');
    const updateRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}`, {
      method: 'PUT',
      headers: docHeaders,
      body: JSON.stringify({
        materials: 'Titanium Grade 5 (Gold-Hue Anodized) + High Translucency Zirconia',
        cost: 17500,
        note: 'Upgraded to gold-hue anodized abutment for enhanced warm gingival esthetics.'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok, 'Order specifications successfully updated');
    assert(updateData.order.cost === 17500, 'Order cost updated to Rs. 17500');
    assert(updateData.order.materials.includes('Gold-Hue'), 'Order materials updated with gold-hue titanium specification');

    // 5. Stage Progressions (Requested -> In Progress -> Ready -> Completed)
    console.log('\n--- 5. Order Progress Stages Workflow ---');
    // Step 5a: Move to In Progress
    const inProgRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: docHeaders,
      body: JSON.stringify({
        status: 'In Progress',
        note: 'Milling underway at lab. Custom abutment milled.'
      })
    });
    const inProgData = await inProgRes.json();
    assert(inProgData.order.progressStatus === 'In Progress', 'Order transitioned to "In Progress"');

    // Step 5b: Receptionist marks as Ready when delivered to front desk
    const readyRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: recepHeaders,
      body: JSON.stringify({
        status: 'Ready',
        note: 'Package received from courier. Placed in Chair A tray.'
      })
    });
    const readyData = await readyRes.json();
    assert(readyData.order.progressStatus === 'Ready', 'Receptionist transitioned order to "Ready" upon delivery');

    // Step 5c: Doctor seats crown and marks Completed
    const completeRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: docHeaders,
      body: JSON.stringify({
        status: 'Completed',
        note: 'Crown torqued to 30 Ncm. Access hole sealed with PTFE and composite. Occlusion verified.'
      })
    });
    const completeData = await completeRes.json();
    assert(completeData.order.progressStatus === 'Completed', 'Order transitioned to "Completed"');
    assert(completeData.order.completedAt !== undefined, 'Completion timestamp recorded');

    // 6. Add Progress Notes & Communications
    console.log('\n--- 6. Add Progress Notes & Clinical Remarks ---');
    const noteRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}/notes`, {
      method: 'POST',
      headers: docHeaders,
      body: JSON.stringify({
        text: 'Patient attended 24-hour follow-up check. Chewing comfort reported as excellent.'
      })
    });
    const noteData = await noteRes.json();
    assert(noteRes.ok, 'Progress note added successfully');
    const hasNote = noteData.order.notes.some(n => n.text.includes('Chewing comfort'));
    assert(hasNote, 'Note appended to timestamped order audit history');

    // 7. Add File / Image Attachments
    console.log('\n--- 7. Order Attachments & Photos ---');
    const attachRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders/${createdOrderId}/attachments`, {
      method: 'POST',
      headers: docHeaders,
      body: JSON.stringify({
        name: 'abutment_torque_verification.png',
        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
        type: 'image/svg+xml',
        size: 1024
      })
    });
    const attachData = await attachRes.json();
    assert(attachRes.ok, 'Image attachment added to patient order');
    assert(attachData.order.attachments.length >= 1, 'Order has verified attachment records');

    // 8. Search & Filtering of Patient Orders
    console.log('\n--- 8. Order Search & Filtering ---');
    const searchRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders?search=Titanium`, {
      headers: docHeaders
    });
    const searchResults = await searchRes.json();
    assert(searchResults.length >= 1, `Search by keyword "Titanium" found ${searchResults.length} order(s)`);

    const filterStatusRes = await fetch(`${BASE_URL}/api/patients/${patientId}/orders?status=completed`, {
      headers: docHeaders
    });
    const filterStatusResults = await filterStatusRes.json();
    assert(filterStatusResults.every(o => o.progressStatus === 'Completed'), 'Status filter correctly returns only Completed orders');

    // 9. Centralized Clinic-Wide Orders Endpoint
    console.log('\n--- 9. Centralized Clinic Orders View ---');
    const allOrdersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: docHeaders
    });
    const allOrders = await allOrdersRes.json();
    assert(allOrdersRes.ok && Array.isArray(allOrders), `Centralized orders API returned ${allOrders.length} clinic orders`);
    const hasPatientName = allOrders.every(o => o.patientId && o.patientName);
    assert(hasPatientName, 'All orders contain linked patient ID and patient Name for fast cross-referencing');

    console.log('\n===============================================================');
    console.log(`📊 PATIENT ORDERS TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runPatientOrdersTests();

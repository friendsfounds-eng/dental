/**
 * AUTOMATED SECURITY, RBAC & MULTI-TENANT ISOLATION TEST SUITE
 * Tests server-side permissions, cross-tenant isolation, role boundaries,
 * suspended account rejection, and audit trails.
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING MULTI-TENANT & RBAC SECURITY TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Login with 3 primary roles + Platform Admin
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Authentication & Role Issuance ---');

    // 1a. Platform Admin Login
    const devLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'devadmin@anacraft.com', password: 'DevAdmin@123' })
    }).then(r => r.json());
    assert(devLogin.success && devLogin.user.globalRole === 'PLATFORM_ADMIN', 'Platform Admin login succeeds with PLATFORM_ADMIN role');

    // 1b. Clinic Super Admin Login
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'Admin@123' })
    }).then(r => r.json());
    assert(adminLogin.success && adminLogin.user.role === 'CLINIC_ADMIN', 'Nepal Dental Super Admin login succeeds with CLINIC_ADMIN role');

    // 1c. Doctor Login (Dr. Mukesh Kushwaha)
    const doctorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.mukesh@nepaldental.com.np', password: 'Doctor@123' })
    }).then(r => r.json());
    assert(doctorLogin.success && doctorLogin.user.role === 'DOCTOR' && doctorLogin.user.name === 'Dr. Mukesh Kushwaha', 'Doctor login succeeds for Dr. Mukesh Kushwaha');

    // 1d. Receptionist Login
    const receptionLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@nepaldental.com.np', password: 'Reception@123' })
    }).then(r => r.json());
    assert(receptionLogin.success && receptionLogin.user.role === 'RECEPTIONIST', 'Receptionist login succeeds with RECEPTIONIST role');

    const doctorToken = doctorLogin.token;
    const receptionToken = receptionLogin.token;
    const adminToken = adminLogin.token;
    const devToken = devLogin.token;

    // -------------------------------------------------------------------------
    // TEST 2: Super Admin can configure clinic settings
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Clinic Super Admin Configuration ---');
    const updateClinicRes = await fetch(`${BASE_URL}/api/clinic`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ tagline: 'Premier Advanced Dental Hospital in Kathmandu' })
    });
    assert(updateClinicRes.status === 200, 'Super Admin can update clinic profile settings');

    // Super Admin can view clinic audit logs
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      }
    });
    assert(auditRes.status === 200, 'Super Admin can view tenant audit logs');

    // Fetch existing patient ID in tenant
    const ptsListRes = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      }
    }).then(r => r.json());
    const targetPtId = ptsListRes[0]?.id || 'PT-2864';

    // Super Admin (Clinic Owner) can perform clinical operations (e.g. dental chart and prescriptions)
    const adminChartRes = await fetch(`${BASE_URL}/api/patients/${targetPtId}/teeth/16`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ condition: 'decay', notes: 'Diagnosed by Clinic Owner' })
    });
    assert(adminChartRes.status === 200, 'Clinic Owner (Super Admin) has full access to update dental chart');

    // -------------------------------------------------------------------------
    // TEST 3: Doctor can create clinical records and prescriptions
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Doctor Clinical Authority ---');
    const rxRes = await fetch(`${BASE_URL}/api/patients/${targetPtId}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        doctor: 'Dr. Mukesh Kushwaha',
        diagnosis: 'Post-op Sensitivity #16',
        medicines: [{ name: 'Ketorol DT', dosage: '10mg', frequency: 'SOS', duration: '2 days' }]
      })
    });
    assert(rxRes.status === 201, 'Doctor can generate authenticated digital prescription');

    // Doctor can update dental chart
    const chartRes = await fetch(`${BASE_URL}/api/patients/${targetPtId}/teeth/21`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ condition: 'healthy', notes: 'Checked normal' })
    });
    assert(chartRes.status === 200, 'Doctor can record findings on interactive dental chart');

    // -------------------------------------------------------------------------
    // TEST 4: Receptionist permissions (Register patients & duplicate prevention)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Receptionist Operations & Duplicate Prevention ---');
    const uniqueTestPhone = `+977 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testPatientName = `Test Patient ${Date.now()}`;

    const newPtRes = await fetch(`${BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        name: testPatientName,
        phone: uniqueTestPhone,
        age: 35,
        gender: 'Male',
        address: 'Baneshwor, Kathmandu'
      })
    });
    assert(newPtRes.status === 201, 'Receptionist can register new patient');

    // Duplicate check: If both name and mobile are same, you CANNOT save (MUST FAIL 409)
    const duplicatePtRes = await fetch(`${BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        name: testPatientName,
        phone: uniqueTestPhone,
        age: 35,
        gender: 'Male',
        address: 'Baneshwor, Kathmandu'
      })
    });
    assert(duplicatePtRes.status === 409, 'Duplicate patient with same name and mobile is blocked from saving (409 Conflict)');

    // Different phone with same name CAN save
    const differentPhoneRes = await fetch(`${BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        name: testPatientName,
        phone: `+977 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        age: 28,
        gender: 'Female',
        address: 'Pokhara, Kaski'
      })
    });
    assert(differentPhoneRes.status === 201, 'Patient with different mobile number can save even if name is identical');

    // -------------------------------------------------------------------------
    // TEST 5: Receptionist CANNOT create prescription or alter diagnosis (MUST FAIL 403)
    // -------------------------------------------------------------------------
    const illegalRxRes = await fetch(`${BASE_URL}/api/patients/${targetPtId}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        diagnosis: 'Illegal diagnosis',
        medicines: [{ name: 'Antibiotic', frequency: '1-0-1' }]
      })
    });
    assert(illegalRxRes.status === 403, 'Receptionist is strictly blocked (403 Forbidden) from creating prescription');

    // Receptionist CANNOT alter dental chart
    const illegalChartRes = await fetch(`${BASE_URL}/api/patients/${targetPtId}/teeth/16`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ condition: 'extracted' })
    });
    assert(illegalChartRes.status === 403, 'Receptionist is strictly blocked (403 Forbidden) from altering dental chart');

    // -------------------------------------------------------------------------
    // TEST 6: Doctor CANNOT create Super Admin or change clinic configuration (MUST FAIL 403)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Privilege Escalation Prevention ---');
    const doctorConfigRes = await fetch(`${BASE_URL}/api/clinic`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ name: 'Hacked Clinic Name' })
    });
    assert(doctorConfigRes.status === 403, 'Doctor cannot modify clinic settings (403 Forbidden)');

    // Super Admin cannot grant PLATFORM_ADMIN
    const escalateRes = await fetch(`${BASE_URL}/api/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({
        email: 'attacker@evil.com',
        name: 'Evil Admin',
        role: 'PLATFORM_ADMIN'
      })
    });
    assert(escalateRes.status === 403, 'Clinic Super Admin cannot create Platform Admin (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 7: Cross-Tenant Data Isolation (Tenant A vs Tenant B)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Cross-Tenant Isolation (Nepal Dental vs Apex Dental) ---');
    // Nepal Doctor tries to access Apex Dental tenant using header
    const crossTenantRes = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`,
        'x-tenant-id': 'tenant-apex-dental'
      }
    });
    assert(crossTenantRes.status === 403, 'Nepal Dental user cannot access Apex Dental data (403 Forbidden)');

    // Verify patient data separation
    const nepalPatients = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      }
    }).then(r => r.json());

    // Apex Admin Login
    const apexLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexdental.com', password: 'Admin@123' })
    }).then(r => r.json());

    const apexPatients = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${apexLogin.token}`,
        'x-tenant-id': 'tenant-apex-dental'
      }
    }).then(r => r.json());

    const noLeak = !nepalPatients.some(np => apexPatients.some(ap => ap.id === np.id));
    assert(noLeak, 'Zero patient data leak between Nepal Dental and Apex Dental');

    // -------------------------------------------------------------------------
    // TEST 8: Suspended Accounts & Revoked Sessions are Immediately Blocked
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Suspended Accounts & Revoked Session Enforcement ---');
    // Suspend receptionist account
    const suspendRes = await fetch(`${BASE_URL}/api/admin/staff/user-nepal-reception/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ status: 'suspended' })
    });
    assert(suspendRes.status === 200, 'Super admin suspended receptionist account');

    // Suspended receptionist attempts to use previously valid token
    const blockedRes = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${receptionToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      }
    });
    assert(blockedRes.status === 403, 'Suspended user token is immediately rejected with 403 Account Suspended');

    // Reactivate receptionist for further use
    await fetch(`${BASE_URL}/api/admin/staff/user-nepal-reception/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-id': 'tenant-nepal-dental'
      },
      body: JSON.stringify({ status: 'active' })
    });

    // -------------------------------------------------------------------------
    // TEST 9: Developer Admin Platform Management
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Developer Control Panel Operations ---');
    const platformOverview = await fetch(`${BASE_URL}/api/platform/overview`, {
      headers: { 'Authorization': `Bearer ${devToken}` }
    }).then(r => r.json());
    assert(platformOverview.totalTenants >= 2, 'Developer Admin can view all tenant metrics');

    // Test support grant
    const supportGrantRes = await fetch(`${BASE_URL}/api/platform/support-grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        tenantId: 'tenant-nepal-dental',
        reason: 'Ticket #8491: Database index verification',
        durationMinutes: 30
      })
    });
    assert(supportGrantRes.status === 201, 'Time-limited audited support grant generated');

    // -------------------------------------------------------------------------
    // FINAL RESULTS
    // -------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`📊 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  }
}

runTests();

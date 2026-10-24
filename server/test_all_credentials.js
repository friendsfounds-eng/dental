const BASE_URL = 'http://localhost:5000';

const CREDENTIALS_TO_TEST = [
  {
    roleName: 'Nepal Dental Clinic Owner / Super Admin',
    email: 'admin@nepaldental.com.np',
    password: 'Admin@123',
    expectedRole: 'CLINIC_ADMIN'
  },
  {
    roleName: 'Nepal Dental Lead Doctor (Dr. Mukesh Kushwaha)',
    email: 'dr.mukesh@nepaldental.com.np',
    password: 'Doctor@123',
    expectedRole: 'DOCTOR'
  },
  {
    roleName: 'Nepal Dental Orthodontist & Admin (Dr. Anita Sharma)',
    email: 'dr.anita@nepaldental.com.np',
    password: 'DoctorAnita@2026',
    expectedRole: 'CLINIC_ADMIN'
  },
  {
    roleName: 'Nepal Dental Receptionist (Sita Thapa)',
    email: 'reception@nepaldental.com.np',
    password: 'Reception@123',
    expectedRole: 'RECEPTIONIST'
  },
  {
    roleName: 'Anaya Craft Platform Developer Admin',
    email: 'devadmin@anacraft.com',
    password: 'DevAdmin@123',
    expectedRole: 'PLATFORM_ADMIN'
  },
  {
    roleName: 'Apex Dental Owner / Super Admin',
    email: 'admin@apexdental.com',
    password: 'Admin@123',
    expectedRole: 'CLINIC_ADMIN'
  },
  {
    roleName: 'Apex Dental Doctor (Dr. Yugal Sharma)',
    email: 'dr.yugal@apexdental.com',
    password: 'Doctor@123',
    expectedRole: 'DOCTOR'
  },
  {
    roleName: 'Apex Dental Receptionist (Pooja Singh)',
    email: 'reception@apexdental.com',
    password: 'Reception@123',
    expectedRole: 'RECEPTIONIST'
  }
];

async function testAllCredentials() {
  console.log('===============================================================');
  console.log('🔑 TESTING ALL RESET USER CREDENTIALS');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  for (const cred of CREDENTIALS_TO_TEST) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.email, password: cred.password })
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        throw new Error(`Login failed with status ${res.status}: ${data.message || data.error}`);
      }

      console.log(`✅ SUCCESS: ${cred.roleName}`);
      console.log(`   - Email: ${cred.email}`);
      console.log(`   - Active Role: ${data.user.role} (Roles: [${(data.user.roles || []).join(', ')}])`);
      console.log(`   - Tenant: ${data.activeTenant?.name || 'Global Platform'}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAILED: ${cred.roleName} (${cred.email})`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  console.log('===============================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

testAllCredentials();

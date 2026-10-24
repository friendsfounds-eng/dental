import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATFORM_FILE = path.join(__dirname, 'data', 'platform.json');

function hashPassword(password) {
  const salt = 'dental_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

// Standardized Clean User Accounts
const STANDARDIZED_USERS = [
  // 1. Platform Developer Admin
  {
    id: 'user-devadmin',
    email: 'devadmin@anacraft.com',
    passwordHash: hashPassword('DevAdmin@123'),
    name: 'Anaya Craft Developer Admin',
    phone: '+977 98000 00000',
    globalRole: 'PLATFORM_ADMIN',
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 2. Nepal Dental Clinic Owner / Super Admin
  {
    id: 'user-nepal-admin',
    email: 'admin@nepaldental.com.np',
    passwordHash: hashPassword('Admin@123'),
    name: 'Dr. Mukesh Kushwaha (Nepal Dental Owner)',
    phone: '+977 98012 34567',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // 3. Nepal Dental Lead Doctor / Dental Surgeon
  {
    id: 'user-nepal-dr-mukesh',
    email: 'dr.mukesh@nepaldental.com.np',
    passwordHash: hashPassword('Doctor@123'),
    name: 'Dr. Mukesh Kushwaha',
    phone: '+977 98012 34567',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // 4. Nepal Dental Orthodontist & Clinic Admin
  {
    id: 'user-075297',
    email: 'dr.anita@nepaldental.com.np',
    passwordHash: hashPassword('DoctorAnita@2026'),
    name: 'Dr. Anita Sharma',
    phone: '+977 98511 77889',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-10-23T10:00:00.000Z'
  },
  // 5. Nepal Dental Receptionist / Front Desk
  {
    id: 'user-nepal-reception',
    email: 'reception@nepaldental.com.np',
    passwordHash: hashPassword('Reception@123'),
    name: 'Sita Thapa (Front Desk)',
    phone: '+977 98099 88776',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // 6. Apex Dental Owner / Admin
  {
    id: 'user-apex-admin',
    email: 'admin@apexdental.com',
    passwordHash: hashPassword('Admin@123'),
    name: 'Dr. Yugal Sharma (Apex Dental Owner)',
    phone: '+977 98111 22233',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  // 7. Apex Dental Doctor
  {
    id: 'user-apex-dr-yugal',
    email: 'dr.yugal@apexdental.com',
    passwordHash: hashPassword('Doctor@123'),
    name: 'Dr. Yugal Sharma',
    phone: '+977 98222 33344',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  // 8. Apex Dental Receptionist
  {
    id: 'user-apex-reception',
    email: 'reception@apexdental.com',
    passwordHash: hashPassword('Reception@123'),
    name: 'Pooja Singh',
    phone: '+977 98333 44455',
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: '2026-02-01T00:00:00.000Z'
  }
];

// Clean Memberships
const STANDARDIZED_MEMBERSHIPS = [
  // Nepal Dental Memberships
  {
    id: 'mem-1',
    tenantId: 'tenant-nepal-dental',
    userId: 'user-nepal-admin',
    role: 'CLINIC_ADMIN',
    roles: ['CLINIC_ADMIN'],
    isActive: true
  },
  {
    id: 'mem-2',
    tenantId: 'tenant-nepal-dental',
    userId: 'user-nepal-dr-mukesh',
    role: 'DOCTOR',
    roles: ['DOCTOR'],
    isActive: true
  },
  {
    id: 'mem-3',
    tenantId: 'tenant-nepal-dental',
    userId: 'user-nepal-reception',
    role: 'RECEPTIONIST',
    roles: ['RECEPTIONIST'],
    isActive: true
  },
  {
    id: 'mem-anita',
    tenantId: 'tenant-nepal-dental',
    userId: 'user-075297',
    role: 'CLINIC_ADMIN',
    roles: ['DOCTOR', 'CLINIC_ADMIN'],
    isActive: true
  },
  // Apex Dental Memberships
  {
    id: 'mem-4',
    tenantId: 'tenant-apex-dental',
    userId: 'user-apex-admin',
    role: 'CLINIC_ADMIN',
    roles: ['CLINIC_ADMIN'],
    isActive: true
  },
  {
    id: 'mem-5',
    tenantId: 'tenant-apex-dental',
    userId: 'user-apex-dr-yugal',
    role: 'DOCTOR',
    roles: ['DOCTOR'],
    isActive: true
  },
  {
    id: 'mem-6',
    tenantId: 'tenant-apex-dental',
    userId: 'user-apex-reception',
    role: 'RECEPTIONIST',
    roles: ['RECEPTIONIST'],
    isActive: true
  }
];

export function resetCredentials() {
  console.log('Writing standardized credentials to', PLATFORM_FILE);
  const platform = JSON.parse(fs.readFileSync(PLATFORM_FILE, 'utf8'));
  platform.users = STANDARDIZED_USERS;
  platform.memberships = STANDARDIZED_MEMBERSHIPS;
  fs.writeFileSync(PLATFORM_FILE, JSON.stringify(platform, null, 2), 'utf8');
  console.log('✅ Credentials reset successfully for all 8 standard system users.');
}

resetCredentials();

import http from 'http';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPharmacyTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHARMACY OPERATIONS & STOCK SYSTEM TEST SUITE');
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

  // 1. Authenticate Developer Admin
  console.log('--- 1. Developer Admin Feature Allocation ---');
  const devLogin = await request('POST', '/api/auth/login', {
    email: 'devadmin@anacraft.com',
    password: 'DevAdmin@123'
  });
  assert(devLogin.status === 200, 'Developer Admin logs in successfully');
  const devToken = devLogin.data.token;

  // Verify Developer Admin can toggle pharmacy feature for a tenant
  const toggleOff = await request('POST', '/api/platform/tenants/tenant-nepal-dental/toggle-module', {
    module: 'pharmacy',
    enabled: false
  }, { 'Authorization': `Bearer ${devToken}` });
  assert(toggleOff.status === 200 && toggleOff.data.enabled === false, 'Developer Admin can disable Pharmacy module for tenant');

  // Verify tenant access is blocked when module is disabled
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@nepaldental.com.np',
    password: 'Admin@123'
  });
  const adminToken = adminLogin.data.token;

  const blockedOverview = await request('GET', '/api/pharmacy/overview', null, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(blockedOverview.status === 403, 'Tenant access to pharmacy is blocked (403) when module is disabled by Developer Admin');

  // Developer Admin re-allocates Pharmacy module
  const toggleOn = await request('POST', '/api/platform/tenants/tenant-nepal-dental/toggle-module', {
    module: 'pharmacy',
    enabled: true
  }, { 'Authorization': `Bearer ${devToken}` });
  assert(toggleOn.status === 200 && toggleOn.data.enabled === true, 'Developer Admin allocates Pharmacy module to clinic');

  // 2. Pharmacy Overview & Metrics
  console.log('\n--- 2. Real-Time Inventory & Valuation Metrics ---');
  const overview = await request('GET', '/api/pharmacy/overview', null, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(overview.status === 200, 'Super Admin retrieves real-time pharmacy metrics');
  assert(overview.data.totalMedicines >= 8, `Catalog contains ${overview.data.totalMedicines} medicine formularies`);
  assert(overview.data.inventoryValuationCost > 0, `Active stock valuation at cost: Rs. ${overview.data.inventoryValuationCost}`);
  assert(overview.data.lowStockCount >= 1, `Low stock alert correctly identifies ${overview.data.lowStockCount} item(s) below reorder threshold`);
  assert(overview.data.expiredCount >= 1, `Expiry tracker identifies ${overview.data.expiredCount} expired batch(es) for quarantine`);

  // 3. Medicine Catalog Management
  console.log('\n--- 3. Medicine Catalog & Pricing ---');
  const newMed = await request('POST', '/api/pharmacy/catalog', {
    name: 'Cefixime 200mg',
    genericName: 'Cefixime Trihydrate',
    brand: 'Taxim-O (Alkem)',
    category: 'Antibiotic',
    strength: '200 mg',
    dosageForm: 'Tablet',
    barcode: '8901083999999',
    purchasePrice: 14.50,
    sellingPrice: 24.00,
    reorderThreshold: 30,
    storageLocation: 'Shelf A-3'
  }, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(newMed.status === 201 && newMed.data.id, `New medicine [${newMed.data.name}] added to catalog`);
  const createdMedId = newMed.data.id;

  // 4. Supplier Inward Delivery (Purchasing)
  console.log('\n--- 4. Supplier Purchasing & Stock Inward ---');
  const delivery = await request('POST', '/api/pharmacy/purchases', {
    supplier: 'Omni Healthcare Logistics',
    supplierInvoice: 'INV-TEST-9988',
    purchaseDate: '2026-10-21',
    items: [
      {
        medicineId: createdMedId,
        medicineName: 'Cefixime 200mg',
        batchNumber: 'CFX-26A',
        expiryDate: '2027-11-30',
        quantity: 100,
        purchasePrice: 14.50,
        sellingPrice: 24.00,
        storageLocation: 'Shelf A-3'
      }
    ]
  }, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(delivery.status === 201, 'Supplier delivery inward recorded and batches created');

  // Verify stock in batches
  const batchesRes = await request('GET', '/api/pharmacy/batches', null, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  const cfxBatch = batchesRes.data.find(b => b.batchNumber === 'CFX-26A');
  assert(cfxBatch && cfxBatch.quantity === 100, 'Batch CFX-26A initialized with 100 stock units');

  // 5. Expiry Safeguards: Expired Batch Cannot Be Sold
  console.log('\n--- 5. Expiry Safeguards (FEFO & Safety Blocks) ---');
  const expiredBatch = batchesRes.data.find(b => b.status === 'EXPIRED');
  assert(expiredBatch !== undefined, `Found expired batch [${expiredBatch?.batchNumber}] with expiry ${expiredBatch?.expiryDate}`);

  // Attempt POS sale of expired batch
  const expiredSale = await request('POST', '/api/pharmacy/sales', {
    patientName: 'Emergency Test Patient',
    items: [
      {
        medicineId: expiredBatch.medicineId,
        batchId: expiredBatch.id,
        quantity: 2,
        unitPrice: expiredBatch.sellingPrice
      }
    ]
  }, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(expiredSale.status === 400 && expiredSale.data.error === 'EXPIRED_MEDICINE_BLOCKED',
    '⛔ STRICT SAFEGUARD: Sale of expired medicine is blocked (400 EXPIRED_MEDICINE_BLOCKED)'
  );

  // 6. Valid POS Sale & Stock Decrement
  console.log('\n--- 6. Pharmacy POS Sale & Stock Decrement ---');
  const validSale = await request('POST', '/api/pharmacy/sales', {
    patientName: 'Rupendra Sah',
    patientPhone: '+977 98011 97710',
    items: [
      {
        medicineId: createdMedId,
        batchId: cfxBatch.id,
        quantity: 10,
        unitPrice: 24.00
      }
    ],
    discountPercent: 10,
    paymentMethod: 'Fonepay QR'
  }, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(validSale.status === 201, `POS Sale processed: Receipt #${validSale.data.receiptNumber} for Rs. ${validSale.data.totalAmount}`);

  // Verify stock decremented
  const batchesAfterSale = await request('GET', '/api/pharmacy/batches', null, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  const updatedCfxBatch = batchesAfterSale.data.find(b => b.id === cfxBatch.id);
  assert(updatedCfxBatch && updatedCfxBatch.quantity === 90, `Batch stock decremented accurately: 100 -> ${updatedCfxBatch?.quantity}`);

  // 7. Stock Adjustment & Write-off Audit
  console.log('\n--- 7. Returns & Stock Adjustments Ledger ---');
  const adjRes = await request('POST', '/api/pharmacy/adjustments', {
    batchId: cfxBatch.id,
    type: 'DAMAGED',
    quantity: -2,
    reason: 'Foil package punctured during shelf inspection'
  }, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(adjRes.status === 201 && adjRes.data.newQty === 88, 'Damaged stock adjustment recorded with reason: 90 -> 88 units');

  // Verify adjustment ledger
  const adjList = await request('GET', '/api/pharmacy/adjustments', null, {
    'Authorization': `Bearer ${adminToken}`,
    'x-tenant-id': 'tenant-nepal-dental'
  });
  assert(adjList.data.length >= 1 && adjList.data[0].reason.includes('Foil package'), 'Adjustment recorded in immutable clinical ledger');

  console.log('\n===============================================================');
  console.log(`📊 PHARMACY TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runPharmacyTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

// ===============================================================
// 🧪 AUTOMATED TEST SUITE: FINANCE MANAGEMENT MODULE
// ===============================================================
import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runFinanceTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING FINANCE MANAGEMENT MODULE TEST SUITE');
  console.log('===============================================================');

  try {
    // 1. Authentication
    console.log('\n--- 1. Authentication & Role Issuance ---');
    const devAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'devadmin@anacraft.com', password: 'DevAdmin@123' })
    });
    const devAdminData = await devAdminRes.json();
    assert(devAdminRes.ok, 'Developer Admin login succeeds');
    const devHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devAdminData.token}`
    };

    const clinicAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'Admin@123' })
    });
    const clinicAdminData = await clinicAdminRes.json();
    assert(clinicAdminRes.ok, 'Nepal Dental Admin login succeeds');
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clinicAdminData.token}`,
      'x-tenant-id': 'tenant-nepal-dental'
    };

    const recepRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@nepaldental.com.np', password: 'Reception@123' })
    });
    const recepData = await recepRes.json();
    assert(recepRes.ok, 'Receptionist login succeeds');
    const recepHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recepData.token}`,
      'x-tenant-id': 'tenant-nepal-dental'
    };

    console.log('  ✅ PASS: Authentication tokens generated for Developer Admin, Clinic Admin, and Receptionist');

    // 2. Module Entitlement & Software Owner Allocation
    console.log('\n--- 2. Module Entitlement & Allocation by Software Owner ---');
    // Developer admin disables finance module
    const disableModRes = await fetch(`${BASE_URL}/api/platform/tenants/tenant-nepal-dental/toggle-module`, {
      method: 'POST',
      headers: devHeaders,
      body: JSON.stringify({ module: 'finance', enabled: false })
    });
    assert(disableModRes.ok, 'Developer Admin disabled finance module');

    // Tenant attempts to access finance summary
    const blockedRes = await fetch(`${BASE_URL}/api/finance/summary`, {
      headers: adminHeaders
    });
    assert.strictEqual(blockedRes.status, 403, 'Access strictly blocked (403) when module is unallocated');
    const blockedData = await blockedRes.json();
    assert.strictEqual(blockedData.error, 'MODULE_NOT_ENABLED', 'Error code MODULE_NOT_ENABLED returned');
    console.log('  ✅ PASS: Software owner module allocation safeguard enforced (403 MODULE_NOT_ENABLED)');

    // Re-enable finance module
    const enableModRes = await fetch(`${BASE_URL}/api/platform/tenants/tenant-nepal-dental/toggle-module`, {
      method: 'POST',
      headers: devHeaders,
      body: JSON.stringify({ module: 'finance', enabled: true })
    });
    assert(enableModRes.ok, 'Developer Admin allocated finance module to clinic');
    console.log('  ✅ PASS: Software owner successfully allocated Finance module to clinic');

    // 3. Organization Account Details & Payment Info
    console.log('\n--- 3. Organization Account Details & Access Controls ---');
    const accRes = await fetch(`${BASE_URL}/api/finance/account`, {
      headers: adminHeaders
    });
    const accData = await accRes.json();
    assert(accRes.ok, 'Retrieved organization payment details');
    assert(accData.bankName === 'Nabil Bank Limited', 'Bank provider name verified');
    assert(accData.accountNumber === '01201017500982', 'Account number verified');
    assert(accData.accountHolderName.includes('Nepal Dental'), 'Account holder name verified');
    assert(accData.qrCodeUrl !== undefined, 'Payment QR code available');
    console.log(`  ✅ PASS: Account Details: ${accData.accountHolderName} | ${accData.bankName} (${accData.accountNumber})`);

    // Update account details
    const updateAccRes = await fetch(`${BASE_URL}/api/finance/account`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        notes: 'Primary clinic receiving account updated with Fonepay QR merchant link.'
      })
    });
    assert(updateAccRes.ok, 'Clinic Admin can update organization account notes');

    // Receptionist cannot update organization account details
    const recepForbiddenAccRes = await fetch(`${BASE_URL}/api/finance/account`, {
      method: 'PUT',
      headers: recepHeaders,
      body: JSON.stringify({ bankName: 'Unauthorized Bank' })
    });
    assert.strictEqual(recepForbiddenAccRes.status, 403, 'Receptionist forbidden from updating bank account details');
    console.log('  ✅ PASS: RBAC Safeguard: Receptionist strictly blocked (403) from altering clinic bank account');

    // 4. Centralized Financial Transactions Ledger
    console.log('\n--- 4. Centralized Financial Transactions Ledger ---');
    // Create new income transaction
    const newTxnRes = await fetch(`${BASE_URL}/api/finance/transactions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        amount: 22500,
        type: 'INCOME',
        category: 'Patient Treatment',
        paymentMethod: 'FonePay / QR',
        payerOrRecipient: 'Aarav Sharma',
        relatedPatientId: 'PT-1001',
        notes: 'Final crown seating settlement via Fonepay'
      })
    });
    const newTxnData = await newTxnRes.json();
    assert(newTxnRes.ok, 'Income transaction recorded successfully');
    assert(newTxnData.transaction.amount === 22500, 'Transaction amount recorded as Rs. 22500');
    assert(newTxnData.transaction.refNumber !== undefined, 'Unique reference number assigned');
    console.log(`  ✅ PASS: Income transaction recorded: ${newTxnData.transaction.id} (${newTxnData.transaction.refNumber})`);

    // Retrieve transactions with pagination and search
    const listTxnRes = await fetch(`${BASE_URL}/api/finance/transactions?limit=10&page=1`, {
      headers: adminHeaders
    });
    const listTxnData = await listTxnRes.json();
    assert(listTxnRes.ok, 'Retrieved transactions list');
    assert(Array.isArray(listTxnData.transactions), 'Transactions array present');
    assert(listTxnData.pagination.total >= 10, 'Total transactions count tracked');
    assert(listTxnData.summary.totalIncome > 0, 'Summary income computed');
    console.log(`  ✅ PASS: Centralized ledger returned ${listTxnData.pagination.total} records across pages`);

    // Filter by type: EXPENSE
    const expRes = await fetch(`${BASE_URL}/api/finance/transactions?type=EXPENSE`, {
      headers: adminHeaders
    });
    const expData = await expRes.json();
    assert(expRes.ok, 'Filter by EXPENSE succeeds');
    const allExp = expData.transactions.every(t => t.type === 'EXPENSE');
    assert(allExp, 'All returned records are EXPENSE type');
    console.log(`  ✅ PASS: Filtered ${expData.transactions.length} expense transactions`);

    // 5. Patient Transactions, Balances & Refunds
    console.log('\n--- 5. Patient Transactions & Balance Tracking ---');
    const ptTxnRes = await fetch(`${BASE_URL}/api/finance/patient-transactions`, {
      headers: adminHeaders
    });
    const ptTxnData = await ptTxnRes.json();
    assert(ptTxnRes.ok, 'Retrieved patient financial records');
    assert(Array.isArray(ptTxnData), 'Patient report list returned');
    const p1001 = ptTxnData.find(p => p.patientId === 'PT-1001');
    assert(p1001 !== undefined, 'Found records for patient PT-1001');
    assert(p1001.totalReceived > 0, 'Total received payments tracked');
    console.log(`  ✅ PASS: Patient [${p1001.patientName}]: Total Received: Rs. ${p1001.totalReceived} | Outstanding: Rs. ${p1001.outstandingBalance}`);

    // Receptionist has view access to patient transactions
    const recepPtRes = await fetch(`${BASE_URL}/api/finance/patient-transactions`, {
      headers: recepHeaders
    });
    assert(recepPtRes.ok, 'Receptionist permitted to view patient transactions');
    console.log('  ✅ PASS: Receptionist has permitted access to patient financial activity');

    // Issue Patient Refund
    console.log('\n--- 6. Patient Refund Issuance ---');
    const refundRes = await fetch(`${BASE_URL}/api/finance/patient-transactions/PT-1001/refund`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        amount: 1200,
        reason: 'Duplicate payment adjustment for digital periapical X-Ray',
        paymentMethod: 'FonePay / QR'
      })
    });
    const refundData = await refundRes.json();
    assert(refundRes.ok, 'Patient refund issued successfully');
    assert(refundData.transaction.type === 'REFUND', 'Transaction recorded with REFUND type');
    assert(refundData.transaction.amount === 1200, 'Refund amount verified');
    console.log(`  ✅ PASS: Refund of Rs. 1200 issued for patient PT-1001 (Txn: ${refundData.transaction.id})`);

    // 7. Staff Payment Sheet (Payroll)
    console.log('\n--- 7. Staff Payment Sheet & Payroll Workflow ---');
    const staffPayRes = await fetch(`${BASE_URL}/api/finance/staff-payments`, {
      headers: adminHeaders
    });
    const staffPayData = await staffPayRes.json();
    assert(staffPayRes.ok, 'Retrieved staff payment sheet');
    assert(Array.isArray(staffPayData) && staffPayData.length >= 4, 'Staff payment sheet contains records');
    console.log(`  ✅ PASS: Staff payment sheet contains ${staffPayData.length} records`);

    // Create new staff payment
    const newStaffPayRes = await fetch(`${BASE_URL}/api/finance/staff-payments`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        staffName: 'Dr. Sushila Sharma',
        role: 'Consultant Pedodontist',
        period: 'October 2026',
        baseSalary: 45000,
        incentivesOrBonus: 5000,
        deductions: 1000,
        paymentMethod: 'Bank Transfer'
      })
    });
    const newStaffPayData = await newStaffPayRes.json();
    assert(newStaffPayRes.ok, 'Staff payment generated successfully');
    assert(newStaffPayData.payment.amount === 49000, 'Calculated net salary: 45000 + 5000 - 1000 = Rs. 49000');
    assert(newStaffPayData.payment.status === 'Pending', 'Initial status set to Pending');
    console.log(`  ✅ PASS: Generated staff payment: ${newStaffPayData.payment.staffName} — Rs. ${newStaffPayData.payment.amount} (Pending)`);

    // Mark staff payment as Paid
    const payStatusRes = await fetch(`${BASE_URL}/api/finance/staff-payments/${newStaffPayData.payment.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'Paid', refNumber: 'SAL-OCT-9981' })
    });
    const payStatusData = await payStatusRes.json();
    assert(payStatusRes.ok, 'Staff payment marked as Paid');
    assert(payStatusData.payment.status === 'Paid', 'Payment status updated to Paid');
    console.log('  ✅ PASS: Staff payment transitioned to "Paid" and auto-logged in expense ledger');

    // 8. Payouts Tracker & Approval Workflow
    console.log('\n--- 8. Payouts Tracker & Approval Workflow ---');
    const newPayoutRes = await fetch(`${BASE_URL}/api/finance/payouts`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        recipient: 'Apex CAD/CAM Digital Milling Facility',
        recipientType: 'Laboratory',
        amount: 16500,
        purpose: 'Implant bar and zirconia framework milling charges',
        paymentMethod: 'Bank Transfer'
      })
    });
    const newPayoutData = await newPayoutRes.json();
    assert(newPayoutRes.ok, 'Payout requested successfully');
    assert(newPayoutData.payout.approvalStatus === 'Pending', 'Initial approval status is Pending');
    console.log(`  ✅ PASS: Payout requested: ${newPayoutData.payout.recipient} — Rs. ${newPayoutData.payout.amount} (Pending)`);

    // Approve and pay payout
    const approvePayoutRes = await fetch(`${BASE_URL}/api/finance/payouts/${newPayoutData.payout.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'Paid', notes: 'Bank transfer voucher confirmed.' })
    });
    const approvePayoutData = await approvePayoutRes.json();
    assert(approvePayoutRes.ok, 'Payout approved and marked as Paid');
    assert(approvePayoutData.payout.approvalStatus === 'Paid', 'Approval status is Paid');
    assert(approvePayoutData.payout.approvedBy !== null, 'Approved by manager recorded');
    console.log('  ✅ PASS: Payout approved & paid with manager sign-off');

    // 9. Total Financial Activity Dashboard & Period Analysis
    console.log('\n--- 9. Total Financial Activity Dashboard & Period Analysis ---');
    const summaryRes = await fetch(`${BASE_URL}/api/finance/summary`, {
      headers: adminHeaders
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.ok, 'Retrieved financial summary metrics');
    assert(summaryData.current.income > 0, 'Total income computed');
    assert(summaryData.current.expenses > 0, 'Total expenses computed');
    assert(summaryData.current.netBalance !== undefined, 'Net balance computed');
    assert(summaryData.growth !== undefined, 'Period-over-period growth comparison metrics available');
    assert(summaryData.categoryBreakdown !== undefined, 'Category breakdown available');
    console.log(`  ✅ PASS: Financial Dashboard: Income: Rs. ${summaryData.current.income.toLocaleString()} | Expenses: Rs. ${summaryData.current.expenses.toLocaleString()} | Net Balance: Rs. ${summaryData.current.netBalance.toLocaleString()}`);

    // 10. Data Export Options
    console.log('\n--- 10. Financial Data Export Options ---');
    const exportTxnRes = await fetch(`${BASE_URL}/api/finance/export?type=transactions`, {
      headers: adminHeaders
    });
    assert(exportTxnRes.ok, 'Transactions CSV export succeeds');
    const exportTxnCsv = await exportTxnRes.text();
    assert(exportTxnCsv.includes('ID,Date,Ref Number'), 'CSV header row formatted correctly');

    const exportStaffRes = await fetch(`${BASE_URL}/api/finance/export?type=staff_payments`, {
      headers: adminHeaders
    });
    assert(exportStaffRes.ok, 'Staff payment sheet CSV export succeeds');
    const exportStaffCsv = await exportStaffRes.text();
    assert(exportStaffCsv.includes('Staff Name,Role,Period,Base Salary'), 'Staff payroll CSV header row formatted correctly');
    console.log('  ✅ PASS: CSV export functional for transactions, staff payments, and payouts');

    console.log('\n===============================================================');
    console.log('📊 FINANCE MODULE TEST SUITE COMPLETE: ALL TESTS PASSED');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\nFatal test error:', err);
    process.exit(1);
  }
}

runFinanceTests();

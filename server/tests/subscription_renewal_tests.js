// Built-in global fetch available in Node.js
const BASE_URL = 'http://localhost:5000';

async function runSubscriptionTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING SUBSCRIPTION & PAYMENT RENEWAL TEST SUITE');
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
    // 1. Authenticate Developer Admin and Clinic Super Admin
    console.log('--- 1. Authentication & Role Issuance ---');
    const devLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'devadmin@anacraft.com', password: 'DevAdmin@123' })
    });
    const devLogin = await devLoginRes.json();
    assert(devLoginRes.ok && devLogin.token, 'Developer Admin login succeeds');
    const devToken = devLogin.token;

    const nepalLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nepaldental.com.np', password: 'Admin@123' })
    });
    const nepalLogin = await nepalLoginRes.json();
    assert(nepalLoginRes.ok && nepalLogin.token, 'Nepal Dental Admin login succeeds');
    const clinicToken = nepalLogin.token;
    const tenantHeaders = {
      'Authorization': `Bearer ${clinicToken}`,
      'x-tenant-id': 'tenant-nepal-dental',
      'Content-Type': 'application/json'
    };

    // 2. Fetch Current Subscription Details
    console.log('\n--- 2. Retrieve Current Subscription & Owner Payment Details ---');
    const subRes = await fetch(`${BASE_URL}/api/subscription/current`, {
      headers: tenantHeaders
    });
    const subData = await subRes.json();
    assert(subRes.ok, 'Subscription details retrieved successfully');
    assert(subData.subscription?.planName, `Current Plan Name displayed: "${subData.subscription?.planName}"`);
    assert(subData.subscription?.status, `Subscription Status displayed: "${subData.subscription?.status}"`);
    assert(subData.subscription?.startDate, `Subscription Start Date present: "${subData.subscription?.startDate}"`);
    assert(subData.subscription?.expiryDate, `Subscription Expiry Date present: "${subData.subscription?.expiryDate}"`);
    assert(subData.paymentConfig?.bankName === 'Nabil Bank Limited', 'Software owner bank name present: "Nabil Bank Limited"');
    assert(subData.paymentConfig?.accountNumber === '01201017500982', 'Software owner account number present: "01201017500982"');
    assert(subData.paymentConfig?.accountName.includes('Anaya Craft'), 'Software owner account name present: "Anaya Craft IT Solutions Pvt. Ltd."');
    assert(subData.paymentConfig?.qrCodeUrl, 'Software owner payment QR code present');

    const originalExpiryDate = new Date(subData.subscription.expiryDate).getTime();

    // 3. Form Validation for Renewals
    console.log('\n--- 3. Validation Safeguards on Renewal Submission ---');
    const noPayerRes = await fetch(`${BASE_URL}/api/subscription/renew`, {
      method: 'POST',
      headers: tenantHeaders,
      body: JSON.stringify({
        payerName: '',
        receiptUrl: 'data:image/png;base64,sample'
      })
    });
    assert(noPayerRes.status === 400, 'Renewal without payer name is blocked with 400 Validation Error');

    const noReceiptRes = await fetch(`${BASE_URL}/api/subscription/renew`, {
      method: 'POST',
      headers: tenantHeaders,
      body: JSON.stringify({
        payerName: 'Dr. Mukesh Kushwaha',
        receiptUrl: ''
      })
    });
    assert(noReceiptRes.status === 400, 'Renewal without receipt upload is blocked with 400 Validation Error');

    // 4. Submit Renewal Request (Pending Verification)
    console.log('\n--- 4. Renewal Submission & Software Owner Notification ---');
    const sampleReceiptBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const renewSubmitRes = await fetch(`${BASE_URL}/api/subscription/renew`, {
      method: 'POST',
      headers: tenantHeaders,
      body: JSON.stringify({
        payerName: 'Dr. Mukesh Kushwaha (Nepal Dental)',
        planId: 'plan-professional',
        billingCycle: 'Yearly',
        transactionRef: 'NABIL-TXN-883921',
        receiptUrl: sampleReceiptBase64,
        receiptFileName: 'nabil_voucher_annual_2026.png'
      })
    });
    const renewSubmitData = await renewSubmitRes.json();
    assert(renewSubmitRes.status === 201, 'Renewal submission succeeds with 201 Created');
    assert(
      renewSubmitData.message?.includes('awaiting verification'),
      'Confirmation message shows receipt uploaded & payment awaiting verification'
    );
    const renewalId = renewSubmitData.renewal?.id;
    assert(renewalId, `Renewal request created with ID: ${renewalId}`);

    // Verify subscription status reflects awaiting verification
    const subAfterSubmitRes = await fetch(`${BASE_URL}/api/subscription/current`, {
      headers: tenantHeaders
    });
    const subAfterSubmit = await subAfterSubmitRes.json();
    assert(
      subAfterSubmit.subscription.status === 'Payment Awaiting Verification',
      'Tenant subscription status accurately shows "Payment Awaiting Verification"'
    );
    assert(
      new Date(subAfterSubmit.subscription.expiryDate).getTime() === originalExpiryDate,
      'Expiry date is NOT extended before software owner approval'
    );

    // Verify Developer Admin received notification
    const devHeaders = {
      'Authorization': `Bearer ${devToken}`,
      'Content-Type': 'application/json'
    };
    const notifsRes = await fetch(`${BASE_URL}/api/platform/notifications`, {
      headers: devHeaders
    });
    const notifs = await notifsRes.json();
    const relevantNotif = notifs.find(n => n.renewalId === renewalId);
    assert(relevantNotif !== undefined, 'Software owner received instant notification of renewal request');
    assert(
      relevantNotif?.userAccount?.name === 'Super Admin' || relevantNotif?.userAccount?.email === 'admin@nepaldental.com.np',
      'Notification contains submitter user account details'
    );
    assert(
      relevantNotif?.plan?.name === 'Professional Practice',
      'Notification contains selected plan and amount'
    );

    // 5. Software Owner Rejection Workflow
    console.log('\n--- 5. Software Owner Rejection & User Resubmission Instructions ---');
    const rejectRes = await fetch(`${BASE_URL}/api/platform/renewals/${renewalId}/reject`, {
      method: 'POST',
      headers: devHeaders,
      body: JSON.stringify({
        reason: 'Payment transaction reference NABIL-TXN-883921 does not match Nabil Bank statement.',
        instructions: 'Please re-upload a clear voucher screenshot showing the verified Nabil Bank transaction reference number and exact timestamp.'
      })
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.ok, 'Software owner can reject invalid renewal request');

    // Verify user received rejection instructions
    const subAfterRejectRes = await fetch(`${BASE_URL}/api/subscription/current`, {
      headers: tenantHeaders
    });
    const subAfterReject = await subAfterRejectRes.json();
    assert(
      subAfterReject.lastRejection !== null,
      'User subscription page displays rejection notice'
    );
    assert(
      subAfterReject.lastRejection?.reason?.includes('NABIL-TXN-883921'),
      'Rejection notice contains software owner reason'
    );
    assert(
      subAfterReject.lastRejection?.instructions?.includes('re-upload'),
      'Rejection notice provides clear resubmission instructions'
    );
    assert(
      new Date(subAfterReject.subscription.expiryDate).getTime() === originalExpiryDate,
      'Expiry date remains untouched following rejection'
    );

    // 6. Resubmit Corrected Renewal & Software Owner Approval
    console.log('\n--- 6. Resubmission & Software Owner Approval ---');
    const resubmitRes = await fetch(`${BASE_URL}/api/subscription/renew`, {
      method: 'POST',
      headers: tenantHeaders,
      body: JSON.stringify({
        payerName: 'Dr. Mukesh Kushwaha',
        planId: 'plan-professional',
        billingCycle: 'Yearly',
        transactionRef: 'NABIL-TXN-998811-VERIFIED',
        receiptUrl: sampleReceiptBase64,
        receiptFileName: 'nabil_verified_statement.png'
      })
    });
    const resubmitData = await resubmitRes.json();
    const newRenewalId = resubmitData.renewal?.id;
    assert(resubmitRes.status === 201, 'Corrected renewal resubmission accepted');

    // Software Owner Approves
    const approveRes = await fetch(`${BASE_URL}/api/platform/renewals/${newRenewalId}/approve`, {
      method: 'POST',
      headers: devHeaders
    });
    const approveData = await approveRes.json();
    assert(approveRes.ok, 'Software owner approves verified renewal request');
    assert(
      approveData.subscription?.status === 'Active',
      'Tenant subscription status updated to Active upon approval'
    );

    const newExpiryDate = new Date(approveData.subscription?.expiryDate).getTime();
    assert(
      newExpiryDate > originalExpiryDate,
      `Subscription expiry date successfully extended (+1 year): ${approveData.subscription?.expiryDate}`
    );

    // Verify current subscription API reflects active approved status
    const subFinalRes = await fetch(`${BASE_URL}/api/subscription/current`, {
      headers: tenantHeaders
    });
    const subFinal = await subFinalRes.json();
    assert(subFinal.subscription.status === 'Active', 'Subscription is Active & in good standing');
    assert(subFinal.pendingRenewal === null, 'Pending renewal cleared after approval');
    assert(subFinal.lastRenewal?.status === 'APPROVED', 'Last renewal record archived with APPROVED status');

    console.log('\n===============================================================');
    console.log(`📊 SUBSCRIPTION TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runSubscriptionTests();

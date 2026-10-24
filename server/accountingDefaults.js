/**
 * Accounting and Billing Module - Default Chart of Accounts, Journal Entries & Financial Standards
 * Fully compliant with GAAP double-entry bookkeeping, audit trail integrity, and clinical workflows.
 */

export const DEFAULT_CHART_OF_ACCOUNTS = [
  // ASSETS (1000s) - Normal Balance: DEBIT
  {
    code: '1010',
    name: 'Cash in Drawer / Register',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Physical cash received and kept at clinic reception counter drawer',
    balance: 26500,
    isActive: true
  },
  {
    code: '1020',
    name: 'Bank Current Account - Nabil Bank',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Primary corporate operating bank account at Nabil Bank Ltd (Acct: 01201017500982)',
    balance: 245000,
    isActive: true
  },
  {
    code: '1030',
    name: 'Digital Payments Clearing (FonePay/POS/Wallets)',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Clearing account for FonePay QR, Cards POS, eSewa and digital settlements',
    balance: 42500,
    isActive: true
  },
  {
    code: '1100',
    name: 'Accounts Receivable (AR) - Patients',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Outstanding treatment invoices and pending receivables due from patients',
    balance: 65000,
    isActive: true
  },
  {
    code: '1150',
    name: 'Staff Salary Advances & Employee Receivables',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Outstanding salary advances, loan disbursements, and imprest balances given to clinic staff',
    balance: 15000,
    isActive: true
  },
  {
    code: '1200',
    name: 'Dental Consumables & Materials Inventory',
    type: 'ASSET',
    category: 'Current Assets',
    normalBalance: 'DEBIT',
    description: 'Inventory value of restorative composites, impression materials, burs, and sterile packs',
    balance: 95000,
    isActive: true
  },
  {
    code: '1500',
    name: 'Dental Chairs & Clinical Equipment',
    type: 'ASSET',
    category: 'Fixed Assets',
    normalBalance: 'DEBIT',
    description: 'Capital valuation of dental operatory chairs, Class B autoclave, RVG sensors & compressor',
    balance: 1250000,
    isActive: true
  },

  // LIABILITIES (2000s) - Normal Balance: CREDIT
  {
    code: '2010',
    name: 'Accounts Payable (AP) - Labs & Suppliers',
    type: 'LIABILITY',
    category: 'Current Liabilities',
    normalBalance: 'CREDIT',
    description: 'Outstanding unpaid bills due to dental laboratories and dental supply traders',
    balance: 34000,
    isActive: true
  },
  {
    code: '2020',
    name: 'Accrued Salaries & Doctor Fees Payable',
    type: 'LIABILITY',
    category: 'Current Liabilities',
    normalBalance: 'CREDIT',
    description: 'Staff payroll liabilities and consultant incentives accrued for the period',
    balance: 0,
    isActive: true
  },
  {
    code: '2100',
    name: 'Patient Advance Deposits & Credit Balances',
    type: 'LIABILITY',
    category: 'Current Liabilities',
    normalBalance: 'CREDIT',
    description: 'Unearned customer deposits held in advance for future implant or orthodontic treatments',
    balance: 28000,
    isActive: true
  },
  {
    code: '2200',
    name: 'Tax & VAT Payable (Inland Revenue)',
    type: 'LIABILITY',
    category: 'Current Liabilities',
    normalBalance: 'CREDIT',
    description: 'Output VAT/sales tax collected minus input tax paid, payable to tax authorities',
    balance: 14200,
    isActive: true
  },

  // EQUITY (3000s) - Normal Balance: CREDIT
  {
    code: '3010',
    name: "Owner's Capital & Clinic Equity",
    type: 'EQUITY',
    category: 'Equity',
    normalBalance: 'CREDIT',
    description: 'Original equity invested by clinic founder and partners',
    balance: 1400000,
    isActive: true
  },
  {
    code: '3020',
    name: 'Retained Earnings & Accumulated Surplus',
    type: 'EQUITY',
    category: 'Equity',
    normalBalance: 'CREDIT',
    description: 'Cumulative retained clinical earnings from prior operating years',
    balance: 238800,
    isActive: true
  },

  // REVENUE (4000s) - Normal Balance: CREDIT
  {
    code: '4010',
    name: 'Dental Treatment & Procedure Revenue',
    type: 'REVENUE',
    category: 'Operating Revenue',
    normalBalance: 'CREDIT',
    description: 'Gross billings for restorations, root canals, dental implants, crowns, and extractions',
    balance: 198000,
    isActive: true
  },
  {
    code: '4020',
    name: 'Consultation & Registration OPD Fees',
    type: 'REVENUE',
    category: 'Operating Revenue',
    normalBalance: 'CREDIT',
    description: 'Diagnostic consultation charges, OPD tickets, and emergency triage fees',
    balance: 18500,
    isActive: true
  },
  {
    code: '4030',
    name: 'Pharmacy & Medication Sales',
    type: 'REVENUE',
    category: 'Operating Revenue',
    normalBalance: 'CREDIT',
    description: 'Dispensing income for antibiotics, analgesics, antiseptic rinses, and oral care kits',
    balance: 24500,
    isActive: true
  },
  {
    code: '4040',
    name: 'Dental Lab Services Markup',
    type: 'REVENUE',
    category: 'Operating Revenue',
    normalBalance: 'CREDIT',
    description: 'Clinical margin recognized on outsourced prosthetics, custom aligners, and bridges',
    balance: 35000,
    isActive: true
  },
  {
    code: '4090',
    name: 'Other Clinic Income',
    type: 'REVENUE',
    category: 'Other Revenue',
    normalBalance: 'CREDIT',
    description: 'Medical record duplicate certificates, study cast digitization, and miscellaneous fees',
    balance: 4000,
    isActive: true
  },

  // EXPENSES (5000s) - Normal Balance: DEBIT
  {
    code: '5010',
    name: 'Staff Salaries & Doctor Clinical Fees',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: 'Salaries of dental surgeons, hygienists, nurses, receptionist, and lab tech',
    balance: 130000,
    isActive: true
  },
  {
    code: '5100',
    name: 'Dental Laboratory Charges',
    type: 'EXPENSE',
    category: 'Direct Clinical Cost (COGS)',
    normalBalance: 'DEBIT',
    description: 'Fabrication fees for zirconia crowns, PFM units, cast partial dentures, and retainers',
    balance: 38500,
    isActive: true
  },
  {
    code: '5200',
    name: 'Dental Materials & Clinical Consumables',
    type: 'EXPENSE',
    category: 'Direct Clinical Cost (COGS)',
    normalBalance: 'DEBIT',
    description: 'Restorative resin, bonding agents, impression alginate/PVS, local anesthetic, and gloves',
    balance: 26400,
    isActive: true
  },
  {
    code: '5300',
    name: 'Clinic Facility Rent & Lease',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: 'Commercial facility monthly lease payment for Baneshwor clinic premises',
    balance: 45000,
    isActive: true
  },
  {
    code: '5400',
    name: 'Electricity, Water & Utilities',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: 'Nepal Electricity Authority power bills, dedicated fiber internet, and drinking water',
    balance: 9800,
    isActive: true
  },
  {
    code: '5500',
    name: 'Dental Equipment Maintenance & Servicing',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: 'Dental unit air compressor upkeep, autoclave spore test validation, and suction maintenance',
    balance: 6500,
    isActive: true
  },
  {
    code: '5600',
    name: 'Office Administration, Software & Misc',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalBalance: 'DEBIT',
    description: 'Office stationery, patient comfort amenities, and dental ERP cloud subscription',
    balance: 5200,
    isActive: true
  },
  {
    code: '5700',
    name: 'Approved Patient Discounts & Adjustments',
    type: 'EXPENSE',
    category: 'Contra Revenue',
    normalBalance: 'DEBIT',
    description: 'Authorized treatment price reductions, student/senior citizen concessions, and waivers',
    balance: 9600,
    isActive: true
  }
];

export const DEFAULT_JOURNAL_ENTRIES = [
  {
    id: 'JE-2026-0001',
    date: '2026-10-15T09:00:00.000Z',
    reference: 'INV-2026-5854',
    source: 'INVOICE',
    memo: 'Treatment billing for Pradeep Poudel: Surgical Implant Fixture & Abutment',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Dr. Mukesh Kushwaha',
    createdAt: '2026-10-15T09:00:00.000Z',
    lines: [
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 42500, credit: 0 },
      { accountCode: '5700', accountName: 'Approved Patient Discounts & Adjustments', debit: 2500, credit: 0 },
      { accountCode: '4010', accountName: 'Dental Treatment & Procedure Revenue', debit: 0, credit: 45000 }
    ]
  },
  {
    id: 'JE-2026-0002',
    date: '2026-10-15T09:15:00.000Z',
    reference: 'RCP-2026-0082',
    source: 'RECEIPT',
    memo: 'Partial payment received from Pradeep Poudel via Card POS (Nabil Bank)',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-15T09:15:00.000Z',
    lines: [
      { accountCode: '1030', accountName: 'Digital Payments Clearing (FonePay/POS/Wallets)', debit: 25000, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: 25000 }
    ]
  },
  {
    id: 'JE-2026-0003',
    date: '2026-10-18T10:20:00.000Z',
    reference: 'RCP-2026-0085',
    source: 'RECEIPT',
    memo: 'Treatment settlement payment from Bina Magar for full mouth scaling & veneers',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-18T10:20:00.000Z',
    lines: [
      { accountCode: '1020', accountName: 'Bank Current Account - Nabil Bank', debit: 12000, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: 12000 }
    ]
  },
  {
    id: 'JE-2026-0004',
    date: '2026-10-19T13:45:00.000Z',
    reference: 'CN-2026-001',
    source: 'CREDIT_NOTE',
    memo: 'Approved Senior Citizen 10% fee adjustment credit note for Suman Shrestha',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Dr. Mukesh Kushwaha',
    createdAt: '2026-10-19T13:45:00.000Z',
    lines: [
      { accountCode: '5700', accountName: 'Approved Patient Discounts & Adjustments', debit: 1500, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: 1500 }
    ]
  },
  {
    id: 'JE-2026-0005',
    date: '2026-10-20T14:00:00.000Z',
    reference: 'EXP-2026-003',
    source: 'EXPENSE',
    memo: 'Milling settlement paid to Kathmandu Dental Ceramics Lab for 2 units Zirconia',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Dr. Mukesh Kushwaha',
    createdAt: '2026-10-20T14:00:00.000Z',
    lines: [
      { accountCode: '5100', accountName: 'Dental Laboratory Charges', debit: 7500, credit: 0 },
      { accountCode: '1020', accountName: 'Bank Current Account - Nabil Bank', debit: 0, credit: 7500 }
    ]
  },
  {
    id: 'JE-2026-0006',
    date: '2026-10-21T11:00:00.000Z',
    reference: 'RCP-2026-0084',
    source: 'RECEIPT',
    memo: 'Direct cash collection for Molar Endodontics from Aarav Karki',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-21T11:00:00.000Z',
    lines: [
      { accountCode: '1010', accountName: 'Cash in Drawer / Register', debit: 8500, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: 8500 }
    ]
  },
  {
    id: 'JE-2026-0007',
    date: '2026-10-21T14:15:00.000Z',
    reference: 'EXP-2026-002',
    source: 'EXPENSE',
    memo: 'Restorative composite syringes and sterile burs paid to Himalayan Dental Supplies',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Dr. Mukesh Kushwaha',
    createdAt: '2026-10-21T14:15:00.000Z',
    lines: [
      { accountCode: '5200', accountName: 'Dental Materials & Clinical Consumables', debit: 14200, credit: 0 },
      { accountCode: '1020', accountName: 'Bank Current Account - Nabil Bank', debit: 0, credit: 14200 }
    ]
  },
  {
    id: 'JE-2026-0008',
    date: '2026-10-21T16:30:00.000Z',
    reference: 'DEP-2026-002',
    source: 'ADVANCE_DEPOSIT',
    memo: 'Advance treatment deposit received from Bina Magar for orthodontic aligners',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-21T16:30:00.000Z',
    lines: [
      { accountCode: '1030', accountName: 'Digital Payments Clearing (FonePay/POS/Wallets)', debit: 15000, credit: 0 },
      { accountCode: '2100', accountName: 'Patient Advance Deposits & Credit Balances', debit: 0, credit: 15000 }
    ]
  },
  {
    id: 'JE-2026-0009',
    date: '2026-10-22T08:30:00.000Z',
    reference: 'RCP-2026-0083',
    source: 'RECEIPT',
    memo: 'Final stage implant payment received via FonePay QR from Pradeep Poudel',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-22T08:30:00.000Z',
    lines: [
      { accountCode: '1030', accountName: 'Digital Payments Clearing (FonePay/POS/Wallets)', debit: 17500, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: 17500 }
    ]
  },
  {
    id: 'JE-2026-0010',
    date: '2026-10-22T17:00:00.000Z',
    reference: 'EXP-2026-005',
    source: 'EXPENSE',
    memo: 'Monthly utilities settlement for electricity, high-speed fiber & inverter check',
    status: 'POSTED',
    reversalOf: null,
    reversedBy: null,
    createdBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-22T17:00:00.000Z',
    lines: [
      { accountCode: '5400', accountName: 'Electricity, Water & Utilities', debit: 6200, credit: 0 },
      { accountCode: '1030', accountName: 'Digital Payments Clearing (FonePay/POS/Wallets)', debit: 0, credit: 6200 }
    ]
  }
];

export const DEFAULT_EXPENSE_VOUCHERS = [
  {
    id: 'EXP-2026-001',
    voucherNumber: 'EXP-2026-001',
    supplierOrPayee: 'Apex Dental Staff Payroll (5 Employees)',
    category: 'Staff Salaries and Wages',
    expenseDate: '2026-10-25',
    dueDate: '2026-10-25',
    amount: 130000,
    taxAmount: 0,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-20T11:00:00.000Z',
    paidAmount: 130000,
    notes: 'Monthly payroll for lead surgeon, dental assistant, nurse, technician & receptionist.',
    attachments: [
      { name: 'Salary_Sheet_Oct_2026.pdf', size: '240 KB', date: '2026-10-20' }
    ],
    createdAt: '2026-10-20T10:00:00.000Z',
    createdBy: 'Sita Thapa'
  },
  {
    id: 'EXP-2026-002',
    voucherNumber: 'EXP-2026-002',
    supplierOrPayee: 'Himalayan Dental Supplies Pvt. Ltd.',
    category: 'Dental Materials and Consumables',
    expenseDate: '2026-10-21',
    dueDate: '2026-10-21',
    amount: 14200,
    taxAmount: 1634,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-21T14:15:00.000Z',
    paidAmount: 14200,
    notes: 'Restorative composite syringes (3M Filtek), bonding agents, and sterile carbide burs.',
    attachments: [
      { name: 'Himalayan_Supplies_Tax_Inv_4011.pdf', size: '410 KB', date: '2026-10-21' }
    ],
    createdAt: '2026-10-21T14:00:00.000Z',
    createdBy: 'Dr. Mukesh Kushwaha'
  },
  {
    id: 'EXP-2026-003',
    voucherNumber: 'EXP-2026-003',
    supplierOrPayee: 'Kathmandu Dental Ceramics & Milling Lab',
    category: 'Dental Laboratory Charges',
    expenseDate: '2026-10-20',
    dueDate: '2026-10-20',
    amount: 7500,
    taxAmount: 863,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-20T14:00:00.000Z',
    paidAmount: 7500,
    notes: 'High-translucency multilayer zirconia crowns milling for Patient Aarav Karki.',
    attachments: [
      { name: 'KTM_Ceramics_Bill_9920.jpg', size: '1.2 MB', date: '2026-10-20' }
    ],
    createdAt: '2026-10-20T13:30:00.000Z',
    createdBy: 'Dr. Mukesh Kushwaha'
  },
  {
    id: 'EXP-2026-004',
    voucherNumber: 'EXP-2026-004',
    supplierOrPayee: 'Baneshwor Commercial Complex (Landlord)',
    category: 'Rent and Facilities',
    expenseDate: '2026-10-02',
    dueDate: '2026-10-05',
    amount: 45000,
    taxAmount: 0,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-02T10:00:00.000Z',
    paidAmount: 45000,
    notes: 'Monthly clinic lease for 1,200 sq.ft facility including 2 dental operatory rooms.',
    attachments: [
      { name: 'Rent_Receipt_October_2026.pdf', size: '180 KB', date: '2026-10-02' }
    ],
    createdAt: '2026-10-02T09:30:00.000Z',
    createdBy: 'Dr. Mukesh Kushwaha'
  },
  {
    id: 'EXP-2026-005',
    voucherNumber: 'EXP-2026-005',
    supplierOrPayee: 'Nepal Electricity Authority & WorldLink Fiber',
    category: 'Utilities (Electricity/Water/Internet)',
    expenseDate: '2026-10-16',
    dueDate: '2026-10-18',
    amount: 6200,
    taxAmount: 0,
    paymentMethod: 'FonePay / QR',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-16T17:00:00.000Z',
    paidAmount: 6200,
    notes: 'Monthly 3-phase commercial electricity power, backup inverter batteries check, and optical fiber.',
    attachments: [
      { name: 'NEA_Bill_Baneshwor_Branch.pdf', size: '320 KB', date: '2026-10-16' }
    ],
    createdAt: '2026-10-16T16:30:00.000Z',
    createdBy: 'Sita Thapa'
  },
  {
    id: 'EXP-2026-006',
    voucherNumber: 'EXP-2026-006',
    supplierOrPayee: 'BioMed Calibration & Sterilization Services',
    category: 'Equipment Maintenance and Servicing',
    expenseDate: '2026-10-14',
    dueDate: '2026-10-14',
    amount: 4500,
    taxAmount: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-14T11:30:00.000Z',
    paidAmount: 4500,
    notes: 'Class B Autoclave annual pressure vessel validation, gasket replacement, and biological spore test.',
    attachments: [
      { name: 'Autoclave_Service_Certificate.pdf', size: '550 KB', date: '2026-10-14' }
    ],
    createdAt: '2026-10-14T11:00:00.000Z',
    createdBy: 'Dr. Mukesh Kushwaha'
  },
  {
    id: 'EXP-2026-007',
    voucherNumber: 'EXP-2026-007',
    supplierOrPayee: 'Shree Dental Traders Pvt. Ltd.',
    category: 'Dental Materials and Consumables',
    expenseDate: '2026-10-22',
    dueDate: '2026-11-05',
    amount: 12000,
    taxAmount: 1380,
    paymentMethod: 'Cheque',
    paymentStatus: 'Unpaid',
    approvalStatus: 'Pending',
    approvedBy: null,
    approvedAt: null,
    paidAmount: 0,
    notes: 'Supplier Invoice #SDT-8821: Alginate impression bags, dental bibs, saliva ejectors, and etch gel.',
    attachments: [
      { name: 'Shree_Traders_Invoice_8821.pdf', size: '620 KB', date: '2026-10-22' }
    ],
    createdAt: '2026-10-22T15:00:00.000Z',
    createdBy: 'Sita Thapa'
  },
  {
    id: 'EXP-2026-008',
    voucherNumber: 'EXP-2026-008',
    supplierOrPayee: 'Everest Ortho Supplies',
    category: 'Dental Materials and Consumables',
    expenseDate: '2026-10-23',
    dueDate: '2026-10-31',
    amount: 8000,
    taxAmount: 920,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Unpaid',
    approvalStatus: 'Approved',
    approvedBy: 'Dr. Mukesh Kushwaha',
    approvedAt: '2026-10-23T10:00:00.000Z',
    paidAmount: 0,
    notes: 'Orthodontic NiTi archwires, bracket kits, and elastomeric ligature ties for visiting orthodontist.',
    attachments: [
      { name: 'Everest_Ortho_Bill_1049.pdf', size: '290 KB', date: '2026-10-23' }
    ],
    createdAt: '2026-10-23T09:30:00.000Z',
    createdBy: 'Dr. Mukesh Kushwaha'
  }
];

export const DEFAULT_ADVANCE_DEPOSITS = [
  {
    id: 'DEP-2026-001',
    depositNumber: 'DEP-2026-001',
    patientId: 'PT-8038',
    patientName: 'Pradeep Poudel',
    date: '2026-10-10T10:00:00.000Z',
    amount: 20000,
    balanceRemaining: 0,
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'RCP-2026-0081',
    refNumber: 'TXN-DEP-1001',
    notes: 'Advance deposit towards surgical implant fixtures. Fully utilized on INV-2026-5854.',
    createdBy: 'Sita Thapa',
    createdAt: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'DEP-2026-002',
    depositNumber: 'DEP-2026-002',
    patientId: 'PT-103',
    patientName: 'Bina Magar',
    date: '2026-10-21T16:30:00.000Z',
    amount: 15000,
    balanceRemaining: 15000,
    paymentMethod: 'FonePay / QR',
    receiptNumber: 'RCP-2026-0086',
    refNumber: 'TXN-DEP-1002',
    notes: 'Advance booking deposit for clear aligner series. Available as credit balance.',
    createdBy: 'Sita Thapa',
    createdAt: '2026-10-21T16:30:00.000Z'
  },
  {
    id: 'DEP-2026-003',
    depositNumber: 'DEP-2026-003',
    patientId: 'PT-101',
    patientName: 'Suman Shrestha',
    date: '2026-10-22T11:00:00.000Z',
    amount: 13000,
    balanceRemaining: 13000,
    paymentMethod: 'Cash',
    receiptNumber: 'RCP-2026-0088',
    refNumber: 'TXN-DEP-1003',
    notes: 'Advance deposit for ceramic inlay and crown treatment schedule.',
    createdBy: 'Sita Thapa',
    createdAt: '2026-10-22T11:00:00.000Z'
  }
];

export const DEFAULT_CREDIT_NOTES = [
  {
    id: 'CN-2026-001',
    creditNoteNumber: 'CN-2026-001',
    patientId: 'PT-101',
    patientName: 'Suman Shrestha',
    invoiceId: 'INV-2026-1042',
    date: '2026-10-19T13:45:00.000Z',
    amount: 1500,
    reason: 'Approved Senior Citizen 10% discount adjustment applied post-consultation.',
    approvedBy: 'Dr. Mukesh Kushwaha',
    journalEntryId: 'JE-2026-0004',
    createdAt: '2026-10-19T13:45:00.000Z'
  }
];

export const DEFAULT_RECEIPTS = [
  {
    id: 'RCP-2026-0081',
    receiptNumber: 'RCP-2026-0081',
    patientId: 'PT-8038',
    patientName: 'Pradeep Poudel',
    invoiceId: null,
    depositId: 'DEP-2026-001',
    date: '2026-10-10',
    amount: 20000,
    paymentMethod: 'Bank Transfer',
    paymentType: 'ADVANCE_DEPOSIT',
    refNumber: 'NBL-TRF-0912',
    notes: 'Advance treatment deposit for dental implant therapy',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'RCP-2026-0082',
    receiptNumber: 'RCP-2026-0082',
    patientId: 'PT-8038',
    patientName: 'Pradeep Poudel',
    invoiceId: 'INV-2026-5854',
    depositId: null,
    date: '2026-10-15',
    amount: 25000,
    paymentMethod: 'Credit Card',
    paymentType: 'INVOICE_PAYMENT',
    refNumber: 'POS-NBL-4421',
    notes: 'Implant surgical phase 1 payment via Card POS terminal',
    issuedBy: 'Dr. Mukesh Kushwaha',
    createdAt: '2026-10-15T09:15:00.000Z'
  },
  {
    id: 'RCP-2026-0083',
    receiptNumber: 'RCP-2026-0083',
    patientId: 'PT-8038',
    patientName: 'Pradeep Poudel',
    invoiceId: 'INV-2026-5854',
    depositId: null,
    date: '2026-10-22',
    amount: 17500,
    paymentMethod: 'FonePay / QR',
    paymentType: 'INVOICE_PAYMENT',
    refNumber: 'REC-NBL-8801',
    notes: 'Custom abutment and crown procedure fee installment via FonePay QR',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-22T08:30:00.000Z'
  },
  {
    id: 'RCP-2026-0084',
    receiptNumber: 'RCP-2026-0084',
    patientId: 'PT-102',
    patientName: 'Aarav Karki',
    invoiceId: 'INV-2026-1102',
    depositId: null,
    date: '2026-10-21',
    amount: 8500,
    paymentMethod: 'Cash',
    paymentType: 'INVOICE_PAYMENT',
    refNumber: 'REC-CSH-1102',
    notes: 'Molar endodontic therapy completion and aesthetic glass ionomer core build-up',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-21T11:00:00.000Z'
  },
  {
    id: 'RCP-2026-0085',
    receiptNumber: 'RCP-2026-0085',
    patientId: 'PT-103',
    patientName: 'Bina Magar',
    invoiceId: 'INV-2026-8790',
    depositId: null,
    date: '2026-10-18',
    amount: 12000,
    paymentMethod: 'Bank Transfer',
    paymentType: 'INVOICE_PAYMENT',
    refNumber: 'REC-NBL-8790',
    notes: 'Full mouth ultrasonic scaling, root planing, and composite veneers',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-18T10:20:00.000Z'
  },
  {
    id: 'RCP-2026-0086',
    receiptNumber: 'RCP-2026-0086',
    patientId: 'PT-103',
    patientName: 'Bina Magar',
    invoiceId: null,
    depositId: 'DEP-2026-002',
    date: '2026-10-21',
    amount: 15000,
    paymentMethod: 'FonePay / QR',
    paymentType: 'ADVANCE_DEPOSIT',
    refNumber: 'FP-DEP-8840',
    notes: 'Advance booking credit deposit for clear aligner treatment',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-21T16:30:00.000Z'
  },
  {
    id: 'RCP-2026-0087',
    receiptNumber: 'RCP-2026-0087',
    patientId: 'PT-104',
    patientName: 'Sita Gautam',
    invoiceId: null,
    depositId: null,
    date: '2026-10-23',
    amount: 500,
    paymentMethod: 'Cash',
    paymentType: 'CONSULTATION_FEE',
    refNumber: 'OPD-CSH-5001',
    notes: 'Doctor OPD diagnostic consultation and digital IOPA X-Ray check',
    issuedBy: 'Sita Thapa (Front Desk)',
    createdAt: '2026-10-23T09:00:00.000Z'
  }
];

export const DEFAULT_BANK_RECONCILIATIONS = [
  {
    id: 'REC-2026-10',
    accountCode: '1020',
    accountName: 'Bank Current Account - Nabil Bank',
    statementDate: '2026-10-22',
    statementBalance: 245000,
    bookBalance: 245000,
    clearedBalance: 245000,
    clearedItemsCount: 8,
    difference: 0,
    status: 'Reconciled',
    notes: 'Monthly mid-period reconciliation matched statement #NBL-2026-10. All cheques and electronic deposits cleared.',
    reconciledBy: 'Dr. Mukesh Kushwaha',
    reconciledAt: '2026-10-22T18:00:00.000Z'
  }
];

export const DEFAULT_TAX_CONFIG = {
  taxName: 'VAT',
  taxRate: 13,
  taxIdNumber: 'PAN-601928374',
  isTaxEnabled: true,
  taxExemptCategories: ['Consultation & Registration OPD Fees'],
  taxableCategories: [
    'Dental Treatment & Procedure Revenue',
    'Pharmacy & Medication Sales',
    'Dental Lab Services Markup'
  ],
  notes: 'Registered under Inland Revenue Department (IRD) Nepal as VAT taxable health wellness establishment.'
};

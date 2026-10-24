/**
 * Accounting Service - Enterprise Double-Entry Accounting Engine for Dental Clinic ERP
 * Provides Chart of Accounts, Journal Entries with Reversals, General Ledger,
 * Accounts Receivable, Accounts Payable, Bank Reconciliation, and 7 Standard Reports.
 */

import {
  DEFAULT_CHART_OF_ACCOUNTS,
  DEFAULT_JOURNAL_ENTRIES,
  DEFAULT_EXPENSE_VOUCHERS,
  DEFAULT_ADVANCE_DEPOSITS,
  DEFAULT_CREDIT_NOTES,
  DEFAULT_RECEIPTS,
  DEFAULT_BANK_RECONCILIATIONS,
  DEFAULT_TAX_CONFIG
} from './accountingDefaults.js';

export class AccountingService {
  /**
   * Ensure tenant has all accounting collections initialized
   */
  static ensureTenantAccounting(tData) {
    let modified = false;

    if (!Array.isArray(tData.chartOfAccounts) || tData.chartOfAccounts.length === 0) {
      tData.chartOfAccounts = JSON.parse(JSON.stringify(DEFAULT_CHART_OF_ACCOUNTS));
      modified = true;
    }
    if (!Array.isArray(tData.journalEntries)) {
      tData.journalEntries = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_ENTRIES));
      modified = true;
    }
    if (!Array.isArray(tData.expenseVouchers)) {
      tData.expenseVouchers = JSON.parse(JSON.stringify(DEFAULT_EXPENSE_VOUCHERS));
      modified = true;
    }
    if (!Array.isArray(tData.advanceDeposits)) {
      tData.advanceDeposits = JSON.parse(JSON.stringify(DEFAULT_ADVANCE_DEPOSITS));
      modified = true;
    }
    if (!Array.isArray(tData.creditNotes)) {
      tData.creditNotes = JSON.parse(JSON.stringify(DEFAULT_CREDIT_NOTES));
      modified = true;
    }
    if (!Array.isArray(tData.receipts)) {
      tData.receipts = JSON.parse(JSON.stringify(DEFAULT_RECEIPTS));
      modified = true;
    }
    if (!Array.isArray(tData.bankReconciliations)) {
      tData.bankReconciliations = JSON.parse(JSON.stringify(DEFAULT_BANK_RECONCILIATIONS));
      modified = true;
    }
    if (!tData.taxConfig) {
      tData.taxConfig = JSON.parse(JSON.stringify(DEFAULT_TAX_CONFIG));
      modified = true;
    }

    // Ensure all patients have advance credit balance
    if (Array.isArray(tData.patients)) {
      tData.patients.forEach(p => {
        if (p.advanceCreditBalance === undefined) {
          // Calculate from advance deposits
          const deposits = (tData.advanceDeposits || []).filter(d => d.patientId === p.id);
          const totalAvailable = deposits.reduce((sum, d) => sum + (Number(d.balanceRemaining) || 0), 0);
          p.advanceCreditBalance = totalAvailable;
          modified = true;
        }
      });
    }

    return modified;
  }

  // ==========================================================================
  // 1. CHART OF ACCOUNTS (COA)
  // ==========================================================================

  static getChartOfAccounts(tData) {
    this.ensureTenantAccounting(tData);
    return tData.chartOfAccounts || [];
  }

  static createAccount(tData, accountData, user) {
    this.ensureTenantAccounting(tData);

    const { code, name, type, category, normalBalance, description, balance = 0 } = accountData;
    if (!code || !code.trim()) throw new Error('Account code is required.');
    if (!name || !name.trim()) throw new Error('Account name is required.');
    if (!type) throw new Error('Account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) is required.');

    const cleanCode = code.trim();
    if (tData.chartOfAccounts.some(a => a.code === cleanCode)) {
      throw new Error(`Account code "${cleanCode}" already exists in the Chart of Accounts.`);
    }

    const newAccount = {
      code: cleanCode,
      name: name.trim(),
      type: type.toUpperCase(),
      category: category || (type === 'ASSET' ? 'Current Assets' : type === 'LIABILITY' ? 'Current Liabilities' : type === 'REVENUE' ? 'Operating Revenue' : 'Operating Expenses'),
      normalBalance: normalBalance || (type === 'ASSET' || type === 'EXPENSE' ? 'DEBIT' : 'CREDIT'),
      description: (description || '').trim(),
      balance: Number(balance) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Staff'
    };

    tData.chartOfAccounts.push(newAccount);
    return newAccount;
  }

  static updateAccount(tData, code, updates, user) {
    this.ensureTenantAccounting(tData);
    const account = tData.chartOfAccounts.find(a => a.code === code);
    if (!account) throw new Error(`Account code "${code}" not found.`);

    if (updates.name) account.name = updates.name.trim();
    if (updates.category) account.category = updates.category.trim();
    if (updates.description !== undefined) account.description = updates.description.trim();
    if (updates.isActive !== undefined) account.isActive = Boolean(updates.isActive);
    account.updatedAt = new Date().toISOString();
    account.updatedBy = user?.name || 'Staff';

    return account;
  }

  // ==========================================================================
  // 2. JOURNAL ENTRIES & AUDITABLE REVERSALS
  // ==========================================================================

  static getJournalEntries(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    let entries = [...(tData.journalEntries || [])];

    if (query.source && query.source !== 'all') {
      entries = entries.filter(e => e.source?.toUpperCase() === query.source.toUpperCase());
    }
    if (query.status && query.status !== 'all') {
      entries = entries.filter(e => e.status?.toUpperCase() === query.status.toUpperCase());
    }
    if (query.accountCode) {
      entries = entries.filter(e => (e.lines || []).some(l => l.accountCode === query.accountCode));
    }
    if (query.startDate) {
      const s = new Date(query.startDate).getTime();
      entries = entries.filter(e => new Date(e.date || e.createdAt).getTime() >= s);
    }
    if (query.endDate) {
      const en = new Date(query.endDate).getTime();
      entries = entries.filter(e => new Date(e.date || e.createdAt).getTime() <= en);
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      entries = entries.filter(e =>
        e.id?.toLowerCase().includes(q) ||
        e.reference?.toLowerCase().includes(q) ||
        e.memo?.toLowerCase().includes(q) ||
        (e.lines || []).some(l => l.accountName?.toLowerCase().includes(q) || l.accountCode?.includes(q))
      );
    }

    // Sort descending by date
    entries.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const total = entries.length;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = entries.slice((page - 1) * limit, page * limit);

    return {
      entries: paginated,
      pagination: { total, page, limit, totalPages }
    };
  }

  static createJournalEntry(tData, entryData, user) {
    this.ensureTenantAccounting(tData);

    const { date, reference, source = 'MANUAL', memo, lines = [] } = entryData;
    if (!memo || !memo.trim()) throw new Error('Journal entry description/memo is required.');
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new Error('A balanced journal entry must contain at least two line items (Debit and Credit).');
    }

    // Verify Debits === Credits
    let totalDebit = 0;
    let totalCredit = 0;

    const validatedLines = lines.map((l, index) => {
      const debit = Math.max(0, Number(l.debit) || 0);
      const credit = Math.max(0, Number(l.credit) || 0);
      totalDebit += debit;
      totalCredit += credit;

      if (!l.accountCode) throw new Error(`Line ${index + 1} is missing an account code.`);
      const acc = tData.chartOfAccounts.find(a => a.code === l.accountCode);
      const accountName = l.accountName || acc?.name || `Account ${l.accountCode}`;

      return {
        accountCode: l.accountCode,
        accountName,
        debit,
        credit
      };
    });

    // Check rounding to 2 decimal places
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new Error(`Double-entry balance violation: Total Debits (${totalDebit.toFixed(2)}) must equal Total Credits (${totalCredit.toFixed(2)}). Difference: ${diff.toFixed(2)}`);
    }

    const now = new Date().toISOString();
    const id = entryData.id || `JE-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newEntry = {
      id,
      date: date || now,
      reference: reference || `REF-${id}`,
      source: source.toUpperCase(),
      memo: memo.trim(),
      status: 'POSTED',
      reversalOf: entryData.reversalOf || null,
      reversedBy: null,
      lines: validatedLines,
      totalDebit,
      totalCredit,
      createdBy: user?.name || 'Staff',
      createdAt: now
    };

    tData.journalEntries.unshift(newEntry);

    // Update account balances
    validatedLines.forEach(l => {
      const acc = tData.chartOfAccounts.find(a => a.code === l.accountCode);
      if (acc) {
        if (acc.normalBalance === 'DEBIT') {
          acc.balance = (acc.balance || 0) + l.debit - l.credit;
        } else {
          acc.balance = (acc.balance || 0) + l.credit - l.debit;
        }
      }
    });

    return newEntry;
  }

  /**
   * Authorized Reversal of a Posted Journal Entry.
   * Strictly adheres to accounting audit rules: DOES NOT delete history, but posts a full contra-entry!
   */
  static reverseJournalEntry(tData, entryId, reason, user) {
    this.ensureTenantAccounting(tData);

    const original = tData.journalEntries.find(e => e.id === entryId);
    if (!original) throw new Error(`Journal Entry "${entryId}" not found.`);
    if (original.status === 'REVERSED') {
      throw new Error(`Journal Entry "${entryId}" has already been reversed.`);
    }
    if (!reason || !reason.trim()) {
      throw new Error('An authorized reason is required to post a financial reversal entry.');
    }

    const now = new Date().toISOString();
    const reversalId = `JE-REV-${Date.now().toString().slice(-6)}`;

    // Swap debits and credits for all lines
    const reversalLines = original.lines.map(l => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.credit,
      credit: l.debit
    }));

    const reversalEntry = {
      id: reversalId,
      date: now,
      reference: `REV-${original.reference || original.id}`,
      source: 'REVERSAL',
      memo: `Authorized Reversal of ${original.id} (${original.memo}): ${reason.trim()}`,
      status: 'POSTED',
      reversalOf: original.id,
      reversedBy: null,
      lines: reversalLines,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      createdBy: user?.name || 'Authorized Auditor',
      createdAt: now
    };

    // Mark original entry as reversed
    original.status = 'REVERSED';
    original.reversedBy = reversalId;
    original.reversedAt = now;
    original.reversalReason = reason.trim();

    tData.journalEntries.unshift(reversalEntry);

    // Adjust chart of accounts balances
    reversalLines.forEach(l => {
      const acc = tData.chartOfAccounts.find(a => a.code === l.accountCode);
      if (acc) {
        if (acc.normalBalance === 'DEBIT') {
          acc.balance = (acc.balance || 0) + l.debit - l.credit;
        } else {
          acc.balance = (acc.balance || 0) + l.credit - l.debit;
        }
      }
    });

    return {
      success: true,
      reversedEntryId: original.id,
      reversalEntry
    };
  }

  // ==========================================================================
  // 3. GENERAL LEDGER (GL) & TRIAL BALANCE
  // ==========================================================================

  static getGeneralLedger(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    const coa = tData.chartOfAccounts || [];
    const entries = [...(tData.journalEntries || [])].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    const selectedAccountCode = query.accountCode || null;
    const targetAccounts = selectedAccountCode ? coa.filter(a => a.code === selectedAccountCode) : coa;

    const ledger = targetAccounts.map(account => {
      let runningBalance = 0;
      const transactions = [];

      entries.forEach(entry => {
        (entry.lines || []).forEach(line => {
          if (line.accountCode === account.code) {
            const debit = Number(line.debit) || 0;
            const credit = Number(line.credit) || 0;

            if (account.normalBalance === 'DEBIT') {
              runningBalance += (debit - credit);
            } else {
              runningBalance += (credit - debit);
            }

            transactions.push({
              journalEntryId: entry.id,
              date: entry.date,
              reference: entry.reference,
              source: entry.source,
              memo: entry.memo,
              status: entry.status,
              debit,
              credit,
              runningBalance
            });
          }
        });
      });

      const totalDebit = transactions.reduce((s, t) => s + t.debit, 0);
      const totalCredit = transactions.reduce((s, t) => s + t.credit, 0);

      return {
        accountCode: account.code,
        accountName: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        category: account.category,
        totalDebit,
        totalCredit,
        closingBalance: runningBalance,
        transactions
      };
    });

    return ledger;
  }

  static getTrialBalance(tData) {
    this.ensureTenantAccounting(tData);
    const coa = tData.chartOfAccounts || [];
    const gl = this.getGeneralLedger(tData);

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = coa.map(account => {
      const glItem = gl.find(g => g.accountCode === account.code);
      const balance = glItem ? glItem.closingBalance : (account.balance || 0);

      let debitBalance = 0;
      let creditBalance = 0;

      if (account.normalBalance === 'DEBIT') {
        if (balance >= 0) debitBalance = balance;
        else creditBalance = Math.abs(balance);
      } else {
        if (balance >= 0) creditBalance = balance;
        else debitBalance = Math.abs(balance);
      }

      totalDebits += debitBalance;
      totalCredits += creditBalance;

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        debit: debitBalance,
        credit: creditBalance
      };
    });

    return {
      rows,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.05,
      difference: Math.abs(totalDebits - totalCredits)
    };
  }

  // ==========================================================================
  // 4. EXPENSE VOUCHERS & ACCOUNTS PAYABLE
  // ==========================================================================

  static getExpenseVouchers(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    let vouchers = [...(tData.expenseVouchers || [])];

    if (query.category && query.category !== 'all') {
      vouchers = vouchers.filter(v => v.category?.toLowerCase() === query.category.toLowerCase());
    }
    if (query.paymentStatus && query.paymentStatus !== 'all') {
      vouchers = vouchers.filter(v => v.paymentStatus?.toLowerCase() === query.paymentStatus.toLowerCase());
    }
    if (query.approvalStatus && query.approvalStatus !== 'all') {
      vouchers = vouchers.filter(v => v.approvalStatus?.toLowerCase() === query.approvalStatus.toLowerCase());
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      vouchers = vouchers.filter(v =>
        v.voucherNumber?.toLowerCase().includes(q) ||
        v.supplierOrPayee?.toLowerCase().includes(q) ||
        v.notes?.toLowerCase().includes(q)
      );
    }

    return vouchers.sort((a, b) => new Date(b.expenseDate || b.createdAt) - new Date(a.expenseDate || a.createdAt));
  }

  static createExpenseVoucher(tData, data, user) {
    this.ensureTenantAccounting(tData);

    const { supplierOrPayee, category, expenseDate, dueDate, amount, taxAmount = 0, paymentMethod = 'Bank Transfer', paymentStatus = 'Paid', approvalStatus = 'Approved', notes = '', attachments = [] } = data;
    if (!supplierOrPayee || !supplierOrPayee.trim()) throw new Error('Supplier / Payee name is required.');
    if (!category) throw new Error('Expense category is required.');
    if (!amount || Number(amount) <= 0) throw new Error('Valid expense amount greater than 0 is required.');

    const numAmount = Number(amount);
    const now = new Date().toISOString();
    const id = `EXP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newVoucher = {
      id,
      voucherNumber: id,
      supplierOrPayee: supplierOrPayee.trim(),
      category: category.trim(),
      expenseDate: expenseDate || now.split('T')[0],
      dueDate: dueDate || expenseDate || now.split('T')[0],
      amount: numAmount,
      taxAmount: Number(taxAmount) || 0,
      paymentMethod,
      paymentStatus, // 'Unpaid' | 'Partially Paid' | 'Paid'
      approvalStatus, // 'Pending' | 'Approved' | 'Rejected' | 'Paid'
      approvedBy: approvalStatus === 'Approved' || approvalStatus === 'Paid' ? (user?.name || 'Dr. Mukesh Kushwaha') : null,
      approvedAt: approvalStatus === 'Approved' || approvalStatus === 'Paid' ? now : null,
      paidAmount: paymentStatus === 'Paid' ? numAmount : 0,
      notes: notes.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: now,
      createdBy: user?.name || 'Staff'
    };

    tData.expenseVouchers.unshift(newVoucher);

    // If marked Paid, auto-record corresponding Journal Entry
    if (paymentStatus === 'Paid') {
      let expenseAccountCode = '5600'; // Default Office & Misc
      if (category.toLowerCase().includes('salary') || category.toLowerCase().includes('wages')) expenseAccountCode = '5010';
      else if (category.toLowerCase().includes('lab')) expenseAccountCode = '5100';
      else if (category.toLowerCase().includes('material') || category.toLowerCase().includes('consumable')) expenseAccountCode = '5200';
      else if (category.toLowerCase().includes('rent')) expenseAccountCode = '5300';
      else if (category.toLowerCase().includes('util')) expenseAccountCode = '5400';
      else if (category.toLowerCase().includes('maintenance') || category.toLowerCase().includes('equipment')) expenseAccountCode = '5500';

      const paymentAccountCode = paymentMethod.toLowerCase().includes('cash') ? '1010' : paymentMethod.toLowerCase().includes('qr') || paymentMethod.toLowerCase().includes('fonepay') ? '1030' : '1020';

      this.createJournalEntry(tData, {
        date: newVoucher.expenseDate,
        reference: newVoucher.voucherNumber,
        source: 'EXPENSE',
        memo: `Expense voucher payment to ${newVoucher.supplierOrPayee}: ${newVoucher.category}`,
        lines: [
          { accountCode: expenseAccountCode, debit: numAmount, credit: 0 },
          { accountCode: paymentAccountCode, debit: 0, credit: numAmount }
        ]
      }, user);
    } else if (paymentStatus === 'Unpaid') {
      // Record Accounts Payable liability
      let expenseAccountCode = '5200';
      if (category.toLowerCase().includes('lab')) expenseAccountCode = '5100';

      this.createJournalEntry(tData, {
        date: newVoucher.expenseDate,
        reference: newVoucher.voucherNumber,
        source: 'EXPENSE',
        memo: `Supplier invoice logged from ${newVoucher.supplierOrPayee} (AP)`,
        lines: [
          { accountCode: expenseAccountCode, debit: numAmount, credit: 0 },
          { accountCode: '2010', accountName: 'Accounts Payable (AP) - Labs & Suppliers', debit: 0, credit: numAmount }
        ]
      }, user);
    }

    return newVoucher;
  }

  static updateExpenseVoucherStatus(tData, voucherId, { paymentStatus, approvalStatus, notes }, user) {
    this.ensureTenantAccounting(tData);
    const voucher = tData.expenseVouchers.find(v => v.id === voucherId);
    if (!voucher) throw new Error(`Voucher "${voucherId}" not found.`);

    const oldPaymentStatus = voucher.paymentStatus;
    const now = new Date().toISOString();

    if (approvalStatus) {
      voucher.approvalStatus = approvalStatus;
      if (approvalStatus === 'Approved') {
        voucher.approvedBy = user?.name || 'Dr. Mukesh Kushwaha';
        voucher.approvedAt = now;
      }
    }

    if (paymentStatus) {
      voucher.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        voucher.paidAmount = voucher.amount;
        voucher.paidAt = now;

        // If newly paid from unpaid, post settlement journal entry
        if (oldPaymentStatus !== 'Paid') {
          const paymentAccountCode = voucher.paymentMethod?.toLowerCase().includes('cash') ? '1010' : '1020';
          this.createJournalEntry(tData, {
            date: now.split('T')[0],
            reference: voucher.voucherNumber,
            source: 'EXPENSE',
            memo: `Supplier AP payment settlement to ${voucher.supplierOrPayee}`,
            lines: [
              { accountCode: '2010', accountName: 'Accounts Payable (AP) - Labs & Suppliers', debit: voucher.amount, credit: 0 },
              { accountCode: paymentAccountCode, debit: 0, credit: voucher.amount }
            ]
          }, user);
        }
      }
    }

    if (notes) voucher.notes = `${voucher.notes ? voucher.notes + ' | ' : ''}${notes.trim()}`;
    voucher.updatedAt = now;

    return voucher;
  }

  // ==========================================================================
  // 5. ADVANCE DEPOSITS & PATIENT CREDIT WALLET
  // ==========================================================================

  static getAdvanceDeposits(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    let deposits = [...(tData.advanceDeposits || [])];
    if (query.patientId) deposits = deposits.filter(d => d.patientId === query.patientId);
    return deposits.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  static createAdvanceDeposit(tData, data, user) {
    this.ensureTenantAccounting(tData);

    const { patientId, amount, paymentMethod = 'Bank Transfer', notes = '' } = data;
    if (!patientId) throw new Error('Patient ID is required.');
    if (!amount || Number(amount) <= 0) throw new Error('Valid deposit amount greater than 0 is required.');

    const patient = (tData.patients || []).find(p => p.id === patientId);
    if (!patient) throw new Error(`Patient "${patientId}" not found.`);

    const numAmount = Number(amount);
    const now = new Date().toISOString();
    const depositNumber = `DEP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const receiptNumber = `RCP-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const newDeposit = {
      id: depositNumber,
      depositNumber,
      patientId: patient.id,
      patientName: patient.name,
      date: now,
      amount: numAmount,
      balanceRemaining: numAmount,
      paymentMethod,
      receiptNumber,
      notes: notes.trim(),
      createdBy: user?.name || 'Staff',
      createdAt: now
    };

    tData.advanceDeposits.unshift(newDeposit);

    // Update patient advance credit balance
    patient.advanceCreditBalance = (patient.advanceCreditBalance || 0) + numAmount;

    // Issue unique official receipt
    this.createReceipt(tData, {
      receiptNumber,
      patientId: patient.id,
      patientName: patient.name,
      depositId: newDeposit.id,
      date: now.split('T')[0],
      amount: numAmount,
      paymentMethod,
      paymentType: 'ADVANCE_DEPOSIT',
      refNumber: `TXN-${newDeposit.depositNumber}`,
      notes: `Advance deposit recorded for ${patient.name}`
    }, user);

    // Double Entry: Debit Cash/Bank/Clearing, Credit Patient Advance Deposits (2100)
    const debitAccount = paymentMethod.toLowerCase().includes('cash') ? '1010' : paymentMethod.toLowerCase().includes('qr') || paymentMethod.toLowerCase().includes('fonepay') ? '1030' : '1020';

    this.createJournalEntry(tData, {
      date: now,
      reference: receiptNumber,
      source: 'ADVANCE_DEPOSIT',
      memo: `Patient advance deposit received from ${patient.name} (${paymentMethod})`,
      lines: [
        { accountCode: debitAccount, debit: numAmount, credit: 0 },
        { accountCode: '2100', accountName: 'Patient Advance Deposits & Credit Balances', debit: 0, credit: numAmount }
      ]
    }, user);

    return newDeposit;
  }

  static applyAdvanceDeposit(tData, depositId, invoiceId, applyAmount, user) {
    this.ensureTenantAccounting(tData);

    const deposit = tData.advanceDeposits.find(d => d.id === depositId);
    if (!deposit) throw new Error(`Deposit "${depositId}" not found.`);

    const patient = (tData.patients || []).find(p => p.id === deposit.patientId);
    if (!patient) throw new Error(`Patient "${deposit.patientId}" not found.`);

    const invoice = (patient.invoices || []).find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
    if (!invoice) throw new Error(`Invoice "${invoiceId}" not found.`);

    const numApply = Number(applyAmount);
    if (numApply <= 0 || numApply > deposit.balanceRemaining) {
      throw new Error(`Invalid apply amount. Maximum available in this deposit: ${deposit.balanceRemaining}`);
    }

    const currentInvoiceBalance = Math.max(0, (invoice.total || 0) - (invoice.paid || 0));
    if (numApply > currentInvoiceBalance) {
      throw new Error(`Apply amount (${numApply}) exceeds invoice balance (${currentInvoiceBalance}).`);
    }

    deposit.balanceRemaining -= numApply;
    patient.advanceCreditBalance = Math.max(0, (patient.advanceCreditBalance || 0) - numApply);

    // Update invoice payment record
    invoice.paid = (invoice.paid || 0) + numApply;
    invoice.balance = Math.max(0, (invoice.total || 0) - invoice.paid);
    invoice.status = invoice.balance === 0 ? 'Paid' : 'Partial';

    // Post double entry: Debit Patient Advance Deposits (2100), Credit Accounts Receivable (1100)
    this.createJournalEntry(tData, {
      date: new Date().toISOString(),
      reference: invoice.invoiceNumber || invoice.id,
      source: 'ADVANCE_DEPOSIT',
      memo: `Applied advance credit deposit ${deposit.depositNumber} to invoice ${invoice.invoiceNumber}`,
      lines: [
        { accountCode: '2100', accountName: 'Patient Advance Deposits & Credit Balances', debit: numApply, credit: 0 },
        { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: numApply }
      ]
    }, user);

    return {
      success: true,
      appliedAmount: numApply,
      remainingDeposit: deposit.balanceRemaining,
      invoiceBalance: invoice.balance
    };
  }

  // ==========================================================================
  // 6. CREDIT NOTES & APPROVED POST-INVOICE ADJUSTMENTS
  // ==========================================================================

  static getCreditNotes(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    let cns = [...(tData.creditNotes || [])];
    if (query.patientId) cns = cns.filter(c => c.patientId === query.patientId);
    return cns.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  static createCreditNote(tData, data, user) {
    this.ensureTenantAccounting(tData);

    const { patientId, invoiceId, amount, reason } = data;
    if (!patientId) throw new Error('Patient ID is required.');
    if (!reason || !reason.trim()) throw new Error('Authorized reason is required for issuing a credit note.');
    if (!amount || Number(amount) <= 0) throw new Error('Valid credit note amount greater than 0 is required.');

    const patient = (tData.patients || []).find(p => p.id === patientId);
    if (!patient) throw new Error(`Patient "${patientId}" not found.`);

    const numAmount = Number(amount);
    const now = new Date().toISOString();
    const creditNoteNumber = `CN-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newCN = {
      id: creditNoteNumber,
      creditNoteNumber,
      patientId: patient.id,
      patientName: patient.name,
      invoiceId: invoiceId || null,
      date: now,
      amount: numAmount,
      reason: reason.trim(),
      approvedBy: user?.name || 'Dr. Mukesh Kushwaha',
      createdAt: now
    };

    tData.creditNotes.unshift(newCN);

    // If linked to an invoice, adjust balance without erasing historical invoice record
    if (invoiceId) {
      const inv = (patient.invoices || []).find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (inv) {
        inv.discount = (Number(inv.discount) || 0) + numAmount;
        inv.total = Math.max(0, (inv.total || 0) - numAmount);
        inv.balance = Math.max(0, (inv.total || 0) - (inv.paid || 0));
        inv.status = inv.balance === 0 ? 'Paid' : inv.paid > 0 ? 'Partial' : 'Unpaid';
      }
    }

    // Double Entry: Debit Discounts & Adjustments (5700), Credit Accounts Receivable (1100)
    const je = this.createJournalEntry(tData, {
      date: now,
      reference: creditNoteNumber,
      source: 'CREDIT_NOTE',
      memo: `Credit note ${creditNoteNumber} issued to ${patient.name}: ${reason.trim()}`,
      lines: [
        { accountCode: '5700', accountName: 'Approved Patient Discounts & Adjustments', debit: numAmount, credit: 0 },
        { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: numAmount }
      ]
    }, user);

    newCN.journalEntryId = je.id;
    return newCN;
  }

  // ==========================================================================
  // 7. RECEIPTS GENERATOR
  // ==========================================================================

  static getReceipts(tData, query = {}) {
    this.ensureTenantAccounting(tData);
    let receipts = [...(tData.receipts || [])];
    if (query.patientId) receipts = receipts.filter(r => r.patientId === query.patientId);
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      receipts = receipts.filter(r =>
        r.receiptNumber?.toLowerCase().includes(q) ||
        r.patientName?.toLowerCase().includes(q) ||
        r.refNumber?.toLowerCase().includes(q)
      );
    }
    return receipts.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  static createReceipt(tData, data, user) {
    this.ensureTenantAccounting(tData);

    const { patientId, patientName, invoiceId, depositId, date, amount, paymentMethod = 'Cash', paymentType = 'INVOICE_PAYMENT', refNumber, notes = '' } = data;
    const numAmount = Number(amount);
    const now = new Date().toISOString();
    const receiptNumber = data.receiptNumber || `RCP-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const newReceipt = {
      id: receiptNumber,
      receiptNumber,
      patientId: patientId || null,
      patientName: patientName || 'Patient',
      invoiceId: invoiceId || null,
      depositId: depositId || null,
      date: date || now.split('T')[0],
      amount: numAmount,
      paymentMethod,
      paymentType,
      refNumber: refNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: notes.trim(),
      issuedBy: user?.name || 'Sita Thapa (Front Desk)',
      createdAt: now
    };

    tData.receipts.unshift(newReceipt);
    return newReceipt;
  }

  // ==========================================================================
  // 8. BANK & CASH RECONCILIATION
  // ==========================================================================

  static getBankReconciliations(tData) {
    this.ensureTenantAccounting(tData);
    return tData.bankReconciliations || [];
  }

  static createBankReconciliation(tData, data, user) {
    this.ensureTenantAccounting(tData);

    const { accountCode, statementDate, statementBalance, bookBalance, clearedItemsCount = 0, notes = '' } = data;
    if (!accountCode) throw new Error('Account code is required.');
    if (statementBalance === undefined) throw new Error('Bank statement ending balance is required.');

    const numStatement = Number(statementBalance);
    const numBook = Number(bookBalance);
    const diff = Math.abs(numStatement - numBook);
    const now = new Date().toISOString();
    const id = `REC-2026-${String(Math.floor(100 + Math.random() * 900))}`;

    const acc = tData.chartOfAccounts.find(a => a.code === accountCode);

    const newRec = {
      id,
      accountCode,
      accountName: acc?.name || `Account ${accountCode}`,
      statementDate: statementDate || now.split('T')[0],
      statementBalance: numStatement,
      bookBalance: numBook,
      clearedBalance: numBook,
      clearedItemsCount: Number(clearedItemsCount) || 0,
      difference: diff,
      status: diff < 0.05 ? 'Reconciled' : 'Discrepancy',
      notes: notes.trim(),
      reconciledBy: user?.name || 'Dr. Mukesh Kushwaha',
      reconciledAt: now
    };

    tData.bankReconciliations.unshift(newRec);
    return newRec;
  }

  // ==========================================================================
  // 9. TAX CONFIGURATION
  // ==========================================================================

  static getTaxConfig(tData) {
    this.ensureTenantAccounting(tData);
    return tData.taxConfig || DEFAULT_TAX_CONFIG;
  }

  static updateTaxConfig(tData, updates, user) {
    this.ensureTenantAccounting(tData);
    tData.taxConfig = {
      ...tData.taxConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Clinic Admin'
    };
    return tData.taxConfig;
  }

  // ==========================================================================
  // 10. ACCOUNTING REPORTS (7 Standard Reports)
  // ==========================================================================

  /**
   * 1. Daily Cash Report
   */
  static getDailyCashReport(tData, date) {
    this.ensureTenantAccounting(tData);
    const targetDate = date || new Date().toISOString().split('T')[0];

    const receipts = (tData.receipts || []).filter(r => (r.date || '').startsWith(targetDate) && r.paymentMethod?.toLowerCase() === 'cash');
    const cashExpenses = (tData.expenseVouchers || []).filter(v => (v.expenseDate || '').startsWith(targetDate) && v.paymentMethod?.toLowerCase() === 'cash' && v.paymentStatus === 'Paid');

    const totalCashIn = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalCashOut = cashExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const openingCash = 10000; // Standard counter drawer float
    const expectedClosing = openingCash + totalCashIn - totalCashOut;

    return {
      reportName: 'Daily Cash Report',
      date: targetDate,
      openingCash,
      totalCashIn,
      totalCashOut,
      expectedClosing,
      receipts,
      cashExpenses
    };
  }

  /**
   * 2. Income and Expense Statement
   */
  static getIncomeExpenseReport(tData, startDate, endDate) {
    this.ensureTenantAccounting(tData);
    const sDate = startDate ? new Date(startDate).getTime() : 0;
    const eDate = endDate ? new Date(endDate).getTime() : Date.now();

    const incomeCategories = {
      'Dental Treatment & Procedures': 0,
      'Consultation & Registration Fees': 0,
      'Pharmacy & Medication Sales': 0,
      'Dental Lab Markup & Appliances': 0,
      'Other Clinic Income': 0
    };

    const expenseCategories = {
      'Staff Salaries & Wages': 0,
      'Dental Materials & Consumables': 0,
      'Dental Laboratory Charges': 0,
      'Clinic Facility Rent & Lease': 0,
      'Electricity, Water & Utilities': 0,
      'Equipment Maintenance & Servicing': 0,
      'Office Administration & Miscellaneous': 0,
      'Approved Patient Discounts & Adjustments': 0
    };

    // Aggregate from Journal Entries for exact double-entry veracity
    (tData.journalEntries || []).forEach(je => {
      const jeTime = new Date(je.date || je.createdAt).getTime();
      if (jeTime >= sDate && jeTime <= eDate && je.status === 'POSTED') {
        (je.lines || []).forEach(l => {
          const code = l.accountCode;
          const debit = Number(l.debit) || 0;
          const credit = Number(l.credit) || 0;

          // Revenues (Credit normal)
          if (code === '4010') incomeCategories['Dental Treatment & Procedures'] += (credit - debit);
          else if (code === '4020') incomeCategories['Consultation & Registration Fees'] += (credit - debit);
          else if (code === '4030') incomeCategories['Pharmacy & Medication Sales'] += (credit - debit);
          else if (code === '4040') incomeCategories['Dental Lab Markup & Appliances'] += (credit - debit);
          else if (code === '4090') incomeCategories['Other Clinic Income'] += (credit - debit);

          // Expenses (Debit normal)
          else if (code === '5010') expenseCategories['Staff Salaries & Wages'] += (debit - credit);
          else if (code === '5100') expenseCategories['Dental Laboratory Charges'] += (debit - credit);
          else if (code === '5200') expenseCategories['Dental Materials & Consumables'] += (debit - credit);
          else if (code === '5300') expenseCategories['Clinic Facility Rent & Lease'] += (debit - credit);
          else if (code === '5400') expenseCategories['Electricity, Water & Utilities'] += (debit - credit);
          else if (code === '5500') expenseCategories['Equipment Maintenance & Servicing'] += (debit - credit);
          else if (code === '5600') expenseCategories['Office Administration & Miscellaneous'] += (debit - credit);
          else if (code === '5700') expenseCategories['Approved Patient Discounts & Adjustments'] += (debit - credit);
        });
      }
    });

    const totalIncome = Object.values(incomeCategories).reduce((s, v) => s + Math.max(0, v), 0);
    const totalExpense = Object.values(expenseCategories).reduce((s, v) => s + Math.max(0, v), 0);
    const netSurplus = totalIncome - totalExpense;
    const operatingMarginPercent = totalIncome > 0 ? ((netSurplus / totalIncome) * 100).toFixed(1) : 0;

    return {
      reportName: 'Income and Expense Statement',
      period: { startDate, endDate },
      incomeCategories,
      expenseCategories,
      totalIncome,
      totalExpense,
      netSurplus,
      operatingMarginPercent
    };
  }

  /**
   * 3. Profit and Loss (P&L) Report
   */
  static getProfitLossReport(tData, startDate, endDate) {
    const incExp = this.getIncomeExpenseReport(tData, startDate, endDate);
    const taxConfig = this.getTaxConfig(tData);

    const grossRevenue = incExp.totalIncome;
    const discounts = incExp.expenseCategories['Approved Patient Discounts & Adjustments'] || 0;
    const netRevenue = grossRevenue - discounts;

    // Cost of Goods Sold (COGS)
    const cogs = (incExp.expenseCategories['Dental Laboratory Charges'] || 0) + (incExp.expenseCategories['Dental Materials & Consumables'] || 0);
    const grossProfit = netRevenue - cogs;
    const grossMarginPercent = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : 0;

    // Operating Expenses (excluding direct COGS and discounts)
    const opex =
      (incExp.expenseCategories['Staff Salaries & Wages'] || 0) +
      (incExp.expenseCategories['Clinic Facility Rent & Lease'] || 0) +
      (incExp.expenseCategories['Electricity, Water & Utilities'] || 0) +
      (incExp.expenseCategories['Equipment Maintenance & Servicing'] || 0) +
      (incExp.expenseCategories['Office Administration & Miscellaneous'] || 0);

    const operatingIncome = grossProfit - opex;
    const depreciationReserve = 12500; // Estimated equipment depreciation
    const netProfitBeforeTax = operatingIncome - depreciationReserve;
    const estimatedTax = netProfitBeforeTax > 0 && taxConfig.isTaxEnabled ? Math.round(netProfitBeforeTax * (taxConfig.taxRate / 100)) : 0;
    const netProfitAfterTax = netProfitBeforeTax - estimatedTax;
    const netMarginPercent = netRevenue > 0 ? ((netProfitAfterTax / netRevenue) * 100).toFixed(1) : 0;

    return {
      reportName: 'Profit and Loss Statement (P&L)',
      period: { startDate, endDate },
      grossRevenue,
      discounts,
      netRevenue,
      cogs,
      grossProfit,
      grossMarginPercent,
      opex,
      operatingIncome,
      depreciationReserve,
      netProfitBeforeTax,
      estimatedTax,
      netProfitAfterTax,
      netMarginPercent,
      breakdown: incExp
    };
  }

  /**
   * 4. Outstanding Receivables & Patient Aging Report
   */
  static getArAgingReport(tData) {
    this.ensureTenantAccounting(tData);
    const patients = tData.patients || [];
    const now = Date.now();

    const buckets = {
      current: { label: 'Current (0-30 days)', total: 0, count: 0, patients: [] },
      thirtyToSixty: { label: '31-60 days past due', total: 0, count: 0, patients: [] },
      sixtyToNinety: { label: '61-90 days past due', total: 0, count: 0, patients: [] },
      overNinety: { label: '90+ days past due', total: 0, count: 0, patients: [] }
    };

    let totalReceivables = 0;

    patients.forEach(p => {
      let ptTotalInvoiced = 0;
      let ptTotalPaid = 0;

      (p.invoices || []).forEach(inv => {
        ptTotalInvoiced += (Number(inv.total) || 0);
        ptTotalPaid += (Number(inv.paid) || 0);
      });

      const ptBalance = Math.max(0, ptTotalInvoiced - ptTotalPaid);
      if (ptBalance > 0) {
        totalReceivables += ptBalance;

        // Determine oldest unpaid invoice age
        const unpaidInvoices = (p.invoices || []).filter(inv => ((Number(inv.total) || 0) - (Number(inv.paid) || 0)) > 0);
        const oldestInv = unpaidInvoices[unpaidInvoices.length - 1];
        const invDate = oldestInv ? new Date(oldestInv.date || oldestInv.createdAt).getTime() : now;
        const daysPast = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));

        let bucketKey = 'current';
        if (daysPast > 90) bucketKey = 'overNinety';
        else if (daysPast > 60) bucketKey = 'sixtyToNinety';
        else if (daysPast > 30) bucketKey = 'thirtyToSixty';

        buckets[bucketKey].total += ptBalance;
        buckets[bucketKey].count += 1;
        buckets[bucketKey].patients.push({
          patientId: p.id,
          name: p.name,
          phone: p.phone || 'N/A',
          totalBilled: ptTotalInvoiced,
          totalPaid: ptTotalPaid,
          outstandingBalance: ptBalance,
          daysPast,
          lastPaymentDate: (p.invoices || [])[0]?.date || 'None'
        });
      }
    });

    return {
      reportName: 'Accounts Receivable (AR) & Patient Aging Report',
      totalReceivables,
      buckets
    };
  }

  /**
   * 5. Payment Method Summary
   */
  static getPaymentMethodSummaryReport(tData, startDate, endDate) {
    this.ensureTenantAccounting(tData);
    const sDate = startDate ? new Date(startDate).getTime() : 0;
    const eDate = endDate ? new Date(endDate).getTime() : Date.now();

    const methods = {
      'Cash': { total: 0, count: 0 },
      'Card / POS': { total: 0, count: 0 },
      'Bank Transfer': { total: 0, count: 0 },
      'FonePay / QR': { total: 0, count: 0 },
      'Digital Wallets (eSewa/Khalti)': { total: 0, count: 0 }
    };

    (tData.receipts || []).forEach(r => {
      const rTime = new Date(r.date || r.createdAt).getTime();
      if (rTime >= sDate && rTime <= eDate) {
        const amt = Number(r.amount) || 0;
        const pm = (r.paymentMethod || '').toLowerCase();

        if (pm.includes('cash')) {
          methods['Cash'].total += amt;
          methods['Cash'].count += 1;
        } else if (pm.includes('card') || pm.includes('pos')) {
          methods['Card / POS'].total += amt;
          methods['Card / POS'].count += 1;
        } else if (pm.includes('bank') || pm.includes('nabil') || pm.includes('wire')) {
          methods['Bank Transfer'].total += amt;
          methods['Bank Transfer'].count += 1;
        } else if (pm.includes('fonepay') || pm.includes('qr')) {
          methods['FonePay / QR'].total += amt;
          methods['FonePay / QR'].count += 1;
        } else {
          methods['Digital Wallets (eSewa/Khalti)'].total += amt;
          methods['Digital Wallets (eSewa/Khalti)'].count += 1;
        }
      }
    });

    const totalCollected = Object.values(methods).reduce((s, m) => s + m.total, 0);

    const summary = Object.entries(methods).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count,
      percentage: totalCollected > 0 ? ((data.total / totalCollected) * 100).toFixed(1) : 0,
      averageTicket: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));

    return {
      reportName: 'Payment Method Collections Summary',
      period: { startDate, endDate },
      totalCollected,
      summary
    };
  }

  /**
   * 6. Tax Report with Configurable Rules
   */
  static getTaxReport(tData, startDate, endDate) {
    this.ensureTenantAccounting(tData);
    const taxConfig = this.getTaxConfig(tData);
    const incExp = this.getIncomeExpenseReport(tData, startDate, endDate);

    const taxableSales =
      (incExp.incomeCategories['Dental Treatment & Procedures'] || 0) +
      (incExp.incomeCategories['Pharmacy & Medication Sales'] || 0) +
      (incExp.incomeCategories['Dental Lab Markup & Appliances'] || 0);

    const exemptSales = (incExp.incomeCategories['Consultation & Registration Fees'] || 0);
    const outputTaxCollected = Math.round(taxableSales * (taxConfig.taxRate / 100));

    // Input Tax on purchases (Dental materials & lab charges)
    const taxablePurchases =
      (incExp.expenseCategories['Dental Laboratory Charges'] || 0) +
      (incExp.expenseCategories['Dental Materials & Consumables'] || 0);

    const inputTaxPaid = Math.round(taxablePurchases * (taxConfig.taxRate / 100));
    const netTaxPayable = outputTaxCollected - inputTaxPaid;

    return {
      reportName: 'Tax & VAT Compliance Report',
      period: { startDate, endDate },
      taxConfig,
      taxableSales,
      exemptSales,
      outputTaxCollected,
      taxablePurchases,
      inputTaxPaid,
      netTaxPayable
    };
  }

  /**
   * 7. Cash Flow Summary
   */
  static getCashFlowReport(tData, startDate, endDate) {
    this.ensureTenantAccounting(tData);
    const pmSummary = this.getPaymentMethodSummaryReport(tData, startDate, endDate);
    const incExp = this.getIncomeExpenseReport(tData, startDate, endDate);

    // Operating Activities
    const cashInflowsFromPatients = pmSummary.totalCollected;
    const cashPaidForSalaries = incExp.expenseCategories['Staff Salaries & Wages'] || 0;
    const cashPaidForMaterialsAndLab = (incExp.expenseCategories['Dental Laboratory Charges'] || 0) + (incExp.expenseCategories['Dental Materials & Consumables'] || 0);
    const cashPaidForRentAndUtilities = (incExp.expenseCategories['Clinic Facility Rent & Lease'] || 0) + (incExp.expenseCategories['Electricity, Water & Utilities'] || 0);
    const cashPaidForAdmin = incExp.expenseCategories['Office Administration & Miscellaneous'] || 0;

    const netOperatingCashFlow = cashInflowsFromPatients - (cashPaidForSalaries + cashPaidForMaterialsAndLab + cashPaidForRentAndUtilities + cashPaidForAdmin);

    // Investing Activities
    const equipmentPurchaseOutflow = 0;
    const netInvestingCashFlow = -equipmentPurchaseOutflow;

    // Financing Activities
    const ownerDrawingsOrCapital = 0;
    const netFinancingCashFlow = ownerDrawingsOrCapital;

    const netCashChange = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
    const openingCashAndBank = 271500;
    const closingCashAndBank = openingCashAndBank + netCashChange;

    return {
      reportName: 'Statement of Cash Flows',
      period: { startDate, endDate },
      operatingActivities: {
        cashInflowsFromPatients,
        cashPaidForSalaries,
        cashPaidForMaterialsAndLab,
        cashPaidForRentAndUtilities,
        cashPaidForAdmin,
        netOperatingCashFlow
      },
      investingActivities: {
        equipmentPurchaseOutflow,
        netInvestingCashFlow
      },
      financingActivities: {
        ownerDrawingsOrCapital,
        netFinancingCashFlow
      },
      netCashChange,
      openingCashAndBank,
      closingCashAndBank
    };
  }

  // ==========================================================================
  // 11. EXCEL / CSV REPORT EXPORTER
  // ==========================================================================

  static exportReportCsv(tData, reportType, query = {}) {
    this.ensureTenantAccounting(tData);

    if (reportType === 'daily-cash') {
      const rep = this.getDailyCashReport(tData, query.date);
      const rows = [
        'Apex Dental Clinic - Daily Cash Report',
        `Date: ${rep.date}`,
        `Opening Cash Drawer Float: ${rep.openingCash}`,
        `Total Cash Inflows: ${rep.totalCashIn}`,
        `Total Cash Outflows: ${rep.totalCashOut}`,
        `Expected Closing Drawer Cash: ${rep.expectedClosing}`,
        '',
        '--- CASH INFLOWS (RECEIPTS) ---',
        'Receipt No,Patient,Amount,Type,Ref No,Issued By'
      ];
      rep.receipts.forEach(r => {
        rows.push(`"${r.receiptNumber}","${r.patientName}",${r.amount},"${r.paymentType}","${r.refNumber}","${r.issuedBy}"`);
      });
      rows.push('');
      rows.push('--- CASH OUTFLOWS (EXPENSES) ---');
      rows.push('Voucher No,Payee,Category,Amount,Notes');
      rep.cashExpenses.forEach(e => {
        rows.push(`"${e.voucherNumber}","${e.supplierOrPayee}","${e.category}",${e.amount},"${(e.notes || '').replace(/"/g, '""')}"`);
      });
      return rows.join('\n');
    }

    if (reportType === 'profit-loss') {
      const rep = this.getProfitLossReport(tData, query.startDate, query.endDate);
      const rows = [
        'Apex Dental Clinic - Profit and Loss Statement (P&L)',
        `Period: ${query.startDate || 'Beginning'} to ${query.endDate || 'Current'}`,
        '',
        'Category,Amount',
        `Gross Treatment & Clinic Revenue,${rep.grossRevenue}`,
        `Less: Approved Discounts & Adjustments,${rep.discounts}`,
        `Net Revenue,${rep.netRevenue}`,
        `Cost of Goods Sold (Materials & Lab),${rep.cogs}`,
        `Gross Profit,${rep.grossProfit}`,
        `Gross Margin %,${rep.grossMarginPercent}%`,
        `Operating Expenses (Salaries Rent Utilities),${rep.opex}`,
        `Operating Profit (EBITDA),${rep.operatingIncome}`,
        `Depreciation & Equipment Reserve,${rep.depreciationReserve}`,
        `Net Profit Before Tax,${rep.netProfitBeforeTax}`,
        `Tax Provision (VAT/Income),${rep.estimatedTax}`,
        `Net Profit After Tax,${rep.netProfitAfterTax}`,
        `Net Profit Margin %,${rep.netMarginPercent}%`
      ];
      return rows.join('\n');
    }

    if (reportType === 'ar-aging') {
      const rep = this.getArAgingReport(tData);
      const rows = [
        'Apex Dental Clinic - Accounts Receivable & Patient Aging Report',
        `Total Outstanding Receivables: ${rep.totalReceivables}`,
        '',
        'Aging Bucket,Patient ID,Patient Name,Phone,Total Billed,Total Paid,Outstanding Balance,Days Overdue,Last Payment Date'
      ];
      Object.entries(rep.buckets).forEach(([, b]) => {
        b.patients.forEach(p => {
          rows.push(`"${b.label}","${p.patientId}","${p.name}","${p.phone}",${p.totalBilled},${p.totalPaid},${p.outstandingBalance},${p.daysPast},"${p.lastPaymentDate}"`);
        });
      });
      return rows.join('\n');
    }

    if (reportType === 'journal-entries') {
      const rows = ['Entry ID,Date,Reference,Source,Memo,Status,Account Code,Account Name,Debit,Credit,Reversal Of'];
      (tData.journalEntries || []).forEach(je => {
        (je.lines || []).forEach(l => {
          rows.push(`"${je.id}","${je.date}","${je.reference}","${je.source}","${(je.memo || '').replace(/"/g, '""')}","${je.status}","${l.accountCode}","${l.accountName}",${l.debit},${l.credit},"${je.reversalOf || ''}"`);
        });
      });
      return rows.join('\n');
    }

    // Default to general transactions
    const rows = ['Receipt No,Date,Patient Name,Amount,Payment Method,Payment Type,Ref No,Issued By'];
    (tData.receipts || []).forEach(r => {
      rows.push(`"${r.receiptNumber}","${r.date}","${r.patientName}",${r.amount},"${r.paymentMethod}","${r.paymentType}","${r.refNumber}","${r.issuedBy}"`);
    });
    return rows.join('\n');
  }
}

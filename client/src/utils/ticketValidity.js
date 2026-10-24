/**
 * Patient Ticket Charge & Revisit Validity Window Business Logic
 *
 * Rules:
 * - First Visit / Expired Visit: Standard ticket charge is billed.
 * - Revisit within Validity Window: Fee is waived ($0.00 / Free Revisit).
 * - Revisit after Validity Window: New ticket charge billed, resetting validity cycle.
 */

export function assessTicketValidity(patient, clinicProfile = {}, currentDate = new Date()) {
  const enabled = clinicProfile.enableTicketCharge !== false;
  const ticketFee = Number(clinicProfile.ticketFee !== undefined ? clinicProfile.ticketFee : 200);
  const validityDays = Number(clinicProfile.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7);
  const currency = clinicProfile.currency || 'Rs.';
  const ticketName = clinicProfile.ticketName || 'Registration & OPD Consultation Fee';

  if (!enabled) {
    return {
      enabled: false,
      status: 'DISABLED',
      fee: 0,
      standardFee: 0,
      isWaived: false,
      validityDays,
      ticketName,
      message: 'Ticket charges are disabled in Clinic Settings.',
      badgeText: 'Ticket Disabled',
      badgeColor: 'gray'
    };
  }

  // Find the latest valid or billed ticket date
  let lastTicketDateStr = patient?.lastTicketDate || null;

  // If not directly on patient, scan past invoices for any ticket line items
  if (!lastTicketDateStr && Array.isArray(patient?.invoices)) {
    for (const inv of patient.invoices) {
      if (inv.status === 'Cancelled') continue;
      const hasTicket = (inv.items || []).some(item => 
        item.isTicket === true ||
        (item.description && item.description.toLowerCase().includes('ticket')) ||
        (item.description && item.description.toLowerCase().includes('registration & opd'))
      );
      if (hasTicket && inv.date) {
        if (!lastTicketDateStr || new Date(inv.date) > new Date(lastTicketDateStr)) {
          lastTicketDateStr = inv.date;
        }
      }
    }
  }

  // Scenario 1: First Visit (No previous ticket recorded)
  if (!lastTicketDateStr) {
    const validUntilDate = new Date(currentDate);
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    return {
      enabled: true,
      status: 'FIRST_VISIT',
      fee: ticketFee,
      standardFee: ticketFee,
      isWaived: false,
      lastTicketDate: null,
      validUntil: validUntilStr,
      validityDays,
      daysElapsed: null,
      daysRemaining: validityDays,
      ticketName,
      message: `First Visit: Standard registration & OPD ticket of ${currency} ${ticketFee} applies (valid for ${validityDays} days).`,
      badgeText: `Ticket: ${currency} ${ticketFee}`,
      badgeColor: 'blue'
    };
  }

  // Calculate elapsed days
  const lastTicket = new Date(lastTicketDateStr);
  const now = new Date(currentDate);
  const utc1 = Date.UTC(lastTicket.getFullYear(), lastTicket.getMonth(), lastTicket.getDate());
  const utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

  const validUntilDate = new Date(lastTicket);
  validUntilDate.setDate(validUntilDate.getDate() + validityDays);
  const validUntilStr = validUntilDate.toISOString().split('T')[0];

  // Scenario 2: Revisit within Validity Window (<= N days)
  if (diffDays <= validityDays) {
    const daysRemaining = Math.max(0, validityDays - diffDays);
    return {
      enabled: true,
      status: 'VALID_REVISIT',
      fee: 0,
      standardFee: ticketFee,
      isWaived: true,
      lastTicketDate: lastTicketDateStr,
      validUntil: validUntilStr,
      validityDays,
      daysElapsed: diffDays,
      daysRemaining,
      ticketName,
      message: `Revisit within validity window (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining until ${validUntilStr}): Ticket fee waived (Rs. 0.00 / Free Revisit).`,
      badgeText: `Free Revisit (${daysRemaining}d left)`,
      badgeColor: 'emerald'
    };
  }

  // Scenario 3: Revisit after Validity Window (> N days)
  const expiredDaysAgo = diffDays - validityDays;
  const nextValidUntilDate = new Date(currentDate);
  nextValidUntilDate.setDate(nextValidUntilDate.getDate() + validityDays);
  const nextValidUntilStr = nextValidUntilDate.toISOString().split('T')[0];

  return {
    enabled: true,
    status: 'EXPIRED',
    fee: ticketFee,
    standardFee: ticketFee,
    isWaived: false,
    lastTicketDate: lastTicketDateStr,
    validUntil: nextValidUntilStr,
    previousValidUntil: validUntilStr,
    validityDays,
    daysElapsed: diffDays,
    expiredDaysAgo,
    ticketName,
    message: `Ticket expired ${expiredDaysAgo} day${expiredDaysAgo === 1 ? '' : 's'} ago (> ${validityDays} days validity). New ticket of ${currency} ${ticketFee} applies (resets validity for ${validityDays} days).`,
    badgeText: `Ticket Expired (${currency} ${ticketFee})`,
    badgeColor: 'amber'
  };
}

/**
 * Creates an invoice line item object based on assessed ticket validity
 */
export function createTicketInvoiceItem(statusInfo, clinicProfile = {}) {
  const fee = statusInfo.fee || 0;
  const isWaived = statusInfo.isWaived || false;
  const desc = statusInfo.isWaived
    ? `${statusInfo.ticketName || 'Registration & OPD Consultation'} (Free Revisit - Waived)`
    : (statusInfo.ticketName || 'Registration & OPD Consultation Fee');

  return {
    description: desc,
    tooth: 'General Consultation',
    qty: 1,
    unitPrice: fee,
    total: fee,
    isTicket: true,
    isWaived: isWaived,
    ticketStatus: statusInfo.status
  };
}

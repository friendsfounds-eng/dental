/**
 * WhatsApp Auto Link & Messaging Utilities
 * Formats Nepal mobile numbers (+977) and builds universal wa.me auto links
 */

export const formatNepalWhatsAppPhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/[^0-9]/g, '');

  // If standard Nepal 10-digit mobile starting with 98, 97, 96
  if (digits.length === 10 && (digits.startsWith('98') || digits.startsWith('97') || digits.startsWith('96'))) {
    digits = '977' + digits;
  }
  // If 11 digits starting with 098 or 097
  else if (digits.length === 11 && (digits.startsWith('098') || digits.startsWith('097'))) {
    digits = '977' + digits.substring(1);
  }
  // If 00977...
  else if (digits.startsWith('00977')) {
    digits = digits.substring(2);
  }

  return digits;
};

export const generateWhatsAppAutoLink = (phone, message = '') => {
  const cleanPhone = formatNepalWhatsAppPhone(phone);
  if (!cleanPhone) return '';
  const encoded = encodeURIComponent(message || '');
  return `https://wa.me/${cleanPhone}${encoded ? `?text=${encoded}` : ''}`;
};

export const generateClientPortalLink = (patientId, clinicProfile = {}) => {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://apexdental.com.np';
  return `${origin}/?patientId=${patientId || 'PT-1001'}`;
};

export const openWhatsAppAutoLink = (phone, message = '') => {
  const url = generateWhatsAppAutoLink(phone, message);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

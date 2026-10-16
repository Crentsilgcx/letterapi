// Ghanaian mobile phone prefixes (valid as of 2026)
// Source: National Communications Authority (NCA) Ghana
export const VALID_GHANA_MOBILE_PREFIXES = [
  '020', '023', '024', '025', '026', '027', '028', '029',  // MTN, Vodafone, AirtelTigo
  '050', '053', '054', '055', '056', '057', '058', '059',  // Additional ranges
] as const;

export type GhanaMobilePrefix = typeof VALID_GHANA_MOBILE_PREFIXES[number];

export function isValidGhanaMobilePrefix(prefix: string): boolean {
  return VALID_GHANA_MOBILE_PREFIXES.includes(prefix as GhanaMobilePrefix);
}

export function validateGhanaMobilePhone(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/\s+/g, '').replace(/[-\+\(\)]/g, '');
  
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  // Must start with a valid Ghanaian prefix
  const prefix = cleaned.substring(0, 3);
  if (!isValidGhanaMobilePrefix(prefix)) {
    return { valid: false, error: 'Invalid Ghanaian mobile prefix' };
  }
  
  return { valid: true };
}

export function formatGhanaMobilePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[-\+\(\)]/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  return phone;
}
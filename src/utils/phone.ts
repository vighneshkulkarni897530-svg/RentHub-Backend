// ============================================================
// RentHub - Indian Phone Number Utilities (Backend)
// ============================================================
// Centralized phone formatting and validation for Indian
// mobile numbers. All phone numbers stored/validated on the
// backend should go through these helpers so the entire app
// uses a consistent +91 XXXXX XXXXX format.
// ============================================================

const INDIAN_COUNTRY_CODE = '+91';

/**
 * Normalize any phone input into a clean 10-digit Indian mobile number.
 * Accepts: 9876543210, +919876543210, 919876543210, +91 98765 43210, 09876543210
 * Returns the 10-digit string (without country code) or null if invalid.
 */
export function normalizeIndianMobile(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  let cleaned = digits;
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2);
  if (cleaned.length !== 10) return null;
  if (!/^[6-9]/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Format a phone number as an Indian mobile number: +91 XXXXX XXXXX
 * If the input is not a valid Indian mobile number, returns the
 * original input unchanged (so real user data is never altered).
 */
export function formatIndianPhone(input: string): string {
  const normalized = normalizeIndianMobile(input);
  if (!normalized) return input;
  return `${INDIAN_COUNTRY_CODE} ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}

/**
 * Validate whether a string is a valid Indian mobile number.
 */
export function isValidIndianPhone(input: string): boolean {
  return normalizeIndianMobile(input) !== null;
}

/**
 * Extract just the 10-digit mobile number from any input.
 */
export function getIndianMobileDigits(input: string): string {
  return normalizeIndianMobile(input) || '';
}
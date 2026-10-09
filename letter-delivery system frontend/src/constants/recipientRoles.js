export const CANONICAL_RECIPIENT_ROLES = [
  'HR Officer',
  'IT Officer',
  'Finance Manager',
  'Human Resource Manager',
  'Chief Executive Officer',
  'Chief Technology Officer',
  'Managing Director',
  'Administrative Manager',
  'Accountant',
  'Procurement Officer',
  'Internal Auditor',
  'Risk Manager',
  'Security Manager',
  'Receptionist',
  'Driver',
];

export const RECIPIENT_FILTER_OPTIONS = [
  { value: '', label: 'All Recipients' },
  ...CANONICAL_RECIPIENT_ROLES.map(role => ({ value: role, label: role })),
];

export function isValidRecipientRole(role) {
  return CANONICAL_RECIPIENT_ROLES.includes(role);
}
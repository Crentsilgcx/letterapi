/**
 * Recipient positions - the single local source of truth for the Delivery app.
 *
 * These are the exact strings the backend accepts and returns
 * (GET /api/public/recipient-roles, POST /api/public/deliveries
 * `recipientPosition`). They are predefined so the Delivery screen renders and
 * stays fully usable on its first frame, with no spinner and no wait on the
 * network.
 *
 * `GET /api/public/recipient-roles` still runs once in the background
 * (see usePositions) purely to pick up any position the server knows about that
 * is not listed here. Local constants are never replaced by that response - they
 * are only added to - and a failed background request is silent.
 *
 * "Other" is the explicit catch-all and always stays last so it is reachable at
 * the bottom of every grouped list.
 *
 * This list must stay in sync with
 * `letter-delivery system frontend/src/constants/recipientPositions.js`, which
 * groups the same values for the web Delivery form and filters.
 */

export type PositionOption = {
  value: string;
  label: string;
  group: string;
};

export type PositionGroup = {
  group: string;
  positions: PositionOption[];
};

export const POSITIONS: PositionOption[] = [
  // Executive
  { value: 'Chief Executive Officer', label: 'Chief Executive Officer', group: 'Executive' },

  // Management
  { value: 'Manager', label: 'Manager', group: 'Management' },
  { value: 'Human Resources', label: 'Human Resources', group: 'Management' },

  // Finance and Admin
  { value: 'Finance', label: 'Finance', group: 'Finance and Admin' },

  // Support staff
  { value: 'Secretary', label: 'Secretary', group: 'Support staff' },

  // Legal and Compliance
  { value: 'Legal', label: 'Legal', group: 'Legal and Compliance' },

  // Other (must be last)
  { value: 'Other', label: 'Other', group: 'Other' },
];

export const OTHER_GROUP = 'Other';

export const POSITION_GROUPS = [
  'Executive',
  'Management',
  'Finance and Admin',
  'Operations',
  'Legal and Compliance',
  'Support staff',
  OTHER_GROUP,
] as const;

const GROUP_ORDER: Record<string, number> = POSITION_GROUPS.reduce<Record<string, number>>(
  (order, group, index) => {
    order[group] = index + 1;
    return order;
  },
  {}
);

const CONSTANT_ORDER = new Map(POSITIONS.map((position, index) => [position.value, index]));

export function findPositionByValue(value: string): PositionOption | undefined {
  return POSITIONS.find((position) => position.value === value);
}

export function getAllPositionValues(): string[] {
  return POSITIONS.map((position) => position.value);
}

export function isKnownPosition(value: string): boolean {
  return CONSTANT_ORDER.has(value);
}

export function groupOrder(group: string): number {
  return GROUP_ORDER[group] ?? GROUP_ORDER[OTHER_GROUP];
}

export function sortPositions(positions: PositionOption[]): PositionOption[] {
  return [...positions].sort((a, b) => {
    const groupDiff = groupOrder(a.group) - groupOrder(b.group);
    if (groupDiff !== 0) return groupDiff;
    const indexA = CONSTANT_ORDER.get(a.value) ?? Number.MAX_SAFE_INTEGER;
    const indexB = CONSTANT_ORDER.get(b.value) ?? Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) return indexA - indexB;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Unions positions from the backend into the predefined list.
 *
 * Predefined positions keep their stable order and stay selectable even if the
 * server stops reporting them; anything the server knows that is not predefined
 * is appended to the `Other` group, so no real position is ever hidden from the
 * user and no local constant is ever dropped.
 */
export function mergePositions(fromApi: string[] = []): PositionOption[] {
  const merged: PositionOption[] = [...POSITIONS];
  const seen = new Set(merged.map((position) => position.value));

  for (const raw of fromApi) {
    const value = raw?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push({ value, label: value, group: OTHER_GROUP });
  }

  return sortPositions(merged);
}

/**
 * Groups positions for the picker, preserving POSITION_GROUPS order and dropping
 * empty sections. `Other` is pinned last because it sorts last by group order.
 */
export function groupPositions(positions: PositionOption[]): PositionGroup[] {
  const buckets = new Map<string, PositionOption[]>(POSITION_GROUPS.map((group) => [group, []]));

  for (const position of positions) {
    const bucket = buckets.get(position.group) ?? buckets.get(OTHER_GROUP);
    bucket?.push(position);
  }

  return POSITION_GROUPS.map((group) => ({ group, positions: buckets.get(group) ?? [] })).filter(
    ({ positions: groupPositions }) => groupPositions.length > 0
  );
}

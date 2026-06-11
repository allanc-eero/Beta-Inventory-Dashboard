import { Carrier } from '@/types';

// ─── Shared Constants ─────────────────────────────────────────────────────────

export const REGIONS = ['USA', 'CA', 'EU', 'UK', 'AUS', 'NZ', 'JPN', 'SG', 'Other'] as const;
export type Region = (typeof REGIONS)[number];

export const CARRIER_COLORS: Record<Carrier, string> = {
  DHL: 'bg-yellow-500 text-white',
  FedEx: 'bg-purple-600 text-white',
  UPS: 'bg-amber-700 text-white',
  USPS: 'bg-blue-600 text-white',
  Other: 'bg-gray-500 text-white',
};

export const CARRIERS: Carrier[] = ['UPS', 'USPS', 'FedEx', 'DHL', 'Other'];

export const TRACKING_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  Other: '',
};

export const EPIC_MAP: Record<string, string> = {
  beta: 'BETA-SHIPMENTS',
  dogfood: 'DOGFOOD-SHIPMENTS',
  prq: 'PRQ-SHIPMENTS',
  pvt: 'PVT-SHIPMENTS',
  evt: 'EVT-SHIPMENTS',
  dvt: 'DVT-SHIPMENTS',
  other: 'GENERAL-SHIPMENTS',
};

export const RETURN_EPIC_MAP: Record<string, string> = {
  beta: 'BETA-RETURNS',
  dogfood: 'DOGFOOD-RETURNS',
  prq: 'PRQ-RETURNS',
  pvt: 'PVT-RETURNS',
  evt: 'EVT-RETURNS',
  dvt: 'DVT-RETURNS',
  other: 'GENERAL-RETURNS',
};

export const JIRA_EPIC_KEY = 'BPM-1886';
export const JIRA_BASE_URL = 'https://eeroinc.atlassian.net';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

// Build a carrier tracking URL from a carrier name + tracking number.
// Carrier matching is case-insensitive; unknown carriers fall back to a search.
export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const tn = (trackingNumber || '').trim();
  if (!tn) return '';
  const key = (carrier || '').toUpperCase();
  const base =
    key === 'UPS' ? TRACKING_URLS.UPS :
    key === 'USPS' ? TRACKING_URLS.USPS :
    key === 'FEDEX' ? TRACKING_URLS.FedEx :
    key === 'DHL' ? TRACKING_URLS.DHL :
    '';
  return base ? `${base}${tn}` : `https://www.google.com/search?q=${encodeURIComponent(tn + ' tracking')}`;
}

const DOMESTIC_COUNTRIES = new Set(['united states', 'us', 'usa', 'canada', 'ca']);

// True if the tester is US/Canada (domestic return flow); else international.
export function isDomesticCountry(country: string): boolean {
  return DOMESTIC_COUNTRIES.has((country || '').toLowerCase().trim());
}

// Return the returns-epic key for a program, defaulting to GENERAL-RETURNS.
export function getReturnEpic(program: string): string {
  return RETURN_EPIC_MAP[program] || RETURN_EPIC_MAP.other;
}

// Shared device-status badge config (class + label), used by device tables/panels.
export const STATUS_CONFIG: Record<string, { class: string; label: string }> = {
  online: { class: 'status-in-stock', label: 'Online' },
  not_online: { class: 'status-checked-out', label: 'Not Online' },
  in_repair: { class: 'status-in-repair', label: 'In Repair' },
  in_testing: { class: 'status-in-testing', label: 'In Testing' },
  pending_return: { class: 'bg-orange-100 text-orange-700', label: 'Pending Return' },
  deactivated: { class: 'bg-gray-100 text-gray-600', label: 'Deactivated' },
};

// Resolve a status to its badge config, with a safe fallback.
export function getStatusBadge(status: string): { class: string; label: string } {
  return STATUS_CONFIG[status] || { class: 'bg-gray-100 text-gray-600', label: status };
}

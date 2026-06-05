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

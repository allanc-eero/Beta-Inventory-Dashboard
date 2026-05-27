export type DeviceStatus = 'online' | 'not_online' | 'in_repair' | 'in_testing' | 'deactivated' | 'pending_return';

export type ShipmentStatus = 'ordered' | 'in_transit_to_fc' | 'at_fc' | 'in_transit_to_tester' | 'delivered' | 'online';

export type Carrier = 'UPS' | 'USPS' | 'FedEx' | 'DHL' | 'Other';

export type Program = 'beta' | 'dogfood' | 'prq' | 'pvt' | 'evt' | 'dvt' | 'other';

export interface Shipment {
  id: string;
  leg: 1 | 2;
  serials: string[];
  carrier: Carrier;
  trackingNumber: string;
  origin: string;
  destination: string;
  destinationEmail?: string; // for leg 2 (tester email)
  status: 'in_transit' | 'delivered';
  shippedDate: string;
  deliveredDate?: string;
  notes?: string;
  createdAt: string;
  fileName?: string;
  deviceCount?: number;
  testerCount?: number;
  program?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  revision: string;
  revisionNotes: string;
  hardwareConfig: string;
  mac: string;
  internalName: string;
  sku: string;
  partNumber: string;
  country: string;
  adminId: string;
  unitId: string;
  deactivated: boolean;
  firmwareVersion: string;
  // Assignment
  status: DeviceStatus;
  assignedTo: string;
  assignedEmail: string;
  contactEmail: string;
  alternateEmail: string;
  location: string;
  adminLocation: string;
  network: string;
  program: Program;
  // Logistics
  assetTag: string;
  poExpensify: string;
  accountingId: string;
  cost: string;
  purchaseDate: string;
  imei1: string;
  imei2: string;
  eid: string;
  tracking: string;
  jira: string;
  // Checkout
  checkedOutTo: string;
  checkedOutDate: string;
  dueDate: string;
  notes: string;
  // Shipment tracking
  shipmentStatus: ShipmentStatus;
  fcLocation: string;
  leg1Carrier: string;
  leg1Tracking: string;
  leg1Date: string;
  leg2Carrier: string;
  leg2Tracking: string;
  leg2Date: string;
  // Testbed
  testbedId: string;
  testbedName: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Email tracking
  returnEmailSentAt?: string;
  returnReminderSentAt?: string;
  returnEmailCount?: number;
}

export interface Testbed {
  id: string;
  name: string;
  description: string;
  location: string;
  devices: string[]; // device IDs
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  deviceCount: number;
  devices: string[]; // device IDs
}

export interface Person {
  id: string;
  name: string;
  email: string;
  team: string;
  devices: string[]; // device IDs
}

export interface CheckoutRecord {
  id: string;
  deviceId: string;
  serialNumber: string;
  personEmail: string;
  personName: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  jiraTicket: string;
  notes: string;
  carrier: string;
  trackingNumber: string;
  location: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface HistoryEntry {
  id: string;
  deviceId: string;
  timestamp: string;
  action: string; // e.g. 'field_updated', 'checked_out', 'checked_in', 'created', 'assigned'
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: string;
  description: string;
}

export type TabType = 'devices' | 'testbeds' | 'locations' | 'people' | 'shipments';

// ─── Feature: Firmware Tracking ───────────────────────────────────────────────
export interface FirmwareInfo {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  changelog?: string;
}

// ─── Feature: Health Regression Detection ─────────────────────────────────────
export interface SpeedTestResult {
  id: string;
  deviceId: string;
  timestamp: string;
  downloadMbps: number;
  uploadMbps: number;
  firmwareVersion: string;
  flagged: boolean; // true if regression detected
  notes?: string;
}

// ─── Feature: JIRA Integration ────────────────────────────────────────────────
export interface JiraTicket {
  id: string;
  key: string; // e.g. "QA-12345"
  deviceId: string;
  type: 'overdue_return' | 'device_issue' | 'firmware_regression' | 'general';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  summary: string;
  createdAt: string;
  resolvedAt?: string;
  linkedFirmware?: string;
  url?: string;
}

// ─── Feature: Deactivation Workflow ───────────────────────────────────────────
export interface DeactivationRecord {
  id: string;
  deviceId: string;
  serialNumber: string;
  reason: 'returned_to_eero' | 'defective' | 'end_of_life' | 'lost';
  deactivatedAt: string;
  deactivatedBy: string;
  factoryReset: boolean;
  notes: string;
  previousStatus: DeviceStatus;
  previousAssignee: string;
}

// ─── Feature: Overdue Alerts ──────────────────────────────────────────────────
export interface OverdueAlert {
  id: string;
  deviceId: string;
  serialNumber: string;
  assignedEmail: string;
  dueDate: string;
  daysOverdue: number;
  remindersSent: number;
  lastReminderAt?: string;
  acknowledged: boolean;
}

// ─── Feature: File Attachments ────────────────────────────────────────────────
export type AttachmentType = 'rma_form' | 'shipping_receipt' | 'invoice' | 'photo' | 'report' | 'other';

// ─── Feature: Closed Programs History ─────────────────────────────────────────
export interface ClosedProgramRecord {
  id: string;
  program: string;
  closedAt: string;
  closedBy: string;
  totalDevices: number;
  actions: { deviceId: string; serial: string; assignee: string; action: string }[];
}

// ─── Feature: Tester Opt-Out Tracking ─────────────────────────────────────────
export type OptOutReason = 'no_longer_interested' | 'moving' | 'device_issues' | 'time_constraints' | 'other';

export interface OptOutRecord {
  id: string;
  personEmail: string;
  personName: string;
  reason: OptOutReason;
  notes: string;
  optOutDate: string;
  recordedBy: string;
  program: string;
  devicesAtOptOut: string[]; // serial numbers they had
}

export interface SyncMetadata {
  lastFullSync: string | null;
  lastNetworkCheck: string | null;
  syncInProgress: boolean;
  rateLimitedUntil: string | null;
  lastSyncDeviceCount: number;
  lastSyncOnlineCount: number;
}

export interface Attachment {
  id: string;
  deviceId?: string;
  shipmentId?: string;
  fileName: string;
  fileSize: number;
  fileType: string; // mime type
  attachmentType: AttachmentType;
  dataUrl: string; // base64 data URL for local storage
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

// ─── Feature: Tester Profiles ─────────────────────────────────────────────────
export interface TesterProfile {
  id: string;
  testerId: string; // stable human-readable ID (e.g., "TST-00042") for cross-platform tracking
  email: string; // primary email — the main link across programs
  additionalEmails: string[]; // all known emails for this person (old emails, aliases, etc.)
  name: string;
  contactEmail: string;
  alternateEmail: string;
  country: string;
  location: string;
  networkId: string;
  adminId: string;
  internetSpeed: string;
  notes: string;
  programs: string[]; // programs they've participated in
  createdAt: string;
  updatedAt: string;
}

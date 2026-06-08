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
  product: string; // free text — e.g., "Foghorn", "Merci"
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

export type TabType = 'overview' | 'devices' | 'testbeds' | 'locations' | 'people' | 'shipments' | 'packages' | 'shapeshift' | 'dogfood';

// ─── Feature: Packages & Service Board ────────────────────────────────────────

export type InboundPackageStatus = 'open' | 'received' | 'cancelled';
export type OutboundPackageStatus = 'open' | 'shipped' | 'delivered' | 'cancelled';
export type ServiceOrderStatus = 'intake' | 'triage' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ServiceOrderType = 'returned_to_eero' | 'defective' | 'end_of_program' | 'lost' | 'outbound_shipment' | 'other';
export type ServiceOrderPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface InboundPackage {
  id: string;
  asn: string; // ASN-{SITE}-{timestamp}-{seq}
  carrier: Carrier;
  trackingNumber: string;
  models: string; // e.g., "eero Max 7"
  itemsTotal: number;
  itemsReceived: number;
  eta: string; // ISO date
  destination: string; // site code, e.g., "SFO38"
  status: InboundPackageStatus;
  trackingStatus?: string; // "DELIVERED", "IN_TRANSIT", etc.
  notes?: string;
  receivedAt?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundPackage {
  id: string;
  shippingId: string; // auto or manual ID
  carrier: Carrier;
  trackingNumber: string;
  models: string;
  itemsTotal: number;
  recipient: string; // tester name or email
  recipientEmail?: string;
  destination: string; // city/country
  status: OutboundPackageStatus;
  trackingStatus?: string;
  notes?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  type: ServiceOrderType;
  priority: ServiceOrderPriority;
  status: ServiceOrderStatus;
  assignee: string; // person handling it
  assigneeEmail?: string;
  requester: string; // who requested it
  site: string; // lab/site code
  deviceSerial?: string; // linked device if applicable
  jiraKey?: string; // e.g., "QA-17918"
  jiraUrl?: string;
  epicKey?: string; // Beta epic this syncs to
  eta?: string; // ISO date
  columnEnteredAt: string; // when it entered current status — for SLA tracking
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ─── Feature: Shapeshift (Prod ↔ Stage) ──────────────────────────────────────
export type ShapeshiftTargetEnv = 'stage' | 'prod';
export type ShapeshiftJobStatus = 'queued' | 'in_progress' | 'success' | 'failed' | 'cancelled';

export interface ShapeshiftJob {
  id: string;
  serial: string;
  targetEnv: ShapeshiftTargetEnv;
  networkId?: string;
  retries: number;
  currentAttempt: number;
  status: ShapeshiftJobStatus;
  printLabel: boolean;
  otaToLatest: boolean;
  assignedTo: string; // who queued it
  notes?: string;
  log?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

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

// ─── Feature: Salesforce Cases ────────────────────────────────────────────────
export interface SalesforceCase {
  id: string;
  caseNumber: string; // e.g., "00123456"
  deviceSerial: string; // linked via shake-report device serial
  subject: string;
  status: 'New' | 'Open' | 'In Progress' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  closedAt?: string;
  jiraTicketKey?: string; // linked JIRA ticket if escalated
  reporterEmail?: string;
  description?: string;
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
  actions: { deviceId: string; serial: string; assignee: string; action: string; region: string; processedAt: string }[];
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
  // Offboarding checklist
  checklist?: OptOutChecklist;
}

export interface OptOutChecklist {
  adminRemoved: boolean;
  adminRemovedAt?: string;
  adminRemovedBy?: string;
  qualtricsRemoved: boolean;
  qualtricsRemovedAt?: string;
  qualtricsRemovedBy?: string;
  devicesOffboarded: boolean;
  devicesOffboardedAt?: string;
  devicesOffboardedBy?: string;
  allCompleted: boolean;
  completedAt?: string;
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

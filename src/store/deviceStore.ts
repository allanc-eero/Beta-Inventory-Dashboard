'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Device, Testbed, Location, Person, CheckoutRecord, DeviceStatus, Program, HistoryEntry, SpeedTestResult, JiraTicket, DeactivationRecord, OverdueAlert, FirmwareInfo, Shipment, ShipmentStatus, Carrier, Attachment, AttachmentType, SyncMetadata, ClosedProgramRecord, OptOutRecord, TesterProfile } from '@/types';

interface DeviceStore {
  devices: Device[];
  testbeds: Testbed[];
  locations: Location[];
  people: Person[];
  checkoutHistory: CheckoutRecord[];
  deviceHistory: HistoryEntry[];
  speedTests: SpeedTestResult[];
  jiraTickets: JiraTicket[];
  deactivationRecords: DeactivationRecord[];
  overdueAlerts: OverdueAlert[];
  latestFirmware: FirmwareInfo;
  shipments: Shipment[];
  attachments: Attachment[];
  syncMetadata: SyncMetadata;
  closedPrograms: ClosedProgramRecord[];
  optOutRecords: OptOutRecord[];

  // Device actions
  addDevice: (device: Device) => void;
  addDevices: (devices: Device[]) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  getDeviceBySerial: (serial: string) => Device | undefined;
  getDevicesByPerson: (email: string) => Device[];
  getDevicesByLocation: (location: string) => Device[];
  getDevicesByProgram: (program: Program) => Device[];
  getDevicesByStatus: (status: DeviceStatus) => Device[];

  // History actions
  addHistoryEntry: (entry: HistoryEntry) => void;
  getDeviceHistory: (deviceId: string) => HistoryEntry[];

  // Testbed actions
  addTestbed: (testbed: Testbed) => void;
  updateTestbed: (id: string, updates: Partial<Testbed>) => void;
  deleteTestbed: (id: string) => void;
  assignDeviceToTestbed: (deviceId: string, testbedId: string) => void;
  removeDeviceFromTestbed: (deviceId: string, testbedId: string) => void;

  // Location actions
  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // People actions
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  getPersonByEmail: (email: string) => Person | undefined;
  searchPeople: (query: string) => Person[];

  // Checkout actions
  checkoutDevice: (record: CheckoutRecord) => void;
  checkinDevice: (deviceId: string) => void;
  getCheckoutHistory: (deviceId: string) => CheckoutRecord[];

  // ─── Firmware Tracking ────────────────────────────────────────────────
  pushFirmwareUpdate: (deviceId: string, version: string) => void;
  setLatestFirmware: (info: FirmwareInfo) => void;
  getOutdatedDevices: () => Device[];

  // ─── Health Regression Detection ─────────────────────────────────────
  addSpeedTest: (result: SpeedTestResult) => void;
  getSpeedTests: (deviceId: string) => SpeedTestResult[];
  getFlaggedRegressions: () => SpeedTestResult[];

  // ─── JIRA Integration ────────────────────────────────────────────────
  createJiraTicket: (ticket: JiraTicket) => void;
  updateJiraTicket: (id: string, updates: Partial<JiraTicket>) => void;
  closeJiraTicket: (id: string) => void;
  getJiraTicketsForDevice: (deviceId: string) => JiraTicket[];
  getOpenJiraTickets: () => JiraTicket[];

  // ─── Deactivation Workflow ───────────────────────────────────────────
  deactivateDevice: (record: DeactivationRecord) => void;
  getDeactivationRecords: () => DeactivationRecord[];

  // ─── Overdue Alerts ──────────────────────────────────────────────────
  getOverdueDevices: () => OverdueAlert[];
  acknowledgeOverdueAlert: (alertId: string) => void;
  sendOverdueReminder: (deviceId: string) => void;

  // ─── Shipments ────────────────────────────────────────────────────────
  addShipment: (shipment: Shipment) => void;
  markShipmentDelivered: (shipmentId: string) => void;
  getShipmentsForDevice: (serial: string) => Shipment[];
  getAllShipments: () => Shipment[];

  // ─── Network Sync ─────────────────────────────────────────────────────
  syncNetworkStatus: (onlineSerials: string[]) => number;
  updateSyncMetadata: (updates: Partial<SyncMetadata>) => void;
  isSyncStale: () => boolean;
  isRateLimited: () => boolean;

  // ─── Attachments ──────────────────────────────────────────────────────
  addAttachment: (attachment: Attachment) => void;
  deleteAttachment: (id: string) => void;
  getAttachmentsForDevice: (deviceId: string) => Attachment[];
  getAttachmentsForShipment: (shipmentId: string) => Attachment[];

  // ─── Closed Programs ──────────────────────────────────────────────────
  addClosedProgram: (record: ClosedProgramRecord) => void;
  addProcessedDevicesToProgram: (program: string, actions: ClosedProgramRecord['actions']) => void;
  getClosedPrograms: () => ClosedProgramRecord[];

  // ─── Opt-Out Tracking ─────────────────────────────────────────────────
  addOptOut: (record: OptOutRecord) => void;
  getOptOuts: () => OptOutRecord[];
  removeOptOut: (personEmail: string) => void;
  updateOptOutChecklist: (id: string, field: keyof import('@/types').OptOutChecklist, user: string) => void;

  // ─── Tester Profiles ──────────────────────────────────────────────────
  testerProfiles: TesterProfile[];
  upsertTesterProfile: (profile: Partial<TesterProfile> & { email: string }) => void;
  getTesterProfile: (email: string) => TesterProfile | undefined;
  getAllTesterProfiles: () => TesterProfile[];
  findDuplicateProfiles: (name: string, email: string) => TesterProfile[];
  mergeProfiles: (targetId: string, sourceEmail: string) => void;
  applyTesterProfile: (deviceId: string, email: string) => void;

  // Bulk actions
  clearAllData: () => void;
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set, get) => ({
      devices: [],
      testbeds: [],
      locations: [],
      people: [],
      checkoutHistory: [],
      deviceHistory: [],
      speedTests: [],
      jiraTickets: [],
      deactivationRecords: [],
      overdueAlerts: [],
      latestFirmware: { version: '7.3.0', releaseDate: '2025-05-01', isLatest: true },
      shipments: [],
      attachments: [],
      syncMetadata: {
        lastFullSync: null,
        lastNetworkCheck: null,
        syncInProgress: false,
        rateLimitedUntil: null,
        lastSyncDeviceCount: 0,
        lastSyncOnlineCount: 0,
      },
      closedPrograms: [],
      optOutRecords: [],
      testerProfiles: [],

      // Device actions
      addDevice: (device) =>
        set((state) => ({ devices: [...state.devices, device] })),

      addDevices: (devices) =>
        set((state) => ({ devices: [...state.devices, ...devices] })),

      updateDevice: (id, updates) => {
        const currentDevice = get().devices.find((d) => d.id === id);
        if (currentDevice) {
          // Log changes to history
          const entries: HistoryEntry[] = [];
          Object.keys(updates).forEach((key) => {
            const field = key as keyof Device;
            const oldVal = String(currentDevice[field] || '');
            const newVal = String((updates as any)[field] || '');
            if (oldVal !== newVal && field !== 'updatedAt') {
              entries.push({
                id: crypto.randomUUID(),
                deviceId: id,
                timestamp: new Date().toISOString(),
                action: 'field_updated',
                field: field,
                oldValue: oldVal,
                newValue: newVal,
                user: 'System',
                description: `${field} changed from "${oldVal || '—'}" to "${newVal || '—'}"`,
              });
            }
          });
          set((state) => ({
            devices: state.devices.map((d) =>
              d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
            ),
            deviceHistory: [...state.deviceHistory, ...entries],
          }));
        }
      },

      deleteDevice: (id) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
        })),

      getDeviceBySerial: (serial) =>
        get().devices.find((d) => d.serialNumber.toLowerCase() === serial.toLowerCase()),

      getDevicesByPerson: (email) =>
        get().devices.filter((d) => d.assignedEmail.toLowerCase() === email.toLowerCase()),

      getDevicesByLocation: (location) =>
        get().devices.filter((d) => d.location.toLowerCase() === location.toLowerCase()),

      getDevicesByProgram: (program) =>
        get().devices.filter((d) => d.program === program),

      getDevicesByStatus: (status) =>
        get().devices.filter((d) => d.status === status),

      // History actions
      addHistoryEntry: (entry) =>
        set((state) => ({ deviceHistory: [...state.deviceHistory, entry] })),

      getDeviceHistory: (deviceId) =>
        get().deviceHistory.filter((h) => h.deviceId === deviceId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

      // Testbed actions
      addTestbed: (testbed) =>
        set((state) => ({ testbeds: [...state.testbeds, testbed] })),

      updateTestbed: (id, updates) =>
        set((state) => ({
          testbeds: state.testbeds.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTestbed: (id) =>
        set((state) => ({
          testbeds: state.testbeds.filter((t) => t.id !== id),
        })),

      assignDeviceToTestbed: (deviceId, testbedId) =>
        set((state) => ({
          testbeds: state.testbeds.map((t) =>
            t.id === testbedId
              ? { ...t, devices: [...t.devices, deviceId] }
              : t
          ),
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, testbedId, testbedName: state.testbeds.find(t => t.id === testbedId)?.name || '' } : d
          ),
        })),

      removeDeviceFromTestbed: (deviceId, testbedId) =>
        set((state) => ({
          testbeds: state.testbeds.map((t) =>
            t.id === testbedId
              ? { ...t, devices: t.devices.filter((id) => id !== deviceId) }
              : t
          ),
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, testbedId: '', testbedName: '' } : d
          ),
        })),

      // Location actions
      addLocation: (location) =>
        set((state) => ({ locations: [...state.locations, location] })),

      updateLocation: (id, updates) =>
        set((state) => ({
          locations: state.locations.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      deleteLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((l) => l.id !== id),
        })),

      // People actions
      addPerson: (person) =>
        set((state) => ({ people: [...state.people, person] })),

      updatePerson: (id, updates) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      getPersonByEmail: (email) =>
        get().people.find((p) => p.email.toLowerCase() === email.toLowerCase()),

      searchPeople: (query) => {
        const q = query.toLowerCase();
        return get().people.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.team.toLowerCase().includes(q)
        );
      },

      // Checkout actions
      checkoutDevice: (record) =>
        set((state) => ({
          checkoutHistory: [...state.checkoutHistory, record],
          devices: state.devices.map((d) =>
            d.id === record.deviceId
              ? {
                  ...d,
                  checkedOutTo: record.personName,
                  assignedTo: record.personName,
                  assignedEmail: record.personEmail,
                  checkedOutDate: record.checkoutDate,
                  dueDate: record.dueDate,
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: record.deviceId,
            timestamp: new Date().toISOString(),
            action: 'checked_out',
            user: 'System',
            description: `Checked out to ${record.personName} (${record.personEmail})${record.dueDate ? ` — due ${record.dueDate}` : ''}`,
          }],
        })),

      checkinDevice: (deviceId) =>
        set((state) => ({
          checkoutHistory: state.checkoutHistory.map((r) =>
            r.deviceId === deviceId && !r.returnDate
              ? { ...r, returnDate: new Date().toISOString() }
              : r
          ),
          devices: state.devices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  checkedOutTo: '',
                  assignedTo: '',
                  assignedEmail: '',
                  checkedOutDate: '',
                  dueDate: '',
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: deviceId,
            timestamp: new Date().toISOString(),
            action: 'checked_in',
            user: 'System',
            description: `Device checked back in`,
          }],
        })),

      getCheckoutHistory: (deviceId) =>
        get().checkoutHistory.filter((r) => r.deviceId === deviceId),

      // ─── Firmware Tracking ──────────────────────────────────────────────────
      pushFirmwareUpdate: (deviceId, version) => {
        const device = get().devices.find((d) => d.id === deviceId);
        if (!device) return;
        const oldVersion = device.firmwareVersion;
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, firmwareVersion: version, updatedAt: new Date().toISOString() } : d
          ),
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'firmware_updated',
            field: 'firmwareVersion',
            oldValue: oldVersion,
            newValue: version,
            user: 'System',
            description: `Firmware updated from ${oldVersion || 'unknown'} to ${version}`,
          }],
        }));
      },

      setLatestFirmware: (info) => set({ latestFirmware: info }),

      getOutdatedDevices: () => {
        const latest = get().latestFirmware.version;
        return get().devices.filter((d) => d.firmwareVersion && d.firmwareVersion !== latest && d.status !== 'deactivated');
      },

      // ─── Health Regression Detection ────────────────────────────────────────
      addSpeedTest: (result) => {
        // Auto-flag if download dropped >30% compared to previous test
        const previousTests = get().speedTests
          .filter((t) => t.deviceId === result.deviceId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        let flagged = false;
        if (previousTests.length > 0) {
          const lastTest = previousTests[0];
          const dropPercent = (lastTest.downloadMbps - result.downloadMbps) / lastTest.downloadMbps;
          if (dropPercent > 0.3) {
            flagged = true;
          }
        }

        const finalResult = { ...result, flagged };
        set((state) => ({
          speedTests: [...state.speedTests, finalResult],
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: result.deviceId,
            timestamp: new Date().toISOString(),
            action: flagged ? 'health_regression' : 'speed_test',
            user: 'System',
            description: flagged
              ? `⚠️ Performance regression detected: ${result.downloadMbps} Mbps down (was ${previousTests[0]?.downloadMbps} Mbps)`
              : `Speed test: ${result.downloadMbps} Mbps down / ${result.uploadMbps} Mbps up`,
          }],
        }));

        // Auto-create JIRA ticket for regressions
        if (flagged) {
          const device = get().devices.find((d) => d.id === result.deviceId);
          get().createJiraTicket({
            id: crypto.randomUUID(),
            key: `QA-${Math.floor(Math.random() * 90000) + 10000}`,
            deviceId: result.deviceId,
            type: 'firmware_regression',
            status: 'open',
            summary: `Performance regression on ${device?.serialNumber || 'unknown'} after firmware ${result.firmwareVersion}`,
            createdAt: new Date().toISOString(),
            linkedFirmware: result.firmwareVersion,
          });
        }
      },

      getSpeedTests: (deviceId) =>
        get().speedTests.filter((t) => t.deviceId === deviceId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

      getFlaggedRegressions: () =>
        get().speedTests.filter((t) => t.flagged),

      // ─── JIRA Integration ───────────────────────────────────────────────────
      createJiraTicket: (ticket) =>
        set((state) => ({
          jiraTickets: [...state.jiraTickets, ticket],
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: ticket.deviceId,
            timestamp: new Date().toISOString(),
            action: 'jira_created',
            user: 'System',
            description: `JIRA ticket ${ticket.key} created: ${ticket.summary}`,
          }],
        })),

      updateJiraTicket: (id, updates) =>
        set((state) => ({
          jiraTickets: state.jiraTickets.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      closeJiraTicket: (id) => {
        const ticket = get().jiraTickets.find((t) => t.id === id);
        if (!ticket) return;
        set((state) => ({
          jiraTickets: state.jiraTickets.map((t) =>
            t.id === id ? { ...t, status: 'closed', resolvedAt: new Date().toISOString() } : t
          ),
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: ticket.deviceId,
            timestamp: new Date().toISOString(),
            action: 'jira_closed',
            user: 'System',
            description: `JIRA ticket ${ticket.key} closed`,
          }],
        }));
      },

      getJiraTicketsForDevice: (deviceId) =>
        get().jiraTickets.filter((t) => t.deviceId === deviceId),

      getOpenJiraTickets: () =>
        get().jiraTickets.filter((t) => t.status === 'open' || t.status === 'in_progress'),

      // ─── Deactivation Workflow ──────────────────────────────────────────────
      deactivateDevice: (record) => {
        const device = get().devices.find((d) => d.id === record.deviceId);
        const program = device?.program || 'beta';
        const epicMap: Record<string, string> = {
          beta: 'BETA-RETURNS',
          dogfood: 'DOGFOOD-RETURNS',
          prq: 'PRQ-RETURNS',
          pvt: 'PVT-RETURNS',
          evt: 'EVT-RETURNS',
          dvt: 'DVT-RETURNS',
          other: 'GENERAL-RETURNS',
        };
        const epic = epicMap[program] || 'GENERAL-RETURNS';

        set((state) => ({
          deactivationRecords: [...state.deactivationRecords, record],
          devices: state.devices.map((d) =>
            d.id === record.deviceId
              ? {
                  ...d,
                  status: 'deactivated' as DeviceStatus,
                  deactivated: true,
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: record.deviceId,
            timestamp: new Date().toISOString(),
            action: 'deactivated',
            user: record.deactivatedBy,
            description: `Device deactivated — reason: ${record.reason.replace(/_/g, ' ')}. Initiated by ${record.deactivatedBy}. ${record.notes}`,
          }],
        }));

        // Always create a JIRA ticket for any return reason, under the logged-in user, in the correct epic
        const assignee = device?.assignedEmail || device?.checkedOutTo || 'unassigned';
        const ticketKey = `QA-${Math.floor(Math.random() * 90000) + 10000}`;
        get().createJiraTicket({
          id: crypto.randomUUID(),
          key: ticketKey,
          deviceId: record.deviceId,
          type: 'device_issue',
          status: 'open',
          summary: `[${epic}] Device ${record.serialNumber} returned (${record.reason.replace(/_/g, ' ')}) — last assignee: ${assignee}`,
          createdAt: new Date().toISOString(),
          linkedFirmware: device?.firmwareVersion,
        });

        // Log the JIRA creation with epic info to the device audit trail
        set((state) => ({
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId: record.deviceId,
            timestamp: new Date().toISOString(),
            action: 'jira_created',
            user: record.deactivatedBy,
            description: `JIRA ${ticketKey} created under ${record.deactivatedBy} in epic ${epic} — reason: ${record.reason.replace(/_/g, ' ')}`,
          }],
        }));
      },

      getDeactivationRecords: () => get().deactivationRecords,

      // ─── Overdue Alerts ─────────────────────────────────────────────────────
      getOverdueDevices: () => {
        const now = new Date();
        const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

        const overdueDevices = get().devices.filter((d) => {
          if (d.deactivated) return false;
          // Original: past due date and checked out
          if (d.dueDate && new Date(d.dueDate) < now && d.checkedOutTo) return true;
          // New: pending_return with return email sent 2+ weeks ago
          if (d.status === 'pending_return' && d.returnEmailSentAt && (now.getTime() - new Date(d.returnEmailSentAt).getTime()) >= twoWeeksMs) return true;
          return false;
        });

        return overdueDevices.map((d) => {
            const existing = get().overdueAlerts.find((a) => a.deviceId === d.id);
            const referenceDate = d.status === 'pending_return' && d.returnEmailSentAt
              ? d.returnEmailSentAt
              : d.dueDate;
            return {
              id: existing?.id || crypto.randomUUID(),
              deviceId: d.id,
              serialNumber: d.serialNumber,
              assignedEmail: d.assignedEmail,
              dueDate: referenceDate || '',
              daysOverdue: Math.floor((now.getTime() - new Date(referenceDate || now).getTime()) / (1000 * 60 * 60 * 24)),
              remindersSent: existing?.remindersSent || (d.returnEmailCount || 1) - 1,
              lastReminderAt: existing?.lastReminderAt || d.returnReminderSentAt,
              acknowledged: existing?.acknowledged || false,
            };
          });
      },

      acknowledgeOverdueAlert: (alertId) =>
        set((state) => ({
          overdueAlerts: state.overdueAlerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        })),

      sendOverdueReminder: (deviceId) => {
        const device = get().devices.find((d) => d.id === deviceId);
        if (!device) return;

        // Create JIRA ticket for overdue return if none exists
        const existingTicket = get().jiraTickets.find(
          (t) => t.deviceId === deviceId && t.type === 'overdue_return' && t.status !== 'closed'
        );

        if (!existingTicket) {
          get().createJiraTicket({
            id: crypto.randomUUID(),
            key: `QA-${Math.floor(Math.random() * 90000) + 10000}`,
            deviceId,
            type: 'overdue_return',
            status: 'open',
            summary: `Overdue device return: ${device.serialNumber} — assigned to ${device.assignedEmail}`,
            createdAt: new Date().toISOString(),
          });
        }

        // Update alert record
        set((state) => {
          const existing = state.overdueAlerts.find((a) => a.deviceId === deviceId);
          if (existing) {
            return {
              overdueAlerts: state.overdueAlerts.map((a) =>
                a.deviceId === deviceId
                  ? { ...a, remindersSent: a.remindersSent + 1, lastReminderAt: new Date().toISOString() }
                  : a
              ),
            };
          }
          return {
            overdueAlerts: [...state.overdueAlerts, {
              id: crypto.randomUUID(),
              deviceId,
              serialNumber: device.serialNumber,
              assignedEmail: device.assignedEmail,
              dueDate: device.dueDate,
              daysOverdue: Math.floor((new Date().getTime() - new Date(device.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
              remindersSent: 1,
              lastReminderAt: new Date().toISOString(),
              acknowledged: false,
            }],
          };
        });

        // Log to history
        set((state) => ({
          deviceHistory: [...state.deviceHistory, {
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'overdue_reminder',
            user: 'System',
            description: `Overdue reminder sent to ${device.assignedEmail}`,
          }],
        }));
      },

      // ─── Shipments ────────────────────────────────────────────────────────
      addShipment: (shipment) => {
        set((state) => ({ shipments: [...state.shipments, shipment] }));

        // Update each device's shipment info
        const leg = shipment.leg;
        shipment.serials.forEach((serial) => {
          const device = get().devices.find((d) => d.serialNumber.toLowerCase() === serial.toLowerCase());
          if (device) {
            const updates: Partial<Device> = {};
            if (leg === 1) {
              updates.shipmentStatus = 'in_transit_to_fc' as ShipmentStatus;
              updates.fcLocation = shipment.destination;
              updates.leg1Carrier = shipment.carrier;
              updates.leg1Tracking = shipment.trackingNumber;
              updates.leg1Date = shipment.shippedDate;
            } else {
              updates.shipmentStatus = 'in_transit_to_tester' as ShipmentStatus;
              updates.leg2Carrier = shipment.carrier;
              updates.leg2Tracking = shipment.trackingNumber;
              updates.leg2Date = shipment.shippedDate;
              if (shipment.destinationEmail) {
                updates.assignedEmail = shipment.destinationEmail;
                updates.assignedTo = shipment.destinationEmail.split('@')[0];
                updates.checkedOutTo = shipment.destinationEmail.split('@')[0];
              }
            }
            get().updateDevice(device.id, updates);

            // Add history entry
            get().addHistoryEntry({
              id: crypto.randomUUID(),
              deviceId: device.id,
              timestamp: new Date().toISOString(),
              action: leg === 1 ? 'shipped_to_fc' : 'shipped_to_tester',
              user: 'System',
              description: leg === 1
                ? `Shipped to FC ${shipment.destination} via ${shipment.carrier} (${shipment.trackingNumber})`
                : `Shipped to ${shipment.destinationEmail || shipment.destination} via ${shipment.carrier} (${shipment.trackingNumber})`,
            });
          }
        });
      },

      markShipmentDelivered: (shipmentId) => {
        const shipment = get().shipments.find((s) => s.id === shipmentId);
        if (!shipment) return;

        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === shipmentId ? { ...s, status: 'delivered', deliveredDate: new Date().toISOString() } : s
          ),
        }));

        // Update device statuses
        shipment.serials.forEach((serial) => {
          const device = get().devices.find((d) => d.serialNumber.toLowerCase() === serial.toLowerCase());
          if (device) {
            const newStatus: ShipmentStatus = shipment.leg === 1 ? 'at_fc' : 'delivered';
            get().updateDevice(device.id, { shipmentStatus: newStatus });

            get().addHistoryEntry({
              id: crypto.randomUUID(),
              deviceId: device.id,
              timestamp: new Date().toISOString(),
              action: shipment.leg === 1 ? 'arrived_at_fc' : 'delivered_to_tester',
              user: 'System',
              description: shipment.leg === 1
                ? `Arrived at FC ${shipment.destination}`
                : `Delivered to ${shipment.destinationEmail || shipment.destination}`,
            });
          }
        });
      },

      getShipmentsForDevice: (serial) =>
        get().shipments.filter((s) => s.serials.some((sn) => sn.toLowerCase() === serial.toLowerCase())),

      getAllShipments: () =>
        get().shipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      // ─── Network Sync ───────────────────────────────────────────────────────
      syncNetworkStatus: (onlineSerials) => {
        let updated = 0;
        onlineSerials.forEach((serial) => {
          const device = get().devices.find((d) => d.serialNumber.toUpperCase() === serial.toUpperCase());
          if (device && device.status !== 'online' && device.status !== 'deactivated') {
            set((state) => ({
              devices: state.devices.map((d) =>
                d.id === device.id
                  ? { ...d, status: 'online' as DeviceStatus, shipmentStatus: 'online' as ShipmentStatus, updatedAt: new Date().toISOString() }
                  : d
              ),
              deviceHistory: [...state.deviceHistory, {
                id: crypto.randomUUID(),
                deviceId: device.id,
                timestamp: new Date().toISOString(),
                action: 'came_online',
                user: 'Network Sync',
                description: `Device detected online on network`,
              }],
            }));
            updated++;
          }
        });

        // Update sync metadata
        const onlineCount = get().devices.filter((d) => d.status === 'online').length;
        set((state) => ({
          syncMetadata: {
            ...state.syncMetadata,
            lastFullSync: new Date().toISOString(),
            lastNetworkCheck: new Date().toISOString(),
            syncInProgress: false,
            lastSyncDeviceCount: state.devices.length,
            lastSyncOnlineCount: onlineCount,
          },
        }));

        return updated;
      },

      updateSyncMetadata: (updates) =>
        set((state) => ({ syncMetadata: { ...state.syncMetadata, ...updates } })),

      isSyncStale: () => {
        const { lastFullSync } = get().syncMetadata;
        if (!lastFullSync) return true;
        const hoursSinceSync = (Date.now() - new Date(lastFullSync).getTime()) / (1000 * 60 * 60);
        return hoursSinceSync >= 24;
      },

      isRateLimited: () => {
        const { rateLimitedUntil } = get().syncMetadata;
        if (!rateLimitedUntil) return false;
        return new Date(rateLimitedUntil).getTime() > Date.now();
      },

      // ─── Attachments ──────────────────────────────────────────────────────
      addAttachment: (attachment) => {
        set((state) => ({ attachments: [...state.attachments, attachment] }));

        // Log to device history if attached to a device
        if (attachment.deviceId) {
          get().addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId: attachment.deviceId,
            timestamp: new Date().toISOString(),
            action: 'file_attached',
            user: attachment.uploadedBy,
            description: `File attached: ${attachment.fileName} (${attachment.attachmentType.replace(/_/g, ' ')})`,
          });
        }
      },

      deleteAttachment: (id) =>
        set((state) => ({ attachments: state.attachments.filter((a) => a.id !== id) })),

      getAttachmentsForDevice: (deviceId) =>
        get().attachments.filter((a) => a.deviceId === deviceId),

      getAttachmentsForShipment: (shipmentId) =>
        get().attachments.filter((a) => a.shipmentId === shipmentId),

      // ─── Closed Programs ──────────────────────────────────────────────────
      addClosedProgram: (record) =>
        set((state) => ({ closedPrograms: [...state.closedPrograms, record] })),

      addProcessedDevicesToProgram: (program, actions) => {
        const existing = get().closedPrograms.find((cp) => cp.program === program);
        if (existing) {
          // Append to existing record
          set((state) => ({
            closedPrograms: state.closedPrograms.map((cp) =>
              cp.program === program
                ? { ...cp, actions: [...cp.actions, ...actions], totalDevices: cp.totalDevices + actions.length }
                : cp
            ),
          }));
        } else {
          // Create new record (program closure in progress)
          set((state) => ({
            closedPrograms: [...state.closedPrograms, {
              id: crypto.randomUUID(),
              program,
              closedAt: new Date().toISOString(),
              closedBy: 'Admin',
              totalDevices: actions.length,
              actions,
            }],
          }));
        }
      },

      getClosedPrograms: () => get().closedPrograms,

      // ─── Opt-Out Tracking ─────────────────────────────────────────────────
      addOptOut: (record) =>
        set((state) => ({ optOutRecords: [...state.optOutRecords, record] })),

      getOptOuts: () => get().optOutRecords,

      removeOptOut: (personEmail) =>
        set((state) => ({
          optOutRecords: state.optOutRecords.filter((r) => r.personEmail.toLowerCase() !== personEmail.toLowerCase()),
        })),

      updateOptOutChecklist: (id, field, user) =>
        set((state) => ({
          optOutRecords: state.optOutRecords.map((r) => {
            if (r.id !== id) return r;
            const now = new Date().toISOString();
            const checklist = r.checklist || {
              adminRemoved: false, qualtricsRemoved: false, devicesOffboarded: false, allCompleted: false,
            };
            const updated = { ...checklist };
            if (field === 'adminRemoved') { updated.adminRemoved = true; updated.adminRemovedAt = now; updated.adminRemovedBy = user; }
            if (field === 'qualtricsRemoved') { updated.qualtricsRemoved = true; updated.qualtricsRemovedAt = now; updated.qualtricsRemovedBy = user; }
            if (field === 'devicesOffboarded') { updated.devicesOffboarded = true; updated.devicesOffboardedAt = now; updated.devicesOffboardedBy = user; }
            updated.allCompleted = updated.adminRemoved && updated.qualtricsRemoved && updated.devicesOffboarded;
            if (updated.allCompleted && !updated.completedAt) updated.completedAt = now;
            return { ...r, checklist: updated };
          }),
        })),

      // ─── Tester Profiles ──────────────────────────────────────────────────
      upsertTesterProfile: (profileData) => {
        const email = profileData.email.toLowerCase().trim();
        // Search by primary email OR any additional email
        const existing = get().testerProfiles.find((p) =>
          p.email.toLowerCase() === email ||
          (p.additionalEmails || []).some((e) => e.toLowerCase() === email)
        );

        if (existing) {
          const updates: Partial<TesterProfile> = { updatedAt: new Date().toISOString() };
          if (profileData.name && profileData.name !== existing.name) updates.name = profileData.name;
          if (profileData.contactEmail && profileData.contactEmail !== existing.contactEmail) updates.contactEmail = profileData.contactEmail;
          if (profileData.alternateEmail && profileData.alternateEmail !== existing.alternateEmail) updates.alternateEmail = profileData.alternateEmail;
          if (profileData.country && profileData.country !== existing.country) updates.country = profileData.country;
          if (profileData.location && profileData.location !== existing.location) updates.location = profileData.location;
          if (profileData.networkId && profileData.networkId !== existing.networkId) updates.networkId = profileData.networkId;
          if (profileData.adminId && profileData.adminId !== existing.adminId) updates.adminId = profileData.adminId;
          if (profileData.internetSpeed && profileData.internetSpeed !== existing.internetSpeed) updates.internetSpeed = profileData.internetSpeed;
          if (profileData.notes && profileData.notes !== existing.notes) updates.notes = profileData.notes;
          // Merge programs
          if (profileData.programs) {
            updates.programs = Array.from(new Set([...existing.programs, ...profileData.programs]));
          }
          // Merge additional emails — add the incoming email if it's not already tracked
          const allEmails = new Set([...(existing.additionalEmails || []).map((e) => e.toLowerCase())]);
          if (email !== existing.email.toLowerCase()) allEmails.add(email);
          if (profileData.additionalEmails) profileData.additionalEmails.forEach((e) => allEmails.add(e.toLowerCase()));
          updates.additionalEmails = Array.from(allEmails).filter((e) => e !== existing.email.toLowerCase());

          set((state) => ({
            testerProfiles: state.testerProfiles.map((p) =>
              p.id === existing.id ? { ...p, ...updates } : p
            ),
          }));
        } else {
          // Generate stable tester ID (TST-XXXXX)
          const nextNum = get().testerProfiles.length + 1;
          const testerId = `TST-${String(nextNum).padStart(5, '0')}`;

          const newProfile: TesterProfile = {
            id: crypto.randomUUID(),
            testerId,
            email: email,
            additionalEmails: profileData.additionalEmails || [],
            name: profileData.name || '',
            contactEmail: profileData.contactEmail || '',
            alternateEmail: profileData.alternateEmail || '',
            country: profileData.country || '',
            location: profileData.location || '',
            networkId: profileData.networkId || '',
            adminId: profileData.adminId || '',
            internetSpeed: profileData.internetSpeed || '',
            notes: profileData.notes || '',
            programs: profileData.programs || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ testerProfiles: [...state.testerProfiles, newProfile] }));
        }
      },

      getTesterProfile: (email) => {
        const e = email.toLowerCase().trim();
        return get().testerProfiles.find((p) =>
          p.email.toLowerCase() === e ||
          (p.additionalEmails || []).some((a) => a.toLowerCase() === e)
        );
      },

      getAllTesterProfiles: () => get().testerProfiles,

      findDuplicateProfiles: (name, email) => {
        const nameLower = name.toLowerCase().trim();
        const emailLower = email.toLowerCase().trim();
        return get().testerProfiles.filter((p) => {
          if (p.email.toLowerCase() === emailLower) return false; // exact match is not a "duplicate" — it's the same
          // Check if name matches closely
          if (nameLower && p.name.toLowerCase() === nameLower) return true;
          // Check if email appears in additional emails
          if ((p.additionalEmails || []).some((e) => e.toLowerCase() === emailLower)) return true;
          // Check if first+last name words overlap significantly
          const nameWords = nameLower.split(/\s+/);
          const profileWords = p.name.toLowerCase().split(/\s+/);
          const overlap = nameWords.filter((w) => profileWords.includes(w) && w.length > 2);
          if (overlap.length >= 2) return true;
          return false;
        });
      },

      mergeProfiles: (targetId, sourceEmail) => {
        const target = get().testerProfiles.find((p) => p.id === targetId);
        if (!target) return;
        const email = sourceEmail.toLowerCase().trim();
        // Add the source email to the target's additional emails
        const additionalEmails = new Set([...(target.additionalEmails || []).map((e) => e.toLowerCase()), email]);
        additionalEmails.delete(target.email.toLowerCase()); // don't duplicate primary
        set((state) => ({
          testerProfiles: state.testerProfiles.map((p) =>
            p.id === targetId ? { ...p, additionalEmails: Array.from(additionalEmails), updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      applyTesterProfile: (deviceId, email) => {
        const profile = get().getTesterProfile(email);
        if (!profile) return;

        const updates: Partial<Device> = {};
        if (profile.name) updates.assignedTo = profile.name;
        if (profile.contactEmail) updates.contactEmail = profile.contactEmail;
        if (profile.alternateEmail) updates.alternateEmail = profile.alternateEmail;
        if (profile.country) updates.country = profile.country;
        if (profile.location) updates.location = profile.location;
        if (profile.networkId) updates.network = profile.networkId;
        if (profile.adminId) updates.adminId = profile.adminId;
        if (profile.name) updates.checkedOutTo = profile.name;

        if (Object.keys(updates).length > 0) {
          get().updateDevice(deviceId, updates);
        }
      },

      // Bulk actions
      clearAllData: () =>
        set({ devices: [], testbeds: [], locations: [], people: [], checkoutHistory: [], deviceHistory: [], speedTests: [], jiraTickets: [], deactivationRecords: [], overdueAlerts: [], shipments: [], attachments: [], closedPrograms: [], optOutRecords: [], testerProfiles: [] }),
    }),
    {
      name: 'device-tracker-storage',
    }
  )
);

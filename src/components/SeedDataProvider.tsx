'use client';

import { useEffect, useRef, useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useBetaProgramsStore } from '@/store/betaProgramsStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';
import { FILLER_EMAILS } from '@/components/programs/data';
import { seedAssignments, toStoreDevice } from '@/components/programs/helpers';
import type { Device } from '@/types';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson, getPersonByEmail, removePerson, testerProfiles, upsertTesterProfile } = useDeviceStore();
  const seeded = useRef(false);
  const rosterSeeded = useRef(false);
  const programDevicesSeeded = useRef(false);
  // Both persisted stores must be rehydrated before deciding what to seed —
  // otherwise we'd act on the defaults (INITIAL_PROGRAMS, seeded flag false).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const check = () => setHydrated(useDeviceStore.persist.hasHydrated() && useBetaProgramsStore.persist.hasHydrated());
    check();
    const unsubDevices = useDeviceStore.persist.onFinishHydration(check);
    const unsubPrograms = useBetaProgramsStore.persist.onFinishHydration(check);
    return () => { unsubDevices(); unsubPrograms(); };
  }, []);

  useEffect(() => {
    if (devices.length > 0 || seeded.current) return;
    seeded.current = true;

    addDevices(allSeedDevices);
    seedPeople.forEach((p) => addPerson(p));

    // Build tester profiles from seed data
    if (testerProfiles.length === 0) {
      allSeedDevices.forEach((d) => {
        if (!d.assignedEmail) return;
        upsertTesterProfile({
          email: d.assignedEmail,
          name: d.assignedTo || '',
          contactEmail: d.contactEmail || '',
          alternateEmail: d.alternateEmail || '',
          country: d.country || '',
          location: d.location || '',
          networkId: d.network || '',
          adminId: d.unitId || d.adminId || '',
          programs: [d.program],
        });
      });
    }
  }, [devices.length, addDevices, people, addPerson, testerProfiles.length, upsertTesterProfile]);

  // Roster-aware People: seed every program's Qualtrics roster as people, so a
  // tester appears the moment they're on a program — even with no device yet.
  // Idempotent (guarded per-email) and runs independently of the device seed, so
  // it also backfills existing persisted stores. upsertTesterProfile unions the
  // program name into the profile, which drives the "Programs" column fallback.
  // The roster comes from the PERSISTED programs (not the static INITIAL_PROGRAMS),
  // so a tester removed from a program isn't re-added on the next load.
  useEffect(() => {
    if (!hydrated || rosterSeeded.current) return;
    rosterSeeded.current = true;
    // Purge any pagination-only filler testers that a prior version seeded into
    // the persisted People store, so they don't clutter People.
    FILLER_EMAILS.forEach((email) => removePerson(email));
    // Seed real roster testers as people (idempotent per-email).
    useBetaProgramsStore.getState().programs.forEach((program) => {
      program.testers.filter((t) => !t.noSeedDevice).forEach(({ name, email }) => {
        if (!getPersonByEmail(email)) {
          addPerson({ id: crypto.randomUUID(), name, email, team: '', devices: [] });
        }
        upsertTesterProfile({ email, name, programs: [program.name] });
      });
    });

    // Illustrative duplicate for the People "Possible Duplicates" review: the
    // same seed tester (Shakeel Ahmad, who has a device under shkahma@amazon.com
    // in Kew, VIC) also appears under a personal email with no device. Same name
    // + same location → surfaced as a possible duplicate to confirm-merge.
    // Safe to remove — purely to demonstrate the feature.
    if (!getPersonByEmail('shakeel.ahmad@gmail.com')) {
      addPerson({ id: crypto.randomUUID(), name: 'Shakeel Ahmad', email: 'shakeel.ahmad@gmail.com', team: '', devices: [] });
    }
    upsertTesterProfile({ email: 'shakeel.ahmad@gmail.com', name: 'Shakeel Ahmad', location: 'Kew, VIC', programs: ['Merci Beta'] });
  }, [hydrated, addPerson, getPersonByEmail, removePerson, upsertTesterProfile]);

  // Seed programs' demo devices into deviceStore ONCE (persisted flag). From then on
  // deviceStore is the only source of program devices, so deleting / unassigning a
  // device or removing a tester sticks across reloads. Runs after the device seed
  // above (same commit, effects run in order) and skips serials already present.
  useEffect(() => {
    if (!hydrated || programDevicesSeeded.current) return;
    programDevicesSeeded.current = true;
    const { programs, seededProgramDevices, markProgramDevicesSeeded } = useBetaProgramsStore.getState();
    if (seededProgramDevices) return;
    const { getDeviceBySerial } = useDeviceStore.getState();
    const seen = new Set<string>();
    const toAdd: Device[] = [];
    programs
      .filter((p) => p.type === 'hardware' && p.source !== 'upload')
      .forEach((program) => {
        const assignments = seedAssignments(program);
        program.testers.forEach((tester) => {
          (assignments[tester.id] || []).forEach((ad) => {
            const key = ad.serial.toLowerCase();
            if (seen.has(key) || getDeviceBySerial(ad.serial)) return;
            seen.add(key);
            toAdd.push(toStoreDevice(tester, ad, program));
          });
        });
      });
    if (toAdd.length) addDevices(toAdd);
    markProgramDevicesSeeded();
  }, [hydrated, addDevices]);

  return <>{children}</>;
}

'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';
import { ROSTER_SEED, FILLER_EMAILS } from '@/components/programs/ProgramsView';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson, getPersonByEmail, removePerson, testerProfiles, upsertTesterProfile } = useDeviceStore();
  const seeded = useRef(false);
  const rosterSeeded = useRef(false);

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
  useEffect(() => {
    if (rosterSeeded.current) return;
    rosterSeeded.current = true;
    // Purge any pagination-only filler testers that a prior version seeded into
    // the persisted People store, so they don't clutter People.
    FILLER_EMAILS.forEach((email) => removePerson(email));
    // Seed real roster testers as people (idempotent per-email).
    ROSTER_SEED.forEach(({ name, email, program }) => {
      if (!getPersonByEmail(email)) {
        addPerson({ id: crypto.randomUUID(), name, email, team: '', devices: [] });
      }
      upsertTesterProfile({ email, name, programs: [program] });
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
  }, [addPerson, getPersonByEmail, removePerson, upsertTesterProfile]);

  return <>{children}</>;
}

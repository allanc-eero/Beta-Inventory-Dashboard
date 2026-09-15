'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';
import { ROSTER_SEED } from '@/components/SurveysDemo';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson, getPersonByEmail, testerProfiles, upsertTesterProfile } = useDeviceStore();
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
    ROSTER_SEED.forEach(({ name, email, program }) => {
      if (!getPersonByEmail(email)) {
        addPerson({ id: crypto.randomUUID(), name, email, team: '', devices: [] });
      }
      upsertTesterProfile({ email, name, programs: [program] });
    });
  }, [addPerson, getPersonByEmail, upsertTesterProfile]);

  return <>{children}</>;
}

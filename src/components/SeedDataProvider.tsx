'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson, testerProfiles, upsertTesterProfile } = useDeviceStore();
  const seeded = useRef(false);

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

  return <>{children}</>;
}

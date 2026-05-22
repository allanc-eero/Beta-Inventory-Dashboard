'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson, testerProfiles, upsertTesterProfile } = useDeviceStore();
  const seeded = useRef(false);

  useEffect(() => {
    // Only seed if the store is empty and we haven't already seeded this session
    if (devices.length === 0 && !seeded.current) {
      seeded.current = true;
      addDevices(allSeedDevices);
      seedPeople.forEach((p) => addPerson(p));

      // Build tester profiles from seed devices
      if (testerProfiles.length === 0) {
        allSeedDevices.forEach((d) => {
          if (d.assignedEmail) {
            upsertTesterProfile({
              email: d.assignedEmail,
              name: d.assignedTo || '',
              contactEmail: d.contactEmail || '',
              alternateEmail: d.alternateEmail || '',
              country: d.country || '',
              location: d.location || '',
              networkId: d.network || '',
              adminId: d.adminId || '',
              programs: [d.program],
            });
          }
        });
      }
    }
  }, [devices.length, addDevices, people, addPerson, testerProfiles.length, upsertTesterProfile]);

  return <>{children}</>;
}

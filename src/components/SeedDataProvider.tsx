'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { allSeedDevices, seedPeople } from '@/data/seedData';

export default function SeedDataProvider({ children }: { children: React.ReactNode }) {
  const { devices, addDevices, people, addPerson } = useDeviceStore();
  const seeded = useRef(false);

  useEffect(() => {
    // Only seed if the store is empty and we haven't already seeded this session
    if (devices.length === 0 && !seeded.current) {
      seeded.current = true;
      addDevices(allSeedDevices);
      seedPeople.forEach((p) => addPerson(p));
    }
  }, [devices.length, addDevices, people, addPerson]);

  return <>{children}</>;
}

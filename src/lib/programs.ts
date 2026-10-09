import type { Device } from '@/types';

// The named program a device belongs to. Sheet uploads and program assignment set
// `programName`. Rows saved before that field existed fall back to testbedName for
// program-assigned ('prog-') devices (same convention as PeopleTab), then to
// product + cohort ("Merci beta"), which lines up with the seeded "Merci Beta".
type ProgramFields = Pick<Device, 'programName' | 'product' | 'program'> & Partial<Pick<Device, 'id' | 'testbedName'>>;

export function deviceProgramName(d: ProgramFields): string {
  if (d.programName !== undefined) return d.programName; // '' = explicitly detached (program deleted)
  if (d.id?.startsWith('prog-') && d.testbedName) return d.testbedName;
  if (!d.program) return '';
  return d.product ? `${d.product} ${d.program}` : d.program;
}

// Case-insensitive key used to group devices and match them to a program card.
export function programKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function deviceInProgram(d: ProgramFields, programName: string): boolean {
  const name = deviceProgramName(d);
  return !!name && programKey(name) === programKey(programName);
}

// A program's devices that still count toward it (not archived/returned). Shared by
// the Programs cards, the program roster, and the Dashboard so they always agree.
export function liveProgramDevices<T extends ProgramFields & Pick<Device, 'status'>>(devices: T[], programName: string): T[] {
  return devices.filter((d) => d.status !== 'deactivated' && d.status !== 'pending_return' && deviceInProgram(d, programName));
}

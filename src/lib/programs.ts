import type { Device } from '@/types';

// The named program a device belongs to. Sheet uploads and program assignment set
// `programName`. Rows saved before that field existed fall back to testbedName for
// program-assigned ('prog-') devices (same convention as PeopleTab), then to
// product + cohort ("Merci beta"), which lines up with the seeded "Merci Beta".
type ProgramFields = Pick<Device, 'programName' | 'product' | 'program'> & Partial<Pick<Device, 'id' | 'testbedName'>>;

export function deviceProgramName(d: ProgramFields): string {
  if (d.programName) return d.programName;
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

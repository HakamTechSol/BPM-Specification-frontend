import type { PitchStatus } from "@/components/bp";

export type Pitch = {
  id: string;
  name: string;
  number: string;
  status: PitchStatus;
  guest?: string;
  currentAmp: number;
  maxAmp: number;
  todayKwh: number;
  totalKwh: number;
  checkedIn: boolean;
};

export const pitches: Pitch[] = [
  { id: "A12", name: "Dune View A12", number: "A-12", status: "on", guest: "Fam. Bakker", currentAmp: 6.4, maxAmp: 10, todayKwh: 4.8, totalKwh: 128.4, checkedIn: true },
  { id: "A13", name: "Dune View A13", number: "A-13", status: "warning", guest: "Fam. Weber", currentAmp: 9.6, maxAmp: 10, todayKwh: 12.1, totalKwh: 84.2, checkedIn: true },
  { id: "B02", name: "Meadow B02", number: "B-02", status: "off", currentAmp: 0, maxAmp: 6, todayKwh: 0, totalKwh: 0, checkedIn: false },
  { id: "B07", name: "Meadow B07", number: "B-07", status: "on", guest: "M. Jansen", currentAmp: 2.1, maxAmp: 16, todayKwh: 1.4, totalKwh: 62.9, checkedIn: true },
  { id: "C01", name: "Forest C01", number: "C-01", status: "critical", guest: "T. Larsen", currentAmp: 0, maxAmp: 10, todayKwh: 0, totalKwh: 220.7, checkedIn: true },
  { id: "C04", name: "Forest C04", number: "C-04", status: "remote", currentAmp: 0.3, maxAmp: 10, todayKwh: 0.2, totalKwh: 12.6, checkedIn: false },
  { id: "C08", name: "Forest C08", number: "C-08", status: "inactive", currentAmp: 0, maxAmp: 0, todayKwh: 0, totalKwh: 0, checkedIn: false },
  { id: "D05", name: "Lakeside D05", number: "D-05", status: "on", guest: "P. Rossi", currentAmp: 4.7, maxAmp: 10, todayKwh: 6.2, totalKwh: 315.2, checkedIn: true },
  { id: "D06", name: "Lakeside D06", number: "D-06", status: "on", guest: "K. Müller", currentAmp: 3.2, maxAmp: 10, todayKwh: 3.9, totalKwh: 41.0, checkedIn: true },
  { id: "E01", name: "Orchard E01", number: "E-01", status: "warning", guest: "Fam. Dupont", currentAmp: 5.9, maxAmp: 6, todayKwh: 8.2, totalKwh: 74.5, checkedIn: true },
];

export function getPitch(id: string): Pitch | undefined {
  return pitches.find((p) => p.id === id) || pitches.find((p) => p.number === id);
}

export interface TimetableEntry { date: string; day: string; preferred: string; paperDay?: boolean }

export const USER_TIMETABLE: TimetableEntry[] = [
  { date: '2026-04-24', day: 'Friday', preferred: 'JEEADV - 2024', paperDay: true },
  { date: '2026-04-25', day: 'Saturday', preferred: 'Analysis' },
  { date: '2026-04-26', day: 'Sunday', preferred: 'AIOT - 2', paperDay: true },
  { date: '2026-04-27', day: 'Monday', preferred: 'Class + Analysis' },
  { date: '2026-04-28', day: 'Tuesday', preferred: 'JEEADV - 2022', paperDay: true },
  { date: '2026-04-29', day: 'Wednesday', preferred: 'Analysis' },
  { date: '2026-04-30', day: 'Thursday', preferred: 'JEEADV - 2021', paperDay: true },
  { date: '2026-05-01', day: 'Friday', preferred: 'Class + Analysis' },
  { date: '2026-05-02', day: 'Saturday', preferred: 'Analysis' },
  { date: '2026-05-03', day: 'Sunday', preferred: 'AIOT - 2', paperDay: true },
  { date: '2026-05-04', day: 'Monday', preferred: 'Analysis' },
  { date: '2026-05-05', day: 'Tuesday', preferred: 'JEEADV - 2023', paperDay: true },
  { date: '2026-05-06', day: 'Wednesday', preferred: 'Class + Analysis' },
  { date: '2026-05-07', day: 'Thursday', preferred: 'Analysis' },
  { date: '2026-05-08', day: 'Friday', preferred: 'JEEADV - 2025', paperDay: true },
  { date: '2026-05-09', day: 'Saturday', preferred: 'Analysis' },
  { date: '2026-05-10', day: 'Sunday', preferred: 'AIOT - 2', paperDay: true },
  { date: '2026-05-11', day: 'Monday', preferred: 'Analysis' },
  { date: '2026-05-12', day: 'Tuesday', preferred: 'Reattempt BEST Internal Test', paperDay: true },
  { date: '2026-05-13', day: 'Wednesday', preferred: 'Analysis' },
  { date: '2026-05-14', day: 'Thursday', preferred: 'WRAP UP' },
  { date: '2026-05-15', day: 'Friday', preferred: 'WRAP UP' },
  { date: '2026-05-16', day: 'Saturday', preferred: 'WRAP UP' },
  { date: '2026-05-17', day: 'Sunday', preferred: 'Phod Daalao!', paperDay: true },
];

export function getAgendaForDate(date = new Date()): TimetableEntry | undefined {
  const key = date.toISOString().slice(0, 10);
  return USER_TIMETABLE.find(x => x.date === key);
}

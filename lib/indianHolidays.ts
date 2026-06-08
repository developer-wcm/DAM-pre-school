import { supabase } from './supabase';

export interface IndianHoliday {
  name: string;
  date: string;
  date_to: string | null;
  days: number;
}

const NAGER_BASE = 'https://date.nager.at/api/v3/PublicHolidays';

async function fetchNagerHolidays(year: number): Promise<IndianHoliday[]> {
  const res = await fetch(`${NAGER_BASE}/${year}/IN`);
  if (!res.ok) throw new Error(`Nager API error ${res.status}`);
  const data: Array<{ date: string; name: string; localName: string }> = await res.json();
  return data.map((h) => ({
    name: h.localName || h.name,
    date: h.date,
    date_to: null,
    days: 1,
  }));
}

export async function getIndianHolidays(
  schoolId: string,
  todayKey: string
): Promise<IndianHoliday[]> {
  const year = new Date(todayKey).getFullYear();

  // First try Supabase
  const { data: dbHolidays, error } = await supabase
    .from('holidays')
    .select('name, date, date_to, days')
    .eq('school_id', schoolId)
    .order('date', { ascending: true })
    .limit(100);

  if (!error && dbHolidays && dbHolidays.length > 0) {
    return dbHolidays as IndianHoliday[];
  }

  // Fall back to Nager.Date API — fetch current + next year
  const [thisYear, nextYear] = await Promise.all([
    fetchNagerHolidays(year),
    fetchNagerHolidays(year + 1),
  ]);
  const allHolidays = [...thisYear, ...nextYear].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Sync to Supabase so future loads are fast (fire-and-forget, only runs when DB had 0 rows)
  if (schoolId) {
    const rows = allHolidays.map((h) => ({
      school_id: schoolId,
      name: h.name,
      date: h.date,
      date_to: h.date_to,
      days: h.days,
    }));
    supabase.from('holidays').insert(rows).then(() => {});
  }

  return allHolidays;
}

interface Holiday {
  name: string;
  isSubstitute: boolean;
}

type HolidayCache = Record<number, Map<string, Holiday>>;

const cache: HolidayCache = {};

// Fixed holidays (MM-DD format)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

// Lunar-based holidays for 2025-2027
const LUNAR_HOLIDAYS: Record<number, Array<{ month: number; day: number; name: string; isSubstitute?: boolean }>> = {
  2025: [
    { month: 1, day: 28, name: '설날' },
    { month: 1, day: 29, name: '설날' },
    { month: 1, day: 30, name: '설날' },
    { month: 5, day: 5, name: '석가탄신일' },
    { month: 5, day: 6, name: '대체공휴일', isSubstitute: true },
    { month: 10, day: 5, name: '추석' },
    { month: 10, day: 6, name: '추석' },
    { month: 10, day: 7, name: '추석' },
    { month: 10, day: 8, name: '대체공휴일', isSubstitute: true },
  ],
  2026: [
    { month: 2, day: 17, name: '설날' },
    { month: 2, day: 18, name: '설날' },
    { month: 2, day: 19, name: '설날' },
    { month: 3, day: 2, name: '대체공휴일', isSubstitute: true },
    { month: 5, day: 24, name: '석가탄신일' },
    { month: 5, day: 25, name: '대체공휴일', isSubstitute: true },
    { month: 9, day: 24, name: '추석' },
    { month: 9, day: 25, name: '추석' },
    { month: 9, day: 26, name: '추석' },
  ],
  2027: [
    { month: 2, day: 6, name: '설날' },
    { month: 2, day: 7, name: '설날' },
    { month: 2, day: 8, name: '설날' },
    { month: 2, day: 9, name: '대체공휴일', isSubstitute: true },
    { month: 5, day: 13, name: '석가탄신일' },
    { month: 9, day: 14, name: '추석' },
    { month: 9, day: 15, name: '추석' },
    { month: 9, day: 16, name: '추석' },
  ],
};

function buildYearCache(year: number): Map<string, Holiday> {
  if (cache[year]) {
    return cache[year];
  }

  const yearCache = new Map<string, Holiday>();

  // Add fixed holidays
  Object.entries(FIXED_HOLIDAYS).forEach(([date, name]) => {
    yearCache.set(date, { name, isSubstitute: false });
  });

  // Add lunar-based holidays
  if (LUNAR_HOLIDAYS[year]) {
    LUNAR_HOLIDAYS[year].forEach(({ month, day, name, isSubstitute }) => {
      const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      yearCache.set(dateStr, { name, isSubstitute: isSubstitute || false });
    });
  }

  cache[year] = yearCache;
  return yearCache;
}

export function getHoliday(date: Date): Holiday | null {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;

  const yearCache = buildYearCache(year);
  return yearCache.get(dateStr) || null;
}

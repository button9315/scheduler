import { isToday, isTomorrow, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';

export function getWeekLabel(date: Date): string | null {
  const now = new Date();
  if (isToday(date)) return '오늘!';
  if (isTomorrow(date)) return '내일~';
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  if (isWithinInterval(date, { start: weekStart, end: weekEnd })) return '이번주';
  const nextWeekStart = addWeeks(weekStart, 1);
  const nextWeekEnd = addWeeks(weekEnd, 1);
  if (isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) return '다음주';
  return null;
}

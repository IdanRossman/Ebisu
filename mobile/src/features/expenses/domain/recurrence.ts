export type RecurrenceFrequency = 'weekly' | 'monthly';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function dayOfMonth(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).getDate();
}

export function weekdayIndex(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).getDay();
}

export function weekdayLabel(index: number) {
  return WEEKDAYS[index] ?? WEEKDAYS[0];
}

export function ordinalDay(day: number) {
  const suffix = day % 10 === 1 && day !== 11
    ? 'st'
    : day % 10 === 2 && day !== 12
      ? 'nd'
      : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';
  return `${day}${suffix}`;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function nextMonthlyDueDate(startKey: string, requestedDay: number) {
  const start = new Date(`${startKey}T12:00:00`);
  let year = start.getFullYear();
  let monthIndex = start.getMonth() + 1;
  if (monthIndex > 11) {
    monthIndex = 0;
    year += 1;
  }
  return toDateKey(new Date(year, monthIndex, Math.min(requestedDay, daysInMonth(year, monthIndex)), 12));
}

export function nextWeeklyDueDate(startKey: string, requestedWeekday: number) {
  const start = new Date(`${startKey}T12:00:00`);
  const daysUntil = (requestedWeekday - start.getDay() + 7) % 7 || 7;
  const next = new Date(start);
  next.setDate(start.getDate() + daysUntil);
  return toDateKey(next);
}

export function recurrenceSummary(frequency: RecurrenceFrequency, monthlyDay: number, weeklyDay: number) {
  return frequency === 'monthly'
    ? `Repeats monthly on the ${ordinalDay(monthlyDay)}`
    : `Repeats every ${weekdayLabel(weeklyDay)}`;
}

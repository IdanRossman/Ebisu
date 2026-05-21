export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function advanceDueDate(
  dateKey: string,
  frequency: RecurrenceFrequency,
  interval: number,
  anchorDayOfMonth?: number | null,
) {
  const date = new Date(`${dateKey}T12:00:00`);

  if (frequency === 'daily') {
    date.setDate(date.getDate() + interval);
    return toDateKey(date);
  }

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + (7 * interval));
    return toDateKey(date);
  }

  if (frequency === 'yearly') {
    const nextYear = date.getFullYear() + interval;
    const nextMonth = date.getMonth();
    const nextDay = Math.min(date.getDate(), daysInMonth(nextYear, nextMonth));
    return toDateKey(new Date(nextYear, nextMonth, nextDay, 12));
  }

  const monthNumber = date.getMonth() + interval;
  const nextYear = date.getFullYear() + Math.floor(monthNumber / 12);
  const nextMonth = ((monthNumber % 12) + 12) % 12;
  const nextDay = Math.min(anchorDayOfMonth ?? date.getDate(), daysInMonth(nextYear, nextMonth));
  return toDateKey(new Date(nextYear, nextMonth, nextDay, 12));
}

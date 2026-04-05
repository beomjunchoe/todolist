const SEOUL_OFFSET_HOURS = 9;
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

type SeoulDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

export type WeekDay = {
  dateKey: string;
  shortLabel: string;
  dayNumber: number;
  monthNumber: number;
  weekdayNumber: number;
  isToday: boolean;
};

function toSeoulDateParts(date: Date): SeoulDateParts {
  const shifted = new Date(date.getTime() + SEOUL_OFFSET_HOURS * 60 * 60 * 1000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function createStableDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

export function getDateKey(date: Date) {
  const parts = toSeoulDateParts(date);
  const month = `${parts.month + 1}`.padStart(2, "0");
  const day = `${parts.day}`.padStart(2, "0");

  return `${parts.year}-${month}-${day}`;
}

export function getCurrentWeek(date = new Date()): WeekDay[] {
  const today = toSeoulDateParts(date);
  const startOffset = today.weekday;
  const sunday = createStableDate(today.year, today.month, today.day - startOffset);
  const todayKey = getDateKey(date);

  return Array.from({ length: 7 }, (_, index) => {
    const current = createStableDate(
      sunday.getUTCFullYear(),
      sunday.getUTCMonth(),
      sunday.getUTCDate() + index,
    );
    const parts = toSeoulDateParts(current);

    return {
      dateKey: getDateKey(current),
      shortLabel: DAY_NAMES[parts.weekday],
      dayNumber: parts.day,
      monthNumber: parts.month + 1,
      weekdayNumber: parts.weekday,
      isToday: getDateKey(current) === todayKey,
    };
  });
}

export function formatWeekRange(week: WeekDay[]) {
  const first = week[0];
  const last = week[week.length - 1];

  return `${first.monthNumber}/${first.dayNumber}(${first.shortLabel}) ~ ${last.monthNumber}/${last.dayNumber}(${last.shortLabel})`;
}

export function formatWeekColumnLabel(day: WeekDay) {
  return `${day.monthNumber}/${day.dayNumber}(${day.shortLabel})`;
}

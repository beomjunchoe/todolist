const SEOUL_OFFSET_HOURS = 9;
const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

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
  const mondayOffset = (today.weekday + 6) % 7;
  const monday = createStableDate(today.year, today.month, today.day - mondayOffset);
  const todayKey = getDateKey(date);

  return Array.from({ length: 7 }, (_, index) => {
    const current = createStableDate(
      monday.getUTCFullYear(),
      monday.getUTCMonth(),
      monday.getUTCDate() + index,
    );
    const parts = toSeoulDateParts(current);

    return {
      dateKey: getDateKey(current),
      shortLabel: DAY_NAMES[index],
      dayNumber: parts.day,
      isToday: getDateKey(current) === todayKey,
    };
  });
}

export function formatWeekRange(week: WeekDay[]) {
  const first = week[0];
  const last = week[week.length - 1];

  return `${first.dateKey} ~ ${last.dateKey}`;
}

export type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  monthNumber: number;
  weekdayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

function createStableDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
  return formatDateKey(new Date());
}

function parseMonthParam(value?: string) {
  const now = createStableDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );

  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return now;
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return now;
  }

  return createStableDate(year, month - 1, 1);
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function getCalendarMonth(value?: string) {
  const firstDay = parseMonthParam(value);
  const firstWeekday = firstDay.getDay();
  const gridStart = createStableDate(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - firstWeekday,
  );
  const lastDay = createStableDate(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
  );
  const lastWeekday = lastDay.getDay();
  const gridEnd = createStableDate(
    lastDay.getFullYear(),
    lastDay.getMonth(),
    lastDay.getDate() + (6 - lastWeekday),
  );
  const todayKey = getTodayDateKey();
  const weeks: CalendarDay[][] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const week: CalendarDay[] = [];

    for (let index = 0; index < 7; index += 1) {
      week.push({
        dateKey: formatDateKey(cursor),
        dayNumber: cursor.getDate(),
        monthNumber: cursor.getMonth() + 1,
        weekdayNumber: cursor.getDay(),
        isCurrentMonth: cursor.getMonth() === firstDay.getMonth(),
        isToday: formatDateKey(cursor) === todayKey,
      });
      cursor = createStableDate(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate() + 1,
      );
    }

    weeks.push(week);
  }

  return {
    monthKey: formatMonthKey(firstDay),
    monthLabel: `${firstDay.getFullYear()}년 ${firstDay.getMonth() + 1}월`,
    prevMonthKey: formatMonthKey(
      createStableDate(firstDay.getFullYear(), firstDay.getMonth() - 1, 1),
    ),
    nextMonthKey: formatMonthKey(
      createStableDate(firstDay.getFullYear(), firstDay.getMonth() + 1, 1),
    ),
    startDateKey: formatDateKey(gridStart),
    endDateKey: formatDateKey(gridEnd),
    weeks,
  };
}

export function expandEventDateKeys(startsOn: string, endsOn?: string | null) {
  const end = endsOn && endsOn >= startsOn ? endsOn : startsOn;
  const current = new Date(`${startsOn}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const dateKeys: string[] = [];

  while (current <= last) {
    dateKeys.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dateKeys;
}

export function formatEventDateRange(startsOn: string, endsOn?: string | null) {
  const start = new Date(`${startsOn}T12:00:00`);
  const end = endsOn ? new Date(`${endsOn}T12:00:00`) : null;

  if (!end || startsOn === endsOn) {
    return `${start.getMonth() + 1}/${start.getDate()}(${["일", "월", "화", "수", "목", "금", "토"][start.getDay()]})`;
  }

  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

export function getEventDdayLabel(
  todayDateKey: string,
  startsOn: string,
  endsOn?: string | null,
) {
  const target = endsOn && endsOn >= startsOn ? endsOn : startsOn;
  const today = new Date(`${todayDateKey}T12:00:00`);
  const eventDate = new Date(`${target}T12:00:00`);
  const diff = Math.round(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) {
    return "D-day";
  }

  if (diff > 0) {
    return `D-${diff}`;
  }

  return `D+${Math.abs(diff)}`;
}

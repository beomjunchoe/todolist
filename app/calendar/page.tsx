import Link from "next/link";

import {
  createClassEventAction,
  deleteClassEventAction,
  updateClassEventAction,
} from "@/app/actions";
import { AdminBadge } from "@/components/badges";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import {
  expandEventDateKeys,
  formatEventDateRange,
  getCalendarMonth,
  getEventDdayLabel,
  getTodayDateKey,
} from "@/lib/calendar";
import { listClassEventsInRange, type ClassEventRecord } from "@/lib/db";
import { SUBJECTS } from "@/lib/subjects";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
    subject?: string;
  }>;
};

const CATEGORY_OPTIONS = ["시험", "숙제", "준비물", "행사", "기타"];
const IMPORTANCE_OPTIONS = [
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
] as const;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getSubjectLabel(subjectSlug: string | null) {
  if (!subjectSlug) {
    return "공통";
  }

  return SUBJECTS.find((subject) => subject.slug === subjectSlug)?.name ?? "공통";
}

function getCategoryClasses(category: string) {
  switch (category) {
    case "시험":
      return "bg-[rgba(180,86,255,0.12)] text-[rgb(110,52,178)]";
    case "숙제":
      return "bg-[rgba(236,108,47,0.12)] text-[rgb(182,82,34)]";
    case "준비물":
      return "bg-[rgba(88,144,255,0.12)] text-[rgb(54,92,166)]";
    case "행사":
      return "bg-[rgba(57,168,115,0.14)] text-[rgb(41,123,84)]";
    default:
      return "bg-[rgba(19,34,29,0.08)] text-[var(--foreground)]";
  }
}

function getImportanceLabel(importance: ClassEventRecord["importance"]) {
  switch (importance) {
    case "high":
      return "중요";
    case "low":
      return "여유";
    default:
      return "보통";
  }
}

function getImportanceClasses(importance: ClassEventRecord["importance"]) {
  switch (importance) {
    case "high":
      return "bg-[rgba(190,47,47,0.12)] text-[rgb(155,38,38)]";
    case "low":
      return "bg-[rgba(57,168,115,0.12)] text-[rgb(41,123,84)]";
    default:
      return "bg-[rgba(255,196,0,0.16)] text-[rgb(135,98,8)]";
  }
}

function buildEventsByDate(events: ClassEventRecord[]) {
  const eventsByDate = new Map<string, ClassEventRecord[]>();

  for (const event of events) {
    for (const dateKey of expandEventDateKeys(event.startsOn, event.endsOn)) {
      const group = eventsByDate.get(dateKey) ?? [];
      group.push(event);
      eventsByDate.set(dateKey, group);
    }
  }

  return eventsByDate;
}

function EventCreateForm({ todayDateKey }: { todayDateKey: string }) {
  return (
    <form action={createClassEventAction} className="space-y-3">
      <label className="space-y-1 text-sm">
        <span className="font-medium">제목</span>
        <input
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          name="title"
          placeholder="예: 수학 수행평가"
          required
          type="text"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">분류</span>
          <select
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            defaultValue="시험"
            name="category"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">중요도</span>
          <select
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            defaultValue="high"
            name="importance"
          >
            {IMPORTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">과목</span>
          <select
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            defaultValue=""
            name="subjectSlug"
          >
            <option value="">공통</option>
            {SUBJECTS.map((subject) => (
              <option key={subject.slug} value={subject.slug}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">시작 날짜</span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            defaultValue={todayDateKey}
            name="startsOn"
            required
            type="date"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">종료 날짜</span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            name="endsOn"
            type="date"
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium">설명</span>
        <textarea
          className="min-h-28 w-full rounded-[20px] border border-[var(--line)] bg-white px-3 py-3 text-sm"
          name="description"
          placeholder="범위, 준비물, 장소 같은 내용을 적어두세요."
          required
        />
      </label>

      <button
        className="w-full rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
        type="submit"
      >
        일정 등록
      </button>
    </form>
  );
}

function EventCard({
  currentUserId,
  currentUserIsAdmin,
  event,
  todayDateKey,
}: {
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  event: ClassEventRecord;
  todayDateKey: string;
}) {
  const ddayLabel = getEventDdayLabel(todayDateKey, event.startsOn, event.endsOn);
  const canManage = currentUserIsAdmin || currentUserId === event.user.id;

  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-white/84 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCategoryClasses(
                event.category,
              )}`}
            >
              {event.category}
            </span>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
              {getSubjectLabel(event.subjectSlug)}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getImportanceClasses(
                event.importance,
              )}`}
            >
              {getImportanceLabel(event.importance)}
            </span>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]">
              {ddayLabel}
            </span>
          </div>
          <h3 className="text-base font-semibold">{event.title}</h3>
          <div className="text-[12px] leading-6 text-[var(--muted)]">
            {formatEventDateRange(event.startsOn, event.endsOn)} · {event.user.nickname}
          </div>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
        {event.description}
      </p>

      {canManage ? (
        <details className="mt-4 rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.7)] p-3">
          <summary className="cursor-pointer list-none text-sm font-semibold">
            일정 관리
          </summary>

          <form action={updateClassEventAction} className="mt-3 space-y-3">
            <input name="eventId" type="hidden" value={event.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">제목</span>
                <input
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.title}
                  name="title"
                  required
                  type="text"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">분류</span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.category}
                  name="category"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">중요도</span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.importance}
                  name="importance"
                >
                  {IMPORTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">과목</span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.subjectSlug ?? ""}
                  name="subjectSlug"
                >
                  <option value="">공통</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject.slug} value={subject.slug}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">시작 날짜</span>
                <input
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.startsOn}
                  name="startsOn"
                  required
                  type="date"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">종료 날짜</span>
                <input
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                  defaultValue={event.endsOn ?? ""}
                  name="endsOn"
                  type="date"
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium">설명</span>
              <textarea
                className="min-h-28 w-full rounded-[20px] border border-[var(--line)] bg-white px-3 py-3 text-sm"
                defaultValue={event.description}
                name="description"
                required
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white"
                type="submit"
              >
                수정 저장
              </button>
            </div>
          </form>

          <form action={deleteClassEventAction} className="mt-3">
            <input name="eventId" type="hidden" value={event.id} />
            <button
              className="w-full rounded-full border border-[rgba(180,60,40,0.18)] bg-[rgba(255,241,236,0.95)] px-4 py-2.5 text-sm font-semibold text-[#a23b2c]"
              type="submit"
            >
              일정 삭제
            </button>
          </form>
        </details>
      ) : null}
    </article>
  );
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const month = getCalendarMonth(params?.month);
  const todayDateKey = getTodayDateKey();
  const selectedSubject =
    params?.subject && SUBJECTS.some((subject) => subject.slug === params.subject)
      ? params.subject
      : "";
  const allMonthEvents = listClassEventsInRange(month.startDateKey, month.endDateKey);
  const monthEvents = selectedSubject
    ? allMonthEvents.filter((event) => event.subjectSlug === selectedSubject)
    : allMonthEvents;
  const eventsByDate = buildEventsByDate(monthEvents);
  const monthQuery = selectedSubject ? `&subject=${selectedSubject}` : "";

  return (
    <main className="min-h-screen px-3 py-4 pb-28 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/calendar"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
                학산여중 3-1 전용
              </p>
              <h1 className="display-font mt-2 text-2xl font-bold sm:text-4xl">
                학급 일정 캘린더
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                수행평가, 숙제, 준비물, 행사 일정을 날짜별로 모아보고 관리하는 페이지입니다.
                로그인한 누구나 일정을 올릴 수 있고, 작성자 본인이나 관리자가 수정할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
                    href={`/calendar?month=${month.prevMonthKey}${monthQuery}`}
                  >
                    이전 달
                  </Link>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                      현재 표시 월
                    </div>
                    <div className="mt-1 text-base font-semibold">{month.monthLabel}</div>
                  </div>
                  <Link
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
                    href={`/calendar?month=${month.nextMonthKey}${monthQuery}`}
                  >
                    다음 달
                  </Link>
                </div>
              </div>

              <form className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4">
                <input name="month" type="hidden" value={month.monthKey} />
                <label className="space-y-1 text-sm">
                  <span className="font-medium">과목별 필터</span>
                  <select
                    className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                    defaultValue={selectedSubject}
                    name="subject"
                  >
                    <option value="">전체 일정</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject.slug} value={subject.slug}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="mt-3 w-full rounded-full border border-[var(--line)] bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white"
                  type="submit"
                >
                  필터 적용
                </button>
              </form>

              {currentUser ? (
                <div className="flex items-center gap-2 rounded-[24px] border border-[var(--line)] bg-white/82 px-4 py-3 text-sm text-[var(--muted)]">
                  <span>{currentUser.nickname} 님</span>
                  {currentUserIsAdmin ? <AdminBadge /> : null}
                </div>
              ) : (
                <a
                  className="flex items-center justify-center rounded-[24px] bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                  href="/api/auth/kakao/start?returnTo=/calendar"
                >
                  카카오로 로그인
                </a>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
            <a
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
              href="#calendar-grid"
            >
              달력
            </a>
            <a
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
              href="#calendar-form"
            >
              일정 등록
            </a>
            <a
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
              href="#calendar-list"
            >
              목록
            </a>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:gap-5">
          <section className="glass-panel overflow-hidden rounded-[28px]" id="calendar-grid">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <Link
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg font-semibold"
                      href={`/calendar?month=${month.prevMonthKey}${monthQuery}`}
                    >
                      ‹
                    </Link>

                    <div className="text-center">
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                        월별 이동
                      </p>
                      <h2 className="display-font mt-1 text-xl font-bold sm:text-2xl">
                        {month.monthLabel}
                      </h2>
                    </div>

                    <Link
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg font-semibold"
                      href={`/calendar?month=${month.nextMonthKey}${monthQuery}`}
                    >
                      ›
                    </Link>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
                    {WEEKDAY_LABELS.map((label, index) => (
                      <div
                        key={label}
                        className={
                          index === 0
                            ? "text-[var(--accent)]"
                            : index === 6
                              ? "text-[var(--sky)]"
                              : ""
                        }
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-[var(--line)]">
                  {month.weeks.flat().map((day) => {
                    const dayEvents = eventsByDate.get(day.dateKey) ?? [];

                    return (
                      <div
                        key={day.dateKey}
                        className={`min-h-28 bg-white/88 p-2 sm:min-h-32 sm:p-3 ${
                          day.isCurrentMonth ? "" : "bg-[rgba(255,255,255,0.46)]"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between text-xs font-semibold ${
                            day.weekdayNumber === 0
                              ? "text-[var(--accent)]"
                              : day.weekdayNumber === 6
                                ? "text-[var(--sky)]"
                                : day.isToday
                                  ? "text-[var(--foreground)]"
                                  : "text-[var(--muted)]"
                          }`}
                        >
                          <span>{day.dayNumber}</span>
                          {day.isToday ? (
                            <span className="rounded-full bg-[var(--foreground)] px-2 py-0.5 text-[10px] text-white">
                              오늘
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 space-y-1.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={`${day.dateKey}-${event.id}`}
                              className={`truncate rounded-xl px-2 py-1 text-[11px] font-medium ring-1 ring-inset ring-[rgba(19,34,29,0.06)] ${getCategoryClasses(
                                event.category,
                              )}`}
                              title={`${event.title} · ${getSubjectLabel(event.subjectSlug)} · ${getEventDdayLabel(
                                todayDateKey,
                                event.startsOn,
                                event.endsOn,
                              )}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 ? (
                            <div className="text-[11px] font-medium text-[var(--muted)]">
                              +{dayEvents.length - 3}개 더
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside>
            {currentUser ? (
              <>
                <details
                  className="glass-panel rounded-[28px] p-4 sm:p-5 lg:hidden"
                  id="calendar-form"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold">
                    일정 등록 열기
                  </summary>
                  <div className="mt-4">
                    <EventCreateForm todayDateKey={todayDateKey} />
                  </div>
                </details>

                <section className="hidden glass-panel rounded-[28px] p-4 sm:p-5 lg:block">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                    일정 등록
                  </p>
                  <h2 className="display-font mt-1 text-xl font-bold">일정 올리기</h2>
                  <div className="mt-4">
                    <EventCreateForm todayDateKey={todayDateKey} />
                  </div>
                </section>
              </>
            ) : (
              <section className="glass-panel rounded-[28px] p-4 sm:p-5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  일정 등록
                </p>
                <h2 className="display-font mt-1 text-xl font-bold">로그인 후 작성 가능</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  로그인하면 시험, 숙제, 준비물 같은 일정을 직접 올릴 수 있습니다.
                </p>
                <a
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                  href="/api/auth/kakao/start?returnTo=/calendar"
                >
                  카카오로 로그인
                </a>
              </section>
            )}
          </aside>
        </div>

        <section className="glass-panel rounded-[28px] p-4 sm:p-5" id="calendar-list">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                일정 목록
              </p>
              <h2 className="display-font mt-1 text-xl font-bold">{month.monthLabel} 전체 일정</h2>
              {selectedSubject ? (
                <p className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                  {getSubjectLabel(selectedSubject)} 과목으로 필터링 중
                </p>
              ) : null}
            </div>
            <div className="text-[12px] text-[var(--muted)]">총 {monthEvents.length}개</div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {monthEvents.length > 0 ? (
              monthEvents.map((event) => (
                <EventCard
                  key={event.id}
                  currentUserId={currentUser?.id ?? null}
                  currentUserIsAdmin={currentUserIsAdmin}
                  event={event}
                  todayDateKey={todayDateKey}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-[var(--line)] bg-white/84 p-4 text-sm text-[var(--muted)]">
                이 달에는 등록된 일정이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>

      <MobileTabBar currentPath="/calendar" />
    </main>
  );
}

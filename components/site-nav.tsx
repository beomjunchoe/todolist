import Link from "next/link";

import { AdminBadge } from "./badges";

export function SiteNav({
  currentPath,
  isAdmin,
  userName,
}: {
  currentPath: string;
  isAdmin?: boolean;
  userName?: string | null;
}) {
  const links = [
    { href: "/", label: "메인" },
    { href: "/todo", label: "투두" },
    { href: "/calendar", label: "일정" },
    { href: "/boards", label: "게시판" },
  ];
  const currentLabel =
    links.find((link) => currentPath === link.href)?.label ?? "메뉴";

  return (
    <div className="glass-panel rounded-[22px] px-3 py-3 sm:rounded-[24px] sm:px-4">
      <div className="flex items-start justify-between gap-3 sm:hidden">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)]">
            학산여중 3-1
          </p>
          <p className="mt-1 text-sm font-semibold">{currentLabel}</p>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-[var(--muted)]">
          <span className="truncate">{userName ?? "비로그인"}</span>
          {isAdmin ? <AdminBadge /> : null}
        </div>
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
        {links.map((link) => {
          const active = currentPath === link.href;

          return (
            <Link
              key={link.href}
              className={`flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold ${
                active
                  ? "bg-[var(--foreground)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--foreground)]"
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="hidden grid-cols-4 gap-2 sm:grid sm:flex sm:flex-wrap sm:items-center">
        {links.map((link) => {
          const active = currentPath === link.href;

          return (
            <Link
              key={link.href}
              className={`flex items-center justify-center rounded-full px-3 py-2.5 text-xs font-semibold sm:min-w-[104px] ${
                active
                  ? "bg-[var(--foreground)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--foreground)]"
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 hidden flex-wrap items-center gap-2 text-[11px] leading-5 text-[var(--muted)] sm:mt-2 sm:flex sm:justify-end">
        {userName ? <span>{userName} 님 접속 중</span> : <span>비로그인 상태</span>}
        {isAdmin ? <AdminBadge /> : null}
      </div>
    </div>
  );
}

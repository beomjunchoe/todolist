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
    { href: "/todo", label: "투두리스트" },
    { href: "/boards", label: "과목별 게시판" },
  ];

  return (
    <div className="glass-panel rounded-[24px] px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = currentPath === link.href;

            return (
              <Link
                key={link.href}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
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

        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          {userName ? <span>{userName} 님 접속 중</span> : <span>비로그인 상태</span>}
          {isAdmin ? <AdminBadge /> : null}
        </div>
      </div>
    </div>
  );
}

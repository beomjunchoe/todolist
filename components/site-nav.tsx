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
    { href: "/boards", label: "게시판" },
  ];

  return (
    <div className="glass-panel rounded-[22px] px-3 py-3 sm:rounded-[24px] sm:px-4">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
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

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-5 text-[var(--muted)] sm:mt-2 sm:justify-end">
        {userName ? <span>{userName} 님 접속 중</span> : <span>비로그인 상태</span>}
        {isAdmin ? <AdminBadge /> : null}
      </div>
    </div>
  );
}

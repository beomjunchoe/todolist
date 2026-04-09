import Link from "next/link";

export function MobileTabBar({
  currentPath,
}: {
  currentPath: "/" | "/todo" | "/boards";
}) {
  const links = [
    { href: "/" as const, label: "메인" },
    { href: "/todo" as const, label: "투두" },
    { href: "/boards" as const, label: "게시판" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[rgba(255,248,240,0.96)] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-3 gap-2">
        {links.map((link) => {
          const active = currentPath === link.href;

          return (
            <Link
              key={link.href}
              className={`flex min-h-12 items-center justify-center rounded-full text-sm font-semibold ${
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
    </div>
  );
}

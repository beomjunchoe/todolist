export function FloatingWriteButton({
  href,
  label,
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      className="fixed bottom-24 right-4 z-40 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(236,108,47,0.26)] sm:hidden"
      href={href}
    >
      {label ?? "글쓰기"}
    </a>
  );
}

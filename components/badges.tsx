export function StarBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,210,84,0.28)] px-2 py-1 text-[10px] font-semibold text-[var(--foreground)]">
      <span aria-hidden="true">★</span>
      {count}
    </span>
  );
}

export function AdminBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
      관리자
    </span>
  );
}

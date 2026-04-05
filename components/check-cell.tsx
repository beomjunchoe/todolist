import { toggleTodoCheck } from "@/app/actions";

export function CheckCell({
  checked,
  dateKey,
  editable,
  todoId,
}: {
  checked: boolean;
  dateKey: string;
  editable: boolean;
  todoId: string;
}) {
  const baseClassName =
    "flex min-h-9 items-center justify-center rounded-xl border px-2 py-2 text-[11px] font-semibold";
  const stateClassName = checked
    ? "border-transparent bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(236,108,47,0.16)]"
    : "border-[var(--line)] bg-white text-[var(--foreground)]";

  if (!editable) {
    return (
      <div className={`${baseClassName} ${stateClassName}`}>
        {checked ? "완료" : "-"}
      </div>
    );
  }

  return (
    <form action={toggleTodoCheck}>
      <input name="todoId" type="hidden" value={todoId} />
      <input name="dateKey" type="hidden" value={dateKey} />
      <button className={`${baseClassName} ${stateClassName} w-full`} type="submit">
        {checked ? "완료" : "체크"}
      </button>
    </form>
  );
}

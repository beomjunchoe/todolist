import { toggleTodoCheck } from "@/app/actions";

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
        checked
          ? "border-transparent bg-[var(--accent)] text-white"
          : "border-[var(--line)] bg-white text-transparent"
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.5 8.1 6.5 11l6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

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
    "flex h-8 w-8 items-center justify-center rounded-xl border bg-white";
  const stateClassName = checked
    ? "border-[rgba(236,108,47,0.18)] shadow-[0_8px_18px_rgba(236,108,47,0.12)]"
    : "border-[var(--line)]";

  if (!editable) {
    return (
      <div className={`${baseClassName} ${stateClassName}`}>
        <CheckboxIcon checked={checked} />
      </div>
    );
  }

  return (
    <form action={toggleTodoCheck}>
      <input name="todoId" type="hidden" value={todoId} />
      <input name="dateKey" type="hidden" value={dateKey} />
      <button
        aria-label={checked ? "체크 해제" : "체크 완료"}
        className={`${baseClassName} ${stateClassName}`}
        type="submit"
      >
        <CheckboxIcon checked={checked} />
      </button>
    </form>
  );
}

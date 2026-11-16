import { getMonthGridDays, toDateStr, isSameDay } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function MonteurCalendar({ assignmentDates }: { assignmentDates: string[] }) {
  const today = new Date();
  const days = getMonthGridDays(today);
  const assignmentSet = new Set(assignmentDates);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-silver-light">
        {today.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 overflow-hidden rounded border border-border text-[10px]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="border-b border-border bg-card py-1 text-center text-silver">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isToday = isSameDay(day, today);
          const hasAssignment = assignmentSet.has(dateStr);
          const inMonth = day.getMonth() === today.getMonth();
          return (
            <div
              key={dateStr}
              className={`border-b border-r border-border py-1.5 text-center ${
                inMonth ? "" : "opacity-30"
              } ${
                isToday
                  ? "bg-copper font-semibold text-background"
                  : hasAssignment
                    ? "font-medium text-copper-light"
                    : "text-silver"
              }`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

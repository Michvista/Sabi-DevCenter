export function pregnancyWeek(dueDate: string | Date, today = new Date()) {
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil(
    (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
  return Math.min(42, Math.max(1, 40 - Math.floor(daysUntilDue / 7)));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function daysUntil(date: string | Date, today = new Date()) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(date).setHours(0, 0, 0, 0) -
        new Date(today).setHours(0, 0, 0, 0)) /
        86_400_000,
    ),
  );
}

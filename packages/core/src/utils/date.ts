const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function toISODate(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function compareISODateDesc(left: string, right: string): number {
  return right.localeCompare(left);
}

/** 로컬 달력 기준 해당 날짜가 속한 주의 월요일 00:00:00. */
export function getMondayOfWeek(date: Date): Date {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + diffFromMonday);
  return local;
}

/** `mondayISO`는 해당 주 월요일의 `YYYY-MM-DD`. 월~일 7개 ISO 문자열. */
export function getWeekISODatesFromMonday(mondayISO: string): string[] {
  const [y, m, d] = mondayISO.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    dates.push(toISODate(day));
  }
  return dates;
}

/** `mondayISO`에서 `deltaWeeks`만큼 이동한 주의 월요일 ISO. */
export function shiftWeekMondayISO(mondayISO: string, deltaWeeks: number): string {
  const [y, m, d] = mondayISO.split('-').map(Number);
  const monday = new Date(y, m - 1, d + deltaWeeks * 7);
  return toISODate(monday);
}

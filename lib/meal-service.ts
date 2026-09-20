export type MealWindowInput = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
};

function parts() {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((part) => part.type === type)?.value || "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}
export function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
export function todayInIndia() { return parts().date; }
type DailyOverride = { mealWindowId: string; startTime: string; endTime: string };
export function effectiveMealWindows<T extends MealWindowInput>(windows: T[], overrides: DailyOverride[] = []) {
  const byWindow = new Map(overrides.map((item) => [item.mealWindowId, item]));
  return windows.map((window) => {
    const override = byWindow.get(window.id);
    return override ? { ...window, startTime: override.startTime, endTime: override.endTime } : window;
  });
}

export function currentMealWindow(windows: MealWindowInput[]) {
  const now = parts();
  const next =
    windows.find((window) => now.minutes < timeToMinutes(window.startTime)) || null;
  const activeWindows = windows.filter((window) => now.minutes >= timeToMinutes(window.startTime) && now.minutes < timeToMinutes(window.endTime));
  return {
    serviceDate: now.date,
    active: activeWindows[0] || null,
    activeWindows,
    next,
    minutesUntilNext: next
      ? Math.max(0, timeToMinutes(next.startTime) - now.minutes)
      : 0,
  };
}

export function isMessQr(value: unknown, messId: string) {
  return value === `openhostel://mess/${messId}`;
}

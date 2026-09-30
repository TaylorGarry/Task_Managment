const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_INDEX = new Map([
  ["sunday", 0],
  ["monday", 1],
  ["tuesday", 2],
  ["wednesday", 3],
  ["thursday", 4],
  ["friday", 5],
  ["saturday", 6],
]);
const MONTH_INDEX = new Map([
  ["january", 0],
  ["february", 1],
  ["march", 2],
  ["april", 3],
  ["may", 4],
  ["june", 5],
  ["july", 6],
  ["august", 7],
  ["september", 8],
  ["october", 9],
  ["november", 10],
  ["december", 11],
]);

export const toIstDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};

export const parseYmdToUtcDate = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0));
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const addDaysToDateKey = (dateKey, days) => {
  const date = parseYmdToUtcDate(dateKey);
  return date ? toIstDateKey(addDays(date, days)) : null;
};

export const startOfIsoWeek = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
};

export const endOfIsoWeek = (date) => addDays(startOfIsoWeek(date), 6);

const normalizeDateKey = (value) => {
  if (!value) return null;
  if (DATE_ONLY_RE.test(String(value))) return String(value);
  return toIstDateKey(value);
};

const parseMonthName = (value = "") => MONTH_INDEX.get(String(value || "").trim().toLowerCase()) ?? null;

const parseNamedDate = (value = "", referenceDate = new Date()) => {
  const raw = String(value || "").trim().replace(/[,]/g, " ");
  const isoMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return normalizeDateKey(isoMatch[1]);

  const match = raw.match(
    /\b(?:(\d{4})\s*)?(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
  );
  if (!match) {
    const swapped = raw.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i
    );
    if (!swapped) return null;
    const month = parseMonthName(swapped[1]);
    const day = Number(swapped[2]);
    const year = swapped[3] ? Number(swapped[3]) : referenceDate.getUTCFullYear();
    if (month === null || !day) return null;
    return toIstDateKey(new Date(Date.UTC(year, month, day, 0, 0, 0, 0)));
  }

  const year = match[1] ? Number(match[1]) : referenceDate.getUTCFullYear();
  const day = Number(match[2]);
  const month = parseMonthName(match[3]);
  if (month === null || !day) return null;
  return toIstDateKey(new Date(Date.UTC(year, month, day, 0, 0, 0, 0)));
};

const parseRangeFromText = (text = "", now = new Date()) => {
  const lower = String(text || "").toLowerCase();
  const rangeMatch = lower.match(
    /\bfrom\s+(.+?)\s+(?:to|through|until|upto|up to|-)\s+(.+?)(?:\b|$)/i
  );
  if (!rangeMatch) return null;

  const startText = rangeMatch[1].trim();
  const endText = rangeMatch[2].trim();
  const startDate = parseNamedDate(startText, now);
  const endDate = parseNamedDate(endText, now);
  if (startDate && endDate) return { startDate, endDate };
  return null;
};

const resolveWeekday = ({ text, baseDate }) => {
  const lower = String(text || "").toLowerCase();
  const weekday = [...WEEKDAY_INDEX.keys()].find((day) => lower.includes(day));
  if (!weekday) return null;
  const target = WEEKDAY_INDEX.get(weekday);
  const base = new Date(baseDate);
  const current = base.getUTCDay();
  let delta = target - current;
  if (lower.includes(`last ${weekday}`)) {
    if (delta >= 0) delta -= 7;
  } else if (lower.includes(`next ${weekday}`)) {
    if (delta <= 0) delta += 7;
  } else if (delta < 0) {
    delta += 7;
  }
  return toIstDateKey(addDays(base, delta));
};

export const resolveDateRange = ({ date, startDate, endDate, dateText, now = new Date() } = {}) => {
  const todayKey = toIstDateKey(now);
  const today = parseYmdToUtcDate(todayKey);
  const lower = String(dateText || "").toLowerCase();

  const explicitStart = normalizeDateKey(startDate);
  const explicitEnd = normalizeDateKey(endDate);
  if (explicitStart && explicitEnd) return { startDate: explicitStart, endDate: explicitEnd };

  const explicitDate = normalizeDateKey(date);
  if (explicitDate) return { startDate: explicitDate, endDate: explicitDate };

  const explicitRange = parseRangeFromText(lower, now);
  if (explicitRange) return explicitRange;

  if (lower.includes("yesterday")) {
    const key = toIstDateKey(addDays(today, -1));
    return { startDate: key, endDate: key };
  }
  if (lower.includes("tomorrow")) {
    const key = toIstDateKey(addDays(today, 1));
    return { startDate: key, endDate: key };
  }
  if (lower.includes("last week")) {
    const start = addDays(startOfIsoWeek(today), -7);
    return { startDate: toIstDateKey(start), endDate: toIstDateKey(addDays(start, 6)) };
  }
  if (lower.includes("next week")) {
    const start = addDays(startOfIsoWeek(today), 7);
    return { startDate: toIstDateKey(start), endDate: toIstDateKey(addDays(start, 6)) };
  }
  if (lower.includes("this week") || /monday\s+to\s+friday/i.test(lower)) {
    const start = startOfIsoWeek(today);
    const end = /monday\s+to\s+friday/i.test(lower) ? addDays(start, 4) : addDays(start, 6);
    return { startDate: toIstDateKey(start), endDate: toIstDateKey(end) };
  }

  if (lower.includes("this month")) {
    return {
      startDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0))),
      endDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 0, 0, 0, 0))),
    };
  }
  if (lower.includes("last month")) {
    return {
      startDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1, 0, 0, 0, 0))),
      endDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0, 0, 0, 0, 0))),
    };
  }
  if (lower.includes("next month")) {
    return {
      startDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1, 0, 0, 0, 0))),
      endDate: toIstDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0, 0, 0, 0, 0))),
    };
  }

  const monthOnly = lower.match(
    /\b(?:for|in|of)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
  );
  if (monthOnly) {
    const month = parseMonthName(monthOnly[1]);
    if (month !== null) {
      const year = today.getUTCFullYear();
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0, 0));
      return { startDate: toIstDateKey(start), endDate: toIstDateKey(end) };
    }
  }

  const weekdayKey = resolveWeekday({ text: lower, baseDate: today });
  if (weekdayKey) return { startDate: weekdayKey, endDate: weekdayKey };

  return { startDate: todayKey, endDate: todayKey };
};

export const enumerateDateKeys = (startDate, endDate) => {
  const start = parseYmdToUtcDate(startDate);
  const end = parseYmdToUtcDate(endDate);
  if (!start || !end || start > end) return [];
  const keys = [];
  let cursor = start;
  while (cursor <= end) {
    keys.push(toIstDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
};

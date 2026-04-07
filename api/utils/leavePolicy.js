const MONTHLY_CREDIT = Object.freeze({
  EL: 1,
  CL: 0.5,
  ML: 0.5,
});

const APPROVAL_MAX_DAYS = 6;
// Leave cycle runs from April to next March (0-based month index = 3).
const LEAVE_CYCLE_START_MONTH_INDEX = 3;
export const LEAVE_SESSIONS = Object.freeze({
  FULL: "full",
  FIRST_HALF: "first_half",
  SECOND_HALF: "second_half",
});

const roundToHalf = (value) => Math.round(Number(value || 0) * 2) / 2;
const IST_TZ = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

const getIstParts = (dateLike = new Date()) => {
  const date = new Date(dateLike);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
};

const toIstDate = (year, month, day, hh = 0, mm = 0, ss = 0, ms = 0) => {
  const yyyy = String(year).padStart(4, "0");
  const mon = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const h = String(hh).padStart(2, "0");
  const m = String(mm).padStart(2, "0");
  const s = String(ss).padStart(2, "0");
  const milli = String(ms).padStart(3, "0");
  return new Date(`${yyyy}-${mon}-${dd}T${h}:${m}:${s}.${milli}${IST_OFFSET}`);
};

const startOfDay = (date) => {
  const { year, month, day } = getIstParts(date);
  return toIstDate(year, month, day, 0, 0, 0, 0);
};

const startOfMonth = (date) => {
  const { year, month } = getIstParts(date);
  return toIstDate(year, month, 1, 0, 0, 0, 0);
};

const addMonths = (date, months) => {
  const { year, month } = getIstParts(date);
  const monthIndex = month - 1 + Number(months || 0);
  const nextYear = year + Math.floor(monthIndex / 12);
  const nextMonth = ((monthIndex % 12) + 12) % 12;
  return toIstDate(nextYear, nextMonth + 1, 1, 0, 0, 0, 0);
};

const monthDiff = (from, to) => {
  const fromParts = getIstParts(from);
  const toParts = getIstParts(to);
  return (toParts.year - fromParts.year) * 12 + (toParts.month - fromParts.month);
};

export const getFinancialYearBounds = (referenceDate = new Date()) => {
  const ref = startOfDay(referenceDate);
  const refParts = getIstParts(ref);
  // Business expectation: show zero accrual before the cycle start date of the
  // current year (e.g. before Apr 1, 2026 -> 0), then start monthly credits
  // from Apr 1 onward.
  const year = refParts.year;
  const start = toIstDate(year, LEAVE_CYCLE_START_MONTH_INDEX + 1, 1, 0, 0, 0, 0);
  const nextStart = toIstDate(year + 1, LEAVE_CYCLE_START_MONTH_INDEX + 1, 1, 0, 0, 0, 0);
  const end = new Date(nextStart.getTime() - 1);
  return { start, end, startYear: year };
};

export const getProbationEndDate = (dateOfJoining) => {
  if (!dateOfJoining) return null;
  const doj = startOfDay(dateOfJoining);
  return new Date(doj.getTime() + 90 * 24 * 60 * 60 * 1000);
};

export const getAccrualStartMonth = ({ dateOfJoining, financialYearStart }) => {
  const fyStart = startOfMonth(financialYearStart);
  if (!dateOfJoining) return fyStart;
  const joiningMonth = startOfMonth(startOfDay(dateOfJoining));
  return joiningMonth > fyStart ? joiningMonth : fyStart;
};

export const computeMonthlyAccrual = ({
  lastAccruedMonth,
  accrualStartMonth,
  asOfDate = new Date(),
}) => {
  const targetMonth = startOfMonth(startOfDay(asOfDate));
  const effectiveStart =
    lastAccruedMonth && startOfMonth(lastAccruedMonth) >= accrualStartMonth
      ? addMonths(startOfMonth(lastAccruedMonth), 1)
      : accrualStartMonth;

  if (effectiveStart > targetMonth) {
    return {
      monthsToCredit: 0,
      totalCredit: { EL: 0, CL: 0, ML: 0 },
      lastAccruedMonth: lastAccruedMonth || null,
    };
  }

  const monthsToCredit = monthDiff(effectiveStart, targetMonth) + 1;
  const totalCredit = {
    EL: roundToHalf(monthsToCredit * MONTHLY_CREDIT.EL),
    CL: roundToHalf(monthsToCredit * MONTHLY_CREDIT.CL),
    ML: roundToHalf(monthsToCredit * MONTHLY_CREDIT.ML),
  };

  return {
    monthsToCredit,
    totalCredit,
    lastAccruedMonth: targetMonth,
  };
};

export const getDatesInRange = (fromDate, toDate) => {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);
  const days = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
};

const normalizeStartSession = (session) => {
  const raw = String(session || LEAVE_SESSIONS.FULL).trim().toLowerCase();
  if (raw === LEAVE_SESSIONS.SECOND_HALF) return LEAVE_SESSIONS.SECOND_HALF;
  return LEAVE_SESSIONS.FIRST_HALF;
};

const normalizeEndSession = (session) => {
  const raw = String(session || LEAVE_SESSIONS.FULL).trim().toLowerCase();
  if (raw === LEAVE_SESSIONS.FIRST_HALF) return LEAVE_SESSIONS.FIRST_HALF;
  return LEAVE_SESSIONS.SECOND_HALF;
};

export const computeSandwichAndChargeDays = ({
  startDate,
  endDate,
  startSession = LEAVE_SESSIONS.FULL,
  endSession = LEAVE_SESSIONS.FULL,
}) => {
  const days = getDatesInRange(startDate, endDate);
  const weekendCount = days.filter((d) => d.getDay() === 0 || d.getDay() === 6).length;
  const startBoundary = normalizeStartSession(startSession);
  const endBoundary = normalizeEndSession(endSession);

  let chargedDays = days.length;
  if (days.length === 1) {
    if (startBoundary === LEAVE_SESSIONS.SECOND_HALF && endBoundary === LEAVE_SESSIONS.FIRST_HALF) {
      return {
        totalDays: days.length,
        sandwichDays: weekendCount,
        chargedDays: 0,
        invalid: true,
        message: "Invalid half-day selection. End session cannot be before start session.",
      };
    }
    chargedDays = startBoundary === endBoundary ? 0.5 : 1;
  } else {
    if (startBoundary === LEAVE_SESSIONS.SECOND_HALF) chargedDays -= 0.5;
    if (endBoundary === LEAVE_SESSIONS.FIRST_HALF) chargedDays -= 0.5;
  }

  return {
    totalDays: days.length,
    sandwichDays: weekendCount,
    chargedDays: roundToHalf(chargedDays),
    invalid: false,
    normalizedStartSession: startBoundary,
    normalizedEndSession: endBoundary,
  };
};

export const canUsePaidLeave = ({ dateOfJoining, leaveStartDate }) => {
  if (!dateOfJoining) return true;
  const probationEnd = getProbationEndDate(dateOfJoining);
  return startOfDay(leaveStartDate) >= probationEnd;
};

export const getLeaveConfig = () => ({
  MONTHLY_CREDIT,
  APPROVAL_MAX_DAYS,
});

export const toFixedHalf = (value) => roundToHalf(value).toFixed(1);

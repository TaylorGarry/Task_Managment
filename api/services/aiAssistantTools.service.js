import AiPendingAction from "../Modals/AiPendingAction.modal.js";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";
import { updateAttendanceBulk } from "../Controllers/roster.controller.js";
import {
  canUpdateAttendance,
  canViewAttendance,
  isAttendanceHr,
  isAttendanceSupervisor,
  isAttendanceSuperAdmin,
  isSameAttendanceEmployee,
} from "./attendanceAuthorization.service.js";
import {
  getAllowedAttendanceStatuses,
  normalizeAttendanceStatus,
} from "./attendanceStatus.service.js";
import {
  addDays,
  endOfIsoWeek,
  enumerateDateKeys,
  parseYmdToUtcDate,
  resolveDateRange,
  startOfIsoWeek,
  toIstDateKey,
} from "./aiDate.service.js";

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[()\-_/.,]+/g, " ")
    .replace(/\s+/g, " ");

const labelOfUser = (user = {}) => user.realName || user.pseudoName || user.username || user.name || "";

const sameId = (a, b) => Boolean(a && b && String(a) === String(b));

const userAliases = (user = {}) =>
  new Set([user.username, user.realName, user.pseudoName, user.empId].map(normalize).filter(Boolean));

const employeeLabels = (employee = {}) =>
  [employee.name, employee.username, employee.realName, employee.pseudoName, employee.empId]
    .map(normalize)
    .filter(Boolean);

const employeeMatchesName = (employee, name) => {
  const needle = normalize(name);
  if (!needle) return false;
  return employeeLabels(employee).some((label) => label === needle || label.includes(needle) || needle.includes(label));
};

const rosterReuseEmployeeKey = (employee = {}) =>
  String(employee?.userId || employee?.empId || employee?.name || "")
    .trim()
    .toLowerCase();

const formatRosterReuseDayLabel = (dateKey) => {
  const date = parseYmdToUtcDate(dateKey);
  if (!date) return String(dateKey || "");
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const buildRosterReuseDays = (startKey, endKey) =>
  enumerateDateKeys(startKey, endKey).map((dateKey) => ({
    date: dateKey,
    label: formatRosterReuseDayLabel(dateKey),
  }));

const buildRosterReusePreview = ({ actor, sourceRoster, sourceWeek, sourceStartKey, sourceEndKey, targetStartKey, targetEndKey }) => {
  const actorPrivileged = isAttendanceSuperAdmin(actor) || isAttendanceHr(actor);
  const actorAliases = userAliases(actor);
  const sourceDays = buildRosterReuseDays(sourceStartKey, sourceEndKey);
  const targetDays = buildRosterReuseDays(targetStartKey, targetEndKey);

  const employees = (sourceWeek?.employees || []).filter((employee) => {
    if (!employee) return false;
    if (actorPrivileged) return true;
    return actorAliases.has(normalize(employee.teamLeader));
  });

  return {
    type: "roster_preview",
    sourceRosterId: sourceRoster?._id || null,
    sourceWeekId: sourceWeek?._id || null,
    sourceStartDate: sourceStartKey,
    sourceEndDate: sourceEndKey,
    targetStartDate: targetStartKey,
    targetEndDate: targetEndKey,
    sourceRange: `${sourceStartKey} to ${sourceEndKey}`,
    targetRange: `${targetStartKey} to ${targetEndKey}`,
    days: targetDays,
    employeeCount: employees.length,
    employees: employees.map((employee) => {
      const sourceStatusByIndex = Array.isArray(employee.dailyStatus) ? employee.dailyStatus : [];
      return {
        key: rosterReuseEmployeeKey(employee),
        userId: employee.userId || null,
        employeeId: employee.empId || "",
        name: employee.name,
        department: employee.department || "",
        teamLeader: employee.teamLeader || "",
        dailyStatus: targetDays.map((day, index) => {
          const sourceDay = sourceStatusByIndex[index] || {};
          const status = normalizeAttendanceStatus(sourceDay.status || "P") || "P";
          return {
            date: day.date,
            label: day.label,
            status,
          };
        }),
      };
    }),
  };
};

const findOrCreateTargetRoster = async ({ targetStart, targetEnd, actorId }) => {
  const month = targetStart.getUTCMonth() + 1;
  const year = targetStart.getUTCFullYear();
  let targetRoster = await Roster.findOne({ month, year }).sort({ updatedAt: -1, createdAt: -1 });

  if (!targetRoster) {
    targetRoster = await Roster.create({
      month,
      year,
      rosterStartDate: targetStart,
      rosterEndDate: targetEnd,
      weeks: [],
      createdBy: actorId,
      updatedBy: actorId,
      editHistory: [],
    });
    return targetRoster;
  }

  const currentStart = targetRoster.rosterStartDate ? new Date(targetRoster.rosterStartDate) : null;
  const currentEnd = targetRoster.rosterEndDate ? new Date(targetRoster.rosterEndDate) : null;
  if (!currentStart || targetStart < currentStart) {
    targetRoster.rosterStartDate = targetStart;
  }
  if (!currentEnd || targetEnd > currentEnd) {
    targetRoster.rosterEndDate = targetEnd;
  }
  if (!targetRoster.updatedBy) {
    targetRoster.updatedBy = actorId;
  }
  targetRoster.markModified("rosterStartDate");
  targetRoster.markModified("rosterEndDate");
  await targetRoster.save();
  return targetRoster;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseArrivalTime = (value = "") => {
  const raw = String(value || "")
    .trim()
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+(am|pm)\b/gi, " $1")
    .replace(/\s+/g, " ");
  if (!raw) return { time: "", ambiguous: false };

  const h24 = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return { time: `${h24[1].padStart(2, "0")}:${h24[2]}`, ambiguous: false };

  const h24Period = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)\b/i);
  if (h24Period) {
    let hour = Number(h24Period[1]);
    const minute = Number(h24Period[2]);
    const period = String(h24Period[3]).toLowerCase();
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return { time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, ambiguous: false };
  }

  const clock12 = raw.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!clock12) return { time: "", ambiguous: false };

  const hour = Number(clock12[1]);
  const minute = Number(clock12[2] || "0");
  const period = String(clock12[3] || "").toLowerCase();

  if (!period) {
    return { time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, ambiguous: true };
  }

  let normalizedHour = hour;
  if (period === "pm" && normalizedHour !== 12) normalizedHour += 12;
  if (period === "am" && normalizedHour === 12) normalizedHour = 0;
  return { time: `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, ambiguous: false };
};

const inferStatusFromText = (text = "") => {
  const raw = String(text || "");
  const normalizedText = normalize(raw);
  const statuses = getAllowedAttendanceStatuses()
    .filter(Boolean)
    .sort((a, b) => String(b).length - String(a).length);

  for (const status of statuses) {
    const normalizedStatus = normalize(status);
    if (!normalizedStatus) continue;
    const tokenPattern = new RegExp(`(?:^|\\s)${escapeRegExp(normalizedStatus)}(?:\\s|$)`, "i");
    if (tokenPattern.test(normalizedText)) return status;
  }

  return "";
};

const inferEmployeeNameFromText = (text = "") => {
  let normalizedText = normalize(text);
  if (!normalizedText) return "";

  const statuses = getAllowedAttendanceStatuses()
    .filter(Boolean)
    .map(normalize)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const status of statuses) {
    normalizedText = normalizedText.replace(new RegExp(`(?:^|\\s)${escapeRegExp(status)}(?:\\s|$)`, "gi"), " ");
  }
  normalizedText = normalizedText.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)?\b/gi, " ");
  normalizedText = normalizedText.replace(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/gi, " ");

  const ignoredWords = new Set([
    "attendance",
    "change",
    "check",
    "details",
    "employee",
    "employees",
    "for",
    "get",
    "history",
    "me",
    "my",
    "of",
    "mark",
    "on",
    "please",
    "record",
    "records",
    "report",
    "see",
    "set",
    "show",
    "status",
    "tell",
    "the",
    "to",
    "update",
    "view",
    "as",
    "today",
    "yesterday",
    "tomorrow",
    "this",
    "next",
    "last",
    "week",
    "month",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "from",
    "until",
    "through",
    "between",
  ]);

  return normalizedText
    .split(/\s+/)
    .filter((token) => token && !ignoredWords.has(token))
    .join(" ")
    .trim();
};

const splitEmployeeNamesFromText = (text = "") => {
  const raw = String(text || "").trim();
  if (!raw || !/[,;&]|\band\b/i.test(raw)) return [];

  const statuses = getAllowedAttendanceStatuses()
    .filter(Boolean)
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length);
  const statusPattern = statuses.length ? statuses.join("|") : "$^";
  let namesText = raw
    .replace(new RegExp(`\\b(?:mark|set|update|change|attendance|status|employee|employees|please|today|tomorrow|yesterday|this|next|last|week|month|from|to|for|on|at)\\b`, "gi"), " ")
    .replace(new RegExp(`\\b(?:${statusPattern})\\b`, "gi"), " ")
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)?\b/gi, " ")
    .replace(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/gi, " ");

  return namesText
    .split(/\s*(?:,|;|&|\band\b)\s*/i)
    .map((name) => normalize(name))
    .filter(Boolean);
};

const isSelfReference = (text = "") =>
  /\b(?:my|mine|self|own)\b/i.test(String(text || "")) || /\battendance\s+(?:of|for)\s+me\b/i.test(String(text || ""));

const isTeamReference = (text = "") =>
  /\b(?:my|own)?\s*team\s+(?:attendance|status|records?)\b/i.test(String(text || "")) ||
  /\b(?:attendance|status|records?)\s+(?:of|for)\s+(?:my|own)?\s*team\b/i.test(String(text || ""));

const invokeController = (handler, req) =>
  new Promise((resolve) => {
    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode, payload });
      },
    };
    Promise.resolve(handler(req, res)).catch((error) => {
      resolve({ statusCode: 500, payload: { success: false, message: error.message || "Controller failed" } });
    });
  });

const weekContainsDate = (week, dateKey) => {
  const startKey = toIstDateKey(week?.startDate);
  const endKey = toIstDateKey(week?.endDate);
  return Boolean(startKey && endKey && dateKey >= startKey && dateKey <= endKey);
};

const findRostersForDate = async (dateKey) => {
  const date = parseYmdToUtcDate(dateKey);
  if (!date) return [];
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return Roster.find({
    $or: [
      { rosterStartDate: { $lte: dayEnd }, rosterEndDate: { $gte: date } },
      { weeks: { $elemMatch: { startDate: { $lte: dayEnd }, endDate: { $gte: date } } } },
    ],
  }).sort({ rosterStartDate: -1, rosterEndDate: -1 });
};

const findRostersForRange = async ({ startKey, endKey }) => {
  const start = parseYmdToUtcDate(startKey);
  const end = parseYmdToUtcDate(endKey);
  if (!start || !end) return [];
  return Roster.find({
    $or: [
      { rosterStartDate: { $lte: end }, rosterEndDate: { $gte: start } },
      { weeks: { $elemMatch: { startDate: { $lte: end }, endDate: { $gte: start } } } },
    ],
  }).sort({ rosterStartDate: -1, rosterEndDate: -1 });
};

const findRosterEmployeeMatches = async ({ dateKey, employeeName = "", currentUser = null, own = false }) => {
  const rosters = await findRostersForDate(dateKey);
  const matches = [];
  for (const roster of rosters) {
    for (const week of roster.weeks || []) {
      if (!weekContainsDate(week, dateKey)) continue;
      for (const employee of week.employees || []) {
        if (!employee) continue;
        if (own && !isSameAttendanceEmployee(currentUser, employee)) continue;
        if (employeeName && !employeeMatchesName(employee, employeeName)) continue;
        matches.push({ roster, week, employee });
      }
    }
  }
  return matches;
};

const resolveOneRosterEmployee = async ({ actor, dateKey, employeeName, own = false }) => {
  const matches = await findRosterEmployeeMatches({ dateKey, employeeName, currentUser: actor, own });
  if (!matches.length) {
    return {
      ok: false,
      reason: own ? "No attendance record was found for you on that date." : `I couldn't find an employee named ${employeeName}.`,
    };
  }

  const seen = new Map();
  for (const match of matches) {
    const key = String(match.employee.userId || match.employee.empId || normalize(match.employee.name));
    if (!seen.has(key)) seen.set(key, match);
  }
  const unique = [...seen.values()];
  if (unique.length > 1 && employeeName) {
    return { ok: false, reason: `I found multiple employees named ${employeeName}. Please clarify which employee you mean.` };
  }
  return { ok: true, match: unique[0] };
};

const getDailyStatus = (employee, dateKey) => {
  const daily = (employee.dailyStatus || []).find((entry) => toIstDateKey(entry?.date) === dateKey);
  return {
    rosterStatus: daily?.status || "",
    departmentStatus: daily?.departmentStatus || "",
    transportStatus: daily?.transportStatus || "",
    effectiveStatus: daily?.departmentStatus || daily?.overrideStatus || daily?.status || "",
  };
};

const formatTeamAttendanceMatrix = ({ rows = [], dateKeys = [] } = {}) => {
  if (!rows.length) return "No attendance records were found.";
  const formatShortDateLabel = (dateKey) => {
    const date = parseYmdToUtcDate(dateKey);
    if (!date) return String(dateKey || "");
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  };

  const dateColumns = (dateKeys.length ? dateKeys : [...new Set(rows.map((row) => row.date).filter(Boolean))]).map((dateKey) => ({
    key: dateKey,
    label: formatShortDateLabel(dateKey),
  }));
  const grouped = new Map();
  const order = [];

  for (const row of rows) {
    const key = String(row.employeeName || row.employeeId || row.teamLeader || row.date || "").trim();
    if (!grouped.has(key)) {
      grouped.set(key, {
        employeeName: row.employeeName || "-",
        departmentStatus: row.departmentStatus || "",
        rosterStatusByDate: new Map(),
      });
      order.push(key);
    }
    if (row.date) {
      grouped.get(key).rosterStatusByDate.set(row.date, row.rosterStatus || "-");
    }
  }

  const lines = [];
  const header = ["Employee", ...dateColumns.map((column) => column.label)];
  lines.push(header.join(" | "));

  for (const key of order) {
    const entry = grouped.get(key);
    const cells = [entry.employeeName || "-"];
    for (const column of dateColumns) {
      cells.push(entry.rosterStatusByDate.get(column.key) || "-");
    }
    lines.push(cells.join(" | "));
  }

  return lines.join("\n");
};

const getTeamAttendance = async ({ actor, dateKeys = [] }) => {
  const rows = [];
  const seen = new Set();
  const groupedRows = new Map();
  const groupedOrder = [];

  for (const dateKey of dateKeys) {
    const rosters = await findRostersForDate(dateKey);
    const dateRows = [];

    for (const roster of rosters) {
      for (const week of roster.weeks || []) {
        if (!weekContainsDate(week, dateKey)) continue;
        for (const employee of week.employees || []) {
          if (!employee || !(await canViewAttendance(actor, employee))) continue;
          const key = `${dateKey}:${String(employee.userId || employee.empId || normalize(employee.name))}`;
          if (seen.has(key)) continue;
          seen.add(key);
          dateRows.push({
            date: dateKey,
            employeeName: employee.name,
            teamLeader: employee.teamLeader || "",
            isSelf: isSameAttendanceEmployee(actor, employee),
            ...getDailyStatus(employee, dateKey),
          });
        }
      }
    }

    const teamRows = dateRows.some((row) => !row.isSelf) ? dateRows.filter((row) => !row.isSelf) : dateRows;
    for (const row of teamRows) {
      rows.push(row);
      const key = String(row.employeeName || row.teamLeader || row.date || "").trim();
      if (!groupedRows.has(key)) {
        groupedRows.set(key, {
          employeeName: row.employeeName || "-",
          employeeId: row.employeeId || row.empId || "",
          teamLeader: row.teamLeader || "",
          departmentStatus: row.departmentStatus || "",
          perDate: new Map(),
        });
        groupedOrder.push(key);
      }
      groupedRows.get(key).perDate.set(dateKey, row.rosterStatus || "-");
    }
  }

  if (!groupedOrder.length) {
    return { type: "attendance_view_error", message: "I could not find attendance records for your team on the selected date." };
  }

  const visibleRows = groupedOrder.slice(0, 40).map((key) => {
    const entry = groupedRows.get(key);
    return {
      employeeName: entry.employeeName,
      employeeId: entry.employeeId,
      teamLeader: entry.teamLeader,
      departmentStatus: entry.departmentStatus,
      dateStatuses: dateKeys.map((dateKey) => ({
        date: dateKey,
        status: entry.perDate.get(dateKey) || "-",
      })),
    };
  });

  const overflow =
    groupedOrder.length > visibleRows.length ? `\n\nShowing ${visibleRows.length} of ${groupedOrder.length} employees. Please narrow the date range for the rest.` : "";
  return {
    type: "attendance_view",
    scope: "team",
    rows: visibleRows,
    totalRows: groupedOrder.length,
    message: `${formatTeamAttendanceMatrix({ rows, dateKeys })}${overflow}`,
  };
};

const buildAttendanceConfirmationMessage = (updates) =>
  `I am going to make these changes:\n\n${updates
    .map((update) => {
      const timeText = update.arrivalTime ? ` at ${update.arrivalTime}` : "";
      return `${update.employeeName} -> ${update.status} -> ${update.date}${timeText}`;
    })
    .join("\n")}\n\nDo you want me to apply these changes?`;

const normalizeUpdateRequests = (args = {}) => {
  const commonDate = args.date || args.startDate || "";
  const employees = Array.isArray(args.employees) ? args.employees : [];
  const originalText = args.originalMessage || args.dateText || "";
  const inferredStatus = inferStatusFromText(originalText);
  const inferredEmployeeName = inferEmployeeNameFromText(originalText);
  const inferredEmployeeNames = splitEmployeeNamesFromText(originalText);
  const inferredArrivalTime = parseArrivalTime(originalText).time || "";
  const commonStatus = args.status || inferredStatus;
  const commonArrivalTime = args.arrivalTime || args.time || inferredArrivalTime;

  if (inferredEmployeeNames.length > 1 && employees.length <= 1) {
    return inferredEmployeeNames.map((employeeName) => ({
      employeeName,
      status: commonStatus,
      arrivalTime: commonArrivalTime,
      date: commonDate,
      dateText: args.dateText || args.originalMessage,
    }));
  }

  if (employees.length) {
    return employees.map((item) => ({
      employeeName: item.employeeName || item.name || "",
      status: item.status || commonStatus,
      arrivalTime: item.arrivalTime || item.time || commonArrivalTime,
      date: item.date || commonDate,
      dateText: item.dateText || args.dateText || args.originalMessage,
    }));
  }

  return [
    {
      employeeName: args.employeeName || args.name || inferredEmployeeName,
      status: commonStatus,
      arrivalTime: commonArrivalTime,
      date: commonDate,
      dateText: args.dateText || args.originalMessage,
    },
  ];
};

const resolveUpdateDate = (request = {}) => {
  const range = resolveDateRange({
    date: request.date,
    dateText: request.dateText,
  });
  return range;
};

const createPendingAction = async ({ actor, action, payload, preview, employees }) => {
  const pending = await AiPendingAction.create({
    requestedBy: actor._id,
    requestedByName: labelOfUser(actor),
    action,
    payload,
    preview,
    affectedTeamLeaders: [...new Set(employees.map((employee) => employee.teamLeader).filter(Boolean))],
    affectedEmployees: employees.map((employee) => employee.employeeUserId).filter(Boolean),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  return pending;
};

const findPendingAction = (userId) =>
  AiPendingAction.findOne({
    requestedBy: userId,
    status: "WAITING_FOR_APPROVAL",
    action: { $nin: ["ATTENDANCE_TIME_REQUIRED", "TEAM_ATTENDANCE_TIME_REQUIRED"] },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

const findPendingTimeRequest = (userId) =>
  AiPendingAction.findOne({
    requestedBy: userId,
    status: "WAITING_FOR_APPROVAL",
    action: { $in: ["ATTENDANCE_TIME_REQUIRED", "TEAM_ATTENDANCE_TIME_REQUIRED"] },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

export const getAttendanceStatuses = async () => ({
  type: "attendance_statuses",
  statuses: getAllowedAttendanceStatuses(),
});

export const getAttendance = async ({ actor, args = {} }) => {
  const originalText = args.originalMessage || args.dateText || "";
  const isTeamScope = args.scope === "team" || isTeamReference(originalText);
  const explicitEmployeeName = args.employeeName || args.name || "";
  const employeeName = explicitEmployeeName || (isSelfReference(originalText) ? "" : inferEmployeeNameFromText(originalText));
  const own = !isTeamScope && !employeeName && (args.scope === "self" || !explicitEmployeeName);
  const range = resolveDateRange({
    date: args.date,
    startDate: args.startDate,
    endDate: args.endDate,
    dateText: originalText,
  });
  const dateKeys = enumerateDateKeys(range.startDate, range.endDate);
  const rows = [];

  if (isTeamScope) {
    return getTeamAttendance({ actor, dateKeys });
  }

  if (own) {
    for (const dateKey of dateKeys) {
      const resolved = await resolveOneRosterEmployee({ actor, dateKey, own: true });
      if (!resolved.ok) {
        rows.push({ date: dateKey, message: resolved.reason });
        continue;
      }
      rows.push({
        date: dateKey,
        employeeName: resolved.match.employee.name,
        ...getDailyStatus(resolved.match.employee, dateKey),
      });
    }
    return { type: "attendance_view", rows, message: formatAttendanceViewMessage(rows) };
  }

  for (const dateKey of dateKeys) {
    const resolved = await resolveOneRosterEmployee({ actor, dateKey, employeeName });
    if (!resolved.ok) return { type: "attendance_view_error", message: resolved.reason };
    if (!(await canViewAttendance(actor, resolved.match.employee))) {
      return { type: "attendance_view_error", message: `You are not authorized to view ${resolved.match.employee.name}'s attendance.` };
    }
    rows.push({
      date: dateKey,
      employeeName: resolved.match.employee.name,
      ...getDailyStatus(resolved.match.employee, dateKey),
    });
  }
  return { type: "attendance_view", rows, message: formatAttendanceViewMessage(rows) };
};

export const getMyAttendance = async ({ actor, args = {} }) =>
  getAttendance({ actor, args: { ...args, scope: "self" } });

export const getEmployeeAttendance = async ({ actor, args = {} }) =>
  getAttendance({ actor, args: { ...args, scope: "employee" } });

export const getTeamAttendanceTool = async ({ actor, args = {} }) =>
  getAttendance({ actor, args: { ...args, scope: "team" } });

const buildTeamAttendanceUpdates = async ({ actor, dateKey }) => {
  const rosters = await findRostersForDate(dateKey);
  const updates = [];
  const seen = new Set();

  for (const roster of rosters) {
    for (const week of roster.weeks || []) {
      if (!weekContainsDate(week, dateKey)) continue;

      for (const employee of week.employees || []) {
        if (!employee) continue;
        if (!(await canUpdateAttendance(actor, employee))) continue;

        const key = String(employee.userId || employee.empId || normalize(employee.name));
        if (seen.has(key)) continue;
        seen.add(key);

        updates.push({
          rosterId: roster._id,
          weekId: week._id,
          weekNumber: week.weekNumber,
          employeeId: employee._id,
          employeeUserId: employee.userId || null,
          employeeName: employee.name,
          teamLeader: employee.teamLeader || "",
          date: dateKey,
          status: "P",
          arrivalTime: "",
        });
      }
    }
  }

  return updates;
};

export const previewAttendanceUpdate = async ({ actor, args = {} }) => {
  const requests = normalizeUpdateRequests(args);
  const statuses = getAllowedAttendanceStatuses();
  const updates = [];
  const failures = [];
  let requiresTime = false;

  for (const request of requests) {
    const status = normalizeAttendanceStatus(request.status);
    if (!status) {
      failures.push(`"${request.status}" is not a valid CRM attendance status. Valid statuses: ${statuses.join(", ")}`);
      continue;
    }

    if (!request.employeeName) {
      failures.push("Employee name is required for attendance updates.");
      continue;
    }

    const range = resolveUpdateDate(request);
    if (!range.startDate || range.startDate !== range.endDate) {
      failures.push(`Please provide a single date for ${request.employeeName} attendance update.`);
      continue;
    }

    const resolved = await resolveOneRosterEmployee({ actor, dateKey: range.startDate, employeeName: request.employeeName });
    if (!resolved.ok) {
      failures.push(resolved.reason);
      continue;
    }

    if (!(await canUpdateAttendance(actor, resolved.match.employee))) {
      failures.push(
        isAttendanceSupervisor(actor)
          ? `You are not authorized to update ${resolved.match.employee.name}; they are not part of your team.`
          : `You are not authorized to update ${resolved.match.employee.name}.`
      );
      continue;
    }

    const parsedTime = request.arrivalTime ? parseArrivalTime(request.arrivalTime) : { time: "", ambiguous: false };
    if (request.arrivalTime && !parsedTime.time) {
      failures.push(`"${request.arrivalTime}" is not a valid arrival time. Use HH:MM format, for example 09:30.`);
      continue;
    }
    if (parsedTime.ambiguous) {
      return {
        type: "clarification",
        message: `Do you mean ${parsedTime.time} AM or ${parsedTime.time} PM?`,
      };
    }
    if (status === "P" && !parsedTime.time) requiresTime = true;

    updates.push({
      rosterId: resolved.match.roster._id,
      weekId: resolved.match.week._id,
      weekNumber: resolved.match.week.weekNumber,
      employeeId: resolved.match.employee._id,
      employeeUserId: resolved.match.employee.userId || null,
      employeeName: resolved.match.employee.name,
      teamLeader: resolved.match.employee.teamLeader || "",
      date: range.startDate,
      status,
      arrivalTime: parsedTime.time || "",
    });
  }

  if (failures.length) {
    return { type: "validation_error", message: `I cannot prepare this update:\n${failures.map((item) => `- ${item}`).join("\n")}\nNo changes were made.` };
  }
  if (!updates.length) {
    return { type: "validation_error", message: "I could not find any valid attendance updates to preview. No changes were made." };
  }

  if (requiresTime) {
    const pending = await createPendingAction({
      actor,
      action: "ATTENDANCE_TIME_REQUIRED",
      payload: { updates },
      preview: {
        updates: updates.map((update) => ({
          employeeName: update.employeeName,
          status: update.status,
          date: update.date,
          teamLeader: update.teamLeader,
        })),
      },
      employees: updates,
    });

    const waitingEmployees = updates.filter((update) => update.status === "P" && !update.arrivalTime);
    return {
      type: "clarification",
      pendingActionId: pending._id,
      preview: pending.preview,
      message: `Please provide the arrival time for ${waitingEmployees.map((update) => update.employeeName).join(", ")} in HH:MM format, for example 09:30.`,
    };
  }

  const pending = await createPendingAction({
    actor,
    action: "BULK_UPDATE_ATTENDANCE",
    payload: { updates },
    preview: {
      updates: updates.map((update) => ({
        employeeName: update.employeeName,
        status: update.status,
        date: update.date,
        teamLeader: update.teamLeader,
        arrivalTime: update.arrivalTime || "",
      })),
    },
    employees: updates,
  });

  return {
    type: "confirmation_required",
    pendingActionId: pending._id,
    preview: pending.preview,
    message: buildAttendanceConfirmationMessage(updates),
  };
};

export const previewTeamAttendanceUpdate = async ({ actor, args = {} }) => {
  if (!isAttendanceSupervisor(actor)) {
    return { type: "authorization_error", message: "Only a team leader can update team attendance." };
  }

  const range = resolveUpdateDate({
    date: args.date,
    dateText: args.dateText || args.originalMessage || "",
  });
  if (!range.startDate || range.startDate !== range.endDate) {
    return { type: "validation_error", message: "Please provide a single date for the team attendance update." };
  }

  const updates = await buildTeamAttendanceUpdates({ actor, dateKey: range.startDate });
  if (!updates.length) {
    return { type: "authorization_error", message: "I could not find any employees in your team for that date." };
  }

  const parsedTime = args.arrivalTime ? parseArrivalTime(args.arrivalTime) : { time: "", ambiguous: false };
  if (args.arrivalTime && !parsedTime.time) {
    return {
      type: "validation_error",
      message: `"${args.arrivalTime}" is not a valid arrival time. Use HH:MM format, for example 09:30.`,
    };
  }
  if (parsedTime.ambiguous) {
    return {
      type: "clarification",
      message: `Do you mean ${parsedTime.time} AM or ${parsedTime.time} PM?`,
    };
  }

  const finalUpdates = updates.map((update) => ({
    ...update,
    arrivalTime: parsedTime.time || "",
  }));

  if (!parsedTime.time) {
    const pending = await createPendingAction({
      actor,
      action: "TEAM_ATTENDANCE_TIME_REQUIRED",
      payload: { updates: finalUpdates },
      preview: {
        updates: finalUpdates.map((update) => ({
          employeeName: update.employeeName,
          status: update.status,
          date: update.date,
          teamLeader: update.teamLeader,
        })),
      },
      employees: finalUpdates,
    });

    return {
      type: "clarification",
      pendingActionId: pending._id,
      preview: pending.preview,
      message: "Please provide the department arrival time for your team in HH:MM format, for example 09:30 or 06:38 PM.",
    };
  }

  const pending = await createPendingAction({
    actor,
    action: "BULK_UPDATE_ATTENDANCE",
    payload: { updates: finalUpdates },
    preview: {
      updates: finalUpdates.map((update) => ({
        employeeName: update.employeeName,
        status: update.status,
        date: update.date,
        teamLeader: update.teamLeader,
        arrivalTime: update.arrivalTime,
      })),
    },
    employees: finalUpdates,
  });

  return {
    type: "confirmation_required",
    pendingActionId: pending._id,
    preview: pending.preview,
    message: buildAttendanceConfirmationMessage(finalUpdates),
  };
};

export const getPreviousRoster = async ({ actor, args = {} }) => {
  if (!(isAttendanceSuperAdmin(actor) || isAttendanceHr(actor) || isAttendanceSupervisor(actor))) {
    return { type: "authorization_error", message: "You are not authorized to inspect roster reuse." };
  }

  const sourceStart = args.sourceStartDate ? parseYmdToUtcDate(args.sourceStartDate) : null;
  const sourceEnd = args.sourceEndDate ? parseYmdToUtcDate(args.sourceEndDate) : null;
  const targetStart = args.targetStartDate ? parseYmdToUtcDate(args.targetStartDate) : null;
  const targetEnd = args.targetEndDate ? parseYmdToUtcDate(args.targetEndDate) : null;

  if (!sourceStart || !sourceEnd || !targetStart || !targetEnd) {
    return {
      type: "clarification",
      message:
        "Please share the source week and target week date ranges in YYYY-MM-DD format. Example: source 2026-08-03 to 2026-08-09, target 2026-08-10 to 2026-08-16.",
    };
  }

  const sourceStartKey = toIstDateKey(sourceStart);
  const sourceEndKey = toIstDateKey(sourceEnd);
  const targetStartKey = toIstDateKey(targetStart);
  const targetEndKey = toIstDateKey(targetEnd);

  if (!sourceStartKey || !sourceEndKey || !targetStartKey || !targetEndKey) {
    return {
      type: "validation_error",
      message: "One or more roster dates are invalid. Please use YYYY-MM-DD for all week dates.",
    };
  }

  if (sourceStartKey > sourceEndKey || targetStartKey > targetEndKey) {
    return {
      type: "validation_error",
      message: "Each roster week needs a valid start and end date.",
    };
  }

  const sourceRosters = await findRostersForRange({ startKey: sourceStartKey, endKey: sourceEndKey });
  let sourceRoster = null;
  let sourceWeek = null;
  let sourceEmployees = [];
  const actorPrivileged = isAttendanceSuperAdmin(actor) || isAttendanceHr(actor);
  const actorAliases = userAliases(actor);

  for (const roster of sourceRosters) {
    for (const week of roster.weeks || []) {
      if (!weekContainsDate(week, sourceStartKey)) continue;
      const employees = (week.employees || []).filter((employee) => {
        if (!employee) return false;
        if (actorPrivileged) return true;
        return actorAliases.has(normalize(employee.teamLeader));
      });
      if (employees.length) {
        sourceRoster = roster;
        sourceWeek = week;
        sourceEmployees = employees;
        break;
      }
    }
    if (sourceEmployees.length) break;
  }

  if (!sourceEmployees.length) {
    return { type: "not_found", message: `I could not find a source roster from ${sourceStartKey} to ${sourceEndKey}. No changes were made.` };
  }

  return buildRosterReusePreview({
    actor,
    sourceRoster,
    sourceWeek,
    sourceStartKey,
    sourceEndKey,
    targetStartKey,
    targetEndKey,
  });
};

export const previewRosterReuse = async ({ actor, args = {} }) => {
  const preview = await getPreviousRoster({ actor, args });
  if (preview.type !== "roster_preview") return preview;

  const employeeTeamLeaders = [...new Set((preview.employees || []).map((employee) => employee.teamLeader).filter(Boolean))];

  const pending = await AiPendingAction.create({
    requestedBy: actor._id,
    requestedByName: labelOfUser(actor),
    action: "REUSE_ROSTER",
    payload: {
      sourceRosterId: preview.sourceRosterId,
      sourceWeekId: preview.sourceWeekId,
      targetRosterId: null,
      sourceStartKey: preview.sourceStartDate,
      sourceEndKey: preview.sourceEndDate,
      targetStartKey: preview.targetStartDate,
      targetEndKey: preview.targetEndDate,
    },
    preview,
    affectedTeamLeaders: employeeTeamLeaders,
    affectedEmployees: [],
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  return {
    type: "confirmation_required",
    action: "REUSE_ROSTER",
    pendingActionId: pending._id,
    preview: pending.preview,
    message: `Review the editable form below, update any daily statuses if needed, then confirm to reuse ${preview.employeeCount} employees from ${preview.sourceRange} for ${preview.targetRange}.`,
  };
};

const applyAttendanceUpdates = async ({ req, pending }) => {
  const updates = pending.payload?.updates || [];
  const groups = new Map();

  for (const update of updates) {
    const roster = await Roster.findById(update.rosterId);
    const week = roster?.weeks?.id(update.weekId);
    const employee = week?.employees?.id(update.employeeId);
    if (!roster || !week || !employee) throw new Error(`${update.employeeName} is no longer available in the selected roster.`);
    if (!(await canUpdateAttendance(req.user, employee))) throw new Error(`You are no longer authorized to update ${employee.name}.`);
    const status = normalizeAttendanceStatus(update.status);
    if (!status) throw new Error(`${update.status} is no longer a valid CRM attendance status.`);

    const arrivalTime = update.arrivalTime || "";
    const key = `${update.rosterId}:${update.weekNumber}:${update.date}:${status}:${arrivalTime}`;
    if (!groups.has(key)) {
      groups.set(key, {
        rosterId: update.rosterId,
        weekNumber: update.weekNumber,
        date: update.date,
        status,
        arrivalTime,
        employeeIds: [],
      });
    }
    groups.get(key).employeeIds.push(update.employeeId);
  }

  const results = [];
  for (const group of groups.values()) {
    const controllerReq = {
      ...req,
      body: {
        rosterId: group.rosterId,
        weekNumber: group.weekNumber,
        employeeIds: group.employeeIds,
        date: group.date,
        departmentStatus: group.status,
        ...(group.arrivalTime ? { arrivalTime: group.arrivalTime } : {}),
      },
    };
    const result = await invokeController(updateAttendanceBulk, controllerReq);
    if (result.statusCode >= 400 || result.payload?.success === false) {
      throw new Error(result.payload?.message || "Attendance update failed.");
    }
    results.push(result.payload);
  }

  return {
    groups: results.length,
    updates: updates.map((item) => ({
      employeeName: item.employeeName,
      status: item.status,
      date: item.date,
      arrivalTime: item.arrivalTime || "",
    })),
  };
};

const applyRosterReuse = async ({ req, pending }) => {
  const payload = pending.payload || {};
  const sourceRoster = await Roster.findById(payload.sourceRosterId);
  const sourceWeek = sourceRoster?.weeks?.id(payload.sourceWeekId);
  if (!sourceRoster || !sourceWeek) throw new Error("Source roster no longer exists.");

  const actorPrivileged = isAttendanceSuperAdmin(req.user) || isAttendanceHr(req.user);
  const actorAliases = userAliases(req.user);
  const employees = (sourceWeek.employees || []).filter((employee) => {
    if (actorPrivileged) return true;
    return actorAliases.has(normalize(employee.teamLeader));
  });
  if (!employees.length) throw new Error("No authorized source employees remain for roster reuse.");

  const targetDays = buildRosterReuseDays(payload.targetStartKey, payload.targetEndKey);
  if (!targetDays.length) throw new Error("Target roster date range is invalid.");

  const draftEmployees = Array.isArray(payload.draft?.employees) ? payload.draft.employees : [];
  const draftByKey = new Map(
    draftEmployees
      .map((employee) => [rosterReuseEmployeeKey(employee), employee])
      .filter(([key]) => Boolean(key))
  );

  const targetStart = parseYmdToUtcDate(payload.targetStartKey);
  const targetEnd = parseYmdToUtcDate(payload.targetEndKey);
  let targetRoster = payload.targetRosterId ? await Roster.findById(payload.targetRosterId) : null;
  if (!targetRoster) {
    targetRoster = await findOrCreateTargetRoster({
      targetStart,
      targetEnd,
      actorId: req.user._id,
    });
  }

  let targetWeek = (targetRoster.weeks || []).find((week) => weekContainsDate(week, payload.targetStartKey));
  if (!targetWeek) {
    const nextWeekNumber = Math.max(0, ...(targetRoster.weeks || []).map((week) => Number(week.weekNumber) || 0)) + 1;
    targetRoster.weeks.push({
      weekNumber: nextWeekNumber,
      startDate: targetStart,
      endDate: targetEnd,
      employees: [],
    });
    targetWeek = targetRoster.weeks[targetRoster.weeks.length - 1];
  }

  const existingKeys = new Set((targetWeek.employees || []).map((employee) => String(employee.userId || normalize(employee.name))));
  const copied = [];
  for (const employee of employees) {
    const key = String(employee.userId || normalize(employee.name));
    if (existingKeys.has(key)) continue;
    copied.push(employee.name);
    const draftEmployee = draftByKey.get(rosterReuseEmployeeKey(employee));
    const draftDailyStatus = Array.isArray(draftEmployee?.dailyStatus) ? draftEmployee.dailyStatus : [];
    const sourceDailyStatus = Array.isArray(employee.dailyStatus) ? employee.dailyStatus : [];
    targetWeek.employees.push({
      userId: employee.userId || null,
      name: employee.name,
      empId: employee.empId || "",
      department: employee.department || "Operations",
      transport: employee.transport || "",
      cabRoute: employee.cabRoute || "",
      shiftStartHour: employee.shiftStartHour,
      shiftEndHour: employee.shiftEndHour,
      teamLeader: employee.teamLeader || "",
      dailyStatus: targetDays.map((day, index) => {
        const draftDay = draftDailyStatus[index] || {};
        const sourceDay = sourceDailyStatus[index] || {};
        const status = normalizeAttendanceStatus(draftDay.status || sourceDay.status || "P") || "P";
        return {
          date: parseYmdToUtcDate(day.date),
          status,
          departmentStatus: "",
          transportStatus: "",
        };
      }),
    });
  }

  targetRoster.updatedBy = req.user._id;
  targetRoster.markModified("weeks");
  await targetRoster.save();
  return { copiedCount: copied.length, copiedEmployees: copied, targetRosterId: targetRoster._id };
};

export const cancelPendingAction = async ({ actor }) => {
  const pending = (await findPendingAction(actor._id)) || (await findPendingTimeRequest(actor._id));
  if (!pending) return { type: "cancel", message: "There is no pending AI action to cancel." };
  pending.status = "CANCELLED";
  pending.result = { cancelledAt: new Date() };
  await pending.save();
  return { type: "cancel", message: "Cancelled. No attendance or roster changes were made." };
};

export const completePendingAttendanceTime = async ({ actor, message = "" }) => {
  const pendingTime = await findPendingTimeRequest(actor._id);
  if (!pendingTime) return null;

  const parsed = parseArrivalTime(message);
  if (!parsed.time) {
    return {
      type: "clarification",
      pendingActionId: pendingTime._id,
      preview: pendingTime.preview,
      message: "Please provide the arrival time in HH:MM format, for example 09:30 or 06:38 PM.",
    };
  }
  if (parsed.ambiguous) {
    return {
      type: "clarification",
      pendingActionId: pendingTime._id,
      preview: pendingTime.preview,
      message: `Do you mean ${parsed.time} AM or ${parsed.time} PM?`,
    };
  }

  const updates = (pendingTime.payload?.updates || []).map((update) => ({
    ...update,
    arrivalTime: update.status === "P" ? parsed.time : update.arrivalTime || "",
  }));

  pendingTime.status = "COMPLETED";
  pendingTime.result = { arrivalTime: parsed.time, completedAt: new Date() };
  await pendingTime.save();

  const pending = await createPendingAction({
    actor,
    action: "BULK_UPDATE_ATTENDANCE",
    payload: { updates },
    preview: {
      updates: updates.map((update) => ({
        employeeName: update.employeeName,
        status: update.status,
        date: update.date,
        teamLeader: update.teamLeader,
        arrivalTime: update.arrivalTime,
      })),
    },
    employees: updates,
  });

  return {
    type: "confirmation_required",
    pendingActionId: pending._id,
    preview: pending.preview,
    message: buildAttendanceConfirmationMessage(updates),
  };
};

export const confirmPendingAction = async ({ req }) => {
  const pending = await findPendingAction(req.user._id);
  if (!pending) return { type: "confirm", message: "There is no pending AI action to confirm." };

  pending.status = "EXECUTING";
  if (pending.action === "REUSE_ROSTER" && req.body?.rosterReuseDraft) {
    pending.payload = {
      ...(pending.payload || {}),
      draft: req.body.rosterReuseDraft,
    };
  }
  pending.approval.approvedBy = req.user._id;
  pending.approval.approvedByName = labelOfUser(req.user);
  pending.approval.approvedAt = new Date();
  await pending.save();

  try {
    const result = pending.action === "REUSE_ROSTER" ? await applyRosterReuse({ req, pending }) : await applyAttendanceUpdates({ req, pending });
    pending.status = "COMPLETED";
    pending.result = result;
    await pending.save();
    return {
      type: "execution_result",
      action: pending.action,
      result,
      message: pending.action === "REUSE_ROSTER" ? `Done. Copied ${result.copiedCount} employees into the target roster.` : `Done. Updated ${result.updates.length} attendance record${result.updates.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    pending.status = "FAILED";
    pending.failureMessage = error.message || "Execution failed";
    await pending.save();
    return { type: "execution_error", message: `The action failed before completion: ${pending.failureMessage}` };
  }
};

export const bulkUpdateAttendance = confirmPendingAction;
export const reuseRoster = confirmPendingAction;
export const getPendingActionForUser = findPendingAction;

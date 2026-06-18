// import PunchSession from "../Modals/PunchSession.modal.js";
// import Roster from "../Modals/Roster.modal.js";
// import User from "../Modals/User.modal.js";
// import XLSX from "xlsx-js-style";
// import { getTeamMembersByTeamLeader } from "../utils/teamHelper.js";

// const APP_TZ = "Asia/Kolkata";
// const IDLE_WARN_MS = 25 * 60 * 1000;
// const SESSION_RESUME_GRACE_MS = 0;
// const OPERATIONAL_DAY_START_HOUR_IST = 14; // 2:00 PM IST
// const PUNCHX_DEBUG_TIME = process.env.PUNCHX_DEBUG_TIME === "1";

// const getNow = () => new Date();

// const getNyDateKey = (date = new Date()) => {
//   const parts = new Intl.DateTimeFormat("en-CA", {
//     timeZone: APP_TZ,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(date);

//   const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
//   return `${map.year}-${map.month}-${map.day}`;
// };

// const getNyHour = (date = new Date()) => {
//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: APP_TZ,
//     hour12: false,
//     hour: "2-digit",
//   }).formatToParts(date);
//   const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
//   return Number(map.hour);
// };

// const getOperationalWindowStartForDateKeyMs = (dateKey = "") => {
//   const dayStartMs = parseDateKeyStartMs(dateKey);
//   if (!Number.isFinite(dayStartMs)) return null;
//   return dayStartMs + OPERATIONAL_DAY_START_HOUR_IST * 60 * 60 * 1000;
// };

// const debugTime = (label, payload = {}) => {
//   if (!PUNCHX_DEBUG_TIME) return;
//   console.log(`[PunchXTime] ${label}`, payload);
// };

// const parseDateKeyStartMs = (dateKey) => {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return null;
//   const ms = Date.parse(`${dateKey}T00:00:00+05:30`);
//   return Number.isFinite(ms) ? ms : null;
// };

// const overlaps = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && aEnd >= bStart;

// const normalizeRosterName = (value = "") =>
//   String(value || "")
//     .trim()
//     .toLowerCase()
//     .replace(/[._\-()/,]+/g, " ")
//     .replace(/\s+/g, " ");

// const getRosterPresentCountForUsers = async (employees = [], dateKey = "", options = {}) => {
//   const countAllRosterEmployees = options?.countAllRosterEmployees === true;
//   const targetIds = new Set((employees || []).map((employee) => String(employee?._id || "")).filter(Boolean));
//   const userIdByEmpId = new Map();
//   const userIdByName = new Map();

//   for (const employee of employees || []) {
//     const userId = String(employee?._id || "").trim();
//     if (!userId) continue;

//     const empId = String(employee?.empId || "").trim().toLowerCase();
//     if (empId && !userIdByEmpId.has(empId)) {
//       userIdByEmpId.set(empId, userId);
//     }

//     const nameKeys = [
//       employee?.pseudoName,
//       employee?.realName,
//       employee?.username,
//       `${employee?.pseudoName || ""} ${employee?.department || ""}`,
//       `${employee?.realName || ""} ${employee?.department || ""}`,
//     ]
//       .map(normalizeRosterName)
//       .filter(Boolean);

//     for (const nameKey of nameKeys) {
//       if (!userIdByName.has(nameKey)) {
//         userIdByName.set(nameKey, userId);
//       }
//     }
//   }

//   const dayStartMs = parseDateKeyStartMs(dateKey);
//   if ((!countAllRosterEmployees && !targetIds.size) || !Number.isFinite(dayStartMs)) return 0;

//   const dayStart = new Date(dayStartMs);
//   const dayEnd = new Date(dayStartMs + 24 * 60 * 60 * 1000 - 1);
//   const rosters = await Roster.find({
//     $or: [
//       {
//         rosterStartDate: { $lte: dayEnd },
//         rosterEndDate: { $gte: dayStart },
//       },
//       {
//         weeks: {
//           $elemMatch: {
//             startDate: { $lte: dayEnd },
//             endDate: { $gte: dayStart },
//           },
//         },
//       },
//     ],
//   })
//     .select("weeks.startDate weeks.endDate weeks.employees.userId weeks.employees.empId weeks.employees.name weeks.employees.dailyStatus")
//     .lean();

//   const presentIds = new Set();
//   const rosterStatusByUserId = new Map();
//   for (const roster of rosters || []) {
//     for (const week of roster?.weeks || []) {
//       const weekStart = week?.startDate ? new Date(week.startDate) : null;
//       const weekEnd = week?.endDate ? new Date(week.endDate) : null;
//       if (!weekStart || !weekEnd || Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) continue;
//       if (!overlaps(weekStart, weekEnd, dayStart, dayEnd)) continue;

//       for (const employee of week?.employees || []) {
//         const rosterUserId = String(employee?.userId || "").trim();
//         const rosterEmpId = String(employee?.empId || "").trim().toLowerCase();
//         const rosterNameKey = normalizeRosterName(employee?.name || "");
//         const matchedUserId =
//           (rosterUserId && targetIds.has(rosterUserId) ? rosterUserId : "") ||
//           userIdByEmpId.get(rosterEmpId) ||
//           userIdByName.get(rosterNameKey) ||
//           "";
//         const presentKey = matchedUserId ||
//           (countAllRosterEmployees
//             ? (rosterUserId ? `uid:${rosterUserId}` : rosterEmpId ? `emp:${rosterEmpId}` : rosterNameKey ? `name:${rosterNameKey}` : "")
//             : "");

//         if (!presentKey || presentIds.has(presentKey)) continue;

//         const matchingDay = (employee?.dailyStatus || []).find((dayEntry) => {
//           if (!dayEntry?.date) return false;
//           const dayDate = new Date(dayEntry.date);
//           if (Number.isNaN(dayDate.getTime())) return false;
//           return getNyDateKey(dayDate) === dateKey;
//         });
//         if (!matchingDay) continue;

//         const effectiveStatus = String(
//           matchingDay?.status ||
//           matchingDay?.departmentStatus ||
//           matchingDay?.transportStatus ||
//           "P"
//         ).trim().toUpperCase();

//         if (matchedUserId && !rosterStatusByUserId.has(matchedUserId)) {
//           rosterStatusByUserId.set(matchedUserId, effectiveStatus || "P");
//         }

//         if (effectiveStatus === "P") {
//           presentIds.add(presentKey);
//         }
//       }
//     }
//   }

//   return {
//     presentCount: presentIds.size,
//     rosterStatusByUserId,
//   };
// };

// const addDaysToDateKey = (dateKey, days) => {
//   const startMs = parseDateKeyStartMs(dateKey);
//   if (!Number.isFinite(startMs)) return dateKey;
//   return getNyDateKey(new Date(startMs + days * 24 * 60 * 60 * 1000));
// };

// const getOperationalWindowForDateKey = (dateKey = "") => {
//   const startMs = getOperationalWindowStartForDateKeyMs(dateKey);
//   if (!Number.isFinite(startMs)) return null;
//   const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
//   return { startMs, endMs };
// };

// const resolveOperationalDateKeyForUser = (_userLike = {}, now = new Date()) => {
//   const todayKey = getNyDateKey(now);
//   const yesterdayKey = addDaysToDateKey(todayKey, -1);
//   const nyHour = getNyHour(now);
//   if (Number.isFinite(nyHour) && nyHour < OPERATIONAL_DAY_START_HOUR_IST) {
//     debugTime("resolveOperationalDateKeyForUser", {
//       nowIso: now.toISOString(),
//       nyHour,
//       resolvedDateKey: yesterdayKey,
//       rule: "before_14_ist_use_previous_day",
//     });
//     return yesterdayKey;
//   }
//   debugTime("resolveOperationalDateKeyForUser", {
//     nowIso: now.toISOString(),
//     nyHour,
//     resolvedDateKey: todayKey,
//     rule: "at_or_after_14_ist_use_same_day",
//   });
//   return todayKey;
// };

// const toMs = (start, end) => {
//   if (!start || !end) return 0;
//   const diff = new Date(end).getTime() - new Date(start).getTime();
//   return diff > 0 ? diff : 0;
// };

// const NINE_HOURS_MS = 9 * 60 * 60 * 1000;

// const formatIstDateTime = (value) => {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "";
//   return date.toLocaleString("en-IN", {
//     timeZone: APP_TZ,
//     dateStyle: "medium",
//     timeStyle: "short",
//   });
// };

// const getBreakUsage = (session, now = getNow()) => {
//   if (!session) return { manualBreakMs: 0, autoIdleBreakMs: 0, totalBreakMs: 0 };
//   const breaks = Array.isArray(session.breaks) ? session.breaks : [];
//   let manualBreakMs = 0;

//   for (const br of breaks) {
//     const baseDuration = Number(br?.durationMs || 0);
//     const openDuration = !br?.endAt ? toMs(br?.startAt, now) : 0;
//     const durationMs = Math.max(0, baseDuration + openDuration);
//     if (br?.type === "manual") manualBreakMs += durationMs;
//   }

//   return {
//     manualBreakMs,
//     autoIdleBreakMs: 0,
//     totalBreakMs: manualBreakMs,
//   };
// };

// const addBreak = (session, type, now, meta = {}) => {
//   const existingOpen = session.breaks.find((b) => !b.endAt);
//   if (existingOpen) return false;

//   session.breaks.push({
//     type,
//     startAt: now,
//     endAt: null,
//     durationMs: 0,
//     meta,
//   });

//   if (type === "manual") session.activityStatus = "manual_break";
//   if (type === "auto_idle") {
//     session.activityStatus = "auto_break";
//     session.autoBreakStartedAt = now;
//   }
//   return true;
// };

// const closeOpenBreak = (session, now, type = null) => {
//   const idx = session.breaks.findIndex((b) => !b.endAt && (!type || b.type === type));
//   if (idx === -1) return null;

//   const br = session.breaks[idx];
//   br.endAt = now;
//   br.durationMs = toMs(br.startAt, now);
//   session.totalBreakMs += br.durationMs;

//   if (br.type === "auto_idle") {
//     session.totalIdleMs += br.durationMs;
//     session.autoBreakStartedAt = null;
//   }

//   session.activityStatus = "active";
//   return br;
// };

// const autoEndShiftIfDue = (session, now = getNow()) => {
//   if (!session?.shiftStartAt) return false;
//   if (session.shiftEndAt || session.status === "ended") return false;

//   const nowMs = new Date(now).getTime();
//   const startMs = new Date(session.shiftStartAt).getTime();
//   if (!Number.isFinite(nowMs) || !Number.isFinite(startMs)) return false;
//   if (nowMs - startMs < NINE_HOURS_MS) return false;

//   const autoEndAt = new Date(startMs + NINE_HOURS_MS);
//   closeOpenBreak(session, autoEndAt);
//   session.shiftEndAt = autoEndAt;
//   session.shiftEndReason = "auto_9h";
//   session.status = "ended";
//   session.activityStatus = "no_activity";
//   session.alerts.push({
//     type: "auto_shift_end",
//     message: "Shift auto-ended after 9 hours",
//     at: autoEndAt,
//   });
//   debugTime("autoEndShiftIfDue", {
//     sessionId: String(session?._id || ""),
//     dateKey: session?.dateKey || "",
//     autoEndAtIso: autoEndAt.toISOString(),
//     nowIso: new Date(now).toISOString(),
//   });
//   return true;
// };

// const persistAutoEndedSessions = async (sessions = [], now = getNow()) => {
//   if (!Array.isArray(sessions) || sessions.length === 0) return [];
//   const updates = [];
//   for (const session of sessions) {
//     if (!autoEndShiftIfDue(session, now)) continue;
//     updates.push({
//       updateOne: {
//         filter: { _id: session._id },
//         update: {
//           $set: {
//             shiftEndAt: session.shiftEndAt,
//             shiftEndReason: session.shiftEndReason ?? "",
//             status: session.status,
//             activityStatus: session.activityStatus,
//             autoBreakStartedAt: session.autoBreakStartedAt ?? null,
//             totalBreakMs: Number(session.totalBreakMs || 0),
//             totalIdleMs: Number(session.totalIdleMs || 0),
//             breaks: Array.isArray(session.breaks) ? session.breaks : [],
//             alerts: Array.isArray(session.alerts) ? session.alerts : [],
//           },
//         },
//       },
//     });
//   }
//   if (updates.length > 0) {
//     await PunchSession.bulkWrite(updates, { ordered: false });
//   }
//   return sessions;
// };

// const isWithinOperationalWindow = (session, _userLike = {}, now = new Date()) => {
//   const window = getOperationalWindowForDateKey(session?.dateKey || "");
//   if (!window) return false;
//   const nowMs = now.getTime();
//   return nowMs >= window.startMs && nowMs <= window.endMs + SESSION_RESUME_GRACE_MS;
// };

// const ensureSession = async (userId, userLike = {}, dateKey, now = new Date()) => {
//   const existing = await PunchSession.findOne({ userId, dateKey });
//   if (existing) return existing;

//   const nearby = await PunchSession.find({
//     userId,
//     dateKey: { $in: [addDaysToDateKey(dateKey, -1), dateKey, addDaysToDateKey(dateKey, 1)] },
//   }).sort({ updatedAt: -1 });

//   const reusable = nearby.find((s) => isWithinOperationalWindow(s, userLike, now));
//   if (reusable) return reusable;

//   const activeRecent = await PunchSession.findOne({
//     userId,
//     shiftStartAt: { $ne: null },
//     shiftEndAt: null,
//     status: { $in: ["active", "on_break"] },
//   }).sort({ shiftStartAt: -1 });
//   if (activeRecent && isWithinOperationalWindow(activeRecent, userLike, now)) return activeRecent;

//   return PunchSession.create({ userId, dateKey });
// };

// const scoreSession = (session) => {
//   let score = 100;
//   const latePenalty = session.shiftStartAt ? 0 : 25;
//   const completionPenalty = session.shiftEndAt ? 0 : 25;

//   const manualBreakMs = session.breaks
//     .filter((b) => b.type === "manual")
//     .reduce((sum, b) => sum + (b.durationMs || 0), 0);

//   const breakPenalty = manualBreakMs > 90 * 60 * 1000 ? 20 : manualBreakMs > 60 * 60 * 1000 ? 10 : 0;
//   const idlePenalty = session.totalIdleMs > 90 * 60 * 1000 ? 25 : session.totalIdleMs > 60 * 60 * 1000 ? 15 : session.totalIdleMs > 30 * 60 * 1000 ? 8 : 0;

//   score -= latePenalty + completionPenalty + breakPenalty + idlePenalty;
//   score = Math.max(0, Math.min(100, score));

//   return {
//     total: score,
//     breakdown: {
//       onTimeLogin: Math.max(0, 25 - latePenalty),
//       shiftCompletion: Math.max(0, 25 - completionPenalty),
//       breakDiscipline: Math.max(0, 25 - breakPenalty),
//       idleDiscipline: Math.max(0, 25 - idlePenalty),
//     },
//   };
// };

// const getIstHourFromDateLike = (dateLike) => {
//   const date = new Date(dateLike);
//   if (Number.isNaN(date.getTime())) return null;
//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: APP_TZ,
//     hour: "2-digit",
//     hour12: false,
//   }).formatToParts(date);
//   const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
//   return Number.isFinite(hour) ? hour : null;
// };

// const normalizeShiftStartHour = (shiftStartHour, shiftEndHour, loginHour = null) => {
//   const startHour = Number(shiftStartHour);
//   const endHour = Number(shiftEndHour);
//   if (!Number.isFinite(startHour)) return null;

//   const normalizedStart = ((startHour % 24) + 24) % 24;
//   const normalizedEnd = Number.isFinite(endHour) ? ((endHour % 24) + 24) % 24 : null;

//   const eveningLogin = Number.isFinite(loginHour) && loginHour >= OPERATIONAL_DAY_START_HOUR_IST;

//   if (
//     normalizedStart > 0 &&
//     normalizedStart < 12 &&
//     (normalizedEnd !== null ? normalizedEnd < normalizedStart : eveningLogin)
//   ) {
//     return normalizedStart + 12;
//   }

//   return normalizedStart;
// };

// const computeSessionLateByMs = (session, userLike = {}) => {
//   if (!session?.shiftStartAt) return 0;
//   const actualStartMs = new Date(session.shiftStartAt).getTime();
//   const loginHour = getIstHourFromDateLike(session.shiftStartAt);
//   const startHour = normalizeShiftStartHour(userLike?.shiftStartHour, userLike?.shiftEndHour, loginHour);
//   const dayStartMs = parseDateKeyStartMs(session?.dateKey || "");
//   if (!Number.isFinite(startHour) || !Number.isFinite(dayStartMs) || !Number.isFinite(actualStartMs)) return 0;
//   const normalizedHour = ((startHour % 24) + 24) % 24;
//   const expectedStartMs = normalizedHour >= OPERATIONAL_DAY_START_HOUR_IST
//     ? dayStartMs + normalizedHour * 60 * 60 * 1000
//     : dayStartMs + 24 * 60 * 60 * 1000 + normalizedHour * 60 * 60 * 1000;
//   return actualStartMs > expectedStartMs ? actualStartMs - expectedStartMs : 0;
// };

// const getSessionWorkedMs = (session, now = getNow()) => {
//   if (!session?.shiftStartAt) return 0;
//   const startMs = new Date(session.shiftStartAt).getTime();
//   const endMs = session?.shiftEndAt ? new Date(session.shiftEndAt).getTime() : new Date(now).getTime();
//   if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
//   const grossMs = endMs - startMs;
//   const breakUsage = getBreakUsage(session, now);
//   return Math.max(0, grossMs - Math.max(0, Number(breakUsage.totalBreakMs || 0)));
// };

// export const getTodaySession = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });

//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);
//     if (autoEndShiftIfDue(session)) {
//       await session.save();
//     }

//     return res.status(200).json({
//       session,
//       timezone: APP_TZ,
//       dateKey,
//       attendanceScore: scoreSession(session),
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to fetch session", error: error.message });
//   }
// };

// export const startShift = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);

//     if (session.status === "ended" && session.shiftStartAt && session.shiftEndAt) {
//       return res.status(409).json({ message: "Shift already ended for this session", session, attendanceScore: scoreSession(session) });
//     }

//     if (!session.shiftStartAt) session.shiftStartAt = now;
//     session.status = "active";
//     session.activityStatus = "active";
//     session.lastActivityAt = now;
//     session.shiftEndReason = "";
//     await session.save();

//     return res.status(200).json({ message: "Shift started", session, attendanceScore: scoreSession(session) });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to start shift", error: error.message });
//   }
// };

// export const endShift = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);

//     closeOpenBreak(session, now);
//     session.shiftEndAt = now;
//     session.shiftEndReason = "manual";
//     session.status = "ended";
//     session.activityStatus = "no_activity";
//     await session.save();

//     return res.status(200).json({ message: "Shift ended", session, attendanceScore: scoreSession(session) });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to end shift", error: error.message });
//   }
// };

// export const startBreak = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const { type = "manual", reason = "" } = req.body || {};
//     if (!["manual", "system_disconnect"].includes(type)) {
//       return res.status(400).json({ message: "Invalid break type" });
//     }

//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);

//     if (session.status === "ended" || session.shiftEndAt) {
//       return res.status(409).json({ message: "Shift already ended", session, attendanceScore: scoreSession(session) });
//     }

//     if (autoEndShiftIfDue(session, now)) {
//       await session.save();
//       return res.status(409).json({ message: "Shift already auto-ended after 9 hours", session, attendanceScore: scoreSession(session) });
//     }

//     if (session.status === "not_started") {
//       session.shiftStartAt = now;
//       session.status = "active";
//     }

//     const added = addBreak(session, type, now, { reason, source: "ui" });
//     if (!added) return res.status(409).json({ message: "A break is already active", session });

//     await session.save();
//     return res.status(200).json({ message: "Break started", session, attendanceScore: scoreSession(session) });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to start break", error: error.message });
//   }
// };

// export const endBreak = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const { type } = req.body || {};
//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);

//     if (session.status === "ended" || session.shiftEndAt) {
//       return res.status(409).json({ message: "Shift already ended", session, attendanceScore: scoreSession(session) });
//     }

//     if (autoEndShiftIfDue(session, now)) {
//       await session.save();
//       return res.status(409).json({ message: "Shift already auto-ended after 9 hours", session, attendanceScore: scoreSession(session) });
//     }

//     const closed = closeOpenBreak(session, now, type || null);
//     if (!closed) return res.status(404).json({ message: "No active break found", session });

//     session.lastActivityAt = now;
//     await session.save();
//     return res.status(200).json({ message: "Break ended", session, attendanceScore: scoreSession(session) });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to end break", error: error.message });
//   }
// };

// export const postActivity = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const session = await ensureSession(userId, userProfile || {}, dateKey, now);

//     if (session.status === "ended" || session.shiftEndAt) {
//       return res.status(409).json({
//         message: "Shift already ended",
//         session,
//         attendanceScore: scoreSession(session),
//       });
//     }

//     if (autoEndShiftIfDue(session, now)) {
//       await session.save();
//       return res.status(200).json({
//         message: "Shift already auto-ended after 9 hours",
//         session,
//         attendanceScore: scoreSession(session),
//       });
//     }

//     const { eventType = "mousemove", occurredAt } = req.body || {};
//     const eventAt = occurredAt ? new Date(occurredAt) : now;

//     const last = session.lastActivityAt ? new Date(session.lastActivityAt) : null;
//     const idleMs = last ? toMs(last, eventAt) : 0;

//     if (idleMs >= IDLE_WARN_MS) {
//       session.activityStatus = "idle_warning";
//       session.idleWarningAt = eventAt;
//     }

//     if (!session.shiftStartAt) {
//       session.shiftStartAt = now;
//       session.status = "active";
//     }

//     session.lastActivityAt = eventAt;
//     if (!["manual_break"].includes(session.activityStatus)) {
//       session.activityStatus = "active";
//     }

//     await session.save();

//     return res.status(200).json({
//       message: "Activity captured",
//       eventType,
//       session,
//       attendanceScore: scoreSession(session),
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to capture activity", error: error.message });
//   }
// };

// export const getSessionHistory = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });

//     const now = getNow();
//     const userProfile = await User.findById(userId).select("shiftStartHour").lean();
//     const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
//     const currentSession = await PunchSession.findOne({ userId, dateKey });
//     if (currentSession && autoEndShiftIfDue(currentSession, now)) {
//       await currentSession.save();
//     }

//     const page = Math.max(1, Number.parseInt(req.query?.page || "1", 10) || 1);
//     const limit = Math.min(50, Math.max(5, Number.parseInt(req.query?.limit || "5", 10) || 5));
//     const skip = (page - 1) * limit;

//     const query = {
//       userId,
//       shiftStartAt: { $ne: null },
//     };

//     const [total, sessions] = await Promise.all([
//       PunchSession.countDocuments(query),
//       PunchSession.find(query)
//         .sort({ shiftStartAt: -1, updatedAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//     ]);

//     const items = sessions.map((session) => {
//       const breakUsage = getBreakUsage(session);
//       const totalWorkedMs = getSessionWorkedMs(session, session?.shiftEndAt || new Date());
//       const durationMs = Number.isFinite(totalWorkedMs) ? totalWorkedMs : 0;
//       return {
//         id: String(session._id),
//         dateKey: session.dateKey || "",
//         loginTime: session.shiftStartAt || null,
//         logoutTime: session.shiftEndAt || null,
//         logoutReason: session.shiftEndReason || (session.shiftEndAt ? "manual" : ""),
//         status: session.status || "not_started",
//         activityStatus: session.activityStatus || "no_activity",
//         totalWorkedMs: durationMs,
//         totalBreakMs: Number(breakUsage.totalBreakMs || 0),
//         manualBreakMs: Number(breakUsage.manualBreakMs || 0),
//         alertCount: Array.isArray(session.alerts) ? session.alerts.length : 0,
//         latestAlert: Array.isArray(session.alerts) && session.alerts.length > 0 ? session.alerts[session.alerts.length - 1] : null,
//         hasCompletedNineHours: durationMs >= NINE_HOURS_MS,
//       };
//     });

//     return res.status(200).json({
//       items,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.max(1, Math.ceil(total / limit)),
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to fetch session history", error: error.message });
//   }
// };

// export const getManagerTeamStatus = async (req, res) => {
//   try {
//     const user = req.user || {};
//     const role = String(user.roleType || user.accountType || "").toLowerCase();
//     const isSupervisor = role === "supervisor" || user.isTeamLeader;
//     const supervisorId = user?._id || user?.id || null;

//     if (!isSupervisor) return res.status(403).json({ message: "Supervisor access required" });
//     if (!supervisorId) return res.status(401).json({ message: "Supervisor identity missing" });

//     const requestedDateKey = String(req.query?.dateKey || "").trim();
//     const dateKey = requestedDateKey || resolveOperationalDateKeyForUser(user, getNow());

//     const rosterTeamMembers = await getTeamMembersByTeamLeader(supervisorId, dateKey);
//     const rosterUserIds = rosterTeamMembers
//       .map((member) => String(member?.userId || "").trim())
//       .filter(Boolean);

//     let teamMembers = [];
//     if (rosterUserIds.length > 0) {
//       const rosterMetaByUserId = new Map(
//         rosterTeamMembers
//           .filter((member) => member?.userId)
//           .map((member) => [String(member.userId), member])
//       );

//       const rosterUsers = await User.find({
//         _id: { $in: rosterUserIds, $ne: supervisorId },
//         accountType: { $in: ["employee", "agent", "supervisor"] },
//         isActive: { $ne: false },
//       })
//         .select("_id empId username realName pseudoName department accountType shiftStartHour")
//         .lean();

//       teamMembers = rosterUsers.map((member) => {
//         const rosterMeta = rosterMetaByUserId.get(String(member._id)) || {};
//         return {
//           ...member,
//           department: member.department || rosterMeta.department || "",
//           shiftStartHour:
//             Number.isFinite(Number(rosterMeta.shiftStartHour)) ? Number(rosterMeta.shiftStartHour) : member.shiftStartHour,
//         };
//       });
//     }

//     if (teamMembers.length === 0) {
//       teamMembers = await User.find({
//         accountType: { $in: ["employee", "agent", "supervisor"] },
//         reportingManager: supervisorId,
//         isActive: { $ne: false },
//         _id: { $ne: supervisorId },
//       })
//         .select("_id empId username realName pseudoName department accountType shiftStartHour")
//         .lean();
//     }

//     const ids = teamMembers.map((u) => u._id);
//     const sessions = await PunchSession.find({ userId: { $in: ids }, dateKey });
//     const now = getNow();
//     await persistAutoEndedSessions(sessions, now);
//     const byUser = new Map(sessions.map((s) => [String(s.userId), s.toObject()]));
//     const rosterSnapshot = await getRosterPresentCountForUsers(teamMembers, dateKey);
//     const presentCount = rosterSnapshot.presentCount;

//     const rows = teamMembers.map((member) => {
//       const session = byUser.get(String(member._id));
//       const breakUsage = getBreakUsage(session, now);
//       const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
//       const shiftStartHour = Number(member.shiftStartHour);
//       const lateByMs = computeSessionLateByMs(session, member);
//       const totalWorkedMs = getSessionWorkedMs(session, now);
//       return {
//         userId: member._id,
//         username: member.username || "",
//         pseudoName: member.pseudoName || "",
//         name: member.realName || member.username,
//         department: member.department,
//         activityStatus: session?.activityStatus || "no_activity",
//         lastActivityAt: session?.lastActivityAt || null,
//         idleTimeMs: session?.totalIdleMs || 0,
//         breakType: openBreak?.type || "",
//         totalBreakMs: breakUsage.totalBreakMs,
//         manualBreakMs: breakUsage.manualBreakMs,
//         autoIdleBreakMs: breakUsage.autoIdleBreakMs,
//         shiftStartHour: Number.isFinite(shiftStartHour) ? shiftStartHour : null,
//         shiftStartedAt: session?.shiftStartAt || null,
//         loginTime: session?.shiftStartAt || null,
//         logoutTime: session?.shiftEndAt || null,
//         logoutReason: session?.shiftEndReason || (session?.shiftEndAt ? "manual" : ""),
//         floorRosterStatus: rosterSnapshot.rosterStatusByUserId.get(String(member._id)) || "",
//         isOnBreak: Boolean(openBreak),
//         lateByMs,
//         totalWorkedMs: Math.max(0, totalWorkedMs),
//         remainingForNineHoursMs: Math.max(0, 9 * 60 * 60 * 1000 - totalWorkedMs),
//         hasCompletedNineHours: totalWorkedMs >= 9 * 60 * 60 * 1000,
//       };
//     });

//     const summary = {
//       totalEmployees: rows.length,
//       presentCount,
//       loggedInCount: rows.filter((r) => Boolean(r.loginTime)).length,
//       onBreakCount: rows.filter((r) => r.isOnBreak).length,
//       notCompletedNineHoursCount: rows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
//       lateLoginCount: rows.filter((r) => r.loginTime && r.lateByMs > 0).length,
//     };

//     return res.status(200).json({ dateKey, timezone: APP_TZ, summary, rows });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to fetch team status", error: error.message });
//   }
// };

// const getOpenBreak = (session) => (session?.breaks || []).find((b) => !b.endAt) || null;

// export const getSuperAdminDailyStatus = async (req, res) => {
//   try {
//     const role = String(req.user?.roleType || req.user?.accountType || "").toLowerCase();
//     const userId = req.user?._id ? String(req.user._id) : "";
//     const isSuperAdmin = role === "superadmin";
//     const isSupervisor = role === "supervisor" || Boolean(req.user?.isTeamLeader);

//     if (!isSuperAdmin && !isSupervisor) {
//       return res.status(403).json({ message: "Only superAdmin or supervisor can access this dashboard" });
//     }

//     const dateKey = String(req.query?.dateKey || resolveOperationalDateKeyForUser({}, getNow()));
//     const employeeQuery = {
//       accountType: { $in: ["employee", "agent", "supervisor"] },
//       isActive: { $ne: false },
//     };

//     if (!isSuperAdmin && userId) {
//       employeeQuery.reportingManager = req.user._id;
//     }

//     const employees = await User.find(employeeQuery)
//       .select("_id empId username realName pseudoName department accountType shiftStartHour shiftEndHour isTeamLeader")
//       .lean();

//     const employeeIds = employees.map((e) => e._id);
//     const rosterSnapshot = await getRosterPresentCountForUsers(employees, dateKey, {
//       countAllRosterEmployees: isSuperAdmin,
//     });
//     const presentCount = rosterSnapshot.presentCount;
//     const sessions = await PunchSession.find({ userId: { $in: employeeIds }, dateKey });
//     await persistAutoEndedSessions(sessions, getNow());
//     const sessionsByUser = new Map(sessions.map((s) => [String(s.userId), s.toObject()]));
//     const now = new Date();

//     const rows = employees.map((emp) => {
//       const session = sessionsByUser.get(String(emp._id)) || null;
//       const breakUsage = getBreakUsage(session, now);
//       const openBreak = getOpenBreak(session);
//       const shiftStartHour = Number(emp.shiftStartHour);
//       const lateByMs = computeSessionLateByMs(session, emp);
//       const totalWorkedMs = getSessionWorkedMs(session, now);
//       const remainingForNineHoursMs = Math.max(0, 9 * 60 * 60 * 1000 - totalWorkedMs);
//       const inactiveSinceMs = session?.lastActivityAt
//         ? Math.max(0, now.getTime() - new Date(session.lastActivityAt).getTime())
//         : 0;

//       return {
//         userId: emp._id,
//         username: emp.username || "",
//         pseudoName: emp.pseudoName || "",
//         name: emp.pseudoName || emp.username || "",
//         department: emp.department || "",
//         accountType: emp.accountType || "employee",
//         isTeamLeader: Boolean(emp.isTeamLeader),
//         shiftStartHour: Number.isFinite(Number(emp.shiftStartHour)) ? Number(emp.shiftStartHour) : null,
//         shiftEndHour: Number.isFinite(Number(emp.shiftEndHour)) ? Number(emp.shiftEndHour) : null,
//         loginTime: session?.shiftStartAt || null,
//         logoutTime: session?.shiftEndAt || null,
//         logoutReason: session?.shiftEndReason || (session?.shiftEndAt ? "manual" : ""),
//         floorRosterStatus: rosterSnapshot.rosterStatusByUserId.get(String(emp._id)) || "",
//         isOnBreak: Boolean(openBreak),
//         breakType: openBreak?.type || "",
//         breakStartAt: openBreak?.startAt || null,
//         totalBreakMs: breakUsage.totalBreakMs,
//         totalIdleMs: breakUsage.autoIdleBreakMs,
//         manualBreakMs: breakUsage.manualBreakMs,
//         autoIdleBreakMs: breakUsage.autoIdleBreakMs,
//         status: session?.status || "not_started",
//         activityStatus: session?.activityStatus || "no_activity",
//         lastActivityAt: session?.lastActivityAt || null,
//         inactiveSinceMs,
//         lateByMs,
//         totalWorkedMs: Math.max(0, totalWorkedMs),
//         remainingForNineHoursMs,
//         hasCompletedNineHours: totalWorkedMs >= 9 * 60 * 60 * 1000,
//       };
//     });

//     const summary = {
//       totalEmployees: rows.length,
//       presentCount,
//       loggedInCount: rows.filter((r) => Boolean(r.loginTime)).length,
//       onBreakCount: rows.filter((r) => r.isOnBreak).length,
//       notCompletedNineHoursCount: rows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
//       lateLoginCount: rows.filter((r) => r.lateByMs > 0).length,
//     };

//     return res.status(200).json({
//       dateKey,
//       timezone: APP_TZ,
//       summary,
//       rows,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Failed to fetch superAdmin daily login status",
//       error: error.message,
//     });
//   }
// };

// export const exportSuperAdminDailyStatusExcel = async (req, res) => {
//   try {
//     const role = String(req.user?.roleType || req.user?.accountType || "").toLowerCase();
//     const isSuperAdmin = role === "superadmin";
//     if (!isSuperAdmin) {
//       return res.status(403).json({ message: "Only superAdmin can export this report" });
//     }

//     const dateKey = String(req.query?.dateKey || resolveOperationalDateKeyForUser({}, getNow()));
//     const employees = await User.find({
//       accountType: { $in: ["employee", "agent", "supervisor"] },
//       isActive: { $ne: false },
//     })
//       .select("_id username realName pseudoName empId department accountType shiftStartHour shiftEndHour isTeamLeader")
//       .lean();

//     const employeeIds = employees.map((e) => e._id);
//     const sessions = await PunchSession.find({ userId: { $in: employeeIds }, dateKey }).lean();
//     const sessionsByUser = new Map(sessions.map((s) => [String(s.userId), s]));
//     const now = new Date();

//     const formatDateTime = (value) => {
//       if (!value) return "";
//       const d = new Date(value);
//       if (Number.isNaN(d.getTime())) return "";
//       return d.toLocaleString("en-IN", {
//         timeZone: "Asia/Kolkata",
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         hour12: true,
//       });
//     };

//     const formatDuration = (ms = 0) => {
//       const safe = Math.max(0, Number(ms) || 0);
//       const totalMinutes = Math.floor(safe / 60000);
//       const h = Math.floor(totalMinutes / 60);
//       const m = totalMinutes % 60;
//       return `${h}h ${m}m`;
//     };

//     const rows = employees.map((emp) => {
//       const session = sessionsByUser.get(String(emp._id)) || null;
//       const breakUsage = getBreakUsage(session, now);
//       const lateByMs = computeSessionLateByMs(session, emp);
//       const totalWorkedMs = getSessionWorkedMs(session, now);

//       const breakSegments = (session?.breaks || []).map((b) => {
//         const startAt = b?.startAt ? new Date(b.startAt) : null;
//         const endAt = b?.endAt ? new Date(b.endAt) : null;
//         const openDuration = !endAt && startAt ? Math.max(0, now.getTime() - startAt.getTime()) : 0;
//         const durationMs = Math.max(0, Number(b?.durationMs || 0) + openDuration);
//         return `${b?.type || "unknown"}: ${formatDateTime(startAt)} - ${formatDateTime(endAt)} (${formatDuration(durationMs)})`;
//       });

//       return {
//         Date: dateKey,
//         "Employee ID": emp.empId || "",
//         "Pseudo Name": emp.pseudoName || "",
//         Username: emp.username || "",
//         Department: emp.department || "",
//         "Account Type": emp.accountType || "",
//         "Login Time (IST)": formatDateTime(session?.shiftStartAt || null),
//         "Logout Time (IST)": formatDateTime(session?.shiftEndAt || null),
//         "Last Activity (IST)": formatDateTime(session?.lastActivityAt || null),
//         "On Break": session?.breaks?.some((b) => !b.endAt) ? "Yes" : "No",
//         "Break Type (Open)": (session?.breaks || []).find((b) => !b.endAt)?.type || "",
//         "Total Break": formatDuration(breakUsage.totalBreakMs || 0),
//         "Manual Break": formatDuration(breakUsage.manualBreakMs || 0),
//         "Auto Idle Break": formatDuration(breakUsage.autoIdleBreakMs || 0),
//         "Total Worked": formatDuration(totalWorkedMs || 0),
//         "Late By": lateByMs > 0 ? formatDuration(lateByMs) : "On Time",
//         "Status 9h": totalWorkedMs >= 9 * 60 * 60 * 1000 ? "Completed" : "Pending",
//         "Break Details": breakSegments.join(" | "),
//       };
//     });

//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Daily Login Status");
//     const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", `attachment; filename=\"superadmin-login-status-${dateKey}.xlsx\"`);
//     return res.status(200).send(buffer);
//   } catch (error) {
//     return res.status(500).json({
//       message: "Failed to export superAdmin daily login status",
//       error: error.message,
//     });
//   }
// };




import PunchSession from "../Modals/PunchSession.modal.js";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";
import XLSX from "xlsx-js-style";
import { getTeamMembersByTeamLeader } from "../utils/teamHelper.js";

const APP_TZ = "Asia/Kolkata";
const IDLE_WARN_MS = 25 * 60 * 1000;
const SESSION_RESUME_GRACE_MS = 0;
const OPERATIONAL_DAY_START_HOUR_IST = 14; // 2:00 PM IST
const PUNCHX_DEBUG_TIME = process.env.PUNCHX_DEBUG_TIME === "1";

const getNow = () => new Date();

const getNyDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const getNyHour = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour12: false,
    hour: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Number(map.hour);
};

const getOperationalWindowStartForDateKeyMs = (dateKey = "") => {
  const dayStartMs = parseDateKeyStartMs(dateKey);
  if (!Number.isFinite(dayStartMs)) return null;
  return dayStartMs + OPERATIONAL_DAY_START_HOUR_IST * 60 * 60 * 1000;
};

const debugTime = (label, payload = {}) => {
  if (!PUNCHX_DEBUG_TIME) return;
  console.log(`[PunchXTime] ${label}`, payload);
};

const parseDateKeyStartMs = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return null;
  const ms = Date.parse(`${dateKey}T00:00:00+05:30`);
  return Number.isFinite(ms) ? ms : null;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && aEnd >= bStart;

const normalizeRosterName = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._\-()/,]+/g, " ")
    .replace(/\s+/g, " ");

const getRosterPresentCountForUsers = async (employees = [], dateKey = "", options = {}) => {
  const countAllRosterEmployees = options?.countAllRosterEmployees === true;
  const targetIds = new Set((employees || []).map((employee) => String(employee?._id || "")).filter(Boolean));
  const targetObjectIds = (employees || []).map((employee) => employee?._id).filter(Boolean);
  const userIdByEmpId = new Map();
  const userIdByName = new Map();

  for (const employee of employees || []) {
    const userId = String(employee?._id || "").trim();
    if (!userId) continue;

    const empId = String(employee?.empId || "").trim().toLowerCase();
    if (empId && !userIdByEmpId.has(empId)) {
      userIdByEmpId.set(empId, userId);
    }

    const nameKeys = [
      employee?.pseudoName,
      employee?.realName,
      employee?.username,
      `${employee?.pseudoName || ""} ${employee?.department || ""}`,
      `${employee?.realName || ""} ${employee?.department || ""}`,
    ]
      .map(normalizeRosterName)
      .filter(Boolean);

    for (const nameKey of nameKeys) {
      if (!userIdByName.has(nameKey)) {
        userIdByName.set(nameKey, userId);
      }
    }
  }

  const dayStartMs = parseDateKeyStartMs(dateKey);
  const emptyRosterSnapshot = () => ({
    presentCount: 0,
    rosterStatusByUserId: new Map(),
    rosterShiftStartHourByUserId: new Map(),
    rosterShiftEndHourByUserId: new Map(),
    transportArrivalTimeByUserId: new Map(),
  });
  if ((!countAllRosterEmployees && !targetIds.size) || !Number.isFinite(dayStartMs)) {
    return emptyRosterSnapshot();
  }

  const dayStart = new Date(dayStartMs);
  const dayEnd = new Date(dayStartMs + 24 * 60 * 60 * 1000 - 1);
  const rosterQuery = {
    $or: [
      {
        rosterStartDate: { $lte: dayEnd },
        rosterEndDate: { $gte: dayStart },
      },
      {
        weeks: {
          $elemMatch: {
            startDate: { $lte: dayEnd },
            endDate: { $gte: dayStart },
          },
        },
      },
    ],
  };

  if (!countAllRosterEmployees && targetIds.size) {
    rosterQuery["weeks.employees.userId"] = { $in: targetObjectIds };
  }

  const pipeline = [
    { $match: rosterQuery },
    {
      $project: {
        weeks: {
          $filter: {
            input: "$weeks",
            as: "week",
            cond: {
              $and: [
                { $lte: ["$$week.startDate", dayEnd] },
                { $gte: ["$$week.endDate", dayStart] },
              ],
            },
          },
        },
      },
    },
    { $unwind: "$weeks" },
    { $unwind: "$weeks.employees" },
  ];

  if (!countAllRosterEmployees && targetObjectIds.length) {
    pipeline.push({ $match: { "weeks.employees.userId": { $in: targetObjectIds } } });
  }

  pipeline.push(
    {
      $project: {
        rosterUserId: "$weeks.employees.userId",
        rosterEmpId: "$weeks.employees.empId",
        rosterName: "$weeks.employees.name",
        shiftStartHour: "$weeks.employees.shiftStartHour",
        shiftEndHour: "$weeks.employees.shiftEndHour",
        matchingDay: {
          $first: {
            $filter: {
              input: "$weeks.employees.dailyStatus",
              as: "day",
              cond: {
                $and: [
                  { $gte: ["$$day.date", dayStart] },
                  { $lte: ["$$day.date", dayEnd] },
                ],
              },
            },
          },
        },
      },
    },
    { $match: { matchingDay: { $ne: null } } }
  );

  const rosterRows = await Roster.aggregate(pipeline).allowDiskUse(true);

  const presentIds = new Set();
  const rosterStatusByUserId = new Map();
  const rosterShiftStartHourByUserId = new Map();
  const rosterShiftEndHourByUserId = new Map();
  const transportArrivalTimeByUserId = new Map();
  for (const row of rosterRows || []) {
    const rosterUserId = String(row?.rosterUserId || "").trim();
    const rosterEmpId = String(row?.rosterEmpId || "").trim().toLowerCase();
    const rosterNameKey = normalizeRosterName(row?.rosterName || "");
    const matchedUserId =
      (rosterUserId && targetIds.has(rosterUserId) ? rosterUserId : "") ||
      userIdByEmpId.get(rosterEmpId) ||
      userIdByName.get(rosterNameKey) ||
      "";
    const presentKey = matchedUserId ||
      (countAllRosterEmployees
        ? (rosterUserId ? `uid:${rosterUserId}` : rosterEmpId ? `emp:${rosterEmpId}` : rosterNameKey ? `name:${rosterNameKey}` : "")
        : "");

    if (!presentKey || presentIds.has(presentKey)) continue;

    const matchingDay = row?.matchingDay;
    const effectiveStatus = String(
      matchingDay?.status ||
      matchingDay?.departmentStatus ||
      matchingDay?.transportStatus ||
      "P"
    ).trim().toUpperCase();

    if (matchedUserId && !rosterStatusByUserId.has(matchedUserId)) {
      rosterStatusByUserId.set(matchedUserId, effectiveStatus || "P");
    }
    if (matchedUserId) {
      if (matchingDay?.transportArrivalTime && !transportArrivalTimeByUserId.has(matchedUserId)) {
        transportArrivalTimeByUserId.set(matchedUserId, matchingDay.transportArrivalTime);
      }
      const rosterStartHour = Number(row?.shiftStartHour);
      const rosterEndHour = Number(row?.shiftEndHour);
      if (Number.isFinite(rosterStartHour) && !rosterShiftStartHourByUserId.has(matchedUserId)) {
        rosterShiftStartHourByUserId.set(matchedUserId, rosterStartHour);
      }
      if (Number.isFinite(rosterEndHour) && !rosterShiftEndHourByUserId.has(matchedUserId)) {
        rosterShiftEndHourByUserId.set(matchedUserId, rosterEndHour);
      }
    }

    if (effectiveStatus === "P") {
      presentIds.add(presentKey);
    }
  }

  return {
    presentCount: presentIds.size,
    rosterStatusByUserId,
    rosterShiftStartHourByUserId,
    rosterShiftEndHourByUserId,
    transportArrivalTimeByUserId,
  };
};

const addDaysToDateKey = (dateKey, days) => {
  const startMs = parseDateKeyStartMs(dateKey);
  if (!Number.isFinite(startMs)) return dateKey;
  return getNyDateKey(new Date(startMs + days * 24 * 60 * 60 * 1000));
};

const getOperationalWindowForDateKey = (dateKey = "") => {
  const startMs = getOperationalWindowStartForDateKeyMs(dateKey);
  if (!Number.isFinite(startMs)) return null;
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
  return { startMs, endMs };
};

const resolveOperationalDateKeyForUser = (_userLike = {}, now = new Date()) => {
  const todayKey = getNyDateKey(now);
  const yesterdayKey = addDaysToDateKey(todayKey, -1);
  const nyHour = getNyHour(now);
  if (Number.isFinite(nyHour) && nyHour < OPERATIONAL_DAY_START_HOUR_IST) {
    debugTime("resolveOperationalDateKeyForUser", {
      nowIso: now.toISOString(),
      nyHour,
      resolvedDateKey: yesterdayKey,
      rule: "before_14_ist_use_previous_day",
    });
    return yesterdayKey;
  }
  debugTime("resolveOperationalDateKeyForUser", {
    nowIso: now.toISOString(),
    nyHour,
    resolvedDateKey: todayKey,
    rule: "at_or_after_14_ist_use_same_day",
  });
  return todayKey;
};

const toMs = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? diff : 0;
};

const NINE_HOURS_MS = 9 * 60 * 60 * 1000;

const formatIstDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    timeZone: APP_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getBreakUsage = (session, now = getNow()) => {
  if (!session) return { manualBreakMs: 0, autoIdleBreakMs: 0, totalBreakMs: 0 };
  const breaks = Array.isArray(session.breaks) ? session.breaks : [];
  let manualBreakMs = 0;

  for (const br of breaks) {
    const baseDuration = Number(br?.durationMs || 0);
    const openDuration = !br?.endAt ? toMs(br?.startAt, now) : 0;
    const durationMs = Math.max(0, baseDuration + openDuration);
    if (br?.type === "manual") manualBreakMs += durationMs;
  }

  return {
    manualBreakMs,
    autoIdleBreakMs: 0,
    totalBreakMs: manualBreakMs,
  };
};

const addBreak = (session, type, now, meta = {}) => {
  const existingOpen = session.breaks.find((b) => !b.endAt);
  if (existingOpen) return false;

  session.breaks.push({
    type,
    startAt: now,
    endAt: null,
    durationMs: 0,
    meta,
  });

  if (type === "manual") session.activityStatus = "manual_break";
  if (type === "auto_idle") {
    session.activityStatus = "auto_break";
    session.autoBreakStartedAt = now;
  }
  return true;
};

const closeOpenBreak = (session, now, type = null) => {
  const idx = session.breaks.findIndex((b) => !b.endAt && (!type || b.type === type));
  if (idx === -1) return null;

  const br = session.breaks[idx];
  br.endAt = now;
  br.durationMs = toMs(br.startAt, now);
  session.totalBreakMs += br.durationMs;

  if (br.type === "auto_idle") {
    session.totalIdleMs += br.durationMs;
    session.autoBreakStartedAt = null;
  }

  session.activityStatus = "active";
  return br;
};

const autoEndShiftIfDue = (session, now = getNow()) => {
  if (!session?.shiftStartAt) return false;
  if (session.shiftEndAt || session.status === "ended") return false;

  const nowMs = new Date(now).getTime();
  const startMs = new Date(session.shiftStartAt).getTime();
  if (!Number.isFinite(nowMs) || !Number.isFinite(startMs)) return false;
  if (nowMs - startMs < NINE_HOURS_MS) return false;

  const autoEndAt = new Date(startMs + NINE_HOURS_MS);
  closeOpenBreak(session, autoEndAt);
  session.shiftEndAt = autoEndAt;
  session.shiftEndReason = "auto_9h";
  session.status = "ended";
  session.activityStatus = "no_activity";
  session.alerts.push({
    type: "auto_shift_end",
    message: "Shift auto-ended after 9 hours",
    at: autoEndAt,
  });
  debugTime("autoEndShiftIfDue", {
    sessionId: String(session?._id || ""),
    dateKey: session?.dateKey || "",
    autoEndAtIso: autoEndAt.toISOString(),
    nowIso: new Date(now).toISOString(),
  });
  return true;
};

const persistAutoEndedSessions = async (sessions = [], now = getNow()) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];
  const updates = [];
  for (const session of sessions) {
    if (!autoEndShiftIfDue(session, now)) continue;
    updates.push({
      updateOne: {
        filter: { _id: session._id },
        update: {
          $set: {
            shiftEndAt: session.shiftEndAt,
            shiftEndReason: session.shiftEndReason ?? "",
            status: session.status,
            activityStatus: session.activityStatus,
            autoBreakStartedAt: session.autoBreakStartedAt ?? null,
            totalBreakMs: Number(session.totalBreakMs || 0),
            totalIdleMs: Number(session.totalIdleMs || 0),
            breaks: Array.isArray(session.breaks) ? session.breaks : [],
            alerts: Array.isArray(session.alerts) ? session.alerts : [],
          },
        },
      },
    });
  }
  if (updates.length > 0) {
    await PunchSession.bulkWrite(updates, { ordered: false });
  }
  return sessions;
};

const isWithinOperationalWindow = (session, _userLike = {}, now = new Date()) => {
  const window = getOperationalWindowForDateKey(session?.dateKey || "");
  if (!window) return false;
  const nowMs = now.getTime();
  return nowMs >= window.startMs && nowMs <= window.endMs + SESSION_RESUME_GRACE_MS;
};

const ensureSession = async (userId, userLike = {}, dateKey, now = new Date()) => {
  const existing = await PunchSession.findOne({ userId, dateKey });
  if (existing) return existing;

  const nearby = await PunchSession.find({
    userId,
    dateKey: { $in: [addDaysToDateKey(dateKey, -1), dateKey, addDaysToDateKey(dateKey, 1)] },
  }).sort({ updatedAt: -1 });

  const reusable = nearby.find((s) => isWithinOperationalWindow(s, userLike, now));
  if (reusable) return reusable;

  const activeRecent = await PunchSession.findOne({
    userId,
    shiftStartAt: { $ne: null },
    shiftEndAt: null,
    status: { $in: ["active", "on_break"] },
  }).sort({ shiftStartAt: -1 });
  if (activeRecent && isWithinOperationalWindow(activeRecent, userLike, now)) return activeRecent;

  return PunchSession.create({ userId, dateKey });
};

const scoreSession = (session) => {
  let score = 100;
  const latePenalty = session.shiftStartAt ? 0 : 25;
  const completionPenalty = session.shiftEndAt ? 0 : 25;

  const manualBreakMs = session.breaks
    .filter((b) => b.type === "manual")
    .reduce((sum, b) => sum + (b.durationMs || 0), 0);

  const breakPenalty = manualBreakMs > 90 * 60 * 1000 ? 20 : manualBreakMs > 60 * 60 * 1000 ? 10 : 0;
  const idlePenalty = session.totalIdleMs > 90 * 60 * 1000 ? 25 : session.totalIdleMs > 60 * 60 * 1000 ? 15 : session.totalIdleMs > 30 * 60 * 1000 ? 8 : 0;

  score -= latePenalty + completionPenalty + breakPenalty + idlePenalty;
  score = Math.max(0, Math.min(100, score));

  return {
    total: score,
    breakdown: {
      onTimeLogin: Math.max(0, 25 - latePenalty),
      shiftCompletion: Math.max(0, 25 - completionPenalty),
      breakDiscipline: Math.max(0, 25 - breakPenalty),
      idleDiscipline: Math.max(0, 25 - idlePenalty),
    },
  };
};

const getIstHourFromDateLike = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  return Number.isFinite(hour) ? hour : null;
};

const normalizeShiftStartHour = (shiftStartHour, shiftEndHour, loginHour = null) => {
  const startHour = Number(shiftStartHour);
  const endHour = Number(shiftEndHour);
  if (!Number.isFinite(startHour)) return null;

  const normalizedStart = ((startHour % 24) + 24) % 24;
  const normalizedEnd = Number.isFinite(endHour) ? ((endHour % 24) + 24) % 24 : null;

  const eveningLogin = Number.isFinite(loginHour) && loginHour >= OPERATIONAL_DAY_START_HOUR_IST;

  if (
    normalizedStart > 0 &&
    normalizedStart < 12 &&
    eveningLogin
  ) {
    return normalizedStart + 12;
  }

  return normalizedStart;
};

const computeSessionLateByMs = (session, userLike = {}) => {
  if (!session?.shiftStartAt) return 0;
  const actualStartMs = new Date(session.shiftStartAt).getTime();
  const loginHour = getIstHourFromDateLike(session.shiftStartAt);
  const startHour = normalizeShiftStartHour(userLike?.shiftStartHour, userLike?.shiftEndHour, loginHour);
  const dayStartMs = parseDateKeyStartMs(session?.dateKey || "");
  if (!Number.isFinite(startHour) || !Number.isFinite(dayStartMs) || !Number.isFinite(actualStartMs)) return 0;
  const normalizedHour = ((startHour % 24) + 24) % 24;
  const expectedStartMs = normalizedHour >= OPERATIONAL_DAY_START_HOUR_IST
    ? dayStartMs + normalizedHour * 60 * 60 * 1000
    : dayStartMs + 24 * 60 * 60 * 1000 + normalizedHour * 60 * 60 * 1000;
  return actualStartMs > expectedStartMs ? actualStartMs - expectedStartMs : 0;
};

const getSessionWorkedMs = (session, now = getNow()) => {
  if (!session?.shiftStartAt) return 0;
  const startMs = new Date(session.shiftStartAt).getTime();
  const endMs = session?.shiftEndAt ? new Date(session.shiftEndAt).getTime() : new Date(now).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  const grossMs = endMs - startMs;
  const breakUsage = getBreakUsage(session, now);
  return Math.max(0, grossMs - Math.max(0, Number(breakUsage.totalBreakMs || 0)));
};

export const getTodaySession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = getNow();
    const userProfile = await User.findById(userId)
      .select("shiftStartHour sessionHistoryStartAt username pseudoName realName")
      .lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);
    if (autoEndShiftIfDue(session)) {
      await session.save();
    }

    if (isJosephHistoryAccount(userProfile || {}) && !userProfile?.sessionHistoryStartAt && session?.shiftStartAt) {
      await User.updateOne(
        { _id: userId, sessionHistoryStartAt: null },
        { $set: { sessionHistoryStartAt: session.shiftStartAt } }
      );
    }

    return res.status(200).json({
      session,
      timezone: APP_TZ,
      dateKey,
      attendanceScore: scoreSession(session),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch session", error: error.message });
  }
};

export const startShift = async (req, res) => {
  try {
    const userId = req.user?._id;
    const now = getNow();
    const userProfile = await User.findById(userId)
      .select("shiftStartHour sessionHistoryStartAt username pseudoName realName")
      .lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);

    if (session.status === "ended" && session.shiftStartAt && session.shiftEndAt) {
      return res.status(409).json({ message: "Shift already ended for this session", session, attendanceScore: scoreSession(session) });
    }

    if (!session.shiftStartAt) session.shiftStartAt = now;
    session.status = "active";
    session.activityStatus = "active";
    session.lastActivityAt = now;
    session.shiftEndReason = "";
    await session.save();

    if (isJosephHistoryAccount(userProfile || {}) && !userProfile?.sessionHistoryStartAt && session?.shiftStartAt) {
      await User.updateOne(
        { _id: userId, sessionHistoryStartAt: null },
        { $set: { sessionHistoryStartAt: session.shiftStartAt } }
      );
    }

    return res.status(200).json({ message: "Shift started", session, attendanceScore: scoreSession(session) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start shift", error: error.message });
  }
};

export const endShift = async (req, res) => {
  try {
    const userId = req.user?._id;
    const now = getNow();
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);

    closeOpenBreak(session, now);
    session.shiftEndAt = now;
    session.shiftEndReason = "manual";
    session.status = "ended";
    session.activityStatus = "no_activity";
    await session.save();

    return res.status(200).json({ message: "Shift ended", session, attendanceScore: scoreSession(session) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to end shift", error: error.message });
  }
};

export const startBreak = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { type = "manual", reason = "" } = req.body || {};
    if (!["manual", "system_disconnect"].includes(type)) {
      return res.status(400).json({ message: "Invalid break type" });
    }

    const now = getNow();
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);

    if (session.status === "ended" || session.shiftEndAt) {
      return res.status(409).json({ message: "Shift already ended", session, attendanceScore: scoreSession(session) });
    }

    if (autoEndShiftIfDue(session, now)) {
      await session.save();
      return res.status(409).json({ message: "Shift already auto-ended after 9 hours", session, attendanceScore: scoreSession(session) });
    }

    if (session.status === "not_started") {
      session.shiftStartAt = now;
      session.status = "active";
    }

    const added = addBreak(session, type, now, { reason, source: "ui" });
    if (!added) return res.status(409).json({ message: "A break is already active", session });

    await session.save();
    return res.status(200).json({ message: "Break started", session, attendanceScore: scoreSession(session) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start break", error: error.message });
  }
};

export const endBreak = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { type } = req.body || {};
    const now = getNow();
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);

    if (session.status === "ended" || session.shiftEndAt) {
      return res.status(409).json({ message: "Shift already ended", session, attendanceScore: scoreSession(session) });
    }

    if (autoEndShiftIfDue(session, now)) {
      await session.save();
      return res.status(409).json({ message: "Shift already auto-ended after 9 hours", session, attendanceScore: scoreSession(session) });
    }

    const closed = closeOpenBreak(session, now, type || null);
    if (!closed) return res.status(404).json({ message: "No active break found", session });

    session.lastActivityAt = now;
    await session.save();
    return res.status(200).json({ message: "Break ended", session, attendanceScore: scoreSession(session) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to end break", error: error.message });
  }
};

export const postActivity = async (req, res) => {
  try {
    const userId = req.user?._id;
    const now = getNow();
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, userProfile || {}, dateKey, now);

    if (session.status === "ended" || session.shiftEndAt) {
      return res.status(409).json({
        message: "Shift already ended",
        session,
        attendanceScore: scoreSession(session),
      });
    }

    if (autoEndShiftIfDue(session, now)) {
      await session.save();
      return res.status(200).json({
        message: "Shift already auto-ended after 9 hours",
        session,
        attendanceScore: scoreSession(session),
      });
    }

    const { eventType = "mousemove", occurredAt } = req.body || {};
    const eventAt = occurredAt ? new Date(occurredAt) : now;

    const last = session.lastActivityAt ? new Date(session.lastActivityAt) : null;
    const idleMs = last ? toMs(last, eventAt) : 0;

    if (idleMs >= IDLE_WARN_MS) {
      session.activityStatus = "idle_warning";
      session.idleWarningAt = eventAt;
    }

    if (!session.shiftStartAt) {
      session.shiftStartAt = now;
      session.status = "active";
    }

    session.lastActivityAt = eventAt;
    if (!["manual_break"].includes(session.activityStatus)) {
      session.activityStatus = "active";
    }

    await session.save();

    return res.status(200).json({
      message: "Activity captured",
      eventType,
      session,
      attendanceScore: scoreSession(session),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to capture activity", error: error.message });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = getNow();
    const userProfile = await User.findById(userId)
      .select("shiftStartHour dateOfJoining createdAt sessionHistoryStartAt username pseudoName realName")
      .lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const currentSession = await PunchSession.findOne({ userId, dateKey });
    if (currentSession && autoEndShiftIfDue(currentSession, now)) {
      await currentSession.save();
    }

    const historyCutoff = getSessionHistoryStartDate(userProfile || {}, currentSession);

    const page = Math.max(1, Number.parseInt(req.query?.page || "1", 10) || 1);
    const limit = Math.min(50, Math.max(5, Number.parseInt(req.query?.limit || "5", 10) || 5));
    const skip = (page - 1) * limit;

    const query = {
      userId,
      shiftStartAt: { $ne: null },
    };

    if (historyCutoff) {
      query.shiftStartAt.$gte = historyCutoff;
    }

    const [total, sessions] = await Promise.all([
      PunchSession.countDocuments(query),
      PunchSession.find(query)
        .sort({ shiftStartAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = sessions.map((session) => {
      const breakUsage = getBreakUsage(session);
      const totalWorkedMs = getSessionWorkedMs(session, session?.shiftEndAt || new Date());
      const durationMs = Number.isFinite(totalWorkedMs) ? totalWorkedMs : 0;
      return {
        id: String(session._id),
        dateKey: session.dateKey || "",
        loginTime: session.shiftStartAt || null,
        logoutTime: session.shiftEndAt || null,
        logoutReason: session.shiftEndReason || (session.shiftEndAt ? "manual" : ""),
        status: session.status || "not_started",
        activityStatus: session.activityStatus || "no_activity",
        totalWorkedMs: durationMs,
        totalBreakMs: Number(breakUsage.totalBreakMs || 0),
        manualBreakMs: Number(breakUsage.manualBreakMs || 0),
        alertCount: Array.isArray(session.alerts) ? session.alerts.length : 0,
        latestAlert: Array.isArray(session.alerts) && session.alerts.length > 0 ? session.alerts[session.alerts.length - 1] : null,
        hasCompletedNineHours: durationMs >= NINE_HOURS_MS,
      };
    });

    return res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch session history", error: error.message });
  }
};

export const getManagerTeamStatus = async (req, res) => {
  try {
    const user = req.user || {};
    const role = String(user.roleType || user.accountType || "").toLowerCase();
    const isSupervisor = role === "supervisor" || user.isTeamLeader;
    const supervisorId = user?._id || user?.id || null;

    if (!isSupervisor) return res.status(403).json({ message: "Supervisor access required" });
    if (!supervisorId) return res.status(401).json({ message: "Supervisor identity missing" });

    const requestedDateKey = String(req.query?.dateKey || "").trim();
    const dateKey = requestedDateKey || resolveOperationalDateKeyForUser(user, getNow());

    const rosterTeamMembers = await getTeamMembersByTeamLeader(supervisorId, dateKey);
    const rosterUserIds = rosterTeamMembers
      .map((member) => String(member?.userId || "").trim())
      .filter(Boolean);

    let teamMembers = [];
    if (rosterUserIds.length > 0) {
      const rosterMetaByUserId = new Map(
        rosterTeamMembers
          .filter((member) => member?.userId)
          .map((member) => [String(member.userId), member])
      );

      const rosterUsers = await User.find({
        _id: { $in: rosterUserIds, $ne: supervisorId },
        accountType: { $in: ["employee", "agent", "supervisor"] },
        isActive: { $ne: false },
      })
        .select("_id empId username realName pseudoName department accountType shiftStartHour")
        .lean();

      teamMembers = rosterUsers.map((member) => {
        const rosterMeta = rosterMetaByUserId.get(String(member._id)) || {};
        return {
          ...member,
          department: member.department || rosterMeta.department || "",
          shiftStartHour:
            Number.isFinite(Number(rosterMeta.shiftStartHour)) ? Number(rosterMeta.shiftStartHour) : member.shiftStartHour,
        };
      });
    }

    if (teamMembers.length === 0) {
      teamMembers = await User.find({
        accountType: { $in: ["employee", "agent", "supervisor"] },
        reportingManager: supervisorId,
        isActive: { $ne: false },
        _id: { $ne: supervisorId },
      })
        .select("_id empId username realName pseudoName department accountType shiftStartHour")
        .lean();
    }

    const ids = teamMembers.map((u) => u._id);
    const sessions = await PunchSession.find({ userId: { $in: ids }, dateKey }).lean();
    const now = getNow();
    await persistAutoEndedSessions(sessions, now);
    const byUser = new Map(sessions.map((s) => [String(s.userId), s]));
    const rosterSnapshot = await getRosterPresentCountForUsers(teamMembers, dateKey);
    const presentCount = rosterSnapshot.presentCount;

    const rows = teamMembers.map((member) => {
      const session = byUser.get(String(member._id));
      const breakUsage = getBreakUsage(session, now);
      const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
      const shiftStartHour = Number(member.shiftStartHour);
      const lateByMs = computeSessionLateByMs(session, member);
      const totalWorkedMs = getSessionWorkedMs(session, now);
      return {
        userId: member._id,
        username: member.username || "",
        pseudoName: member.pseudoName || "",
        name: member.realName || member.username,
        department: member.department,
        activityStatus: session?.activityStatus || "no_activity",
        lastActivityAt: session?.lastActivityAt || null,
        idleTimeMs: session?.totalIdleMs || 0,
        breakType: openBreak?.type || "",
        totalBreakMs: breakUsage.totalBreakMs,
        manualBreakMs: breakUsage.manualBreakMs,
        autoIdleBreakMs: breakUsage.autoIdleBreakMs,
        shiftStartHour: Number.isFinite(shiftStartHour) ? shiftStartHour : null,
        shiftStartedAt: session?.shiftStartAt || null,
        loginTime: session?.shiftStartAt || null,
        logoutTime: session?.shiftEndAt || null,
        logoutReason: session?.shiftEndReason || (session?.shiftEndAt ? "manual" : ""),
        floorRosterStatus: rosterSnapshot.rosterStatusByUserId.get(String(member._id)) || "",
        transportArrivalTime: rosterSnapshot.transportArrivalTimeByUserId.get(String(member._id)) || null,
        isOnBreak: Boolean(openBreak),
        lateByMs,
        totalWorkedMs: Math.max(0, totalWorkedMs),
        remainingForNineHoursMs: Math.max(0, 9 * 60 * 60 * 1000 - totalWorkedMs),
        hasCompletedNineHours: totalWorkedMs >= 9 * 60 * 60 * 1000,
      };
    });

    const summary = {
      totalEmployees: rows.length,
      presentCount,
      loggedInCount: rows.filter((r) => Boolean(r.loginTime)).length,
      onBreakCount: rows.filter((r) => r.isOnBreak).length,
      notCompletedNineHoursCount: rows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
      lateLoginCount: rows.filter((r) => r.loginTime && r.lateByMs > 0).length,
    };

    return res.status(200).json({ dateKey, timezone: APP_TZ, summary, rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch team status", error: error.message });
  }
};

const getOpenBreak = (session) => (session?.breaks || []).find((b) => !b.endAt) || null;

const isJosephHistoryAccount = (userLike = {}) => {
  const tokens = [userLike?.username, userLike?.pseudoName, userLike?.realName]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return tokens.includes("joseph");
};

const getSessionHistoryStartDate = (userLike = {}, session = null) => {
  const candidates = [
    userLike?.sessionHistoryStartAt,
    isJosephHistoryAccount(userLike) ? session?.shiftStartAt : null,
    userLike?.dateOfJoining,
    userLike?.createdAt,
  ]
    .map((value) => (value ? new Date(value) : null))
    .filter((value) => value && !Number.isNaN(value.getTime()));

  return candidates.reduce((latest, current) => (!latest || current > latest ? current : latest), null);
};

export const getSuperAdminDailyStatus = async (req, res) => {
  try {
    const role = String(req.user?.roleType || req.user?.accountType || "").toLowerCase();
    const userId = req.user?._id ? String(req.user._id) : "";
    const isSuperAdmin = role === "superadmin";
    const isSupervisor = role === "supervisor" || Boolean(req.user?.isTeamLeader);

    if (!isSuperAdmin && !isSupervisor) {
      return res.status(403).json({ message: "Only superAdmin or supervisor can access this dashboard" });
    }

    const dateKey = String(req.query?.dateKey || resolveOperationalDateKeyForUser({}, getNow()));
    const employeeQuery = {
      accountType: { $in: ["employee", "agent", "supervisor"] },
      isActive: { $ne: false },
    };

    if (!isSuperAdmin && userId) {
      employeeQuery.reportingManager = req.user._id;
    }

    const employees = await User.find(employeeQuery)
      .select("_id empId username realName pseudoName department accountType shiftStartHour shiftEndHour isTeamLeader")
      .lean();

    const rosterSnapshot = await getRosterPresentCountForUsers(employees, dateKey, {
      countAllRosterEmployees: isSuperAdmin,
    });
    const presentCount = rosterSnapshot.presentCount;
    const sessionQuery = isSuperAdmin ? { dateKey } : { userId: { $in: employees.map((e) => e._id) }, dateKey };
    const sessions = await PunchSession.find(sessionQuery).lean();
    await persistAutoEndedSessions(sessions, getNow());
    const sessionsByUser = new Map(sessions.map((s) => [String(s.userId), s]));
    const now = new Date();

    const rows = employees.map((emp) => {
      const session = sessionsByUser.get(String(emp._id)) || null;
      const breakUsage = getBreakUsage(session, now);
      const openBreak = getOpenBreak(session);
      const rosterShiftStartHour = rosterSnapshot.rosterShiftStartHourByUserId.get(String(emp._id));
      const rosterShiftEndHour = rosterSnapshot.rosterShiftEndHourByUserId.get(String(emp._id));
      const shiftStartHour = Number.isFinite(rosterShiftStartHour) ? rosterShiftStartHour : Number(emp.shiftStartHour);
      const shiftEndHour = Number.isFinite(rosterShiftEndHour) ? rosterShiftEndHour : Number(emp.shiftEndHour);
      const lateByMs = computeSessionLateByMs(session, {
        ...emp,
        shiftStartHour: Number.isFinite(shiftStartHour) ? shiftStartHour : null,
        shiftEndHour: Number.isFinite(shiftEndHour) ? shiftEndHour : null,
      });
      const totalWorkedMs = getSessionWorkedMs(session, now);
      const remainingForNineHoursMs = Math.max(0, 9 * 60 * 60 * 1000 - totalWorkedMs);
      const inactiveSinceMs = session?.lastActivityAt
        ? Math.max(0, now.getTime() - new Date(session.lastActivityAt).getTime())
        : 0;

      return {
        userId: emp._id,
        username: emp.username || "",
        pseudoName: emp.pseudoName || "",
        name: emp.pseudoName || emp.username || "",
        department: emp.department || "",
        accountType: emp.accountType || "employee",
        isTeamLeader: Boolean(emp.isTeamLeader),
        shiftStartHour: Number.isFinite(shiftStartHour) ? shiftStartHour : null,
        shiftEndHour: Number.isFinite(shiftEndHour) ? shiftEndHour : null,
        loginTime: session?.shiftStartAt || null,
        logoutTime: session?.shiftEndAt || null,
        logoutReason: session?.shiftEndReason || (session?.shiftEndAt ? "manual" : ""),
        floorRosterStatus: rosterSnapshot.rosterStatusByUserId.get(String(emp._id)) || "",
        transportArrivalTime: rosterSnapshot.transportArrivalTimeByUserId.get(String(emp._id)) || null,
        isOnBreak: Boolean(openBreak),
        breakType: openBreak?.type || "",
        breakStartAt: openBreak?.startAt || null,
        totalBreakMs: breakUsage.totalBreakMs,
        totalIdleMs: breakUsage.autoIdleBreakMs,
        manualBreakMs: breakUsage.manualBreakMs,
        autoIdleBreakMs: breakUsage.autoIdleBreakMs,
        status: session?.status || "not_started",
        activityStatus: session?.activityStatus || "no_activity",
        lastActivityAt: session?.lastActivityAt || null,
        inactiveSinceMs,
        lateByMs,
        totalWorkedMs: Math.max(0, totalWorkedMs),
        remainingForNineHoursMs,
        hasCompletedNineHours: totalWorkedMs >= 9 * 60 * 60 * 1000,
      };
    });

    const summary = {
      totalEmployees: rows.length,
      presentCount,
      loggedInCount: rows.filter((r) => Boolean(r.loginTime)).length,
      onBreakCount: rows.filter((r) => r.isOnBreak).length,
      notCompletedNineHoursCount: rows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
      lateLoginCount: rows.filter((r) => r.lateByMs > 0).length,
    };

    return res.status(200).json({
      dateKey,
      timezone: APP_TZ,
      summary,
      rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch superAdmin daily login status",
      error: error.message,
    });
  }
};

export const exportSuperAdminDailyStatusExcel = async (req, res) => {
  try {
    const role = String(req.user?.roleType || req.user?.accountType || "").toLowerCase();
    const isSuperAdmin = role === "superadmin";
    if (!isSuperAdmin) {
      return res.status(403).json({ message: "Only superAdmin can export this report" });
    }

    const dateKey = String(req.query?.dateKey || resolveOperationalDateKeyForUser({}, getNow()));
    const employees = await User.find({
      accountType: { $in: ["employee", "agent", "supervisor"] },
      isActive: { $ne: false },
    })
      .select("_id username realName pseudoName empId department accountType shiftStartHour shiftEndHour isTeamLeader")
      .lean();

    const employeeIds = employees.map((e) => e._id);
    const sessions = await PunchSession.find({ userId: { $in: employeeIds }, dateKey }).lean();
    const sessionsByUser = new Map(sessions.map((s) => [String(s.userId), s]));
    const now = new Date();

    const formatDateTime = (value) => {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    const formatDuration = (ms = 0) => {
      const safe = Math.max(0, Number(ms) || 0);
      const totalMinutes = Math.floor(safe / 60000);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h}h ${m}m`;
    };

    const rows = employees.map((emp) => {
      const session = sessionsByUser.get(String(emp._id)) || null;
      const breakUsage = getBreakUsage(session, now);
      const rosterShiftStartHour = rosterSnapshot.rosterShiftStartHourByUserId.get(String(emp._id));
      const rosterShiftEndHour = rosterSnapshot.rosterShiftEndHourByUserId.get(String(emp._id));
      const shiftStartHour = Number.isFinite(rosterShiftStartHour) ? rosterShiftStartHour : Number(emp.shiftStartHour);
      const shiftEndHour = Number.isFinite(rosterShiftEndHour) ? rosterShiftEndHour : Number(emp.shiftEndHour);
      const lateByMs = computeSessionLateByMs(session, {
        ...emp,
        shiftStartHour: Number.isFinite(shiftStartHour) ? shiftStartHour : null,
        shiftEndHour: Number.isFinite(shiftEndHour) ? shiftEndHour : null,
      });
      const totalWorkedMs = getSessionWorkedMs(session, now);

      const breakSegments = (session?.breaks || []).map((b) => {
        const startAt = b?.startAt ? new Date(b.startAt) : null;
        const endAt = b?.endAt ? new Date(b.endAt) : null;
        const openDuration = !endAt && startAt ? Math.max(0, now.getTime() - startAt.getTime()) : 0;
        const durationMs = Math.max(0, Number(b?.durationMs || 0) + openDuration);
        return `${b?.type || "unknown"}: ${formatDateTime(startAt)} - ${formatDateTime(endAt)} (${formatDuration(durationMs)})`;
      });

      return {
        Date: dateKey,
        "Employee ID": emp.empId || "",
        "Pseudo Name": emp.pseudoName || "",
        Username: emp.username || "",
        Department: emp.department || "",
        "Account Type": emp.accountType || "",
        "Login Time (IST)": formatDateTime(session?.shiftStartAt || null),
        "Logout Time (IST)": formatDateTime(session?.shiftEndAt || null),
        "Last Activity (IST)": formatDateTime(session?.lastActivityAt || null),
        "On Break": session?.breaks?.some((b) => !b.endAt) ? "Yes" : "No",
        "Break Type (Open)": (session?.breaks || []).find((b) => !b.endAt)?.type || "",
        "Total Break": formatDuration(breakUsage.totalBreakMs || 0),
        "Manual Break": formatDuration(breakUsage.manualBreakMs || 0),
        "Auto Idle Break": formatDuration(breakUsage.autoIdleBreakMs || 0),
        "Total Worked": formatDuration(totalWorkedMs || 0),
        "Late By": lateByMs > 0 ? formatDuration(lateByMs) : "On Time",
        "Status 9h": totalWorkedMs >= 9 * 60 * 60 * 1000 ? "Completed" : "Pending",
        "Break Details": breakSegments.join(" | "),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Daily Login Status");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=\"superadmin-login-status-${dateKey}.xlsx\"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to export superAdmin daily login status",
      error: error.message,
    });
  }
};

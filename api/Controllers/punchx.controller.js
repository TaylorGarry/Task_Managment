import PunchSession from "../Modals/PunchSession.modal.js";
import User from "../Modals/User.modal.js";
import XLSX from "xlsx-js-style";

const APP_TZ = "Asia/Kolkata";
const IDLE_WARN_MS = 25 * 60 * 1000;
const SHIFT_AUTO_END_MS = 9 * 60 * 60 * 1000;
const MIDNIGHT_SHIFT_MAX_START_HOUR = 6;

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

const resolveOperationalDateKeyForUser = (userLike = {}, now = new Date()) => {
  const baseDateKey = getNyDateKey(now);
  const shiftStartHour = Number(userLike?.shiftStartHour);
  const nyHour = getNyHour(now);
  const isPostMidnightShift =
    Number.isFinite(shiftStartHour) &&
    shiftStartHour >= 0 &&
    shiftStartHour < MIDNIGHT_SHIFT_MAX_START_HOUR;

  if (isPostMidnightShift && Number.isFinite(nyHour) && nyHour < 12) {
    const prevDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return getNyDateKey(prevDay);
  }
  return baseDateKey;
};

const toMs = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? diff : 0;
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

  const startMs = new Date(session.shiftStartAt).getTime();
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs)) return false;
  if (nowMs - startMs < SHIFT_AUTO_END_MS) return false;

  const autoEndAt = new Date(startMs + SHIFT_AUTO_END_MS);
  closeOpenBreak(session, autoEndAt);
  session.shiftEndAt = autoEndAt;
  session.status = "ended";
  session.activityStatus = "no_activity";
  session.alerts.push({
    type: "auto_shift_end",
    message: "Shift auto-ended after 9 hours",
    at: autoEndAt,
  });
  return true;
};

const ensureSession = async (userId, dateKey) => {
  const existing = await PunchSession.findOne({ userId, dateKey });
  if (existing) return existing;

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

export const getTodaySession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = getNow();
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, dateKey);
    if (autoEndShiftIfDue(session)) {
      await session.save();
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
    const userProfile = await User.findById(userId).select("shiftStartHour").lean();
    const dateKey = resolveOperationalDateKeyForUser(userProfile || {}, now);
    const session = await ensureSession(userId, dateKey);

    if (!session.shiftStartAt) session.shiftStartAt = now;
    session.status = "active";
    session.activityStatus = "active";
    session.lastActivityAt = now;
    await session.save();

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
    const session = await ensureSession(userId, dateKey);

    closeOpenBreak(session, now);
    session.shiftEndAt = now;
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
    const session = await ensureSession(userId, dateKey);

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
    const session = await ensureSession(userId, dateKey);

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
    const session = await ensureSession(userId, dateKey);

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

    let teamMembers = await User.find({
      accountType: { $in: ["employee", "agent", "supervisor"] },
      reportingManager: supervisorId,
      isActive: { $ne: false },
      _id: { $ne: supervisorId },
    })
      .select("_id username realName pseudoName department accountType shiftStartHour")
      .lean();

    // Backward-compatibility fallback for legacy records where reportingManager was not mapped.
    if (teamMembers.length === 0) {
      teamMembers = await User.find({
        accountType: { $in: ["employee", "agent", "supervisor"] },
        department: user.department,
        isActive: { $ne: false },
        _id: { $ne: supervisorId },
      })
        .select("_id username realName pseudoName department accountType shiftStartHour")
        .lean();
    }

    const ids = teamMembers.map((u) => u._id);
    const sessions = await PunchSession.find({ userId: { $in: ids }, dateKey });
    for (const s of sessions) {
      if (autoEndShiftIfDue(s)) {
        await s.save();
      }
    }
    const byUser = new Map(sessions.map((s) => [String(s.userId), s.toObject()]));

    const rows = teamMembers.map((member) => {
      const session = byUser.get(String(member._id));
      const breakUsage = getBreakUsage(session, getNow());
      const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
      const shiftStartHour = Number(member.shiftStartHour);
      const expectedLoginMs = Number.isFinite(shiftStartHour) ? shiftStartHour * 60 * 60 * 1000 : null;
      const actualLoginMs = session?.shiftStartAt ? getTimeOfDayMsInTz(session.shiftStartAt, APP_TZ) : null;
      const lateByMs =
        expectedLoginMs !== null && actualLoginMs !== null && actualLoginMs > expectedLoginMs
          ? actualLoginMs - expectedLoginMs
          : 0;
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
        isOnBreak: Boolean(openBreak),
        lateByMs,
      };
    });

    return res.status(200).json({ dateKey, timezone: APP_TZ, rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch team status", error: error.message });
  }
};

const getTimeOfDayMsInTz = (dateValue, timeZone = APP_TZ) => {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hh = Number(map.hour);
  const mm = Number(map.minute);
  const ss = Number(map.second);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) return null;
  return hh * 60 * 60 * 1000 + mm * 60 * 1000 + ss * 1000;
};

const getOpenBreak = (session) => (session?.breaks || []).find((b) => !b.endAt) || null;

export const getSuperAdminDailyStatus = async (req, res) => {
  try {
    const role = String(req.user?.roleType || req.user?.accountType || "").toLowerCase();
    const userId = req.user?._id ? String(req.user._id) : "";
    const isSuperAdmin = role === "superadmin";
    const isSupervisor = role === "supervisor" || Boolean(req.user?.isTeamLeader);

    if (!isSuperAdmin && !isSupervisor) {
      return res.status(403).json({ message: "Only superAdmin or supervisor can access this dashboard" });
    }

    const dateKey = String(req.query?.dateKey || getNyDateKey(getNow()));
    const employeeQuery = {
      accountType: { $in: ["employee", "agent", "supervisor"] },
      isActive: { $ne: false },
    };

    if (!isSuperAdmin && userId) {
      employeeQuery.reportingManager = req.user._id;
    }

    const employees = await User.find(employeeQuery)
      .select("_id username realName pseudoName department accountType shiftStartHour shiftEndHour isTeamLeader")
      .lean();

    const employeeIds = employees.map((e) => e._id);
    const sessions = await PunchSession.find({ userId: { $in: employeeIds }, dateKey });
    for (const s of sessions) {
      if (autoEndShiftIfDue(s)) {
        await s.save();
      }
    }
    const sessionsByUser = new Map(sessions.map((s) => [String(s.userId), s.toObject()]));
    const now = new Date();

    const rows = employees.map((emp) => {
      const session = sessionsByUser.get(String(emp._id)) || null;
      const breakUsage = getBreakUsage(session, now);
      const openBreak = getOpenBreak(session);
      const shiftStartHour = Number(emp.shiftStartHour);
      const expectedLoginMs = Number.isFinite(shiftStartHour) ? shiftStartHour * 60 * 60 * 1000 : null;
      const actualLoginMs = session?.shiftStartAt ? getTimeOfDayMsInTz(session.shiftStartAt, APP_TZ) : null;
      const lateByMs =
        expectedLoginMs !== null && actualLoginMs !== null && actualLoginMs > expectedLoginMs
          ? actualLoginMs - expectedLoginMs
          : 0;
      const totalWorkedMs = session?.shiftStartAt
        ? (session?.shiftEndAt
            ? new Date(session.shiftEndAt).getTime() - new Date(session.shiftStartAt).getTime()
            : now.getTime() - new Date(session.shiftStartAt).getTime())
        : 0;
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
        shiftStartHour: Number.isFinite(Number(emp.shiftStartHour)) ? Number(emp.shiftStartHour) : null,
        shiftEndHour: Number.isFinite(Number(emp.shiftEndHour)) ? Number(emp.shiftEndHour) : null,
        loginTime: session?.shiftStartAt || null,
        logoutTime: session?.shiftEndAt || null,
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

    const dateKey = String(req.query?.dateKey || getNyDateKey(getNow()));
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
      const shiftStartHour = Number(emp.shiftStartHour);
      const expectedLoginMs = Number.isFinite(shiftStartHour) ? shiftStartHour * 60 * 60 * 1000 : null;
      const actualLoginMs = session?.shiftStartAt ? getTimeOfDayMsInTz(session.shiftStartAt, APP_TZ) : null;
      const lateByMs =
        expectedLoginMs !== null && actualLoginMs !== null && actualLoginMs > expectedLoginMs
          ? actualLoginMs - expectedLoginMs
          : 0;
      const totalWorkedMs = session?.shiftStartAt
        ? (session?.shiftEndAt
            ? new Date(session.shiftEndAt).getTime() - new Date(session.shiftStartAt).getTime()
            : now.getTime() - new Date(session.shiftStartAt).getTime())
        : 0;

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

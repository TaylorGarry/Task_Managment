import PunchSession from "../Modals/PunchSession.modal.js";
import User from "../Modals/User.modal.js";

const NY_TZ = "America/New_York";
const AUTO_BREAK_MS = 30 * 60 * 1000;
const IDLE_WARN_MS = 25 * 60 * 1000;

const getNow = () => new Date();

const getNyDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const toMs = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? diff : 0;
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

    const dateKey = getNyDateKey(getNow());
    const session = await ensureSession(userId, dateKey);

    return res.status(200).json({
      session,
      timezone: NY_TZ,
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
    const dateKey = getNyDateKey(now);
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
    const dateKey = getNyDateKey(now);
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
    if (!["manual", "auto_idle", "system_disconnect"].includes(type)) {
      return res.status(400).json({ message: "Invalid break type" });
    }

    const now = getNow();
    const dateKey = getNyDateKey(now);
    const session = await ensureSession(userId, dateKey);

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
    const dateKey = getNyDateKey(now);
    const session = await ensureSession(userId, dateKey);

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
    const dateKey = getNyDateKey(now);
    const session = await ensureSession(userId, dateKey);

    const { eventType = "mousemove", occurredAt } = req.body || {};
    const eventAt = occurredAt ? new Date(occurredAt) : now;

    const last = session.lastActivityAt ? new Date(session.lastActivityAt) : null;
    const idleMs = last ? toMs(last, eventAt) : 0;

    if (idleMs >= AUTO_BREAK_MS) {
      session.activityStatus = "auto_break";
      if (!session.breaks.some((b) => !b.endAt && b.type === "auto_idle")) {
        addBreak(session, "auto_idle", last || now, { reason: "auto idle 30m", source: "system" });
      }
    } else if (idleMs >= IDLE_WARN_MS) {
      session.activityStatus = "idle_warning";
      session.idleWarningAt = eventAt;
    }

    const autoOpen = session.breaks.find((b) => !b.endAt && b.type === "auto_idle");
    if (autoOpen) {
      closeOpenBreak(session, eventAt, "auto_idle");
      session.alerts.push({
        type: "auto_break_end",
        message: "Auto break ended on user activity",
        at: eventAt,
      });
    }

    if (!session.shiftStartAt) {
      session.shiftStartAt = now;
      session.status = "active";
    }

    session.lastActivityAt = eventAt;
    if (!["manual_break", "auto_break"].includes(session.activityStatus)) {
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
    const role = String(user.accountType || user.roleType || "").toLowerCase();
    const isSupervisor = role === "supervisor" || user.isTeamLeader;

    if (!isSupervisor) return res.status(403).json({ message: "Supervisor access required" });

    const dateKey = getNyDateKey(getNow());

    const teamMembers = await User.find({
      accountType: { $in: ["employee", "agent", "supervisor"] },
      department: user.department,
      _id: { $ne: user._id },
    })
      .select("_id username realName department accountType")
      .lean();

    const ids = teamMembers.map((u) => u._id);
    const sessions = await PunchSession.find({ userId: { $in: ids }, dateKey }).lean();
    const byUser = new Map(sessions.map((s) => [String(s.userId), s]));

    const rows = teamMembers.map((member) => {
      const session = byUser.get(String(member._id));
      const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
      return {
        userId: member._id,
        name: member.realName || member.username,
        department: member.department,
        activityStatus: session?.activityStatus || "no_activity",
        lastActivityAt: session?.lastActivityAt || null,
        idleTimeMs: session?.totalIdleMs || 0,
        breakType: openBreak?.type || "",
        totalBreakMs: session?.totalBreakMs || 0,
        shiftStartedAt: session?.shiftStartAt || null,
      };
    });

    return res.status(200).json({ dateKey, timezone: NY_TZ, rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch team status", error: error.message });
  }
};

import cron from "node-cron";
import PunchSession from "../Modals/PunchSession.modal.js";

const NINE_HOURS_MS = 9 * 60 * 60 * 1000;

const toMs = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? diff : 0;
};

const closeOpenBreaks = (session, endAt) => {
  const breaks = Array.isArray(session.breaks) ? session.breaks : [];
  let totalBreakMs = Number(session.totalBreakMs || 0);
  let totalIdleMs = Number(session.totalIdleMs || 0);
  let changed = false;

  for (const br of breaks) {
    if (br?.endAt) continue;
    br.endAt = endAt;
    br.durationMs = toMs(br.startAt, endAt);
    totalBreakMs += br.durationMs;
    if (br.type === "auto_idle") {
      totalIdleMs += br.durationMs;
    }
    changed = true;
  }

  if (changed) {
    session.totalBreakMs = totalBreakMs;
    session.totalIdleMs = totalIdleMs;
    session.breaks = breaks;
  }
};

const autoLogoutExpiredSessions = async () => {
  const now = new Date();
  const activeSessions = await PunchSession.find({
    shiftStartAt: { $ne: null },
    shiftEndAt: null,
    status: { $in: ["active", "manual_break", "idle_warning", "auto_break"] },
  });

  const updates = [];
  for (const session of activeSessions) {
    const startMs = new Date(session.shiftStartAt).getTime();
    if (!Number.isFinite(startMs) || now.getTime() - startMs < NINE_HOURS_MS) continue;

    const endAt = new Date(startMs + NINE_HOURS_MS);
    closeOpenBreaks(session, endAt);
    session.shiftEndAt = endAt;
    session.shiftEndReason = "auto_9h";
    session.status = "ended";
    session.activityStatus = "no_activity";
    session.alerts = Array.isArray(session.alerts) ? session.alerts : [];
    session.alerts.push({
      type: "auto_shift_end",
      message: "Shift auto-ended after 9 hours",
      at: endAt,
    });

    updates.push({
      updateOne: {
        filter: { _id: session._id },
        update: {
          $set: {
            shiftEndAt: session.shiftEndAt,
            shiftEndReason: session.shiftEndReason,
            status: session.status,
            activityStatus: session.activityStatus,
            totalBreakMs: session.totalBreakMs,
            totalIdleMs: session.totalIdleMs,
            breaks: session.breaks,
            alerts: session.alerts,
          },
        },
      },
    });
  }

  if (updates.length > 0) {
    await PunchSession.bulkWrite(updates, { ordered: false });
  }
};

cron.schedule("*/5 * * * *", async () => {
  try {
    await autoLogoutExpiredSessions();
  } catch (error) {
    console.error("Punch auto logout cron error:", error);
  }
});


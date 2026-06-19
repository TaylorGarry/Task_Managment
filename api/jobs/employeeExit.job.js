import cron from "node-cron";
import mongoose from "mongoose";
import EmployeeExit from "../Modals/EmployeeExit.modal.js";
import EmployeeExitNotification from "../Modals/EmployeeExitNotification.modal.js";
import {
  EXIT_STATUS,
  addExitAuditLog,
  completeExitRecord,
  getReminderWindowStart,
  notifyExitAudience,
  shouldCompleteExitNow,
} from "../services/employeeExit.service.js";

const hasRecentReminder = async ({ exitId, title, since }) =>
  Boolean(
    await EmployeeExitNotification.exists({
      exitId,
      title,
      createdAt: { $gte: since },
    })
  );

const sendEscalationReminders = async () => {
  const now = new Date();
  const itThreshold = getReminderWindowStart(48);
  const hrThreshold = getReminderWindowStart(24);
  const reminderSince = getReminderWindowStart(12);

  const [itOverdue, hrOverdue] = await Promise.all([
    EmployeeExit.find({
      status: EXIT_STATUS.IT_PENDING,
      updatedAt: { $lte: itThreshold },
    })
      .select("_id updatedAt employeeId")
      .lean(),
    EmployeeExit.find({
      status: EXIT_STATUS.HR_PENDING,
      updatedAt: { $lte: hrThreshold },
    })
      .select("_id updatedAt employeeId")
      .lean(),
  ]);

  for (const exit of itOverdue) {
    const title = "Overdue IT clearance";
    if (await hasRecentReminder({ exitId: exit._id, title, since: reminderSince })) continue;
    await notifyExitAudience({
      audience: ["SuperAdmin"],
      exitId: exit._id,
      title,
      message: "IT clearance has been pending for more than 48 hours.",
      reminder: true,
    });
    await addExitAuditLog({
      exitId: exit._id,
      action: "IT clearance reminder sent",
      oldStatus: EXIT_STATUS.IT_PENDING,
      newStatus: EXIT_STATUS.IT_PENDING,
      department: "System",
      remarks: `Reminder sent at ${now.toISOString()}`,
    });
  }

  for (const exit of hrOverdue) {
    const title = "Overdue HR clearance";
    if (await hasRecentReminder({ exitId: exit._id, title, since: reminderSince })) continue;
    await notifyExitAudience({
      audience: ["SuperAdmin"],
      exitId: exit._id,
      title,
      message: "HR clearance has been pending for more than 24 hours.",
      reminder: true,
    });
    await addExitAuditLog({
      exitId: exit._id,
      action: "HR clearance reminder sent",
      oldStatus: EXIT_STATUS.HR_PENDING,
      newStatus: EXIT_STATUS.HR_PENDING,
      department: "System",
      remarks: `Reminder sent at ${now.toISOString()}`,
    });
  }
};

const completeDueExits = async () => {
  const dueExits = await EmployeeExit.find({
    status: EXIT_STATUS.WAITING_LAST_DAY,
    exitCompletedAt: null,
  }).select("_id employeeId status lastWorkingDate exitCompletedAt");

  for (const exit of dueExits) {
    if (!shouldCompleteExitNow(exit.lastWorkingDate)) continue;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const lockedExit = await EmployeeExit.findOne({
          _id: exit._id,
          status: EXIT_STATUS.WAITING_LAST_DAY,
          exitCompletedAt: null,
        }).session(session);
        if (!lockedExit || !shouldCompleteExitNow(lockedExit.lastWorkingDate)) return;

        await completeExitRecord({
          exit: lockedExit,
          department: "System",
          session,
        });
      });
    } catch (error) {
      console.error("Employee exit completion error:", error?.message || error);
    } finally {
      session.endSession();
    }
  }
};

cron.schedule("*/30 * * * *", async () => {
  try {
    await Promise.all([sendEscalationReminders(), completeDueExits()]);
  } catch (error) {
    console.error("Employee exit job error:", error?.message || error);
  }
});

import User from "../Modals/User.modal.js";
import Notification from "../Modals/Notification.modal.js";
import PunchSession from "../Modals/PunchSession.modal.js";
import EmployeeExit from "../Modals/EmployeeExit.modal.js";
import EmployeeExitAuditLog from "../Modals/EmployeeExitAuditLog.modal.js";
import EmployeeExitNotification from "../Modals/EmployeeExitNotification.modal.js";
import { normalizeDepartment } from "../utils/roleAccess.js";

const EXIT_NOTIFICATION_TYPE = "employee_exit_event";
const EXIT_REMINDER_TYPE = "employee_exit_reminder";

export const EXIT_CACHE_TAG = "employee-exit";

export const EXIT_STATUS = Object.freeze({
  NOTICE_PERIOD: "notice_period",
  IT_PENDING: "it_verification_pending",
  IT_CLEARED: "it_cleared",
  HR_PENDING: "hr_clearance_pending",
  HR_CLEARED: "hr_cleared",
  ACCOUNTS_PENDING: "accounts_clearance_pending",
  ACCOUNTS_CLEARED: "accounts_cleared",
  SUPERADMIN_PENDING: "superadmin_approval_pending",
  WAITING_LAST_DAY: "waiting_for_last_working_day",
  COMPLETED: "exit_completed",
  REVOKED: "exit_revoked",
});

export const ACTIVE_EXIT_STATUSES = [
  EXIT_STATUS.NOTICE_PERIOD,
  EXIT_STATUS.IT_PENDING,
  EXIT_STATUS.IT_CLEARED,
  EXIT_STATUS.HR_PENDING,
  EXIT_STATUS.HR_CLEARED,
  EXIT_STATUS.ACCOUNTS_PENDING,
  EXIT_STATUS.ACCOUNTS_CLEARED,
  EXIT_STATUS.SUPERADMIN_PENDING,
  EXIT_STATUS.WAITING_LAST_DAY,
];

export const resolveUserName = (user = {}) =>
  String(user?.realName || user?.pseudoName || user?.username || "Employee").trim();

export const escapeRegex = (value = "") =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getActorDepartment = (user = {}) => {
  if (String(user?.accountType || "").toLowerCase() === "superadmin") return "SuperAdmin";
  return normalizeDepartment(user?.department) || String(user?.accountType || "").trim() || "System";
};

export const addExitAuditLog = async ({
  exitId,
  action,
  oldStatus = "",
  newStatus = "",
  performedBy = null,
  department = "",
  remarks = "",
  session = null,
}) => {
  const docs = await EmployeeExitAuditLog.create(
    [
      {
        exitId,
        action,
        oldStatus: oldStatus || "",
        newStatus: newStatus || "",
        performedBy,
        department,
        remarks,
        timestamp: new Date(),
      },
    ],
    { session }
  );
  return docs?.[0] || null;
};

const getUsersByAudience = async (audience = []) => {
  const normalizedAudience = new Set(audience.map((item) => String(item || "").trim().toLowerCase()));
  const or = [];

  if (normalizedAudience.has("superadmin")) {
    or.push({ accountType: "superAdmin" });
  }
  if (normalizedAudience.has("hr")) {
    or.push({ accountType: "HR" }, { department: /^hr$/i });
  }
  if (normalizedAudience.has("it")) {
    or.push({ department: /^it$/i });
  }
  if (normalizedAudience.has("accounts")) {
    or.push({ department: /^accounts?$/i });
  }

  if (!or.length) return [];

  return User.find({
    isActive: { $ne: false },
    $or: or,
  })
    .select("_id")
    .lean();
};

export const notifyExitAudience = async ({
  audience = [],
  exitId,
  actor = null,
  title,
  message,
  io = null,
  reminder = false,
  session = null,
}) => {
  const users = await getUsersByAudience(audience);
  if (!users.length) return [];

  const now = new Date();
  const exitNotifications = users.map((user) => ({
    userId: user._id,
    exitId,
    title,
    message,
    read: false,
    createdAt: now,
    updatedAt: now,
  }));

  const appNotifications = users.map((user) => ({
    recipient: user._id,
    actor: actor?._id || actor?.id || null,
    type: reminder ? EXIT_REMINDER_TYPE : EXIT_NOTIFICATION_TYPE,
    title,
    message,
    metadata: {
      exitId: String(exitId),
      module: "employee_exit",
    },
    read: false,
    createdAt: now,
    updatedAt: now,
  }));

  const [createdExitNotifications, createdAppNotifications] = await Promise.all([
    EmployeeExitNotification.insertMany(exitNotifications, { session }),
    Notification.insertMany(appNotifications, { session }),
  ]);

  if (io) {
    createdAppNotifications.forEach((notification) => {
      io.to(String(notification.recipient)).emit("system_notification", notification);
    });
  }

  return createdExitNotifications;
};

export const getKolkataDayEnd = (value) => {
  const date = value ? new Date(value) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);
};

export const shouldCompleteExitNow = (lastWorkingDate, now = new Date()) =>
  now.getTime() >= getKolkataDayEnd(lastWorkingDate).getTime();

export const completeExitRecord = async ({
  exit,
  actor = null,
  department = "System",
  remarks = "Exit completed automatically at end of last working day",
  session = null,
  io = null,
} = {}) => {
  if (!exit || exit.status === EXIT_STATUS.COMPLETED) {
    return { completed: false, reason: "Exit already completed" };
  }

  const oldStatus = exit.status;
  const now = new Date();
  exit.status = EXIT_STATUS.COMPLETED;
  exit.exitCompletedAt = now;
  await exit.save({ session });

  await User.updateOne(
    { _id: exit.employeeId },
    {
      $set: {
        isActive: false,
        active: false,
        employmentStatus: "Exited",
      },
    },
    { session }
  );

  await PunchSession.updateMany(
    { userId: exit.employeeId, status: "active" },
    {
      $set: {
        status: "ended",
        activityStatus: "no_activity",
        shiftEndAt: now,
        shiftEndReason: "auto_window",
      },
    },
    { session }
  );

  await addExitAuditLog({
    exitId: exit._id,
    action: "Employee deactivated",
    oldStatus,
    newStatus: EXIT_STATUS.COMPLETED,
    performedBy: actor?._id || actor?.id || null,
    department,
    remarks,
    session,
  });

  await notifyExitAudience({
    audience: ["HR", "IT", "Accounts"],
    exitId: exit._id,
    actor,
    title: "Exit completed",
    message: "Employee access has been disabled and exit is completed.",
    io,
    session,
  });

  return { completed: true };
};

export const buildExitListQueryForUser = (user = {}, baseQuery = {}) => {
  const department = normalizeDepartment(user?.department);
  const accountType = String(user?.accountType || "").trim();

  if (accountType === "superAdmin" || accountType === "HR" || department === "HR") {
    return baseQuery;
  }

  if (department === "IT") {
    return {
      ...baseQuery,
      $or: [
        { status: EXIT_STATUS.IT_PENDING },
        { status: EXIT_STATUS.REVOKED },
        { itVerifiedBy: user._id || user.id },
      ],
    };
  }

  if (["Account", "Accounts"].includes(department)) {
    return {
      ...baseQuery,
      $or: [
        { status: EXIT_STATUS.ACCOUNTS_PENDING },
        { status: EXIT_STATUS.REVOKED },
        { accountsVerifiedBy: user._id || user.id },
      ],
    };
  }

  return { ...baseQuery, employeeId: user._id || user.id };
};

export const isHrUser = (user = {}) =>
  String(user?.accountType || "").trim() === "HR" || normalizeDepartment(user?.department) === "HR";

export const isItUser = (user = {}) => normalizeDepartment(user?.department) === "IT";

export const isAccountsUser = (user = {}) => {
  const department = normalizeDepartment(user?.department);
  return department === "Account" || department === "Accounts";
};

export const isSuperAdminUser = (user = {}) => String(user?.accountType || "").trim() === "superAdmin";

export const isExitPrivilegedUser = (user = {}) =>
  isHrUser(user) || isItUser(user) || isAccountsUser(user) || isSuperAdminUser(user);

export const getReminderWindowStart = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

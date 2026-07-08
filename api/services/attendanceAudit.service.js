import AttendanceAuditLog from "../Modals/AttendanceAuditLog.modal.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";
import mongoose from "mongoose";

const cleanString = (value = "") => String(value || "").trim();
const toObjectIdOrNull = (value) => {
  const raw = value?._id || value;
  if (!raw) return null;
  const stringValue = String(raw).trim();
  return mongoose.Types.ObjectId.isValid(stringValue) ? raw : null;
};

export const ATTENDANCE_AUDIT_ACTIONS = Object.freeze({
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  OVERRIDE: "OVERRIDE",
  BULK_UPDATE: "BULK_UPDATE",
});

export const getRequestIp = (req = {}) => {
  const forwarded = cleanString(req.headers?.["x-forwarded-for"]);
  if (forwarded) return forwarded.split(",")[0].trim();
  return cleanString(req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress);
};

export const getRequestDevice = (req = {}) => cleanString(req.headers?.["user-agent"]);

export const getRequestId = (req = {}) =>
  cleanString(req.headers?.["x-request-id"] || req.headers?.["x-correlation-id"] || req.id);

export const resolveActorRole = (user = {}) => {
  if (String(user?.accountType || "").trim() === "superAdmin") return "superAdmin";
  if (String(user?.accountType || "").trim() === "HR") return "HR";
  return getRoleType(user) || cleanString(user?.accountType) || "employee";
};

export const resolveActorName = (user = {}) =>
  cleanString(user?.realName || user?.pseudoName || user?.username || user?.name || "System");

export const buildAuditContext = (req = {}, source = "attendance_update") => ({
  updatedBy: toObjectIdOrNull(req.user?._id || req.user?.id),
  updatedByName: resolveActorName(req.user),
  updatedByRole: resolveActorRole(req.user),
  updatedAt: new Date(),
  ipAddress: getRequestIp(req),
  device: getRequestDevice(req),
  requestId: getRequestId(req),
  source,
});

export const normalizeAttendanceDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const inferAuditAction = ({ isNewDay = false, isBulk = false, isOverride = false } = {}) => {
  if (isOverride) return ATTENDANCE_AUDIT_ACTIONS.OVERRIDE;
  if (isBulk) return ATTENDANCE_AUDIT_ACTIONS.BULK_UPDATE;
  if (isNewDay) return ATTENDANCE_AUDIT_ACTIONS.CREATE;
  return ATTENDANCE_AUDIT_ACTIONS.UPDATE;
};

export const buildAttendanceAuditLogs = ({
  req,
  roster,
  employee,
  attendanceDate,
  changes = [],
  action,
  source = "attendance_update",
  remarks = "",
  metadata = {},
} = {}) => {
  const date = normalizeAttendanceDate(attendanceDate);
  if (!date || !employee || !Array.isArray(changes) || changes.length === 0) return [];

  const context = buildAuditContext(req, source);
  const employeeName = cleanString(employee.name || employee.username || employee.realName || employee.pseudoName);
  const employeeDepartment = normalizeDepartment(employee.department);

  return changes.map((change = {}) => ({
    rosterId: toObjectIdOrNull(roster?._id || roster?.id || metadata?.rosterId),
    employeeId: toObjectIdOrNull(employee.userId || metadata?.employeeId),
    rosterEmployeeId: toObjectIdOrNull(employee._id || metadata?.rosterEmployeeId),
    employeeName,
    employeeCode: cleanString(employee.empId),
    supervisorName: cleanString(employee.teamLeader),
    attendanceDate: date,
    action,
    field: cleanString(change.field),
    oldStatus: change.oldValue ?? null,
    newStatus: change.newValue ?? null,
    oldRemarks: cleanString(change.oldRemarks),
    newRemarks: cleanString(change.newRemarks || remarks),
    branch: cleanString(employee.branch || metadata?.branch),
    department: employeeDepartment || cleanString(metadata?.department),
    ...context,
    metadata,
  }));
};

export const writeAttendanceAuditLogs = async (logs = []) => {
  const validLogs = logs.filter(Boolean);
  if (!validLogs.length) return [];
  try {
    return await AttendanceAuditLog.insertMany(validLogs, { ordered: false });
  } catch (error) {
    const validationMessages = Object.values(error?.errors || {})
      .map((entry) => entry?.message)
      .filter(Boolean);
    console.error("Attendance audit log insert failed:", {
      message: error?.message,
      code: error?.code,
      validationMessages,
      writeErrors: error?.writeErrors?.map((entry) => entry?.errmsg || entry?.message).filter(Boolean),
      attemptedCount: validLogs.length,
    });
    throw error;
  }
};

export const logAttendanceAudit = async (options = {}) => {
  const logs = buildAttendanceAuditLogs(options);
  return writeAttendanceAuditLogs(logs);
};

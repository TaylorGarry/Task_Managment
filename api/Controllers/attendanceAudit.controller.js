import mongoose from "mongoose";
import AttendanceAuditLog from "../Modals/AttendanceAuditLog.modal.js";

const USER_SELECT = "username realName pseudoName empId department accountType";
const SORT_FIELDS = new Set(["createdAt", "updatedAt", "attendanceDate", "action", "employeeName", "updatedByName"]);

const cleanString = (value = "") => String(value || "").trim();

const jsonOk = (res, message, data = {}, status = 200) =>
  res.status(status).json({ success: true, message, data });

const jsonError = (res, status, message) =>
  res.status(status).json({ success: false, message, data: null });

const escapeRegex = (value = "") =>
  cleanString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 500);
  return { page, limit, skip: (page - 1) * limit };
};

const parseDateStart = (value) => {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateEnd = (value) => {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(`${raw}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSuperAdminUser = (user = {}) => cleanString(user?.accountType) === "superAdmin";

const buildAuditQuery = (query = {}) => {
  const filter = {};
  const andFilters = [];
  const search = cleanString(query.search);
  const employee = cleanString(query.employee || query.employeeId);
  const supervisor = cleanString(query.supervisor || query.supervisorId);
  const branch = cleanString(query.branch);
  const department = cleanString(query.department);
  const action = cleanString(query.action).toUpperCase();
  const attendanceDate = cleanString(query.attendanceDate);
  const dateFrom = cleanString(query.dateFrom || query.startDate);
  const dateTo = cleanString(query.dateTo || query.endDate);

  if (search) {
    andFilters.push({ $or: [
      { employeeName: new RegExp(escapeRegex(search), "i") },
      { employeeCode: new RegExp(escapeRegex(search), "i") },
      { supervisorName: new RegExp(escapeRegex(search), "i") },
      { updatedByName: new RegExp(escapeRegex(search), "i") },
      { ipAddress: new RegExp(escapeRegex(search), "i") },
      { device: new RegExp(escapeRegex(search), "i") },
    ] });
  }

  if (employee) {
    if (mongoose.Types.ObjectId.isValid(employee)) {
      andFilters.push({ $or: [
        { employeeId: new mongoose.Types.ObjectId(employee) },
        { rosterEmployeeId: new mongoose.Types.ObjectId(employee) },
      ] });
    } else {
      const employeeRegex = new RegExp(escapeRegex(employee), "i");
      andFilters.push({ $or: [
        { employeeName: employeeRegex },
        { employeeCode: employeeRegex },
      ] });
    }
  }

  if (supervisor) {
    if (mongoose.Types.ObjectId.isValid(supervisor)) {
      filter.updatedBy = new mongoose.Types.ObjectId(supervisor);
    } else {
      const supervisorRegex = new RegExp(escapeRegex(supervisor), "i");
      andFilters.push({ $or: [
        { supervisorName: supervisorRegex },
        { updatedByName: supervisorRegex },
      ] });
    }
  }

  if (branch) filter.branch = new RegExp(`^${escapeRegex(branch)}$`, "i");
  if (department) filter.department = new RegExp(`^${escapeRegex(department)}$`, "i");
  if (action && action !== "ALL") filter.action = action;

  if (attendanceDate) {
    const start = parseDateStart(attendanceDate);
    const end = parseDateEnd(attendanceDate);
    if (start && end) filter.attendanceDate = { $gte: start, $lte: end };
  } else if (dateFrom || dateTo) {
    const range = {};
    const start = parseDateStart(dateFrom);
    const end = parseDateEnd(dateTo);
    if (start) range.$gte = start;
    if (end) range.$lte = end;
    if (Object.keys(range).length) filter.createdAt = range;
  }

  if (andFilters.length) filter.$and = andFilters;

  return filter;
};

const buildSort = (query = {}) => {
  const sortBy = SORT_FIELDS.has(cleanString(query.sortBy)) ? cleanString(query.sortBy) : "createdAt";
  const sortOrder = cleanString(query.sortOrder).toLowerCase() === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder, _id: sortOrder };
};

const getHistoryQuery = (log = {}) => {
  const start = new Date(log.attendanceDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(log.attendanceDate);
  end.setUTCHours(23, 59, 59, 999);
  const or = [];
  if (log.employeeId) or.push({ employeeId: log.employeeId });
  if (log.rosterEmployeeId) or.push({ rosterEmployeeId: log.rosterEmployeeId });
  if (!or.length && log.employeeName) or.push({ employeeName: log.employeeName });
  return {
    $or: or,
    attendanceDate: { $gte: start, $lte: end },
  };
};

export const getAttendanceAuditLogs = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return jsonError(res, 403, "Only Super Admin can access attendance audit logs");
    }

    const pagination = parsePagination(req.query);
    const filter = buildAuditQuery(req.query);
    const sort = buildSort(req.query);

    const [items, total] = await Promise.all([
      AttendanceAuditLog.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("updatedBy", USER_SELECT)
        .populate("employeeId", USER_SELECT)
        .lean(),
      AttendanceAuditLog.countDocuments(filter),
    ]);

    return jsonOk(res, "Attendance audit logs fetched", {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(Math.ceil(total / pagination.limit), 1),
      },
    });
  } catch (error) {
    console.error("getAttendanceAuditLogs error:", error);
    return jsonError(res, 500, "Failed to fetch attendance audit logs");
  }
};

export const getAttendanceAuditLogById = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return jsonError(res, 403, "Only Super Admin can access attendance audit logs");
    }

    const id = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError(res, 400, "Invalid audit log id");
    }

    const log = await AttendanceAuditLog.findById(id)
      .populate("updatedBy", USER_SELECT)
      .populate("employeeId", USER_SELECT)
      .lean();
    if (!log) return jsonError(res, 404, "Attendance audit log not found");

    const history = await AttendanceAuditLog.find(getHistoryQuery(log))
      .sort({ createdAt: 1, _id: 1 })
      .populate("updatedBy", USER_SELECT)
      .populate("employeeId", USER_SELECT)
      .lean();

    return jsonOk(res, "Attendance audit log fetched", { log, history });
  } catch (error) {
    console.error("getAttendanceAuditLogById error:", error);
    return jsonError(res, 500, "Failed to fetch attendance audit log");
  }
};

export const getAttendanceAuditHistory = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return jsonError(res, 403, "Only Super Admin can access attendance audit logs");
    }

    const employeeId = cleanString(req.params.employeeId);
    const attendanceDate = cleanString(req.params.attendanceDate);
    const start = parseDateStart(attendanceDate);
    const end = parseDateEnd(attendanceDate);
    if (!employeeId || !start || !end) {
      return jsonError(res, 400, "employeeId and attendanceDate are required");
    }

    const employeeFilter = mongoose.Types.ObjectId.isValid(employeeId)
      ? {
          $or: [
            { employeeId: new mongoose.Types.ObjectId(employeeId) },
            { rosterEmployeeId: new mongoose.Types.ObjectId(employeeId) },
          ],
        }
      : {
          $or: [
            { employeeName: new RegExp(escapeRegex(employeeId), "i") },
            { employeeCode: new RegExp(escapeRegex(employeeId), "i") },
          ],
        };

    const history = await AttendanceAuditLog.find({
      ...employeeFilter,
      attendanceDate: { $gte: start, $lte: end },
    })
      .sort({ createdAt: 1, _id: 1 })
      .populate("updatedBy", USER_SELECT)
      .populate("employeeId", USER_SELECT)
      .lean();

    return jsonOk(res, "Attendance audit history fetched", history);
  } catch (error) {
    console.error("getAttendanceAuditHistory error:", error);
    return jsonError(res, 500, "Failed to fetch attendance audit history");
  }
};

import Roster from "../Modals/Roster.modal.js";

const getDailyStatusSchema = () => {
  const weekSchema = Roster.schema.path("weeks")?.schema;
  const employeeSchema = weekSchema?.path("employees")?.schema;
  return employeeSchema?.path("dailyStatus")?.schema || null;
};

const getEnumValues = (path) => {
  const values = getDailyStatusSchema()?.path(path)?.enumValues || [];
  return values.filter((value) => String(value || "").trim());
};

export const getRosterStatusValues = () => getEnumValues("status");

export const getDepartmentStatusValues = () =>
  getEnumValues("departmentStatus");

export const getTransportStatusValues = () =>
  getEnumValues("transportStatus");

export const getAllowedAttendanceStatuses = () => {
  const seen = new Set();
  return getDepartmentStatusValues().filter((status) => {
    const key = String(status).trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeAttendanceStatus = (status = "") => {
  const raw = String(status || "").trim();
  const upper = raw.toUpperCase();
  const allowed = getAllowedAttendanceStatuses();
  return allowed.find((item) => String(item).toUpperCase() === upper) || "";
};

export const isValidAttendanceStatus = (status = "") =>
  Boolean(normalizeAttendanceStatus(status));

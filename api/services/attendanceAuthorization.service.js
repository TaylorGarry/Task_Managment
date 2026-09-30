import User from "../Modals/User.modal.js";
import { getRoleType, isHrDepartment } from "../utils/roleAccess.js";

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[()\-_/.,]+/g, " ")
    .replace(/\s+/g, " ");

const sameId = (a, b) => Boolean(a && b && String(a) === String(b));

const userAliases = (user = {}) =>
  new Set(
    [user.username, user.realName, user.pseudoName]
      .map(normalize)
      .filter(Boolean)
  );

export const isAttendanceSuperAdmin = (user = {}) =>
  String(user?.accountType || "").trim() === "superAdmin";

export const isAttendanceHr = (user = {}) =>
  String(user?.accountType || "").trim() === "HR" || isHrDepartment(user);

export const isAttendanceSupervisor = (user = {}) =>
  String(user?.accountType || "").trim() === "employee" &&
  String(user?.roleType || getRoleType(user)).trim() === "supervisor";

export const isSameAttendanceEmployee = (currentUser = {}, targetEmployee = {}) => {
  if (sameId(targetEmployee?.userId, currentUser?._id || currentUser?.id)) return true;
  const aliases = userAliases(currentUser);
  const employeeLabels = [targetEmployee?.name, targetEmployee?.username, targetEmployee?.empId]
    .map(normalize)
    .filter(Boolean);
  return employeeLabels.some((label) => aliases.has(label));
};

export const isEmployeeInSupervisorTeam = async (currentUser = {}, targetEmployee = {}) => {
  if (!isAttendanceSupervisor(currentUser) || !targetEmployee) return false;

  if (isSameAttendanceEmployee(currentUser, targetEmployee)) return true;

  if (targetEmployee?.userId) {
    const employeeUser = await User.findById(targetEmployee.userId)
      .select("_id reportingManager")
      .lean();
    if (sameId(employeeUser?.reportingManager, currentUser?._id)) return true;
  }

  const supervisorAliases = userAliases(currentUser);
  const teamLeader = normalize(targetEmployee?.teamLeader);
  return Boolean(teamLeader && supervisorAliases.has(teamLeader));
};

export const canViewAttendance = async (currentUser = {}, targetEmployee = {}) => {
  if (!currentUser || !targetEmployee) return false;
  if (isAttendanceSuperAdmin(currentUser) || isAttendanceHr(currentUser)) return true;
  if (isAttendanceSupervisor(currentUser)) {
    return isEmployeeInSupervisorTeam(currentUser, targetEmployee);
  }
  return isSameAttendanceEmployee(currentUser, targetEmployee);
};

export const canUpdateAttendance = async (currentUser = {}, targetEmployee = {}) => {
  if (!currentUser || !targetEmployee) return false;
  if (isAttendanceSuperAdmin(currentUser) || isAttendanceHr(currentUser)) return true;
  if (isAttendanceSupervisor(currentUser)) {
    return isEmployeeInSupervisorTeam(currentUser, targetEmployee);
  }
  return false;
};

export const filterViewableAttendanceEmployees = async (currentUser = {}, employees = []) => {
  const allowed = [];
  for (const employee of employees || []) {
    if (await canViewAttendance(currentUser, employee)) allowed.push(employee);
  }
  return allowed;
};

export const filterUpdatableAttendanceEmployees = async (currentUser = {}, employees = []) => {
  const allowed = [];
  for (const employee of employees || []) {
    if (await canUpdateAttendance(currentUser, employee)) allowed.push(employee);
  }
  return allowed;
};

export const resolveAccessibleEmployees = filterViewableAttendanceEmployees;


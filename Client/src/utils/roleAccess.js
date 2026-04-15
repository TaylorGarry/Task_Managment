export const DEPARTMENT_OPTIONS = [
  "Accounts",
  "Customer Service",
  "Developer",
  "IT",
  "Marketing",
  "Operations",
  "Sales",
  "SEO",
  "Ticketing",
  "HR",
];

const DEPARTMENT_ALIASES = {
  "ops - meta": "Operations",
  "ops-meta": "Operations",
  "ops meta": "Operations",
  ops: "Operations",
  operations: "Operations",
  cs: "Customer Service",
  "customer service": "Customer Service",
  seo: "SEO",
  hr: "HR",
};

const normalizeText = (value = "") => String(value || "").trim();

export const normalizeDepartment = (department = "") => {
  const raw = normalizeText(department);
  if (!raw) return "";
  const alias = DEPARTMENT_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  return raw;
};

export const getRoleType = (userLike = {}) => {
  const accountType = String(userLike?.accountType || "").trim().toLowerCase();

  if (accountType === "superadmin") return "superAdmin";
  if (accountType === "supervisor") return "supervisor";
  if (accountType === "agent") return "agent";

  if (accountType === "employee") {
    return userLike?.isTeamLeader ? "supervisor" : "agent";
  }

  if (["admin", "hr", "operations", "am"].includes(accountType)) {
    return "supervisor";
  }

  return userLike?.isTeamLeader ? "supervisor" : "agent";
};

export const isSuperAdmin = (userLike = {}) => getRoleType(userLike) === "superAdmin";
export const isSupervisor = (userLike = {}) => getRoleType(userLike) === "supervisor";
export const isAgent = (userLike = {}) => getRoleType(userLike) === "agent";

export const isHrDepartment = (userLike = {}) => {
  const normalizedDepartment = normalizeDepartment(userLike?.department);
  return normalizedDepartment === "HR" || String(userLike?.accountType || "").trim().toLowerCase() === "hr";
};

export const isPrivilegedUser = (userLike = {}) => isSuperAdmin(userLike) || isHrDepartment(userLike);

export const canManageAdminPanels = (userLike = {}) => isPrivilegedUser(userLike);

export const canAccessAttendanceUpdate = (userLike = {}) => {
  if (isPrivilegedUser(userLike)) return true;
  return getRoleType(userLike) === "agent" || getRoleType(userLike) === "supervisor";
};

export const getRoleLabel = (userLike = {}) => {
  const roleType = getRoleType(userLike);
  if (roleType === "superAdmin") return "Super Admin";
  if (roleType === "supervisor") return "Supervisor";
  return "Agent";
};

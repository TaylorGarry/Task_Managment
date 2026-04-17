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
const TEAM_LEADER_DESIGNATION_RE = /\bteam\s*leader\b/i;

export const normalizeDepartment = (department = "") => {
  const raw = normalizeText(department);
  if (!raw) return "";
  const alias = DEPARTMENT_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  return raw;
};

export const toStorageDepartment = (department = "") => {
  const normalized = normalizeDepartment(department);
  if (!normalized) return "";
  if (normalized === "Operations") return "Ops - Meta";
  if (normalized === "Customer Service") return "CS";
  if (normalized === "SEO") return "Seo";
  return normalized;
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

export const isTeamLeaderUser = (userLike = {}) => {
  if (!userLike) return false;
  if (Boolean(userLike?.isTeamLeader)) return true;
  const designation = String(userLike?.designation || "").trim();
  return TEAM_LEADER_DESIGNATION_RE.test(designation);
};

export const isSuperAdmin = (userLike = {}) => getRoleType(userLike) === "superAdmin";
export const isSupervisor = (userLike = {}) => getRoleType(userLike) === "supervisor";
export const isAgent = (userLike = {}) => getRoleType(userLike) === "agent";

export const isHrDepartment = (userLike = {}) => {
  const normalizedDepartment = normalizeDepartment(userLike?.department);
  return normalizedDepartment === "HR" || String(userLike?.accountType || "").trim().toLowerCase() === "hr";
};

export const isPrivilegedUser = (userLike = {}) => isSuperAdmin(userLike) || isHrDepartment(userLike);

export const toStorageAccountType = (requestedRole = "", isTeamLeader = false) => {
  const normalized = String(requestedRole || "").trim().toLowerCase();

  if (normalized === "superadmin") {
    return { accountType: "superAdmin", isTeamLeader: false, roleType: "superAdmin" };
  }

  if (normalized === "supervisor") {
    return { accountType: "employee", isTeamLeader: true, roleType: "supervisor" };
  }

  if (normalized === "agent") {
    return { accountType: "employee", isTeamLeader: false, roleType: "agent" };
  }

  if (normalized === "employee") {
    return {
      accountType: "employee",
      isTeamLeader: Boolean(isTeamLeader),
      roleType: Boolean(isTeamLeader) ? "supervisor" : "agent",
    };
  }

  if (["admin", "hr", "operations", "am"].includes(normalized)) {
    return { accountType: "employee", isTeamLeader: true, roleType: "supervisor" };
  }

  return {
    accountType: "employee",
    isTeamLeader: Boolean(isTeamLeader),
    roleType: Boolean(isTeamLeader) ? "supervisor" : "agent",
  };
};

export const withRoleType = (userLike = {}) => ({
  ...(userLike || {}),
  roleType: getRoleType(userLike),
  department: normalizeDepartment(userLike?.department),
});

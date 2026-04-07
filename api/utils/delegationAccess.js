import Delegation from "../Modals/Delegation/delegation.modal.js";

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const parseActionDate = (value) => {
  if (!value) return new Date();

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0)
    );
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0)
  );
};

const getUtcDayRange = (baseDate) => {
  const date = parseActionDate(baseDate);
  const startOfDayUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
  const endOfDayUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
  return { startOfDayUtc, endOfDayUtc };
};

const expireOldDelegations = async (startOfDayUtc) => {
  await Delegation.updateMany(
    {
      status: "active",
      endDate: { $lt: startOfDayUtc },
    },
    { $set: { status: "expired" } }
  );
};

export const getDelegationContextForDate = async ({ userId, actionDate }) => {
  const userIdValue = toIdString(userId);
  const { startOfDayUtc, endOfDayUtc } = getUtcDayRange(actionDate);

  await expireOldDelegations(startOfDayUtc);

  const [asDelegator, asAssignee] = await Promise.all([
    Delegation.findOne({
      delegator: userIdValue,
      status: "active",
      startDate: { $lte: endOfDayUtc },
      endDate: { $gte: startOfDayUtc },
    }).lean(),
    Delegation.findOne({
      assignee: userIdValue,
      status: "active",
      startDate: { $lte: endOfDayUtc },
      endDate: { $gte: startOfDayUtc },
    }).lean(),
  ]);

  return {
    asDelegator,
    asAssignee,
    startOfDayUtc,
    endOfDayUtc,
  };
};

export const canDelegatedAssigneeManageEmployee = (delegation, targetEmployeeUserId) => {
  if (!delegation || !targetEmployeeUserId) return false;
  const target = toIdString(targetEmployeeUserId);
  return (delegation.affectedEmployees || []).some((empId) => toIdString(empId) === target);
};

export const canDelegatedAssigneeActForDelegator = (delegation, targetUserId) => {
  if (!delegation || !targetUserId) return false;
  return toIdString(delegation.delegator) === toIdString(targetUserId);
};


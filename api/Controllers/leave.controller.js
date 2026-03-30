import LeaveBalance from "../Modals/LeaveBalance.modal.js";
import LeaveRequest from "../Modals/LeaveRequest.modal.js";
import User from "../Modals/User.modal.js";
import {
  canUsePaidLeave,
  computeMonthlyAccrual,
  computeSandwichAndChargeDays,
  getAccrualStartMonth,
  getFinancialYearBounds,
  getLeaveConfig,
  getProbationEndDate,
} from "../utils/leavePolicy.js";

const ADMIN_ROLES = new Set(["HR", "superAdmin", "admin"]);
const LEAVE_TYPES = new Set(["EL", "CL", "ML", "LWP"]);

const roundHalf = (value) => Math.round(Number(value || 0) * 2) / 2;

const startOfDay = (date) => {
  if (typeof date === "string") {
    const m = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+05:30`);
    }
  }
  const d = new Date(date);
  return new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(d)
      .replace(/\//g, "-") + "T00:00:00+05:30"
  );
};

const isAdminUser = (user) => ADMIN_ROLES.has(user?.accountType);
let legacyIndexChecked = false;

const ensureBucket = (obj = {}) => ({
  EL: roundHalf(obj?.EL || 0),
  CL: roundHalf(obj?.CL || 0),
  ML: roundHalf(obj?.ML || 0),
  LWP: roundHalf(obj?.LWP || 0),
});

const cleanupLegacyLeaveBalanceIndexes = async () => {
  if (legacyIndexChecked) return;
  legacyIndexChecked = true;
  try {
    const indexes = await LeaveBalance.collection.indexes();
    const hasLegacyUserUnique = indexes.some(
      (idx) =>
        idx?.name === "user_1" &&
        idx?.unique === true &&
        idx?.key &&
        Object.keys(idx.key).length === 1 &&
        idx.key.user === 1
    );
    if (hasLegacyUserUnique) {
      await LeaveBalance.collection.dropIndex("user_1");
      console.log("[leave] Dropped legacy unique index user_1 from leavebalances");
    }

    const legacyYearIndexByUserId = indexes.find(
      (idx) =>
        idx?.unique === true &&
        idx?.key &&
        Object.keys(idx.key).length === 2 &&
        idx.key.userId === 1 &&
        idx.key.year === 1
    );
    if (legacyYearIndexByUserId?.name) {
      await LeaveBalance.collection.dropIndex(legacyYearIndexByUserId.name);
      console.log(
        `[leave] Dropped legacy unique index ${legacyYearIndexByUserId.name} from leavebalances`
      );
    }

    const legacyYearIndexByUser = indexes.find(
      (idx) =>
        idx?.unique === true &&
        idx?.key &&
        Object.keys(idx.key).length === 2 &&
        idx.key.user === 1 &&
        idx.key.year === 1
    );
    if (legacyYearIndexByUser?.name) {
      await LeaveBalance.collection.dropIndex(legacyYearIndexByUser.name);
      console.log(
        `[leave] Dropped legacy unique index ${legacyYearIndexByUser.name} from leavebalances`
      );
    }
  } catch (err) {
    console.error("[leave] Legacy index cleanup skipped:", err?.message || err);
  }
};

const serializeBalance = (balanceDoc) => {
  if (!balanceDoc) return null;
  return {
    credited: balanceDoc.credited || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    used: balanceDoc.used || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    available: balanceDoc.available || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    financialYearStart: balanceDoc.financialYearStart,
    financialYearEnd: balanceDoc.financialYearEnd,
    lastAccruedMonth: balanceDoc.lastAccruedMonth,
  };
};

const maskPaidLeavesDuringProbation = (serializedBalance, probationCompleted) => {
  if (!serializedBalance) return serializedBalance;
  if (probationCompleted) return serializedBalance;
  return {
    ...serializedBalance,
    credited: {
      ...(serializedBalance.credited || {}),
      EL: 0,
      CL: 0,
      ML: 0,
    },
    available: {
      ...(serializedBalance.available || {}),
      EL: 0,
      CL: 0,
      ML: 0,
    },
  };
};

const ensureLeaveBalanceForUser = async (userId, asOfDate = new Date()) => {
  await cleanupLegacyLeaveBalanceIndexes();
  const user = await User.findById(userId).select("_id dateOfJoining accountType username").lean();
  if (!user) throw new Error("User not found");

  const { start, end } = getFinancialYearBounds(asOfDate);
  const startYear = start.getFullYear();
  const userMatch = { $or: [{ userId: user._id }, { user: user._id }] };
  let balance = await LeaveBalance.findOne({
    ...userMatch,
    $or: [{ financialYearStart: start }, { year: startYear }],
  });

  if (!balance) {
    balance = await LeaveBalance.findOneAndUpdate(
      {
        ...userMatch,
        $or: [{ financialYearStart: start }, { year: startYear }],
      },
      {
        $setOnInsert: {
          user: user._id,
          userId: user._id,
          year: startYear,
          financialYearStart: start,
          financialYearEnd: end,
          credited: { EL: 0, CL: 0, ML: 0, LWP: 0 },
          used: { EL: 0, CL: 0, ML: 0, LWP: 0 },
          available: { EL: 0, CL: 0, ML: 0, LWP: 0 },
          lastAccruedMonth: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (!balance) {
    throw new Error("Failed to initialize leave balance");
  }

  if (balance && !balance.user) {
    balance.user = user._id;
  }
  if (balance && !balance.userId) {
    balance.userId = user._id;
  }
  if (balance && (balance.year === null || balance.year === undefined)) {
    balance.year = startYear;
  }
  if (balance && Number(balance.year) !== Number(startYear)) {
    balance.year = startYear;
  }
  if (balance && String(balance.financialYearStart || "") !== String(start)) {
    balance.financialYearStart = start;
  }
  if (balance && String(balance.financialYearEnd || "") !== String(end)) {
    balance.financialYearEnd = end;
  }
  balance.credited = ensureBucket(balance.credited);
  balance.used = ensureBucket(balance.used);
  balance.available = ensureBucket(balance.available);

  const accrualStartMonth = getAccrualStartMonth({
    dateOfJoining: user.dateOfJoining,
    financialYearStart: start,
  });

  const accrual = computeMonthlyAccrual({
    // Recompute from cycle start every time so stale historical values can't
    // keep showing old totals (e.g. 12/6/6 when new cycle starts).
    lastAccruedMonth: null,
    accrualStartMonth,
    asOfDate,
  });

  balance.credited.EL = roundHalf(accrual.totalCredit.EL || 0);
  balance.credited.CL = roundHalf(accrual.totalCredit.CL || 0);
  balance.credited.ML = roundHalf(accrual.totalCredit.ML || 0);

  balance.available.EL = roundHalf(Math.max(0, balance.credited.EL - (balance.used.EL || 0)));
  balance.available.CL = roundHalf(Math.max(0, balance.credited.CL - (balance.used.CL || 0)));
  balance.available.ML = roundHalf(Math.max(0, balance.credited.ML - (balance.used.ML || 0)));
  balance.available.LWP = 0;

  balance.lastAccruedMonth = accrual.lastAccruedMonth;
  await balance.save();

  return { balance, user };
};

const applyApprovedLeaveUsage = async ({ request, approverId }) => {
  const { balance } = await ensureLeaveBalanceForUser(request.userId, request.startDate);
  const leaveType = request.leaveType;
  const charge = roundHalf(request.chargedDays);

  if (leaveType !== "LWP") {
    const available = roundHalf(balance.available?.[leaveType] || 0);
    if (available < charge) {
      return { ok: false, message: `Insufficient ${leaveType} balance` };
    }
    balance.used[leaveType] = roundHalf((balance.used[leaveType] || 0) + charge);
    balance.available[leaveType] = roundHalf((balance.available[leaveType] || 0) - charge);
  } else {
    balance.used.LWP = roundHalf((balance.used.LWP || 0) + charge);
  }

  await balance.save();
  request.status = "approved";
  request.reviewedBy = approverId;
  request.reviewedAt = new Date();
  await request.save();
  return { ok: true, balance };
};

export const getMyLeaveSummary = async (req, res) => {
  try {
    const { balance, user } = await ensureLeaveBalanceForUser(req.user._id, new Date());
    const probationEnd = getProbationEndDate(user.dateOfJoining);
    const probationCompleted = probationEnd ? new Date() >= probationEnd : true;
    const pendingCount = await LeaveRequest.countDocuments({
      userId: req.user._id,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      balance: maskPaidLeavesDuringProbation(serializeBalance(balance), probationCompleted),
      stats: {
        pendingRequests: pendingCount,
        probationEndDate: probationEnd,
        probationCompleted,
      },
      config: getLeaveConfig(),
    });
  } catch (error) {
    console.error("getMyLeaveSummary error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave summary" });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "username realName");
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getMyLeaveRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

export const applyLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, startSession, endSession, reason } = req.body || {};
    const normalizedType = String(leaveType || "").trim().toUpperCase();
    if (!LEAVE_TYPES.has(normalizedType)) {
      return res.status(400).json({ success: false, message: "Invalid leave type" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Start date and end date are required" });
    }

    const from = startOfDay(startDate);
    const to = startOfDay(endDate);
    if (from > to) {
      return res.status(400).json({ success: false, message: "Start date cannot be after end date" });
    }

    const { APPROVAL_MAX_DAYS } = getLeaveConfig();
    const leaveDays = computeSandwichAndChargeDays({
      startDate: from,
      endDate: to,
      startSession,
      endSession,
    });
    if (leaveDays.invalid) {
      return res.status(400).json({
        success: false,
        message: leaveDays.message || "Invalid half-day combination",
      });
    }
    if (leaveDays.chargedDays > APPROVAL_MAX_DAYS) {
      return res.status(400).json({
        success: false,
        message: `Max ${APPROVAL_MAX_DAYS} leave days allowed in one request`,
      });
    }

    const { balance, user } = await ensureLeaveBalanceForUser(req.user._id, from);

    if (normalizedType !== "LWP") {
      const paidAllowed = canUsePaidLeave({
        dateOfJoining: user.dateOfJoining,
        leaveStartDate: from,
      });
      if (!paidAllowed) {
        return res.status(400).json({
          success: false,
          message: "Paid leave is not allowed during first 90 days from joining",
        });
      }
      const available = roundHalf(balance.available?.[normalizedType] || 0);
      if (available < leaveDays.chargedDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${normalizedType} balance`,
        });
      }
    }

    const overlap = await LeaveRequest.findOne({
      userId: req.user._id,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: to },
      endDate: { $gte: from },
    }).lean();
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Overlapping leave request already exists",
      });
    }

    const { start } = getFinancialYearBounds(from);
    const requestDoc = await LeaveRequest.create({
      userId: req.user._id,
      financialYearStart: start,
      leaveType: normalizedType,
      startSession: startSession || "full",
      endSession: endSession || "full",
      startDate: from,
      endDate: to,
      requestedDays: leaveDays.chargedDays,
      sandwichDays: leaveDays.sandwichDays,
      chargedDays: leaveDays.chargedDays,
      reason: String(reason || "").trim(),
      status: "pending",
    });

    return res.status(201).json({ success: true, request: requestDoc });
  } catch (error) {
    console.error("applyLeaveRequest error:", error);
    return res.status(500).json({ success: false, message: "Failed to apply leave" });
  }
};

export const getAdminLeaveRequests = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can access" });
    }

    const { status = "pending", search = "" } = req.query || {};
    const query = {};
    if (status && status !== "all") query.status = status;

    let userFilterIds = null;
    const normalizedSearch = String(search || "").trim();
    if (normalizedSearch) {
      const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const users = await User.find({
        $or: [{ username: regex }, { realName: regex }, { empId: regex }],
      })
        .select("_id")
        .lean();
      userFilterIds = users.map((u) => u._id);
      if (!userFilterIds.length) {
        return res.status(200).json({ success: true, requests: [] });
      }
      query.userId = { $in: userFilterIds };
    }

    const requests = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "username realName empId department dateOfJoining")
      .populate("reviewedBy", "username realName");

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getAdminLeaveRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

export const reviewLeaveRequest = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can review" });
    }

    const requestId = req.params.id;
    const { action, comment } = req.body || {};
    const normalizedAction = String(action || "").trim().toLowerCase();
    if (!["approve", "reject"].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: "Action must be approve or reject" });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }
    if (leaveRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending request can be reviewed" });
    }

    const { APPROVAL_MAX_DAYS } = getLeaveConfig();
    if (leaveRequest.chargedDays > APPROVAL_MAX_DAYS) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve more than ${APPROVAL_MAX_DAYS} days in one request`,
      });
    }

    if (normalizedAction === "reject") {
      leaveRequest.status = "rejected";
      leaveRequest.reviewedBy = req.user._id;
      leaveRequest.reviewedAt = new Date();
      leaveRequest.reviewComment = String(comment || "").trim();
      await leaveRequest.save();
      return res.status(200).json({ success: true, request: leaveRequest });
    }

    const result = await applyApprovedLeaveUsage({
      request: leaveRequest,
      approverId: req.user._id,
    });
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    leaveRequest.reviewComment = String(comment || "").trim();
    await leaveRequest.save();

    return res.status(200).json({
      success: true,
      request: leaveRequest,
      balance: serializeBalance(result.balance),
    });
  } catch (error) {
    console.error("reviewLeaveRequest error:", error);
    return res.status(500).json({ success: false, message: "Failed to review leave request" });
  }
};

export const getAdminLeaveDashboard = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can access" });
    }

    const employees = await User.find({ accountType: "employee" })
      .select("_id username realName empId dateOfJoining department")
      .lean();

    const employeeIds = employees.map((e) => e._id);
    const balances = await Promise.all(employeeIds.map((id) => ensureLeaveBalanceForUser(id, new Date())));
    const balanceMap = new Map(balances.map((b) => [String(b.user._id), b.balance]));

    const pendingCount = await LeaveRequest.countDocuments({ status: "pending" });
    const approvedCount = await LeaveRequest.countDocuments({ status: "approved" });

    const employeeRows = employees.map((emp) => {
      const balance = balanceMap.get(String(emp._id));
      const probationEnd = getProbationEndDate(emp.dateOfJoining);
      const probationCompleted = probationEnd ? new Date() >= probationEnd : true;
      return {
        userId: emp._id,
        name: emp.realName || emp.username,
        username: emp.username,
        empId: emp.empId || "",
        department: emp.department || "",
        dateOfJoining: emp.dateOfJoining || null,
        probationEndDate: probationEnd,
        probationCompleted,
        balance: maskPaidLeavesDuringProbation(serializeBalance(balance), probationCompleted),
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees: employees.length,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount,
      },
      employees: employeeRows,
      config: getLeaveConfig(),
    });
  } catch (error) {
    console.error("getAdminLeaveDashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave dashboard" });
  }
};

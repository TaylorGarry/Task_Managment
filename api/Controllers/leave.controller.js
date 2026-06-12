// import LeaveBalance from "../Modals/LeaveBalance.modal.js";
// import LeaveRequest from "../Modals/LeaveRequest.modal.js";
// import User from "../Modals/User.modal.js";
// import {
//   canUsePaidLeave,
//   computeMonthlyAccrual,
//   computeSandwichAndChargeDays,
//   getAccrualStartMonth,
//   getFinancialYearBounds,
//   getLeaveConfig,
//   getProbationEndDate,
// } from "../utils/leavePolicy.js";

// const ADMIN_ROLES = new Set(["HR", "superAdmin", "admin"]);
// const LEAVE_TYPES = new Set(["EL", "CL", "ML", "LWP"]);

// const roundHalf = (value) => Math.round(Number(value || 0) * 2) / 2;

// const startOfDay = (date) => {
//   if (typeof date === "string") {
//     const m = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
//     if (m) {
//       return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+05:30`);
//     }
//   }
//   const d = new Date(date);
//   return new Date(
//     new Intl.DateTimeFormat("en-CA", {
//       timeZone: "Asia/Kolkata",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     })
//       .format(d)
//       .replace(/\//g, "-") + "T00:00:00+05:30"
//   );
// };

// const isAdminUser = (user) => ADMIN_ROLES.has(user?.accountType);
// const isSuperAdminUser = (user) => user?.accountType === "superAdmin";
// let legacyIndexChecked = false;

// const ensureBucket = (obj = {}) => ({
//   EL: roundHalf(obj?.EL || 0),
//   CL: roundHalf(obj?.CL || 0),
//   ML: roundHalf(obj?.ML || 0),
//   LWP: roundHalf(obj?.LWP || 0),
// });

// const cleanupLegacyLeaveBalanceIndexes = async () => {
//   if (legacyIndexChecked) return;
//   legacyIndexChecked = true;
//   try {
//     const indexes = await LeaveBalance.collection.indexes();
//     const hasLegacyUserUnique = indexes.some(
//       (idx) =>
//         idx?.name === "user_1" &&
//         idx?.unique === true &&
//         idx?.key &&
//         Object.keys(idx.key).length === 1 &&
//         idx.key.user === 1
//     );
//     if (hasLegacyUserUnique) {
//       await LeaveBalance.collection.dropIndex("user_1");
//       console.log("[leave] Dropped legacy unique index user_1 from leavebalances");
//     }

//     const legacyYearIndexByUserId = indexes.find(
//       (idx) =>
//         idx?.unique === true &&
//         idx?.key &&
//         Object.keys(idx.key).length === 2 &&
//         idx.key.userId === 1 &&
//         idx.key.year === 1
//     );
//     if (legacyYearIndexByUserId?.name) {
//       await LeaveBalance.collection.dropIndex(legacyYearIndexByUserId.name);
//       console.log(
//         `[leave] Dropped legacy unique index ${legacyYearIndexByUserId.name} from leavebalances`
//       );
//     }

//     const legacyYearIndexByUser = indexes.find(
//       (idx) =>
//         idx?.unique === true &&
//         idx?.key &&
//         Object.keys(idx.key).length === 2 &&
//         idx.key.user === 1 &&
//         idx.key.year === 1
//     );
//     if (legacyYearIndexByUser?.name) {
//       await LeaveBalance.collection.dropIndex(legacyYearIndexByUser.name);
//       console.log(
//         `[leave] Dropped legacy unique index ${legacyYearIndexByUser.name} from leavebalances`
//       );
//     }
//   } catch (err) {
//     console.error("[leave] Legacy index cleanup skipped:", err?.message || err);
//   }
// };

// const serializeBalance = (balanceDoc) => {
//   if (!balanceDoc) return null;
//   return {
//     credited: balanceDoc.credited || { EL: 0, CL: 0, ML: 0, LWP: 0 },
//     used: balanceDoc.used || { EL: 0, CL: 0, ML: 0, LWP: 0 },
//     available: balanceDoc.available || { EL: 0, CL: 0, ML: 0, LWP: 0 },
//     financialYearStart: balanceDoc.financialYearStart,
//     financialYearEnd: balanceDoc.financialYearEnd,
//     lastAccruedMonth: balanceDoc.lastAccruedMonth,
//   };
// };

// const maskPaidLeavesDuringProbation = (serializedBalance, probationCompleted) => {
//   if (!serializedBalance) return serializedBalance;
//   if (probationCompleted) return serializedBalance;
//   return {
//     ...serializedBalance,
//     credited: {
//       ...(serializedBalance.credited || {}),
//       EL: 0,
//       CL: 0,
//       ML: 0,
//     },
//     available: {
//       ...(serializedBalance.available || {}),
//       EL: 0,
//       CL: 0,
//       ML: 0,
//     },
//   };
// };

// const ensureLeaveBalanceForUser = async (userId, asOfDate = new Date()) => {
//   await cleanupLegacyLeaveBalanceIndexes();
//   const user = await User.findById(userId).select("_id dateOfJoining accountType username").lean();
//   if (!user) throw new Error("User not found");

//   const { start, end } = getFinancialYearBounds(asOfDate);
//   const startYear = start.getFullYear();
//   let balance = await LeaveBalance.findOne({
//     userId: user._id,
//     $or: [{ financialYearStart: start }, { year: startYear }],
//   });

//   if (!balance) {
//     balance = await LeaveBalance.findOne({
//       user: user._id,
//       $or: [{ financialYearStart: start }, { year: startYear }],
//     });
//   }

//   if (!balance) {
//     balance = await LeaveBalance.findOneAndUpdate(
//       {
//         userId: user._id,
//         $or: [{ financialYearStart: start }, { year: startYear }],
//       },
//       {
//         $setOnInsert: {
//           user: user._id,
//           userId: user._id,
//           year: startYear,
//           financialYearStart: start,
//           financialYearEnd: end,
//           credited: { EL: 0, CL: 0, ML: 0, LWP: 0 },
//           used: { EL: 0, CL: 0, ML: 0, LWP: 0 },
//           available: { EL: 0, CL: 0, ML: 0, LWP: 0 },
//           lastAccruedMonth: null,
//         },
//       },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );
//   }

//   if (!balance) {
//     throw new Error("Failed to initialize leave balance");
//   }

//   if (balance && !balance.user) {
//     balance.user = user._id;
//   }
//   if (balance && !balance.userId) {
//     balance.userId = user._id;
//   }
//   if (balance && (balance.year === null || balance.year === undefined)) {
//     balance.year = startYear;
//   }
//   if (balance && Number(balance.year) !== Number(startYear)) {
//     balance.year = startYear;
//   }
//   if (balance && String(balance.financialYearStart || "") !== String(start)) {
//     balance.financialYearStart = start;
//   }
//   if (balance && String(balance.financialYearEnd || "") !== String(end)) {
//     balance.financialYearEnd = end;
//   }
//   balance.credited = ensureBucket(balance.credited);
//   balance.used = ensureBucket(balance.used);
//   balance.available = ensureBucket(balance.available);

//   const accrualStartMonth = getAccrualStartMonth({
//     dateOfJoining: user.dateOfJoining,
//     financialYearStart: start,
//   });  

//   const accrual = computeMonthlyAccrual({
//     // Recompute from cycle start every time so stale historical values can't
//     // keep showing old totals (e.g. 12/6/6 when new cycle starts).
//     lastAccruedMonth: null,
//     accrualStartMonth,
//     asOfDate,
//   });

//   balance.credited.EL = roundHalf(accrual.totalCredit.EL || 0);
//   balance.credited.CL = roundHalf(accrual.totalCredit.CL || 0);
//   balance.credited.ML = roundHalf(accrual.totalCredit.ML || 0);

//   balance.available.EL = roundHalf(Math.max(0, balance.credited.EL - (balance.used.EL || 0)));
//   balance.available.CL = roundHalf(Math.max(0, balance.credited.CL - (balance.used.CL || 0)));
//   balance.available.ML = roundHalf(Math.max(0, balance.credited.ML - (balance.used.ML || 0)));
//   balance.available.LWP = 0;

//   balance.lastAccruedMonth = accrual.lastAccruedMonth;
//   await balance.save();

//   return { balance, user };
// };

// const applyApprovedLeaveUsage = async ({ request, approverId }) => {
//   const { balance } = await ensureLeaveBalanceForUser(request.userId, request.startDate);
//   const leaveType = request.leaveType;
//   const charge = roundHalf(request.chargedDays);

//   if (leaveType !== "LWP") {
//     const available = roundHalf(balance.available?.[leaveType] || 0);
//     if (available < charge) {
//       return { ok: false, message: `Insufficient ${leaveType} balance` };
//     }
//     balance.used[leaveType] = roundHalf((balance.used[leaveType] || 0) + charge);
//     balance.available[leaveType] = roundHalf((balance.available[leaveType] || 0) - charge);
//   } else {
//     balance.used.LWP = roundHalf((balance.used.LWP || 0) + charge);
//   }

//   await balance.save();
//   request.status = "approved";
//   request.reviewedBy = approverId;
//   request.reviewedAt = new Date();
//   await request.save();
//   return { ok: true, balance };
// };

// const revertApprovedLeaveUsage = async ({ request }) => {
//   const { balance } = await ensureLeaveBalanceForUser(request.userId, request.startDate);
//   const leaveType = request.leaveType;
//   const charge = roundHalf(request.chargedDays);

//   if (leaveType !== "LWP") {
//     balance.used[leaveType] = roundHalf(Math.max(0, (balance.used?.[leaveType] || 0) - charge));
//     balance.available[leaveType] = roundHalf(
//       Math.max(0, (balance.credited?.[leaveType] || 0) - (balance.used?.[leaveType] || 0))
//     );
//   } else {
//     balance.used.LWP = roundHalf(Math.max(0, (balance.used?.LWP || 0) - charge));
//   }

//   await balance.save();
//   return { ok: true, balance };
// };

// export const getMyLeaveSummary = async (req, res) => {
//   try {
//     const { balance, user } = await ensureLeaveBalanceForUser(req.user._id, new Date());
//     const probationEnd = getProbationEndDate(user.dateOfJoining);
//     const probationCompleted = probationEnd ? new Date() >= probationEnd : true;
//     const pendingCount = await LeaveRequest.countDocuments({
//       userId: req.user._id,
//       status: "pending",
//     });

//     return res.status(200).json({
//       success: true,
//       balance: maskPaidLeavesDuringProbation(serializeBalance(balance), probationCompleted),
//       stats: {
//         pendingRequests: pendingCount,
//         probationEndDate: probationEnd,
//         probationCompleted,
//       },
//       config: getLeaveConfig(),
//     });
//   } catch (error) {
//     console.error("getMyLeaveSummary error:", error);
//     return res.status(500).json({ success: false, message: "Failed to fetch leave summary" });
//   }
// };

// export const getMyLeaveRequests = async (req, res) => {
//   try {
//     const requests = await LeaveRequest.find({ userId: req.user._id })
//       .sort({ createdAt: -1 })
//       .populate("reviewedBy", "username pseudoName realName");
//     return res.status(200).json({ success: true, requests });
//   } catch (error) {
//     console.error("getMyLeaveRequests error:", error);
//     return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
//   }
// };

// export const applyLeaveRequest = async (req, res) => {
//   try {
//     const { leaveType, startDate, endDate, startSession, endSession, reason } = req.body || {};
//     const normalizedType = String(leaveType || "").trim().toUpperCase();
//     if (!LEAVE_TYPES.has(normalizedType)) {
//       return res.status(400).json({ success: false, message: "Invalid leave type" });
//     }
//     if (!startDate || !endDate) {
//       return res.status(400).json({ success: false, message: "Start date and end date are required" });
//     }

//     const from = startOfDay(startDate);
//     const to = startOfDay(endDate);
//     if (from > to) {
//       return res.status(400).json({ success: false, message: "Start date cannot be after end date" });
//     }

//     const { APPROVAL_MAX_DAYS } = getLeaveConfig();
//     const leaveDays = computeSandwichAndChargeDays({
//       startDate: from,
//       endDate: to,
//       startSession,
//       endSession,
//     });
//     if (leaveDays.invalid) {
//       return res.status(400).json({
//         success: false,
//         message: leaveDays.message || "Invalid half-day combination",
//       });
//     }
//     if (leaveDays.chargedDays > APPROVAL_MAX_DAYS) {
//       return res.status(400).json({
//         success: false,
//         message: `Max ${APPROVAL_MAX_DAYS} leave days allowed in one request`,
//       });
//     }

//     const applicantRemark = String(reason || "").trim();
//     if (applicantRemark.length < 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a clear leave reason",
//       });
//     }

//     const { balance, user } = await ensureLeaveBalanceForUser(req.user._id, from);

//     if (normalizedType !== "LWP") {
//       const paidAllowed = canUsePaidLeave({
//         dateOfJoining: user.dateOfJoining,
//         leaveStartDate: from,
//       });
//       if (!paidAllowed) {
//         return res.status(400).json({
//           success: false,
//           message: "Paid leave is not allowed during first 90 days from joining",
//         });
//       }
//       const available = roundHalf(balance.available?.[normalizedType] || 0);
//       if (available < leaveDays.chargedDays) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient ${normalizedType} balance`,
//         });
//       }
//     }

//     const overlap = await LeaveRequest.findOne({
//       userId: req.user._id,
//       status: { $in: ["pending", "approved"] },
//       startDate: { $lte: to },
//       endDate: { $gte: from },
//     }).lean();
//     if (overlap) {
//       return res.status(400).json({
//         success: false,
//         message: "Overlapping leave request already exists",
//       });
//     }

//     const { start } = getFinancialYearBounds(from);
//     const requestDoc = await LeaveRequest.create({
//       userId: req.user._id,
//       financialYearStart: start,
//       leaveType: normalizedType,
//       startSession: startSession || "full",
//       endSession: endSession || "full",
//       startDate: from,
//       endDate: to,
//       requestedDays: leaveDays.chargedDays,
//       sandwichDays: leaveDays.sandwichDays,
//       chargedDays: leaveDays.chargedDays,
//       reason: applicantRemark,
//       status: "pending",
//       reviewTrail: [
//         {
//           action: "applied",
//           remark: applicantRemark,
//           actorId: req.user._id,
//           actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
//           at: new Date(),
//         },
//       ],
//     });

//     return res.status(201).json({ success: true, request: requestDoc });
//   } catch (error) {
//     console.error("applyLeaveRequest error:", error);
//     return res.status(500).json({ success: false, message: "Failed to apply leave" });
//   }
// };

// export const getAdminLeaveRequests = async (req, res) => {
//   try {
//     if (!isAdminUser(req.user)) {
//       return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can access" });
//     }

//     const { status = "pending", search = "" } = req.query || {};
//     const query = {};
//     if (status && status !== "all") query.status = status;

//     let userFilterIds = null;
//     const normalizedSearch = String(search || "").trim();
//     if (normalizedSearch) {
//       const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
//       const users = await User.find({
//         $or: [{ username: regex }, { pseudoName: regex }, { realName: regex }, { empId: regex }],
//       })
//         .select("_id")
//         .lean();
//       userFilterIds = users.map((u) => u._id);
//       if (!userFilterIds.length) {
//         return res.status(200).json({ success: true, requests: [] });
//       }
//       query.userId = { $in: userFilterIds };
//     }

//     const requests = await LeaveRequest.find(query)
//       .sort({ createdAt: -1 })
//       .populate("userId", "username pseudoName realName empId department dateOfJoining")
//       .populate("reviewedBy", "username pseudoName realName");

//     return res.status(200).json({ success: true, requests });
//   } catch (error) {
//     console.error("getAdminLeaveRequests error:", error);
//     return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
//   }
// };

// export const reviewLeaveRequest = async (req, res) => {
//   try {
//     if (!isAdminUser(req.user)) {
//       return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can review" });
//     }

//     const requestId = req.params.id;
//     const { action, comment } = req.body || {};
//     const normalizedAction = String(action || "").trim().toLowerCase();
//     const reviewRemark = String(comment || "").trim();
//     if (!["approve", "reject", "reset"].includes(normalizedAction)) {
//       return res.status(400).json({ success: false, message: "Action must be approve, reject or reset" });
//     }
//     if (normalizedAction !== "reset" && reviewRemark.length < 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Please add a clear remark for approving/rejecting (minimum 5 characters)",
//       });
//     }

//     const leaveRequest = await LeaveRequest.findById(requestId);
//     if (!leaveRequest) {
//       return res.status(404).json({ success: false, message: "Leave request not found" });
//     }
//     if (normalizedAction === "reset") {
//       if (!isSuperAdminUser(req.user)) {
//         return res.status(403).json({ success: false, message: "Only superAdmin can reset reviewed requests" });
//       }
//       if (!["approved", "rejected"].includes(leaveRequest.status)) {
//         return res.status(400).json({ success: false, message: "Only approved or rejected requests can be reset" });
//       }

//       const targetStatus = leaveRequest.status === "approved" ? "rejected" : "approved";
//       let balance = null;
//       if (leaveRequest.status === "approved") {
//         const resetResult = await revertApprovedLeaveUsage({ request: leaveRequest });
//         if (!resetResult.ok) {
//           return res.status(400).json({ success: false, message: resetResult.message || "Failed to reset leave usage" });
//         }
//         balance = resetResult.balance;
//         leaveRequest.status = "rejected";
//         leaveRequest.reviewedBy = req.user._id;
//         leaveRequest.reviewedAt = new Date();
//       } else {
//         const approveResult = await applyApprovedLeaveUsage({
//           request: leaveRequest,
//           approverId: req.user._id,
//         });
//         if (!approveResult.ok) {
//           return res.status(400).json({ success: false, message: approveResult.message || "Failed to approve leave usage" });
//         }
//         balance = approveResult.balance;
//       }
//       leaveRequest.reviewTrail = [
//         ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
//         {
//           action: "reset",
//           remark: reviewRemark,
//           actorId: req.user._id,
//           actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
//           at: new Date(),
//         },
//       ];
//       await leaveRequest.save();

//       return res.status(200).json({
//         success: true,
//         message: `Leave request moved to ${targetStatus}`,
//         request: leaveRequest,
//         balance: balance ? serializeBalance(balance) : undefined,
//       });
//     }
//     if (leaveRequest.status !== "pending") {
//       return res.status(400).json({ success: false, message: "Only pending request can be reviewed" });
//     }

//     const { APPROVAL_MAX_DAYS } = getLeaveConfig();
//     if (leaveRequest.chargedDays > APPROVAL_MAX_DAYS) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot approve more than ${APPROVAL_MAX_DAYS} days in one request`,
//       });
//     }

//     if (normalizedAction === "reject") {
//       leaveRequest.status = "rejected";
//       leaveRequest.reviewedBy = req.user._id;
//       leaveRequest.reviewedAt = new Date();
//       leaveRequest.reviewComment = reviewRemark;
//       leaveRequest.reviewTrail = [
//         ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
//         {
//           action: "rejected",
//           remark: reviewRemark,
//           actorId: req.user._id,
//           actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
//           at: new Date(),
//         },
//       ];
//       await leaveRequest.save();
//       return res.status(200).json({ success: true, message: "Leave request rejected", request: leaveRequest });
//     }

//     const result = await applyApprovedLeaveUsage({
//       request: leaveRequest,
//       approverId: req.user._id,
//     });
//     if (!result.ok) {
//       return res.status(400).json({ success: false, message: result.message });
//     }
//     leaveRequest.reviewComment = reviewRemark;
//     leaveRequest.reviewTrail = [
//       ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
//       {
//         action: "approved",
//         remark: reviewRemark,
//         actorId: req.user._id,
//         actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
//         at: new Date(),
//       },
//     ];
//     await leaveRequest.save();

//     return res.status(200).json({
//       success: true,
//       message: "Leave request approved",
//       request: leaveRequest,
//       balance: serializeBalance(result.balance),
//     });
//   } catch (error) {
//     console.error("reviewLeaveRequest error:", error);
//     return res.status(500).json({ success: false, message: "Failed to review leave request" });
//   }
// };

// export const getAdminLeaveDashboard = async (req, res) => {
//   try {
//     if (!isAdminUser(req.user)) {
//       return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin can access" });
//     }

//     const employees = await User.find({ accountType: "employee" })
//       .select("_id username pseudoName realName empId dateOfJoining department")
//       .lean();

//     const employeeIds = employees.map((e) => e._id);
//     const balances = await Promise.all(employeeIds.map((id) => ensureLeaveBalanceForUser(id, new Date())));
//     const balanceMap = new Map(balances.map((b) => [String(b.user._id), b.balance]));

//     const pendingCount = await LeaveRequest.countDocuments({ status: "pending" });
//     const approvedCount = await LeaveRequest.countDocuments({ status: "approved" });

//     const employeeRows = employees.map((emp) => {
//       const balance = balanceMap.get(String(emp._id));
//       const probationEnd = getProbationEndDate(emp.dateOfJoining);
//       const probationCompleted = probationEnd ? new Date() >= probationEnd : true;
//       return {
//         userId: emp._id,
//         name: emp.pseudoName || emp.username,
//         username: emp.username,
//         empId: emp.empId || "",
//         department: emp.department || "",
//         dateOfJoining: emp.dateOfJoining || null,
//         probationEndDate: probationEnd,
//         probationCompleted,
//         balance: maskPaidLeavesDuringProbation(serializeBalance(balance), probationCompleted),
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       stats: {
//         totalEmployees: employees.length,
//         pendingRequests: pendingCount,
//         approvedRequests: approvedCount,
//       },
//       employees: employeeRows,
//       config: getLeaveConfig(),
//     });
//   } catch (error) {
//     console.error("getAdminLeaveDashboard error:", error);
//     return res.status(500).json({ success: false, message: "Failed to fetch leave dashboard" });
//   }
// };




import LeaveBalance from "../Modals/LeaveBalance.modal.js";
import LeaveRequest from "../Modals/LeaveRequest.modal.js";
import User from "../Modals/User.modal.js";
import { getTeamMembersByTeamLeader } from "../utils/teamHelper.js";
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
const LEAVE_TYPES = new Set(["BL", "L", "LWP"]);
const PAID_LEAVE_TYPES = new Set(["BL", "L", "EL", "CL", "ML"]);
const JULY_2026_MONTH_START = new Date("2026-07-01T00:00:00+05:30");

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
const isSuperAdminUser = (user) => user?.accountType === "superAdmin";
const canViewTeamLeaveBalances = (user) =>
  isAdminUser(user) || user?.roleType === "supervisor" || Boolean(user?.isTeamLeader);
let legacyIndexChecked = false;

const ensureBucket = (obj = {}) => ({
  EL: roundHalf(obj?.EL || 0),
  CL: roundHalf(obj?.CL || 0),
  ML: roundHalf(obj?.ML || 0),
  LWP: roundHalf(obj?.LWP || 0),
});

const getLegacyPaidTotal = (bucket = {}) =>
  roundHalf((bucket?.EL || 0) + (bucket?.CL || 0) + (bucket?.ML || 0));

const syncCurrentBalanceFields = (balance) => {
  if (!balance) return;

  const legacyCredited = getLegacyPaidTotal(balance.credited);
  const legacyUsed = getLegacyPaidTotal(balance.used);
  const legacyAvailable = getLegacyPaidTotal(balance.available);

  if (
    roundHalf(balance.currentCredited || 0) <= 0 &&
    roundHalf(balance.currentUsed || 0) <= 0 &&
    roundHalf(balance.currentAvailable || 0) <= 0 &&
    legacyCredited > 0
  ) {
    balance.currentCredited = legacyCredited;
    balance.currentUsed = legacyUsed;
    balance.currentAvailable = legacyAvailable;
  }

  balance.currentCredited = roundHalf(balance.currentCredited || 0);
  balance.currentUsed = roundHalf(balance.currentUsed || 0);
  balance.currentAvailable = roundHalf(Math.max(0, balance.currentCredited - balance.currentUsed));
};

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
  const legacyAvailable = getLegacyPaidTotal(balanceDoc.available);
  const currentLeaveBalance = roundHalf(
    balanceDoc.currentAvailable > 0 || legacyAvailable === 0 ? balanceDoc.currentAvailable || 0 : legacyAvailable
  );
  return {
    credited: balanceDoc.credited || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    used: balanceDoc.used || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    available: balanceDoc.available || { EL: 0, CL: 0, ML: 0, LWP: 0 },
    currentCredited: roundHalf(balanceDoc.currentCredited || 0),
    currentUsed: roundHalf(balanceDoc.currentUsed || 0),
    currentAvailable: currentLeaveBalance,
    currentLeaveBalance,
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
    currentCredited: 0,
    currentUsed: 0,
    currentAvailable: 0,
    currentLeaveBalance: 0,
  };
};

const ensureLeaveBalanceForUser = async (userId, asOfDate = new Date()) => {
  await cleanupLegacyLeaveBalanceIndexes();
  const user = await User.findById(userId).select("_id dateOfJoining accountType username").lean();
  if (!user) throw new Error("User not found");

  const { start, end } = getFinancialYearBounds(asOfDate);
  const startYear = start.getFullYear();
  let balance = await LeaveBalance.findOne({
    userId: user._id,
    $or: [{ financialYearStart: start }, { year: startYear }],
  });

  if (!balance) {
    balance = await LeaveBalance.findOne({
      user: user._id,
      $or: [{ financialYearStart: start }, { year: startYear }],
    });
  }

  if (!balance) {
    balance = await LeaveBalance.findOneAndUpdate(
      {
        userId: user._id,
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
          currentCredited: 0,
          currentUsed: 0,
          currentAvailable: 0,
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
  syncCurrentBalanceFields(balance);

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

  balance.currentCredited = roundHalf(accrual.totalCredit || 0);
  balance.currentAvailable = roundHalf(Math.max(0, balance.currentCredited - (balance.currentUsed || 0)));
  balance.available.LWP = 0;

  balance.lastAccruedMonth = accrual.lastAccruedMonth;
  await balance.save();

  return { balance, user };
};

const applyApprovedLeaveUsage = async ({ request, approverId }) => {
  const { balance } = await ensureLeaveBalanceForUser(request.userId, request.startDate);
  const leaveType = request.leaveType;
  const charge = roundHalf(request.chargedDays);

  if (PAID_LEAVE_TYPES.has(leaveType)) {
    const available = roundHalf(balance.currentAvailable || 0);
    if (available < charge) {
      return { ok: false, message: "Insufficient current leave balance" };
    }
    balance.currentUsed = roundHalf((balance.currentUsed || 0) + charge);
    balance.currentAvailable = roundHalf(Math.max(0, (balance.currentCredited || 0) - balance.currentUsed));
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

const revertApprovedLeaveUsage = async ({ request }) => {
  const { balance } = await ensureLeaveBalanceForUser(request.userId, request.startDate);
  const leaveType = request.leaveType;
  const charge = roundHalf(request.chargedDays);

  if (PAID_LEAVE_TYPES.has(leaveType)) {
    balance.currentUsed = roundHalf(Math.max(0, (balance.currentUsed || 0) - charge));
    balance.currentAvailable = roundHalf(Math.max(0, (balance.currentCredited || 0) - balance.currentUsed));
  } else {
    balance.used.LWP = roundHalf(Math.max(0, (balance.used?.LWP || 0) - charge));
  }

  await balance.save();
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
      currentLeaveBalance: maskPaidLeavesDuringProbation(serializeBalance(balance), probationCompleted)?.currentLeaveBalance || 0,
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
      .populate("reviewedBy", "username pseudoName realName");
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

    const applicantRemark = String(reason || "").trim();
    if (applicantRemark.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a clear leave reason",
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
      const available = roundHalf(balance.currentAvailable || 0);
      if (available < leaveDays.chargedDays) {
        return res.status(400).json({
          success: false,
          message: "Insufficient current leave balance",
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
      reason: applicantRemark,
      status: "pending",
      reviewTrail: [
        {
          action: "applied",
          remark: applicantRemark,
          actorId: req.user._id,
          actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
          at: new Date(),
        },
      ],
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
        $or: [{ username: regex }, { pseudoName: regex }, { realName: regex }, { empId: regex }],
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
      .populate("userId", "username pseudoName realName empId department dateOfJoining")
      .populate("reviewedBy", "username pseudoName realName");

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
    const reviewRemark = String(comment || "").trim();
    if (!["approve", "reject", "reset"].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: "Action must be approve, reject or reset" });
    }
    if (normalizedAction !== "reset" && reviewRemark.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please add a clear remark for approving/rejecting (minimum 5 characters)",
      });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }
    if (normalizedAction === "reset") {
      if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ success: false, message: "Only superAdmin can reset reviewed requests" });
      }
      if (!["approved", "rejected"].includes(leaveRequest.status)) {
        return res.status(400).json({ success: false, message: "Only approved or rejected requests can be reset" });
      }

      const targetStatus = leaveRequest.status === "approved" ? "rejected" : "approved";
      let balance = null;
      if (leaveRequest.status === "approved") {
        const resetResult = await revertApprovedLeaveUsage({ request: leaveRequest });
        if (!resetResult.ok) {
          return res.status(400).json({ success: false, message: resetResult.message || "Failed to reset leave usage" });
        }
        balance = resetResult.balance;
        leaveRequest.status = "rejected";
        leaveRequest.reviewedBy = req.user._id;
        leaveRequest.reviewedAt = new Date();
      } else {
        const approveResult = await applyApprovedLeaveUsage({
          request: leaveRequest,
          approverId: req.user._id,
        });
        if (!approveResult.ok) {
          return res.status(400).json({ success: false, message: approveResult.message || "Failed to approve leave usage" });
        }
        balance = approveResult.balance;
      }
      leaveRequest.reviewTrail = [
        ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
        {
          action: "reset",
          remark: reviewRemark,
          actorId: req.user._id,
          actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
          at: new Date(),
        },
      ];
      await leaveRequest.save();

      return res.status(200).json({
        success: true,
        message: `Leave request moved to ${targetStatus}`,
        request: leaveRequest,
        balance: balance ? serializeBalance(balance) : undefined,
      });
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
      leaveRequest.reviewComment = reviewRemark;
      leaveRequest.reviewTrail = [
        ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
        {
          action: "rejected",
          remark: reviewRemark,
          actorId: req.user._id,
          actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
          at: new Date(),
        },
      ];
      await leaveRequest.save();
      return res.status(200).json({ success: true, message: "Leave request rejected", request: leaveRequest });
    }

    const result = await applyApprovedLeaveUsage({
      request: leaveRequest,
      approverId: req.user._id,
    });
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    leaveRequest.reviewComment = reviewRemark;
    leaveRequest.reviewTrail = [
      ...(Array.isArray(leaveRequest.reviewTrail) ? leaveRequest.reviewTrail : []),
      {
        action: "approved",
        remark: reviewRemark,
        actorId: req.user._id,
        actorName: req.user?.pseudoName || req.user?.realName || req.user?.username || "",
        at: new Date(),
      },
    ];
    await leaveRequest.save();

    return res.status(200).json({
      success: true,
      message: "Leave request approved",
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
    if (!canViewTeamLeaveBalances(req.user)) {
      return res.status(403).json({ success: false, message: "Only HR/superAdmin/admin/team leaders can access" });
    }

    const isManagementUser = isAdminUser(req.user);
    const teamMembers = isManagementUser ? [] : await getTeamMembersByTeamLeader(req.user._id, new Date());
    const teamMemberIds = teamMembers.map((member) => member?.userId).filter(Boolean);
    const employees = isManagementUser
      ? await User.find({ accountType: "employee" })
          .select("_id username pseudoName realName empId dateOfJoining department")
          .lean()
      : teamMemberIds.length
        ? await User.find({ _id: { $in: teamMemberIds } })
            .select("_id username pseudoName realName empId dateOfJoining department")
            .lean()
        : [];

    const employeeIds = employees.map((e) => e._id);
    const balanceDocs = employeeIds.length
      ? await LeaveBalance.find({
          userId: { $in: employeeIds },
        })
          .select("userId credited used available currentCredited currentUsed currentAvailable financialYearStart financialYearEnd lastAccruedMonth")
          .lean()
      : [];
    const balanceMap = new Map(balanceDocs.map((doc) => [String(doc.userId), serializeBalance(doc)]));
    const missingEmployeeIds = employeeIds.filter((id) => !balanceMap.has(String(id)));
    if (missingEmployeeIds.length) {
      const fallbackBalances = await Promise.all(
        missingEmployeeIds.map((id) => ensureLeaveBalanceForUser(id, new Date()))
      );
      for (const item of fallbackBalances) {
        balanceMap.set(String(item.user._id), serializeBalance(item.balance));
      }
    }

    const pendingCount = isManagementUser ? await LeaveRequest.countDocuments({ status: "pending" }) : 0;
    const approvedCount = isManagementUser ? await LeaveRequest.countDocuments({ status: "approved" }) : 0;

    const employeeRows = employees.map((emp) => {
      const balance = balanceMap.get(String(emp._id));
      const probationEnd = getProbationEndDate(emp.dateOfJoining);
      const probationCompleted = probationEnd ? new Date() >= probationEnd : true;
      const serializedBalance = maskPaidLeavesDuringProbation(balance, probationCompleted);
      return {
        userId: emp._id,
        name: emp.pseudoName || emp.username,
        username: emp.username,
        empId: emp.empId || "",
        department: emp.department || "",
        dateOfJoining: emp.dateOfJoining || null,
        probationEndDate: probationEnd,
        probationCompleted,
        balance: serializedBalance,
        currentLeaveBalance: serializedBalance?.currentLeaveBalance || 0,
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

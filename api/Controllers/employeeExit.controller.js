import mongoose from "mongoose";
import User from "../Modals/User.modal.js";
import EmployeeExit from "../Modals/EmployeeExit.modal.js";
import EmployeeExitITChecklist from "../Modals/EmployeeExitITChecklist.modal.js";
import EmployeeExitHRChecklist from "../Modals/EmployeeExitHRChecklist.modal.js";
import EmployeeExitAccountsChecklist from "../Modals/EmployeeExitAccountsChecklist.modal.js";
import EmployeeExitAuditLog from "../Modals/EmployeeExitAuditLog.modal.js";
import {
  ACTIVE_EXIT_STATUSES,
  EXIT_STATUS,
  addExitAuditLog,
  buildExitListQueryForUser,
  completeExitRecord,
  escapeRegex,
  getActorDepartment,
  isAccountsUser,
  isExitPrivilegedUser,
  isHrUser,
  isItUser,
  isSuperAdminUser,
  notifyExitAudience,
  resolveUserName,
  shouldCompleteExitNow,
} from "../services/employeeExit.service.js";

const EXIT_LIST_SELECT =
  "_id employeeId resignationDate lastWorkingDate reason exitType remarks status initiatedBy itVerifiedBy hrVerifiedBy accountsVerifiedBy approvedBy revokedBy revokedAt exitCompletedAt createdAt updatedAt";
const USER_SELECT = "username realName pseudoName empId department accountType isActive active employmentStatus";
const EMPLOYEE_EXIT_TYPES = ["voluntary", "involuntary"];
const EMPLOYEE_EXIT_REASONS_BY_TYPE = {
  voluntary: [
    "Career change",
    "Relocation",
    "Higher studies",
    "Personal/family reasons",
    "Better opportunity elsewhere",
  ],
  involuntary: [
    "Absconding",
    "Performance-Based Termination",
    "Disciplinary Termination",
    "Training Failure",
  ],
};

const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const jsonOk = (res, message, data = {}, status = 200) =>
  res.status(status).json({ success: true, message, data });

const jsonError = (res, status, message) =>
  res.status(status).json({ success: false, message, data: null });

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const cleanString = (value = "") => String(value || "").trim();

const getExitByIdForUser = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const query = buildExitListQueryForUser(user, { _id: id });
  return EmployeeExit.findOne(query)
    .select(EXIT_LIST_SELECT)
    .populate("employeeId", USER_SELECT)
    .populate("initiatedBy", "username realName pseudoName")
    .populate("itVerifiedBy", "username realName pseudoName")
    .populate("hrVerifiedBy", "username realName pseudoName")
    .populate("accountsVerifiedBy", "username realName pseudoName")
    .populate("approvedBy", "username realName pseudoName")
    .populate("revokedBy", "username realName pseudoName")
    .lean();
};

export const initiateEmployeeExit = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isHrUser(req.user)) {
      return jsonError(res, 403, "Only HR can initiate employee exits");
    }

    const employeeId = cleanString(req.body?.employeeId);
    const exitType = cleanString(req.body?.exitType || "voluntary").toLowerCase();
    const resignationDate = toDate(req.body?.resignationDate);
    const lastWorkingDate = toDate(req.body?.lastWorkingDate);
    const reason = cleanString(req.body?.reason);
    const remarks = cleanString(req.body?.remarks);

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return jsonError(res, 400, "Valid employeeId is required");
    }
    if (!resignationDate || !lastWorkingDate) {
      return jsonError(res, 400, "Resignation date and last working date are required");
    }
    if (lastWorkingDate < resignationDate) {
      return jsonError(res, 400, "Last working date cannot be before resignation date");
    }
    if (!EMPLOYEE_EXIT_TYPES.includes(exitType)) {
      return jsonError(res, 400, "Valid exit type is required");
    }
    if (!EMPLOYEE_EXIT_REASONS_BY_TYPE[exitType].includes(reason)) {
      return jsonError(res, 400, "Valid policy reason is required for selected exit type");
    }

    let createdExit = null;

    await session.withTransaction(async () => {
      const employee = await User.findById(employeeId)
        .select(`${USER_SELECT} username`)
        .session(session);
      if (!employee) {
        throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
      }
      if (String(employee.accountType || "") === "superAdmin") {
        throw Object.assign(new Error("SuperAdmin cannot be exited through this workflow"), { statusCode: 400 });
      }

      const existingExit = await EmployeeExit.findOne({
        employeeId,
        status: { $in: ACTIVE_EXIT_STATUSES },
      })
        .select("_id status")
        .session(session)
        .lean();
      if (existingExit) {
        throw Object.assign(new Error("Exit process has already been initialized for this employee"), {
          statusCode: 409,
        });
      }

      const docs = await EmployeeExit.create(
        [
          {
            employeeId,
            resignationDate,
            lastWorkingDate,
            reason,
            exitType,
            remarks,
            status: EXIT_STATUS.IT_PENDING,
            initiatedBy: req.user._id,
          },
        ],
        { session }
      );
      createdExit = docs[0];

      await addExitAuditLog({
        exitId: createdExit._id,
        action: "Exit initiated",
        oldStatus: "",
        newStatus: EXIT_STATUS.NOTICE_PERIOD,
        performedBy: req.user._id,
        department: getActorDepartment(req.user),
        remarks,
        session,
      });

      await addExitAuditLog({
        exitId: createdExit._id,
        action: "IT verification pending",
        oldStatus: EXIT_STATUS.NOTICE_PERIOD,
        newStatus: EXIT_STATUS.IT_PENDING,
        performedBy: req.user._id,
        department: getActorDepartment(req.user),
        remarks: "Exit sent to IT for asset and access clearance",
        session,
      });

      await notifyExitAudience({
        audience: ["IT", "SuperAdmin"],
        exitId: createdExit._id,
        actor: req.user,
        title: "Employee exit initiated",
        message: `${resolveUserName(employee)} is pending IT clearance.`,
        io: req.io,
        session,
      });
    });

    const exitData = await getExitByIdForUser(createdExit._id, req.user);
    return jsonOk(res, "Employee exit initiated", exitData, 201);
  } catch (error) {
    console.error("initiateEmployeeExit error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to initiate employee exit");
  } finally {
    session.endSession();
  }
};

export const getEmployeeExits = async (req, res) => {
  try {
    if (!isExitPrivilegedUser(req.user)) {
      return jsonError(res, 403, "You do not have access to employee exits");
    }

    const { page, limit, skip } = parsePagination(req.query);
    const baseQuery = {};
    const status = cleanString(req.query?.status);
    if (status && status !== "all") baseQuery.status = status;

    const search = cleanString(req.query?.search);
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const users = await User.find({
        $or: [{ username: regex }, { realName: regex }, { pseudoName: regex }, { empId: regex }],
      })
        .select("_id")
        .lean();
      const ids = users.map((user) => user._id);
      if (!ids.length) {
        return jsonOk(res, "Employee exits fetched", {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        });
      }
      baseQuery.employeeId = { $in: ids };
    }

    const query = buildExitListQueryForUser(req.user, baseQuery);
    const [items, total] = await Promise.all([
      EmployeeExit.find(query)
        .select(EXIT_LIST_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("employeeId", USER_SELECT)
        .populate("initiatedBy", "username realName pseudoName")
        .lean(),
      EmployeeExit.countDocuments(query),
    ]);

    return jsonOk(res, "Employee exits fetched", {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getEmployeeExits error:", error);
    return jsonError(res, 500, "Failed to fetch employee exits");
  }
};

export const getEmployeeExitById = async (req, res) => {
  try {
    if (!isExitPrivilegedUser(req.user)) {
      return jsonError(res, 403, "You do not have access to employee exits");
    }

    const exit = await getExitByIdForUser(req.params.id, req.user);
    if (!exit) return jsonError(res, 404, "Employee exit not found");

    const [itChecklist, hrChecklist, accountsChecklist] = await Promise.all([
      EmployeeExitITChecklist.findOne({ exitId: exit._id }).lean(),
      EmployeeExitHRChecklist.findOne({ exitId: exit._id }).lean(),
      EmployeeExitAccountsChecklist.findOne({ exitId: exit._id }).lean(),
    ]);

    return jsonOk(res, "Employee exit fetched", {
      exit,
      itChecklist,
      hrChecklist,
      accountsChecklist,
    });
  } catch (error) {
    console.error("getEmployeeExitById error:", error);
    return jsonError(res, 500, "Failed to fetch employee exit");
  }
};

export const submitITClearance = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isItUser(req.user)) {
      return jsonError(res, 403, "Only IT can submit IT clearance");
    }

    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    let updatedExit = null;
    await session.withTransaction(async () => {
      const exit = await EmployeeExit.findOneAndUpdate(
        { _id: exitId, status: EXIT_STATUS.IT_PENDING, itVerifiedBy: null },
        {
          $set: {
            status: EXIT_STATUS.HR_PENDING,
            itVerifiedBy: req.user._id,
          },
        },
        { new: true, session }
      );
      if (!exit) {
        const current = await EmployeeExit.findById(exitId).select("status itVerifiedBy").session(session).lean();
        if (!current) throw Object.assign(new Error("Employee exit not found"), { statusCode: 404 });
        if (current.itVerifiedBy || current.status !== EXIT_STATUS.IT_PENDING) {
          throw Object.assign(new Error("IT clearance is already completed or not currently allowed"), {
            statusCode: 409,
          });
        }
      }
      updatedExit = exit;

      const checklistFields = {
        laptopReturned: Boolean(req.body?.laptopReturned),
        chargerReturned: Boolean(req.body?.chargerReturned),
        idCardReturned: Boolean(req.body?.idCardReturned),
        mouseReturned: Boolean(req.body?.mouseReturned),
        simReturned: Boolean(req.body?.simReturned),
        otherAssetsReturned: Boolean(req.body?.otherAssetsReturned),
        emailDisabled: Boolean(req.body?.emailDisabled),
        crmAccessRemoved: Boolean(req.body?.crmAccessRemoved),
        gatePunchRemoved: Boolean(req.body?.gatePunchRemoved),
        vpnRemoved: Boolean(req.body?.vpnRemoved),
        githubRemoved: Boolean(req.body?.githubRemoved),
        googleWorkspaceRemoved: Boolean(req.body?.googleWorkspaceRemoved),
        slackRemoved: Boolean(req.body?.slackRemoved),
        remarks: cleanString(req.body?.remarks),
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
      };

      await EmployeeExitITChecklist.updateOne(
        { exitId },
        { $setOnInsert: { exitId }, $set: checklistFields },
        { upsert: true, session }
      );

      const logMap = [
        ["laptopReturned", "Laptop returned"],
        ["chargerReturned", "Charger returned"],
        ["idCardReturned", "ID card returned"],
        ["mouseReturned", "Mouse returned"],
        ["simReturned", "SIM returned"],
        ["otherAssetsReturned", "Other assets returned"],
        ["emailDisabled", "Email disabled"],
        ["crmAccessRemoved", "CRM access removed"],
        ["gatePunchRemoved", "Gate punch removed"],
        ["vpnRemoved", "VPN removed"],
        ["githubRemoved", "GitHub access removed"],
        ["googleWorkspaceRemoved", "Google Workspace removed"],
        ["slackRemoved", "Slack access removed"],
      ];

      await addExitAuditLog({
        exitId,
        action: "IT verification started",
        oldStatus: EXIT_STATUS.IT_PENDING,
        newStatus: EXIT_STATUS.IT_PENDING,
        performedBy: req.user._id,
        department: "IT",
        remarks: checklistFields.remarks,
        session,
      });

      for (const [key, action] of logMap) {
        if (checklistFields[key]) {
          await addExitAuditLog({
            exitId,
            action,
            oldStatus: EXIT_STATUS.IT_PENDING,
            newStatus: EXIT_STATUS.IT_PENDING,
            performedBy: req.user._id,
            department: "IT",
            remarks: checklistFields.remarks,
            session,
          });
        }
      }

      await addExitAuditLog({
        exitId,
        action: "IT approved",
        oldStatus: EXIT_STATUS.IT_PENDING,
        newStatus: EXIT_STATUS.HR_PENDING,
        performedBy: req.user._id,
        department: "IT",
        remarks: checklistFields.remarks,
        session,
      });

      await notifyExitAudience({
        audience: ["HR", "SuperAdmin"],
        exitId,
        actor: req.user,
        title: "IT clearance completed",
        message: "Employee exit is now pending HR clearance.",
        io: req.io,
        session,
      });
    });

    const exitData = await getExitByIdForUser(updatedExit._id, req.user);
    return jsonOk(res, "IT clearance submitted", exitData);
  } catch (error) {
    console.error("submitITClearance error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to submit IT clearance");
  } finally {
    session.endSession();
  }
};

export const submitHRClearance = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isHrUser(req.user)) {
      return jsonError(res, 403, "Only HR can submit HR clearance");
    }

    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    let updatedExit = null;
    await session.withTransaction(async () => {
      const exit = await EmployeeExit.findOneAndUpdate(
        { _id: exitId, status: EXIT_STATUS.HR_PENDING, hrVerifiedBy: null, itVerifiedBy: { $ne: null } },
        {
          $set: {
            status: EXIT_STATUS.ACCOUNTS_PENDING,
            hrVerifiedBy: req.user._id,
          },
        },
        { new: true, session }
      );
      if (!exit) {
        const current = await EmployeeExit.findById(exitId)
          .select("status hrVerifiedBy itVerifiedBy")
          .session(session)
          .lean();
        if (!current) throw Object.assign(new Error("Employee exit not found"), { statusCode: 404 });
        if (!current.itVerifiedBy) {
          throw Object.assign(new Error("HR cannot approve before IT clearance"), { statusCode: 409 });
        }
        throw Object.assign(new Error("HR clearance is already completed or not currently allowed"), {
          statusCode: 409,
        });
      }
      updatedExit = exit;

      const checklistFields = {
        exitInterviewDone: Boolean(req.body?.exitInterviewDone),
        leaveAdjusted: Boolean(req.body?.leaveAdjusted),
        experienceLetterIssued: Boolean(req.body?.experienceLetterIssued),
        relievingLetterIssued: Boolean(req.body?.relievingLetterIssued),
        documentsUploaded: Boolean(req.body?.documentsUploaded),
        remarks: cleanString(req.body?.remarks),
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
      };

      await EmployeeExitHRChecklist.updateOne(
        { exitId },
        { $setOnInsert: { exitId }, $set: checklistFields },
        { upsert: true, session }
      );

      await addExitAuditLog({
        exitId,
        action: "HR approved",
        oldStatus: EXIT_STATUS.HR_PENDING,
        newStatus: EXIT_STATUS.ACCOUNTS_PENDING,
        performedBy: req.user._id,
        department: "HR",
        remarks: checklistFields.remarks,
        session,
      });

      await notifyExitAudience({
        audience: ["Accounts", "SuperAdmin"],
        exitId,
        actor: req.user,
        title: "HR clearance completed",
        message: "Employee exit is pending Accounts FNF clearance.",
        io: req.io,
        session,
      });
    });

    const exitData = await getExitByIdForUser(updatedExit._id, req.user);
    return jsonOk(res, "HR clearance submitted", exitData);
  } catch (error) {
    console.error("submitHRClearance error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to submit HR clearance");
  } finally {
    session.endSession();
  }
};

export const submitAccountsClearance = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isAccountsUser(req.user)) {
      return jsonError(res, 403, "Only Accounts can submit FNF clearance");
    }

    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    let updatedExit = null;
    await session.withTransaction(async () => {
      const exit = await EmployeeExit.findOneAndUpdate(
        {
          _id: exitId,
          status: EXIT_STATUS.ACCOUNTS_PENDING,
          accountsVerifiedBy: null,
          hrVerifiedBy: { $ne: null },
        },
        {
          $set: {
            status: EXIT_STATUS.SUPERADMIN_PENDING,
            accountsVerifiedBy: req.user._id,
          },
        },
        { new: true, session }
      );
      if (!exit) {
        const current = await EmployeeExit.findById(exitId)
          .select("status hrVerifiedBy accountsVerifiedBy")
          .session(session)
          .lean();
        if (!current) throw Object.assign(new Error("Employee exit not found"), { statusCode: 404 });
        if (!current.hrVerifiedBy) {
          throw Object.assign(new Error("Accounts cannot approve before HR clearance"), { statusCode: 409 });
        }
        throw Object.assign(new Error("Accounts FNF clearance is already completed or not currently allowed"), {
          statusCode: 409,
        });
      }
      updatedExit = exit;

      const checklistFields = {
        salaryDuesCalculated: Boolean(req.body?.salaryDuesCalculated),
        incentivesCalculated: Boolean(req.body?.incentivesCalculated),
        leaveEncashmentCalculated: Boolean(req.body?.leaveEncashmentCalculated),
        statutoryDuesChecked: Boolean(req.body?.statutoryDuesChecked),
        recoveriesAdjusted: Boolean(req.body?.recoveriesAdjusted),
        fnfProcessed: Boolean(req.body?.fnfProcessed),
        remarks: cleanString(req.body?.remarks),
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
      };

      await EmployeeExitAccountsChecklist.updateOne(
        { exitId },
        { $setOnInsert: { exitId }, $set: checklistFields },
        { upsert: true, session }
      );

      await addExitAuditLog({
        exitId,
        action: "Accounts FNF approved",
        oldStatus: EXIT_STATUS.ACCOUNTS_PENDING,
        newStatus: EXIT_STATUS.SUPERADMIN_PENDING,
        performedBy: req.user._id,
        department: "Accounts",
        remarks: checklistFields.remarks,
        session,
      });

      await notifyExitAudience({
        audience: ["SuperAdmin"],
        exitId,
        actor: req.user,
        title: "Accounts FNF clearance completed",
        message: "Employee exit is pending SuperAdmin final approval.",
        io: req.io,
        session,
      });
    });

    const exitData = await getExitByIdForUser(updatedExit._id, req.user);
    return jsonOk(res, "Accounts FNF clearance submitted", exitData);
  } catch (error) {
    console.error("submitAccountsClearance error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to submit Accounts FNF clearance");
  } finally {
    session.endSession();
  }
};

export const finalApproval = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isSuperAdminUser(req.user)) {
      return jsonError(res, 403, "Only SuperAdmin can submit final approval");
    }

    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    let updatedExit = null;
    await session.withTransaction(async () => {
      const exit = await EmployeeExit.findOne({
        _id: exitId,
        status: EXIT_STATUS.SUPERADMIN_PENDING,
        hrVerifiedBy: { $ne: null },
        accountsVerifiedBy: { $ne: null },
      }).session(session);

      if (!exit) {
        const current = await EmployeeExit.findById(exitId)
          .select("status hrVerifiedBy accountsVerifiedBy approvedBy exitCompletedAt")
          .session(session)
          .lean();
        if (!current) throw Object.assign(new Error("Employee exit not found"), { statusCode: 404 });
        if (!current.hrVerifiedBy) {
          throw Object.assign(new Error("SuperAdmin cannot approve before HR clearance"), {
            statusCode: 409,
          });
        }
        if (!current.accountsVerifiedBy) {
          throw Object.assign(new Error("SuperAdmin cannot approve before Accounts FNF clearance"), {
            statusCode: 409,
          });
        }
        if (current.status === EXIT_STATUS.COMPLETED || current.exitCompletedAt) {
          throw Object.assign(new Error("Exit cannot be completed twice"), { statusCode: 409 });
        }
        throw Object.assign(new Error("Final approval is already completed or not currently allowed"), {
          statusCode: 409,
        });
      }

      const oldStatus = exit.status;
      exit.status = EXIT_STATUS.WAITING_LAST_DAY;
      exit.approvedBy = req.user._id;
      await exit.save({ session });

      await addExitAuditLog({
        exitId,
        action: "SuperAdmin approved",
        oldStatus,
        newStatus: EXIT_STATUS.WAITING_LAST_DAY,
        performedBy: req.user._id,
        department: "SuperAdmin",
        remarks: cleanString(req.body?.remarks),
        session,
      });

      updatedExit = exit;

      if (shouldCompleteExitNow(exit.lastWorkingDate)) {
        await completeExitRecord({
          exit,
          actor: req.user,
          department: "SuperAdmin",
          remarks: "Exit completed during final approval because last working day has ended",
          session,
          io: req.io,
        });
      }
    });

    const exitData = await getExitByIdForUser(updatedExit._id, req.user);
    return jsonOk(res, "Final approval submitted", exitData);
  } catch (error) {
    console.error("finalApproval error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to submit final approval");
  } finally {
    session.endSession();
  }
};

export const revokeEmployeeExit = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!isHrUser(req.user)) {
      return jsonError(res, 403, "Only HR can revoke employee exits");
    }

    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    let updatedExit = null;
    await session.withTransaction(async () => {
      const exit = await EmployeeExit.findOne({
        _id: exitId,
        status: { $in: ACTIVE_EXIT_STATUSES },
        exitCompletedAt: null,
      }).session(session);

      if (!exit) {
        const current = await EmployeeExit.findById(exitId)
          .select("status exitCompletedAt revokedAt")
          .session(session)
          .lean();
        if (!current) throw Object.assign(new Error("Employee exit not found"), { statusCode: 404 });
        if (current.status === EXIT_STATUS.REVOKED || current.revokedAt) {
          throw Object.assign(new Error("Employee exit is already revoked"), { statusCode: 409 });
        }
        if (current.status === EXIT_STATUS.COMPLETED || current.exitCompletedAt) {
          throw Object.assign(new Error("Completed exits cannot be revoked"), { statusCode: 409 });
        }
        throw Object.assign(new Error("Employee exit cannot be revoked in its current status"), {
          statusCode: 409,
        });
      }

      const oldStatus = exit.status;
      exit.status = EXIT_STATUS.REVOKED;
      exit.revokedBy = req.user._id;
      exit.revokedAt = new Date();
      await exit.save({ session });
      updatedExit = exit;

      const remarks = cleanString(req.body?.remarks) || "Exit revoked by HR";
      await addExitAuditLog({
        exitId,
        action: "Exit revoked",
        oldStatus,
        newStatus: EXIT_STATUS.REVOKED,
        performedBy: req.user._id,
        department: getActorDepartment(req.user),
        remarks,
        session,
      });

      await notifyExitAudience({
        audience: ["IT", "SuperAdmin"],
        exitId,
        actor: req.user,
        title: "Employee exit revoked",
        message: "Employee exit workflow has been revoked by HR.",
        io: req.io,
        session,
      });
    });

    const exitData = await getExitByIdForUser(updatedExit._id, req.user);
    return jsonOk(res, "Employee exit revoked", exitData);
  } catch (error) {
    console.error("revokeEmployeeExit error:", error);
    return jsonError(res, error.statusCode || 500, error.message || "Failed to revoke employee exit");
  } finally {
    session.endSession();
  }
};

export const getExitAuditLogs = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return jsonError(res, 403, "Only SuperAdmin can view audit logs");
    }
    const exitId = cleanString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(exitId)) {
      return jsonError(res, 400, "Invalid exit id");
    }

    const logs = await EmployeeExitAuditLog.find({ exitId })
      .sort({ timestamp: -1 })
      .populate("performedBy", "username realName pseudoName")
      .lean();

    return jsonOk(res, "Audit logs fetched", logs);
  } catch (error) {
    console.error("getExitAuditLogs error:", error);
    return jsonError(res, 500, "Failed to fetch audit logs");
  }
};

export const getExitDashboard = async (req, res) => {
  try {
    if (!isExitPrivilegedUser(req.user)) {
      return jsonError(res, 403, "You do not have access to employee exits");
    }

    const scopedQuery = buildExitListQueryForUser(req.user, {});
    const now = new Date();
    const overdueItBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const overdueHrBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const overdueAccountsBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const pipeline = [
      { $match: scopedQuery },
      {
        $facet: {
          statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          overdueIt: [
            { $match: { status: EXIT_STATUS.IT_PENDING, updatedAt: { $lte: overdueItBefore } } },
            { $count: "count" },
          ],
          overdueHr: [
            { $match: { status: EXIT_STATUS.HR_PENDING, updatedAt: { $lte: overdueHrBefore } } },
            { $count: "count" },
          ],
          overdueAccounts: [
            { $match: { status: EXIT_STATUS.ACCOUNTS_PENDING, updatedAt: { $lte: overdueAccountsBefore } } },
            { $count: "count" },
          ],
        },
      },
    ];

    const [result] = await EmployeeExit.aggregate(pipeline);
    const statusCounts = Object.fromEntries(
      (result?.statusCounts || []).map((row) => [row._id, row.count])
    );

    return jsonOk(res, "Employee exit dashboard fetched", {
      noticePeriod: statusCounts[EXIT_STATUS.NOTICE_PERIOD] || 0,
      itVerificationPending: statusCounts[EXIT_STATUS.IT_PENDING] || 0,
      hrClearancePending: statusCounts[EXIT_STATUS.HR_PENDING] || 0,
      accountsClearancePending: statusCounts[EXIT_STATUS.ACCOUNTS_PENDING] || 0,
      waitingForLastWorkingDay: statusCounts[EXIT_STATUS.WAITING_LAST_DAY] || 0,
      completedExits: statusCounts[EXIT_STATUS.COMPLETED] || 0,
      revokedExits: statusCounts[EXIT_STATUS.REVOKED] || 0,
      overdueItClearances: result?.overdueIt?.[0]?.count || 0,
      overdueHrClearances: result?.overdueHr?.[0]?.count || 0,
      overdueAccountsClearances: result?.overdueAccounts?.[0]?.count || 0,
    });
  } catch (error) {
    console.error("getExitDashboard error:", error);
    return jsonError(res, 500, "Failed to fetch exit dashboard");
  }
};

export const getPendingExits = async (req, res) => {
  const pendingStatusByRole = isItUser(req.user)
    ? [EXIT_STATUS.IT_PENDING]
    : isHrUser(req.user)
      ? [EXIT_STATUS.HR_PENDING, EXIT_STATUS.IT_PENDING, EXIT_STATUS.SUPERADMIN_PENDING]
      : isAccountsUser(req.user)
        ? [EXIT_STATUS.ACCOUNTS_PENDING]
      : isSuperAdminUser(req.user)
        ? [EXIT_STATUS.ACCOUNTS_PENDING, EXIT_STATUS.SUPERADMIN_PENDING, EXIT_STATUS.WAITING_LAST_DAY]
        : ACTIVE_EXIT_STATUSES;

  try {
    if (!isExitPrivilegedUser(req.user)) {
      return jsonError(res, 403, "You do not have access to employee exits");
    }
    const { page, limit, skip } = parsePagination(req.query);
    const query = buildExitListQueryForUser(req.user, { status: { $in: pendingStatusByRole } });
    const [items, total] = await Promise.all([
      EmployeeExit.find(query)
        .select(EXIT_LIST_SELECT)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("employeeId", USER_SELECT)
        .lean(),
      EmployeeExit.countDocuments(query),
    ]);
    return jsonOk(res, "Pending exits fetched", {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("getPendingExits error:", error);
    return jsonError(res, 500, "Failed to fetch pending exits");
  }
};

export const getCompletedExits = async (req, res) => {
  try {
    if (!isExitPrivilegedUser(req.user)) {
      return jsonError(res, 403, "You do not have access to employee exits");
    }
    const { page, limit, skip } = parsePagination(req.query);
    const query = buildExitListQueryForUser(req.user, { status: EXIT_STATUS.COMPLETED });
    const [items, total] = await Promise.all([
      EmployeeExit.find(query)
        .select(EXIT_LIST_SELECT)
        .sort({ exitCompletedAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("employeeId", USER_SELECT)
        .lean(),
      EmployeeExit.countDocuments(query),
    ]);
    return jsonOk(res, "Completed exits fetched", {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("getCompletedExits error:", error);
    return jsonError(res, 500, "Failed to fetch completed exits");
  }
};

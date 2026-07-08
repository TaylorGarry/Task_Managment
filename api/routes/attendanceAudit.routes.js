import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  getAttendanceAuditHistory,
  getAttendanceAuditLogById,
  getAttendanceAuditLogs,
} from "../Controllers/attendanceAudit.controller.js";

const router = express.Router();

router.get("/audit", authMiddleware, getAttendanceAuditLogs);
router.get("/audit/history/:employeeId/:attendanceDate", authMiddleware, getAttendanceAuditHistory);
router.get("/audit/:id", authMiddleware, getAttendanceAuditLogById);

export default router;

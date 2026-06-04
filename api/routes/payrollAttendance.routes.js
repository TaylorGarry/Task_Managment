import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  exportPayrollAttendanceToExcel,
  getPayrollAttendanceByMonth,
} from "../Controllers/payrollAttendance.controller.js";

const router = express.Router();

router.get("/attendance-month", authMiddleware, getPayrollAttendanceByMonth);
router.get("/export", authMiddleware, exportPayrollAttendanceToExcel);

export default router;

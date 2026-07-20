// import express from "express";
// import { authMiddleware } from "../Middlewares/auth.middleware.js";
// import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
// import {
//   downloadMySalarySlip,
//   getMySalarySlips,
//   getSalaryBatches,
//   uploadSalaryExcel,
// } from "../Controllers/SalarySlip/salarySlip.controller.js"

// const router = express.Router();

// router.post(
//   "/upload",
//   authMiddleware,
//   uploadSingleFile,
//   uploadSalaryExcel
// );
// router.get("/my-slips", authMiddleware, getMySalarySlips);
// router.get("/my-slips/:id/download", authMiddleware, downloadMySalarySlip);
// router.get("/batches", authMiddleware, getSalaryBatches);

// export default router;


import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
import {
  downloadMySalarySlip,
  getMySalarySlips,
  getSalaryBatches,
  uploadSalaryExcel,
  getEmployeeSalarySlips,
  getEmployeeSalaryStatus,
  downloadEmployeeSalarySlip,
  getBatchFailedEmployees,
  getEmployeeSalaryDetails,
  downloadFailedEmployees,
} from "../Controllers/SalarySlip/salarySlip.controller.js"

const router = express.Router();

// Upload salary Excel file (HR/Accounts only)
router.post(
  "/upload",
  authMiddleware,
  uploadSingleFile,
  uploadSalaryExcel
);

// Get current user's salary slips
router.get("/my-slips", authMiddleware, getMySalarySlips);

// Download current user's salary slip
router.get("/my-slips/:id/download", authMiddleware, downloadMySalarySlip);

// Get salary upload batches (HR/Accounts only)
router.get("/batches", authMiddleware, getSalaryBatches);

// ========== HR/Accounts Only Routes ==========

// Get salary slips for any employee (with filters)
router.get("/employee-slips", authMiddleware, getEmployeeSalarySlips);

// Get salary slips for a specific employee
router.get("/employee-slips/:employeeId", authMiddleware, getEmployeeSalarySlips);

// Get salary status for all employees for a specific month/year
router.get("/employee-salary-status", authMiddleware, getEmployeeSalaryStatus);

// Get detailed salary info for a specific employee
router.get("/employee/:employeeId/salary-details", authMiddleware, getEmployeeSalaryDetails);

// Download any employee's salary slip by record ID (HR/Accounts only)
router.get("/download/:id", authMiddleware, downloadEmployeeSalarySlip);

// Get failed employees from a specific batch
router.get("/batch/:batchId/failed-employees", authMiddleware, getBatchFailedEmployees);

// In salarySlipRoutes.js
router.get("/batch/:batchId/failed-employees", authMiddleware, getBatchFailedEmployees);
router.get("/batch/:batchId/failed-employees/download", authMiddleware, downloadFailedEmployees);

export default router;
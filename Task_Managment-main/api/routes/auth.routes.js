import express from "express";
import {
  logout,
  signup,
  login,
  getAllEmployees,
  updateProfile,
  createCoreTeamUser,
  updateUserByAdmin,
  getReportingManagers,
  getEmployeeDashboardSummary,
  acceptPolicyAgreement,
  uploadEmployeeAsset,
  signPolicyDocumentByEmployee,
  signPolicyDocumentByHR,
  deleteEmployeeByAdmin,
  exportEmployeeDetailsExcel,
} from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";

const router = express.Router();

router.post("/signup",authMiddleware, signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/employees", authMiddleware, getAllEmployees);
router.get("/employees/export", authMiddleware, exportEmployeeDetailsExcel);
router.get("/employees/managers", authMiddleware, getReportingManagers);
router.post("/update-profile", authMiddleware, updateProfile);
router.post("/createcoreUser", authMiddleware, createCoreTeamUser);
router.put("/update/:id", authMiddleware, updateUserByAdmin);
router.get("/employee/dashboard-summary", authMiddleware, getEmployeeDashboardSummary);
router.post("/employee/policy-accept", authMiddleware, acceptPolicyAgreement);
router.post("/employee/policy-sign", authMiddleware, signPolicyDocumentByEmployee);
router.post("/employee/:id/policy-sign-hr", authMiddleware, signPolicyDocumentByHR);
router.post("/employee/upload-asset", authMiddleware, uploadSingleFile, uploadEmployeeAsset);
router.delete("/employees/:id", authMiddleware, deleteEmployeeByAdmin);


export default router;

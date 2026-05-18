import express from "express";
import multer from "multer";
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
  getEmployeeAttendanceByMonth,
  acceptPolicyAgreement,
  uploadEmployeeAsset,
  signPolicyDocumentByEmployee,
  signPolicyDocumentByHR,
  deleteEmployeeByAdmin,
  exportEmployeeDetailsExcel,
  verifyEmployeeOnboardingToken,
  uploadEmployeeOnboardingAsset,
  submitEmployeeOnboardingDocs,
} from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";

const router = express.Router();
const onboardingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF/JPEG/PNG/WEBP files are allowed"));
    }
    cb(null, true);
  },
});

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
router.get("/employee/attendance-month", authMiddleware, getEmployeeAttendanceByMonth);
router.post("/employee/policy-accept", authMiddleware, acceptPolicyAgreement);
router.post("/employee/policy-sign", authMiddleware, signPolicyDocumentByEmployee);
router.post("/employee/:id/policy-sign-hr", authMiddleware, signPolicyDocumentByHR);
router.post("/employee/upload-asset", authMiddleware, uploadSingleFile, uploadEmployeeAsset);
router.get("/employee/onboarding/verify", verifyEmployeeOnboardingToken);
router.post("/employee/onboarding/upload-asset", onboardingUpload.single("file"), uploadEmployeeOnboardingAsset);
router.post("/employee/onboarding/submit", submitEmployeeOnboardingDocs);
router.delete("/employees/:id", authMiddleware, deleteEmployeeByAdmin);


export default router;

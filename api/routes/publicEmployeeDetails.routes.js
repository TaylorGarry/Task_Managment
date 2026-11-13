import express from "express";
import { submitEmployeeDetailsForm } from "../Controllers/auth.controller.js";
import { verifyEmployeeDetailsLogin } from "../Controllers/employeeDetails.controller.js";
// import {
//   verifyEmployeeDetailsLogin,
//   submitEmployeeDetailsForm,
// } from "../Controllers/employeeDetails.controller.js";

const router = express.Router();

// POST /api/public/employee-details/verify
// Body: { username, password }
// Returns: { token, user: {...} }
// PUBLIC — no authMiddleware
router.post("/verify", verifyEmployeeDetailsLogin);

// POST /api/public/employee-details/submit
// Header: Authorization: Bearer <token from /verify>
// Body: { officeLocation, currentAddress, transportOffice }
// PUBLIC — no authMiddleware (validated by scoped JWT inside controller)
router.post("/submit", submitEmployeeDetailsForm);

export default router;
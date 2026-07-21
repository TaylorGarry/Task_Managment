// import express from "express";
// import {
//   applyLeaveRequest,
//   getAdminLeaveDashboard,
//   getAdminLeaveRequests,
//   getMyLeaveRequests,
//   getMyLeaveSummary,
//   reviewLeaveRequest,
// } from "../Controllers/leave.controller.js";
// import { authMiddleware } from "../Middlewares/auth.middleware.js";

// const router = express.Router();

// router.get("/me/summary", authMiddleware, getMyLeaveSummary);
// router.get("/me/requests", authMiddleware, getMyLeaveRequests);
// router.post("/apply", authMiddleware, applyLeaveRequest);

// router.get("/admin/dashboard", authMiddleware, getAdminLeaveDashboard);
// router.get("/admin/requests", authMiddleware, getAdminLeaveRequests);
// router.patch("/admin/requests/:id", authMiddleware, reviewLeaveRequest);

// export default router;




import express from "express";
import {
  applyLeaveOnBehalf,
  applyLeaveRequest,
  getAdminLeaveDashboard,
  getAdminLeaveRequests,
  getMyLeaveRequests,
  getMyLeaveSummary, 
  reviewLeaveRequest,
} from "../Controllers/leave.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me/summary", authMiddleware, getMyLeaveSummary);
router.get("/me/requests", authMiddleware, getMyLeaveRequests);
router.post("/apply", authMiddleware, applyLeaveRequest);

router.get("/admin/dashboard", authMiddleware, getAdminLeaveDashboard);
router.get("/admin/requests", authMiddleware, getAdminLeaveRequests); 
router.post("/admin/apply-on-behalf", authMiddleware, applyLeaveOnBehalf);
router.patch("/admin/requests/:id", authMiddleware, reviewLeaveRequest);

export default router;


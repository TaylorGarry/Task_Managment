import express from "express";
import {
  finalApproval,
  getCompletedExits,
  getEmployeeExitById,
  getEmployeeExits,
  getExitAuditLogs,
  getExitDashboard,
  getPendingExits,
  initiateEmployeeExit,
  revokeEmployeeExit,
  submitAccountsClearance,
  submitHRClearance,
  submitITClearance,
} from "../Controllers/employeeExit.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import { cacheGetResponse, invalidateCacheTag } from "../Middlewares/responseCache.middleware.js";
import { EXIT_CACHE_TAG } from "../services/employeeExit.service.js";

const router = express.Router();
const cacheForFiveMinutes = cacheGetResponse({
  keyPrefix: "employee-exit",
  ttlMs: 5 * 60 * 1000,
  tag: EXIT_CACHE_TAG,
  varyByUser: true,
});
const invalidateExitCache = invalidateCacheTag(EXIT_CACHE_TAG);

router.post("/initiate", authMiddleware, invalidateExitCache, initiateEmployeeExit);
router.get("/", authMiddleware, cacheForFiveMinutes, getEmployeeExits);
router.get("/dashboard", authMiddleware, cacheForFiveMinutes, getExitDashboard);
router.get("/pending", authMiddleware, cacheForFiveMinutes, getPendingExits);
router.get("/completed", authMiddleware, cacheForFiveMinutes, getCompletedExits);
router.get("/:id", authMiddleware, getEmployeeExitById);
router.post("/:id/it-clearance", authMiddleware, invalidateExitCache, submitITClearance);
router.post("/:id/hr-clearance", authMiddleware, invalidateExitCache, submitHRClearance);
router.post("/:id/accounts-clearance", authMiddleware, invalidateExitCache, submitAccountsClearance);
router.post("/:id/final-approval", authMiddleware, invalidateExitCache, finalApproval);
router.post("/:id/revoke", authMiddleware, invalidateExitCache, revokeEmployeeExit);
router.get("/:id/audit-logs", authMiddleware, getExitAuditLogs);

export default router;

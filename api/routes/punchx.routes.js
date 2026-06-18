import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  endBreak,
  endShift,
  getManagerTeamStatus,
  exportSuperAdminDailyStatusExcel,
  getSuperAdminDailyStatus,
  getSessionHistory,
  getTodaySession,
  postActivity,
  startBreak,
  startShift,
} from "../Controllers/punchx.controller.js";
import { cacheGetResponse, invalidateCacheTag } from "../Middlewares/responseCache.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/session/today", getTodaySession);
router.get("/session/history", getSessionHistory);
router.post("/shift/start", invalidateCacheTag("attendance"), startShift);
router.post("/shift/end", invalidateCacheTag("attendance"), endShift);
router.post("/break/start", invalidateCacheTag("attendance"), startBreak);
router.post("/break/end", invalidateCacheTag("attendance"), endBreak);
router.post("/activity", invalidateCacheTag("attendance"), postActivity);
router.get(
  "/manager/team-status",
  cacheGetResponse({ keyPrefix: "team-status", ttlMs: 15 * 1000, tag: "attendance" }),
  getManagerTeamStatus
);
router.get(
  "/superadmin/daily-status",
  cacheGetResponse({ keyPrefix: "daily-status", ttlMs: 15 * 1000, tag: "attendance" }),
  getSuperAdminDailyStatus
);
router.get("/superadmin/daily-status/export", exportSuperAdminDailyStatusExcel);

export default router;

import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  endBreak,
  endShift,
  getManagerTeamStatus,
  getTodaySession,
  postActivity,
  startBreak,
  startShift,
} from "../Controllers/punchx.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/session/today", getTodaySession);
router.post("/shift/start", startShift);
router.post("/shift/end", endShift);
router.post("/break/start", startBreak);
router.post("/break/end", endBreak);
router.post("/activity", postActivity);
router.get("/manager/team-status", getManagerTeamStatus);

export default router;

import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  addRosterWeek,
  getRosterForCRMUsers,
  updateRoster,
  exportRosterToExcel,
  getAllRosters,
  exportSavedRoster
} from "../Controllers/roster.controller.js";
import { validateRosterWeek } from "../Middlewares/roster.middleware.js";

const router = express.Router();

// Add a new roster week
router.post("/add-week", authMiddleware,validateRosterWeek, addRosterWeek);

// Get roster details (for existing CRM users only)
router.get("/getroster", authMiddleware, getRosterForCRMUsers);

// Edit roster week details
router.put("/update-employee", authMiddleware, updateRoster);

// Export roster to Excel
router.get("/exportroster", authMiddleware, exportRosterToExcel);

router.get("/rosterdetail", authMiddleware, getAllRosters);

router.get("/export-saved", authMiddleware, exportSavedRoster);
export default router;

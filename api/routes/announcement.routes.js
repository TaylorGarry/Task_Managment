import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats,
  getAnnouncements,
  updateAnnouncement,
} from "../Controllers/announcement.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAnnouncements);
router.get("/stats", authMiddleware, getAnnouncementStats);
router.post("/", authMiddleware, createAnnouncement);
router.put("/:id", authMiddleware, updateAnnouncement);
router.delete("/:id", authMiddleware, deleteAnnouncement);

export default router;

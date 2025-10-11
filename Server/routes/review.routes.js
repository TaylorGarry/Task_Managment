import express from "express";
import {
  addReview,
  getReviewsByTask,
  resolveReview,
} from "../Controllers/review.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Employee adds a review
router.post("/", authMiddleware, addReview);

// ✅ Admin fetches all reviews for a task
router.get("/task/:taskId", authMiddleware, getReviewsByTask);

// ✅ Admin marks a review as resolved
router.put("/:reviewId/resolve", authMiddleware, resolveReview);

export default router;

import express from "express";
import {
  addReview,
  getReviewsByTask,
  resolveReview,
} from "../Controllers/review.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();
router.post("/", authMiddleware, addReview);
router.get("/task/:taskId", authMiddleware, getReviewsByTask);
router.put("/:reviewId/resolve", authMiddleware, resolveReview);

export default router;

import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  assignTask, // optional if you want a separate assign endpoint
} from "../Controllers/task.controller.js";

const router = express.Router();

// Admin-only routes
router.post("/create", authMiddleware, createTask);
router.delete("/:id", authMiddleware, deleteTask);
router.put("/assign/:taskId", authMiddleware, assignTask); // optional

// Common routes (accessible to both admin and employee)
router.get("/", authMiddleware, getTasks);
router.put("/update/:id", authMiddleware, updateTask);

export default router;

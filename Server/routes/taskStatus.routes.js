import express from "express";
import { updateTaskStatus } from "../Controllers/task.controller.js";  
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

// Employee updates their task status
router.put("/:taskId", authMiddleware, updateTaskStatus);

export default router;

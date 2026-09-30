import express from "express";
import { updateTaskStatus, updateTaskStatusCoreTeam } from "../Controllers/task.controller.js";  
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.put("/:taskId", authMiddleware, updateTaskStatus);
router.put("/status/core/:taskId", authMiddleware, updateTaskStatusCoreTeam);


export default router;

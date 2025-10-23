import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  getAllTasks,
  exportTaskStatusExcel,  
} from "../Controllers/task.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTask);
router.delete("/:id", authMiddleware, deleteTask);
router.put("/assign/:taskId", authMiddleware, assignTask);  

router.get("/", authMiddleware, getTasks);
router.put("/update/:id", authMiddleware, updateTask);

router.put("/status/:taskId", authMiddleware, updateTaskStatus);
router.get("/AllTasks", authMiddleware, getAllTasks);
router.get("/export-status", authMiddleware, exportTaskStatusExcel);
export default router;

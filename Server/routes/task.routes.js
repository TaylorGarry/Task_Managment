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
  Defaulter,
  getEmployeeDefaulters,  
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
router.get("/defaulter", authMiddleware, Defaulter);
router.get("/employee-defaulters/:employeeId", getEmployeeDefaulters);
export default router;

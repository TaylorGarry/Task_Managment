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
  createCoreTeamTask,
  getCoreTeamTasks,
  updateTaskStatusCoreTeam,
  getAdminTasks,
  updateAdminTaskStatus,
  getAdminAssignedTasks,
  exportEmployeeDefaults,
  
} from "../Controllers/task.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTask);
router.delete("/:id", authMiddleware, deleteTask);
router.put("/assign/:taskId", authMiddleware, assignTask);  

router.get("/", authMiddleware, getTasks);
router.put("/update/:id", authMiddleware, updateTask);
router.put("/status/core/:taskId", authMiddleware, updateTaskStatusCoreTeam);

router.put("/status/:taskId", authMiddleware, updateTaskStatus);
router.get("/AllTasks", authMiddleware, getAllTasks);
router.get("/export-status", authMiddleware, exportTaskStatusExcel);
router.get("/defaulter", authMiddleware, Defaulter);
router.get("/employee-defaulter/:employeeId", getEmployeeDefaulters);
router.post("/create/coretask", authMiddleware, createCoreTeamTask);
router.get("/coreteamTask", authMiddleware, getCoreTeamTasks);
router.get("/admintask", authMiddleware, getAdminTasks);
router.put("/admin/status/:taskId", authMiddleware, updateAdminTaskStatus);
router.get('/admin-assigned-tasks', authMiddleware, getAdminAssignedTasks);
router.get("/export-employee-defaulter/:employeeId",authMiddleware,exportEmployeeDefaults);


export default router;

import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  addRemark,
  deleteRemark,
  getRemarksByTask,
  updateRemark,
} from "../Controllers/remark.controller.js";

const router = express.Router();

router.post("/:taskId", authMiddleware, addRemark);
router.get("/:taskId", authMiddleware, getRemarksByTask);
router.put("/update/:remarkId", authMiddleware, updateRemark);
router.delete("/:remarkId", authMiddleware, deleteRemark);

export default router;

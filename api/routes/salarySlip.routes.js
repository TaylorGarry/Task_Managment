import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
import {
  downloadMySalarySlip,
  getMySalarySlips,
  getSalaryBatches,
  uploadSalaryExcel,
} from "../Controllers/SalarySlip/salarySlip.controller.js"

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  uploadSingleFile,
  uploadSalaryExcel
);
router.get("/my-slips", authMiddleware, getMySalarySlips);
router.get("/my-slips/:id/download", authMiddleware, downloadMySalarySlip);
router.get("/batches", authMiddleware, getSalaryBatches);

export default router;

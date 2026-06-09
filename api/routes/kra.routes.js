import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  createKra,
  deleteKra,
  getKraById,
  getKras,
  updateKra,
} from "../Controllers/kra.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createKra);
router.get("/", authMiddleware, getKras);
router.get("/:id", authMiddleware, getKraById);
router.put("/:id", authMiddleware, updateKra);
router.delete("/:id", authMiddleware, deleteKra);

export default router;

import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  getAiAssistantState,
  handleAiAssistantMessage,
} from "../Controllers/aiAssistant.controller.js";

const router = express.Router();

router.get("/state", authMiddleware, getAiAssistantState);
router.post("/message", authMiddleware, handleAiAssistantMessage);

export default router;

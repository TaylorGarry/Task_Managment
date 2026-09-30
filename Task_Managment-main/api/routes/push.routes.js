import express from "express";
import { savePushSubscription } from "../Controllers/push.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/subscribe", authMiddleware, savePushSubscription);

export default router;

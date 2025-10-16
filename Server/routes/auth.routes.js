import express from "express";
import { logout, signup, login, getAllEmployees } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/employees", authMiddleware, getAllEmployees);


export default router;
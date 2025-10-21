import express from "express";
import { logout, signup, login, getAllEmployees, updateProfile } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/employees", authMiddleware, getAllEmployees);
router.post("/update-profile", authMiddleware, updateProfile);


export default router;
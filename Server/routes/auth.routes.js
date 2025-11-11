import express from "express";
import { logout, signup, login, getAllEmployees, updateProfile, createCoreTeamUser, updateUserByAdmin } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup",authMiddleware, signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/employees", authMiddleware, getAllEmployees);
router.post("/update-profile", authMiddleware, updateProfile);
router.post("/createcoreUser", authMiddleware, createCoreTeamUser);
router.put("/update/:id", authMiddleware, updateUserByAdmin);


export default router;
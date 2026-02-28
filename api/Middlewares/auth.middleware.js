import jwt from "jsonwebtoken";
import User from "../Modals/User.modal.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // ⭐ NEW: check if any superAdmin exists
    const superAdminExists = await User.exists({
      accountType: "superAdmin",
    });

    // ⭐ NEW: allow first superAdmin signup without token
    if (!superAdminExists && req.path === "/signup") {
      return next();
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
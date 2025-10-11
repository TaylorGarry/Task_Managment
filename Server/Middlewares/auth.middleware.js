import jwt from "jsonwebtoken";

console.log("🔑 Middleware loaded, JWT_SECRET:", process.env.JWT_SECRET);

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("📌 Incoming Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("📌 Extracted token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded JWT:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT verification error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

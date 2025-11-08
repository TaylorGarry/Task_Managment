import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";
// import remarkRoutes from "./routes/remark.routes.js";

dotenv.config();
const app = express();

// ✅ Trust proxy for correct client IP detection (important for production)
app.set("trust proxy", true);

// ✅ Allowed Origins (for frontend access)
const allowedOrigins = [
  "http://localhost:5173",
  "https://crm.terranovasolution.in",
  "https://crm.fdbs.in",
  // "https://sweet-faun-a1e735.netlify.app",
  // "https://mydevtm.com",
];

// ✅ Allowed IPs (only these can call the backend)
const allowedIPs = [
  "182.71.112.82",
  "182.75.147.210",
  "14.97.83.226",
  "127.0.0.1", // localhost IPv4
  "::1",       // localhost IPv6
];

// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked CORS for origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ IP Whitelist Middleware
app.use((req, res, next) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress?.replace("::ffff:", "");

  if (!allowedIPs.includes(clientIp)) {
    console.log(`🚫 Blocked IP: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message: "Access denied: IP not allowed",
    });
  }

  console.log(`✅ Allowed IP: ${clientIp}`);
  next();
});

// ✅ Express JSON Middleware
app.use(express.json());

// ✅ API Routes
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);
// app.use("/api/remarks", remarkRoutes);

// ✅ Debug route (to verify IP in production)
app.get("/check-ip", (req, res) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress?.replace("::ffff:", "");
  res.json({ detectedIP: clientIp });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  if (err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS not allowed for this origin" });
  }
  console.error("Server Error:", err.message);
  return res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

export default app;

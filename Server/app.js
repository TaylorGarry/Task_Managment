import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";
import remarkRoutes from "./routes/remark.routes.js";

dotenv.config();
const app = express();

app.set("trust proxy", true);

const allowedOrigins = [
  "http://localhost:5173",
  "https://crm.terranovasolution.in",
  "https://crm.fdbs.in",
];

const allowedIPs = [
  "182.71.112.82",
  "182.75.147.210",
  "14.97.83.226",
  "127.0.0.1", 
  "::1",        
];

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

app.use((req, res, next) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress?.replace("::ffff:", "");

  if (!allowedIPs.includes(clientIp)) {
    return res.status(403).json({
      success: false,
      message: "Access denied: IP not allowed",
    });
  }
  next();
});

app.use(express.json());

app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);
app.use("/api/remarks", remarkRoutes);

app.get("/check-ip", (req, res) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress?.replace("::ffff:", "");
  res.json({ detectedIP: clientIp });
});

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

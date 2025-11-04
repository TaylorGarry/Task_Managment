import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://sweet-faun-a1e735.netlify.app",
  "https://mydevtm.com",
  "https://crm.terranovasolution.in",
  "https://crm.fdbs.in"
];

// ✅ Allowed IPs (from .env)
// const allowedIPs = process.env.ALLOWED_IPS
//   ? process.env.ALLOWED_IPS.split(",").map((ip) => ip.trim())
//   : [];

// ✅ CORS middleware
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
// app.use((req, res, next) => {
//   const clientIp =
//     req.headers["x-forwarded-for"]?.split(",")[0] ||
//     req.socket.remoteAddress?.replace("::ffff:", "");

//   if (allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
//     console.log(`🚫 Blocked IP: ${clientIp}`);
//     return res
//       .status(403)
//       .json({ success: false, message: "Access denied: IP not allowed" });
//   }

//   console.log(`✅ Allowed IP: ${clientIp}`);
//   next();
// });

app.use(express.json());
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);

app.use((err, req, res, next) => {
  if (err.message.includes("CORS")) {
    return res
      .status(403)
      .json({ message: "CORS not allowed for this origin" });
  }
  console.error("Server Error:", err.message);
  return res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

export default app;

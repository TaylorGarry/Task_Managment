// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";

// import authRoutes from "./routes/auth.routes.js";
// import taskRoutes from "./routes/task.routes.js";
// import reviewRoutes from "./routes/review.routes.js";
// import taskStatusRoutes from "./routes/taskStatus.routes.js";
// import remarkRoutes from "./routes/remark.routes.js";

// dotenv.config();
// const app = express();
// app.set("trust proxy", true);

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://crm.terranovasolutions.in",
//   "https://crm.fdbs.in",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// const allowedIPs = [
//   "182.71.112.82",
//   "182.75.147.210",
//   "14.97.83.226",
//   "127.0.0.1",
//   "103.21.187.189",
//   "2401:4900:8397:695a:2091:8fff:fe38:b7f4",
//   "::1",
// ];

// app.use(async (req, res, next) => {
//   if (req.path === "/api/v1/login") return next();

//   let clientIp =
//     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//     req.socket.remoteAddress;

//   clientIp = clientIp.replace("::ffff:", "").toLowerCase();
//   if (clientIp.includes("%")) clientIp = clientIp.split("%")[0];

//   if (req.user?.accountType === "admin") return next();

//   if (allowedIPs.includes(clientIp)) return next();

//   return res.status(403).json({
//     success: false,
//     message: `Access denied: IP ${clientIp} not allowed`,
//   });
// });


// // app.use((req, res, next) => {
// //   if (req.path === "/api/v1/login") return next(); 
// //   let clientIp =
// //     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
// //     req.socket.remoteAddress;

// //   // Normalize IPv6 (remove ::ffff: and unnecessary formatting)
// //   clientIp = clientIp.replace("::ffff:", "").toLowerCase();

// //   // Some servers return IPv6 with zone info like "fe80::1%eth0"
// //   if (clientIp.includes("%")) {
// //     clientIp = clientIp.split("%")[0];
// //   }

// //   // Check allowed list
// //   if (allowedIPs.includes(clientIp)) {
// //     return next();
// //   }

// //   return res.status(403).json({
// //     success: false,
// //     message: `Access denied: IP ${clientIp} not allowed`,
// //   });
// // });


// app.use(express.json());

// // ---------------------- API ROUTES ----------------------
// app.use("/api/v1", authRoutes);
// app.use("/api/v1/tasks", taskRoutes);
// app.use("/api/v1/review", reviewRoutes);
// app.use("/api/v1/task-status", taskStatusRoutes);
// app.use("/api/remarks", remarkRoutes);

// // ---------------------- ROOT & IP CHECK ROUTES ----------------------
// app.get("/", (req, res) => {
//   res.json({ 
//     status: "SUCCESS", 
//     message: "Task Management API is running!",
//     version: "1.0.0",
//     timestamp: new Date().toISOString(),
//     endpoints: [
//       "/api/v1/login",
//       "/api/v1/signup", 
//       "/api/v1/tasks",
//       "/api/v1/review",
//       "/api/v1/task-status",
//       "/api/remarks"
//     ]
//   });
// });

// app.get("/check-ip", (req, res) => {
//   const clientIp =
//     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//     req.socket.remoteAddress?.replace("::ffff:", "");
//   res.json({ 
//     detectedIP: clientIp,
//     allowedIPs: allowedIPs,
//     message: "Use this IP to add to allowedIPs array if needed"
//   });
// });

// // ---------------------- 404 HANDLER ----------------------
// app.use((req, res) => {
//   res.status(404).json({ 
//     error: "API endpoint not found",
//     path: req.originalUrl,
//     available_endpoints: [
//       "GET /",
//       "GET /check-ip", 
//       "POST /api/v1/login",
//       "POST /api/v1/signup",
//       "GET /api/v1/tasks",
//       "POST /api/v1/tasks",
//       "GET /api/remarks",
//       "POST /api/remarks"
//     ]
//   });
// });

// // ---------------------- ERROR HANDLER ----------------------
// app.use((err, req, res, next) => {
//   console.error("Error:", err.message);
//   if (err.message.includes("CORS")) {
//     return res.status(403).json({ message: "CORS not allowed for this origin" });
//   }
//   res.status(500).json({
//     message: "Internal Server Error",
//     error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
//   });
// });

// export default app;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";
import remarkRoutes from "./routes/remark.routes.js";
import { authMiddleware } from "./Middlewares/auth.middleware.js";

dotenv.config();
const app = express();
app.set("trust proxy", true);

const allowedOrigins = [
  "http://localhost:5173",
  "https://crm.terranovasolutions.in",
  "https://crm.fdbs.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const allowedIPs = [
  "182.71.112.82",
  "182.75.147.210",
  "14.97.83.226",
  "127.0.0.1",
  "103.21.187.189",
  "2401:4900:8397:695a:2091:8fff:fe38:b7f4",
  "::1",
];

app.use(express.json());


// ✅ PUBLIC ROUTES: No auth, No IP check
const publicRoutes = [
  "/api/v1/login",
  "/api/v1/signup",
  "/api/v1/logout"
];


// ✅ 1️⃣ AUTH MIDDLEWARE FOR ALL OTHER ROUTES
app.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  return authMiddleware(req, res, next);
});


// ✅ 2️⃣ IP RESTRICTION FOR NON-ADMIN USERS
app.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) return next(); // No IP check for login/signup/logout

  let clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  clientIp = clientIp.replace("::ffff:", "").toLowerCase();
  if (clientIp.includes("%")) clientIp = clientIp.split("%")[0];

  // Admin can access from anywhere
  if (req.user?.accountType === "admin") return next();

  // Employees must be from allowedIPs
  if (allowedIPs.includes(clientIp)) return next();

  return res.status(403).json({
    success: false,
    message: `Access denied: IP ${clientIp} not allowed`,
  });
});


// ROUTES
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);
app.use("/api/remarks", remarkRoutes);


// BASE ROUTE
app.get("/", (req, res) => {
  res.json({
    status: "SUCCESS",
    message: "Task Management API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});


// IP CHECK ROUTE
app.get("/check-ip", (req, res) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress?.replace("::ffff:", "");

  res.json({
    detectedIP: clientIp,
    allowedIPs: allowedIPs,
    message: "Use this IP to add to allowedIPs array if needed",
  });
});


// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
  });
});


// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS not allowed for this origin" });
  }
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  });
});

export default app;

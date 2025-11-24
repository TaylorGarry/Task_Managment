import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";
import remarkRoutes from "./routes/remark.routes.js";

dotenv.config();
const app = express();
app.set("trust proxy", true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------- CORS CONFIG ----------------------
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

// ---------------------- MIDDLEWARE ----------------------
app.use(express.json());

// ---------------------- API ROUTES ----------------------
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);
app.use("/api/remarks", remarkRoutes);

// ---------------------- SPA STATIC FILES ----------------------
app.use(express.static(path.join(__dirname, "dist")));

// Simple root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------------------- 404 HANDLER FOR API ROUTES ----------------------
// Safe 404 handler without problematic patterns
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ 
      message: "API route not found",
      path: req.originalUrl 
    });
  }
  next();
});

// Serve SPA for all other non-API, non-file routes
app.use((req, res) => {
  // Don't serve HTML for file requests
  if (req.originalUrl.includes('.')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});



// ---------------------- ERROR HANDLER ----------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS not allowed for this origin" });
  }
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

export default app;




// test.js - Minimal test application (ESM compatible)
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World! Test successful This is keshav singh.\n');
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log('If you see this, Node.js is working on Plesk with IISNode');
});

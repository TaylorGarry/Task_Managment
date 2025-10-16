import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js"
import taskRoutes from "./routes/task.routes.js"
import reviewRoutes from "./routes/review.routes.js"
import taskStatusRoutes from "./routes/taskStatus.routes.js"
const app = express();

const allowedOrigins = [
  "http://localhost:5173",      // for local dev
  "https://mydevtm.com"         // live frontend
];


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json());
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes)
// app.use("/api/tasks", taskRoutes);
// app.use("/api/reviews", reviewRoutes);

app.use("/api/v1/task-status", taskStatusRoutes);

app.use((err, req, res, next) => {
  if (err.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({ message: "CORS not allowed for this origin" });
  }
  return res.status(500).json({ message: "Internal Server Error", error: err.message });
});

export default app;
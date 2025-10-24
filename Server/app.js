// import express from "express";
// import cors from "cors";
// import authRoutes from "./routes/auth.routes.js"
// import taskRoutes from "./routes/task.routes.js"
// import reviewRoutes from "./routes/review.routes.js"
// import taskStatusRoutes from "./routes/taskStatus.routes.js"
// const app = express();

// // const allowedOrigins = [
// //   "http://localhost:5173",       
// //   "https://mydevtm.com"          
// // ];


// // app.use(cors({
// //   origin: "*",
// //   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
// //   allowedHeaders: ["Content-Type", "Authorization"],
// // }));


// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "https://task-managment-5.onrender.com"
// // ];

// app.use(cors({
//   origin: ["http://localhost:5173", "https://sweet-faun-a1e735.netlify.app","https://mydevtm.com"],
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true, 
// }));

// // app.use(
// //   cors({
// //     origin: function (origin, callback) {
// //       if (!origin || allowedOrigins.includes(origin)) {
// //         callback(null, true);
// //       } else {
// //         callback(new Error("CORS_NOT_ALLOWED"));
// //       }
// //     },
// //     credentials: true,
// //     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //   })
// // );


// app.options("*", cors());
// app.use(express.json());
// app.use("/api/v1", authRoutes);
// app.use("/api/v1/tasks", taskRoutes);
// app.use("/api/v1/review", reviewRoutes)
// app.use("/api/v1/task-status", taskStatusRoutes);

// app.use((err, req, res, next) => {
//   if (err.message === "CORS_NOT_ALLOWED") {
//     return res.status(403).json({ message: "CORS not allowed for this origin" });
//   }
//   return res.status(500).json({ message: "Internal Server Error", error: err.message });
// });

// export default app;





import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://sweet-faun-a1e735.netlify.app",
  "https://mydevtm.com",
];

// ✅ Register preflight (OPTIONS) *before* routes
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

// ✅ Handle preflight requests properly for all routes
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Then parse JSON and mount routes
app.use(express.json());
app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);

// ✅ Central error handler (optional)
app.use((err, req, res, next) => {
  if (err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS not allowed for this origin" });
  }
  console.error("Server Error:", err.message);
  return res.status(500).json({ message: "Internal Server Error", error: err.message });
});

export default app;

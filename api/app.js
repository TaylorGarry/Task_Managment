
// import express from "express";

// import cors from "cors";
// import dotenv from "dotenv";
// import http from "http";
// import { Server } from "socket.io";
// import fs from "fs";
// import path from "path";

// // Import routes
// import authRoutes from "./routes/auth.routes.js";
// import taskRoutes from "./routes/task.routes.js";
// import taskStatusRoutes from "./routes/taskStatus.routes.js";
// import remarkRoutes from "./routes/remark.routes.js";
// import rosterRoutes from "./routes/roster.routes.js";
// import chatRoutes from "./routes/chat.routes.js";
// import messageRoutes from "./routes/message.routes.js";
// import { authMiddleware } from "./Middlewares/auth.middleware.js";

// dotenv.config();
// const app = express();

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log('Created uploads directory:', uploadsDir);
// }

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.io with CORS configuration
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "https://crm.terranovasolutions.in",
//       "https://crm.fdbs.in",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Added more methods
//     credentials: true,
//   },
//   pingTimeout: 60000,
//   pingInterval: 25000,
//   connectionStateRecovery: {
//     maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
//     skipMiddlewares: true,
//   }
// });

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
//     allowedHeaders: ["Content-Type", "Authorization", "socket-id"], // Added socket-id
//     credentials: true,
//     exposedHeaders: ["socket-id"]
//   })
// );

// const allowedIPs = [
//   "182.71.112.82",
//   "182.75.147.210",
//   "14.97.83.226",
//   "127.0.0.1",
//   "103.21.187.189",
//   "::1",
// ];

// app.use(express.json());

// // Increase payload limit for file uploads
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Socket.io middleware to attach to requests
// app.use((req, res, next) => {
//   req.io = io; // Make io accessible in all controllers
//   next();
// });

// const publicRoutes = [
//   "/api/v1/login",
//   "/api/v1/signup",
//   "/api/v1/logout"
// ];

// app.use((req, res, next) => {
//   if (publicRoutes.includes(req.path)) {
//     return next();
//   }
//   return authMiddleware(req, res, next);
// });

// app.use((req, res, next) => {
//   if (publicRoutes.includes(req.path)) return next(); 

//   let clientIp =
//     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//     req.socket.remoteAddress;

//   clientIp = clientIp.replace("::ffff:", "").toLowerCase();
//   if (clientIp.includes("%")) clientIp = clientIp.split("%")[0];

//   if (req.user?.accountType === "admin" || req.user?.accountType === "superAdmin") return next();

//   if (allowedIPs.includes(clientIp)) return next();

//   return res.status(403).json({
//     success: false,
//     message: `Access denied: IP ${clientIp} not allowed`,
//   });
// });

// // Socket.io middleware with JWT authentication
// // Update the socket.io middleware section
// io.use(async (socket, next) => {
//   try {
//     console.log("Socket connection attempt:", {
//       auth: socket.handshake.auth,
//       query: socket.handshake.query,
//       headers: socket.handshake.headers
//     });

//     // Try to get userId from multiple sources
//     let userId = socket.handshake.auth.userId || 
//                  socket.handshake.query.userId;
    
//     // If we have userId, accept the connection
//     if (userId) {
//       socket.userId = userId;
//       console.log("✅ Socket authenticated for user:", userId);
//       return next();
//     }
    
//     // For development/testing, allow connection without userId
//     // You can remove this in production
//     console.log("⚠️ Socket connection without userId, allowing for development");
//     socket.userId = 'guest_' + Date.now();
//     next();
    
//   } catch (error) {
//     console.error("Socket middleware error:", error);
//     // Don't block connection, allow it for now
//     socket.userId = 'error_' + Date.now();
//     next();
//   }
// });


// const connectedUsers = new Map();

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.userId, "Socket ID:", socket.id);

//   // Store connection
//   connectedUsers.set(socket.userId, socket.id);
//   socket.join(socket.userId);

//   // Broadcast online status
//   socket.broadcast.emit("user_online", { userId: socket.userId });

//   // ---- JOIN CHAT ROOM ----
//   socket.on("join_chat", (chatId) => {
//     socket.join(chatId);
//     console.log(`User ${socket.userId} joined chat ${chatId}`);
//   });

//   // ---- LEAVE CHAT ----
//   socket.on("leave_chat", (chatId) => {
//     socket.leave(chatId);
//   });

//   // ---- TYPING INDICATOR ----
//   socket.on("typing", ({ chatId }) => {
//     socket.to(chatId).emit("user_typing", {
//       userId: socket.userId,
//       chatId
//     });
//   });

//   socket.on("stop_typing", ({ chatId }) => {
//     socket.to(chatId).emit("user_stop_typing", {
//       userId: socket.userId,
//       chatId
//     });
//   });

//   // ---- DELIVERED & SEEN STATUS ----
//   socket.on("message_delivered", ({ messageId, chatId, receiverId }) => {
//     socket.to(chatId).emit("message_status_update", {
//       messageId,
//       status: "delivered",
//       receiverId
//     });
//   });

//   socket.on("message_seen", ({ chatId, userId }) => {
//     socket.to(chatId).emit("message_status_update", {
//       chatId,
//       status: "seen",
//       userId
//     });
//   });

//   // FRONTEND WILL CALL message_seen WHEN USER OPENS CHAT
//   // Then backend will broadcast to other user

//   // ---- DISCONNECT ----
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.userId);
//     connectedUsers.delete(socket.userId);
//     socket.broadcast.emit("user_offline", { userId: socket.userId });
//   });

//   // ---- ONLINE USERS ----
//   socket.on("get_online_users", () => {
//     const online = Array.from(connectedUsers.keys());
//     socket.emit("online_users_list", online);
//   });
// });


// // Use routes
// app.use("/api/v1", authRoutes);
// app.use("/api/v1/tasks", taskRoutes);
// app.use("/api/v1/task-status", taskStatusRoutes);
// app.use("/api/remarks", remarkRoutes);
// app.use("/api/v1/roster", rosterRoutes);
// app.use("/api/chats", chatRoutes); // Chat routes
// app.use("/api/messages", messageRoutes); // Message routes

// // Health check routes
// app.get("/", (req, res) => {
//   res.json({
//     status: "SUCCESS",
//     message: "Task Management API is running with Socket.io!",
//     version: "1.0.0",
//     timestamp: new Date().toISOString(),
//     features: {
//       chat: true,
//       realtime: true,
//       fileUpload: true
//     }
//   });
// });

// app.get("/check-ip", (req, res) => {
//   const clientIp =
//     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//     req.socket.remoteAddress?.replace("::ffff:", "");

//   res.json({
//     detectedIP: clientIp,
//     allowedIPs: allowedIPs,
//     message: "Use this IP to add to allowedIPs array if needed",
//   });
// });

// // Health check for Socket.io
// app.get("/socket-health", (req, res) => {
//   const activeRooms = Array.from(io.sockets.adapter.rooms);
//   const chatRooms = activeRooms.filter(([roomId]) => roomId.startsWith('chat_') || roomId.length > 20); // Assuming chat IDs are long
  
//   res.json({
//     socket: {
//       connectedClients: io.engine.clientsCount,
//       activeRooms: activeRooms.length,
//       chatRooms: chatRooms.length,
//       connectedUsers: Array.from(connectedUsers.keys()),
//       status: "active"
//     }
//   });
// });

// // File upload test endpoint
// app.post("/api/test-upload", (req, res) => {
//   res.json({
//     message: "Upload endpoint is working",
//     uploadDir: uploadsDir,
//     exists: fs.existsSync(uploadsDir)
//   });
// });

// // Cleanup temp files periodically (optional)
// setInterval(() => {
//   const now = Date.now();
//   const maxAge = 30 * 60 * 1000; // 30 minutes
  
//   if (fs.existsSync(uploadsDir)) {
//     fs.readdir(uploadsDir, (err, files) => {
//       if (err) return;
      
//       files.forEach(file => {
//         const filePath = path.join(uploadsDir, file);
//         fs.stat(filePath, (err, stats) => {
//           if (err) return;
          
//           if (now - stats.mtimeMs > maxAge) {
//             fs.unlink(filePath, (err) => {
//               if (!err) console.log(`Cleaned up old file: ${file}`);
//             });
//           }
//         });
//       });
//     });
//   }
// }, 60 * 60 * 1000); // Run every hour

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     error: "API endpoint not found",
//     path: req.originalUrl,
//     method: req.method,
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err.message);
//   console.error("Stack:", err.stack);
  
//   if (err.message.includes("CORS")) {
//     return res.status(403).json({ 
//       success: false,
//       message: "CORS not allowed for this origin" 
//     });
//   }
  
//   if (err.name === "MulterError") {
//     return res.status(400).json({
//       success: false,
//       message: "File upload error",
//       error: err.message
//     });
//   }
  
//   res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//     error: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
//   });
// });

// export { app, io, server };
// export default server;


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import taskStatusRoutes from "./routes/taskStatus.routes.js";
import remarkRoutes from "./routes/remark.routes.js";
import rosterRoutes from "./routes/roster.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";
import pushRoutes from "./routes/push.routes.js";
import { authMiddleware } from "./Middlewares/auth.middleware.js";

dotenv.config();
const app = express();

const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://crm.terranovasolutions.in",
      "https://crm.fdbs.in",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,  
    skipMiddlewares: true,
  }
});

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
    allowedHeaders: ["Content-Type", "Authorization", "socket-id"],
    credentials: true,
    exposedHeaders: ["socket-id"]
  })
);

const allowedIPs = [
  "182.71.112.82",
  "182.75.147.210",
  "14.97.83.226",
  "127.0.0.1",
  "103.21.187.189",
  "::1",
];

app.use(express.json());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  req.io = io;  
  next();
});

const publicRoutes = [
  "/api/v1/login",
  "/api/v1/signup",
  "/api/v1/logout"
];
const ipFreeRoutes = [
  "/api/v1/push/subscribe"
];

app.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  return authMiddleware(req, res, next);
});

app.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) return next(); 
  if (ipFreeRoutes.includes(req.path)) return next(); 

  let clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  clientIp = clientIp.replace("::ffff:", "").toLowerCase();
  if (clientIp.includes("%")) clientIp = clientIp.split("%")[0];

  if (req.user?.accountType === "admin" || req.user?.accountType === "superAdmin") return next();

  if (allowedIPs.includes(clientIp)) return next();

  return res.status(403).json({
    success: false,
    message: `Access denied: IP ${clientIp} not allowed`,
  });
});

io.use(async (socket, next) => {
  try {
    console.log("🔐 Socket connection attempt:", {
      auth: socket.handshake.auth,
      query: socket.handshake.query
    });

    let userId = socket.handshake.auth.userId || 
                 socket.handshake.query.userId;
    
    if (userId === "undefined" || userId === "null") {
      console.log("⚠️ Invalid userId format, setting as anonymous");
      userId = null;
    }
    
    if (userId) {
      socket.userId = userId;
      console.log("✅ Socket authenticated for user:", userId);
      return next();
    }
    
    console.log("⚠️ Socket connection without valid userId, allowing as anonymous");
    socket.userId = 'anonymous_' + Date.now();
    next();
    
  } catch (error) {
    console.error("❌ Socket middleware error:", error);
    socket.userId = 'error_' + Date.now();
    next();
  }
});

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.userId, "Socket ID:", socket.id);

  connectedUsers.set(socket.userId, socket.id);
  socket.join(socket.userId);

  socket.broadcast.emit("user_online", { userId: socket.userId });

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`📥 User ${socket.userId} joined chat ${chatId}`);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`📤 User ${socket.userId} left chat ${chatId}`);
  });

  socket.on("typing", ({ chatId }) => {
    socket.to(chatId).emit("user_typing", {
      userId: socket.userId,
      chatId
    });
  });

  socket.on("stop_typing", ({ chatId }) => {
    socket.to(chatId).emit("user_stop_typing", {
      userId: socket.userId,
      chatId
    });
  });

  socket.on("message_edited", (data) => {
    console.log(`✏️ User ${socket.userId} editing message ${data.messageId} in chat ${data.chatId}`);
    
    socket.to(data.chatId).emit("message_edited", {
      ...data,
      editedBy: socket.userId,
      editedAt: new Date()
    });
  });

  socket.on("message_deleted", (data) => {
    console.log(`🗑️ User ${socket.userId} deleting message ${data.messageId} in chat ${data.chatId}`);
    
    socket.to(data.chatId).emit("message_deleted", {
      ...data,
      deletedBy: socket.userId,
      deletedAt: new Date()
    });
  });

  socket.on("message_reaction", (data) => {
    console.log(`❤️ User ${socket.userId} reacted to message ${data.messageId} in chat ${data.chatId}`);
    
    socket.to(data.chatId).emit("message_reaction", {
      ...data,
      reactedBy: socket.userId,
      reactedAt: new Date()
    });
  });

  socket.on("message_delivered", ({ messageId, chatId, receiverId }) => {
    socket.to(chatId).emit("message_status_update", {
      messageId,
      status: "delivered",
      receiverId
    });
  });

  socket.on("message_seen", ({ chatId, userId }) => {
    socket.to(chatId).emit("message_status_update", {
      chatId,
      status: "seen",
      userId
    });
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.userId);
    connectedUsers.delete(socket.userId);
    socket.broadcast.emit("user_offline", { userId: socket.userId });
  });

  socket.on("get_online_users", () => {
    const online = Array.from(connectedUsers.keys());
    socket.emit("online_users_list", online);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

app.use("/api/v1", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/task-status", taskStatusRoutes);
app.use("/api/remarks", remarkRoutes);
app.use("/api/v1/roster", rosterRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/v1/push", pushRoutes);


app.get("/", (req, res) => {
  res.json({
    status: "SUCCESS",
    message: "Task Management API is running with Socket.io!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    features: {
      chat: true,
      realtime: true,
      fileUpload: true,
      messageEdit: true,
      messageDelete: true,
      reactions: true
    }
  });
});

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

app.get("/socket-debug", (req, res) => {
  const sockets = Array.from(io.sockets.sockets.values());
  const rooms = Array.from(io.sockets.adapter.rooms.entries());
  
  res.json({
    totalConnections: sockets.length,
    connections: sockets.map(socket => ({
      id: socket.id,
      userId: socket.userId,
      connectedAt: socket.handshake.issued,
      rooms: Array.from(socket.rooms),
      handshake: {
        auth: socket.handshake.auth,
        query: socket.handshake.query
      }
    })),
    activeRooms: rooms.map(([roomId, socketIds]) => ({
      roomId,
      memberCount: socketIds.size,
      isChatRoom: roomId.length === 24 || roomId.startsWith('chat_')
    })),
    connectedUsers: Array.from(connectedUsers.entries()).map(([userId, socketId]) => ({
      userId,
      socketId
    }))
  });
});

app.get("/socket-health", (req, res) => {
  const activeRooms = Array.from(io.sockets.adapter.rooms);
  const chatRooms = activeRooms.filter(([roomId]) => 
    roomId.length === 24 ||  
    roomId.startsWith('chat_') || 
    /^[0-9a-fA-F]{24}$/.test(roomId)  
  );
  
  res.json({
    socket: {
      connectedClients: io.engine.clientsCount,
      activeRooms: activeRooms.length,
      chatRooms: chatRooms.length,
      connectedUsers: Array.from(connectedUsers.keys()),
      connectedUsersCount: connectedUsers.size,
      status: "active"
    }
  });
});

app.post("/api/test-upload", (req, res) => {
  res.json({
    message: "Upload endpoint is working",
    uploadDir: uploadsDir,
    exists: fs.existsSync(uploadsDir)
  });
});

setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000;  
  
  if (fs.existsSync(uploadsDir)) {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (now - stats.mtimeMs > maxAge) {
            fs.unlink(filePath, (err) => {
              if (!err) console.log(`🧹 Cleaned up old temp file: ${file}`);
            });
          }
        });
      });
    });
  }
}, 60 * 60 * 1000); 
app.use((req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error("Stack:", err.stack);
  
  if (err.message.includes("CORS")) {
    return res.status(403).json({ 
      success: false,
      message: "CORS not allowed for this origin" 
    });
  }
  
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  });
});

export { app, io, server };
export default server;
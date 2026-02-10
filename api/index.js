import "dotenv/config";
import app from "./app.js";
import connectDB from "./DB/connnection.js"; 
import "./jobs/shiftNotification.job.js"; 
import Task from "./Modals/Task.modal.js";
import TaskStatus from "./Modals/TaskStatus.modal.js";

connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected");

    try {
      await Task.syncIndexes();
      await TaskStatus.syncIndexes();
      console.log("✅ Indexes synced successfully");
    } catch (err) {
      console.error("❌ Error syncing indexes:", err);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

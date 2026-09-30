import "dotenv/config";
import app from "./app.js";
import connectDB from "./DB/connnection.js"; 
import "./jobs/shiftNotification.job.js"; 
import Task from "./Modals/Task.modal.js";
import TaskStatus from "./Modals/TaskStatus.modal.js";

// Disable noisy debug logs across the API.
// Set `DISABLE_CONSOLE_LOG=false` to re-enable.
const disableConsoleLog = String(process.env.DISABLE_CONSOLE_LOG ?? "true").toLowerCase();
if (disableConsoleLog === "true" || disableConsoleLog === "1" || disableConsoleLog === "yes") {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

connectDB()
  .then(async () => {
    try {
      await Task.syncIndexes();
      await TaskStatus.syncIndexes();
    } catch (err) {
      console.error("❌ Error syncing indexes:", err);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// import "dotenv/config";
// import app from "./app.js";
// import connectDB from "./DB/connnection.js"; 
// import "./jobs/shiftNotification.job.js"; 
// import Task from "./Modals/Task.modal.js";
// import TaskStatus from "./Modals/TaskStatus.modal.js";
// import { Message } from "./Modals/Message.modal.js";
// import Kra from "./Modals/Kra.modal.js";
// import Announcement from "./Modals/Announcement.modal.js";
// // Disable noisy debug logs across the API.
// // Set `DISABLE_CONSOLE_LOG=false` to re-enable.
// const disableConsoleLog = String(process.env.DISABLE_CONSOLE_LOG ?? "true").toLowerCase();
// if (disableConsoleLog === "true" || disableConsoleLog === "1" || disableConsoleLog === "yes") {
//   // eslint-disable-next-line no-console
//   console.log = () => {};
// }

// connectDB()
//   .then(async () => {
//     try {
//       await Task.syncIndexes();
//       await TaskStatus.syncIndexes();
//       await Message.syncIndexes();

//     } catch (err) {
//       console.error("❌ Error syncing indexes:", err);
//     }

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//     });
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//   });




import "dotenv/config";
import app from "./app.js";
import connectDB from "./DB/connnection.js"; 
import "./jobs/shiftNotification.job.js"; 
import Task from "./Modals/Task.modal.js";
import TaskStatus from "./Modals/TaskStatus.modal.js";
import { Message } from "./Modals/Message.modal.js";
import Kra from "./Modals/Kra.modal.js";
import Announcement from "./Modals/Announcement.modal.js";
import "./jobs/punchAutoLogout.job.js";
import "./jobs/employeeExit.job.js";
import EmployeeExit from "./Modals/EmployeeExit.modal.js";
import EmployeeExitITChecklist from "./Modals/EmployeeExitITChecklist.modal.js";
import EmployeeExitHRChecklist from "./Modals/EmployeeExitHRChecklist.modal.js";
import EmployeeExitAuditLog from "./Modals/EmployeeExitAuditLog.modal.js";
import EmployeeExitNotification from "./Modals/EmployeeExitNotification.modal.js";
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
      await Message.syncIndexes();
      await Kra.syncIndexes();
      await Announcement.syncIndexes();
      await EmployeeExit.syncIndexes();
      await EmployeeExitITChecklist.syncIndexes();
      await EmployeeExitHRChecklist.syncIndexes();
      await EmployeeExitAuditLog.syncIndexes();
      await EmployeeExitNotification.syncIndexes();
      
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

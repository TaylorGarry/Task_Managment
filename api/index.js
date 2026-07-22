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
import User from "./Modals/User.modal.js";
import bcrypt from "bcrypt";
// Disable noisy debug logs across the API.
// Set `DISABLE_CONSOLE_LOG=false` to re-enable.
const disableConsoleLog = String(process.env.DISABLE_CONSOLE_LOG ?? "true").toLowerCase();
if (disableConsoleLog === "true" || disableConsoleLog === "1" || disableConsoleLog === "yes") {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

const ensureFloorStatusAccount = async () => {
  const username = "FloorStatus";
  const existing = await User.findOne({ username });
  if (existing) {
    const updates = {};
    if (existing.accountType !== "floorStatus") updates.accountType = "floorStatus";
    if (existing.isActive === false) updates.isActive = true;
    if (existing.active === false) updates.active = true;
    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: existing._id }, { $set: updates });
    }
    return;
  }

  const password = String(process.env.FLOOR_STATUS_PASSWORD || "FloorStatus@123");
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    username,
    password: hashedPassword,
    accountType: "floorStatus",
    department: "Operations",
    isCoreTeam: true,
    isTeamLeader: false,
    isActive: true,
    active: true,
    realName: "Floor Status",
    pseudoName: "FloorStatus",
  });
};

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
      await ensureFloorStatusAccount();
      
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

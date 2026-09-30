// import cron from "node-cron";
// import ShiftNotification from "../Modals/ShiftNotification.modal.js";
// import TaskStatus from "../Modals/TaskStatus.modal.js";
// import PushSubscription from "../utils/PushSubscription.js";
// import webpush from "web-push";
// import { getISTime, getShiftWindow } from "../utils/shiftCalculator.js";

// webpush.setVapidDetails(
//   process.env.VAPID_SUBJECT,
//   process.env.PUBLIC_KEY,
//   process.env.PRIVATE_KEY
// );

// console.log("VAPID CHECK", {
//   subject: process.env.VAPID_SUBJECT,
//   publicKey: !!process.env.PUBLIC_KEY,
//   privateKey: !!process.env.PRIVATE_KEY,
// });

// cron.schedule("*/5 * * * *", async () => {
//   try {
//     console.log("\n" + "=".repeat(60));

//     // USE IST TIME, NOT UTC
//     const now = getISTime();
//     console.log(`🔔 [${now.toLocaleString('en-IN')}] CRON STARTED`);

//     // ========== DEBUG: SPECIFICALLY CHECK KESHAV'S TASK ==========
//     console.log("\n🔍 CHECKING KESHAV'S SPECIFIC TASK:");

//     const keshavTask = await TaskStatus.findOne({
//       _id: "6984bdbabe21948db8d751f3"  // Your specific task ID
//     }).populate("taskId employeeId");

//     if (!keshavTask) {
//       console.log("❌ Task 6984bdbabe21948db8d751f3 not found in database!");
//     } else {
//       console.log("✅ Found keshav's task");
//       console.log(`   Employee: ${keshavTask.employeeId?.username || 'NO EMPLOYEE'}`);
//       console.log(`   Task: ${keshavTask.taskId?.title || 'NO TASK'}`);
//       console.log(`   Task Shift: ${keshavTask.taskId?.shift || 'NO SHIFT'}`);
//       console.log(`   Date from DB: ${keshavTask.date.toLocaleString('en-IN')}`);
//       console.log(`   Date ISO: ${keshavTask.date.toISOString()}`);
//       console.log(`   Status: "${keshavTask.status}"`);
//       console.log(`   notified80: ${keshavTask.notified80}`);

//       // Check shift timings
//       console.log(`\n   👤 Employee Shift Info:`);
//       console.log(`      Shift Start Hour: ${keshavTask.employeeId?.shiftStartHour}`);
//       console.log(`      Shift End Hour: ${keshavTask.employeeId?.shiftEndHour}`);
//       console.log(`      Employee Shift: ${keshavTask.employeeId?.shift}`);

//       // Check push subscription
//       const keshavSub = await PushSubscription.findOne({
//         userId: keshavTask.employeeId?._id
//       });
//       console.log(`\n   📱 Push Subscription:`);
//       console.log(`      Has subscription: ${!!keshavSub}`);

//       // Calculate shift WITH DEBUG
//       if (keshavTask.taskId?.shift) {
//         console.log(`\n   🔧 Calling getShiftWindow():`);
//         console.log(`      Employee: ${keshavTask.employeeId?.username}`);
//         console.log(`      Task Date: ${keshavTask.date.toLocaleString('en-IN')}`);
//         console.log(`      Shift: ${keshavTask.taskId.shift}`);

//         const window = getShiftWindow(
//           keshavTask.employeeId,
//           keshavTask.date,
//           keshavTask.taskId.shift
//         );

//         if (window) {
//           const total = window.end - window.start;
//           const passed = now - window.start;
//           const percentage = (passed / total) * 100;

//           console.log(`\n   ⏰ Shift Calculation:`);
//           console.log(`      Start: ${window.start.toLocaleString('en-IN')}`);
//           console.log(`      End: ${window.end.toLocaleString('en-IN')}`);
//           console.log(`      Duration: ${(total/(1000*60*60)).toFixed(1)} hours`);
//           console.log(`      Elapsed: ${(passed/(1000*60)).toFixed(0)} minutes`);
//           console.log(`      Percentage: ${percentage.toFixed(1)}%`);
//           console.log(`      80-85% window? ${percentage >= 80 && percentage < 85 ? '✅ YES' : '❌ NO'}`);

//           // FORCE TEST NOTIFICATION
//           const FORCE_TEST = true;
//           if (FORCE_TEST && keshavSub) {
//             console.log(`\n   🧪 FORCE TEST: Sending notification at ${percentage.toFixed(1)}%...`);
//             try {
//               await webpush.sendNotification(
//                 keshavSub.subscription,
//                 JSON.stringify({
//                   title: "🧪 FORCE TEST - Shift Reminder",
//                   body: `FORCE TEST: ${percentage.toFixed(1)}% complete - "${keshavTask.taskId.title}"`,
//                   url: '/dashboard/tasks',
//                   taskId: keshavTask.taskId._id.toString(),
//                   icon: '/logo.png'
//                 })
//               );
//               console.log("   ✅ Force test notification sent!");

//               // Update notified80
//               keshavTask.notified80 = true;
//               await keshavTask.save();
//               console.log("   ✅ Updated notified80: true");

//             } catch (err) {
//               console.error("   ❌ Push failed:", err.statusCode, err.message);
//             }
//           }
//         } else {
//           console.log("   ❌ Could not calculate shift window!");
//         }
//       }
//     }

//     console.log("\n" + "=".repeat(60));

//     // ========== ORIGINAL CRON LOGIC (with extra debug) ==========
//     console.log(`\n🔍 CHECKING ALL PENDING TASKS...`);

//     // Get today's date in IST for filtering
//     const today = new Date(now);
//     today.setHours(0, 0, 0, 0);

//     const pendingStatuses = await TaskStatus.find({
//       status: "",
//       notified80: false,
//       // date: { $gte: today }  
//     }).populate("taskId employeeId");

//     console.log(`Found ${pendingStatuses.length} total pending task statuses`);

//     // List all found tasks
//     if (pendingStatuses.length > 0) {
//       console.log("\n📋 ALL PENDING TASKS:");
//       pendingStatuses.forEach((status, index) => {
//         console.log(`\n   [${index+1}] ${status.employeeId?.username || 'NO USER'}:`);
//         console.log(`       Task: ${status.taskId?.title || 'NO TASK'}`);
//         console.log(`       Shift: ${status.taskId?.shift || 'NO SHIFT'}`);
//         console.log(`       Date: ${status.date.toLocaleDateString('en-IN')}`);
//         console.log(`       Date ISO: ${status.date.toISOString()}`);
//         console.log(`       ID: ${status._id}`);
//       });
//     }

//     let notificationsSent = 0;
//     let skippedCount = 0;

//     for (const status of pendingStatuses) {
//       const task = status.taskId;
//       const employee = status.employeeId;

//       if (!task || !employee) {
//         console.warn(`Skipping ${status._id} - missing task or employee`);
//         skippedCount++;
//         continue;
//       }

//       // Skip if employee doesn't have shift timings
//       if (!employee.shiftStartHour || !employee.shiftEndHour) {
//         console.warn(`Skipping ${employee.username} - no shift timings`);
//         skippedCount++;
//         continue;
//       }

//       const taskDate = status.date;
//       console.log(`\n📅 Processing ${employee.username}:`);
//       console.log(`   Task date from DB: ${taskDate.toLocaleString('en-IN')}`);
//       console.log(`   Task date ISO: ${taskDate.toISOString()}`);
//       console.log(`   Today's date: ${new Date().toLocaleString('en-IN')}`);

//       const window = getShiftWindow(employee, taskDate, task.shift);

//       if (!window) {
//         console.warn(`Skipping ${employee.username} - no shift window for ${task.shift}`);
//         skippedCount++;
//         continue;
//       }

//       // Calculate elapsed time using IST
//       const total = window.end - window.start;
//       const passed = now - window.start;

//       // Check if shift is in progress
//       if (passed < 0) {
//         console.log(`${employee.username} - shift hasn't started yet`);
//         skippedCount++;
//         continue;
//       }

//       if (passed >= total) {
//         console.log(`${employee.username} - shift already ended`);
//         status.notified80 = true;
//         await status.save();
//         skippedCount++;
//         continue;
//       }

//       const percentage = (passed / total) * 100;
//       console.log(`${employee.username} - ${task.title}: ${percentage.toFixed(1)}%`);

//       // TEMPORARY TEST: Change from 80% to 1% for immediate testing
//       // if (percentage >= 80 && percentage < 85) {
//       if (percentage >= 1 && percentage < 5) { // TEST MODE - triggers immediately
//         const sub = await PushSubscription.findOne({
//           userId: employee._id,
//         });

//         if (!sub) {
//           console.warn(`No push subscription for ${employee.username}`);
//           skippedCount++;
//           continue;
//         }

//         try {
//           console.log(`📨 Sending test notification to ${employee.username}...`);

//           await webpush.sendNotification(
//             sub.subscription,
//             JSON.stringify({
//               title: `🧪 TEST - ${task.shift} Shift`,
//               body: `TEST: ${percentage.toFixed(1)}% complete - "${task.title}"`,
//               url: '/dashboard/tasks',
//               taskId: task._id.toString(),
//               icon: '/logo.png'
//             })
//           );

//           status.notified80 = true;
//           await status.save();
//           notificationsSent++;

//           console.log(`✅ Notification sent to ${employee.username}`);

//         } catch (err) {
//           console.error(`❌ Push failed for ${employee.username}:`, err.statusCode);

//           if (err.statusCode === 410 || err.statusCode === 404) {
//             await PushSubscription.deleteOne({ _id: sub._id });
//             console.log(`Removed invalid subscription for ${employee.username}`);
//           }
//         }
//       } else {
//         console.log(`   (Not in 1-5% window: ${percentage.toFixed(1)}%)`);
//         skippedCount++;
//       }
//     }

//     console.log(`\n📊 SUMMARY:`);
//     console.log(`   Total pending: ${pendingStatuses.length}`);
//     console.log(`   Notifications sent: ${notificationsSent}`);
//     console.log(`   Skipped: ${skippedCount}`);
//     console.log(`   ✅ Check completed at ${now.toLocaleString('en-IN')}`);
//     console.log("\n" + "=".repeat(60) + "\n");

//   } catch (error) {
//     console.error("❌ Cron job error:", error);
//   }
// });

// console.log("✅ Shift reminder cron job scheduled to run every 5 minutes");

import cron from "node-cron";
import ShiftNotification from "../Modals/ShiftNotification.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import PushSubscription from "../utils/PushSubscription.js";
import webpush from "web-push";
import { getISTime, getShiftWindow } from "../utils/shiftCalculator.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY
);

console.log("✅ Shift notification cron loaded");

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("\n" + "=".repeat(60));

    const now = getISTime();
    console.log(`⏰ [${now.toLocaleString("en-IN")}] CRON STARTED`);

    // ─────────────────────────────────────
    // STEP 1: Get today's task statuses
    // ─────────────────────────────────────
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const taskStatuses = await TaskStatus.find({
      date: { $gte: today },
    }).populate("employeeId taskId");

    console.log(`📦 TaskStatus fetched: ${taskStatuses.length}`);

    // ─────────────────────────────────────
    // STEP 2: Build unique (employee + shift)
    // ─────────────────────────────────────
    const shiftMap = new Map();

    for (const status of taskStatuses) {
      const employee = status.employeeId;
      const shift = status.taskId?.shift;

      if (!employee || !shift) continue;

      const key = `${employee._id}_${shift}_${today.toISOString()}`;

      if (!shiftMap.has(key)) {
        shiftMap.set(key, {
          employee,
          shift,
          date: today,
        });
      }
    }

    console.log(`🧠 Unique shifts detected: ${shiftMap.size}`);

    // ─────────────────────────────────────
    // STEP 3: Process each shift ONCE
    // ─────────────────────────────────────
    for (const [key, data] of shiftMap.entries()) {
      const { employee, shift, date } = data;

      console.log(`\n👤 Processing ${employee.username} | Shift: ${shift}`);

      // Skip if already notified
      const alreadyNotified = await ShiftNotification.findOne({
        employeeId: employee._id,
        shift,
        date,
      });

      if (alreadyNotified) {
        console.log("⏭️ Already notified for this shift");
        continue;
      }
      const window = getShiftWindow(employee, date, shift);

      if (!window) {
        console.log("❌ Shift window not found");
        continue;
      }

      const total = window.end - window.start;
      const passed = now - window.start;

      if (passed < 0 || passed >= total) {
        console.log("⏭️ Shift not active");
        continue;
      }

      const percentage = (passed / total) * 100;
      console.log(`📊 Shift progress: ${percentage.toFixed(1)}%`);

      // 🔔 PRODUCTION RANGE: 80–85%
      // 🧪 TEST RANGE: 1–5%
      if (percentage < 80 || percentage >= 85) {
        console.log("⏭️ Not in 80% window");
        continue;
      }

      // Get push subscription
      const sub = await PushSubscription.findOne({
        userId: employee._id,
      });

      if (!sub) {
        console.log("❌ No push subscription");
        continue;
      }
      try {
        console.log("📨 Sending push notification...");

        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: "⏰ Shift Alert",
            body: "80% of your shift time has passed.",
            url: "/dashboard",
            icon: "/logo.png",
          })
        );

        await ShiftNotification.create({
          employeeId: employee._id,
          shift,
          date,
          notifiedAt: now,
        });

        console.log("✅ Notification sent & saved");

      } catch (err) {
        console.error("❌ Push failed:", err.statusCode);

        if ([404, 410].includes(err.statusCode)) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log("🧹 Invalid subscription removed");
        }
      }
    }

    console.log("\n✅ CRON FINISHED");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ CRON ERROR:", error);
  }
});

console.log("🚀 Shift reminder cron scheduled (every 5 minutes)");

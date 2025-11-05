import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import XLSX from "xlsx-js-style";
import fs from "fs";
import NodeCache from "node-cache";

// const getShiftDate = () => {
//   const now = new Date();

//   // Convert to US time (UTC-4)
//   const usOffset = -4 * 60; // minutes
//   const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//   const usTime = new Date(utc + usOffset * 60000);

//   // Define shift hours
//   const shiftStartHour = 16; // 4 PM
//   const shiftEndHour = 10;   // 10 AM (next day)

//   let shiftDate = new Date(usTime);

//   if (usTime.getHours() < shiftEndHour) {
//     shiftDate.setDate(shiftDate.getDate() - 1);
//   }

//   shiftDate.setHours(0, 0, 0, 0);

//   return shiftDate;
// };

const getISTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60; // +5:30 IST offset in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + istOffset * 60000);
};

const getShiftDate = () => {
  const ist = getISTime();
  const hour = ist.getHours();

  // ✅ If time is before 10 AM IST, treat as previous day's shift
  const shiftDate = new Date(ist);
  if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);

  shiftDate.setHours(0, 0, 0, 0);
  return shiftDate;
};

const getShiftTimeRange = (shift) => {
  const now = new Date();
  const shiftStart = new Date(now);
  const shiftEnd = new Date(now);

  if (shift === "Start") {
    shiftStart.setHours(1, 0, 0, 0);   // 1 AM
    shiftEnd.setHours(10, 0, 0, 0);    // 10 AM

    // if time is before 1 AM → treat as previous day's shift
    if (now.getHours() < 1) {
      shiftStart.setDate(shiftStart.getDate() - 1);
      shiftEnd.setDate(shiftEnd.getDate() - 1);
    }
  } else if (shift === "End") {
    shiftStart.setHours(17, 0, 0, 0);  // 5 PM
    shiftEnd.setHours(23, 59, 59, 999); // Midnight
  } else {
    // Default fallback (for departments without shift)
    shiftStart.setHours(0, 0, 0, 0);
    shiftEnd.setHours(23, 59, 59, 999);
  }

  return { shiftStart, shiftEnd };
};


// const getShiftDate = () => {
//   const now = new Date();

//   // Convert to US time (UTC-4)
//   const usOffset = -4 * 60; // UTC-4 in minutes
//   const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//   const usTime = new Date(utc + usOffset * 60000);

//   // Updated shift hours
//   const shiftStartHour = 12; // ⏰ 12 PM (noon) US time (was 16)
//   const shiftEndHour = 10;   // 10 AM next day

//   let shiftDate = new Date(usTime);

//   // If current US time is before 10 AM, count as previous shift
//   if (usTime.getHours() < shiftEndHour) {
//     shiftDate.setDate(shiftDate.getDate() - 1);
//   }

//   shiftDate.setHours(0, 0, 0, 0);

//   return shiftDate;
// };
export const createTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can create tasks" });

    const { title, description, shift, department, assignedTo, deadline, priority } = req.body;

    if (!title || !shift || !department)
      return res.status(400).json({ message: "Title, shift, and department are required" });

    let employees = [];
    if (assignedTo?.length) {
      employees = await User.find({ _id: { $in: assignedTo }, department, accountType: "employee" });
    } else {
      employees = await User.find({ department, accountType: "employee" });
    }

    if (employees.length === 0)
      return res.status(404).json({ message: "No valid employees found in department" });

    const newTask = await Task.create({
      title,
      description,
      shift,
      department,
      assignedTo: employees.map((e) => e._id),
      createdBy: req.user.id,
      deadline,
      priority,
      statusUnlocked: false,
    });

    const today = getShiftDate();
    const statuses = employees.map((emp) => ({
      taskId: newTask._id,
      employeeId: emp._id,
      date: today,
      status: "Not Done",
    }));
    await TaskStatus.insertMany(statuses);

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// export const getTasks = async (req, res) => {
//   try {
//     const { date, shift, department, employeeId } = req.query;

//     const filter = {};
//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//       if (shift) filter.shift = shift;
//     } else {
//       if (shift) filter.shift = shift;
//       if (department) filter.department = department;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     const tasks = await Task.find(filter).populate("assignedTo", "username department");

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const enrichedTasks = await Promise.all(
//       tasks.map(async (task) => {
//         const taskCreatedDate = new Date(task.createdAt);
//         taskCreatedDate.setHours(0, 0, 0, 0);

//         let start, end;

//         if (date) {
//           const selectedDate = new Date(date);
//           selectedDate.setHours(0, 0, 0, 0);

//           if (selectedDate < taskCreatedDate || selectedDate > today) return null;

//           start = selectedDate;
//           end = new Date(selectedDate);
//           end.setHours(23, 59, 59, 999);
//         } else {
//           start = taskCreatedDate > today ? today : taskCreatedDate;
//           end = new Date(start);
//           end.setHours(23, 59, 59, 999);
//         }

//         const statuses = await TaskStatus.find({
//           taskId: task._id,
//           date: { $gte: start, $lte: end },
//         }).populate("employeeId", "username");

//         const doneEmployees = [];
//         const notDoneEmployees = [];
//         let employeeStatus = "Not Done";

//         for (const s of statuses) {
//           const username = s.employeeId?.username || "Unknown";

//           if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
//           else notDoneEmployees.push({ _id: s.employeeId._id, username });

//           if (s.employeeId._id.toString() === req.user.id) {
//             employeeStatus = s.status;
//           }
//         }

//         const assignedWithoutStatus = task.assignedTo
//           .filter((emp) => !statuses.some((s) => s.employeeId._id.toString() === emp._id.toString()))
//           .map((emp) => ({ _id: emp._id, username: emp.username }));

//         notDoneEmployees.push(...assignedWithoutStatus);

//         return {
//           ...task.toObject(),
//           employeeStatus,
//           doneEmployees,
//           notDoneEmployees,
//           date: start,
//         };
//       })
//     );
//     const filteredTasks = enrichedTasks.filter((t) => t !== null);
//     res.status(200).json(filteredTasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

//this is working one currently=====>>>>>>>
// export const getTasks = async (req, res) => {
//   try {
//     const { startDate, endDate, shift, department, employeeId } = req.query;

//     // 🔹 Helper: Convert current UTC time to IST
//     const getISTime = () => {
//       const now = new Date();
//       const istOffset = 5.5 * 60; // +5:30 IST offset in minutes
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + istOffset * 60000);
//     };

//     // 🔹 Helper: Get current "shift date" (before 10 AM → previous day)
//     const getShiftDate = () => {
//       const ist = getISTime();
//       const hour = ist.getHours();

//       const shiftDate = new Date(ist);
//       if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);

//       shiftDate.setHours(0, 0, 0, 0);
//       return shiftDate;
//     };

//     // 🧭 Role-based filters
//     const filter = {};
//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//       if (shift) filter.shift = shift;
//     } else {
//       if (shift) filter.shift = shift;
//       if (department) filter.department = department;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     const tasks = await Task.find(filter).populate("assignedTo", "username department");

//     // 🔹 Determine start and end dates
//     const todayShiftDate = getShiftDate();
//     const start = startDate ? new Date(startDate) : new Date(todayShiftDate);
//     const end = endDate ? new Date(endDate) : new Date(todayShiftDate);

//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     // 🔹 Build date range array
//     const dateRange = [];
//     const tempDate = new Date(start);
//     while (tempDate <= end) {
//       dateRange.push(new Date(tempDate));
//       tempDate.setDate(tempDate.getDate() + 1);
//     }

//     // 🔹 Enrich tasks with status per day
//     const enrichedTasks = [];

//     for (const task of tasks) {
//       const taskCreatedDate = new Date(task.createdAt);
//       taskCreatedDate.setHours(0, 0, 0, 0);

//       for (const date of dateRange) {
//         // ⛔ Skip if date is before the task was created
//         if (date < taskCreatedDate) continue;

//         const nextDay = new Date(date);
//         nextDay.setHours(23, 59, 59, 999);

//         const statuses = await TaskStatus.find({
//           taskId: task._id,
//           date: { $gte: date, $lte: nextDay },
//         }).populate("employeeId", "username");

//         const doneEmployees = [];
//         const notDoneEmployees = [];
//         let employeeStatus = "Not Done";

//         for (const s of statuses) {
//           const username = s.employeeId?.username || "Unknown";
//           if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
//           else notDoneEmployees.push({ _id: s.employeeId._id, username });

//           if (s.employeeId._id.toString() === req.user.id) {
//             employeeStatus = s.status;
//           }
//         }

//         // Employees who haven’t updated yet
//         const assignedWithoutStatus = task.assignedTo
//           .filter(
//             (emp) =>
//               !statuses.some((s) => s.employeeId._id.toString() === emp._id.toString())
//           )
//           .map((emp) => ({ _id: emp._id, username: emp.username }));

//         notDoneEmployees.push(...assignedWithoutStatus);

//         enrichedTasks.push({
//           ...task.toObject(),
//           employeeStatus,
//           doneEmployees,
//           notDoneEmployees,
//           date, // store the date for which this entry is shown
//         });
//       }
//     }

//     res.status(200).json(enrichedTasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



//this is for fast response======>>>>>>>>>
const cache = new NodeCache({ stdTTL: 60 }); // Cache results for 60 seconds

export const getTasks = async (req, res) => {
  try {
    const { startDate, endDate, shift, department, employeeId, page = 1, limit = 20 } = req.query;

    // 🔹 Cache Key
    const cacheKey = `tasks_${req.user.id}_${startDate}_${endDate}_${shift}_${department}_${employeeId}_${page}_${limit}`;

    // 🔹 Serve from Cache if exists
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // 🔹 Helper: Convert UTC → IST
    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + istOffset * 60000);
    };

    // 🔹 Helper: Shift date (before 10 AM → previous day)
    const getShiftDate = () => {
      const ist = getISTime();
      const hour = ist.getHours();
      const shiftDate = new Date(ist);
      if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    };

    // 🧭 Role-based filter
    const filter = {};
    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
      if (shift) filter.shift = shift;
    } else {
      if (shift) filter.shift = shift;
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    // 🔹 Pagination setup
    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "username department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    if (!tasks.length) {
      const emptyResponse = { data: [], total: 0, page, totalPages: 0 };
      cache.set(cacheKey, emptyResponse);
      return res.status(200).json(emptyResponse);
    }

    // 🔹 Determine start/end range
    const todayShiftDate = getShiftDate();
    const start = startDate ? new Date(startDate) : new Date(todayShiftDate);
    const end = endDate ? new Date(endDate) : new Date(todayShiftDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 🔹 Fetch all TaskStatuses in one query
    const allStatuses = await TaskStatus.find({
      taskId: { $in: tasks.map((t) => t._id) },
      date: { $gte: start, $lte: end },
    })
      .populate("employeeId", "username")
      .lean();

    // 🔹 Group statuses by taskId + date
    const statusMap = new Map();
    for (const s of allStatuses) {
      const key = `${s.taskId}_${new Date(s.date).toDateString()}`;
      if (!statusMap.has(key)) statusMap.set(key, []);
      statusMap.get(key).push(s);
    }

    // 🔹 Build date range
    const dateRange = [];
    const tmpDate = new Date(start);
    while (tmpDate <= end) {
      dateRange.push(new Date(tmpDate));
      tmpDate.setDate(tmpDate.getDate() + 1);
    }

    // 🔹 Enrich tasks (your original flow kept)
    const enrichedTasks = [];

    for (const task of tasks) {
      const taskCreatedDate = new Date(task.createdAt);
      taskCreatedDate.setHours(0, 0, 0, 0);

      for (const date of dateRange) {
        if (date < taskCreatedDate) continue;

        const key = `${task._id}_${date.toDateString()}`;
        const statuses = statusMap.get(key) || [];

        const doneEmployees = [];
        const notDoneEmployees = [];
        let employeeStatus = "Not Done";

        for (const s of statuses) {
          const username = s.employeeId?.username || "Unknown";
          if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
          else notDoneEmployees.push({ _id: s.employeeId._id, username });

          if (s.employeeId._id.toString() === req.user.id) employeeStatus = s.status;
        }

        const assignedWithoutStatus = task.assignedTo
          .filter(
            (emp) => !statuses.some((s) => s.employeeId._id.toString() === emp._id.toString())
          )
          .map((emp) => ({ _id: emp._id, username: emp.username }));

        notDoneEmployees.push(...assignedWithoutStatus);

        enrichedTasks.push({
          ...task,
          employeeStatus,
          doneEmployees,
          notDoneEmployees,
          date,
        });
      }
    }

    const response = {
      data: enrichedTasks,
      total: totalTasks,
      page: Number(page),
      totalPages: Math.ceil(totalTasks / Number(limit)),
    };

    // 🔹 Cache response for short duration
    cache.set(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// export const updateTaskStatus = async (req, res) => {
//   try {
//     // Only employees can update their own task status
//     if (req.user.accountType !== "employee") {
//       return res.status(403).json({ message: "Only employees can update status" });
//     }

//     const { taskId } = req.params;
//     const { status } = req.body;

//     if (!["Done", "Not Done"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status value" });
//     }

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     // Ensure the employee is assigned to this task
//     if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
//       return res.status(403).json({ message: "You are not assigned to this task" });
//     }

//     // Get shift-based "today"
//     const today = getShiftDate();

//     // Find existing TaskStatus for this task & employee for the shift date
//     let taskStatus = await TaskStatus.findOne({
//       taskId,
//       employeeId: req.user.id,
//       date: today,
//     });

//     if (!taskStatus) {
//       // Create new status if not exist
//       taskStatus = await TaskStatus.create({
//         taskId,
//         employeeId: req.user.id,
//         date: today,
//         status,
//       });
//     } else {
//       // Update existing status
//       taskStatus.status = status;
//       taskStatus.updatedAt = new Date();
//       await taskStatus.save();
//     }

//     // Populate employee info for frontend update
//     await taskStatus.populate("employeeId", "username");

//     res.status(200).json({
//       message: "Status updated successfully",
//       updatedStatus: {
//         taskId: taskStatus.taskId,
//         employeeId: taskStatus.employeeId._id,
//         username: taskStatus.employeeId.username,
//         status: taskStatus.status,
//         date: taskStatus.date,
//       },
//     });
//   } catch (error) {
//     console.error("Update Task Status Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


export const updateTaskStatus = async (req, res) => {
  try {
    // ✅ Only employees can update task status
    if (req.user.accountType !== "employee") {
      return res.status(403).json({ message: "Only employees can update status" });
    }

    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Done", "Not Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    const employee = await User.findById(req.user.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // ✅ Current IST time
    const istTime = getISTime();

    // ✅ Determine effective shift date (before 10 AM = previous day)
    const effectiveDate = getShiftDate();

    // --- Build shift start and end based on employee ---
    const empShiftStart = new Date(effectiveDate);
    empShiftStart.setHours(employee.shiftStartHour, 0, 0, 0);

    const empShiftEnd = new Date(empShiftStart);
    empShiftEnd.setHours(employee.shiftEndHour, 0, 0, 0);

    if (employee.shiftEndHour < employee.shiftStartHour) {
      empShiftEnd.setDate(empShiftEnd.getDate() + 1); // crosses midnight
    }

    // ✅ FIX for early-morning shifts (e.g., 01 AM – 10 AM)
    if (employee.shiftStartHour < 6 && istTime.getHours() < 10) {
      empShiftStart.setDate(empShiftStart.getDate() + 1);
      empShiftEnd.setDate(empShiftEnd.getDate() + 1);
    }

    // --- Divide shift into 3 segments (Start, Mid, End) ---
    const totalShiftHours =
      (employee.shiftEndHour > employee.shiftStartHour
        ? employee.shiftEndHour - employee.shiftStartHour
        : employee.shiftEndHour + 24 - employee.shiftStartHour);

    const phaseDuration = totalShiftHours / 3; // divide equally into 3 windows

    const phaseStart = new Date(empShiftStart);
    const phaseMid = new Date(empShiftStart);
    phaseMid.setHours(phaseStart.getHours() + phaseDuration);

    const phaseEnd = new Date(phaseMid);
    phaseEnd.setHours(phaseMid.getHours() + phaseDuration);

    let windowStart, windowEnd;

    if (task.shift === "Start") {
      windowStart = phaseStart;
      windowEnd = phaseMid;
    } else if (task.shift === "Mid") {
      windowStart = phaseMid;
      windowEnd = phaseEnd;
    } else if (task.shift === "End") {
      windowStart = phaseEnd;
      windowEnd = empShiftEnd;
    }

    // --- Handle midnight crossover ---
    if (windowEnd < windowStart) windowEnd.setDate(windowEnd.getDate() + 1);

    console.log(`IST Now: ${istTime.toLocaleString("en-IN")}`);
    console.log(
      `Shift Window (${task.shift}): ${windowStart.toLocaleTimeString("en-IN")} → ${windowEnd.toLocaleTimeString("en-IN")}`
    );

    // --- Restrict updates to correct shift window ---
    if (istTime < windowStart || istTime > windowEnd) {
      return res.status(403).json({
        message: `You can only update ${task.shift} shift tasks between ${windowStart.toLocaleTimeString(
          "en-IN",
          { hour: "2-digit", minute: "2-digit", hour12: true }
        )} and ${windowEnd.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} IST.`,
      });
    }

    // ✅ Proceed with TaskStatus update
    let taskStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: effectiveDate,
    });

    if (!taskStatus) {
      taskStatus = await TaskStatus.create({
        taskId,
        employeeId: req.user.id,
        date: effectiveDate,
        status,
        updatedAt: new Date(),
      });
    } else {
      taskStatus.status = status;
      taskStatus.updatedAt = new Date();
      await taskStatus.save();
    }

    await taskStatus.populate("employeeId", "username");

    res.status(200).json({
      message: "Status updated successfully",
      updatedStatus: {
        taskId: taskStatus.taskId,
        employeeId: taskStatus.employeeId._id,
        username: taskStatus.employeeId.username,
        status: taskStatus.status,
        date: taskStatus.date,
      },
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// export const updateTaskStatus = async (req, res) => {
//   try {
//     if (req.user.accountType !== "employee") {
//       return res.status(403).json({ message: "Only employees can update status" });
//     }

//     const { taskId } = req.params;
//     const { status } = req.body;

//     if (!["Done", "Not Done"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status value" });
//     }

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
//       return res.status(403).json({ message: "You are not assigned to this task" });
//     }

//     const employee = await User.findById(req.user.id);
//     if (!employee) return res.status(404).json({ message: "Employee not found" });

//     // ✅ Use IST time
//     const istTime = getISTime();

//     // Employee’s shift start/end
//     const shiftStart = new Date(istTime);
//     shiftStart.setHours(employee.shiftStartHour, 0, 0, 0);

//     const shiftEnd = new Date(shiftStart);
//     shiftEnd.setHours(employee.shiftEndHour, 0, 0, 0);
//     if (employee.shiftEndHour < employee.shiftStartHour) shiftEnd.setDate(shiftEnd.getDate() + 1);

//     // Define time windows relative to shift start
//     const windows = {
//       Start: [0, 3],
//       Mid: [3, 8],
//       End: [8, (shiftEnd.getHours() - employee.shiftStartHour + 24) % 24],
//     };

//     const [startOffset, endOffset] = windows[task.shift] || [0, 0];
//     const phaseStart = new Date(shiftStart);
//     phaseStart.setHours(shiftStart.getHours() + startOffset);

//     const phaseEnd = new Date(shiftStart);
//     phaseEnd.setHours(shiftStart.getHours() + endOffset);
//     if (phaseEnd < phaseStart) phaseEnd.setDate(phaseEnd.getDate() + 1);

//     // Check if current IST time falls within allowed window
//     if (istTime < phaseStart || istTime > phaseEnd) {
//       return res.status(403).json({
//         message: `You can only update ${task.shift} shift tasks between ${phaseStart.toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         })} and ${phaseEnd.toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         })} IST.`,
//       });
//     }

//     // ✅ Proceed to update task status
//     const today = getShiftDate();
//     let taskStatus = await TaskStatus.findOne({
//       taskId,
//       employeeId: req.user.id,
//       date: today,
//     });

//     if (!taskStatus) {
//       taskStatus = await TaskStatus.create({
//         taskId,
//         employeeId: req.user.id,
//         date: today,
//         status,
//         updatedAt: new Date(),
//       });
//     } else {
//       taskStatus.status = status;
//       taskStatus.updatedAt = new Date();
//       await taskStatus.save();
//     }

//     await taskStatus.populate("employeeId", "username");

//     res.status(200).json({
//       message: "Status updated successfully",
//       updatedStatus: {
//         taskId: taskStatus.taskId,
//         employeeId: taskStatus.employeeId._id,
//         username: taskStatus.employeeId.username,
//         status: taskStatus.status,
//         date: taskStatus.date,
//       },
//     });
//   } catch (error) {
//     console.error("Update Task Status Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



export const updateTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can update tasks" });
    }

    const { id } = req.params;
    const { title, description, shift, department, assignedTo, priority, deadline } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const departmentChanged = department && department !== task.department;
    const assignedChanged = Array.isArray(assignedTo) && assignedTo.length;

    const oldAssignedIds = task.assignedTo.map((id) => id.toString());

    if (title) task.title = title;
    if (description) task.description = description;
    if (shift) task.shift = shift;
    if (department) task.department = department;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;

    let employees = [];
    if (assignedChanged) {
      employees = await User.find({
        _id: { $in: assignedTo },
        department: department || task.department,
        accountType: "employee",
      });
      task.assignedTo = employees.map((e) => e._id);
    } else if (departmentChanged && !assignedChanged) {
      employees = await User.find({ department, accountType: "employee" });
      task.assignedTo = employees.map((e) => e._id);
    } else {
      employees = await User.find({ _id: { $in: task.assignedTo } });
    }

    await task.save();

    const today = getShiftDate();

    const existingStatuses = await TaskStatus.find({
      taskId: task._id,
      date: today,
    });
    const existingEmployeeIds = existingStatuses.map((s) => s.employeeId.toString());

    const newEmployeeIds = employees.map((e) => e._id.toString());

    const newStatuses = employees
      .filter((emp) => !existingEmployeeIds.includes(emp._id.toString()))
      .map((emp) => ({
        taskId: task._id,
        employeeId: emp._id,
        date: today,
        status: "Not Done",
      }));

    if (newStatuses.length > 0) {
      await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => {});
    }

    const removedEmployees = oldAssignedIds.filter((id) => !newEmployeeIds.includes(id));
    if (removedEmployees.length > 0) {
      await TaskStatus.deleteMany({
        taskId: task._id,
        employeeId: { $in: removedEmployees },
      });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const deleteTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.findByIdAndDelete(id);

    await TaskStatus.deleteMany({ taskId: id });

    res.status(200).json({
      message: "Task and all related statuses deleted successfully",
      deletedTaskId: id,
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const assignTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can assign tasks" });

    const { taskId } = req.params;
    const { assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const employees = await User.find({
      _id: { $in: assignedTo },
      department: task.department,
      accountType: "employee",
    });

    if (employees.length === 0)
      return res.status(404).json({ message: "No valid employees in department" });

    task.assignedTo = employees.map((e) => e._id);
    await task.save();

    const today = getShiftDate();
    const newStatuses = employees.map((emp) => ({
      taskId,
      employeeId: emp._id,
      date: today,
      status: "Not Done",
    }));
    await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => { });

    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.error("Assign Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAllTasks = async (req, res) => {
  try {
    const { date, shift } = req.query;
    const filter = req.user.accountType === "employee"
      ? { assignedTo: req.user.id }
      : {};
    let tasksQuery = Task.find(filter).populate("assignedTo", "username department");

    if (shift) {
      tasksQuery = tasksQuery.where("shift").equals(shift);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      tasksQuery = tasksQuery.where("createdAt").gte(startOfDay).lte(endOfDay);
    }

    const tasks = await tasksQuery;

    const taskIds = tasks.map(t => t._id);

    const allStatuses = await TaskStatus.find({
      taskId: { $in: taskIds },
    }).sort({ updatedAt: -1 });

    const taskStatusMap = {};
    allStatuses.forEach(s => {
      const taskId = s.taskId.toString();
      const empId = s.employeeId.toString();

      if (!taskStatusMap[taskId]) taskStatusMap[taskId] = {};
      if (!taskStatusMap[taskId][empId]) taskStatusMap[taskId][empId] = s.status;
    });

    const result = tasks.map(task => {
      const doneEmployees = [];
      const notDoneEmployees = [];
      let employeeStatus = "Not Done";

      task.assignedTo.forEach(emp => {
        const status = taskStatusMap[task._id.toString()]?.[emp._id.toString()] || "Not Done";

        if (status === "Done") doneEmployees.push({ _id: emp._id, username: emp.username });
        else notDoneEmployees.push({ _id: emp._id, username: emp.username });

        if (emp._id.toString() === req.user.id) employeeStatus = status;
      });

      return {
        ...task.toObject(),
        employeeStatus,
        doneEmployees,
        notDoneEmployees,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// export const exportTaskStatusExcel = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can export tasks" });

//     const { department, shift, employeeId } = req.query;

//     const currentShiftDate = getShiftDate();
//     const end = new Date(currentShiftDate);
//     const start = new Date(currentShiftDate);
//     start.setMonth(start.getMonth() - 12);
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     // Aggregation: latest status per task per employee per date
//     const statuses = await TaskStatus.aggregate([
//       { $match: { date: { $gte: start, $lte: end }, ...(department && { department }), ...(shift && { shift }), ...(employeeId && { employeeId: mongoose.Types.ObjectId(employeeId) }) } },
//       { $sort: { updatedAt: -1 } },
//       { $group: { _id: { taskId: "$taskId", employeeId: "$employeeId", date: "$date" }, taskId: { $first: "$taskId" }, employeeId: { $first: "$employeeId" }, status: { $first: "$status" }, date: { $first: "$date" } } },
//       { $lookup: { from: "tasks", localField: "taskId", foreignField: "_id", as: "task" } },
//       { $unwind: "$task" },
//       { $lookup: { from: "users", localField: "employeeId", foreignField: "_id", as: "employee" } },
//       { $unwind: "$employee" },
//       { $project: { _id: 0, Task: "$task.title", Shift: "$task.shift", Department: "$task.department", Employee: "$employee.username", Date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, Status: "$status" } },
//     ]);

//     const monthGroups = {};
//     statuses.forEach((s) => {
//       const date = new Date(s.Date);
//       const monthName = date.toLocaleString("default", { month: "long" });
//       const year = date.getFullYear();
//       const key = `${monthName} ${year}`;
//       if (!monthGroups[key]) monthGroups[key] = [];
//       monthGroups[key].push(s);
//     });

//     const workbook = XLSX.utils.book_new();

//     Object.entries(monthGroups).forEach(([month, data]) => {
//       const styledData = [
//         {
//           Task: { v: "Task", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//           Shift: { v: "Shift", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//           Department: { v: "Department", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//           Employee: { v: "Employee", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//           Date: { v: "Date", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//           Status: { v: "Status", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
//         },
//         ...data.map((item) => ({
//           Task: { v: item.Task },
//           Shift: { v: item.Shift },
//           Department: { v: item.Department },
//           Employee: { v: item.Employee },
//           Date: { v: item.Date },
//           Status: {
//             v: item.Status,
//             s: { font: { color: { rgb: item.Status.toLowerCase() === "done" ? "008000" : "FF0000" }, bold: true } },
//           },
//         })),
//       ];

//       const worksheet = XLSX.utils.json_to_sheet(styledData, { skipHeader: true });

//       // Auto-width for each column
//       const wsCols = ["Task", "Shift", "Department", "Employee", "Date", "Status"].map((key) => {
//         const maxLength = Math.max(
//           key.length,
//           ...data.map((row) => (row[key] ? row[key].toString().length : 0))
//         );
//         return { wch: maxLength + 5 };
//       });
//       worksheet['!cols'] = wsCols;

//       XLSX.utils.book_append_sheet(workbook, worksheet, month);
//     });

//     const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
//     const fileName = `Task_Status_Last_12_Months_${Date.now()}.xlsx`;

//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.send(buffer);
//   } catch (error) {
//     console.error("Export Excel Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



export const exportTaskStatusExcel = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can export tasks" });

    const { department, shift } = req.query;

    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + istOffset * 60000);
    };

    const getShiftDate = () => {
      const istTime = getISTime();
      if (istTime.getHours() < 10) istTime.setDate(istTime.getDate() - 1);
      istTime.setHours(0, 0, 0, 0);
      return istTime;
    };

    const currentShiftDate = getShiftDate();
    const end = new Date(currentShiftDate);
    const start = new Date(currentShiftDate);
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const statuses = await Task.aggregate([
      {
        $match: {
          createdAt: { $lte: end },
          ...(department && { department }),
          ...(shift && { shift }),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "employees",
        },
      },
      { $unwind: "$employees" },
      {
        $lookup: {
          from: "taskstatuses",
          localField: "_id",
          foreignField: "taskId",
          as: "statusDocs",
        },
      },
      {
        $addFields: {
          latestStatus: {
            $first: {
              $filter: {
                input: {
                  $sortArray: {
                    input: {
                      $filter: {
                        input: "$statusDocs",
                        as: "s",
                        cond: {
                          $and: [
                            { $eq: ["$$s.employeeId", "$employees._id"] },
                            { $lte: ["$$s.date", end] },
                          ],
                        },
                      },
                    },
                    sortBy: { updatedAt: -1 },
                  },
                },
                as: "ls",
                cond: {},
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          Task: "$title",
          Shift: "$shift",
          Department: "$department",
          Employee: "$employees.username",
          Date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$latestStatus.date", "$createdAt"] },
            },
          },
          RawTime: { $ifNull: ["$latestStatus.updatedAt", "$updatedAt"] },
          Status: { $ifNull: ["$latestStatus.status", "Not Done"] },
        },
      },
    ]);

    statuses.forEach((s) => {
      const istNow = getISTime();
      const hour = istNow.getHours();
      const effectiveDate = new Date(istNow);
      if (hour < 10) effectiveDate.setDate(effectiveDate.getDate() - 1);
      effectiveDate.setHours(0, 0, 0, 0);
      if (new Date(s.Date) > effectiveDate) s.Date = effectiveDate.toISOString().split("T")[0];
      if (s.RawTime) {
        s.Time = new Date(s.RawTime).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
      } else {
        s.Time = "--";
      }
      delete s.RawTime;
    });

    const monthGroups = {};
    statuses.forEach((s) => {
      const date = new Date(s.Date);
      if (date >= start && date <= end) {
        const monthName = date.toLocaleString("default", { month: "long" });
        const year = date.getFullYear();
        const key = `${monthName} ${year}`;
        if (!monthGroups[key]) monthGroups[key] = [];
        monthGroups[key].push(s);
      }
    });

    const workbook = XLSX.utils.book_new();

    const headerStyle = () => ({
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center" },
    });

    Object.entries(monthGroups).forEach(([month, data]) => {
      const styledData = [
        {
          Task: { v: "Task", s: headerStyle() },
          Shift: { v: "Shift", s: headerStyle() },
          Department: { v: "Department", s: headerStyle() },
          Employee: { v: "Employee", s: headerStyle() },
          Date: { v: "Date", s: headerStyle() },
          Time: { v: "Updated Time", s: headerStyle() },
          Status: { v: "Status", s: headerStyle() },
        },
        ...data.map((item) => ({
          Task: { v: item.Task },
          Shift: { v: item.Shift },
          Department: { v: item.Department },
          Employee: { v: item.Employee },
          Date: { v: item.Date },
          Time: { v: item.Time },
          Status: {
            v: item.Status,
            s: {
              font: {
                color: { rgb: item.Status.toLowerCase() === "done" ? "008000" : "FF0000" },
                bold: true,
              },
            },
          },
        })),
      ];

      const worksheet = XLSX.utils.json_to_sheet(styledData, { skipHeader: true });
      const wsCols = ["Task", "Shift", "Department", "Employee", "Date", "Time", "Status"].map(
        (key) => {
          const maxLength = Math.max(
            key.length,
            ...data.map((row) => (row[key] ? row[key].toString().length : 0))
          );
          return { wch: maxLength + 5 };
        }
      );
      worksheet["!cols"] = wsCols;
      XLSX.utils.book_append_sheet(workbook, worksheet, month);
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `Task_Status_Last_12_Months_${Date.now()}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// export const Defaulter = async (req, res) => {
//   try {
//     const { department, shift, employeeId, startDate, endDate } = req.query;

//     // --- Build base filter (same as getTasks) ---
//     const filter = {};
//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//       if (shift) filter.shift = shift;
//     } else {
//       if (department) filter.department = department;
//       if (shift) filter.shift = shift;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     // Populate assignedTo with shift hours as we'll need them
//     const tasks = await Task.find(filter)
//       .populate("assignedTo", "username department shiftStartHour shiftEndHour")
//       .populate("createdBy", "username");

//     // Date range handling
//     const istNow = getISTime();
//     const start = startDate ? new Date(startDate) : getShiftDate();
//     const end = endDate ? new Date(endDate) : getShiftDate(); // use shift date as default end
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     const defaulters = [];

//     // Helper: compute shift window (start & end Date objects) for a given employee + date + task.shift
//     const computeShiftWindow = (emp, date, taskShift, currentIst) => {
//       // emp.shiftStartHour and emp.shiftEndHour expected as numbers (0-23)
//       const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 0;
//       const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 23;

//       // Base shift start on the date provided
//       const empShiftStart = new Date(date);
//       empShiftStart.setHours(startHour, 0, 0, 0);

//       let empShiftEnd = new Date(empShiftStart);
//       empShiftEnd.setHours(endHour, 0, 0, 0);

//       // If end < start, shift crosses midnight -> add a day to end
//       if (endHour < startHour) empShiftEnd.setDate(empShiftEnd.getDate() + 1);

//       // Fix for early-morning shifts similar to your updateTaskStatus logic:
//       // If shiftStartHour < 6 and current IST time is before 10 AM, then those shift window dates may need +1 day 
//       // (this mirrors the earlier logic; adjust if your business rules differ)
//       const currentHour = currentIst.getHours();
//       if (startHour < 6 && currentHour < 10) {
//         empShiftStart.setDate(empShiftStart.getDate() + 1);
//         empShiftEnd.setDate(empShiftEnd.getDate() + 1);
//       }

//       // Now divide the shift into three equal phases: Start, Mid, End
//       const totalShiftHours =
//         empShiftEnd.getTime() > empShiftStart.getTime()
//           ? (empShiftEnd.getTime() - empShiftStart.getTime()) / (1000 * 60 * 60)
//           : (empShiftEnd.getTime() + 24 * 3600 * 1000 - empShiftStart.getTime()) / (1000 * 60 * 60);

//       const phaseDurationHours = totalShiftHours / 3;

//       const phaseStart = new Date(empShiftStart);
//       const phaseMid = new Date(empShiftStart);
//       phaseMid.setHours(phaseStart.getHours() + phaseDurationHours);

//       const phaseEnd = new Date(phaseMid);
//       phaseEnd.setHours(phaseMid.getHours() + phaseDurationHours);

//       let windowStart = null;
//       let windowEnd = null;
//       if (taskShift === "Start") {
//         windowStart = phaseStart;
//         windowEnd = phaseMid;
//       } else if (taskShift === "Mid") {
//         windowStart = phaseMid;
//         windowEnd = phaseEnd;
//       } else {
//         // "End"
//         windowStart = phaseEnd;
//         windowEnd = empShiftEnd;
//       }

//       // If windowEnd < windowStart (shouldn't normally happen), push windowEnd to next day
//       if (windowEnd.getTime() < windowStart.getTime()) windowEnd.setDate(windowEnd.getDate() + 1);

//       return { windowStart, windowEnd };
//     };

//     // Iterate tasks
//     for (const task of tasks) {
//       // For each date in the range (skip dates before task creation)
//       const taskCreated = new Date(task.createdAt);
//       taskCreated.setHours(0, 0, 0, 0);

//       const loopStart = start > taskCreated ? new Date(start) : new Date(taskCreated);
//       for (let d = new Date(loopStart); d <= end; d.setDate(d.getDate() + 1)) {
//         const dayStart = new Date(d);
//         dayStart.setHours(0, 0, 0, 0);
//         const dayEnd = new Date(d);
//         dayEnd.setHours(23, 59, 59, 999);

//         // For each assigned employee (filtered by employeeId if present implicitly via task filter)
//         const notDoneEmployees = [];
//         const doneEmployees = [];

//         for (const emp of task.assignedTo) {
//           // If admin supplied employeeId as query param and this emp doesn't match, skip
//           if (employeeId && emp._id.toString() !== employeeId.toString()) continue;

//           // Find latest status for this employee on this date (most recent updatedAt)
//           const latestStatus = await TaskStatus.findOne({
//             taskId: task._id,
//             employeeId: emp._id,
//             date: { $gte: dayStart, $lte: dayEnd },
//           })
//             .sort({ updatedAt: -1 })
//             .lean();

//           const empStatus = latestStatus ? latestStatus.status : "Not Done";

//           // Compute the shift window for this employee on this date
//           const { windowStart, windowEnd } = computeShiftWindow(emp, dayStart, task.shift, getISTime());

//           // If current IST time is after windowEnd (shift over) and employee didn't mark Done => defaulter for this date
//           const nowIst = getISTime();
//           const isShiftOver = nowIst > windowEnd;

//           if (empStatus === "Done") {
//             doneEmployees.push({ _id: emp._id, username: emp.username });
//           } else {
//             // Not Done or no record
//             if (isShiftOver) {
//               notDoneEmployees.push({ _id: emp._id, username: emp.username });
//             } else {
//               // shift not over yet -> don't count as defaulter for this date
//               // You may still want to show as pending but not defaulter; currently we skip
//             }
//           }
//         } // end employees loop

//         if (notDoneEmployees.length > 0) {
//           defaulters.push({
//             taskId: task._id,
//             title: task.title,
//             description: task.description,
//             department: task.department,
//             shift: task.shift,
//             createdBy: task.createdBy?.username || "Unknown",
//             assignedTo: task.assignedTo.map((e) => e.username),
//             notDoneEmployees: notDoneEmployees.map((e) => e.username),
//             doneEmployees: doneEmployees.map((e) => e.username),
//             totalAssigned: task.assignedTo.length,
//             totalNotDone: notDoneEmployees.length,
//             date: new Date(dayStart), // which date this defaulter entry belongs to
//             dateRange: { from: start, to: end },
//           });
//         }
//       } // end dates loop
//     } // end tasks loop

//     return res.status(200).json({
//       totalDefaulters: defaulters.length,
//       data: defaulters,
//     });
//   } catch (error) {
//     console.error("Defaulter Fetch Error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


 // adjust if helper path differs

export const Defaulter = async (req, res) => {
  try {
    const { department, shift, employeeId, startDate, endDate } = req.query;

    const filter = {};
    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
      if (shift) filter.shift = shift;
    } else {
      if (department) filter.department = department;
      if (shift) filter.shift = shift;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username department shiftStartHour shiftEndHour")
      .populate("createdBy", "username");

    const start = startDate ? new Date(startDate) : getShiftDate();
    const end = endDate ? new Date(endDate) : getShiftDate();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const defaulterMap = new Map();
    const employeeDefaultSets = new Map();

    // ✅ Fixed logic for 1 AM–10 AM shifts (no early counting)
    const computeShiftWindow = (emp, date, taskShift) => {
      const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 0;
      const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 23;

      const empShiftStart = new Date(date);
      empShiftStart.setHours(startHour, 0, 0, 0);

      let empShiftEnd = new Date(empShiftStart);
      empShiftEnd.setHours(endHour, 0, 0, 0);
      if (endHour < startHour) empShiftEnd.setDate(empShiftEnd.getDate() + 1);

      // 🕐 If shift starts after midnight (e.g. 1 AM) but before 6 AM,
      // only count it *after* that time actually passes.
      const now = getISTime();
      const isEarlyMorningShift = startHour >= 1 && startHour < 6;
      if (isEarlyMorningShift && now.getHours() < startHour) {
        // It’s still before shift start — skip this shift entirely
        empShiftStart.setDate(empShiftStart.getDate() + 1);
        empShiftEnd.setDate(empShiftEnd.getDate() + 1);
      }

      // Split shift into 3 equal parts
      const totalShiftHours = (empShiftEnd - empShiftStart) / (1000 * 60 * 60);
      const phaseDuration = totalShiftHours / 3;

      const phase1Start = new Date(empShiftStart);
      const phase2Start = new Date(empShiftStart);
      phase2Start.setHours(phase1Start.getHours() + phaseDuration);
      const phase3Start = new Date(phase2Start);
      phase3Start.setHours(phase2Start.getHours() + phaseDuration);

      if (taskShift === "Start") return { windowStart: phase1Start, windowEnd: phase2Start };
      if (taskShift === "Mid") return { windowStart: phase2Start, windowEnd: phase3Start };
      return { windowStart: phase3Start, windowEnd: empShiftEnd };
    };

    for (const task of tasks) {
      const taskCreated = new Date(task.createdAt);
      taskCreated.setHours(0, 0, 0, 0);
      const loopStart = start > taskCreated ? new Date(start) : new Date(taskCreated);

      for (let d = new Date(loopStart); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        for (const emp of task.assignedTo) {
          if (employeeId && emp._id.toString() !== employeeId.toString()) continue;

          const latestStatus = await TaskStatus.findOne({
            taskId: task._id,
            employeeId: emp._id,
            date: { $gte: dayStart, $lte: dayEnd },
          })
            .sort({ updatedAt: -1 })
            .lean();

          const empStatus = latestStatus ? latestStatus.status : "Not Done";
          const { windowStart, windowEnd } = computeShiftWindow(emp, dayStart, task.shift);
          const nowIst = getISTime();

          const shiftNotStarted = nowIst < windowStart;
          const shiftOver = nowIst > windowEnd;

          // ⛔ Skip if shift not started yet or not finished
          if (shiftNotStarted || !shiftOver) continue;

          if (empStatus !== "Done" && shiftOver) {
            const key = `${emp._id}_${dayStart.toDateString()}`;
            const existing = defaulterMap.get(key) || {
              date: new Date(dayStart),
              employeeId: emp._id,
              employeeName: emp.username,
              notDoneTasksToday: 0,
            };
            existing.notDoneTasksToday += 1;
            defaulterMap.set(key, existing);

            const taskDateKey = `${task._id.toString()}_${dayStart.toISOString().split("T")[0]}`;
            const setForEmp = employeeDefaultSets.get(emp._id.toString()) || new Set();
            setForEmp.add(taskDateKey);
            employeeDefaultSets.set(emp._id.toString(), setForEmp);
          }
        }
      }
    }

    const data = Array.from(defaulterMap.values()).map((entry) => {
      const empIdStr = entry.employeeId.toString();
      const totalSet = employeeDefaultSets.get(empIdStr) || new Set();
      return {
        ...entry,
        totalDefaultsTillDate: totalSet.size,
      };
    });

    const overallTotalDefaults = Array.from(employeeDefaultSets.values()).reduce(
      (sum, s) => sum + (s.size || 0),
      0
    );

    return res.status(200).json({
      success: true,
      totalDefaulters: data.length,
      overallTotalDefaults,
      data,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};




// export const getEmployeeDefaulters = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     const employee = await User.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json({ success: false, message: "Employee not found" });
//     }

//     const getISTime = () => {
//       const now = new Date();
//       const istOffset = 5.5 * 60;
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + istOffset * 60000);
//     };

//     const getShiftDate = () => {
//       const now = getISTime();
//       if (now.getHours() < 10) now.setDate(now.getDate() - 1);
//       now.setHours(0, 0, 0, 0);
//       return now;
//     };

//     const computeShiftWindow = (emp, date, taskShift, currentIst) => {
//       const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 0;
//       const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 23;

//       const empShiftStart = new Date(date);
//       empShiftStart.setHours(startHour, 0, 0, 0);
//       let empShiftEnd = new Date(empShiftStart);
//       empShiftEnd.setHours(endHour, 0, 0, 0);
//       if (endHour < startHour) empShiftEnd.setDate(empShiftEnd.getDate() + 1);

//       const now = currentIst;

//       if (startHour < 6 && now.getHours() >= 10) {
//         empShiftStart.setDate(empShiftStart.getDate() + 1);
//         empShiftEnd.setDate(empShiftEnd.getDate() + 1);
//       }

//       const totalShiftHours = (empShiftEnd - empShiftStart) / (1000 * 60 * 60);
//       const phaseDurationHours = totalShiftHours / 3;
//       const phaseStart = new Date(empShiftStart);
//       const phaseMid = new Date(empShiftStart);
//       phaseMid.setHours(phaseStart.getHours() + phaseDurationHours);
//       const phaseEnd = new Date(phaseMid);
//       phaseEnd.setHours(phaseMid.getHours() + phaseDurationHours);

//       if (taskShift === "Start") return { windowStart: phaseStart, windowEnd: phaseMid };
//       if (taskShift === "Mid") return { windowStart: phaseMid, windowEnd: phaseEnd };
//       return { windowStart: phaseEnd, windowEnd: empShiftEnd };
//     };

//     const endDate = getShiftDate();
//     const startDate = new Date(endDate);
//     startDate.setFullYear(endDate.getFullYear() - 1);

//     const tasks = await Task.find({ assignedTo: employeeId })
//       .populate("assignedTo", "username shiftStartHour shiftEndHour")
//       .select("title description shift department priority createdAt")
//       .lean();

//     if (!tasks.length) {
//       return res.json({
//         success: true,
//         message: "No tasks assigned to this employee",
//         totalDefaults: 0,
//         data: [],
//       });
//     }

//     const defaults = [];

//     for (const task of tasks) {
//       const taskCreated = new Date(task.createdAt);
//       taskCreated.setHours(0, 0, 0, 0);
//       const loopStart = startDate > taskCreated ? new Date(startDate) : new Date(taskCreated);

//       for (let d = new Date(loopStart); d <= endDate; d.setDate(d.getDate() + 1)) {
//         const dayStart = new Date(d);
//         dayStart.setHours(0, 0, 0, 0);
//         const dayEnd = new Date(d);
//         dayEnd.setHours(23, 59, 59, 999);

//         const latestStatus = await TaskStatus.findOne({
//           taskId: task._id,
//           employeeId,
//           date: { $gte: dayStart, $lte: dayEnd },
//         })
//           .sort({ updatedAt: -1 })
//           .lean();

//         const empStatus = latestStatus ? latestStatus.status : "Not Done";
//         const { windowStart, windowEnd } = computeShiftWindow(employee, dayStart, task.shift, getISTime());
//         const nowIst = getISTime();

//         const shiftNotStarted = nowIst < windowStart;
//         const shiftOver = nowIst > windowEnd;

//         // Skip if shift hasn’t started yet or still ongoing
//         if (shiftNotStarted || !shiftOver) continue;

//         if (empStatus !== "Done" && shiftOver) {
//           defaults.push({
//             date: new Date(dayStart),
//             title: task.title,
//             description: task.description,
//             shift: task.shift,
//             department: task.department,
//             priority: task.priority,
//           });
//         }
//       }
//     }

//     if (!defaults.length) {
//       return res.json({
//         success: true,
//         message: "No defaults found for this employee",
//         totalDefaults: 0,
//         data: [],
//       });
//     }

//     res.json({
//       success: true,
//       employeeName: employee.username,
//       totalDefaults: defaults.length,
//       data: defaults.sort((a, b) => b.date - a.date),
//     });
//   } catch (err) {
//     console.error("Error fetching employee defaulters:", err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };




// export const getEmployeeDefaulters = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { exportExcel } = req.query; // optional flag ?exportExcel=true

//     const employee = await User.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json({ success: false, message: "Employee not found" });
//     }

//     const getISTime = () => {
//       const now = new Date();
//       const istOffset = 5.5 * 60;
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + istOffset * 60000);
//     };

//     const getShiftDate = () => {
//       const now = getISTime();
//       if (now.getHours() < 10) now.setDate(now.getDate() - 1);
//       now.setHours(0, 0, 0, 0);
//       return now;
//     };

//     // ✅ Updated shift window logic for 1 AM–10 AM shifts
//     const computeShiftWindow = (emp, date, taskShift, currentIst) => {
//       const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 0;
//       const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 23;

//       const empShiftStart = new Date(date);
//       empShiftStart.setHours(startHour, 0, 0, 0);
//       let empShiftEnd = new Date(empShiftStart);
//       empShiftEnd.setHours(endHour, 0, 0, 0);
//       if (endHour < startHour) empShiftEnd.setDate(empShiftEnd.getDate() + 1);

//       const now = currentIst;
//       const isEarlyMorningShift = startHour >= 1 && startHour < 6;
//       if (isEarlyMorningShift && now.getHours() < startHour) {
//         empShiftStart.setDate(empShiftStart.getDate() + 1);
//         empShiftEnd.setDate(empShiftEnd.getDate() + 1);
//       }

//       const totalShiftHours = (empShiftEnd - empShiftStart) / (1000 * 60 * 60);
//       const phaseDurationHours = totalShiftHours / 3;
//       const phaseStart = new Date(empShiftStart);
//       const phaseMid = new Date(empShiftStart);
//       phaseMid.setHours(phaseStart.getHours() + phaseDurationHours);
//       const phaseEnd = new Date(phaseMid);
//       phaseEnd.setHours(phaseMid.getHours() + phaseDurationHours);

//       if (taskShift === "Start") return { windowStart: phaseStart, windowEnd: phaseMid };
//       if (taskShift === "Mid") return { windowStart: phaseMid, windowEnd: phaseEnd };
//       return { windowStart: phaseEnd, windowEnd: empShiftEnd };
//     };

//     const endDate = getShiftDate();
//     const startDate = new Date(endDate);
//     startDate.setFullYear(endDate.getFullYear() - 1);

//     const tasks = await Task.find({ assignedTo: employeeId })
//       .populate("assignedTo", "username shiftStartHour shiftEndHour")
//       .select("title description shift department priority createdAt")
//       .lean();

//     if (!tasks.length) {
//       return res.json({
//         success: true,
//         message: "No tasks assigned to this employee",
//         totalDefaults: 0,
//         data: [],
//       });
//     }

//     const defaults = [];

//     for (const task of tasks) {
//       const taskCreated = new Date(task.createdAt);
//       taskCreated.setHours(0, 0, 0, 0);
//       const loopStart = startDate > taskCreated ? new Date(startDate) : new Date(taskCreated);

//       for (let d = new Date(loopStart); d <= endDate; d.setDate(d.getDate() + 1)) {
//         const dayStart = new Date(d);
//         dayStart.setHours(0, 0, 0, 0);
//         const dayEnd = new Date(d);
//         dayEnd.setHours(23, 59, 59, 999);

//         const latestStatus = await TaskStatus.findOne({
//           taskId: task._id,
//           employeeId,
//           date: { $gte: dayStart, $lte: dayEnd },
//         })
//           .sort({ updatedAt: -1 })
//           .lean();

//         const empStatus = latestStatus ? latestStatus.status : "Not Done";
//         const { windowStart, windowEnd } = computeShiftWindow(employee, dayStart, task.shift, getISTime());
//         const nowIst = getISTime();

//         const shiftNotStarted = nowIst < windowStart;
//         const shiftOver = nowIst > windowEnd;

//         if (shiftNotStarted || !shiftOver) continue;

//         if (empStatus !== "Done" && shiftOver) {
//           defaults.push({
//             date: new Date(dayStart),
//             title: task.title,
//             description: task.description,
//             shift: task.shift,
//             department: task.department,
//             priority: task.priority,
//           });
//         }
//       }
//     }

//     if (!defaults.length) {
//       return res.json({
//         success: true,
//         message: "No defaults found for this employee",
//         totalDefaults: 0,
//         data: [],
//       });
//     }

//     // 🧾 Excel Export (separate tab for each month)
//     if (exportExcel === "true") {
//       const groupedByMonth = defaults.reduce((acc, item) => {
//         const month = item.date.toLocaleString("default", { month: "long", year: "numeric" });
//         if (!acc[month]) acc[month] = [];
//         acc[month].push(item);
//         return acc;
//       }, {});

//       const wb = XLSX.utils.book_new();

//       Object.keys(groupedByMonth).forEach((month) => {
//         const sheetData = [
//           ["Date", "Title", "Description", "Shift", "Department", "Priority"],
//           ...groupedByMonth[month].map((d) => [
//             d.date.toLocaleDateString("en-IN"),
//             d.title,
//             d.description,
//             d.shift,
//             d.department,
//             d.priority,
//           ]),
//         ];
//         const ws = XLSX.utils.aoa_to_sheet(sheetData);
//         XLSX.utils.book_append_sheet(wb, ws, month);
//       });

//       const fileName = `Employee_Defaults_${employee.username}_${Date.now()}.xlsx`;
//       const filePath = `./${fileName}`;
//       XLSX.writeFile(wb, filePath);

//       res.download(filePath, fileName, (err) => {
//         if (err) console.error("Excel download error:", err);
//         fs.unlinkSync(filePath); // delete temp file
//       });
//       return;
//     }

//     // 🧩 Normal API response for popup
//     res.json({
//       success: true,
//       employeeName: employee.username,
//       totalDefaults: defaults.length,
//       data: defaults.sort((a, b) => b.date - a.date),
//     });
//   } catch (err) {
//     console.error("Error fetching employee defaulters:", err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getEmployeeDefaulters = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { exportExcel } = req.query;

    const employee = await User.findById(employeeId);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    // --- Utility functions ---
    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + istOffset * 60000);
    };

    const getShiftDate = () => {
      const now = getISTime();
      if (now.getHours() < 10) now.setDate(now.getDate() - 1);
      now.setHours(0, 0, 0, 0);
      return now;
    };

    const computeShiftWindow = (emp, date, taskShift, currentIst) => {
      const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 0;
      const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 23;

      const empShiftStart = new Date(date);
      empShiftStart.setHours(startHour, 0, 0, 0);
      let empShiftEnd = new Date(empShiftStart);
      empShiftEnd.setHours(endHour, 0, 0, 0);
      if (endHour < startHour) empShiftEnd.setDate(empShiftEnd.getDate() + 1);

      const totalShiftHours = (empShiftEnd - empShiftStart) / (1000 * 60 * 60);
      const phaseDurationHours = totalShiftHours / 3;
      const phaseStart = new Date(empShiftStart);
      const phaseMid = new Date(empShiftStart);
      phaseMid.setHours(phaseStart.getHours() + phaseDurationHours);
      const phaseEnd = new Date(phaseMid);
      phaseEnd.setHours(phaseMid.getHours() + phaseDurationHours);

      if (taskShift === "Start") return { windowStart: phaseStart, windowEnd: phaseMid };
      if (taskShift === "Mid") return { windowStart: phaseMid, windowEnd: phaseEnd };
      return { windowStart: phaseEnd, windowEnd: empShiftEnd };
    };

    // --- Fetch Tasks ---
    const endDate = getShiftDate();
    const startDate = new Date(endDate);
    startDate.setFullYear(endDate.getFullYear() - 1);

    const tasks = await Task.find({ assignedTo: employeeId })
      .populate("assignedTo", "username shiftStartHour shiftEndHour")
      .select("title description shift department priority createdAt")
      .lean();

    if (!tasks.length) {
      return res.json({
        success: true,
        message: "No tasks assigned to this employee",
        totalDefaults: 0,
        data: [],
      });
    }

    const defaults = [];

    for (const task of tasks) {
      const taskCreated = new Date(task.createdAt);
      taskCreated.setHours(0, 0, 0, 0);
      const loopStart = startDate > taskCreated ? new Date(startDate) : new Date(taskCreated);

      for (let d = new Date(loopStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const latestStatus = await TaskStatus.findOne({
          taskId: task._id,
          employeeId,
          date: { $gte: dayStart, $lte: dayEnd },
        })
          .sort({ updatedAt: -1 })
          .lean();

        const empStatus = latestStatus ? latestStatus.status : "Not Done";
        const { windowStart, windowEnd } = computeShiftWindow(employee, dayStart, task.shift, getISTime());
        const nowIst = getISTime();

        if (nowIst > windowEnd && empStatus !== "Done") {
          defaults.push({
            date: new Date(dayStart),
            title: task.title,
            shift: task.shift,
            department: task.department,
            priority: task.priority,
          });
        }
      }
    }

    if (!defaults.length) {
      return res.json({
        success: true,
        message: "No defaults found for this employee",
        totalDefaults: 0,
        data: [],
      });
    }

    // ✅ Export Excel - Tab per Month
    if (exportExcel === "true") {
      const groupedByMonth = defaults.reduce((acc, item) => {
        const year = item.date.getFullYear();
        const month = item.date.toLocaleString("default", { month: "short" });
        const key = `${month} ${year}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      const wb = XLSX.utils.book_new();

      for (const [monthKey, records] of Object.entries(groupedByMonth)) {
        const data = [
          ["S.No", "Date", "Task", "Department", "Shift", "Priority"],
          ...records.map((r, i) => [
            i + 1,
            r.date.toLocaleDateString("en-GB"),
            r.title,
            r.department,
            r.shift,
            r.priority,
          ]),
          [],
          [`Total Defaults for ${monthKey}`, records.length, "", "", "", ""],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Apply header and total row styling
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F81BD" } },
          alignment: { horizontal: "center", vertical: "center" },
        };

        const totalStyle = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D9E1F2" } },
        };

        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; C++) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
          if (ws[headerCell]) ws[headerCell].s = headerStyle;
        }

        const totalRowIndex = data.length - 1;
        for (let C = 0; C < 6; C++) {
          const totalCell = XLSX.utils.encode_cell({ r: totalRowIndex, c: C });
          if (ws[totalCell]) ws[totalCell].s = totalStyle;
        }

        ws["!cols"] = [
          { wch: 6 },
          { wch: 15 },
          { wch: 40 },
          { wch: 18 },
          { wch: 10 },
          { wch: 10 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, monthKey);
      }

      const fileName = `Employee_Defaults_${employee.username}_${Date.now()}.xlsx`;
      const filePath = `./${fileName}`;
      XLSX.writeFile(wb, filePath);

      return res.download(filePath, fileName, (err) => {
        if (err) console.error("Excel download error:", err);
        fs.unlinkSync(filePath);
      });
    }

    res.json({
      success: true,
      employeeName: employee.username,
      totalDefaults: defaults.length,
      data: defaults.sort((a, b) => b.date - a.date),
    });
  } catch (err) {
    console.error("Error fetching employee defaulters:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};





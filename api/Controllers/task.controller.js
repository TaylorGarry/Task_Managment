import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import XLSX from "xlsx-js-style";
import Remark from "../Modals/Remark.modal.js";
import mongoose from "mongoose";


const getISTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60;  
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + istOffset * 60000);
};

const getShiftDate = () => {
  const ist = getISTime();
  const hour = ist.getHours();

  const shiftDate = new Date(ist);
  if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);

  shiftDate.setHours(0, 0, 0, 0);
  return shiftDate;
};
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
      status: "", // Initialize as empty string
    }));
    await TaskStatus.insertMany(statuses);

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// export const createTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can create tasks" });

//     const { title, description, shift, department, assignedTo, deadline, priority } = req.body;

//     if (!title || !shift || !department)
//       return res.status(400).json({ message: "Title, shift, and department are required" });

//     let employees = [];
//     if (assignedTo?.length) {
//       employees = await User.find({ _id: { $in: assignedTo }, department, accountType: "employee" });
//     } else {
//       employees = await User.find({ department, accountType: "employee" });
//     }

//     if (employees.length === 0)
//       return res.status(404).json({ message: "No valid employees found in department" });

//     const newTask = await Task.create({
//       title,
//       description,
//       shift,
//       department,
//       assignedTo: employees.map((e) => e._id),
//       createdBy: req.user.id,
//       deadline,
//       priority,
//       statusUnlocked: false,
//     });

//     const today = getShiftDate();
//     const statuses = employees.map((emp) => ({
//       taskId: newTask._id,
//       employeeId: emp._id,
//       date: today,
//       status: "",
//     }));
//     await TaskStatus.insertMany(statuses);

//     res.status(201).json({ message: "Task created successfully", task: newTask });
//   } catch (error) {
//     console.error("Create Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


export const getTasks = async (req, res) => {
  try {
    const { startDate, endDate, shift, department, employeeId } = req.query;

    const getISTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + 5.5 * 60 * 60000);
    };

    const getShiftDate = () => {
      const ist = getISTime();
      if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
      ist.setHours(0, 0, 0, 0);
      return ist;
    };

    const filter = {};
    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
      if (shift) filter.shift = shift;
    } else {
      if (shift) filter.shift = shift;
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username department")
      .lean();

    if (!tasks.length) return res.status(200).json([]);

    const todayShiftDate = getShiftDate();
    const start = startDate ? new Date(startDate) : new Date(todayShiftDate);
    const end = endDate ? new Date(endDate) : new Date(todayShiftDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dateRange = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    const taskIds = tasks.map((t) => t._id);
    
    const allStatuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: { $gte: start, $lte: end },
    })
      .populate("employeeId", "username")
      .lean();

    const startShiftTasks = await Task.find({
      assignedTo: req.user.id,
      shift: "Start",
      department: { $in: [...new Set(tasks.map(t => t.department))] },
      title: { $in: [...new Set(tasks.map(t => t.title))] }
    }).lean();

    const startTaskIds = startShiftTasks.map(t => t._id);
    const startShiftStatuses = startTaskIds.length > 0 ? await TaskStatus.find({
      taskId: { $in: startTaskIds },
      employeeId: req.user.id,
      date: { $gte: start, $lte: end }
    }).lean() : [];

    const statusMap = new Map();
    const startStatusMap = new Map();
    for (const status of startShiftStatuses) {
      const key = `${status.taskId}_${status.date.toISOString().split('T')[0]}`;
      startStatusMap.set(key, status);
    }

    const startTaskLookup = new Map();
    for (const task of startShiftTasks) {
      const key = `${task.title}_${task.department}`;
      if (!startTaskLookup.has(key)) {
        startTaskLookup.set(key, task);
      }
    }

    for (const s of allStatuses) {
      if (!s.employeeId) continue;
      const dateKey = s.date.toISOString().split('T')[0];
      const key = `${s.taskId}_${dateKey}`;
      if (!statusMap.has(key)) statusMap.set(key, []);
      statusMap.get(key).push(s);
    }

    const startShiftUpdatedDates = new Set();
    for (const status of startShiftStatuses) {
      if (status.status !== "") {
        const dateKey = status.date.toISOString().split('T')[0];
        startShiftUpdatedDates.add(dateKey);
      }
    }

    const enrichedTasks = [];
    const userId = req.user.id.toString();

    for (const task of tasks) {
      const taskCreatedDate = new Date(task.createdAt);
      taskCreatedDate.setHours(0, 0, 0, 0);

      for (const date of dateRange) {
        if (date < taskCreatedDate) continue;

        const dateKey = date.toISOString().split('T')[0];
        const key = `${task._id}_${dateKey}`;
        const statuses = statusMap.get(key) || [];

        let employeeStatus = "";
        const doneEmployees = [];
        const notDoneEmployees = [];
        const pendingEmployees = [];

        for (const s of statuses) {
          if (!s.employeeId) continue;

          const empId = s.employeeId._id;
          const username = s.employeeId.username || "Unknown";

          if (s.status === "Done") {
            doneEmployees.push({ _id: empId, username });
          } else if (s.status === "Not Done") {
            notDoneEmployees.push({ _id: empId, username });
          } else if (s.status === "") {
            pendingEmployees.push({ _id: empId, username });
          }

          if (empId.toString() === userId) employeeStatus = s.status;
        }

        const assignedWithoutStatus = task.assignedTo
          .filter((emp) => !statuses.some((s) => s.employeeId?._id.toString() === emp._id.toString()))
          .map((emp) => ({ _id: emp._id, username: emp.username }));

        notDoneEmployees.push(...pendingEmployees);
        notDoneEmployees.push(...assignedWithoutStatus);

        let canUpdate = true;
        let blockReason = "";

        if (task.shift === "Mid" || task.shift === "End") {
          const lookupKey = `${task.title}_${task.department}`;
          const startTask = startTaskLookup.get(lookupKey);
          
          if (startTask) {
            const startTaskKey = `${startTask._id}_${dateKey}`;
            const startStatus = startStatusMap.get(startTaskKey);
            
            if (!startStatus || startStatus.status === "") {
              canUpdate = false;
              blockReason = `Cannot update ${task.shift} shift because Start shift was not updated on ${date.toDateString()}.`;
            }
          }
        }

        enrichedTasks.push({
          ...task,
          employeeStatus,
          doneEmployees,
          notDoneEmployees,
          date,
          canUpdate,
          blockReason
        });
      }
    }

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const getTasks = async (req, res) => {
//   try {
//     const { startDate, endDate, shift, department, employeeId } = req.query;

//     const getISTime = () => {
//       const now = new Date();
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + 5.5 * 60 * 60000);
//     };

//     const getShiftDate = () => {
//       const ist = getISTime();
//       if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
//       ist.setHours(0, 0, 0, 0);
//       return ist;
//     };

//     const filter = {};
//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//       if (shift) filter.shift = shift;
//     } else {
//       if (shift) filter.shift = shift;
//       if (department) filter.department = department;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     const tasks = await Task.find(filter)
//       .populate("assignedTo", "username department")
//       .lean();

//     if (!tasks.length) return res.status(200).json([]);

//     const todayShiftDate = getShiftDate();
//     const start = startDate ? new Date(startDate) : new Date(todayShiftDate);
//     const end = endDate ? new Date(endDate) : new Date(todayShiftDate);
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     const dateRange = [];
//     for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//       dateRange.push(new Date(d));
//     }

//     const taskIds = tasks.map((t) => t._id);
//     const allStatuses = await TaskStatus.find({
//       taskId: { $in: taskIds },
//       date: { $gte: start, $lte: end },
//     })
//       .populate("employeeId", "username")
//       .lean();

//     const statusMap = new Map();
//     for (const s of allStatuses) {
//       if (!s.employeeId) continue;  
//       const key = `${s.taskId}_${new Date(s.date).toDateString()}`;
//       if (!statusMap.has(key)) statusMap.set(key, []);
//       statusMap.get(key).push(s);
//     }

//     const enrichedTasks = [];
//     for (const task of tasks) {
//       const taskCreatedDate = new Date(task.createdAt);
//       taskCreatedDate.setHours(0, 0, 0, 0);

//       for (const date of dateRange) {
//         if (date < taskCreatedDate) continue;

//         const key = `${task._id}_${date.toDateString()}`;
//         const statuses = statusMap.get(key) || [];

//         let employeeStatus = "";
//         const doneEmployees = [];
//         const notDoneEmployees = [];

//         for (const s of statuses) {
//           if (!s.employeeId) continue;  

//           const empId = s.employeeId._id;
//           const username = s.employeeId.username || "Unknown";

//           if (s.status === "Done") doneEmployees.push({ _id: empId, username });
//           else notDoneEmployees.push({ _id: empId, username });

//           if (empId.toString() === req.user.id) employeeStatus = s.status;
//         }

//         const assignedWithoutStatus = task.assignedTo
//           .filter(
//             (emp) =>
//               !statuses.some(
//                 (s) => s.employeeId?._id.toString() === emp._id.toString()
//               )
//           )
//           .map((emp) => ({ _id: emp._id, username: emp.username }));

//         notDoneEmployees.push(...assignedWithoutStatus);

//         enrichedTasks.push({
//           ...task,
//           employeeStatus,
//           doneEmployees,
//           notDoneEmployees,
//           date,
//         });
//       }
//     }

//     res.status(200).json(enrichedTasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const getCoreTeamTasks = async (req, res) => {
  try {
    const { department, employeeId } = req.query;
    const filter = { isCoreTeamTask: true };

    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
    } else {
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username department")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .lean();

    if (!tasks.length) {
      return res.status(200).json([]);
    }

    const taskIds = tasks.map((t) => t._id);

    const [allRemarks, allStatuses] = await Promise.all([
      Remark.find({ taskId: { $in: taskIds } })
        .populate("senderId", "username")
        .sort({ createdAt: -1 })
        .lean(),
      TaskStatus.find({ taskId: { $in: taskIds } })
        .populate("employeeId", "username")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const remarkMap = new Map();
    for (const r of allRemarks) {
      if (!remarkMap.has(r.taskId)) remarkMap.set(r.taskId, []);
      remarkMap.get(r.taskId).push(r);
    }

    const statusMap = new Map();
    for (const s of allStatuses) {
      if (!statusMap.has(s.taskId)) statusMap.set(s.taskId, []);
      statusMap.get(s.taskId).push(s);
    }

    const enrichedTasks = [];
    for (const task of tasks) {
      const remarks = remarkMap.get(task._id) || [];
      const statuses = statusMap.get(task._id) || [];

      const doneEmployees = [];
      const notDoneEmployees = [];
      let employeeStatus = "Not Done";

      for (const s of statuses) {
        const username = s.employeeId?.username || "Unknown";
        if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
        else notDoneEmployees.push({ _id: s.employeeId._id, username });

        if (
          req.user.accountType === "employee" &&
          s.employeeId._id.toString() === req.user.id
        ) {
          employeeStatus = s.status;
        }
      }

      const assignedWithoutStatus = task.assignedTo
        .filter(
          (emp) =>
            !statuses.some(
              (s) => s.employeeId._id.toString() === emp._id.toString()
            )
        )
        .map((emp) => ({ _id: emp._id, username: emp.username }));

      notDoneEmployees.push(...assignedWithoutStatus);

      enrichedTasks.push({
        ...task,
        remarks,
        employeeStatus,
        doneEmployees,
        notDoneEmployees,
      });
    }

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("❌ Get Core Team Tasks Error:", error);
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

//     const [task, employee] = await Promise.all([
//       Task.findById(taskId).lean(),
//       User.findById(req.user.id).lean(),
//     ]);

//     if (!task) return res.status(404).json({ message: "Task not found" });
//     if (!employee) return res.status(404).json({ message: "Employee not found" });
//     if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
//       return res.status(403).json({ message: "You are not assigned to this task" });
//     }

//     const getISTime = () => {
//       const now = new Date();
//       const istOffset = 5.5 * 60;  
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + istOffset * 60000);
//     };

//     const getShiftDate = () => {
//       const ist = getISTime();
//       const hour = ist.getHours();
//       const shiftDate = new Date(ist);
//       if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);
//       shiftDate.setHours(0, 0, 0, 0);
//       return shiftDate;
//     };

//     const istTime = getISTime();
//     const effectiveDate = getShiftDate();

//     const empShiftStart = new Date(effectiveDate);
//     empShiftStart.setHours(employee.shiftStartHour, 0, 0, 0);

//     const empShiftEnd = new Date(empShiftStart);
//     empShiftEnd.setHours(employee.shiftEndHour, 0, 0, 0);

//     if (employee.shiftEndHour < employee.shiftStartHour) {
//       empShiftEnd.setDate(empShiftEnd.getDate() + 1);
//     }

//     if (employee.shiftStartHour < 6 && istTime.getHours() < 10) {
//       empShiftStart.setDate(empShiftStart.getDate() + 1);
//       empShiftEnd.setDate(empShiftEnd.getDate() + 1);
//     }

//     const allowedWindows = {
//       Start: {
//         start: new Date(empShiftStart),
//         end: new Date(empShiftStart.getTime() + 2 * 60 * 60 * 1000), 
//       },
//       Mid: {
//         start: new Date(empShiftStart.getTime() + 3 * 60 * 60 * 1000),  
//         end: new Date(empShiftStart.getTime() + 6 * 60 * 60 * 1000),    
//       },
//       End: {
//         start: new Date(empShiftStart.getTime() + 8.5 * 60 * 60 * 1000),
//         end: new Date(empShiftStart.getTime() + 10 * 60 * 60 * 1000),   
//       },
//     };

//     const currentShift = task.shift;
//     const allowedWindow = allowedWindows[currentShift];

//     if (!allowedWindow) {
//       return res.status(400).json({ message: "Invalid shift type" });
//     }

//     if (istTime < allowedWindow.start || istTime > allowedWindow.end) {
//       return res.status(403).json({
//         message: `You can only update ${currentShift} shift tasks between ${allowedWindow.start.toLocaleTimeString(
//           "en-IN",
//           { hour: "2-digit", minute: "2-digit", hour12: true }
//         )} and ${allowedWindow.end.toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         })} IST.`,
//       });
//     }

//     let taskStatus = await TaskStatus.findOne({
//       taskId,
//       employeeId: req.user.id,
//       date: effectiveDate,
//     });

//     if (taskStatus) {
//       taskStatus.status = status;
//       taskStatus.updatedAt = new Date();
//       await taskStatus.save();
//     } else {
//       taskStatus = await TaskStatus.create({
//         taskId,
//         employeeId: req.user.id,
//         date: effectiveDate,
//         status,
//         updatedAt: new Date(),
//       });
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

export const updateTaskStatus = async (req, res) => {
  try {
    if (req.user.accountType !== "employee") {
      return res.status(403).json({ message: "Only employees can update status" });
    }

    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Done", "Not Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const [task, employee] = await Promise.all([
      Task.findById(taskId).lean(),
      User.findById(req.user.id).lean(),
    ]);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    // ------------------ TIME HANDLING -------------------
    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + istOffset * 60000);
    };

    const getShiftDate = () => {
      const ist = getISTime();
      const hour = ist.getHours();
      const shiftDate = new Date(ist);
      if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    };

    const istTime = getISTime();
    const effectiveDate = getShiftDate();

    const empShiftStart = new Date(effectiveDate);
    empShiftStart.setHours(employee.shiftStartHour, 0, 0, 0);

    const empShiftEnd = new Date(empShiftStart);
    empShiftEnd.setHours(employee.shiftEndHour, 0, 0, 0);

    if (employee.shiftEndHour < employee.shiftStartHour) {
      empShiftEnd.setDate(empShiftEnd.getDate() + 1);
    }

    if (employee.shiftStartHour < 6 && istTime.getHours() < 10) {
      empShiftStart.setDate(empShiftStart.getDate() + 1);
      empShiftEnd.setDate(empShiftEnd.getDate() + 1);
    }

    const allowedWindows = {
      Start: {
        start: new Date(empShiftStart),
        end: new Date(empShiftStart.getTime() + 2 * 60 * 60 * 1000),
      },
      Mid: {
        start: new Date(empShiftStart.getTime() + 3 * 60 * 60 * 1000),
        end: new Date(empShiftStart.getTime() + 6 * 60 * 60 * 1000),
      },
      End: {
        start: new Date(empShiftStart.getTime() + 8.5 * 60 * 60 * 1000),
        end: new Date(empShiftStart.getTime() + 10 * 60 * 60 * 1000),
      },
    };

    const currentShift = task.shift;
    const allowedWindow = allowedWindows[currentShift];

    if (!allowedWindow) {
      return res.status(400).json({ message: "Invalid shift type" });
    }

    // Time window restriction
    if (istTime < allowedWindow.start || istTime > allowedWindow.end) {
      return res.status(403).json({
        message: `You can only update ${currentShift} shift tasks between ${allowedWindow.start.toLocaleTimeString(
          "en-IN",
          { hour: "2-digit", minute: "2-digit", hour12: true }
        )} and ${allowedWindow.end.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} IST.`,
      });
    }

    // ------------------ SHIFT VALIDATION -------------------
    const shiftOrder = ["Start", "Mid", "End"];
    const currentShiftIndex = shiftOrder.indexOf(currentShift);

    // Only check if NOT first shift
    if (currentShiftIndex > 0) {
      const userTasks = await Task.find({
        assignedTo: req.user.id,
        isActive: true,
      }).lean();

      // Check each previous shift
      for (let i = 0; i < currentShiftIndex; i++) {
        const previousShift = shiftOrder[i];

        const previousShiftTasks = userTasks.filter(
          (t) => t.shift === previousShift
        );

        // ❗ Skip if no tasks exist in previous shift
        if (previousShiftTasks.length === 0) continue;

        const previousTaskIds = previousShiftTasks.map((t) => t._id.toString());

        const statuses = await TaskStatus.find({
          taskId: { $in: previousTaskIds },
          employeeId: req.user.id,
          date: effectiveDate,
        });

        const allPrevDone = previousTaskIds.every((id) => {
          const stat = statuses.find((s) => s.taskId.toString() === id);
          return stat && stat.status !== ""; // must be updated
        });

        if (!allPrevDone) {
          return res.status(403).json({
            message: `Cannot update ${currentShift} tasks. Your ${previousShift} shift tasks are pending.`,
          });
        }
      }
    }

    // ------------------ SAVE STATUS -------------------
    let taskStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: effectiveDate,
    });

    if (taskStatus) {
      taskStatus.status = status;
      taskStatus.updatedAt = new Date();
      await taskStatus.save();
    } else {
      taskStatus = await TaskStatus.create({
        taskId,
        employeeId: req.user.id,
        date: effectiveDate,
        status,
        updatedAt: new Date(),
      });
    }

    await taskStatus.populate("employeeId", "username");

    // 🔥 FIX DATE ALWAYS AS DATE OBJECT
    taskStatus.date = new Date(taskStatus.date);

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


export const updateTaskStatusCoreTeam = async (req, res) => {
  try {
    if (req.user.accountType !== "employee") {
      return res.status(403).json({ message: "Only employees can update status" });
    }

    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Done", "Not Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const [task, employee] = await Promise.all([
      Task.findById(taskId).lean(),
      User.findById(req.user.id).lean(),
    ]);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const isCoreTeam = req.user.isCoreTeam;
    if (!isCoreTeam && !task.assignedTo.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    const effectiveDate = new Date().toISOString().split("T")[0];

    const taskStatus = await TaskStatus.findOneAndUpdate(
      { taskId, employeeId: req.user.id, date: effectiveDate },
      { $set: { status, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).populate("employeeId", "username");

    res.status(200).json({
      message: "Status updated successfully (Core Team)",
      updatedStatus: {
        taskId: taskStatus.taskId,
        employeeId: taskStatus.employeeId._id,
        username: taskStatus.employeeId.username,
        status: taskStatus.status,
        date: taskStatus.date,
      },
    });
  } catch (error) {
    console.error("Core Team Update Task Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can update tasks" });
    }

    const { id } = req.params;
    const { title, description, shift, department, assignedTo, priority, deadline } = req.body;

    const task = await Task.findById(id).lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    const departmentChanged = department && department !== task.department;
    const assignedChanged = Array.isArray(assignedTo) && assignedTo.length;

    const oldAssignedIds = task.assignedTo.map((id) => id.toString());

    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (shift) updatedFields.shift = shift;
    if (department) updatedFields.department = department;
    if (priority) updatedFields.priority = priority;
    if (deadline) updatedFields.deadline = deadline;

    let employees = [];

    if (assignedChanged) {
      employees = await User.find({
        _id: { $in: assignedTo },
        department: department || task.department,
        accountType: "employee",
      }).select("_id");
      updatedFields.assignedTo = employees.map((e) => e._id);
    } else if (departmentChanged && !assignedChanged) {
      employees = await User.find({ department, accountType: "employee" }).select("_id");
      updatedFields.assignedTo = employees.map((e) => e._id);
    } else {
      employees = await User.find({ _id: { $in: task.assignedTo } }).select("_id");
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updatedFields, { new: true }).lean();

    const today = getShiftDate();

    const [existingStatuses, newEmployeeIds] = await Promise.all([
      TaskStatus.find({ taskId: task._id, date: today }).select("employeeId"),
      Promise.resolve(employees.map((e) => e._id.toString())),
    ]);

    const existingEmployeeIds = existingStatuses.map((s) => s.employeeId.toString());

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
      task: updatedTask,
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

    const task = await Task.findById(id).select("_id").lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Promise.all([
      Task.findByIdAndDelete(id),
      TaskStatus.deleteMany({ taskId: id }),
    ]);

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
    }).select("_id");

    if (!employees.length)
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

    await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => {});

    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.error("Assign Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const { date, shift } = req.query;
    const filter = req.user.accountType === "employee" ? { assignedTo: req.user.id } : {};

    const query = Task.find(filter).populate("assignedTo", "username department");
    if (shift) query.where("shift").equals(shift);
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.where("createdAt").gte(start).lte(end);
    }

    const tasks = await query.lean();
    const taskIds = tasks.map(t => t._id);
    const statuses = await TaskStatus.find({ taskId: { $in: taskIds } }).sort({ updatedAt: -1 }).lean();

    const taskStatusMap = {};
    for (const s of statuses) {
      const tId = s.taskId.toString();
      const eId = s.employeeId.toString();
      if (!taskStatusMap[tId]) taskStatusMap[tId] = {};
      if (!taskStatusMap[tId][eId]) taskStatusMap[tId][eId] = s.status;
    }

    const result = tasks.map(task => {
      const done = [];
      const notDone = [];
      let empStatus = "Not Done";

      for (const emp of task.assignedTo) {
        const status = taskStatusMap[task._id.toString()]?.[emp._id.toString()] || "Not Done";
        (status === "Done" ? done : notDone).push({ _id: emp._id, username: emp.username });
        if (emp._id.toString() === req.user.id) empStatus = status;
      }

      return { ...task, employeeStatus: empStatus, doneEmployees: done, notDoneEmployees: notDone };
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

//     const { department, shift } = req.query;

//     const getISTime = () => {
//       const now = new Date();
//       const offset = 5.5 * 60;
//       const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//       return new Date(utc + offset * 60000);
//     };

//     const getShiftDate = () => {
//       const ist = getISTime();
//       if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
//       ist.setHours(0, 0, 0, 0);
//       return ist;
//     };

//     const currentShiftDate = getShiftDate();
//     const end = new Date(currentShiftDate);
//     const start = new Date(currentShiftDate);
//     start.setFullYear(start.getFullYear() - 1);
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     const statuses = await Task.aggregate([
//       {
//         $match: {
//           createdAt: { $lte: end },
//           ...(department && { department }),
//           ...(shift && { shift }),
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "assignedTo",
//           foreignField: "_id",
//           as: "employees",
//         },
//       },
//       { $unwind: "$employees" },
//       {
//         $lookup: {
//           from: "taskstatuses",
//           let: { taskId: "$_id", empId: "$employees._id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$taskId", "$$taskId"] },
//                     { $eq: ["$employeeId", "$$empId"] },
//                     { $lte: ["$date", end] },
//                   ],
//                 },
//               },
//             },
//             { $sort: { updatedAt: -1 } },
//             { $limit: 1 },
//           ],
//           as: "latestStatusDoc",
//         },
//       },
//       {
//         $addFields: {
//           latestStatus: { $arrayElemAt: ["$latestStatusDoc", 0] },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           Task: "$title",
//           Shift: "$shift",
//           Department: "$department",
//           Employee: "$employees.username",
//           Date: {
//             $dateToString: {
//               format: "%Y-%m-%d",
//               date: { $ifNull: ["$latestStatus.date", "$createdAt"] },
//             },
//           },
//           RawTime: { $ifNull: ["$latestStatus.updatedAt", "$updatedAt"] },
//           Status: {
//             $cond: {
//               if: { $ifNull: ["$latestStatus.status", false] },
//               then: "$latestStatus.status",
//               else: "Not Done",
//             },
//           },
//         },
//       },
//     ]);

//     const istNow = getISTime();
//     const effectiveDate = new Date(istNow);
//     const hour = istNow.getHours();
//     if (hour < 10) effectiveDate.setDate(effectiveDate.getDate() - 1);
//     effectiveDate.setHours(0, 0, 0, 0);

//     for (const s of statuses) {
//       if (new Date(s.Date) > effectiveDate)
//         s.Date = effectiveDate.toISOString().split("T")[0];

//       s.Time = s.RawTime
//         ? new Date(s.RawTime).toLocaleTimeString("en-IN", {
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//             timeZone: "Asia/Kolkata",
//           })
//         : "--";
//       delete s.RawTime;
//     }

//     const monthGroups = {};
//     for (const s of statuses) {
//       const d = new Date(s.Date);
//       if (d >= start && d <= end) {
//         const key = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
//         (monthGroups[key] ??= []).push(s);
//       }
//     }

//     const workbook = XLSX.utils.book_new();
//     const headerStyle = {
//       font: { bold: true, color: { rgb: "FFFFFF" } },
//       fill: { fgColor: { rgb: "4472C4" } },
//       alignment: { horizontal: "center" },
//     };

//     for (const [month, data] of Object.entries(monthGroups)) {
//       const styledData = [
//         {
//           Task: { v: "Task", s: headerStyle },
//           Shift: { v: "Shift", s: headerStyle },
//           Department: { v: "Department", s: headerStyle },
//           Employee: { v: "Employee", s: headerStyle },
//           Date: { v: "Date", s: headerStyle },
//           Time: { v: "Updated Time", s: headerStyle },
//           Status: { v: "Status", s: headerStyle },
//         },
//         ...data.map((item) => ({
//           Task: { v: item.Task },
//           Shift: { v: item.Shift },
//           Department: { v: item.Department },
//           Employee: { v: item.Employee },
//           Date: { v: item.Date },
//           Time: { v: item.Time },
//           Status: {
//             v: item.Status,
//             s: {
//               font: {
//                 color: {
//                   rgb: item.Status.toLowerCase() === "done" ? "008000" : "FF0000",
//                 },
//                 bold: true,
//               },
//             },
//           },
//         })),
//       ];

//       const worksheet = XLSX.utils.json_to_sheet(styledData, { skipHeader: true });
//       worksheet["!cols"] = ["Task", "Shift", "Department", "Employee", "Date", "Time", "Status"].map(
//         (key) => ({
//           wch: Math.max(
//             key.length,
//             ...data.map((row) => (row[key] ? row[key].toString().length : 0))
//           ) + 5,
//         })
//       );

//       XLSX.utils.book_append_sheet(workbook, worksheet, month);
//     }

//     const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
//     const fileName = `Task_Status_Last_12_Months_${Date.now()}.xlsx`;

//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.send(buffer);
//   } catch (error) {
//     console.error("Export Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const Defaulter = async (req, res) => {
//   try {
//     const { department, shift, employeeId, startDate, endDate, page = 1, limit = 30 } = req.query;
//     const pageNum = Math.max(1, parseInt(page));
//     const pageSize = parseInt(limit);

//     const getISTime = () => {
//       const now = new Date();
//       const istOffset = 5.5 * 60;
//       return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset * 60000);
//     };

//     const getShiftDate = () => {
//       const ist = getISTime();
//       if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
//       ist.setHours(0, 0, 0, 0);
//       return ist;
//     };

//     const filter = {};
//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//       if (shift) filter.shift = shift;
//     } else {
//       if (department) filter.department = department;
//       if (shift) filter.shift = shift;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     const tasks = await Task.find(filter)
//       .populate("assignedTo", "username department shiftStartHour shiftEndHour")
//       .lean();

//     if (!tasks.length) {
//       return res.status(200).json({
//         success: true,
//         totalDefaulters: 0,
//         overallTotalDefaults: 0,
//         data: [],
//         totalPages: 0,
//         currentPage: pageNum
//       });
//     }

//     const taskIds = tasks.map(t => t._id);
//     const start = startDate ? new Date(startDate) : getShiftDate();
//     const end = endDate ? new Date(endDate) : getShiftDate();
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);

//     const statuses = await TaskStatus.find({
//       taskId: { $in: taskIds },
//       date: { $gte: start, $lte: end },
//     })
//       .select("taskId employeeId status date updatedAt")
//       .lean();

//     const statusMap = new Map();
//     statuses.forEach(s => {
//       const key = `${s.taskId}_${s.employeeId}_${new Date(s.date).toDateString()}`;
//       const existing = statusMap.get(key);
//       if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
//         statusMap.set(key, s);
//       }
//     });

//     const defaulterMap = new Map();
//     const employeeDefaultSets = new Map();
//     const nowIst = getISTime();

//     const computeShiftWindow = (emp, date, taskShift) => {
//       const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 18;
//       const empShiftStart = new Date(date);
//       empShiftStart.setHours(startHour, 0, 0, 0);
//       const durations = { Start: 3, Mid: 5, End: 1 };
//       const windowEnd = new Date(empShiftStart);
//       windowEnd.setHours(windowEnd.getHours() + (durations[taskShift] || 3));
//       return { windowStart: empShiftStart, windowEnd };
//     };

//     for (const task of tasks) {
//       for (const emp of task.assignedTo) {
//         if (employeeId && emp._id.toString() !== employeeId.toString()) continue;
//         const { windowStart, windowEnd } = computeShiftWindow(emp, start, task.shift);
//         if (nowIst < windowStart || nowIst <= windowEnd) continue;

//         const statusKey = `${task._id}_${emp._id}_${start.toDateString()}`;
//         const latestStatus = statusMap.get(statusKey);
//         if ((latestStatus?.status || "Not Done") !== "Done") {
//           const key = `${emp._id}_${start.toDateString()}`;
//           const existing = defaulterMap.get(key) || {
//             date: new Date(start),
//             employeeId: emp._id,
//             employeeName: emp.username,
//             notDoneTasksToday: 0,
//           };
//           existing.notDoneTasksToday += 1;
//           defaulterMap.set(key, existing);

//           const setForEmp = employeeDefaultSets.get(emp._id.toString()) || new Set();
//           setForEmp.add(`${task._id}_${emp._id}`);
//           employeeDefaultSets.set(emp._id.toString(), setForEmp);
//         }
//       }
//     }

//     const allData = Array.from(defaulterMap.values()).map(entry => {
//       const totalSet = employeeDefaultSets.get(entry.employeeId.toString()) || new Set();
//       return { ...entry, totalDefaultsTillDate: totalSet.size };
//     });

//     allData.sort((a, b) => b.date - a.date);
//     const totalDefaulters = allData.length;
//     const totalPages = Math.ceil(totalDefaulters / pageSize);
//     const startIndex = (pageNum - 1) * pageSize;
//     const paginatedData = allData.slice(startIndex, startIndex + pageSize);

//     const overallTotalDefaults = Array.from(employeeDefaultSets.values()).reduce((sum, s) => sum + (s.size || 0), 0);

//     res.status(200).json({
//       success: true,
//       totalDefaulters,
//       overallTotalDefaults,
//       data: paginatedData,
//       totalPages,
//       currentPage: pageNum,
//     });
//   } catch (error) {
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
      const offset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + offset * 60000);
    };

    const getShiftDate = () => {
      const ist = getISTime();
      if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
      ist.setHours(0, 0, 0, 0);
      return ist;
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
          let: { taskId: "$_id", empId: "$employees._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$taskId", "$$taskId"] },
                    { $eq: ["$employeeId", "$$empId"] },
                    { $lte: ["$date", end] },
                  ],
                },
              },
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 1 },
          ],
          as: "latestStatusDoc",
        },
      },
      {
        $addFields: {
          latestStatus: { $arrayElemAt: ["$latestStatusDoc", 0] },
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

          Status: {
            $cond: {
              if: { $ifNull: ["$latestStatus.status", false] },
              then: "$latestStatus.status",
              else: "Not Done",
            },
          },
        },
      },
    ]);

    // Shift-correct date logic
    const istNow = getISTime();
    const effectiveDate = new Date(istNow);
    if (istNow.getHours() < 10) effectiveDate.setDate(effectiveDate.getDate() - 1);
    effectiveDate.setHours(0, 0, 0, 0);

    // FIX: Ensure tasks with NO status still included
    const cleaned = [];
    for (const s of statuses) {
      const realDate = new Date(s.Date);

      // If task created after shift cutoff => assign previous shift date
      if (realDate > effectiveDate) {
        s.Date = effectiveDate.toISOString().split("T")[0];
      }

      // Add readable time
      s.Time = s.RawTime
        ? new Date(s.RawTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
        : "--";

      delete s.RawTime;

      const finalDate = new Date(s.Date);
      if (finalDate >= start && finalDate <= end) {
        cleaned.push(s); // ALWAYS pushes — no missing rows
      }
    }

    // Group by month
    const monthGroups = {};
    for (const s of cleaned) {
      const d = new Date(s.Date);
      const key = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
      (monthGroups[key] ??= []).push(s);
    }

    // Excel generation
    const workbook = XLSX.utils.book_new();
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center" },
    };

    for (const [month, data] of Object.entries(monthGroups)) {
      const styledData = [
        {
          Task: { v: "Task", s: headerStyle },
          Shift: { v: "Shift", s: headerStyle },
          Department: { v: "Department", s: headerStyle },
          Employee: { v: "Employee", s: headerStyle },
          Date: { v: "Date", s: headerStyle },
          Time: { v: "Updated Time", s: headerStyle },
          Status: { v: "Status", s: headerStyle },
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
                color: {
                  rgb: item.Status.toLowerCase() === "done" ? "008000" : "FF0000",
                },
                bold: true,
              },
            },
          },
        })),
      ];

      const worksheet = XLSX.utils.json_to_sheet(styledData, { skipHeader: true });

      worksheet["!cols"] = ["Task", "Shift", "Department", "Employee", "Date", "Time", "Status"].map(
        (key) => ({
          wch: Math.max(
            key.length,
            ...data.map((row) => (row[key] ? row[key].toString().length : 0))
          ) + 5,
        })
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, month);
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `Task_Status_Last_12_Months_${Date.now()}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const Defaulter = async (req, res) => {
  try {
    const { department, shift, employeeId, startDate, endDate, page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = parseInt(limit);

    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset * 60000);
    };

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
      .lean();

    if (!tasks.length) {
      return res.status(200).json({
        success: true,
        totalDefaulters: 0,
        overallTotalDefaults: 0,
        data: [],
        totalPages: 0,
        currentPage: pageNum
      });
    }

    const taskIds = tasks.map(t => t._id);
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const statuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: { $gte: start, $lte: end },
    })
      .select("taskId employeeId status date updatedAt")
      .lean();

    // Map for latest status per task + employee + shiftDate
    const statusMap = new Map();
    statuses.forEach(s => {
      const key = `${s.taskId}_${s.employeeId}_${new Date(s.date).toDateString()}`;
      const existing = statusMap.get(key);
      if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
        statusMap.set(key, s);
      }
    });

    const defaulterMap = new Map();
    const employeeDefaultSets = new Map();
    const nowIst = getISTime();

    // const computeShiftWindow = (emp, shiftType) => {
    //   // Determine shiftDate based on employee shift start
    //   const shiftDate = new Date(nowIst);
    //   const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 18;

    //   // If early morning shift (<10AM) and current time < 10AM, shift belongs to previous day
    //   if (startHour < 10 && nowIst.getHours() < 10) shiftDate.setDate(shiftDate.getDate() - 1);
    //   shiftDate.setHours(startHour, 0, 0, 0);

    //   const allowedWindows = {
    //     Start: { start: new Date(shiftDate), end: new Date(shiftDate.getTime() + 2 * 60 * 60 * 1000) },
    //     Mid: { start: new Date(shiftDate.getTime() + 3 * 60 * 60 * 1000), end: new Date(shiftDate.getTime() + 6 * 60 * 60 * 1000) },
    //     End: { start: new Date(shiftDate.getTime() + 8.5 * 60 * 60 * 1000), end: new Date(shiftDate.getTime() + 10 * 60 * 60 * 1000) },
    //   };

    //   return allowedWindows[shiftType] || null;
    // };

  const computeShiftWindow = (emp, shiftType) => {
  const now = getISTime();

  const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 18;
  const endHour = typeof emp.shiftEndHour === "number" ? emp.shiftEndHour : 2;

  const shiftDate = new Date(now);

  const shiftCrossesMidnight = startHour > endHour;

  // Normal date calculation (same as before)
  if (startHour >= 0 && startHour < 6) shiftDate.setDate(shiftDate.getDate() - 1);
  else if (shiftCrossesMidnight && now.getHours() < endHour) shiftDate.setDate(shiftDate.getDate() - 1);
  else if (startHour >= 18 && now.getHours() < startHour) shiftDate.setDate(shiftDate.getDate() - 1);

  // -------------------------------
  //  ⭐ NEW RULE (your requirement)
  //  From 2 PM today → to 2 PM next day
  //  ALWAYS show previous day's defaulters
  // -------------------------------
  const hour = now.getHours();
  if (hour >= 14 || hour < 14) {
    // If time is between 2 PM today and 2 PM tomorrow
    if (!(hour < 14)) { 
      // from 14:00 today until 23:59 → previous day
      shiftDate.setDate(shiftDate.getDate() - 1);
    }
  }
  if (hour < 14) {
    // next day before 2 PM → still previous day
    const diffHours = (now - shiftDate) / (1000 * 60 * 60);
    if (diffHours < 24) {
      shiftDate.setDate(shiftDate.getDate() - 1);
    }
  }

  shiftDate.setHours(startHour, 0, 0, 0);

  const allowedWindows = {
    Start: { start: new Date(shiftDate), end: new Date(shiftDate.getTime() + 2 * 60 * 60 * 1000) },
    Mid:   { start: new Date(shiftDate.getTime() + 3 * 60 * 60 * 1000), end: new Date(shiftDate.getTime() + 6 * 60 * 60 * 1000) },
    End:   { start: new Date(shiftDate.getTime() + 8.5 * 60 * 60 * 1000), end: new Date(shiftDate.getTime() + 10 * 60 * 60 * 1000) }
  };

  return allowedWindows[shiftType] || null;
};



    for (const task of tasks) {
      for (const emp of task.assignedTo) {
        if (employeeId && emp._id.toString() !== employeeId.toString()) continue;

        const shiftWindow = computeShiftWindow(emp, task.shift);
        if (!shiftWindow) continue;

        // Only count as defaulter if shift window has passed
        if (nowIst <= shiftWindow.end) continue;

        const shiftDateKey = shiftWindow.start.toDateString();
        const statusKey = `${task._id}_${emp._id}_${shiftDateKey}`;
        const latestStatus = statusMap.get(statusKey);

        if ((latestStatus?.status || "Not Done") !== "Done") {
          const key = `${emp._id}_${shiftDateKey}`;
          const existing = defaulterMap.get(key) || {
            date: new Date(shiftWindow.start),
            employeeId: emp._id,
            employeeName: emp.username,
            notDoneTasksToday: 0,
          };
          existing.notDoneTasksToday += 1;
          defaulterMap.set(key, existing);

          const setForEmp = employeeDefaultSets.get(emp._id.toString()) || new Set();
          setForEmp.add(`${task._id}_${emp._id}_${shiftDateKey}`);
          employeeDefaultSets.set(emp._id.toString(), setForEmp);
        }
      }
    }

    const allData = Array.from(defaulterMap.values()).map(entry => {
      const totalSet = employeeDefaultSets.get(entry.employeeId.toString()) || new Set();
      return { ...entry, totalDefaultsTillDate: totalSet.size };
    });

    allData.sort((a, b) => b.date - a.date);
    const totalDefaulters = allData.length;
    const totalPages = Math.ceil(totalDefaulters / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedData = allData.slice(startIndex, startIndex + pageSize);

    const overallTotalDefaults = Array.from(employeeDefaultSets.values()).reduce((sum, s) => sum + (s.size || 0), 0);

    res.status(200).json({
      success: true,
      totalDefaulters,
      overallTotalDefaults,
      data: paginatedData,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEmployeeDefaulters = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = parseInt(limit);

    const employee = await User.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset * 60000);
    };

    const getShiftDate = () => {
      const now = getISTime();
      if (now.getHours() < 10) now.setDate(now.getDate() - 1);
      now.setHours(0, 0, 0, 0);
      return now;
    };

    const endDate = getShiftDate();
    const startDate = new Date(endDate);
    startDate.setFullYear(endDate.getFullYear() - 1);

    const tasks = await Task.find({ assignedTo: employeeId }).select("_id title shift department priority createdAt").lean();
    if (!tasks.length) return res.json({ success: true, totalDefaults: 0, data: [], totalPages: 0, currentPage: pageNum });

    const taskIds = tasks.map(t => t._id);

    const pipeline = [
      { $match: { employeeId: new mongoose.Types.ObjectId(employeeId), taskId: { $in: taskIds }, date: { $gte: startDate, $lte: endDate } } },
      { $sort: { updatedAt: -1 } },
      { $group: { _id: { taskId: "$taskId", date: "$date" }, status: { $first: "$status" } } },
      { $project: { taskId: "$_id.taskId", date: "$_id.date", status: 1 } }
    ];

    const statuses = await TaskStatus.aggregate(pipeline);
    const statusMap = new Map();
    statuses.forEach(s => statusMap.set(`${s.taskId}_${s.date.toISOString().split("T")[0]}`, s.status));

    const nowIst = getISTime();

    const defaults = tasks.flatMap(task => {
      const loopStart = startDate > task.createdAt ? startDate : task.createdAt;
      const daysDiff = Math.ceil((endDate - loopStart) / (1000 * 60 * 60 * 24));
      return Array.from({ length: daysDiff + 1 }, (_, i) => {
        const d = new Date(loopStart);
        d.setDate(loopStart.getDate() + i);
        const key = `${task._id}_${d.toISOString().split("T")[0]}`;
        if ((statusMap.get(key) || "Not Done") !== "Done") {
          return { date: new Date(d), title: task.title, shift: task.shift, department: task.department, priority: task.priority };
        }
        return null;
      }).filter(Boolean);
    });

    defaults.sort((a, b) => b.date - a.date);

    const totalDefaults = defaults.length;
    const totalPages = Math.ceil(totalDefaults / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedData = defaults.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      employeeName: employee.username,
      totalDefaults,
      totalPages,
      currentPage: pageNum,
      limit: pageSize,
      data: paginatedData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCoreTeamTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can create core team tasks" });

    const { title, description, department, assignedTo, priority, initialRemark } = req.body;
    if (!title || !department)
      return res.status(400).json({ message: "Title and department are required" });

    const employeeFilter = {
      department,
      isCoreTeam: true,
      accountType: "employee",
      ...(assignedTo?.length ? { _id: { $in: assignedTo } } : {}),
    };

    const employees = await User.find(employeeFilter);
    if (!employees.length)
      return res.status(404).json({ message: "No core team employees found in this department" });

    const newTask = await Task.create({
      title,
      description,
      department,
      assignedTo: employees.map(e => e._id),
      createdBy: req.user._id,
      priority: priority || "Medium",
      isCoreTeamTask: true,
      shift: null,
    });

    if (initialRemark?.trim()) {
      await Remark.create({
        taskId: newTask._id,
        senderId: req.user._id,
        message: initialRemark.trim(),
      });
    }

    const populatedTask = await Task.findById(newTask._id)
      .populate("assignedTo", "username department")
      .populate("createdBy", "username");

    res.status(201).json({
      message: "Core Team Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create Core Team Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



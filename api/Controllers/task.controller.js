import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import XLSX from "xlsx-js-style";
import Remark from "../Modals/Remark.modal.js";
import { getEffectiveTaskDate } from "../utils/getEffectiveTaskDate.js";


// const getISTime = () => {
//   const now = new Date();
//   const istOffset = 5.5 * 60;  
//   const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//   return new Date(utc + istOffset * 60000);
// };

// const getShiftDate = () => {
//   const ist = getISTime();
//   const hour = ist.getHours();

//   const shiftDate = new Date(ist);
//   if (hour < 10) shiftDate.setDate(shiftDate.getDate() - 1);

//   shiftDate.setHours(0, 0, 0, 0);
//   return shiftDate;
// };

// Keep the same name so no other file breaks
const getISTime = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
};

const getShiftDate = () => {
  const istNow = getISTime();
  const shiftDate = new Date(istNow);
  if (istNow.getHours() < 12) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }
  shiftDate.setHours(0, 0, 0, 0);

  return shiftDate;  
};
export { getISTime, getShiftDate };
// export const createTask = async (req, res) => {
//   try {
//     const { accountType, id: userId } = req.user;
//     if (!["admin", "superAdmin"].includes(accountType)) {
//       return res.status(403).json({ message: "Only admin or super admin can create tasks" });
//     }

//     const { title, description, shift, department, assignedTo, deadline, priority } = req.body;

//     if (!title || (!shift && accountType !== "superAdmin") || !department) {
//       return res.status(400).json({
//         message: "Title, shift (for non-super admin), and department are required"
//       });
//     }

//     let usersToAssign = [];

//     // ✅ Only assign to users explicitly provided
//     if (assignedTo?.length) {
//       usersToAssign = await User.find({ _id: { $in: assignedTo } });
//       if (usersToAssign.length === 0) {
//         return res.status(404).json({ message: "No valid users found in assignedTo list" });
//       }
//     } else {
//       // If assignedTo is empty, assign to all employees in the department
//       usersToAssign = await User.find({ department });
//       if (usersToAssign.length === 0) {
//         return res.status(404).json({ message: "No users found in this department" });
//       }
//     }

//     const newTask = await Task.create({
//       title,
//       description,
//       shift: accountType === "superAdmin" ? shift || null : shift,
//       department,
//       assignedTo: usersToAssign.map(u => u._id),
//       createdBy: userId,
//       deadline,
//       priority,
//       statusUnlocked: false,
//       isCoreTeamTask: false
//     });

//     // Initialize task statuses for all assigned users
//     const today = getShiftDate();
//     const statuses = usersToAssign.map(u => ({
//       taskId: newTask._id,
//       employeeId: u._id,
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

export const createTask = async (req, res) => {
  try {
    const { accountType, id: userId } = req.user;
    if (accountType !== "admin" && accountType !== "superAdmin") {
      return res.status(403).json({ message: "Only admin or super admin can create tasks" });
    }

    const { title, description, shift, department, assignedTo, deadline, priority } = req.body;

    if (!title || (!shift && accountType !== "superAdmin") || !department) {
      return res
        .status(400)
        .json({ message: "Title, shift (for non-super admin), and department are required" });
    }

    let usersToAssign = [];

    if (assignedTo?.length) {
      if (accountType === "superAdmin") {
        usersToAssign = await User.find({ _id: { $in: assignedTo } });
      } else {
        usersToAssign = await User.find({
          _id: { $in: assignedTo },
          department,
          accountType: "employee",
        });
      }
    } else {
      if (accountType === "superAdmin") {
        usersToAssign = await User.find({ department });
      } else {
        usersToAssign = await User.find({ department, accountType: "employee" });
      }
    }

    if (usersToAssign.length === 0) {
      return res.status(404).json({ message: "No valid users found to assign the task" });
    }

    const newTask = await Task.create({
      title,
      description,
      shift: accountType === "superAdmin" ? shift || null : shift,  
      department,
      assignedTo: usersToAssign.map((u) => u._id),
      createdBy: userId,
      deadline,
      priority,
      statusUnlocked: false,
      isCoreTeamTask: false,  
    });
    const today = getShiftDate();
    const statuses = usersToAssign.map((u) => ({
      taskId: newTask._id,
      employeeId: u._id,
      date: today,
      status: "",
    }));
    await TaskStatus.insertMany(statuses);

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
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

    const today = getShiftDate();

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
      let employeeStatus = "";

      for (const s of statuses) {
        const username = s.employeeId?.username || "Unknown";

        if (s.status === "Done") {
          doneEmployees.push({ _id: s.employeeId._id, username });
        } else {
          notDoneEmployees.push({ _id: s.employeeId._id, username });
        }

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
        date: today,
        canUpdate: true, 
      });
    }

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("❌ Get Core Team Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateTaskStatus = async (req, res) => {
  try {
    if (req.user.accountType !== "employee" && req.user.accountType !== "HR") {
      return res.status(403).json({ message: "Only employees and HR can update status" });
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

    if (!task || !employee) {
      return res.status(404).json({ message: "Task or employee not found" });
    }

    if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    const istTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    const getEffectiveDate = () => {
      const date = new Date(istTime);
      if (date.getHours() < 10) {
        date.setDate(date.getDate() - 1);
      }
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const effectiveDate = getEffectiveDate();
    
    let taskDate = task.date ? new Date(task.date) : new Date(effectiveDate);
    taskDate.setHours(0, 0, 0, 0);

    const calculateShiftWindows = () => {
      const windows = {};
      const startHour = employee.shiftStartHour;
      
      // CRITICAL FIX: For 1 AM shift workers, we need to handle the fact that
      // they work across midnight and update yesterday's tasks today
      let baseDate = new Date(taskDate);
      
      // Check if this is a 1 AM shift worker updating yesterday's task
      if (startHour === 1 && employee.shiftEndHour === 10) {
        const currentDate = new Date(istTime);
        currentDate.setHours(0, 0, 0, 0);
        
        const taskDateOnly = new Date(taskDate);
        taskDateOnly.setHours(0, 0, 0, 0);
        
        // Check if task is from yesterday
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (taskDateOnly.getTime() === yesterday.getTime()) {
          // Task is from yesterday, employee is working today at 1 AM
          // Use TODAY'S date for window calculation
          baseDate = new Date(currentDate);
        }
      }
      
      const startShiftStart = new Date(baseDate);
      startShiftStart.setHours(startHour, 0, 0, 0);
      
      windows.Start = {
        start: new Date(startShiftStart),
        end: new Date(startShiftStart.getTime() + 2 * 60 * 60 * 1000)
      };

      windows.Mid = {
        start: new Date(startShiftStart.getTime() + 3 * 60 * 60 * 1000),
        end: new Date(startShiftStart.getTime() + 6 * 60 * 60 * 1000)
      };

      windows.End = {
        start: new Date(startShiftStart.getTime() + 8.5 * 60 * 60 * 1000),
        end: new Date(startShiftStart.getTime() + 10 * 60 * 60 * 1000)
      };

      const adjustOvernight = (window) => {
        if (window.end.getDate() !== baseDate.getDate()) {
          const nextDay = new Date(baseDate);
          nextDay.setDate(nextDay.getDate() + 1);
          if (window.start.getDate() === baseDate.getDate()) {
            window.end = nextDay;
            window.end.setHours(window.end.getHours(), 0, 0, 0);
          } else {
            window.start = nextDay;
            window.start.setHours(window.start.getHours(), 0, 0, 0);
            window.end = new Date(nextDay.getTime() + (window.end.getTime() - window.start.getTime()));
          }
        }
      };

      if (employee.shiftEndHour < employee.shiftStartHour) {
        adjustOvernight(windows.Start);
        adjustOvernight(windows.Mid);
        adjustOvernight(windows.End);
      }

      return windows;
    };

    const allowedWindows = calculateShiftWindows();
    const currentShift = task.shift;
    const allowedWindow = allowedWindows[currentShift];

    if (!allowedWindow) {
      return res.status(400).json({ message: "Invalid shift type" });
    }

    // CRITICAL FIX: Special time check for 1 AM shift workers
    if (employee.shiftStartHour === 1 && employee.shiftEndHour === 10) {
      const currentDate = new Date(istTime);
      currentDate.setHours(0, 0, 0, 0);
      
      const taskDateOnly = new Date(taskDate);
      taskDateOnly.setHours(0, 0, 0, 0);
      
      // Check if task is from yesterday
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (taskDateOnly.getTime() === yesterday.getTime()) {
        // Task is from yesterday, employee is working today
        // Check if current time is within today's shift window
        const currentHour = istTime.getHours();
        const currentMinute = istTime.getMinutes();
        
        if (currentShift === "Start") {
          // Start shift: Today 1 AM - 3 AM
          if (currentHour < 1 || currentHour >= 3) {
            return res.status(403).json({
              message: `Start shift window has ${currentHour < 1 ? "not started yet" : "passed"}. Available from 01:00 AM to 03:00 AM IST`
            });
          }
        } else if (currentShift === "Mid") {
          // Mid shift: Today 4 AM - 7 AM
          if (currentHour < 4 || currentHour >= 7) {
            return res.status(403).json({
              message: `Mid shift window has ${currentHour < 4 ? "not started yet" : "passed"}. Available from 04:00 AM to 07:00 AM IST`
            });
          }
        } else if (currentShift === "End") {
          // End shift: Today 9:30 AM - 11:00 AM
          const isValidTime = (currentHour === 9 && currentMinute >= 30) || 
                            (currentHour === 10) ||
                            (currentHour === 11 && currentMinute === 0);
          
          if (!isValidTime) {
            return res.status(403).json({
              message: `End shift window has ${currentHour < 9 || (currentHour === 9 && currentMinute < 30) ? "not started yet" : "passed"}. Available from 09:30 AM to 11:00 AM IST`
            });
          }
        }
      } else {
        // Task is for today, use normal time check
        if (istTime < allowedWindow.start) {
          return res.status(403).json({
            message: `${currentShift} shift window hasn't started yet. Available from ${allowedWindow.start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
          });
        }

        if (istTime > allowedWindow.end) {
          return res.status(403).json({
            message: `${currentShift} shift window has passed. It was available until ${allowedWindow.end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
          });
        }
      }
    } else {
      // For other shifts, use normal time check
      if (istTime < allowedWindow.start) {
        return res.status(403).json({
          message: `${currentShift} shift window hasn't started yet. Available from ${allowedWindow.start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
        });
      }

      if (istTime > allowedWindow.end) {
        return res.status(403).json({
          message: `${currentShift} shift window has passed. It was available until ${allowedWindow.end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
        });
      }
    }

    // REMOVED SHIFT DEPENDENCY CHECK - Employees can now update tasks in any order
    // The code block that checked if previous shift tasks were completed has been removed

    let taskStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: effectiveDate
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
        updatedAt: new Date()
      });
    }

    await taskStatus.populate("employeeId", "username");
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
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const isAssigned =
      task.assignedTo?.some((id) => id.toString() === req.user.id);
    if (!req.user.isCoreTeam && !isAssigned) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }
    const today = getShiftDate();
    const existingStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: today,
    }).lean();
    const taskStatus = await TaskStatus.findOneAndUpdate(
      {
        taskId,
        employeeId: req.user.id,
        date: today,
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
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
    console.error("❌ Core Team Update Task Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, shift, department, assignedTo, priority, deadline } = req.body;
    const task = await Task.findById(id).lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user._id.toString() !== task.createdBy.toString()) {
      return res.status(403).json({ 
        message: "Only the creator of the task can update it" 
      });
    }
    const departmentChanged = department && department !== task.department;
    const assignedChanged = Array.isArray(assignedTo) && assignedTo.length > 0;  

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
      }).select("_id accountType department");
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
      await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => { });
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
// export const updateTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin" && req.user.accountType !== "superAdmin") {
//       return res.status(403).json({ message: "Only admin can update tasks" });
//     }

//     const { id } = req.params;
//     const { title, description, shift, department, assignedTo, priority, deadline } = req.body;

//     const task = await Task.findById(id).lean();
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     const departmentChanged = department && department !== task.department;
//     const assignedChanged = Array.isArray(assignedTo) && assignedTo.length;

//     const oldAssignedIds = task.assignedTo.map((id) => id.toString());

//     const updatedFields = {};
//     if (title) updatedFields.title = title;
//     if (description) updatedFields.description = description;
//     if (shift) updatedFields.shift = shift;
//     if (department) updatedFields.department = department;
//     if (priority) updatedFields.priority = priority;
//     if (deadline) updatedFields.deadline = deadline;

//     let employees = [];

//     if (assignedChanged) {
//       employees = await User.find({
//         _id: { $in: assignedTo },
//         department: department || task.department,
//         accountType: "employee",
//       }).select("_id");
//       updatedFields.assignedTo = employees.map((e) => e._id);
//     } else if (departmentChanged && !assignedChanged) {
//       employees = await User.find({ department, accountType: "employee" }).select("_id");
//       updatedFields.assignedTo = employees.map((e) => e._id);
//     } else {
//       employees = await User.find({ _id: { $in: task.assignedTo } }).select("_id");
//     }

//     const updatedTask = await Task.findByIdAndUpdate(id, updatedFields, { new: true }).lean();

//     const today = getShiftDate();

//     const [existingStatuses, newEmployeeIds] = await Promise.all([
//       TaskStatus.find({ taskId: task._id, date: today }).select("employeeId"),
//       Promise.resolve(employees.map((e) => e._id.toString())),
//     ]);

//     const existingEmployeeIds = existingStatuses.map((s) => s.employeeId.toString());

//     const newStatuses = employees
//       .filter((emp) => !existingEmployeeIds.includes(emp._id.toString()))
//       .map((emp) => ({
//         taskId: task._id,
//         employeeId: emp._id,
//         date: today,
//         status: "Not Done",
//       }));

//     if (newStatuses.length > 0) {
//       await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => {});
//     }

//     const removedEmployees = oldAssignedIds.filter((id) => !newEmployeeIds.includes(id));
//     if (removedEmployees.length > 0) {
//       await TaskStatus.deleteMany({
//         taskId: task._id,
//         employeeId: { $in: removedEmployees },
//       });
//     }

//     res.status(200).json({
//       message: "Task updated successfully",
//       task: updatedTask,
//     });
//   } catch (error) {
//     console.error("Update Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id).select("_id createdBy").lean(); // Added 'createdBy' here
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Added this check
    if (req.user._id.toString() !== task.createdBy.toString()) {
      return res.status(403).json({ 
        message: "Only the creator of the task can delete it" 
      });
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
// export const deleteTask = async (req, res) => {
//   //added super admin feature which admin has
//   try {
//     if (req.user.accountType !== "admin" && req.user.accountType !== "superAdmin") {
//       return res.status(403).json({ message: "Only admin and super Admin can delete tasks" });
//     }
//     const { id } = req.params;
//     const task = await Task.findById(id).select("_id").lean();
//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }
//     await Promise.all([
//       Task.findByIdAndDelete(id),
//       TaskStatus.deleteMany({ taskId: id }),
//     ]);
//     res.status(200).json({
//       message: "Task and all related statuses deleted successfully",
//       deletedTaskId: id,
//     });
//   } catch (error) {
//     console.error("Delete Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const assignTask = async (req, res) => {
  //added super admin feature which admin has
  try {
    if (req.user.accountType !== "admin" && req.user.accountType !== "superAdmin")
      return res.status(403).json({ message: "Only admin and super Admin can assign task" });

    const { taskId } = req.params;
    const { assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found " });

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

    const getISTime = () => {
      const now = new Date();
      return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    };

    const istTime = getISTime();
    const today = new Date(istTime);
    today.setHours(0, 0, 0, 0);
    const query = Task.find(filter).populate("assignedTo", "username department shiftStartHour shiftEndHour");
    
    if (shift) {
      query.where("shift").equals(shift);
    }
    const tasks = await query.lean();
    const taskIds = tasks.map(t => t._id);
    const statuses = await TaskStatus.find({ 
      taskId: { $in: taskIds },
      employeeId: req.user.id 
    }).lean();

    const taskStatusMap = {};
    for (const s of statuses) {
      const tId = s.taskId.toString();
      taskStatusMap[tId] = s.status;
    }

    const employee = await User.findById(req.user.id).lean();
    const result = tasks.map((task) => {
      const userStatus = taskStatusMap[task._id.toString()] || "";
      
      let canUpdate = true;
      let isMissed = false;
      let missedReason = "";
      let taskDate;
      if (task.date) {
        taskDate = new Date(task.date);
      } else if (task.createdAt) {
        taskDate = new Date(task.createdAt);
      } else {
        taskDate = new Date(today);
      }
      taskDate.setHours(0, 0, 0, 0);

      const empShiftStart = new Date(taskDate);
      empShiftStart.setHours(employee.shiftStartHour, 0, 0, 0);
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

      const taskShift = task.shift;
      const allowedWindow = allowedWindows[taskShift];

      if (allowedWindow) {
        const isWithinWindow = istTime >= allowedWindow.start && istTime <= allowedWindow.end;
        if (userStatus === "") {
          if (isWithinWindow) {
            canUpdate = true;
            isMissed = false;
          } else {
            canUpdate = false;
            isMissed = true;
            
            if (istTime < allowedWindow.start) {
              missedReason = `${taskShift} shift window hasn't started yet`;
            } else {
              missedReason = `${taskShift} shift time window has passed`;
            }
          }
        } else {
          canUpdate = false;  
          isMissed = false;  
        }
      } 

      const doneEmployees = [];
      const notDoneEmployees = [];
      
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(emp => {
          if (emp._id.toString() === req.user.id) {
            if (userStatus === "Done") {
              doneEmployees.push({ _id: emp._id, username: emp.username });
            } else {
              notDoneEmployees.push({ _id: emp._id, username: emp.username });
            }
          } else {
            notDoneEmployees.push({ _id: emp._id, username: emp.username });
          }
        });
      }

      return { 
        ...task, 
        employeeStatus: userStatus,
        canUpdate: canUpdate,
        isMissed: isMissed,
        missedReason: missedReason,
        doneEmployees: doneEmployees, 
        notDoneEmployees: notDoneEmployees 
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const exportTaskStatusExcel = async (req, res) => {  
  try {
    if (req.user.accountType !== "admin" && req.user.accountType !== "superAdmin" && req.user.accountType !== "HR")
      return res.status(403).json({ message: "Only admin, superAdmin and HR can export tasks" });
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
const getISTNow = () => {
  const now = new Date();
  return new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
};

const getBusinessDate = () => {
  const d = getISTNow();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getPreviousBusinessDate = () => {
  const d = getBusinessDate();
  d.setDate(d.getDate() - 1);
  return d;
};

const isShiftPassed = (shift, date) => {
  const d = new Date(date);

  if (shift === "Start") d.setHours(10, 0, 0, 0);
  else if (shift === "Mid") d.setHours(18, 0, 0, 0);
  else if (shift === "End") d.setHours(23, 0, 0, 0);

  return getISTNow() >= d;
};

export const Defaulter = async (req, res) => {
  try {
    const { department, shift, employeeId, startDate, endDate } = req.query;

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      } else if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      return null;
    };

    let fromDate, toDate;
    
    const previousBusinessDate = getPreviousBusinessDate();
    previousBusinessDate.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      fromDate = parseDate(startDate);
      toDate = parseDate(endDate);
      
      if (!fromDate || !toDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      const today = getBusinessDate();
      today.setHours(0, 0, 0, 0);
      
      if (fromDate >= today) {
        fromDate = new Date(previousBusinessDate);
        fromDate.setDate(fromDate.getDate() - 1);  
      }
      if (toDate >= today) {
        toDate = new Date(previousBusinessDate);
      }
      
      if (fromDate > toDate) {
        [fromDate, toDate] = [toDate, fromDate];
      }
      
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    } else {
      fromDate = new Date(previousBusinessDate);
      toDate = new Date(previousBusinessDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    }
    const taskFilter = {};
    if (department && department !== 'All Departments') taskFilter.department = department;
    if (shift && shift !== 'All Shifts') taskFilter.shift = shift;
    if (employeeId && employeeId !== 'All Employees') taskFilter.assignedTo = employeeId;

    const tasks = await Task.find(taskFilter)
      .populate("assignedTo", "username accountType")
      .lean();

    if (!tasks.length) {
      return res.json({
        success: true,
        totalDefaulters: 0,
        overallTotalDefaults: 0,
        data: []
      });
    } 
    const validTasks = tasks.filter(task =>
      task.assignedTo.some(u => u.accountType !== "superAdmin")
    );

    const taskIds = validTasks.map(t => t._id); 
    const statuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: { 
        $gte: fromDate,
        $lte: toDate 
      }
    }).lean(); 
    const statusMap = new Map();
    for (const s of statuses) {
      const dateKey = new Date(s.date);
      dateKey.setHours(0, 0, 0, 0);

      const key = `${s.taskId}_${s.employeeId}_${dateKey.toISOString()}`;

      if (
        !statusMap.has(key) ||
        new Date(s.updatedAt) > new Date(statusMap.get(key).updatedAt)
      ) {
        statusMap.set(key, s);
      }
    } 
    const dailyDefaultsMap = new Map();  
    const employeeInfoMap = new Map();  
    const dateSet = new Set(); 
    for (const task of validTasks) {
      const taskCreated = new Date(task.createdAt);
      taskCreated.setHours(0, 0, 0, 0);

      for (const emp of task.assignedTo) {
        if (emp.accountType === "superAdmin") continue;
        if (employeeId && emp._id.toString() !== employeeId) continue;

        const empId = emp._id.toString(); 
        if (!employeeInfoMap.has(empId)) {
          employeeInfoMap.set(empId, {
            employeeName: emp.username,
            totalDefaults: 0
          });
        } 
        for (
          let d = new Date(fromDate);
          d <= toDate;
          d.setDate(d.getDate() + 1)
        ) {
          const currentDate = new Date(d);
          currentDate.setHours(0, 0, 0, 0);
          const dateISO = currentDate.toISOString();
          dateSet.add(dateISO); 
          if (currentDate < taskCreated) {
            continue;
          } 
          if (!isShiftPassed(task.shift, currentDate)) {
            continue;
          }

          const statusKey = `${task._id}_${emp._id}_${dateISO}`;
          const status = statusMap.get(statusKey)?.status; 
          if (!status || status === "Not Done") {
            const dailyKey = `${empId}_${dateISO}`;
            if (!dailyDefaultsMap.has(dailyKey)) {
              dailyDefaultsMap.set(dailyKey, {
                date: new Date(currentDate),
                employeeId: empId,
                employeeName: emp.username,
                notDoneTasksToday: 0,
                totalDefaultsTillDate: 0
              });
            }
            const dailyData = dailyDefaultsMap.get(dailyKey);
            dailyData.notDoneTasksToday++; 
            const empInfo = employeeInfoMap.get(empId);
            empInfo.totalDefaults++;
          }
        }
      }
    } 
    const dateArray = Array.from(dateSet).sort();
    for (const task of validTasks) {
      const taskCreated = new Date(task.createdAt);
      taskCreated.setHours(0, 0, 0, 0);
      for (const emp of task.assignedTo) {
        if (emp.accountType === "superAdmin") continue;
        const empId = emp._id.toString();
        let cumulativeCount = 0;
        for (const dateISO of dateArray) {
          const currentDate = new Date(dateISO);
          currentDate.setHours(0, 0, 0, 0);
          if (currentDate < taskCreated) {
            continue;
          }
          if (!isShiftPassed(task.shift, currentDate)) {
            continue;
          }
          const statusKey = `${task._id}_${emp._id}_${dateISO}`;
          const status = statusMap.get(statusKey)?.status;
          if (!status || status === "Not Done") {
            cumulativeCount++;
          }
          const dailyKey = `${empId}_${dateISO}`;
          if (dailyDefaultsMap.has(dailyKey)) {
            dailyDefaultsMap.get(dailyKey).totalDefaultsTillDate = cumulativeCount;
          }
        }
      }
    }
    const data = Array.from(dailyDefaultsMap.values())
      .filter(item => item.notDoneTasksToday > 0)  
      .map(item => {
        const empInfo = employeeInfoMap.get(item.employeeId);
        return {
          ...item,
          totalDefaultsTillDate: empInfo ? empInfo.totalDefaults : item.totalDefaultsTillDate
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); 
    const totalDefaultDay = data.reduce((sum, item) => sum + item.notDoneTasksToday, 0);
    const totalDefaultsTillDate = Array.from(employeeInfoMap.values())
      .reduce((sum, emp) => sum + emp.totalDefaults, 0);

    res.json({
      success: true,
      totalDefaulters: employeeInfoMap.size,
      overallTotalDefaults: totalDefaultDay,
      data
    });

  } catch (err) {
    console.error('Defaulter API Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEmployeeDefaulters = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = parseInt(limit);

    const employee = await User.findById(employeeId).lean();
    if (!employee || employee.accountType === "superAdmin") {
      return res.json({
        success: true,
        totalDefaults: 0,
        data: []
      });
    }

    const previousBusinessDate = getPreviousBusinessDate();
    previousBusinessDate.setHours(23, 59, 59, 999);

    const tasks = await Task.find({ assignedTo: employeeId }).lean();
    if (!tasks.length) {
      return res.json({ success: true, totalDefaults: 0, data: [] });
    }

    const taskIds = tasks.map(t => t._id);

    const statuses = await TaskStatus.find({
      employeeId,
      taskId: { $in: taskIds },
      date: { $lte: previousBusinessDate }
    }).lean();

    const statusMap = new Map();
    statuses.forEach(s => {
      const dateKey = new Date(s.date);
      dateKey.setHours(0, 0, 0, 0);
      const key = `${s.taskId}_${dateKey.toISOString()}`;
      
      if (!statusMap.has(key) || 
          new Date(s.updatedAt) > new Date(statusMap.get(key).updatedAt)) {
        statusMap.set(key, s.status);
      }
    });

    let totalDefaults = 0;
    const data = [];

    for (const task of tasks) {
      let taskDefaults = 0;

      const createdAt = new Date(task.createdAt);
      createdAt.setHours(0, 0, 0, 0);

      for (
        let d = new Date(createdAt);
        d <= previousBusinessDate;
        d.setDate(d.getDate() + 1)
      ) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);
        
        if (!isShiftPassed(task.shift, currentDate)) {
          continue;
        }

        const key = `${task._id}_${currentDate.toISOString()}`;
        const status = statusMap.get(key);
        if (!status || status === "Not Done") {
          taskDefaults++;
        }
      }

      if (taskDefaults > 0) {
        totalDefaults += taskDefaults;
        data.push({
          title: task.title,
          shift: task.shift,
          department: task.department,
          priority: task.priority,
          totalDefaultsTillDate: taskDefaults
        });
      }
    }

    const totalPages = Math.ceil(data.length / pageSize);
    const paginatedData = data.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      success: true,
      employeeName: employee.username,
      totalDefaults,
      data: paginatedData,
      totalPages,
      currentPage: pageNum
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// export const getEmployeeDefaulters = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { page = 1, limit = 30 } = req.query;
//     const pageNum = Math.max(1, parseInt(page));
//     const pageSize = parseInt(limit);

//     const employee = await User.findById(employeeId).lean();
//     if (!employee || employee.accountType === "superAdmin") {
//       return res.json({
//         success: true,
//         totalDefaults: 0,
//         data: []
//       });
//     }

//     const cutoffDate = getPreviousBusinessDate();

//     const tasks = await Task.find({ assignedTo: employeeId }).lean();
//     if (!tasks.length) {
//       return res.json({ success: true, totalDefaults: 0, data: [] });
//     }

//     const taskIds = tasks.map(t => t._id);

//     const statuses = await TaskStatus.find({
//       employeeId,
//       taskId: { $in: taskIds },
//       date: { $lte: cutoffDate }
//     }).lean();

//     const statusMap = new Map();
//     statuses.forEach(s => {
//       const key = `${s.taskId}_${new Date(s.date).toISOString()}`;
//       statusMap.set(key, s.status);
//     });

//     let totalDefaults = 0;
//     const data = [];

//     for (const task of tasks) {
//       let taskDefaults = 0;

//       const createdAt = new Date(task.createdAt);
//       createdAt.setHours(0, 0, 0, 0);

//       for (
//         let d = new Date(createdAt);
//         d <= cutoffDate;
//         d.setDate(d.getDate() + 1)
//       ) {
//         if (!isShiftPassed(task.shift, d)) continue;

//         const key = `${task._id}_${d.toISOString()}`;
//         const status = statusMap.get(key);

//         if (status !== "Done") {
//           taskDefaults++;
//         }
//       }

//       if (taskDefaults > 0) {
//         totalDefaults += taskDefaults;
//         data.push({
//           title: task.title,
//           shift: task.shift,
//           department: task.department,
//           priority: task.priority,
//           totalDefaultsTillDate: taskDefaults
//         });
//       }
//     }

//     const totalPages = Math.ceil(data.length / pageSize);
//     const paginatedData = data.slice((pageNum - 1) * pageSize, pageNum * pageSize);

//     res.json({
//       success: true,
//       employeeName: employee.username,
//       totalDefaults,
//       data: paginatedData,
//       totalPages,
//       currentPage: pageNum
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
export const createCoreTeamTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin" &&  req.user.accountType !== "superAdmin") 
      return res.status(403).json({ message: "Only admin and Super Admin can create core team task" });

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
export const getAdminTasks = async (req, res) => {
  try {
    const { department, employeeId } = req.query; 
    const { accountType, id: userId } = req.user;

    if (!["admin", "superAdmin", "HR", "Operations"].includes(accountType)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = {
      assignedTo: userId,  
    };
    if (department) filter.department = department;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username accountType department")
      .lean();

    // const effectiveDate = getShiftDate();  
    const effectiveDate = getEffectiveTaskDate();  
    const taskIds = tasks.map(t => t._id);

    const allStatuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: effectiveDate,  
    }).populate("employeeId", "username").lean();

    const enrichedTasks = tasks.map(task => {
      const doneEmployees = [];
      const notDoneEmployees = [];

      task.assignedTo.forEach(emp => {
        const statusObj = allStatuses.find(
          s => s.taskId.toString() === task._id.toString() &&
               s.employeeId._id.toString() === emp._id.toString()
        );
        if (statusObj?.status === "Done") doneEmployees.push(emp);
        else if (statusObj?.status === "Not Done") notDoneEmployees.push(emp);
      });

      const currentUserStatus = allStatuses.find(
        s => s.taskId.toString() === task._id.toString() &&
             s.employeeId._id.toString() === userId.toString()
      )?.status || "";

      return {
        ...task,
        doneEmployees,
        notDoneEmployees,
        employeeStatus: currentUserStatus,
        date: effectiveDate,  
      };
    });

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("Get Admin Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateAdminTaskStatus = async (req, res) => {
  try {
    const { accountType, id: userId } = req.user;
    if (!["admin", "superAdmin", "HR"].includes(accountType)) {
      return res.status(403).json({ message: "Only admin/superAdmin can update" });
    }

    const { taskId } = req.params;
    const { status } = req.body;
    
    if (!["Done", "Not Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const [task, adminUser] = await Promise.all([
      Task.findById(taskId).populate("assignedTo", "_id username shiftStartHour shiftEndHour"),
      User.findById(userId).lean(),
    ]);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const isAssigned = task.assignedTo.some(
      (e) => e._id.toString() === userId.toString()
    );
    
    if (!isAssigned) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }
    const istTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const getEffectiveDate = () => {
      const date = new Date(istTime);
      if (date.getHours() < 10) {
        date.setDate(date.getDate() - 1);
      }
      date.setHours(0, 0, 0, 0);
      return date;
    };
    const effectiveDate = getEffectiveDate();
    const assignedEmployee = task.assignedTo.find(
      (e) => e._id.toString() === userId.toString()
    );

    let taskDate = task.date ? new Date(task.date) : new Date(effectiveDate);
    taskDate.setHours(0, 0, 0, 0);

    if (assignedEmployee && assignedEmployee.shiftStartHour === 1 && assignedEmployee.shiftEndHour === 10) {
      const currentDate = new Date(istTime);
      currentDate.setHours(0, 0, 0, 0);
      const taskDateOnly = new Date(taskDate);
      taskDateOnly.setHours(0, 0, 0, 0);
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      if (taskDateOnly.getTime() === yesterday.getTime()) {
        const today = new Date(currentDate);
        taskDate = new Date(today);
      }
    }

    const taskStatus = await TaskStatus.findOneAndUpdate(
      { 
        taskId, 
        employeeId: userId, 
        date: effectiveDate 
      },
      { 
        status,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true, 
        setDefaultsOnInsert: true 
      }
    ).populate("employeeId", "username");

    res.status(200).json({
      message: "Status updated successfully (admin override)",
      updatedStatus: {
        taskId: taskStatus.taskId,
        employeeId: taskStatus.employeeId._id,
        username: taskStatus.employeeId.username,
        status: taskStatus.status,
        date: taskStatus.date,
      },
      debug: {
        effectiveDate: effectiveDate.toISOString(),
        storedDate: taskStatus.date.toISOString(),
        note: "Admin override - no shift time restrictions applied"
      }
    });

  } catch (error) {
    console.error("Update Admin Task Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAdminAssignedTasks = async (req, res) => {
  try {
    const { department, employeeId } = req.query;  
    const { accountType, id: userId } = req.user;

    if (!["admin", "superAdmin", "HR", "Operations"].includes(accountType)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = {
      assignedTo: userId,  
    };
    if (department) filter.department = department;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username accountType department")
      .lean();

    // const effectiveDate = getShiftDate();
    const effectiveDate = getEffectiveTaskDate();
    const taskIds = tasks.map(t => t._id);
    const allStatuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: effectiveDate,
    }).populate("employeeId", "username").lean();

    const enrichedTasks = tasks.map(task => {
      const doneEmployees = [];
      const notDoneEmployees = [];

      task.assignedTo.forEach(emp => {
        const statusObj = allStatuses.find(
          s => s.taskId.toString() === task._id.toString() &&
               s.employeeId._id.toString() === emp._id.toString()
        );
        if (statusObj?.status === "Done") doneEmployees.push(emp);
        else if (statusObj?.status === "Not Done") notDoneEmployees.push(emp);
      });

      const currentUserStatus = allStatuses.find(
        s => s.taskId.toString() === task._id.toString() &&
             s.employeeId._id.toString() === userId
      )?.status || "";

      return {
        ...task,
        doneEmployees,
        notDoneEmployees,
        employeeStatus: currentUserStatus,
        date: effectiveDate,
      };
    });

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("Get Admin Assigned Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


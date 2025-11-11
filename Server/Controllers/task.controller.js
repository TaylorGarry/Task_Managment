import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import XLSX from "xlsx-js-style";
import fs from "fs";
import Remark from "../Modals/Remark.modal.js";


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
      status: "Not Done",
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

    if (!tasks.length) {
      return res.status(200).json([]);
    }

    const todayShiftDate = getShiftDate();
    const start = startDate ? new Date(startDate) : new Date(todayShiftDate);
    const end = endDate ? new Date(endDate) : new Date(todayShiftDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dateRange = [];
    const temp = new Date(start);
    while (temp <= end) {
      dateRange.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }

    const taskIds = tasks.map((t) => t._id);
    const allStatuses = await TaskStatus.find({
      taskId: { $in: taskIds },
      date: { $gte: start, $lte: end },
    })
      .populate("employeeId", "username")
      .lean();

    const statusMap = new Map();
    for (const s of allStatuses) {
      const dateKey = new Date(s.date).toDateString();
      const key = `${s.taskId}_${dateKey}`;
      if (!statusMap.has(key)) statusMap.set(key, []);
      statusMap.get(key).push(s);
    }

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
          if (s.status === "Done")
            doneEmployees.push({ _id: s.employeeId._id, username });
          else notDoneEmployees.push({ _id: s.employeeId._id, username });

          if (s.employeeId._id.toString() === req.user.id)
            employeeStatus = s.status;
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
          employeeStatus,
          doneEmployees,
          notDoneEmployees,
          date,
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

    const windowStart = new Date(empShiftStart);
    const windowEnd = new Date(empShiftEnd);

    let startWindowStart = new Date(windowStart);
    let startWindowEnd = new Date(startWindowStart);
    startWindowEnd.setHours(startWindowStart.getHours() + 3);  

    let midWindowStart = new Date(startWindowEnd);
    let midWindowEnd = new Date(midWindowStart);
    midWindowEnd.setHours(midWindowStart.getHours() + 5);  

    let endWindowStart = new Date(midWindowEnd);
    let endWindowEnd = new Date(endWindowStart);
    endWindowEnd.setHours(endWindowStart.getHours() + 1);  

    let allowedStart, allowedEnd;

    if (task.shift === "Start") {
      allowedStart = startWindowStart;
      allowedEnd = startWindowEnd;
    } else if (task.shift === "Mid") {
      allowedStart = midWindowStart;
      allowedEnd = midWindowEnd;
    } else if (task.shift === "End") {
      allowedStart = endWindowStart;
      allowedEnd = endWindowEnd;
    }

    if (istTime < allowedStart || istTime > allowedEnd) {
      return res.status(403).json({
        message: `You can only update ${task.shift} shift tasks between ${allowedStart.toLocaleTimeString(
          "en-IN",
          { hour: "2-digit", minute: "2-digit", hour12: true }
        )} and ${allowedEnd.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} IST.`,
      });
    }

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

    const istNow = getISTime();
    const effectiveDate = new Date(istNow);
    const hour = istNow.getHours();
    if (hour < 10) effectiveDate.setDate(effectiveDate.getDate() - 1);
    effectiveDate.setHours(0, 0, 0, 0);

    for (const s of statuses) {
      if (new Date(s.Date) > effectiveDate)
        s.Date = effectiveDate.toISOString().split("T")[0];

      s.Time = s.RawTime
        ? new Date(s.RawTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
        : "--";
      delete s.RawTime;
    }

    const monthGroups = {};
    for (const s of statuses) {
      const d = new Date(s.Date);
      if (d >= start && d <= end) {
        const key = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
        (monthGroups[key] ??= []).push(s);
      }
    }

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

    const getISTime = () => {
      const now = new Date();
      const istOffset = 5.5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + istOffset * 60000);
    };

    const getShiftDate = () => {
      const ist = getISTime();
      if (ist.getHours() < 10) ist.setDate(ist.getDate() - 1);
      ist.setHours(0, 0, 0, 0);
      return ist;
    };

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username department shiftStartHour shiftEndHour")
      .populate("createdBy", "username");

    const start = startDate ? new Date(startDate) : getShiftDate();
    const end = endDate ? new Date(endDate) : getShiftDate();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const defaulterMap = new Map();
    const employeeDefaultSets = new Map();

    const computeShiftWindow = (emp, date, taskShift) => {
      const startHour = typeof emp.shiftStartHour === "number" ? emp.shiftStartHour : 18;
      const empShiftStart = new Date(date);
      empShiftStart.setHours(startHour, 0, 0, 0);

      const firstShiftEnd = new Date(empShiftStart);
      firstShiftEnd.setHours(firstShiftEnd.getHours() + 3);

      const midShiftEnd = new Date(firstShiftEnd);
      midShiftEnd.setHours(midShiftEnd.getHours() + 5);

      const lastShiftEnd = new Date(midShiftEnd);
      lastShiftEnd.setHours(lastShiftEnd.getHours() + 1);

      if (midShiftEnd.getHours() < startHour) midShiftEnd.setDate(midShiftEnd.getDate() + 1);
      if (lastShiftEnd.getHours() < startHour) lastShiftEnd.setDate(lastShiftEnd.getDate() + 1);

      if (taskShift === "Start") return { windowStart: empShiftStart, windowEnd: firstShiftEnd };
      if (taskShift === "Mid") return { windowStart: firstShiftEnd, windowEnd: midShiftEnd };
      return { windowStart: midShiftEnd, windowEnd: lastShiftEnd };
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

          if (nowIst < windowStart || nowIst <= windowEnd) continue;

          if (empStatus !== "Done") {
            const key = `${emp._id}_${dayStart.toDateString()}`;
            const existing = defaulterMap.get(key) || {
              date: new Date(dayStart),
              employeeId: emp._id,
              employeeName: emp.username,
              notDoneTasksToday: 0,
            };
            existing.notDoneTasksToday += 1;
            defaulterMap.set(key, existing);

            const taskDateKey = `${task._id}_${dayStart.toISOString().split("T")[0]}`;
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
      return { ...entry, totalDefaultsTillDate: totalSet.size };
    });

    const overallTotalDefaults = Array.from(employeeDefaultSets.values()).reduce(
      (sum, s) => sum + (s.size || 0),
      0
    );

    res.status(200).json({
      success: true,
      totalDefaulters: data.length,
      overallTotalDefaults,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEmployeeDefaulters = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { exportExcel } = req.query;

    const employee = await User.findById(employeeId).lean();
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

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

    const computeShiftWindow = (emp, date, taskShift) => {
      const startHour = emp.shiftStartHour ?? 0;
      const shiftStart = new Date(date);
      shiftStart.setHours(startHour, 0, 0, 0);

      const firstShiftEnd = new Date(shiftStart);
      firstShiftEnd.setHours(firstShiftEnd.getHours() + 3);

      const midShiftEnd = new Date(firstShiftEnd);
      midShiftEnd.setHours(midShiftEnd.getHours() + 5);

      const lastShiftEnd = new Date(midShiftEnd);
      lastShiftEnd.setHours(lastShiftEnd.getHours() + 1);

      if (taskShift === "Start") return { windowStart: shiftStart, windowEnd: firstShiftEnd };
      if (taskShift === "Mid") return { windowStart: firstShiftEnd, windowEnd: midShiftEnd };
      return { windowStart: midShiftEnd, windowEnd: lastShiftEnd };
    };

    const endDate = getShiftDate();
    const startDate = new Date(endDate);
    startDate.setFullYear(endDate.getFullYear() - 1);

    const tasks = await Task.find({ assignedTo: employeeId })
      .select("title shift department priority createdAt")
      .lean();

    if (!tasks.length)
      return res.json({
        success: true,
        message: "No tasks assigned to this employee",
        totalDefaults: 0,
        data: [],
      });

    const nowIst = getISTime();
    const defaults = [];

    for (const task of tasks) {
      const taskStart = new Date(task.createdAt);
      taskStart.setHours(0, 0, 0, 0);
      const loopStart = startDate > taskStart ? new Date(startDate) : new Date(taskStart);

      for (let d = new Date(loopStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const latestStatus = await TaskStatus.findOne({
          taskId: task._id,
          employeeId,
          date: { $gte: dayStart, $lte: dayEnd },
        })
          .sort({ updatedAt: -1 })
          .lean();

        const status = latestStatus?.status || "Not Done";
        const { windowStart, windowEnd } = computeShiftWindow(employee, dayStart, task.shift);

        if (nowIst > windowEnd && status !== "Done") {
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

    if (!defaults.length)
      return res.json({
        success: true,
        message: "No defaults found for this employee",
        totalDefaults: 0,
        data: [],
      });

    if (exportExcel === "true") {
      const grouped = defaults.reduce((acc, d) => {
        const key = `${d.date.toLocaleString("default", { month: "short" })} ${d.date.getFullYear()}`;
        (acc[key] ||= []).push(d);
        return acc;
      }, {});

      const wb = XLSX.utils.book_new();

      for (const [month, records] of Object.entries(grouped)) {
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
          [`Total Defaults for ${month}`, records.length, "", "", "", ""],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws["!cols"] = [
          { wch: 6 },
          { wch: 15 },
          { wch: 40 },
          { wch: 18 },
          { wch: 10 },
          { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, month);
      }

      const fileName = `Employee_Defaults_${employee.username}_${Date.now()}.xlsx`;
      const filePath = `./${fileName}`;
      XLSX.writeFile(wb, filePath);
      return res.download(filePath, fileName, err => {
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



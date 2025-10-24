import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";
import XLSX from "xlsx-js-style";


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

const getShiftDate = () => {
  const now = new Date();

  // Convert to US time (UTC-4)
  const usOffset = -4 * 60; // UTC-4 in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const usTime = new Date(utc + usOffset * 60000);

  // Updated shift hours
  const shiftStartHour = 12; // ⏰ 12 PM (noon) US time (was 16)
  const shiftEndHour = 10;   // 10 AM next day

  let shiftDate = new Date(usTime);

  // If current US time is before 10 AM, count as previous shift
  if (usTime.getHours() < shiftEndHour) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

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
    const { date, shift, department, employeeId } = req.query;

    const filter = {};
    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
      if (shift) filter.shift = shift;
    } else {
      if (shift) filter.shift = shift;
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter).populate("assignedTo", "username department");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const taskCreatedDate = new Date(task.createdAt);
        taskCreatedDate.setHours(0, 0, 0, 0);

        let start, end;

        if (date) {
          const selectedDate = new Date(date);
          selectedDate.setHours(0, 0, 0, 0);

          if (selectedDate < taskCreatedDate || selectedDate > today) return null;

          start = selectedDate;
          end = new Date(selectedDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = taskCreatedDate > today ? today : taskCreatedDate;
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
        }

        const statuses = await TaskStatus.find({
          taskId: task._id,
          date: { $gte: start, $lte: end },
        }).populate("employeeId", "username");

        const doneEmployees = [];
        const notDoneEmployees = [];
        let employeeStatus = "Not Done";

        for (const s of statuses) {
          const username = s.employeeId?.username || "Unknown";

          if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
          else notDoneEmployees.push({ _id: s.employeeId._id, username });

          if (s.employeeId._id.toString() === req.user.id) {
            employeeStatus = s.status;
          }
        }

        const assignedWithoutStatus = task.assignedTo
          .filter((emp) => !statuses.some((s) => s.employeeId._id.toString() === emp._id.toString()))
          .map((emp) => ({ _id: emp._id, username: emp.username }));

        notDoneEmployees.push(...assignedWithoutStatus);

        return {
          ...task.toObject(),
          employeeStatus,
          doneEmployees,
          notDoneEmployees,
          date: start,
        };
      })
    );
    const filteredTasks = enrichedTasks.filter((t) => t !== null);
    res.status(200).json(filteredTasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateTaskStatus = async (req, res) => {
  try {
    // Only employees can update their own task status
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

    // Ensure the employee is assigned to this task
    if (!task.assignedTo.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    // Get shift-based "today"
    const today = getShiftDate();

    // Find existing TaskStatus for this task & employee for the shift date
    let taskStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: today,
    });

    if (!taskStatus) {
      // Create new status if not exist
      taskStatus = await TaskStatus.create({
        taskId,
        employeeId: req.user.id,
        date: today,
        status,
      });
    } else {
      // Update existing status
      taskStatus.status = status;
      taskStatus.updatedAt = new Date();
      await taskStatus.save();
    }

    // Populate employee info for frontend update
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
export const exportTaskStatusExcel = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can export tasks" });

    const { department, shift, employeeId } = req.query;

    const currentShiftDate = getShiftDate();
    const end = new Date(currentShiftDate);
    const start = new Date(currentShiftDate);
    start.setMonth(start.getMonth() - 12);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Aggregation: latest status per task per employee per date
    const statuses = await TaskStatus.aggregate([
      { $match: { date: { $gte: start, $lte: end }, ...(department && { department }), ...(shift && { shift }), ...(employeeId && { employeeId: mongoose.Types.ObjectId(employeeId) }) } },
      { $sort: { updatedAt: -1 } },
      { $group: { _id: { taskId: "$taskId", employeeId: "$employeeId", date: "$date" }, taskId: { $first: "$taskId" }, employeeId: { $first: "$employeeId" }, status: { $first: "$status" }, date: { $first: "$date" } } },
      { $lookup: { from: "tasks", localField: "taskId", foreignField: "_id", as: "task" } },
      { $unwind: "$task" },
      { $lookup: { from: "users", localField: "employeeId", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      { $project: { _id: 0, Task: "$task.title", Shift: "$task.shift", Department: "$task.department", Employee: "$employee.username", Date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, Status: "$status" } },
    ]);

    const monthGroups = {};
    statuses.forEach((s) => {
      const date = new Date(s.Date);
      const monthName = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(s);
    });

    const workbook = XLSX.utils.book_new();

    Object.entries(monthGroups).forEach(([month, data]) => {
      const styledData = [
        {
          Task: { v: "Task", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
          Shift: { v: "Shift", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
          Department: { v: "Department", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
          Employee: { v: "Employee", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
          Date: { v: "Date", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
          Status: { v: "Status", s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center" } } },
        },
        ...data.map((item) => ({
          Task: { v: item.Task },
          Shift: { v: item.Shift },
          Department: { v: item.Department },
          Employee: { v: item.Employee },
          Date: { v: item.Date },
          Status: {
            v: item.Status,
            s: { font: { color: { rgb: item.Status.toLowerCase() === "done" ? "008000" : "FF0000" }, bold: true } },
          },
        })),
      ];

      const worksheet = XLSX.utils.json_to_sheet(styledData, { skipHeader: true });

      // Auto-width for each column
      const wsCols = ["Task", "Shift", "Department", "Employee", "Date", "Status"].map((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => (row[key] ? row[key].toString().length : 0))
        );
        return { wch: maxLength + 5 };
      });
      worksheet['!cols'] = wsCols;

      XLSX.utils.book_append_sheet(workbook, worksheet, month);
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `Task_Status_Last_12_Months_${Date.now()}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

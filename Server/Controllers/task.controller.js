import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";

// const getISTDate = () => {
//   const now = new Date();
//   const istOffset = 5.5 * 60;  
//   const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//   const istTime = new Date(utc + istOffset * 60000);
//   return new Date(istTime.toISOString().split("T")[0]);
// };

const getShiftDate = () => {
  const now = new Date();

  // Convert to IST
  const istOffset = 5.5 * 60; // IST offset in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + istOffset * 60000);

  // Define your night shift start hour (8 PM in 24h format)
  const shiftStartHour = 20;

  // If current time is before shift start, count it as previous day's shift
  let shiftDate = new Date(istTime);
  if (istTime.getHours() < shiftStartHour) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  // Reset hours/minutes/seconds/milliseconds to 00:00:00
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

    const today = getISTDate();
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

    let filter = {};

    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
      if (shift) filter.shift = shift;
    } else {
      if (shift) filter.shift = shift;
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter).populate("assignedTo", "username department createdAt");

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

        let employeeStatus = "Not Done";
        const doneEmployees = [];
        const notDoneEmployees = [];

        for (const s of statuses) {
          const username = s.employeeId.username || "Unknown";

          if (s.status === "Done") doneEmployees.push({ _id: s.employeeId._id, username });
          else notDoneEmployees.push({ _id: s.employeeId._id, username });

          if (s.employeeId._id.toString() === req.user.id) {
            employeeStatus = s.status;
          }
        }

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

    if (!task.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    const now = new Date();
    const istOffset = 5.5 * 60;  
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + istOffset * 60000);
    const today = new Date(istTime.toISOString().split("T")[0]);
    today.setHours(0, 0, 0, 0);

   
    let taskStatus = await TaskStatus.findOne({
      taskId,
      employeeId: req.user.id,
      date: today,
    });

    if (!taskStatus) {
      taskStatus = new TaskStatus({
        taskId,
        employeeId: req.user.id,
        date: today,
        status,
      });
    } else {
      taskStatus.status = status;
      taskStatus.updatedAt = new Date();
    }

    await taskStatus.save();

    res.status(200).json({
      message: "Status updated successfully for today",
      updatedStatus: taskStatus,
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

    const today = getISTDate();

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

    const today = getISTDate();
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


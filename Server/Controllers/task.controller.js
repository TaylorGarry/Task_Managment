// import Task from "../Modals/Task.modal.js";
// import User from "../Modals/User.modal.js";
// import TaskStatus from "../Modals/TaskStatus.modal.js";

// // ✅ Utility: Get IST date (without time)
// const getISTDate = () => {
//   const now = new Date();
//   const offset = 5.5 * 60; // IST offset
//   const ist = new Date(now.getTime() + offset * 60 * 1000);
//   return new Date(ist.toISOString().split("T")[0]);
// };

// // ✅ Utility: Check shift window
// const isWithinShift = (shift) => {
//   const now = new Date();
//   const offset = 5.5 * 60;
//   const istNow = new Date(now.getTime() + offset * 60 * 1000);
//   const hours = istNow.getHours();

//   switch (shift) {
//     case "Start":
//       return hours >= 5 && hours < 9;
//     case "Mid":
//       return hours >= 9 && hours < 13;
//     case "End":
//       return hours >= 13 && hours < 17;
//     default:
//       return false;
//   }
// };

// // ✅ Create Task (Admin Only)
// export const createTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can create tasks" });

//     const { title, description, shift, department, assignedTo, deadline, priority } = req.body;

//     if (!title || !shift || !department) {
//       return res.status(400).json({ message: "Title, shift, and department are required" });
//     }

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

//     // ✅ Create TaskStatus records for each employee
//     const today = getISTDate();
//     const statuses = employees.map((emp) => ({
//       taskId: newTask._id,
//       employeeId: emp._id,
//       date: today,
//       status: "Not Done",
//     }));

//     await TaskStatus.insertMany(statuses);

//     res.status(201).json({ message: "Task created successfully", task: newTask });
//   } catch (error) {
//     console.error("Create Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ✅ Get Tasks
// export const getTasks = async (req, res) => {
//   try {
//     let tasks;
//     if (req.user.accountType === "admin") {
//       tasks = await Task.find().populate("assignedTo", "username department");
//     } else {
//       tasks = await Task.find({ assignedTo: req.user.id }).populate("assignedTo", "username department");
//     }

//     res.status(200).json(tasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ✅ Update Task Status (Employee)
// export const updateTaskStatus = async (req, res) => {
//   try {
//     if (req.user.accountType !== "employee")
//       return res.status(403).json({ message: "Only employees can update status" });

//     const { taskId } = req.params;
//     const { status } = req.body;

//     if (!["Done", "Not Done"].includes(status))
//       return res.status(400).json({ message: "Invalid status value" });

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     if (!task.assignedTo.includes(req.user.id))
//       return res.status(403).json({ message: "You are not assigned to this task" });

//     // Check shift window or unlocked
//     if (!task.statusUnlocked && !isWithinShift(task.shift))
//       return res.status(403).json({ message: "Cannot update status outside your shift" });

//     const today = getISTDate();

//     const updatedStatus = await TaskStatus.findOneAndUpdate(
//       { taskId, employeeId: req.user.id, date: today },
//       { status, updatedAt: new Date() },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({ message: "Status updated successfully", updatedStatus });
//   } catch (error) {
//     console.error("Update Task Status Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ✅ Update Task (Admin)
// export const updateTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can update tasks" });

//     const { id } = req.params;
//     const task = await Task.findById(id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     const { title, description, shift, department, assignedTo, deadline, priority, statusUnlocked } = req.body;

//     if (title) task.title = title;
//     if (description) task.description = description;
//     if (shift) task.shift = shift;
//     if (department) task.department = department;
//     if (assignedTo?.length) task.assignedTo = assignedTo;
//     if (deadline) task.deadline = deadline;
//     if (priority) task.priority = priority;
//     if (typeof statusUnlocked === "boolean") task.statusUnlocked = statusUnlocked;

//     await task.save();
//     res.status(200).json({ message: "Task updated successfully", task });
//   } catch (error) {
//     console.error("Update Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ✅ Delete Task (Admin)
// export const deleteTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can delete tasks" });

//     const { id } = req.params;
//     const deletedTask = await Task.findByIdAndDelete(id);
//     if (!deletedTask) return res.status(404).json({ message: "Task not found" });

//     // Delete all related TaskStatus records
//     await TaskStatus.deleteMany({ taskId: id });

//     res.status(200).json({ message: "Task and related statuses deleted successfully" });
//   } catch (error) {
//     console.error("Delete Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ✅ Assign Task (Admin)
// export const assignTask = async (req, res) => {
//   try {
//     if (req.user.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can assign tasks" });

//     const { taskId } = req.params;
//     const { assignedTo } = req.body;

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     const employees = await User.find({ _id: { $in: assignedTo }, department: task.department, accountType: "employee" });
//     if (employees.length === 0)
//       return res.status(404).json({ message: "No valid employees in department" });

//     task.assignedTo = employees.map((e) => e._id);
//     await task.save();

//     // ✅ Update TaskStatus for newly assigned employees
//     const today = getISTDate();
//     const newStatuses = employees.map((emp) => ({
//       taskId,
//       employeeId: emp._id,
//       date: today,
//       status: "Not Done",
//     }));
//     await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => {}); // ignore duplicates

//     res.status(200).json({ message: "Task assigned successfully", task });
//   } catch (error) {
//     console.error("Assign Task Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


import mongoose from "mongoose";
import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";
import TaskStatus from "../Modals/TaskStatus.modal.js";

// ✅ Utility: Get IST date (no time)
const getISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST offset in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + istOffset * 60000);
  return new Date(istTime.toISOString().split("T")[0]);
};

// ✅ Utility: Check shift window
// const isWithinShift = (shift) => {
//   const now = new Date();
//   const offset = 5.5 * 60;
//   const istNow = new Date(now.getTime() + offset * 60 * 1000);
//   const hours = istNow.getHours();

//   switch (shift) {
//     case "Start":
//       return hours >= 5 && hours < 9;
//     case "Mid":
//       return hours >= 9 && hours < 13;
//     case "End":
//       return hours >= 13 && hours < 17;
//     default:
//       return false;
//   }
// };

// =====================
// Create Task (Admin Only)
// =====================
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

// =====================
// Get Tasks (Enhanced for Admin Filters + Calendar View)
// =====================
// =====================
// Get Tasks (Admin Filter + Employee View)
// =====================
// export const getTasks = async (req, res) => {
//   try {
//     const { date, shift, department, employeeId } = req.query;

//     let filter = {};

//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//     } else {
//       if (shift) filter.shift = shift;
//       if (department) filter.department = department;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     if (date) {
//       const start = new Date(date + "T00:00:00.000Z");
//       const end = new Date(date + "T23:59:59.999Z");
//       filter.createdAt = { $gte: start, $lte: end };
//     }

//     const tasks = await Task.find(filter).populate("assignedTo", "username department");

//     const enrichedTasks = await Promise.all(
//       tasks.map(async (task) => {
//         const taskDate = date
//           ? new Date(date).setHours(0, 0, 0, 0)
//           : new Date(task.createdAt).setHours(0, 0, 0, 0);

//         const statuses = await TaskStatus.find({ taskId: task._id, date: taskDate });

//         let employeeStatus = "Not Done"; // default
//         const doneEmployees = [];
//         const notDoneEmployees = [];

//         for (const s of statuses) {
//           if (s.status === "Done") doneEmployees.push(s.employeeId.toString());
//           else notDoneEmployees.push(s.employeeId.toString());

//           if (s.employeeId.toString() === req.user.id) {
//             employeeStatus = s.status; // <--- important
//           }
//         }

//         return {
//           ...task.toObject(),
//           employeeStatus,  // <-- send to frontend
//           doneEmployees,
//           notDoneEmployees,
//           date: new Date(taskDate),
//         };
//       })
//     );

//     res.status(200).json(enrichedTasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const getTasks = async (req, res) => {
  try {
    const { date, shift, department, employeeId } = req.query;

    let filter = {};

    if (req.user.accountType === "employee") {
      filter.assignedTo = req.user.id;
    } else {
      if (shift) filter.shift = shift;
      if (department) filter.department = department;
      if (employeeId) filter.assignedTo = employeeId;
    }

    const tasks = await Task.find(filter).populate("assignedTo", "username department");

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        let start, end;

        if (date) {
          start = new Date(date);
          start.setHours(0, 0, 0, 0);
          end = new Date(date);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(task.createdAt);
          start.setHours(0, 0, 0, 0);
          end = new Date(task.createdAt);
          end.setHours(23, 59, 59, 999);
        }

        const statuses = await TaskStatus.find({
          taskId: task._id,
          date: { $gte: start, $lte: end },
        });

        let employeeStatus = "Not Done";
        const doneEmployees = [];
        const notDoneEmployees = [];

        for (const s of statuses) {
          if (s.status === "Done") doneEmployees.push(s.employeeId.toString());
          else notDoneEmployees.push(s.employeeId.toString());

          if (s.employeeId.toString() === req.user.id) {
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

    res.status(200).json(enrichedTasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const getTasks = async (req, res) => {
//   try {
//     const { date, shift, department, employeeId } = req.query;
//     let filter = {};

//     if (req.user.accountType === "employee") {
//       filter.assignedTo = req.user.id;
//     } else {
//       if (shift) filter.shift = shift;
//       if (department) filter.department = department;
//       if (employeeId) filter.assignedTo = employeeId;
//     }

//     const tasks = await Task.find(filter).populate("assignedTo", "username department");

//     const enrichedTasks = await Promise.all(
//       tasks.map(async (task) => {
//         const today = getISTDate();
//         const statuses = await TaskStatus.find({ taskId: task._id, employeeId: req.user.id }).sort({ date: -1 });

//         let employeeStatus = "Not Done";
//         const doneEmployees = [];
//         const notDoneEmployees = [];

//         for (const s of statuses) {
//           if (s.status === "Done") doneEmployees.push(s.employeeId.toString());
//           else notDoneEmployees.push(s.employeeId.toString());

//           if (s.employeeId.toString() === req.user.id) {
//             employeeStatus = s.status;
//           }
//         }

//         return {
//           ...task.toObject(),
//           employeeStatus,
//           doneEmployees,
//           notDoneEmployees,
//           date: today,
//         };
//       })
//     );

//     res.status(200).json(enrichedTasks);
//   } catch (error) {
//     console.error("Get Tasks Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


// =====================
// Update Task Status (Employee Only)
// =====================
// export const updateTaskStatus = async (req, res) => {
//   try {
//     if (req.user.accountType !== "employee")
//       return res.status(403).json({ message: "Only employees can update status" });

//     const { taskId } = req.params;
//     const { status } = req.body;

//     if (!["Done", "Not Done"].includes(status))
//       return res.status(400).json({ message: "Invalid status value" });

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     if (!task.assignedTo.includes(req.user.id))
//       return res.status(403).json({ message: "You are not assigned to this task" });

//     if (!task.statusUnlocked && !isWithinShift(task.shift))
//       return res.status(403).json({ message: "Cannot update status outside your shift" });

//     const today = getISTDate();

//     const updatedStatus = await TaskStatus.findOneAndUpdate(
//       { taskId, employeeId: req.user.id, date: today },
//       { status, updatedAt: new Date() },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({ message: "Status updated successfully", updatedStatus });
//   } catch (error) {
//     console.error("Update Task Status Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


export const updateTaskStatus = async (req, res) => {
  try {
    if (req.user.accountType !== "employee")
      return res.status(403).json({ message: "Only employees can update status" });

    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Done", "Not Done"].includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.includes(req.user.id))
      return res.status(403).json({ message: "You are not assigned to this task" });

    // 🧩 Removed shift timing check since isWithinShift is undefined
    // If you want shift restriction, see Option 2 below

    const today = getISTDate();

    const updatedStatus = await TaskStatus.findOneAndUpdate(
      { taskId, employeeId: req.user.id, date: today },
      { status, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Status updated successfully", updatedStatus });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// =====================
// Update Task (Admin Only)
// =====================
export const updateTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can update tasks" });

    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { title, description, shift, department, assignedTo, deadline, priority, statusUnlocked } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (shift) task.shift = shift;
    if (department) task.department = department;

    if (assignedTo?.length) {
      task.assignedTo = assignedTo;
      const today = getISTDate();
      const employees = await User.find({ _id: { $in: assignedTo }, department, accountType: "employee" });
      const newStatuses = employees.map((emp) => ({
        taskId: task._id,
        employeeId: emp._id,
        date: today,
        status: "Not Done",
      }));
      await TaskStatus.insertMany(newStatuses, { ordered: false }).catch(() => { });
    }

    if (deadline) task.deadline = deadline;
    if (priority) task.priority = priority;
    if (typeof statusUnlocked === "boolean") task.statusUnlocked = statusUnlocked;

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =====================
// Delete Task (Admin Only)
// =====================
export const deleteTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can delete tasks" });

    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) return res.status(404).json({ message: "Task not found" });

    await TaskStatus.deleteMany({ taskId: id });

    res.status(200).json({ message: "Task and related statuses deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =====================
// Assign Task (Admin Only)
// =====================
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

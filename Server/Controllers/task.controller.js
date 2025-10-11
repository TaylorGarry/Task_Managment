import Task from "../Modals/Task.modal.js"
import User from "../Modals/User.modal.js";

// ✅ Create a new task (Admin only)
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority } = req.body;

    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can create tasks" });
    }

    const employee = await User.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({ message: "Assigned employee not found" });
    }

    const newTask = new Task({
      title,
      description,
      assignedTo,
      createdBy: req.user.id,
      deadline,
      priority,
    });

    await newTask.save();

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all tasks (Admin can see all, employee sees only their own)
export const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.accountType === "admin") {
      tasks = await Task.find().populate("assignedTo", "username accountType");
    } else {
      tasks = await Task.find({ assignedTo: req.user.id });
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update task (Admin can reassign/edit, employee can update status)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Employee: only update status
    if (req.user.accountType === "employee") {
      const { status } = req.body;
      if (status) {
        task.status = status;
      } else {
        return res.status(403).json({ message: "Employees can only update status" });
      }
    }

    // Admin: can edit any field or reassign
    if (req.user.accountType === "admin") {
      const { title, description, assignedTo, status, deadline, priority } = req.body;
      if (title) task.title = title;
      if (description) task.description = description;
      if (assignedTo) task.assignedTo = assignedTo;
      if (status) task.status = status;
      if (deadline) task.deadline = deadline;
      if (priority) task.priority = priority;
    }

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Delete task (Admin only)
export const deleteTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Assign or reassign task (Admin only)
export const assignTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can assign tasks" });
    }

    const { taskId } = req.params;
    const { assignedTo } = req.body;

    const employee = await User.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({ message: "Assigned employee not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.assignedTo = assignedTo;
    await task.save();

    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.error("Assign Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

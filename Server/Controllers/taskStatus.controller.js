import TaskStatus from "../Modals/TaskStatus.modal.js";
import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";

// ✅ Utility to get IST Date
const getISTDate = () => {
  const now = new Date();
  const offset = 5.5 * 60;
  const ist = new Date(now.getTime() + offset * 60 * 1000);
  return new Date(ist.toISOString().split("T")[0]); // only date
};

// ✅ Get Status Report (Admin)
export const getStatusReport = async (req, res) => {
  try {
    if (req.user.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can access this report" });

    const { date, department, shift, employeeId, status } = req.query;

    let filter = {};

    // Filter by date (default: today)
    const reportDate = date ? new Date(date) : getISTDate();
    filter.date = reportDate;

    // Filter by employee
    if (employeeId) filter.employeeId = employeeId;

    // Filter by status
    if (status && ["Done", "Not Done"].includes(status)) filter.status = status;

    // Get all statuses for the day
    let taskStatuses = await TaskStatus.find(filter)
      .populate("taskId", "title department shift")
      .populate("employeeId", "username department");

    // Optional: filter by department or shift
    if (department) {
      taskStatuses = taskStatuses.filter((ts) => ts.taskId.department === department);
    }
    if (shift) {
      taskStatuses = taskStatuses.filter((ts) => ts.taskId.shift === shift);
    }

    res.status(200).json(taskStatuses);
  } catch (error) {
    console.error("Get Status Report Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

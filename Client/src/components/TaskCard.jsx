import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTask, deleteTask } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import { FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const TaskCard = ({ task, onOpenChat }) => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.auth);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    department: task.department,
    assignedTo: task.assignedTo?.map((e) => e._id) || [],
    shift: task.shift,
    priority: task.priority,
  });

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (editData.department) {
      setFilteredEmployees(
        employees.filter((emp) => emp.department === editData.department)
      );
    } else {
      setFilteredEmployees([]);
    }
  }, [editData.department, employees]);

  const uniqueById = (arr) => {
    const seen = new Set();
    return arr.filter((emp) => {
      if (!emp?._id || seen.has(emp._id)) return false;
      seen.add(emp._id);
      return true;
    });
  };

  const doneEmployees = uniqueById(task.doneEmployees || []);
  const notDoneEmployeesRaw = uniqueById(task.notDoneEmployees || []);
  const notDoneEmployees = notDoneEmployeesRaw.filter(
    (emp) => !doneEmployees.some((doneEmp) => doneEmp._id === emp._id)
  );
  const total = doneEmployees.length + notDoneEmployees.length;
  const progress = total ? (doneEmployees.length / total) * 100 : 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-200 text-yellow-800";
      case "Low":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const renderEmployeeBadge = (emp, color, keyPrefix) => {
    if (!emp || !emp.username) return null;
    return (
      <div key={`${keyPrefix}-${emp._id}`} className="flex items-center gap-2">
        <div
          className={`${color} text-white text-xs font-semibold rounded-full w-8 h-8 flex items-center justify-center`}
        >
          {emp.username.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm">{emp.username}</span>
      </div>
    );
  };

  const handleEditChange = (e) => {
    const { name, value, options } = e.target;
    if (name === "assignedTo") {
      const selected = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      setEditData((prev) => ({ ...prev, assignedTo: selected }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await dispatch(updateTask({ id: task._id, updates: editData })).unwrap();
      toast.success("Task updated successfully!");
      setIsEditOpen(false);
    } catch (err) {
      toast.error(err || "Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      toast.success("Task deleted successfully!");
      setIsDeleteConfirm(false);
    } catch (err) {
      toast.error(err || "Failed to delete task");
    } finally {
      setIsLoading(false);
    }
  };

  
  const formatAdminDate = (dateInput) => {
<<<<<<< HEAD
  if (!dateInput) return "";

  try {
    const dateObj = new Date(dateInput);
    console.log("Date Object from admin task card::>>>", dateObj);

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date input:", dateInput);
=======
    if (!dateInput) return "";
    
    try {
      const dateObj = new Date(dateInput);
      
      if (isNaN(dateObj.getTime())) {
        return "";
      }
      
      
      const correctedDate = new Date(dateObj);
      correctedDate.setUTCDate(correctedDate.getUTCDate());
      
      const month = correctedDate.getUTCMonth();
      const day = correctedDate.getUTCDate();
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      return `${monthNames[month]} ${day}`;
    } catch (error) {
>>>>>>> keshav_dev
      return "";
    }

<<<<<<< HEAD
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    console.log(
      `Final date printed after function finished::: ${monthNames[month]} ${day}`
    );

    return `${monthNames[month]} ${day}`;

  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};


=======
>>>>>>> keshav_dev
  const getDisplayDate = () => {
    return task.displayDate || task.date || task.createdAt;
  };

  const departments = [...new Set(employees.map((emp) => emp.department))];

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce" />
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between relative min-h-[360px] transition-shadow hover:shadow-md">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 pr-10">
              {task.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-md text-sm font-semibold ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span>{task.department}</span>
            <span>{task.shift}</span>
            <span>
              {formatAdminDate(getDisplayDate())}
            </span>
          </div>

          <p className="text-gray-800 mb-3 text-sm">{task.description}</p>
          
          <p className="text-sm font-medium text-gray-800 mb-1">
            {doneEmployees.length}/{total} employees done
            {getDisplayDate() && (
              <span className="text-xs text-gray-500 ml-2">
                for {formatAdminDate(getDisplayDate())}
              </span>
            )}
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="mb-3">
            <p className="font-semibold text-gray-800 mb-1">Done</p>
            <div className="flex flex-wrap gap-2">
              {doneEmployees.length > 0
                ? doneEmployees.map((emp) =>
                    renderEmployeeBadge(emp, "bg-green-500", "done")
                  )
                : <span className="text-sm text-gray-500">None</span>}
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-800 mb-1">Not Done</p>
            <div className="flex flex-wrap gap-2">
              {notDoneEmployees.length > 0
                ? notDoneEmployees.map((emp) =>
                    renderEmployeeBadge(emp, "bg-red-500", "not")
                  )
                : <span className="text-sm text-gray-500">None</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 items-center">
          <button
            onClick={() => onOpenChat(task)}
            className="flex items-center justify-center bg-sky-100 hover:bg-sky-200 p-2 rounded-lg transition"
            title="Open Chat"
          >
            <MessageCircle className="w-5 h-5 text-yellow-600 cursor-pointer" />
          </button>
          
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            onClick={() => setIsDeleteConfirm(true)}
            className="flex items-center cursor-pointer gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditOpen(false)}
            >
              <FiX size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Task
            </h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleEditChange}
                className="border p-2 rounded-md focus:outline-sky-500"
                placeholder="Title"
                required
              />
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="3"
                className="border p-2 rounded-md focus:outline-sky-500"
                placeholder="Description"
              />
              <select
                name="department"
                value={editData.department}
                onChange={handleEditChange}
                className="border p-2 rounded-md focus:outline-sky-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <select
                name="assignedTo"
                value={editData.assignedTo}
                onChange={handleEditChange}
                className="border p-2 rounded-md focus:outline-sky-500"
              >
                <option value="">Select Employee</option>
                {(editData.department
                  ? employees.filter(
                      (emp) => emp.department === editData.department
                    )
                  : employees
                ).map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.username}
                  </option>
                ))}
              </select>
              <select
                name="priority"
                value={editData.priority}
                onChange={handleEditChange}
                className="border p-2 rounded-md focus:outline-sky-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-md font-medium transition"
              >
                Update Task
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Delete Task?
            </h2>
            <p className="text-gray-600 mb-5 text-sm">
              Are you sure you want to permanently delete this task?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCard;
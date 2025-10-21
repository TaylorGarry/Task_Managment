import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, updateTaskStatus } from "../features/slices/taskSlice";
import TaskCard from "./TaskCard";
import Navbar from "./Navbar";
import { Toaster, toast } from "react-hot-toast";

// const EmployeeDashboard = () => {
//   const dispatch = useDispatch();
//   const { tasks, loading, error } = useSelector((state) => state.tasks);

//   const user = JSON.parse(localStorage.getItem("user"));
//   const employeeDepartment = user?.department || "";

//   const [filters, setFilters] = useState({
//     date: new Date().toISOString().split("T")[0],
//     shift: "",
//     department: employeeDepartment,
//   });

//   const shiftOptions = ["Start", "Mid", "End"];
//   const departmentOptions = [employeeDepartment];

//   useEffect(() => {
//     dispatch(fetchTasks(filters));
//   }, [dispatch, filters]);

//   const handleFilterChange = (e) => {
//     setFilters({ ...filters, [e.target.name]: e.target.value });
//   };

//   const handleStatusChange = async (taskId, status) => {
//     try {
//       const updatedStatus = await dispatch(updateTaskStatus({ id: taskId, status })).unwrap();
//       dispatch({
//         type: "tasks/updateTaskStatus/fulfilled",
//         payload: updatedStatus,
//       });
//     } catch (err) {
//       console.error("Failed to update status:", err);
//       alert("Failed to update status, please try again.");
//     }
//   };

//   return (
//     <>
//     <Navbar />
//     <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen">
//   <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAEAEA] mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 cursor-pointer">
//     <div className="flex flex-col w-full">
//       <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Date</label>
//       <input
//         type="date"
//         name="date"
//         value={filters.date}
//         onChange={handleFilterChange}
//         className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
//       />
//     </div>
//     <div className="flex flex-col w-full">
//       <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Shift</label>
//       <select
//         name="shift"
//         value={filters.shift}
//         onChange={handleFilterChange}
//         className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
//       >
//         <option value="">All Shifts</option>
//         {shiftOptions.map((s) => (
//           <option key={s} value={s}>
//             {s}
//           </option>
//         ))}
//       </select>
//     </div>
//     <div className="flex flex-col w-full">
//       <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Department</label>
//       <select
//         name="department"
//         value={filters.department}
//         onChange={handleFilterChange}
//         className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
//       >
//         {departmentOptions.map((d) => (
//           <option key={d} value={d}>
//             {d}
//           </option>
//         ))}
//       </select>
//     </div>
//   </div>
//   {loading && (
//   <div className="flex justify-center items-center py-8">
//     <div className="flex space-x-2">
//       <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce"></span>
//       <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce200"></span>
//       <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce400"></span>
//     </div>
//   </div>
// )}
//   {error && <p className="text-red-500">{error}</p>}
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {tasks.length === 0 && !loading ? (
//       <h1 className="text-center text-gray-400 text-xl font-medium p-8 rounded-2xl border border-[#EAEAEA] bg-white shadow-sm cursor-pointer">
//         No tasks found
//       </h1>
//     ) : (
//       tasks.map((task) => (
//         <TaskCard
//           key={task._id}
//           task={task}
//           onStatusChange={handleStatusChange}
//         />
//       ))
//     )}
//   </div>
// </div>


//     </>
//   );
// };

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeDepartment = user?.department || "";

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "",
    department: employeeDepartment,
  });

  const shiftOptions = ["Start", "Mid", "End"];
  const departmentOptions = [employeeDepartment];

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const updatedStatus = await dispatch(updateTaskStatus({ id: taskId, status })).unwrap();

      dispatch({
        type: "tasks/updateTaskStatus/fulfilled",
        payload: updatedStatus,
      });

      toast.success("Task status updated successfully!");
    } catch (err) {
      console.error("Failed to update status:", err);

      toast.error(err || "Failed to update status, please try again.");
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAEAEA] mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 cursor-pointer">
          {/* Date */}
          <div className="flex flex-col w-full">
            <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              max={new Date().toISOString().split("T")[0]}// Disables future dates
              min={new Date().toISOString().split("T")[0]} //Disables past dates
              className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Shift</label>
            <select
              name="shift"
              value={filters.shift}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
            >
              <option value="">All Shifts</option>
              {shiftOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {/* Department */}
          <div className="flex flex-col w-full">
            <label className="text-gray-700 font-semibold mb-2 cursor-pointer">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex space-x-2">
              <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce"></span>
              <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce200"></span>
              <span className="w-3 h-3 bg-[#EAEAEA] rounded-full animate-bounce400"></span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-500">{error}</p>}

        {/* Task Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 && !loading ? (
            <h1 className="text-center text-gray-400 text-xl font-medium p-8 rounded-2xl border border-[#EAEAEA] bg-white shadow-sm cursor-pointer">
              No tasks found
            </h1>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeDashboard;

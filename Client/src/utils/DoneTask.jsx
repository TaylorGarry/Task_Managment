<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTasks } from '../features/slices/taskSlice.js'; 

const DoneTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  const doneTasksCount = tasks?.filter(task => 
    task.status === 'Done' || 
    task.doneEmployees?.length > 0
  )?.length || 0;

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchAllTasks({ date: todayDate }));
      setHasFetched(true);
    }
  }, [dispatch, hasFetched, todayDate]);

  useEffect(() => {
    if (!loading && !error && doneTasksCount > 0) {
      setIsAnimating(true);
      setDisplayCount(0);
      
      const duration = 1500;
      const steps = 50;
      const increment = doneTasksCount / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= doneTasksCount) {
          setDisplayCount(doneTasksCount);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [doneTasksCount, loading, error]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-stretch-50% font-semibold text-blue-500 mb-2">Done Task</p>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading tasks</p>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-gray-600">
                {displayCount}
              </h3>
              {isAnimating && (
                <span className="text-green-500 animate-bounce">↑</span>
=======
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

const DoneTask = () => {
  const dispatch = useDispatch();
  const { allTasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user?.id || user?._id;
  const accountType = user?.accountType;
  const isPrivilegedUser = ["superAdmin", "admin", "HR", "Operations", "AM"].includes(
    accountType
  );

  const taskList = Array.isArray(allTasks) ? allTasks : [];
  const doneTasksCount = taskList.filter(
    (task) =>
      isPrivilegedUser
        ? (task.doneEmployees || []).length > 0 
        : (task.doneEmployees || []).some(
        (emp) => String(emp?._id || emp?.id) === String(currentUserId)
      )
  ).length;

  useEffect(() => {
    dispatch(fetchAllTasks({}));
  }, [dispatch]);

  useEffect(() => {
    if (loading || error) return;

    if (doneTasksCount === 0) {
      setDisplayCount(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setDisplayCount(0);

    const duration = 1500;
    const steps = 50;
    const increment = doneTasksCount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= doneTasksCount) {
        setDisplayCount(doneTasksCount);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [doneTasksCount, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 text-slate-900 shadow-sm">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-600/80">
            Done Tasks
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Completed</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-slate-200"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-600 text-sm">Error loading tasks</p>
          ) : (
            <div className="mt-3 flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-blue-700">{displayCount}</h3>
              {isAnimating && (
                <span className="text-emerald-300 animate-bounce">↑</span>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
              )}
            </div>
          )}
        </div>
<<<<<<< HEAD
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-600">Today</p>
=======
        <div className="h-12 w-12 rounded-2xl border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-700">
          ✓
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <span>All Tasks</span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
          Live
        </span>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default DoneTask;
=======
export default DoneTask;

// import React, { useState, useEffect } from 'react';

// const DoneTask = ({ doneTasks, loading, error }) => {
//   const [displayCount, setDisplayCount] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);

//   useEffect(() => {
//     if (!loading && !error) {
//       setIsAnimating(true);
//       setDisplayCount(0);
      
//       const duration = 1500;
//       const steps = 50;
//       const increment = doneTasks / steps;
//       let current = 0;
      
//       const timer = setInterval(() => {
//         current += increment;
//         if (current >= doneTasks) {
//           setDisplayCount(doneTasks);
//           setIsAnimating(false);
//           clearInterval(timer);
//         } else {
//           setDisplayCount(Math.floor(current));
//         }
//       }, duration / steps);

//       return () => clearInterval(timer);
//     }
//   }, [doneTasks, loading, error]);

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-2xl font-stretch-50% font-semibold text-blue-500 mb-2">Done Task</p>
          
//           {loading ? (
//             <div className="animate-pulse">
//               <div className="h-8 bg-gray-200 rounded w-16"></div>
//             </div>
//           ) : error ? (
//             <p className="text-red-500 text-sm">Error loading tasks</p>
//           ) : (
//             <div className="flex items-center space-x-2">
//               <h3 className="text-2xl font-bold text-gray-600">
//                 {displayCount}
//               </h3>
//               {isAnimating && (
//                 <span className="text-green-500 animate-bounce">↑</span>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//       <div className="mt-1">
//         <p className="text-sm text-gray-600">Today</p>
//       </div>
//     </div>
//   );
// };

// export default DoneTask;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

// import React, { useState, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { fetchAllTasks } from "../features/slices/taskSlice.js";

// const DoneTask = () => {
//   const dispatch = useDispatch();
//   const { tasks, loading, error } = useSelector((state) => state.tasks);
//   const [displayCount, setDisplayCount] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [hasFetched, setHasFetched] = useState(false);

//   const getTodayDate = () => {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, "0");
//     const day = String(today.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   const todayDate = getTodayDate();

//   const doneTasksCount =
//     tasks?.filter((task) => task.status === "Done" || task.doneEmployees?.length > 0)
//       ?.length || 0;

//   useEffect(() => {
//     if (!hasFetched) {
//       dispatch(fetchAllTasks({ date: todayDate }));
//       setHasFetched(true);
//     }
//   }, [dispatch, hasFetched, todayDate]);

//   useEffect(() => {
//     if (!loading && !error && doneTasksCount > 0) {
//       setIsAnimating(true);
//       setDisplayCount(0);

//       const duration = 1500;
//       const steps = 50;
//       const increment = doneTasksCount / steps;
//       let current = 0;

//       const timer = setInterval(() => {
//         current += increment;
//         if (current >= doneTasksCount) {
//           setDisplayCount(doneTasksCount);
//           setIsAnimating(false);
//           clearInterval(timer);
//         } else {
//           setDisplayCount(Math.floor(current));
//         }
//       }, duration / steps);

//       return () => clearInterval(timer);
//     }
//   }, [doneTasksCount, loading, error]);

//   return (
//     <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur">
//       <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl"></div>
//       <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl"></div>

//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
//             Done Tasks
//           </p>
//           <p className="mt-2 text-2xl font-semibold text-white">Completed</p>

//           {loading ? (
//             <div className="mt-4 animate-pulse">
//               <div className="h-9 w-16 rounded-lg bg-white/20"></div>
//             </div>
//           ) : error ? (
//             <p className="mt-3 text-rose-300 text-sm">Error loading tasks</p>
//           ) : (
//             <div className="mt-3 flex items-center space-x-2">
//               <h3 className="text-3xl font-bold text-white">{displayCount}</h3>
//               {isAnimating && (
//                 <span className="text-emerald-300 animate-bounce">↑</span>
//               )}
//             </div>
//           )}
//         </div>
//         <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-cyan-200">
//           ✓
//         </div>
//       </div>
//       <div className="mt-6 flex items-center justify-between text-xs text-slate-300">
//         <span>Today</span>
//         <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px]">
//           Live
//         </span>
//       </div>
//     </div>
//   );
// };

// export default DoneTask;

import React, { useState, useEffect } from 'react';

const DoneTask = ({ doneTasks, loading, error }) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!loading && !error) {
      setIsAnimating(true);
      setDisplayCount(0);
      
      const duration = 1500;
      const steps = 50;
      const increment = doneTasks / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= doneTasks) {
          setDisplayCount(doneTasks);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [doneTasks, loading, error]);

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
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-600">Today</p>
      </div>
    </div>
  );
};

export default DoneTask;
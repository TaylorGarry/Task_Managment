import React, { useEffect, useMemo } from "react";
import TotalTask from "../utils/TotalTask";
import DoneTask from "../utils/DoneTask";
import NotDoneTask from "../utils/NotDoneTask";
import TotalUser from "../utils/TotalUser";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DashboardCard = () => {
  const dispatch = useDispatch();
  const { allTasks, loading, error } = useSelector((state) => state.tasks);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user?.id || user?._id;
  const accountType = user?.accountType;
  const isPrivilegedUser = ["superAdmin", "admin", "HR", "Operations", "AM"].includes(
    accountType
  );

  useEffect(() => {
    dispatch(fetchAllTasks({}));
  }, [dispatch]);

  const { totalTasks, doneTasks, notDoneTasks } = useMemo(() => {
    const taskList = Array.isArray(allTasks) ? allTasks : [];
    const total = taskList.length;
    const done = taskList.filter((task) => {
      if (isPrivilegedUser) {
        return (task.doneEmployees || []).length > 0 ;
      }
      return (task.doneEmployees || []).some(
        (emp) => String(emp?._id || emp?.id) === String(currentUserId)
      );
    }).length;
    const notDone = Math.max(total - done, 0);

    return { totalTasks: total, doneTasks: done, notDoneTasks: notDone };
  }, [allTasks, currentUserId, isPrivilegedUser]);

  const chartData = useMemo(
    () => ({
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [doneTasks, notDoneTasks],
          backgroundColor: ["#2563eb", "#bfdbfe"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }),
    [doneTasks, notDoneTasks]
  );

  const centerTextPlugin = useMemo(
    () => ({
      id: "centerText",
      afterDraw: (chart) => {
        const {
          ctx,
          chartArea: { left, top, right, bottom },
        } = chart;
        const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage =
          total > 0 ? ((chart.data.datasets[0].data[0] / total) * 100).toFixed(0) : 0;

        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        ctx.save();

        ctx.font = "600 32px Outfit";
        ctx.fillStyle = "#1d4ed8";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`${percentage}%`, centerX, centerY);

        ctx.font = "500 13px Outfit";
        ctx.fillStyle = "#64748b";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Completed", centerX, centerY + 25);

        ctx.restore();
      },
    }),
    []
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            color: "#334155",
          },
        },
        title: {
          display: true,
          text: "Task Completion Rate",
          font: {
            size: 16,
          },
          color: "#0f172a",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "62%",
    }),
    []
  );

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 mt-15">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_15%_10%,rgba(37,99,235,0.14),rgba(248,250,252,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_85%_10%,rgba(56,189,248,0.12),rgba(248,250,252,0))]" />

      <div className="relative" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Overview</p>
          <h2
            className="mt-2 text-3xl font-semibold text-slate-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Dashboard Snapshot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <TotalTask />
          <DoneTask />
          <NotDoneTask />
          <TotalUser />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="h-72">
              <Doughnut data={chartData} options={chartOptions} plugins={[centerTextPlugin]} />
            </div>
            <div className="mt-4 text-center text-sm text-slate-600">
              {loading ? (
                <p>Loading tasks...</p>
              ) : error ? (
                <p className="text-rose-600">Failed to load task data</p>
              ) : (
                <p>{doneTasks} completed - {notDoneTasks} remaining</p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Remarks</h3>
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-slate-600">
                In progress...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;

// import React, { useEffect, useState, useRef } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchAllTasks } from '../features/slices/taskSlice.js';

// // ANIMATED COUNTER COMPONENT FOR DASHBOARD
// const AnimatedCounter = ({ value, duration = 1500, startFrom = 0 }) => {
//   const [count, setCount] = useState(startFrom);
//   const animationRef = useRef(null);
//   const hasAnimatedRef = useRef(false);

//   useEffect(() => {
//     // Only animate once when the component first mounts or value changes
//     if (!hasAnimatedRef.current || value !== count) {
//       hasAnimatedRef.current = true;
//       startAnimation();
//     }

//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [value, duration]);

//   const startAnimation = () => {
//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }

//     setCount(startFrom);
//     const startTime = performance.now();
//     const startValue = startFrom;
//     const endValue = value;

//     const animate = (currentTime) => {
//       const elapsed = currentTime - startTime;
//       const progress = Math.min(elapsed / duration, 1);
      
//       // Smooth easing function
//       const easeOutCubic = 1 - Math.pow(1 - progress, 3);
//       const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutCubic);
      
//       setCount(currentCount);
      
//       if (progress < 1) {
//         animationRef.current = requestAnimationFrame(animate);
//       } else {
//         setCount(endValue);
//       }
//     };

//     animationRef.current = requestAnimationFrame(animate);
//   };

//   return <>{count}</>;
// };

// // TIMER COUNTER FOR ADMIN PAGE
// const TimerCounter = ({ value, duration = 2000, shouldAnimate = false }) => {
//   const [count, setCount] = useState(0);
//   const animationRef = useRef(null);
//   const startTimeRef = useRef(null);
//   const isAnimatingRef = useRef(false);

//   useEffect(() => {
//     // Reset to 0 when animation should start
//     if (shouldAnimate && !isAnimatingRef.current) {
//       startAnimation();
//     } else if (!shouldAnimate) {
//       // If not animating, show the actual value
//       setCount(value);
//     }

//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [shouldAnimate, value, duration]);

//   const startAnimation = () => {
//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }

//     isAnimatingRef.current = true;
//     setCount(0);
//     startTimeRef.current = performance.now();

//     const animate = (currentTime) => {
//       if (!startTimeRef.current) startTimeRef.current = currentTime;
      
//       const elapsed = currentTime - startTimeRef.current;
//       const progress = Math.min(elapsed / duration, 1);
      
//       // Smooth easing function
//       const easeOutQuart = 1 - Math.pow(1 - progress, 4);
//       const currentCount = Math.floor(easeOutQuart * value);
      
//       setCount(currentCount);
      
//       if (progress < 1) {
//         animationRef.current = requestAnimationFrame(animate);
//       } else {
//         setCount(value);
//         isAnimatingRef.current = false;
//       }
//     };

//     animationRef.current = requestAnimationFrame(animate);
//   };

//   return <>{count}</>;
// };

// // CounterCard component with animated counter
// const CounterCard = ({ title, value, color, subtitle, icon }) => (
//   <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:-translate-y-1 hover:border-blue-200 transition-all duration-300">
//     <div className="flex justify-between items-start mb-4">
//       <div>
//         <p className="text-sm text-gray-500 mb-1">{title}</p>
//         <h3 className="text-3xl font-bold text-gray-800">
//           <AnimatedCounter value={value} duration={1500} startFrom={0} />
//         </h3>
//         {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
//       </div>
//       {icon}
//     </div>
//     {/* Progress bar for Done and Not Done tasks */}
//     {(title === 'Done Tasks' || title === 'Not Done Tasks') && value > 0 && (
//       <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
//         <div 
//           className={`h-full ${title === 'Done Tasks' ? 'bg-green-500' : 'bg-red-500'} rounded-full transition-all duration-1000`}
//           style={{ 
//             width: `${Math.min(100, value)}%`,
//             animation: 'slideInRight 1s ease-out'
//           }}
//         ></div>
//       </div>
//     )}
//   </div>
// );

// // FIXED: Add CSS animations globally
// const DashboardCard = () => {
//   const dispatch = useDispatch();
//   const { allTasks = [], loading, error } = useSelector((state) => state.tasks);
  
//   // State for active tab and animations
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [animateAdminCounters, setAnimateAdminCounters] = useState(false);
//   const [adminStats] = useState({
//     totalUsers: 42,
//     activeUsers: 28,
//     adminUsers: 5,
//     newUsersToday: 3,
//     totalDepartments: 8,
//     systemUptime: 99.8,
//     avgResponseTime: 2.4,
//     serverLoad: 45,
//     dailyActiveUsers: 156,
//     monthlyTasks: 1245,
//     weeklyGrowth: 12.5
//   });

//   // Get today's date
//   const getTodayDate = () => {
//     const today = new Date();
//     return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
//   };

//   // Fetch data ONCE when component loads
//   useEffect(() => {
//     const todayDate = getTodayDate();
//     console.log("🏁 Dashboard loading - fetching data for:", todayDate);
//     dispatch(fetchAllTasks({ date: todayDate }));
//   }, [dispatch]);

//   // Calculate stats
//   const totalTasks = allTasks.length || 0;

//   const doneTasks = allTasks.filter(task => 
//     task.doneEmployees?.length > 0 || 
//     task.status === 'Done' ||
//     task.completed === true
//   ).length || 0;
//   const notDoneTasks = Math.max(0, totalTasks - doneTasks);
//   const completionRate = totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0;
  
//   // Calculate total users/employees from tasks
//   const totalUsers = React.useMemo(() => {
//     if (!allTasks || allTasks.length === 0) return 0;
    
//     const uniqueUserIds = new Set();
//     allTasks.forEach(task => {
//       console.log(task,"this is task data.::::::::::>>>>");
//       if (task.doneEmployees && Array.isArray(task.doneEmployees)) {
//         task.doneEmployees.forEach(emp => {
//           if (emp._id) uniqueUserIds.add(emp._id);
//         });
//       }
//       if (task.assignedTo && Array.isArray(task.assignedTo)) {
//         task.assignedTo.forEach(emp => {
//           if (emp._id) uniqueUserIds.add(emp._id);
//         });
//       }
//     });
//     return uniqueUserIds.size;
//   }, [allTasks]);

//   // Calculate priority distribution
//   const priorityDistribution = React.useMemo(() => {
//     const distribution = { high: 0, medium: 0, low: 0 };
//     allTasks.forEach(task => {
//       const priority = task.priority?.toLowerCase() || 'medium';
//       if (distribution[priority] !== undefined) {
//         distribution[priority]++;
//       }
//     });
//     return distribution;
//   }, [allTasks]);

//   // Handle admin tab click
//   const handleAdminTabClick = () => {
//     setActiveTab('admin');
//     setAnimateAdminCounters(true);
    
//     // Reset animation after 4 seconds
//     setTimeout(() => {
//       setAnimateAdminCounters(false);
//     },);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
//         <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
//           <div className="text-red-500 mb-4">
//             <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Data</h3>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button 
//             onClick={() => {
//               const todayDate = getTodayDate();
//               dispatch(fetchAllTasks({ date: todayDate }));
//             }}
//             className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
//       {/* Add CSS animations */}
//       <style jsx global>{`
//         @keyframes slideInRight {
//           from {
//             transform: translateX(-100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
        
//         @keyframes fadeInUp {
//           from {
//             transform: translateY(20px);
//             opacity: 0;
//           }
//           to {
//             transform: translateY(0);
//             opacity: 1;
//           }
//         }
        
//         .animate-fade-in-up {
//           animation: fadeInUp 0.6s ease-out;
//         }
        
//         .delay-100 { animation-delay: 100ms; }
//         .delay-200 { animation-delay: 200ms; }
//         .delay-300 { animation-delay: 300ms; }
//       `}</style>

//       Header
//       <div className="mb-8">
//         {/* <h1 className="text-3xl font-bold text-gray-800">Task Dashboard</h1> */}
//         {/* <p className="text-black-600">Overview of today's task performance</p> */}
//         {/* <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//           </svg>
//           <span>{getTodayDate()}</span>
//         </div> */}

//         {/* Tab Navigation */}
//         <div className="flex gap-2  bg-white p-1 rounded-lg shadow-inner w-fit">
//           {/* <button
//             onClick={() => setActiveTab('dashboard')}
//             className={`px-4 py-2 rounded-md transition-all duration-300 ${
//               activeTab === 'dashboard' 
//                 ? 'bg-blue-500 text-white shadow-md' 
//                 : 'text-gray-600 hover:bg-gray-100'
//             }`}
//           >
//             Dashboard/
//           </button> */}
          
//           {/* <button
//             onClick={handleAdminTabClick}
//             className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${
//               activeTab === 'admin' 
//                 ? 'bg-blue-500 text-white shadow-md' 
//                 : 'text-gray-600 hover:bg-gray-100'
//             }`}
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             <span>Admin</span>
//           </button> */}
//         </div>
//       </div>

//       {/* Dashboard Tab Content */}
//       {activeTab === 'dashboard' && (
//         <>
//           {/* Stats Cards with Animation */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//             <div className="animate-fade-in-up delay-100">
//               <CounterCard 
//                 title="Total Tasks" 
//                 value={totalTasks} 
//                 subtitle={<span className="animate-pulse">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
//                 icon={
//                   <div className="bg-blue-100 p-3 rounded-lg">
//                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                     </svg>
//                   </div>
//                 }
//               />
//             </div>
            
//             <div className="animate-fade-in-up delay-200">
//               <CounterCard 
//                 title="Done Tasks" 
//                 value={doneTasks} 
//                 subtitle={`${completionRate}% completion`}
//                 icon={
//                   <div className="bg-green-100 p-3 rounded-lg">
//                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 }
//               />
//             </div>
            
//             <div className="animate-fade-in-up delay-300">
//               <CounterCard 
//                 title="Not Done Tasks" 
//                 value={notDoneTasks} 
//                 subtitle="Require attention"
//                 icon={
//                   <div className="bg-red-100 p-3 rounded-lg">
//                     <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 }
//               />
//             </div>
            
//             <div className="animate-fade-in-up">
//               <CounterCard 
//                 title="Total Users" 
//                 value={totalUsers} 
//                 subtitle="Active today"
//                 icon={
//                   <div className="bg-purple-100 p-3 rounded-lg">
//                     <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//                     </svg>
//                   </div>
//                 }
//               />
//             </div>
//           </div>

//           {/* Chart Section */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Task Completion Chart */}
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-semibold text-gray-800">Task Completion Rate</h3>
//                 <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
//                   Today
//                 </span>
//               </div>
              
//               {totalTasks > 0 ? (
//                 <div className="flex flex-col lg:flex-row items-center gap-8">
//                   <div className="relative">
//                     <div className="w-48 h-48 relative">
//                       {/* Outer ring - total tasks */}
//                       <svg className="w-full h-full transform -rotate-90">
//                         <circle 
//                           cx="96" 
//                           cy="96" 
//                           r="80" 
//                           stroke="#e5e7eb" 
//                           strokeWidth="16" 
//                           fill="none"
//                         />
//                         <circle 
//                           cx="96" 
//                           cy="96" 
//                           r="80" 
//                           stroke="#10b981" 
//                           strokeWidth="16" 
//                           fill="none"
//                           strokeDasharray="502.4"
//                           strokeDashoffset={502.4 - (502.4 * doneTasks / totalTasks)}
//                           strokeLinecap="round"
//                         />
//                       </svg>
//                       <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="text-center">
//                           <div className="text-4xl font-bold text-gray-800">
//                             {completionRate}%
//                           </div>
//                           <div className="text-sm text-gray-500">Completed</div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="flex-1">
//                     <div className="space-y-4">
//                       <div>
//                         <div className="flex justify-between text-sm mb-1">
//                           <span className="text-gray-600">Done Tasks</span>
//                           <span className="font-medium text-green-600">{doneTasks}</span>
//                         </div>
//                         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                           <div 
//                             className="h-full bg-green-500 rounded-full transition-all duration-500"
//                             style={{ width: `${(doneTasks/totalTasks)*100}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <div>
//                         <div className="flex justify-between text-sm mb-1">
//                           <span className="text-gray-600">Not Done Tasks</span>
//                           <span className="font-medium text-red-600">{notDoneTasks}</span>
//                         </div>
//                         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                           <div 
//                             className="h-full bg-red-500 rounded-full transition-all duration-500"
//                             style={{ width: `${(notDoneTasks/totalTasks)*100}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <div className="pt-4 border-t border-gray-100">
//                         <div className="grid grid-cols-2 gap-4 text-center">
//                           <div>
//                             <div className="text-2xl font-bold text-gray-800">{totalTasks}</div>
//                             <div className="text-xs text-gray-500">Total Tasks</div>
//                           </div>
//                           <div>
//                             <div className="text-2xl font-bold text-gray-800">{totalUsers}</div>
//                             <div className="text-xs text-gray-500">Active Users</div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <div className="text-gray-400 mb-3">
//                     <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                   </div>
//                   <h4 className="text-lg font-medium text-gray-600 mb-2">No Tasks Today</h4>
//                   <p className="text-gray-500">No tasks have been assigned for {getTodayDate()}</p>
//                 </div>
//               )}
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-semibold text-gray-800">Performance Summary</h3>
//                 <span className="px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">
//                   Real-time
//                 </span>
//               </div>
              
//               <div className="space-y-6">
//                 <div className="p-4 bg-blue-50 rounded-lg">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-blue-600 mb-1">Task Completion</p>
//                       <p className="text-2xl font-bold text-blue-700">
//                         {completionRate}%
//                       </p>
//                     </div>
//                     <div className="bg-blue-100 p-3 rounded-lg">
//                       <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                       </svg>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="p-4 bg-green-50 rounded-lg">
//                     <p className="text-sm text-green-600 mb-1">Done</p>
//                     <p className="text-xl font-bold text-green-700">{doneTasks}</p>
//                   </div>
//                   <div className="p-4 bg-red-50 rounded-lg">
//                     <p className="text-sm text-red-600 mb-1">Not Done</p>
//                     <p className="text-xl font-bold text-red-700">{notDoneTasks}</p>
//                   </div>
//                 </div>
                
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">Total Users Active</p>
//                       <p className="text-xl font-bold text-gray-800">{totalUsers}</p>
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       {completionRate}% efficiency
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="mt-6 pt-6 border-t border-gray-100">
//                 <p className="text-sm text-gray-600">
//                   {totalTasks === 0 
//                     ? "No tasks have been assigned for today. Check back later or assign new tasks." 
//                     : `Tracking ${totalTasks} tasks with ${doneTasks} completed successfully.`}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Recent Tasks Table */}
//           {/* {allTasks.length > 0 && (
//             <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-semibold text-gray-800">Recent Tasks</h3>
//                 <button 
//                   onClick={() => {
//                     const todayDate = getTodayDate();
//                     dispatch(fetchAllTasks({ date: todayDate }));
//                   }}
//                   className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center"
//                 >
//                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                   Refresh
//                 </button>
//               </div>
              
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b border-gray-200">
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Task Name</th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Completed By</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {allTasks.slice(0, 5).map((task, index) => (
//                       <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
//                         <td className="py-3 px-4">
//                           <div className="font-medium text-gray-800">{task.name || task.taskName || 'Unnamed Task'}</div>
//                           <div className="text-xs text-gray-500">{task.department || 'General'}</div>
//                         </td>
//                         <td className="py-3 px-4 text-gray-600">{task.date}</td>
//                         <td className="py-3 px-4">
//                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                             task.doneEmployees?.length > 0 || task.status === 'Done' 
//                               ? 'bg-green-100 text-green-800' 
//                               : 'bg-red-100 text-red-800'
//                           }`}>
//                             <span className={`w-2 h-2 rounded-full mr-2 ${
//                               task.doneEmployees?.length > 0 || task.status === 'Done' 
//                                 ? 'bg-green-500' 
//                                 : 'bg-red-500'
//                             }`}></span>
//                             {task.doneEmployees?.length > 0 || task.status === 'Done' ? 'Done' : 'Pending'}
//                           </span>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex flex-wrap gap-1">
//                             {task.doneEmployees?.slice(0, 2).map((emp, idx) => (
//                               <span key={idx} className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
//                                 {emp.username || 'User'}
//                               </span>
//                             ))}
//                             {task.doneEmployees?.length > 2 && (
//                               <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
//                                 +{task.doneEmployees.length - 2} more
//                               </span>
//                             )}
//                             {(!task.doneEmployees || task.doneEmployees.length === 0) && (
//                               <span className="text-gray-400 text-sm">-</span>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
                
//                 {allTasks.length > 5 && (
//                   <div className="text-center mt-4">
//                     <p className="text-sm text-gray-500">
//                       Showing 5 of {allTasks.length} tasks • 
//                       <button className="ml-2 text-blue-600 hover:text-blue-800 font-medium">
//                         View all tasks →
//                       </button>
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )} */}
//         </>
//       )}

//       {/* Admin Tab Content */}
//       {activeTab === 'admin' && (
//         <div className="space-y-6 animate-fade-in-up">
//           {/* Admin Header */}
//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                 </svg>
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
//                 <p className="text-gray-600">System administration and performance analytics</p>
//                 {animateAdminCounters && (
//                   <div className="flex items-center gap-2 mt-2">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
//                     <span className="text-sm text-blue-600">Timer animation active...</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Admin Stats with Timer Animation */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//               {/* Total Users Card with Timer Animation */}
//               <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-blue-600 mb-1">Total Users</p>
//                     <div className="text-3xl font-bold text-blue-800 mb-2">
//                       <TimerCounter 
//                         value={adminStats.totalUsers} 
//                         duration={2500} 
//                         shouldAnimate={animateAdminCounters} 
//                       />
//                     </div>
//                     <p className="text-sm text-blue-500">Registered in system</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-blue-500 rounded-full transition-all duration-1000"
//                     style={{ width: `${(adminStats.totalUsers / 50) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>

//               {/* Active Users Card */}
//               <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-green-600 mb-1">Active Users</p>
//                     <div className="text-3xl font-bold text-green-800">
//                       <TimerCounter 
//                         value={adminStats.activeUsers} 
//                         duration={2000} 
//                         shouldAnimate={animateAdminCounters} 
//                       />
//                     </div>
//                     <p className="text-sm text-green-500">Online now</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Admin Users Card */}
//               <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-purple-600 mb-1">Admin Users</p>
//                     <div className="text-3xl font-bold text-purple-800">
//                       <TimerCounter 
//                         value={adminStats.adminUsers} 
//                         duration={1500} 
//                         shouldAnimate={animateAdminCounters} 
//                       />
//                     </div>
//                     <p className="text-sm text-purple-500">With admin rights</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7.968 7.968 0 015 16c0-2.786 1.235-5.287 3.186-6.99M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* System Uptime Card */}
//               <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-lg p-6 border border-teal-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-teal-600 mb-1">System Uptime</p>
//                     <div className="text-3xl font-bold text-teal-800">
//                       <TimerCounter 
//                         value={adminStats.systemUptime} 
//                         duration={3000} 
//                         shouldAnimate={animateAdminCounters} 
//                       />%
//                     </div>
//                     <p className="text-sm text-teal-500">Reliability score</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Avg Response Time Card */}
//               <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-orange-600 mb-1">Avg Response Time</p>
//                     <div className="text-3xl font-bold text-orange-800">
//                       <TimerCounter 
//                         value={adminStats.avgResponseTime} 
//                         duration={1800} 
//                         shouldAnimate={animateAdminCounters} 
//                       />s
//                     </div>
//                     <p className="text-sm text-orange-500">Server response</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Server Load Card */}
//               <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border border-red-200">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-red-600 mb-1">Server Load</p>
//                     <div className="text-3xl font-bold text-red-800">
//                       <TimerCounter 
//                         value={adminStats.serverLoad} 
//                         duration={2200} 
//                         shouldAnimate={animateAdminCounters} 
//                       />%
//                     </div>
//                     <p className="text-sm text-red-500">Current load</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-lg shadow">
//                     <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Task Completion Chart & Performance in Admin */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
//               {/* Task Completion Chart in Admin */}
//               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-lg font-semibold text-gray-800">Task Completion Rate</h3>
//                   <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
//                     Admin View
//                   </span>
//                 </div>
                
//                 {totalTasks > 0 ? (
//                   <div className="flex flex-col items-center">
//                     <div className="w-48 h-48 relative mb-6">
//                       <svg className="w-full h-full transform -rotate-90">
//                         <circle 
//                           cx="96" 
//                           cy="96" 
//                           r="80" 
//                           stroke="#e5e7eb" 
//                           strokeWidth="16" 
//                           fill="none"
//                         />
//                         <circle 
//                           cx="96" 
//                           cy="96" 
//                           r="80" 
//                           stroke="#10b981" 
//                           strokeWidth="16" 
//                           fill="none"
//                           strokeDasharray="502.4"
//                           strokeDashoffset={502.4 - (502.4 * doneTasks / totalTasks)}
//                           strokeLinecap="round"
//                         />
//                       </svg>
//                       <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="text-center">
//                           <div className="text-4xl font-bold text-gray-800">
//                             {completionRate}%
//                           </div>
//                           <div className="text-sm text-gray-500">Completion Rate</div>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="w-full space-y-4">
//                       <div>
//                         <div className="flex justify-between text-sm mb-1">
//                           <span className="text-gray-600">Completed Tasks</span>
//                           <span className="font-medium text-green-600">{doneTasks} / {totalTasks}</span>
//                         </div>
//                         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                           <div 
//                             className="h-full bg-green-500 rounded-full transition-all duration-500"
//                             style={{ width: `${(doneTasks/totalTasks)*100}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
//                         <div className="text-center p-3 bg-blue-50 rounded-lg">
//                           <div className="text-xl font-bold text-blue-600">{totalTasks}</div>
//                           <div className="text-xs text-gray-500">Total Tasks</div>
//                         </div>
//                         <div className="text-center p-3 bg-green-50 rounded-lg">
//                           <div className="text-xl font-bold text-green-600">{doneTasks}</div>
//                           <div className="text-xs text-gray-500">Completed</div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <div className="text-gray-400 mb-3">
//                       <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                       </svg>
//                     </div>
//                     <h4 className="text-lg font-medium text-gray-600 mb-2">No Tasks Today</h4>
//                     <p className="text-gray-500">No tasks recorded for today</p>
//                   </div>
//                 )}
//               </div>

//               {/* Performance Summary in Admin */}
//               <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border border-green-200">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-lg font-semibold text-gray-800">Performance Analytics</h3>
//                   <span className="px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">
//                     System Metrics
//                   </span>
//                 </div>
                
//                 <div className="space-y-6">
//                   <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Daily Active Users</p>
//                         <p className="text-2xl font-bold text-blue-700">
//                           <TimerCounter 
//                             value={adminStats.dailyActiveUsers} 
//                             duration={2000} 
//                             shouldAnimate={animateAdminCounters} 
//                           />
//                         </p>
//                       </div>
//                       <div className="bg-blue-50 p-2 rounded-lg">
//                         <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Monthly Tasks</p>
//                         <p className="text-2xl font-bold text-purple-700">
//                           <TimerCounter 
//                             value={adminStats.monthlyTasks} 
//                             duration={2500} 
//                             shouldAnimate={animateAdminCounters} 
//                           />
//                         </p>
//                       </div>
//                       <div className="bg-purple-50 p-2 rounded-lg">
//                         <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Weekly Growth</p>
//                         <p className="text-2xl font-bold text-green-700">
//                           <TimerCounter 
//                             value={adminStats.weeklyGrowth} 
//                             duration={1800} 
//                             shouldAnimate={animateAdminCounters} 
//                           />%
//                         </p>
//                       </div>
//                       <div className="bg-green-50 p-2 rounded-lg">
//                         <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
                  
//                   {/* Priority Distribution */}
//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-medium text-gray-700 mb-3">Task Priority Distribution</h4>
//                     <div className="space-y-3">
//                       {[
//                         { label: 'High Priority', value: priorityDistribution.high, color: 'red', percentage: totalTasks > 0 ? (priorityDistribution.high / totalTasks * 100).toFixed(1) : 0 },
//                         { label: 'Medium Priority', value: priorityDistribution.medium, color: 'orange', percentage: totalTasks > 0 ? (priorityDistribution.medium / totalTasks * 100).toFixed(1) : 0 },
//                         { label: 'Low Priority', value: priorityDistribution.low, color: 'green', percentage: totalTasks > 0 ? (priorityDistribution.low / totalTasks * 100).toFixed(1) : 0 },
//                       ].map((item, index) => (
//                         <div key={index} className="space-y-1">
//                           <div className="flex justify-between text-sm">
//                             <span className="text-gray-600">{item.label}</span>
//                             <span className="font-medium">{item.value} ({item.percentage}%)</span>
//                           </div>
//                           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                             <div 
//                               className={`h-full bg-${item.color}-500 rounded-full transition-all duration-500`}
//                               style={{ width: `${item.percentage}%` }}
//                             ></div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Admin Controls */}
//             <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
//               <button
//                 onClick={() => setAnimateAdminCounters(true)}
//                 className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium flex items-center gap-2"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Start Timer Animation
//               </button>
//               <button
//                 onClick={() => setAnimateAdminCounters(false)}
//                 className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//               >
//                 Stop Animation
//               </button>
//               <button
//                 onClick={() => {
//                   const todayDate = getTodayDate();
//                   dispatch(fetchAllTasks({ date: todayDate }));
//                 }}
//                 className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//                 Refresh Data
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardCard;

// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useParams, useNavigate } from "react-router-dom";
// import { fetchAllRosters } from "../features/slices/rosterSlice.js";
// import ArrivalAttendanceUpdate from "./ArrivalAttendanceUpdate.jsx";
// import Navbar from "../pages/Navbar.jsx";
// import AdminNavbar from "../components/AdminNavbar.jsx";
// import { Calendar, AlertCircle, Clock } from "lucide-react";

// const AttendanceUpdateWrapper = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { rosterId } = useParams();
//   const { allRosters, loading } = useSelector((state) => state.roster);
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

//   const getCurrentUser = () => {
//     try {
//       return JSON.parse(localStorage.getItem("user"));
//     } catch {
//       return null;
//     }
//   };
//   const currentUser = getCurrentUser();
  
//   // ✅ Determine user type for navbar rendering
//   const isSuperAdmin = currentUser?.accountType === "superAdmin";
//   const isEmployee = currentUser?.accountType === "employee";
  
//   // For Transport and Team Leaders, they should see regular Navbar
//   // Only superAdmin sees AdminNavbar

//   useEffect(() => {
//     console.log("📡 Fetching rosters for:", { month: selectedMonth, year: selectedYear });
//     dispatch(fetchAllRosters({
//       month: selectedMonth,
//       year: selectedYear,
//       page: 1,
//       limit: 50
//     }));
//   }, [dispatch, selectedMonth, selectedYear]);

//   useEffect(() => {
//     console.log("📦 allRosters from Redux:", allRosters);
//   }, [allRosters]);

//   const rosters = allRosters?.data || [];
  
//   console.log("📋 Processed rosters:", rosters);

//   // Function to render the appropriate navbar
//   const renderNavbar = () => {
//     if (isSuperAdmin) {
//       return <AdminNavbar />;
//     } else {
//       // For employees (including Transport, Team Leaders, etc.)
//       return <Navbar />;
//     }
//   };

//   if (rosterId) {
//     return (
//       <div className="min-h-screen bg-gray-100">
//         {/* ✅ Render navbar based on user type */}
//         {renderNavbar()}
        
//         <div className="container mx-auto px-4 py-8">
//           <button
//             onClick={() => navigate("/attendance-update")}
//             className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
//           >
//             ← Back to roster selection
//           </button>
//           <ArrivalAttendanceUpdate rosterId={rosterId} />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* ✅ Render navbar based on user type */}
//       {renderNavbar()}
      
//       <div className="container mx-auto px-2 py-2">
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                 <Clock className="w-6 h-6 text-indigo-600" />
//                 Attendance & Arrival Updates
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Select a roster to update employee attendance and arrival times
//               </p>
//             </div>
            
//             <div className={`px-4 py-2 rounded-lg ${
//               isSuperAdmin ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
//             }`}>
//               <p className="text-sm font-semibold">
//                 {currentUser?.username}
//                 <span className="mx-2">•</span>
//                 {currentUser?.department}
//                 {isSuperAdmin && " 👑 Super Admin"}
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Month
//               </label>
//               <select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               >
//                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
//                   <option key={month} value={month}>
//                     {new Date(2000, month-1, 1).toLocaleString('default', { month: 'long' })}
//                   </option>
//                 ))}
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Year
//               </label>
//               <select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               >
//                 {[2024,2025,2026,2027].map(year => (
//                   <option key={year} value={year}>{year}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Refresh Button */}
//           <div className="mb-4 flex justify-end">
//             <button
//               onClick={() => {
//                 console.log("🔄 Manually refreshing rosters...");
//                 dispatch(fetchAllRosters({
//                   month: selectedMonth,
//                   year: selectedYear,
//                   page: 1,
//                   limit: 50
//                 }));
//               }}
//               className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
//             >
//               Refresh Rosters
//             </button>
//           </div>

//           {/* Rosters List */}
//           {loading ? (
//             <div className="text-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
//               <p className="mt-4 text-gray-600">Loading rosters...</p>
//             </div>
//           ) : rosters.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {rosters.map((roster) => {
//                 // Calculate total employees across all weeks
//                 const totalEmployees = roster.weeks?.reduce((sum, week) => 
//                   sum + (week.employees?.length || 0), 0) || 0;
                
//                 // Get the first week's number for display
//                 const firstWeekNumber = roster.weeks?.[0]?.weekNumber || 1;
                
//                 return (
//                   <div
//                     key={roster._id}
//                     onClick={() => navigate(`/attendance-update/${roster._id}`)}
//                     className="border rounded-lg p-5 hover:shadow-lg cursor-pointer transition-all hover:border-indigo-300 bg-white"
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 text-indigo-600 mb-2">
//                           <Calendar className="w-4 h-4" />
//                           <span className="text-sm font-medium">
//                             Week {firstWeekNumber}
//                           </span>
//                         </div>
//                         <h3 className="font-semibold text-gray-800">
//                           {new Date(roster.rosterStartDate).toLocaleDateString()} - {new Date(roster.rosterEndDate).toLocaleDateString()}
//                         </h3>
//                         <p className="text-sm text-gray-500 mt-1">
//                           {new Date(2000, roster.month-1, 1).toLocaleString('default', { month: 'long' })} {roster.year}
//                         </p>
//                         <div className="mt-3 flex items-center gap-3 text-sm">
//                           <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
//                             {roster.totalWeeks || 0} week{roster.totalWeeks !== 1 ? 's' : ''}
//                           </span>
//                           <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full">
//                             {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}
//                           </span>
//                         </div>
                        
//                         {/* Show team leaders if any */}
//                         {roster.weeks?.[0]?.employees && (
//                           <div className="mt-2 text-xs text-gray-400">
//                             Team: {[...new Set(roster.weeks[0].employees.map(e => e.teamLeader).filter(Boolean))].join(', ')}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <div className="text-center py-16 bg-gray-50 rounded-lg">
//               <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900">No rosters found</h3>
//               <p className="text-gray-500 mt-2 max-w-md mx-auto">
//                 No rosters available for {new Date(2000, selectedMonth-1).toLocaleString('default', { month: 'long' })} {selectedYear}
//               </p>
//               <button
//                 onClick={() => {
//                   setSelectedMonth(new Date().getMonth() + 1);
//                   setSelectedYear(new Date().getFullYear());
//                 }}
//                 className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
//               >
//                 Go to current month
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AttendanceUpdateWrapper;


import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchAllRosters } from "../features/slices/rosterSlice.js";
import ArrivalAttendanceUpdate from "./ArrivalAttendanceUpdate.jsx";
import Navbar from "../pages/Navbar.jsx";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { Calendar, AlertCircle, Clock } from "lucide-react";

const AttendanceUpdateWrapper = ({ delegatedMode = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { rosterId } = useParams();
  const { allRosters, loading, rosterDetailLoading } = useSelector((state) => state.roster);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const didAutoFallbackRef = useRef(false);

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUser();
  const isAdminUser = ["admin", "superAdmin", "HR", "Operations", "AM"].includes(currentUser?.accountType);
  const delegatedFromUserId = new URLSearchParams(location.search).get("delegatedFrom") || "";

		  useEffect(() => {
		    dispatch(fetchAllRosters({
	      month: selectedMonth,
	      year: selectedYear,
      page: 1,
      limit: 50
    }));
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    if (didAutoFallbackRef.current) return;
    if (rosterDetailLoading) return;
    if (delegatedMode) return;

    const rows = Array.isArray(allRosters?.data) ? allRosters.data : null;
    if (!rows) return;

    if (rows.length > 0) {
      didAutoFallbackRef.current = true;
      return;
    }

    const current = new Date();
    const isDefaultCurrentMonthSelection =
      Number(selectedMonth) === current.getMonth() + 1 &&
      Number(selectedYear) === current.getFullYear();

    if (!isDefaultCurrentMonthSelection) {
      didAutoFallbackRef.current = true;
      return;
    }

    didAutoFallbackRef.current = true;
    dispatch(
      fetchAllRosters({
        page: 1,
        limit: 50,
      })
    )
      .unwrap()
      .then((resp) => {
        const all = Array.isArray(resp?.data) ? resp.data : [];
        if (!all.length) return;
        const latest = all[0];
        const nextMonth = Number.parseInt(latest?.month, 10);
        const nextYear = Number.parseInt(latest?.year, 10);
        if (Number.isFinite(nextMonth) && nextMonth >= 1 && nextMonth <= 12) {
          setSelectedMonth(nextMonth);
        }
        if (Number.isFinite(nextYear) && nextYear > 0) {
          setSelectedYear(nextYear);
        }
      })
      .catch(() => {});
  }, [allRosters, rosterDetailLoading, selectedMonth, selectedYear, dispatch, delegatedMode]);

	  const rosters = allRosters?.data || [];
	  
	
		  if (rosterId) {
		    // ArrivalAttendanceUpdate already renders the correct navbar + full-page layout.
		    // Rendering another Navbar/AdminNavbar here caused duplicate fixed headers and broke SPA navigation.
		    return (
          <ArrivalAttendanceUpdate
            rosterId={rosterId}
            delegatedFromUserId={delegatedMode ? delegatedFromUserId : ""}
          />
        );
		  }

  if (delegatedMode && !delegatedFromUserId) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No delegated team selected</h2>
            <p className="text-gray-600 mt-2">Please open this from the Delegated Teams page.</p>
            <button
              onClick={() => navigate("/delegated-actions")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go to Delegated Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100">
      {isAdminUser ? <AdminNavbar showOutlet={false} /> : <Navbar />}
      
      <div className="container mx-auto px-2 pt-18 pb-2">
        <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                {delegatedMode ? "Delegated Attendance & Arrival Updates" : "Attendance & Arrival Updates"}
              </h1>
              <p className="text-slate-600 mt-1">
                {delegatedMode
                  ? "Select a roster to update delegated team attendance and arrival times"
                  : "Select a roster to update employee attendance and arrival times"}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-sky-50 px-4 py-2 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-900">
                <span className="font-semibold">{currentUser?.username}</span> 
                <span className="mx-2">•</span>
                {currentUser?.department}
                {currentUser?.accountType === "superAdmin" && " (Admin)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month-1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[2024,2025,2026,2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mb-4 flex justify-end">
	            <button
	              onClick={() => {
	                dispatch(fetchAllRosters({
	                  month: selectedMonth,
	                  year: selectedYear,
                  page: 1,
                  limit: 50
                }));
              }}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
            >
              Refresh Rosters
            </button>
          </div>

          {/* Rosters List */}
          {(loading || rosterDetailLoading) ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rosters...</p>
            </div>
          ) : rosters.length > 0 ? (
	            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rosters.map((roster) => {
                // Calculate total employees across all weeks
                const totalEmployees = roster.weeks?.reduce((sum, week) => 
                  sum + (week.employees?.length || 0), 0) || 0;
                
                // Get the first week's number for display
                const firstWeekNumber = roster.weeks?.[0]?.weekNumber || 1;
                
                return (
	                  <article
                    key={roster._id}
                    onClick={() => {
                      const basePath = delegatedMode ? "/delegated-attendance" : "/attendance-update";
                      const query = delegatedMode && delegatedFromUserId
                        ? `?delegatedFrom=${encodeURIComponent(delegatedFromUserId)}`
                        : "";
                      navigate(`${basePath}/${roster._id}${query}`);
                    }}
	                    className="group relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/20 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300"
	                  >
	                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-500 opacity-75"></div>
	                    <div className="flex items-start justify-between">
	                      <div className="flex-1">
	                        <div className="flex items-center gap-2 text-indigo-700 mb-2">
	                          <Calendar className="w-4 h-4" />
	                          <span className="text-base font-semibold">
	                            Week {firstWeekNumber}
	                          </span>
	                        </div>
		                        <h3 className="font-bold text-slate-800 tracking-tight">
		                          {new Date(roster.rosterStartDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(roster.rosterEndDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
		                        </h3>
	                        <p className="text-sm text-slate-500 mt-1">
	                          {new Date(2000, roster.month-1, 1).toLocaleString('default', { month: 'long' })} {roster.year}
	                        </p>
	                        <div className="mt-3 flex items-center gap-3 text-sm">
	                          <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-medium">
	                            {roster.totalWeeks || 0} week{roster.totalWeeks !== 1 ? 's' : ''}
	                          </span>
	                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-medium">
	                            {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}
	                          </span>
	                        </div>
                        
                        {/* Show team leaders if any */}
                        {roster.weeks?.[0]?.employees && (
	                          <div className="mt-3 text-xs text-slate-500 leading-relaxed">
	                            Team: {[...new Set(roster.weeks[0].employees.map(e => e.teamLeader).filter(Boolean))].join(', ')}
	                          </div>
	                        )}
	                      </div>
	                    </div>
	                  </article>
                );
              })}
            </div>
          ) : (
	            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No rosters found</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                No rosters available for {new Date(2000, selectedMonth-1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </p>
              <button
                onClick={() => {
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                }}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Go to current month
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceUpdateWrapper;

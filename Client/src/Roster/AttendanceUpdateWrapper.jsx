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


import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAllRosters } from "../features/slices/rosterSlice.js";
import ArrivalAttendanceUpdate from "./ArrivalAttendanceUpdate.jsx";
import Navbar from "../pages/Navbar.jsx";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { Calendar, AlertCircle, Clock } from "lucide-react";

const AttendanceUpdateWrapper = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rosterId } = useParams();
  const { allRosters, loading } = useSelector((state) => state.roster);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUser();

	  useEffect(() => {
	    dispatch(fetchAllRosters({
	      month: selectedMonth,
	      year: selectedYear,
      page: 1,
      limit: 50
    }));
  }, [dispatch, selectedMonth, selectedYear]);

	  const rosters = allRosters?.data || [];
	  
	
	  if (rosterId) {
	    // ArrivalAttendanceUpdate already renders the correct navbar + full-page layout.
	    // Rendering another Navbar/AdminNavbar here caused duplicate fixed headers and broke SPA navigation.
	    return <ArrivalAttendanceUpdate rosterId={rosterId} />;
	  }

  return (
    <div className="min-h-screen bg-gray-100">
      {currentUser?.accountType === "superAdmin" ? <AdminNavbar /> : <Navbar />}
      
      <div className="container mx-auto px-2 ">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                Attendance & Arrival Updates
              </h1>
              <p className="text-gray-600 mt-1">
                Select a roster to update employee attendance and arrival times
              </p>
            </div>
            
            <div className="bg-indigo-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-indigo-800">
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rosters...</p>
            </div>
          ) : rosters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rosters.map((roster) => {
                // Calculate total employees across all weeks
                const totalEmployees = roster.weeks?.reduce((sum, week) => 
                  sum + (week.employees?.length || 0), 0) || 0;
                
                // Get the first week's number for display
                const firstWeekNumber = roster.weeks?.[0]?.weekNumber || 1;
                
                return (
                  <div
                    key={roster._id}
                    onClick={() => navigate(`/attendance-update/${roster._id}`)}
                    className="border rounded-lg p-5 hover:shadow-lg cursor-pointer transition-all hover:border-indigo-300 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Week {firstWeekNumber}
                          </span>
                        </div>
	                        <h3 className="font-semibold text-gray-800">
	                          {new Date(roster.rosterStartDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(roster.rosterEndDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
	                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(2000, roster.month-1, 1).toLocaleString('default', { month: 'long' })} {roster.year}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-sm">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {roster.totalWeeks || 0} week{roster.totalWeeks !== 1 ? 's' : ''}
                          </span>
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Show team leaders if any */}
                        {roster.weeks?.[0]?.employees && (
                          <div className="mt-2 text-xs text-gray-400">
                            Team: {[...new Set(roster.weeks[0].employees.map(e => e.teamLeader).filter(Boolean))].join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
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

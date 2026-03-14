// import React, { useState, useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   updateArrivalTime,
//   updateAttendance,
//   getEmployeesForUpdates,
// } from "../features/slices/rosterSlice.js";
// import Navbar from "../pages/Navbar.jsx";
// import AdminNavbar from "../components/AdminNavbar.jsx"; 
// import { Clock, CheckCircle, AlertCircle, Truck, Users } from "lucide-react";
// import { toast } from "react-toastify";
// const getCurrentUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem("user"));
//   } catch {
//     return null;
//   }
// };
// const STATUS_OPTIONS = [
//   { value: "P", label: "Present (P)", color: "bg-green-100 text-green-800" },
//   { value: "WO", label: "Weekly Off (WO)", color: "bg-blue-100 text-blue-800" },
//   { value: "L", label: "Leave (L)", color: "bg-yellow-100 text-yellow-800" },
//   { value: "NCNS", label: "No Call No Show (NCNS)", color: "bg-red-100 text-red-800" },
//   { value: "UL", label: "Unpaid Leave (UL)", color: "bg-orange-100 text-orange-800" },
//   { value: "LWP", label: "Leave Without Pay (LWP)", color: "bg-purple-100 text-purple-800" },
//   { value: "BL", label: "Bereavement Leave (BL)", color: "bg-indigo-100 text-indigo-800" },
//   { value: "H", label: "Holiday (H)", color: "bg-pink-100 text-pink-800" },
//   { value: "LWD", label: "Last Working Day (LWD)", color: "bg-gray-100 text-gray-800" },
//   { value: "HD", label: "Half Day (HD)", color: "bg-cyan-100 text-cyan-800" }
// ];

// const ArrivalAttendanceUpdate = ({ rosterId }) => {
//   const dispatch = useDispatch();
//   const currentUser = getCurrentUser();
//   const { updateEmployeesData, loading } = useSelector((state) => state.roster);
//   const initialFetchDone = useRef(false);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split('T')[0]
//   );
//   const [selectedWeek, setSelectedWeek] = useState("");
//   const [updates, setUpdates] = useState({});
//   const [updatingId, setUpdatingId] = useState(null);
//   const [viewType, setViewType] = useState({});
//   const [availableWeeks, setAvailableWeeks] = useState([]);
//   const [weekInfo, setWeekInfo] = useState(null);
//   if (!rosterId) {
//     return (
//       <div className="min-h-screen bg-gray-100">
//         {viewType.isSuperAdmin ? <AdminNavbar /> : <Navbar />}
//         <div className="container mx-auto px-4 py-8">
//           <div className="bg-white rounded-lg shadow p-12 text-center">
//             <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//             <h3 className="text-xl font-medium text-gray-900">No Roster Selected</h3>
//             <p className="text-gray-500 mt-2">
//               Please select a roster from the list to start updating attendance.
//             </p>
//             <button
//               onClick={() => window.history.back()}
//               className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//             >
//               Go Back
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   useEffect(() => {
//     if (currentUser) {
//       setViewType({
//         isSuperAdmin: currentUser.accountType === "superAdmin",
//         isTransport: currentUser.department === "Transport",
//         isTeamLeader: currentUser.accountType === "employee" &&
//           ["Ops - Meta", "Marketing", "CS", "Ticketing", "HR"].includes(currentUser.department),
//         username: currentUser.username,
//         department: currentUser.department
//       });
//     }
//   }, [currentUser]);

//   useEffect(() => {
//     if (rosterId && !initialFetchDone.current) {
//       setSelectedWeek("1");
//       initialFetchDone.current = true;
//     }
//   }, [rosterId]);

//   useEffect(() => {
//     if (rosterId && selectedWeek && selectedDate) {
//       dispatch(getEmployeesForUpdates({
//         rosterId,
//         weekNumber: parseInt(selectedWeek),
//         date: selectedDate
//       }));
//     }
//   }, [dispatch, rosterId, selectedWeek, selectedDate]);

//   useEffect(() => {
//     if (updateEmployeesData?.data) {
//       const responseData = updateEmployeesData.data;

//       if (responseData.weekNumber) {
//         setWeekInfo({
//           weekNumber: responseData.weekNumber,
//           startDate: responseData.startDate,
//           endDate: responseData.endDate,
//           canEdit: responseData.canEdit,
//           editMessage: responseData.editMessage
//         });
//       }

//       const weeks = responseData.weeks || [];
//       if (JSON.stringify(weeks) !== JSON.stringify(availableWeeks)) {
//         setAvailableWeeks(weeks);
//       }

//       if (!selectedWeek && weeks.length > 0) {
//         setSelectedWeek(weeks[0].weekNumber.toString());
//       }
//     }
//   }, [updateEmployeesData]);

//   const rosterEntries = updateEmployeesData?.data?.rosterEntries || [];

//   const handleTransportArrivalChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         transportArrivalTime: value
//       }
//     }));
//   };

//   const handleDepartmentArrivalChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         departmentArrivalTime: value
//       }
//     }));
//   };

//   const handleTransportStatusChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         transportStatus: value
//       }
//     }));
//   };

//   const handleDepartmentStatusChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         departmentStatus: value
//       }
//     }));
//   };

//   const handleTransportArrivalUpdate = async (employee) => {
//     const employeeUpdate = updates[employee._id];
//     if (!employeeUpdate?.transportArrivalTime) {
//       alert(`Please select transport arrival time for ${employee.name}`);
//       return;
//     }

//     setUpdatingId(employee._id);

//     try {
//       await dispatch(
//         updateArrivalTime({
//           rosterId,
//           weekNumber: parseInt(selectedWeek),
//           employeeId: employee._id,
//           date: selectedDate,
//           arrivalTime: employeeUpdate.transportArrivalTime,
//         })
//       ).unwrap();

//       setUpdates(prev => ({
//         ...prev,
//         [employee._id]: {
//           ...prev[employee._id],
//           transportArrivalTime: ""
//         }
//       }));

//       toast.success(`Transport arrival updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update transport arrival:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const handleDepartmentArrivalUpdate = async (employee) => {
//     const employeeUpdate = updates[employee._id];
//     if (!employeeUpdate?.departmentArrivalTime) {
//       alert(`Please select department arrival time for ${employee.name}`);
//       return;
//     }

//     setUpdatingId(employee._id);

//     try {
//       await dispatch(
//         updateAttendance({
//           rosterId,
//           weekNumber: parseInt(selectedWeek),
//           employeeId: employee._id,
//           date: selectedDate,
//           ...(employeeUpdate.departmentStatus && { departmentStatus: employeeUpdate.departmentStatus }),
//           ...(employeeUpdate.transportStatus && { transportStatus: employeeUpdate.transportStatus }),
//           arrivalTime: employeeUpdate.departmentArrivalTime,
//         })
//       ).unwrap();

//       setUpdates(prev => ({
//         ...prev,
//         [employee._id]: {
//           ...prev[employee._id],
//           departmentArrivalTime: ""
//         }
//       }));

//       toast.success(`Department arrival updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update department arrival:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const handleTransportStatusUpdate = async (employee) => {
//     const employeeUpdate = updates[employee._id];
//     if (!employeeUpdate?.transportStatus) {
//       alert(`Please select transport status for ${employee.name}`);
//       return;
//     }

//     setUpdatingId(employee._id);

//     try {
//       await dispatch(
//         updateAttendance({
//           rosterId,
//           weekNumber: parseInt(selectedWeek),
//           employeeId: employee._id,
//           date: selectedDate,
//           transportStatus: employeeUpdate.transportStatus,
//         })
//       ).unwrap();

//       setUpdates(prev => ({
//         ...prev,
//         [employee._id]: {
//           ...prev[employee._id],
//           transportStatus: ""
//         }
//       }));

//       toast.success(`Transport status updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update transport status:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const handleDepartmentStatusUpdate = async (employee) => {
//     const employeeUpdate = updates[employee._id];
//     if (!employeeUpdate?.departmentStatus) {
//       alert(`Please select department status for ${employee.name}`);
//       return;
//     }

//     setUpdatingId(employee._id);

//     try {
//       await dispatch(
//         updateAttendance({
//           rosterId,
//           weekNumber: parseInt(selectedWeek),
//           employeeId: employee._id,
//           date: selectedDate,
//           departmentStatus: employeeUpdate.departmentStatus,
//         })
//       ).unwrap();

//       setUpdates(prev => ({
//         ...prev,
//         [employee._id]: {
//           ...prev[employee._id],
//           departmentStatus: ""
//         }
//       }));

//       toast.success(`Department status updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update department status:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const getTodayStatus = (employee) => {
//     if (!employee?.dailyStatus) return null;

//     return employee.dailyStatus.find(
//       d => new Date(d.date).toDateString() === new Date(selectedDate).toDateString()
//     );
//   };

//  const formatTimeForInput = (dateString) => {
//   if (!dateString) return '';
//   try {
//     const date = new Date(dateString);
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     return `${hours}:${minutes}`;
//   } catch (e) {
//     return '';
//   }
// };

// const formatTimeForDisplay = (dateString) => {
//   if (!dateString) return '--:--';
//   try {
//     const date = new Date(dateString);
//     // Use UTC methods to prevent timezone conversion
//     let hours = date.getUTCHours();
//     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
//     const ampm = hours >= 12 ? 'PM' : 'AM';
    
//     // Convert to 12-hour format
//     hours = hours % 12;
//     hours = hours ? hours : 12; // 0 should be 12
    
//     return `${hours}:${minutes} ${ampm}`;
//   } catch (e) {
//     return '--:--';
//   }
// };

//   const getStatusColor = (status) => {
//     const option = STATUS_OPTIONS.find(opt => opt.value === status);
//     return option?.color || "bg-gray-100 text-gray-800";
//   };

//   const canUpdateTransport = (viewType.isTransport || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;
//   const canUpdateDepartment = (viewType.isTeamLeader || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;

//   if (!currentUser) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-gray-800">Please login to continue</h2>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* ✅ Conditional navbar based on user type */}
//       {viewType.isSuperAdmin ? <AdminNavbar /> : <Navbar />}

//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="mb-6 bg-white rounded-lg shadow p-6">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-800">
//                 Attendance & Arrival Updates
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Update employee attendance and arrival times
//               </p>
//             </div>

//             {/* User Role Badge */}
//             <div className={`px-4 py-2 rounded-lg ${viewType.isSuperAdmin ? "bg-purple-100 text-purple-800" :
//                 viewType.isTransport ? "bg-blue-100 text-blue-800" :
//                   "bg-green-100 text-green-800"
//               }`}>
//               <span className="font-semibold flex items-center gap-2">
//                 <Clock className="w-4 h-4" />
//                 {viewType.isSuperAdmin && "👑 Super Admin"}
//                 {viewType.isTransport && "🚌 Transport"}
//                 {viewType.isTeamLeader && `👥 Team Leader: ${currentUser.username}`}
//               </span>
//             </div>
//           </div>

//           {/* Week Info Banner */}
//           {weekInfo && (
//             <div className={`mt-4 p-3 rounded-lg ${weekInfo.canEdit ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
//               }`}>
//               <p className="text-sm font-medium">
//                 Week {weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString()} - {new Date(weekInfo.endDate).toLocaleDateString()}
//               </p>
//               <p className="text-xs mt-1">{weekInfo.editMessage}</p>
//             </div>
//           )}

//           {/* Filters */}
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Select Week
//               </label>
//               <select
//                 value={selectedWeek}
//                 onChange={(e) => setSelectedWeek(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               >
//                 <option value="">Choose a week</option>
//                 {availableWeeks.map((week) => (
//                   <option key={week.weekNumber} value={week.weekNumber}>
//                     Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}) - {week.employeeCount || 0} employees
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Select Date
//               </label>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               />
//             </div>

//             <div className="bg-gray-50 rounded-lg p-3">
//               <p className="text-sm text-gray-600">
//                 <span className="font-semibold">Employees:</span> {rosterEntries.length}
//               </p>
//               <p className="text-sm text-gray-600 mt-1">
//                 <span className="font-semibold">Department:</span> {currentUser.department}
//               </p>
//               <p className="text-sm text-gray-600 mt-1">
//                 <span className="font-semibold">Team Leader:</span> {currentUser.username}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Employees Table */}
//         {loading ? (
//           <div className="bg-white rounded-lg shadow p-8 text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Loading employees...</p>
//           </div>
//         ) : rosterEntries.length > 0 ? (
//           <div className="bg-white rounded-lg shadow overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cab Route</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Leader</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Status</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept Status</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updates</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Arrival</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept Arrival</th>
//                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {rosterEntries.map((employee) => {
//                   const todayStatus = getTodayStatus(employee);
//                   const employeeUpdate = updates[employee._id] || {};
//                   const isUpdating = updatingId === employee._id;

//                   return (
//                     <tr key={employee._id} className="hover:bg-gray-50">
//                       <td className="px-4 py-3">
//                         <div className="font-medium text-gray-900">{employee.name}</div>
//                       </td>
//                       <td className="px-4 py-3 text-sm text-gray-500">{employee.department}</td>
//                       <td className="px-4 py-3">
//                         <span className={`px-2 py-1 text-xs rounded-full ${employee.transport === "Yes"
//                             ? "bg-green-100 text-green-800"
//                             : "bg-gray-100 text-gray-800"
//                           }`}>
//                           {employee.transport || "No"}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-sm text-gray-500">{employee.cabRoute || "-"}</td>
//                       <td className="px-4 py-3 text-sm text-gray-500">{employee.teamLeader || "-"}</td>
//                       <td className="px-4 py-3 text-sm text-gray-500">
//                         {employee.shiftStartHour}:00 - {employee.shiftEndHour}:00
//                       </td>

//                       {/* Transport Status Display */}
//                       <td className="px-4 py-3">
//                         {todayStatus?.transportStatus ? (
//                           <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.transportStatus)}`}>
//                             {todayStatus.transportStatus}
//                           </span>
//                         ) : (
//                           <span className="text-gray-400 text-xs">Not set</span>
//                         )}
//                       </td>

//                       {/* Department Status Display */}
//                       <td className="px-4 py-3">
//                         {todayStatus?.departmentStatus ? (
//                           <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
//                             {todayStatus.departmentStatus}
//                           </span>
//                         ) : (
//                           <span className="text-gray-400 text-xs">Not set</span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="text-xs space-y-1">
//                           {(() => {
//                             const updates = [];

//                             if (todayStatus?.transportStatus && todayStatus.transportStatusUpdatedAt) {
//                               updates.push({
//                                 type: 'Transport Status',
//                                 value: todayStatus.transportStatus,
//                                 time: new Date(todayStatus.transportStatusUpdatedAt).getTime(),
//                                 icon: '🚌',
//                                 color: 'text-blue-600'
//                               });
//                             }

//                             if (todayStatus?.departmentStatus && todayStatus.departmentStatusUpdatedAt) {
//                               updates.push({
//                                 type: 'Dept Status',
//                                 value: todayStatus.departmentStatus,
//                                 time: new Date(todayStatus.departmentStatusUpdatedAt).getTime(),
//                                 icon: '👥',
//                                 color: 'text-green-600'
//                               });
//                             }

//                             if (todayStatus?.transportArrivalTime && todayStatus.transportUpdatedAt) {
//                               updates.push({
//                                 type: 'Transport Arrival',
//                                 value: formatTimeForDisplay(todayStatus.transportArrivalTime), // ✅ Use your function
//                                 time: new Date(todayStatus.transportUpdatedAt).getTime(),
//                                 icon: '🚌',
//                                 color: 'text-blue-600'
//                               });
//                             }

//                             if (todayStatus?.departmentArrivalTime && todayStatus.departmentUpdatedAt) {
//                               updates.push({
//                                 type: 'Dept Arrival',
//                                 value: formatTimeForDisplay(todayStatus.departmentArrivalTime), // ✅ Use your function
//                                 time: new Date(todayStatus.departmentUpdatedAt).getTime(),
//                                 icon: '👥',
//                                 color: 'text-green-600'
//                               });
//                             }

//                             // Sort by time (most recent first) and take the first one
//                             const mostRecent = updates.sort((a, b) => b.time - a.time)[0];

//                             if (mostRecent) {
//                               return (
//                                 <div className={`${mostRecent.color} flex items-center gap-1`}
//                                   title={`${mostRecent.type} - ${new Date(mostRecent.time).toLocaleString()}`}>
//                                   <span>{mostRecent.icon}</span>
//                                   <span>{mostRecent.type}: {mostRecent.value}</span>
//                                 </div>
//                               );
//                             }

//                             return <span className="text-gray-400">No updates</span>;
//                           })()}
//                         </div>
//                       </td>

//                       {/* Transport Arrival - Input OR Display Value */}
//                       <td className="px-4 py-3">
//                         {canUpdateTransport ? (
//                           <div className="flex flex-col gap-1">
//                             <input
//                               type="time"
//                               value={
//                                 employeeUpdate.transportArrivalTime !== undefined
//                                   ? employeeUpdate.transportArrivalTime
//                                   : (todayStatus?.transportArrivalTime
//                                     ? formatTimeForInput(todayStatus.transportArrivalTime)
//                                     : '')
//                               }
//                               onChange={(e) => handleTransportArrivalChange(employee._id, e.target.value)}
//                               disabled={isUpdating}
//                               className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
//                               placeholder="Transport"
//                             />
//                             {todayStatus?.transportArrivalTime && !employeeUpdate.transportArrivalTime && (
//                               <span className="text-[10px] text-blue-600">
//                                 Current: {formatTimeForDisplay(todayStatus.transportArrivalTime)}
//                               </span>
//                             )}
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-700">
//                             {todayStatus?.transportArrivalTime ? (
//                               <span className="text-blue-600 font-medium">
//                                 {formatTimeForDisplay(todayStatus.transportArrivalTime)}
//                               </span>
//                             ) : (
//                               <span className="text-gray-400">--:-- --</span>
//                             )}
//                           </div>
//                         )}
//                       </td>

//                       {/* Department Arrival - Input OR Display Value */}
//                       <td className="px-4 py-3">
//                         {canUpdateDepartment ? (
//                           <div className="flex flex-col gap-1">
//                             <input
//                               type="time"
//                               value={
//                                 employeeUpdate.departmentArrivalTime !== undefined
//                                   ? employeeUpdate.departmentArrivalTime
//                                   : (todayStatus?.departmentArrivalTime
//                                     ? formatTimeForInput(todayStatus.departmentArrivalTime)
//                                     : '')
//                               }
//                               onChange={(e) => handleDepartmentArrivalChange(employee._id, e.target.value)}
//                               disabled={isUpdating}
//                               className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
//                               placeholder="Department"
//                             />
//                             {todayStatus?.departmentArrivalTime && !employeeUpdate.departmentArrivalTime && (
//                               <span className="text-[10px] text-green-600">
//                                 Current: {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
//                               </span>
//                             )}
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-700">
//                             {todayStatus?.departmentArrivalTime ? (
//                               <span className="text-green-600 font-medium">
//                                 {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
//                               </span>
//                             ) : (
//                               <span className="text-gray-400">--:-- --</span>
//                             )}
//                           </div>
//                         )}
//                       </td>

//                       {/* Actions */}
//                       <td className="px-4 py-3">
//                         <div className="flex flex-col gap-2">
//                           {/* Transport Status Update - WITH EXISTING VALUE */}
//                           {canUpdateTransport && (
//                             <div className="flex flex-col gap-1 mb-2">
//                               <select
//                                 value={
//                                   employeeUpdate.transportStatus !== undefined
//                                     ? employeeUpdate.transportStatus
//                                     : (todayStatus?.transportStatus || '')
//                                 }
//                                 onChange={(e) => handleTransportStatusChange(employee._id, e.target.value)}
//                                 disabled={isUpdating}
//                                 className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
//                               >
//                                 <option value="">Transport Attendance</option>
//                                 {STATUS_OPTIONS.map(option => (
//                                   <option key={option.value} value={option.value}>
//                                     {option.label}
//                                   </option>
//                                 ))}
//                               </select>
//                               {todayStatus?.transportStatus && !employeeUpdate.transportStatus && (
//                                 <span className="text-[10px] text-blue-600">
//                                   Current: {todayStatus.transportStatus}
//                                 </span>
//                               )}
//                               {employeeUpdate.transportStatus && employeeUpdate.transportStatus !== todayStatus?.transportStatus && (
//                                 <button
//                                   onClick={() => handleTransportStatusUpdate(employee)}
//                                   disabled={isUpdating}
//                                   className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
//                                 >
//                                   <CheckCircle className="w-3 h-3" />
//                                   Update Transport Status
//                                 </button>
//                               )}
//                             </div>
//                           )}

//                           {/* Department Status Update - WITH EXISTING VALUE */}
//                           {canUpdateDepartment && (
//                             <div className="flex flex-col gap-1 mb-2">
//                               <select
//                                 value={
//                                   employeeUpdate.departmentStatus !== undefined
//                                     ? employeeUpdate.departmentStatus
//                                     : (todayStatus?.departmentStatus || '')
//                                 }
//                                 onChange={(e) => handleDepartmentStatusChange(employee._id, e.target.value)}
//                                 disabled={isUpdating}
//                                 className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
//                               >
//                                 <option value="">Dept ATTENDANCE</option>
//                                 {STATUS_OPTIONS.map(option => (
//                                   <option key={option.value} value={option.value}>
//                                     {option.label}
//                                   </option>
//                                 ))}
//                               </select>
//                               {todayStatus?.departmentStatus && !employeeUpdate.departmentStatus && (
//                                 <span className="text-[10px] text-green-600">
//                                   Current: {todayStatus.departmentStatus}
//                                 </span>
//                               )}
//                               {employeeUpdate.departmentStatus && employeeUpdate.departmentStatus !== todayStatus?.departmentStatus && (
//                                 <button
//                                   onClick={() => handleDepartmentStatusUpdate(employee)}
//                                   disabled={isUpdating}
//                                   className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
//                                 >
//                                   <CheckCircle className="w-3 h-3" />
//                                   Update Dept Status
//                                 </button>
//                               )}
//                             </div>
//                           )}

//                           {/* Transport Arrival Update */}
//                           {canUpdateTransport && employeeUpdate.transportArrivalTime && employeeUpdate.transportArrivalTime !== formatTimeForInput(todayStatus?.transportArrivalTime) && (
//                             <button
//                               onClick={() => handleTransportArrivalUpdate(employee)}
//                               disabled={isUpdating}
//                               className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 mt-1"
//                             >
//                               <Truck className="w-3 h-3" />
//                               Update Transport Arrival
//                             </button>
//                           )}

//                           {/* Department Arrival Update */}
//                           {canUpdateDepartment && employeeUpdate.departmentArrivalTime && employeeUpdate.departmentArrivalTime !== formatTimeForInput(todayStatus?.departmentArrivalTime) && (
//                             <button
//                               onClick={() => handleDepartmentArrivalUpdate(employee)}
//                               disabled={isUpdating}
//                               className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 mt-1"
//                             >
//                               <Users className="w-3 h-3" />
//                               Update Dept Arrival
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="bg-white rounded-lg shadow p-8 text-center">
//             <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
//             <p className="text-gray-500 mt-2">
//               {selectedWeek ? "No employees available for the selected criteria" : "Please select a week to view employees"}
//             </p>
//           </div>
//         )}

//         {/* Legend */}
//         <div className="mt-6 bg-white rounded-lg shadow p-4">
//           <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h3>
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
//             {STATUS_OPTIONS.map(option => (
//               <div key={option.value} className="flex items-center gap-2">
//                 <span className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></span>
//                 <span className="text-xs text-gray-600">{option.label}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ArrivalAttendanceUpdate;







import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	  updateArrivalTime,
	  updateAttendance,
	  updateAttendanceBulk,
	  getEmployeesForUpdates,
	} from "../features/slices/rosterSlice.js";
import Navbar from "../pages/Navbar.jsx";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { Clock, CheckCircle, AlertCircle, Truck, Users, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { toast } from "react-toastify";

// 🔹 Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// Status options matching your schema
const STATUS_OPTIONS = [
  { value: "P", label: "Present (P)", color: "bg-green-100 text-green-800" },
  { value: "WO", label: "Weekly Off (WO)", color: "bg-blue-100 text-blue-800" },
  { value: "L", label: "Leave (L)", color: "bg-yellow-100 text-yellow-800" },
  { value: "NCNS", label: "No Call No Show (NCNS)", color: "bg-red-100 text-red-800" },
  { value: "UL", label: "Unpaid Leave (UL)", color: "bg-orange-100 text-orange-800" },
  { value: "LWP", label: "Leave Without Pay (LWP)", color: "bg-purple-100 text-purple-800" },
  { value: "BL", label: "Bereavement Leave (BL)", color: "bg-indigo-100 text-indigo-800" },
  { value: "H", label: "Holiday (H)", color: "bg-pink-100 text-pink-800" },
  { value: "LWD", label: "Last Working Day (LWD)", color: "bg-gray-100 text-gray-800" },
  { value: "HD", label: "Half Day (HD)", color: "bg-cyan-100 text-cyan-800" }
];

const ArrivalAttendanceUpdate = ({ rosterId }) => {
  const dispatch = useDispatch();
  const currentUser = getCurrentUser();
  const { updateEmployeesData, loading } = useSelector((state) => state.roster);
  
  // Use ref to track if initial fetch has been done
  const initialFetchDone = useRef(false);
  
  // State
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
		  const [selectedWeek, setSelectedWeek] = useState("");
		  const [currentPage, setCurrentPage] = useState(1);
		  const [pageSize, setPageSize] = useState(25);
		  const [tableTheme, setTableTheme] = useState("dark"); // "dark" | "light"
		  const [updates, setUpdates] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
	  const [viewType, setViewType] = useState({});
	  const [availableWeeks, setAvailableWeeks] = useState([]);
	  const [weekInfo, setWeekInfo] = useState(null);
	  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
	  const [bulkUpdate, setBulkUpdate] = useState({
	    transportStatus: "",
	    departmentStatus: "",
	    arrivalTime: ""
	  });
	  const [bulkUpdating, setBulkUpdating] = useState(false);

  // If no rosterId is provided, show message
  if (!rosterId) {
    return (
      <div className="min-h-screen bg-gray-100">
        {currentUser?.accountType === "superAdmin" ? <AdminNavbar /> : <Navbar />}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No Roster Selected</h3>
            <p className="text-gray-500 mt-2">
              Please select a roster from the list to start updating attendance.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine view type based on user
	  useEffect(() => {
	    if (currentUser) {
	      setViewType({
	        isSuperAdmin: currentUser.accountType === "superAdmin",
	        isHR: currentUser.accountType === "HR",
	        isTransport: currentUser.department === "Transport",
	        isEmployee: currentUser.accountType === "employee",
	        isTeamLeader: currentUser.accountType === "employee" && Boolean(currentUser.username),
	        username: currentUser.username,
	        department: currentUser.department
	      });
	    }
	  }, [currentUser]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (rosterId && !initialFetchDone.current) {
      setSelectedWeek("1");
      initialFetchDone.current = true;
    }
  }, [rosterId]);

  // Fetch employees when rosterId, week, or date changes
	  useEffect(() => {
	    if (rosterId && selectedWeek && selectedDate) {
	      dispatch(getEmployeesForUpdates({
	        rosterId,
	        weekNumber: parseInt(selectedWeek),
	        date: selectedDate,
	        page: currentPage,
	        limit: pageSize
	      }));
	    }
	  }, [dispatch, rosterId, selectedWeek, selectedDate, currentPage, pageSize]);

  // Process the response data
  useEffect(() => {
    if (updateEmployeesData?.data) {
      const responseData = updateEmployeesData.data;
      
      if (responseData.weekNumber) {
        setWeekInfo({
          weekNumber: responseData.weekNumber,
          startDate: responseData.startDate,
          endDate: responseData.endDate,
          canEdit: responseData.canEdit,
          editMessage: responseData.editMessage
        });
      }
      
      const weeks = responseData.weeks || [];
      if (JSON.stringify(weeks) !== JSON.stringify(availableWeeks)) {
        setAvailableWeeks(weeks);
      }
      
      if (!selectedWeek && weeks.length > 0) {
        setSelectedWeek(weeks[0].weekNumber.toString());
      }
    }
  }, [updateEmployeesData]);

		  const rosterEntries = updateEmployeesData?.data?.rosterEntries || [];
		  const pagination = updateEmployeesData?.data?.pagination;
		  const totalEmployees = pagination?.totalEmployees ?? rosterEntries.length;
		  const totalPages = pagination?.totalPages ?? 1;
		  const rangeStart = totalEmployees === 0 ? 0 : (currentPage - 1) * pageSize + 1;
		  const rangeEnd = Math.min(currentPage * pageSize, totalEmployees);

		  useEffect(() => {
		    if (pagination?.page && pagination.page !== currentPage) {
		      setCurrentPage(pagination.page);
		    }
		  }, [pagination?.page, currentPage]);

	  useEffect(() => {
	    setSelectedEmployeeIds([]);
	  }, [rosterId, selectedWeek, selectedDate]);

	  useEffect(() => {
	    const currentIds = new Set(rosterEntries.map((e) => String(e._id)));
	    setSelectedEmployeeIds((prev) => prev.filter((id) => currentIds.has(String(id))));
	  }, [rosterEntries]);

	  // Handle transport arrival update
	  const handleTransportArrivalChange = (employeeId, value) => {
	    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        transportArrivalTime: value
      }
    }));
  };

  // Handle department arrival update
  const handleDepartmentArrivalChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        departmentArrivalTime: value
      }
    }));
  };

  // Handle transport status change
  const handleTransportStatusChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        transportStatus: value
      }
    }));
  };

  // Handle department status change
  const handleDepartmentStatusChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        departmentStatus: value
      }
    }));
  };

  const handleTransportArrivalUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.transportArrivalTime) {
      alert(`Please select transport arrival time for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateArrivalTime({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          arrivalTime: employeeUpdate.transportArrivalTime,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          transportArrivalTime: ""
        }
      }));
      
      toast.success(`Transport arrival updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update transport arrival:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDepartmentArrivalUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.departmentArrivalTime) {
      alert(`Please select department arrival time for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          ...(employeeUpdate.departmentStatus && { departmentStatus: employeeUpdate.departmentStatus }),
          ...(employeeUpdate.transportStatus && { transportStatus: employeeUpdate.transportStatus }),
          arrivalTime: employeeUpdate.departmentArrivalTime,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          departmentArrivalTime: ""
        }
      }));
      
      toast.success(`Department arrival updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department arrival:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle transport status update - only send transportStatus
  const handleTransportStatusUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.transportStatus) {
      alert(`Please select transport status for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          transportStatus: employeeUpdate.transportStatus,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          transportStatus: ""
        }
      }));
      
      toast.success(`Transport status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update transport status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle department status update - only send departmentStatus
  const handleDepartmentStatusUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.departmentStatus) {
      alert(`Please select department status for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          departmentStatus: employeeUpdate.departmentStatus,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          departmentStatus: ""
        }
      }));
      
      toast.success(`Department status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Get today's status for an employee with all fields
  const getTodayStatus = (employee) => {
    if (!employee?.dailyStatus) return null;
    
    return employee.dailyStatus.find(
      d => new Date(d.date).toDateString() === new Date(selectedDate).toDateString()
    );
  };

  // Format time for input field (HH:MM)
  const formatTimeForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  // Format time for display (HH:MM:SS AM/PM)
	  const formatTimeForDisplay = (dateString) => {
	    if (!dateString) return '--:-- --';
	    try {
	      return new Date(dateString).toLocaleTimeString();
	    } catch (e) {
	      return '--:-- --';
	    }
	  };

	  const formatShift = (startHour, endHour) => {
	    const start = Number.parseInt(startHour, 10);
	    const end = Number.parseInt(endHour, 10);
	    if (Number.isNaN(start) || Number.isNaN(end)) return "-";
	    if (start === 0 && end === 0) return "-";
	    return `${start}:00 - ${end}:00`;
	  };

	  const getStatusColor = (status) => {
	    const option = STATUS_OPTIONS.find(opt => opt.value === status);
	    return option?.color || "bg-gray-100 text-gray-800";
	  };

	  const isDarkTable = tableTheme === "dark";

	  const canUpdateTransport = (viewType.isTransport || viewType.isSuperAdmin || viewType.isHR) && weekInfo?.canEdit !== false;
	  const canUpdateDepartment = (!viewType.isTransport) && (viewType.isSuperAdmin || viewType.isHR || viewType.isEmployee) && weekInfo?.canEdit !== false;

	  const isAllSelected = rosterEntries.length > 0 && selectedEmployeeIds.length === rosterEntries.length;

	  const handleToggleSelectAll = (checked) => {
	    setSelectedEmployeeIds(checked ? rosterEntries.map((e) => e._id) : []);
	  };

	  const handleToggleSelectOne = (employeeId, checked) => {
	    setSelectedEmployeeIds((prev) => {
	      const id = String(employeeId);
	      if (checked) return Array.from(new Set([...prev.map(String), id]));
	      return prev.filter((x) => String(x) !== id);
	    });
	  };

	  const handleApplyBulkUpdate = async () => {
	    if (!selectedWeek || !selectedDate) {
	      toast.error("Please select week and date first.");
	      return;
	    }

	    if (selectedEmployeeIds.length === 0) {
	      toast.error("Please select at least one employee.");
	      return;
	    }

	    const payload = {
	      rosterId,
	      weekNumber: parseInt(selectedWeek),
	      employeeIds: selectedEmployeeIds,
	      date: selectedDate,
	    };

	    if (canUpdateTransport && bulkUpdate.transportStatus) {
	      payload.transportStatus = bulkUpdate.transportStatus;
	    }

	    if (canUpdateDepartment && bulkUpdate.departmentStatus) {
	      payload.departmentStatus = bulkUpdate.departmentStatus;
	    }

	    if ((canUpdateTransport || canUpdateDepartment) && bulkUpdate.arrivalTime) {
	      payload.arrivalTime = bulkUpdate.arrivalTime;
	    }

	    if (!payload.transportStatus && !payload.departmentStatus && !payload.arrivalTime) {
	      toast.error("Select at least one bulk update value (status or arrival time).");
	      return;
	    }

	    setBulkUpdating(true);
	    try {
		      await dispatch(updateAttendanceBulk(payload)).unwrap();
		      dispatch(getEmployeesForUpdates({
		        rosterId,
		        weekNumber: parseInt(selectedWeek),
		        date: selectedDate,
		        page: currentPage,
		        limit: pageSize
		      }));
	      setSelectedEmployeeIds([]);
	    } catch {
	      // thunk toasts on failure
	    } finally {
	      setBulkUpdating(false);
	    }
	  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Please login to continue</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Conditional Navbar Rendering - SuperAdmin sees AdminNavbar, others see regular Navbar */}
      {viewType.isSuperAdmin ? <AdminNavbar /> : <Navbar />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Attendance & Arrival Updates
              </h1>
              <p className="text-gray-600 mt-1">
                Update employee attendance and arrival times
              </p>
            </div>
            
            {/* User Role Badge */}
	            <div className={`px-4 py-2 rounded-lg ${
	              viewType.isSuperAdmin ? "bg-purple-100 text-purple-800" :
	              viewType.isHR ? "bg-amber-100 text-amber-800" :
	              viewType.isTransport ? "bg-blue-100 text-blue-800" :
	              "bg-green-100 text-green-800"
	            }`}>
              <span className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {viewType.isSuperAdmin && "👑 Super Admin"}
                {viewType.isHR && "HR"}
                {viewType.isTransport && "🚌 Transport"}
                {viewType.isEmployee && !viewType.isTransport && `${currentUser.department}`}
              </span>
            </div>
          </div>

          {/* Week Info Banner */}
          {weekInfo && (
            <div className={`mt-4 p-3 rounded-lg ${
              weekInfo.canEdit ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <p className="text-sm font-medium">
                Week {weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString()} - {new Date(weekInfo.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs mt-1">{weekInfo.editMessage}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Week
              </label>
	              <select
	                value={selectedWeek}
	                onChange={(e) => {
	                  setSelectedWeek(e.target.value);
	                  setCurrentPage(1);
	                }}
	                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
	              >
                <option value="">Choose a week</option>
                {availableWeeks.map((week) => (
                  <option key={week.weekNumber} value={week.weekNumber}>
                    Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}) - {week.employeeCount || 0} employees
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
	              <input
	                type="date"
	                value={selectedDate}
	                onChange={(e) => {
	                  setSelectedDate(e.target.value);
	                  setCurrentPage(1);
	                }}
	                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
	              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Employees:</span> {rosterEntries.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Department:</span> {currentUser.department}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Team Leader:</span> {currentUser.username}
              </p>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
	        ) : rosterEntries.length > 0 ? (
	          <div className="space-y-4">
	            {/* Bulk Update */}
	            <div className="bg-white rounded-lg shadow p-4">
	              <div className="flex flex-wrap items-end gap-4">
	                <div className="text-sm text-gray-700">
	                  <span className="font-semibold">Selected:</span> {selectedEmployeeIds.length}
	                </div>

	                {canUpdateTransport && (
	                  <div>
	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Transport Status</label>
	                    <select
	                      value={bulkUpdate.transportStatus}
	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, transportStatus: e.target.value }))}
	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-56"
	                      disabled={bulkUpdating}
	                    >
	                      <option value="">(No change)</option>
	                      {STATUS_OPTIONS.map((option) => (
	                        <option key={option.value} value={option.value}>
	                          {option.label}
	                        </option>
	                      ))}
	                    </select>
	                  </div>
	                )}

	                {canUpdateDepartment && (
	                  <div>
	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Dept Status</label>
	                    <select
	                      value={bulkUpdate.departmentStatus}
	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, departmentStatus: e.target.value }))}
	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-56"
	                      disabled={bulkUpdating}
	                    >
	                      <option value="">(No change)</option>
	                      {STATUS_OPTIONS.map((option) => (
	                        <option key={option.value} value={option.value}>
	                          {option.label}
	                        </option>
	                      ))}
	                    </select>
	                  </div>
	                )}

	                {(canUpdateTransport || canUpdateDepartment) && (
	                  <div>
	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Arrival Time</label>
	                    <input
	                      type="time"
	                      value={bulkUpdate.arrivalTime}
	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, arrivalTime: e.target.value }))}
	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-40"
	                      disabled={bulkUpdating}
	                    />
	                  </div>
	                )}

		                <div className="flex items-center gap-2 ml-auto">
		                  <button
		                    type="button"
		                    onClick={() => setTableTheme((t) => (t === "dark" ? "light" : "dark"))}
		                    className="px-3 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50"
		                  >
		                    {isDarkTable ? (
		                      <span className="inline-flex items-center gap-2">
		                        <Sun className="w-4 h-4" /> Light
		                      </span>
		                    ) : (
		                      <span className="inline-flex items-center gap-2">
		                        <Moon className="w-4 h-4" /> Dark
		                      </span>
		                    )}
		                  </button>
		                  <button
		                    type="button"
		                    onClick={() => {
	                      setSelectedEmployeeIds([]);
	                      setBulkUpdate({ transportStatus: "", departmentStatus: "", arrivalTime: "" });
	                    }}
	                    className="px-3 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
	                    disabled={bulkUpdating}
	                  >
	                    Clear
	                  </button>
	                  <button
	                    type="button"
	                    onClick={handleApplyBulkUpdate}
	                    className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
	                    disabled={bulkUpdating || selectedEmployeeIds.length === 0}
	                  >
	                    Apply to Selected
	                  </button>
	                </div>
	              </div>
	            </div>

			            <div className={
			              isDarkTable
			                ? "rounded-lg shadow border border-neutral-800 bg-neutral-900 text-neutral-100 overflow-auto max-h-[70vh]"
			                : "rounded-lg shadow border border-gray-200 bg-white text-gray-900 overflow-auto max-h-[70vh]"
			            }>
			            <table className={isDarkTable ? "min-w-full divide-y divide-neutral-800" : "min-w-full divide-y divide-gray-200"}>
			              <thead className={isDarkTable ? "bg-neutral-950 sticky top-0 z-10" : "bg-gray-50 sticky top-0 z-10"}>
		                <tr>
			                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>
		                    <input
		                      type="checkbox"
		                      checked={isAllSelected}
		                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
		                      aria-label="Select all employees"
		                      className="h-4 w-4 accent-indigo-500"
		                    />
		                  </th>
		                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Employee</th>
		                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Department</th>
		                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Cab Route</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Team Leader</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Shift</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Last Updates</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Arrival</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Arrival</th>
	                  <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Actions</th>
	                </tr>
	              </thead>
		              <tbody className={isDarkTable ? "bg-neutral-900 divide-y divide-neutral-800" : "bg-white divide-y divide-gray-200"}>
	                {rosterEntries.map((employee) => {
	                  const todayStatus = getTodayStatus(employee);
	                  const employeeUpdate = updates[employee._id] || {};
	                  const isUpdating = updatingId === employee._id;
	                  const isSelected = selectedEmployeeIds.some((id) => String(id) === String(employee._id));
	
		                  return (
			                    <tr
			                      key={employee._id}
			                      className={`${isDarkTable ? "hover:bg-neutral-800/40" : "hover:bg-gray-50"} ${isSelected ? (isDarkTable ? "bg-indigo-500/10" : "bg-indigo-50") : ""}`}
			                    >
		                      <td className="px-4 py-3">
		                        <input
		                          type="checkbox"
		                          checked={isSelected}
		                          onChange={(e) => handleToggleSelectOne(employee._id, e.target.checked)}
		                          aria-label={`Select ${employee.name}`}
		                          className="h-4 w-4 accent-indigo-500"
		                        />
		                      </td>
			                      <td className="px-4 py-3">
			                        <div className={isDarkTable ? "font-medium text-neutral-100" : "font-medium text-gray-900"}>{employee.name}</div>
			                      </td>
		                      <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.department}</td>
	                      <td className="px-4 py-3">
	                        <span className={`px-2 py-1 text-xs rounded-full ${
	                          employee.transport === "Yes" 
	                            ? "bg-green-100 text-green-800" 
	                            : "bg-gray-100 text-gray-800"
	                        }`}>
	                          {employee.transport || "No"}
	                        </span>
	                      </td>
		                      <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.cabRoute || "-"}</td>
		                      <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.teamLeader || "-"}</td>
		                      <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>
		                        {formatShift(employee.shiftStartHour, employee.shiftEndHour)}
		                      </td>
                      
                      {/* Transport Status Display */}
                      <td className="px-4 py-3">
                        {todayStatus?.transportStatus ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.transportStatus)}`}>
                            {todayStatus.transportStatus}
                          </span>
                        ) : (
		                          <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
	                        )}
	                      </td>

	                      {/* Department Status Display */}
	                      <td className="px-4 py-3">
	                        {todayStatus?.departmentStatus ? (
	                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
	                            {todayStatus.departmentStatus}
	                          </span>
	                        ) : (
		                          <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
	                        )}
	                      </td>

                      {/* Last Updates - Show ONLY the most recent update */}
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {(() => {
                            // Collect all updates with their timestamps
                            const updates = [];
                            
                            if (todayStatus?.transportStatus && todayStatus.transportStatusUpdatedAt) {
                              updates.push({
                                type: 'Transport Status',
                                value: todayStatus.transportStatus,
                                time: new Date(todayStatus.transportStatusUpdatedAt).getTime(),
                                icon: '🚌',
                                color: 'text-blue-600'
                              });
                            }
                            
                            if (todayStatus?.departmentStatus && todayStatus.departmentStatusUpdatedAt) {
                              updates.push({
                                type: 'Dept Status',
                                value: todayStatus.departmentStatus,
                                time: new Date(todayStatus.departmentStatusUpdatedAt).getTime(),
                                icon: '👥',
                                color: 'text-green-600'
                              });
                            }
                            
                            if (todayStatus?.transportArrivalTime && todayStatus.transportUpdatedAt) {
                              updates.push({
                                type: 'Transport Arrival',
                                value: new Date(todayStatus.transportArrivalTime).toLocaleTimeString(),
                                time: new Date(todayStatus.transportUpdatedAt).getTime(),
                                icon: '🚌',
                                color: 'text-blue-600'
                              });
                            }
                            
                            if (todayStatus?.departmentArrivalTime && todayStatus.departmentUpdatedAt) {
                              updates.push({
                                type: 'Dept Arrival',
                                value: new Date(todayStatus.departmentArrivalTime).toLocaleTimeString(),
                                time: new Date(todayStatus.departmentUpdatedAt).getTime(),
                                icon: '👥',
                                color: 'text-green-600'
                              });
                            }
                            
                            // Sort by time (most recent first) and take the first one
                            const mostRecent = updates.sort((a, b) => b.time - a.time)[0];
                            
                            if (mostRecent) {
                              return (
                                <div className={`${mostRecent.color} flex items-center gap-1`} 
                                     title={`${mostRecent.type} - ${new Date(mostRecent.time).toLocaleString()}`}>
                                  <span>{mostRecent.icon}</span>
                                  <span>{mostRecent.type}: {mostRecent.value}</span>
                                </div>
                              );
                            }
                            
                            return <span className="text-gray-400">No updates</span>;
                          })()}
                        </div>
                      </td>
                      {/* Transport Arrival - Input OR Display Value */}
                      <td className="px-4 py-3">
                        {canUpdateTransport ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={
                                employeeUpdate.transportArrivalTime !== undefined 
                                  ? employeeUpdate.transportArrivalTime 
                                  : (todayStatus?.transportArrivalTime 
                                      ? formatTimeForInput(todayStatus.transportArrivalTime)
                                      : '')
                              }
                              onChange={(e) => handleTransportArrivalChange(employee._id, e.target.value)}
                              disabled={isUpdating}
                              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="Transport"
                            />
                            {todayStatus?.transportArrivalTime && !employeeUpdate.transportArrivalTime && (
                              <span className="text-[10px] text-blue-600">
                                Current: {formatTimeForDisplay(todayStatus.transportArrivalTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700">
                            {todayStatus?.transportArrivalTime ? (
                              <span className="text-blue-600 font-medium">
                                {formatTimeForDisplay(todayStatus.transportArrivalTime)}
                              </span>
                            ) : (
                              <span className="text-gray-400">--:-- --</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Department Arrival - Input OR Display Value */}
                      <td className="px-4 py-3">
                        {canUpdateDepartment ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={
                                employeeUpdate.departmentArrivalTime !== undefined 
                                  ? employeeUpdate.departmentArrivalTime 
                                  : (todayStatus?.departmentArrivalTime 
                                      ? formatTimeForInput(todayStatus.departmentArrivalTime)
                                      : '')
                              }
                              onChange={(e) => handleDepartmentArrivalChange(employee._id, e.target.value)}
                              disabled={isUpdating}
                              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                              placeholder="Department"
                            />
                            {todayStatus?.departmentArrivalTime && !employeeUpdate.departmentArrivalTime && (
                              <span className="text-[10px] text-green-600">
                                Current: {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700">
                            {todayStatus?.departmentArrivalTime ? (
                              <span className="text-green-600 font-medium">
                                {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
                              </span>
                            ) : (
                              <span className="text-gray-400">--:-- --</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {/* Transport Status Update - WITH EXISTING VALUE */}
                          {canUpdateTransport && (
                            <div className="flex flex-col gap-1 mb-2">
                              <select
                                value={
                                  employeeUpdate.transportStatus !== undefined 
                                    ? employeeUpdate.transportStatus 
                                    : (todayStatus?.transportStatus || '')
                                }
                                onChange={(e) => handleTransportStatusChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">Transport Attendance</option>
                                {STATUS_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {todayStatus?.transportStatus && !employeeUpdate.transportStatus && (
                                <span className="text-[10px] text-blue-600">
                                  Current: {todayStatus.transportStatus}
                                </span>
                              )}
                              {employeeUpdate.transportStatus && employeeUpdate.transportStatus !== todayStatus?.transportStatus && (
                                <button
                                  onClick={() => handleTransportStatusUpdate(employee)}
                                  disabled={isUpdating}
                                  className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Update Transport Status
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Department Status Update - WITH EXISTING VALUE */}
                          {canUpdateDepartment && (
                            <div className="flex flex-col gap-1 mb-2">
                              <select
                                value={
                                  employeeUpdate.departmentStatus !== undefined 
                                    ? employeeUpdate.departmentStatus 
                                    : (todayStatus?.departmentStatus || '')
                                }
                                onChange={(e) => handleDepartmentStatusChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                              >
                                <option value="">Dept ATTENDANCE</option>
                                {STATUS_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {todayStatus?.departmentStatus && !employeeUpdate.departmentStatus && (
                                <span className="text-[10px] text-green-600">
                                  Current: {todayStatus.departmentStatus}
                                </span>
                              )}
                              {employeeUpdate.departmentStatus && employeeUpdate.departmentStatus !== todayStatus?.departmentStatus && (
                                <button
                                  onClick={() => handleDepartmentStatusUpdate(employee)}
                                  disabled={isUpdating}
                                  className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Update Dept Status
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Transport Arrival Update */}
                          {canUpdateTransport && employeeUpdate.transportArrivalTime && employeeUpdate.transportArrivalTime !== formatTimeForInput(todayStatus?.transportArrivalTime) && (
                            <button
                              onClick={() => handleTransportArrivalUpdate(employee)}
                              disabled={isUpdating}
                              className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 mt-1"
                            >
                              <Truck className="w-3 h-3" />
                              Update Transport Arrival
                            </button>
                          )}
                          
                          {/* Department Arrival Update */}
                          {canUpdateDepartment && employeeUpdate.departmentArrivalTime && employeeUpdate.departmentArrivalTime !== formatTimeForInput(todayStatus?.departmentArrivalTime) && (
                            <button
                              onClick={() => handleDepartmentArrivalUpdate(employee)}
                              disabled={isUpdating}
                              className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 mt-1"
                            >
                              <Users className="w-3 h-3" />
                              Update Dept Arrival
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
		              </tbody>
		            </table>
			            {pagination && (
				              <div className={isDarkTable ? "flex flex-wrap items-center justify-end gap-6 border-t border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-300" : "flex flex-wrap items-center justify-end gap-6 border-t border-gray-200 bg-gray-50 px-4 py-3 text-gray-700"}>
			                <div className="flex items-center gap-2 text-sm">
			                  <span>Rows per page:</span>
			                  <select
			                    value={pageSize}
			                    onChange={(e) => {
			                      setPageSize(parseInt(e.target.value));
			                      setCurrentPage(1);
			                    }}
				                    className={isDarkTable ? "bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200" : "bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"}
			                  >
			                    {[10, 25, 50, 100].map((n) => (
			                      <option key={n} value={n}>
			                        {n}
			                      </option>
			                    ))}
			                  </select>
			                </div>

				                <div className={isDarkTable ? "text-sm text-neutral-200" : "text-sm text-gray-700"}>
			                  {rangeStart}–{rangeEnd} of {totalEmployees}
			                </div>

			                <div className="flex items-center gap-1">
			                  <button
			                    type="button"
			                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
			                    disabled={currentPage <= 1}
				                    className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
			                    aria-label="Previous page"
			                  >
			                    <ChevronLeft className="h-4 w-4" />
			                  </button>
			                  <button
			                    type="button"
			                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
			                    disabled={currentPage >= totalPages}
				                    className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
			                    aria-label="Next page"
			                  >
			                    <ChevronRight className="h-4 w-4" />
			                  </button>
			                </div>
			              </div>
			            )}
		          </div>
		          </div>
		        ) : (
	          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
            <p className="text-gray-500 mt-2">
              {selectedWeek ? "No employees available for the selected criteria" : "Please select a week to view employees"}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STATUS_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></span>
                <span className="text-xs text-gray-600">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrivalAttendanceUpdate;

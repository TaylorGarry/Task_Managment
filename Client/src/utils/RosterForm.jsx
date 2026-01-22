import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminNavbar from "../components/AdminNavbar";
import RosterCopyPopup from "../components/RosterCopyPopup";
import { toast } from "react-toastify";
import {
  addRosterWeek,
  fetchAllRosters,
  // fetchRoster,
  updateRosterEmployee,
  exportRosterExcel,
  exportSavedRoster,
  deleteEmployeeFromRoster,
  deleteEmployeeByUserId,
  // deleteEmployeeByName
} from "../features/slices/rosterSlice";

// const RosterForm = () => {
//   const dispatch = useDispatch();
//   const {
//     roster,
//     loading,
//     error,
//     allRosters,
//     rosterDetailLoading,
//     savedExportLoading,
//     savedExportSuccess
//   } = useSelector((state) => state.roster || {});

//   const [employeeInput, setEmployeeInput] = useState({
//     name: "",
//     transport: "",
//     cabRoute: "",
//     shift: "",
//     shiftStartHour: "",
//     shiftEndHour: "",
//     isCoreTeam: false,
//     dailyStatus: Array(7).fill("P"),
//   });

//   const [employees, setEmployees] = useState([]);
//   const [editIndex, setEditIndex] = useState(null);
//   const [generated, setGenerated] = useState(false);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const [selectedDayOverview, setSelectedDayOverview] = useState(null);
//   const [showSavedRoster, setShowSavedRoster] = useState(false);
//   const [selectedWeek, setSelectedWeek] = useState(null);
//   const [showExportModal, setShowExportModal] = useState(false);
//   const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
//   const [exportYear, setExportYear] = useState(new Date().getFullYear());
//   const [showSaveModal, setShowSaveModal] = useState(false); 
//   const [saveAction, setSaveAction] = useState("create"); 

//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editSavedEmployee, setEditSavedEmployee] = useState(null);

//   const inputRef = useRef(null);
//   const scrollContainerRef = useRef(null);
//   const formRef = useRef(null);

//   const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

//   useEffect(() => {
//     const handleScroll = () => {
//       if (scrollContainerRef.current) {
//         const { scrollTop } = scrollContainerRef.current;
//         setShowScrollTop(scrollTop > 100);
//       }
//     };

//     const container = scrollContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       return () => container.removeEventListener("scroll", handleScroll);
//     }
//   }, []);

//   const handleExportSavedRoster = async () => {
//     try {
//       if (allRosters && allRosters.length > 0) {
//         setExportMonth(allRosters[0].month || new Date().getMonth() + 1);
//         setExportYear(allRosters[0].year || new Date().getFullYear());
//       }
//       setShowExportModal(true);
//     } catch (err) {
//       toast.success("Failed to prepare export");
//     }
//   };

//   const executeExportSavedRoster = async () => {
//     try {
//       if (!exportMonth || !exportYear) {
//         toast.success("Please select month and year");
//         return;
//       }

//       await dispatch(
//         exportSavedRoster({
//           month: exportMonth,
//           year: exportYear,
//         })
//       ).unwrap();

//       toast.success("Saved roster exported successfully!");
//       setShowExportModal(false);
//     } catch (err) {
//       toast.success(err.message || "Failed to export saved roster");
//     }
//   };

//   const handleViewSavedRoster = async () => {
//     try {
//       await dispatch(fetchAllRosters({})).unwrap();
//       setShowSavedRoster(true);
//       setSelectedWeek(null);
//     } catch (err) {
//       toast.error("Failed to load saved roster data");
//     }
//   };

//   const handleInputChange = (e, dayIndex) => {
//     const { name, value, type, checked } = e.target;

//     if (name.startsWith("day")) {
//       const newDaily = [...employeeInput.dailyStatus];
//       newDaily[dayIndex] = value;
//       setEmployeeInput({ ...employeeInput, dailyStatus: newDaily });
//     } else {
//       setEmployeeInput({
//         ...employeeInput,
//         [name]: type === "checkbox" ? checked : value,
//       });
//     }
//   };

//   const handleAddEmployee = () => {
//     if (!employeeInput.name) return toast.success("Enter employee name");

//     if (!employeeInput.isCoreTeam) {
//       if (!employeeInput.shiftStartHour) return toast.info("Enter shift start hour");
//       if (!employeeInput.shiftEndHour) return toast.info("Enter shift end hour");

//       const startHour = parseInt(employeeInput.shiftStartHour);
//       const endHour = parseInt(employeeInput.shiftEndHour);

//       if (isNaN(startHour) || isNaN(endHour)) {
//         return toast.info("Shift hours must be numbers");
//       }
//     }

//     const newEmployees = [...employees];
//     if (editIndex !== null) {
//       newEmployees[editIndex] = employeeInput;
//       setEditIndex(null);
//     } else {
//       newEmployees.push(employeeInput);
//     }
//     setEmployees(newEmployees);
//     setEmployeeInput({
//       name: "",
//       transport: "",
//       cabRoute: "",
//       shift: "",
//       shiftStartHour: "",
//       shiftEndHour: "",
//       isCoreTeam: false,
//       dailyStatus: Array(7).fill("P"),
//     });
//     inputRef.current?.focus();
//   };

//   const handleEdit = (index) => {
//     setEmployeeInput(employees[index]);
//     setEditIndex(index);
//     inputRef.current?.focus();
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const handleSaveRoster = () => {
//     if (!employees.length) return toast.success("Add at least one employee");
//     setShowSaveModal(true);
//   };

//   const executeSaveRoster = async () => {
//     try {
//       const today = new Date();
//       const startDate = new Date(today);
//       const endDate = new Date(today);
//       endDate.setDate(endDate.getDate() + 6);

//       const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       const pastDaysOfYear = Math.floor((today - firstDayOfMonth) / (24 * 60 * 60 * 1000));
//       const weekNumber = Math.ceil((firstDayOfMonth.getDay() + pastDaysOfYear) / 7);

//       await dispatch(
//         addRosterWeek({
//           data: {
//             month: today.getMonth() + 1,
//             year: today.getFullYear(),
//             weekNumber: weekNumber || 1,
//             startDate: startDate.toISOString().slice(0, 10),
//             endDate: endDate.toISOString().slice(0, 10),
//             employees: employees.map((emp) => {
//               const employeeData = {
//                 name: emp.name,
//                 transport: emp.transport || "",
//                 cabRoute: emp.cabRoute || "",
//                 isCoreTeam: emp.isCoreTeam || false,
//                 dailyStatus: emp.dailyStatus.map((status, index) => {
//                   const date = new Date(startDate);
//                   date.setDate(date.getDate() + index);
//                   return {
//                     date: date.toISOString(),
//                     status: status || "P",
//                   };
//                 }),
//               };

//               if (!emp.isCoreTeam) {
//                 employeeData.shift = emp.shift;
//                 employeeData.shiftStartHour = parseInt(emp.shiftStartHour) || 0;
//                 employeeData.shiftEndHour = parseInt(emp.shiftEndHour) || 0;
//               }

//               return employeeData;
//             }),
//             action: saveAction, 
//           },
//         })
//       ).unwrap();

//       setGenerated(true);
//       setShowSaveModal(false);

//       const message = saveAction === "create"
//         ? "Roster created successfully!"
//         : "Employees added to existing roster successfully!";
//       toast.success(message);

//       if (saveAction === "create") {
//         setEmployees([]);
//       }

//       await dispatch(fetchAllRosters({})).unwrap();

//     } catch (err) {
//       toast.error(err.message || "Failed to save roster");
//     }
//   };

//   const handleExport = async () => {
//     if (!generated) return;
//     try {
//       const today = new Date();
//       await dispatch(
//         exportRosterExcel({
//           month: today.getMonth() + 1,
//           year: today.getFullYear(),
//         })
//       ).unwrap();
//     } catch (err) {
//       toast.error("Failed to export roster");
//     }
//   };

//   const handleRemoveEmployee = (index) => {
//     const newEmployees = [...employees];
//     newEmployees.splice(index, 1);
//     setEmployees(newEmployees);
//   };

//   const scrollToTop = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const getWeeklySummary = (rosterEmployees = []) => {
//     const summary = {
//       totalEmployees: rosterEmployees.length,
//       totalWeekOffs: 0,
//       totalLeaves: 0,
//       totalPresents: 0,
//       dayWiseSummary: daysOfWeek.map(() => ({
//         presents: 0,
//         weekOffs: 0,
//         leaves: 0,
//       })),
//     };

//     rosterEmployees.forEach((emp) => {
//       const dailyStatus = emp.dailyStatus || [];
//       dailyStatus.forEach((ds, dayIndex) => {
//         const status = typeof ds === "object" ? ds.status : ds;
//         if (status === "P") {
//           summary.totalPresents++;
//           summary.dayWiseSummary[dayIndex].presents++;
//         } else if (status === "WO") {
//           summary.totalWeekOffs++;
//           summary.dayWiseSummary[dayIndex].weekOffs++;
//         } else if (status === "L") {
//           summary.totalLeaves++;
//           summary.dayWiseSummary[dayIndex].leaves++;
//         }
//       });
//     });

//     return summary;
//   };

//   const weeklySummary = getWeeklySummary(employees);

//   const getEmployeesForDay = (rosterEmployees, dayIndex, status) => {
//     return rosterEmployees
//       .filter((emp) => {
//         const dailyStatus = emp.dailyStatus || [];
//         const dayStatus = typeof dailyStatus[dayIndex] === "object" ? dailyStatus[dayIndex]?.status : dailyStatus[dayIndex];
//         return dayStatus === status;
//       })
//       .map((emp) => emp.name);
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "P":
//         return "✅";
//       case "WO":
//         return "🗓️";
//       case "L":
//         return "❌";
//       case "H":
//         return "🎉";
//       default:
//         return "📝";
//     }
//   };

//   const calculateEmployeeSummary = (dailyStatus) => {
//     if (!dailyStatus || !Array.isArray(dailyStatus)) {
//       return { presents: 0, weekOffs: 0, leaves: 0, holidays: 0 };
//     }

//     const presents = dailyStatus.filter((ds) => {
//       const status = typeof ds === "object" ? ds.status : ds;
//       return status === "P";
//     }).length;

//     const weekOffs = dailyStatus.filter((ds) => {
//       const status = typeof ds === "object" ? ds.status : ds;
//       return status === "WO";
//     }).length;

//     const leaves = dailyStatus.filter((ds) => {
//       const status = typeof ds === "object" ? ds.status : ds;
//       return status === "L";
//     }).length;

//     const holidays = dailyStatus.filter((ds) => {
//       const status = typeof ds === "object" ? ds.status : ds;
//       return status === "H";
//     }).length;

//     return { presents, weekOffs, leaves, holidays };
//   };

//   const formatShiftHours = (startHour, endHour) => {
//     if (startHour === undefined || endHour === undefined) return "N/A";
//     return `${startHour}:00 - ${endHour}:00`;
//   };

//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const getLatestRosterWeek = () => {
//     if (!allRosters || allRosters.length === 0) return null;
//     const latestRoster = allRosters[0];
//     if (!latestRoster.weeks || latestRoster.weeks.length === 0) return null;
//     return latestRoster.weeks[0];
//   };

//   const handleEditSaved = (emp, rosterWeek) => {
//     const startDate = rosterWeek?.startDate ? new Date(rosterWeek.startDate) : new Date();
//     const ds = (emp.dailyStatus || []).slice(0, 7).map((d, i) => {
//       if (typeof d === "object") return d.status || "P";
//       return d || "P";
//     });
//     while (ds.length < 7) ds.push("P");
//     setEditSavedEmployee({
//       _id: emp._id,
//       name: emp.name || "",
//       transport: emp.transport || "",
//       cabRoute: emp.cabRoute || "",
//       shiftStartHour: emp.shiftStartHour ?? "",
//       shiftEndHour: emp.shiftEndHour ?? "",
//       dailyStatus: ds,
//       startDate: startDate.toISOString().slice(0, 10),
//       weekNumber: rosterWeek.weekNumber,
//     });
//     setShowEditModal(true);
//   };

//   const handleEditSavedChange = (e, dayIndex) => {
//     const { name, value } = e.target;
//     if (name && name.startsWith("day")) {
//       const newDaily = [...editSavedEmployee.dailyStatus];
//       newDaily[dayIndex] = value;
//       setEditSavedEmployee({ ...editSavedEmployee, dailyStatus: newDaily });
//     } else {
//       setEditSavedEmployee({ ...editSavedEmployee, [name]: value });
//     }
//   };

//   const handleSaveEditedSaved = async () => {
//     try {
//       if (!editSavedEmployee) return;
//       const rosterObj = selectedWeek ? { month: allRosters[0].month, year: allRosters[0].year } : allRosters && allRosters[0] ? { month: allRosters[0].month, year: allRosters[0].year } : null;
//       if (!rosterObj) return toast.error("Roster context missing");
//       const { month, year } = rosterObj;
//       const startDate = new Date(editSavedEmployee.startDate);
//       const dailyStatusObjects = editSavedEmployee.dailyStatus.map((status, idx) => {
//         const date = new Date(startDate);
//         date.setDate(date.getDate() + idx);
//         return { date: date.toISOString(), status: status || "P" };
//       });

//       const updates = {
//         name: editSavedEmployee.name,
//         transport: editSavedEmployee.transport,
//         cabRoute: editSavedEmployee.cabRoute,
//         shiftStartHour: editSavedEmployee.shiftStartHour === "" ? undefined : parseInt(editSavedEmployee.shiftStartHour),
//         shiftEndHour: editSavedEmployee.shiftEndHour === "" ? undefined : parseInt(editSavedEmployee.shiftEndHour),
//         dailyStatus: dailyStatusObjects,
//       };

//       await dispatch(
//         updateRosterEmployee({
//           month,
//           year,
//           weekNumber: editSavedEmployee.weekNumber,
//           employeeId: editSavedEmployee._id,
//           updates,
//         })
//       ).unwrap();

//       await dispatch(fetchAllRosters({})).unwrap();
//       setShowEditModal(false);
//       setEditSavedEmployee(null);
//       toast.success("Employee updated successfully");
//     } catch (err) {
//       toast.error(err || "Only HR and Super Admin can edit current week roster");
//     }
//   };

//   const handleRemoveSaved = async (empId, weekNum) => {
//     toast.success("Remove from saved roster is not implemented here");
//   };

//   const renderSavedRosterTable = () => {
//     if (rosterDetailLoading) {
//       return (
//         <div className="flex justify-center items-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//           <span className="ml-3 text-gray-600">Loading saved roster...</span>
//         </div>
//       );
//     }

//     if (!allRosters || allRosters.length === 0) {
//       return (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
//           <p className="text-yellow-700">No saved roster data found.</p>
//         </div>
//       );
//     }

//     const rosterWeek = selectedWeek || getLatestRosterWeek();

//     if (!rosterWeek || !rosterWeek.employees || rosterWeek.employees.length === 0) {
//       return (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
//           <p className="text-yellow-700">No employee data found in saved roster.</p>
//         </div>
//       );
//     }

//     const weeklySummaryLocal = getWeeklySummary(rosterWeek.employees);

//     return (
//       <div className="mt-6">
//         <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="text-lg font-semibold text-green-800">Saved Roster</h3>
//               <p className="text-gray-600">
//                 Week {rosterWeek.weekNumber} • {formatDate(rosterWeek.startDate)} to {formatDate(rosterWeek.endDate)}
//               </p>
//             </div>
//             <button onClick={() => setShowSavedRoster(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">✕ Close</button>
//           </div>

//           <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-white p-3 rounded-lg shadow-sm">
//               <div className="text-xl font-bold text-gray-800">{weeklySummaryLocal.totalEmployees}</div>
//               <div className="text-sm text-gray-600">Total Employees</div>
//             </div>
//             <div className="bg-white p-3 rounded-lg shadow-sm">
//               <div className="text-xl font-bold text-green-600">{weeklySummaryLocal.totalPresents}</div>
//               <div className="text-sm text-gray-600">Total Presents</div>
//             </div>
//             <div className="bg-white p-3 rounded-lg shadow-sm">
//               <div className="text-xl font-bold text-blue-600">{weeklySummaryLocal.totalWeekOffs}</div>
//               <div className="text-sm text-gray-600">Total Week Offs</div>
//             </div>
//             <div className="bg-white p-3 rounded-lg shadow-sm">
//               <div className="text-xl font-bold text-red-600">{weeklySummaryLocal.totalLeaves}</div>
//               <div className="text-sm text-gray-600">Total Leaves</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border shadow-sm">
//           <div className="p-4 border-b">
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-gray-800">Saved Employee Roster ({rosterWeek.employees.length})</h3>
//             </div>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50">
//                   <th className="border p-3 text-left font-semibold text-gray-800">Name</th>
//                   <th className="border p-3 text-left font-semibold text-gray-800">Transport</th>
//                   <th className="border p-3 text-left font-semibold text-gray-800">CAB Route</th>
//                   <th className="border p-3 text-left font-semibold text-gray-800">Shift Hours</th>
//                   <th className="border p-3 text-left font-semibold text-gray-800">Weekly Status</th>
//                   <th className="border p-3 text-left font-semibold text-gray-800">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rosterWeek.employees.map((emp, index) => {
//                   const empSummary = calculateEmployeeSummary(emp.dailyStatus);
//                   return (
//                     <tr key={emp._id || index} className="border-b hover:bg-gray-50">
//                       <td className="border p-3 text-gray-800 font-medium">{emp.name}</td>
//                       <td className="border p-3 text-gray-800">{emp.transport || "-"}</td>
//                       <td className="border p-3 text-gray-800">{emp.cabRoute || "-"}</td>
                     
//                       <td className="border p-3 text-gray-800">
//                         {emp.isCoreTeam ? "N/A" : formatShiftHours(emp.shiftStartHour, emp.shiftEndHour)}
//                       </td>
//                       <td className="border p-3">
//                         <div className="mb-2">
//                           <div className="flex space-x-2 mb-1">
//                             <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
//                             <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
//                             <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>
//                             {empSummary.holidays > 0 && <span className="text-xs text-purple-600">🎉 {empSummary.holidays}H</span>}
//                           </div>
//                           <div className="flex space-x-1">
//                             {emp.dailyStatus && emp.dailyStatus.map((ds, dayIndex) => {
//                               const status = typeof ds === "object" ? ds.status : ds;
//                               return (
//                                 <div
//                                   key={dayIndex}
//                                   className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" :
//                                     status === "WO" ? "bg-blue-100 border-blue-300" :
//                                       status === "L" ? "bg-red-100 border-red-300" :
//                                         status === "H" ? "bg-purple-100 border-purple-300" :
//                                           "bg-gray-100 border-gray-300"
//                                     }`}
//                                   title={`${daysOfWeek[dayIndex % 7]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : "Holiday"}`}
//                                 >
//                                   <span className="text-base">{getStatusIcon(status)}</span>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="border p-3">
//                         <div className="flex space-x-2">
//                           <button onClick={() => handleEditSaved(emp, rosterWeek)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm cursor-pointer">Edit</button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {allRosters[0]?.weeks && allRosters[0].weeks.length > 1 && (
//           <div className="mt-4 flex flex-wrap gap-2">
//             <span className="text-gray-600 self-center">Select Week:</span>
//             {allRosters[0].weeks.map((week, index) => (
//               <button key={index} onClick={() => setSelectedWeek(week)} className={`px-3 py-1 rounded text-sm ${selectedWeek?.weekNumber === week.weekNumber ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
//                 Week {week.weekNumber}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <>
//       <AdminNavbar />
//       <div className="fixed inset-0 bg-white flex flex-col mt-10">
//         <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
//           <div className="p-4 md:p-6 flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-800">Roster Management</h1>
//               <p className="text-gray-600 mt-1">Manage weekly roster with day-wise status tracking</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={handleExportSavedRoster}
//                 disabled={savedExportLoading}
//                 className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer"
//               >
//                 {savedExportLoading ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Exporting...
//                   </>
//                 ) : (
//                   <>
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                     Export Roster
//                   </>
//                 )}
//               </button>
//               <button onClick={handleViewSavedRoster} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer">
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
//                 </svg>
//                 View Saved Roster
//               </button>
//             </div>
//           </div>
//         </div>
//         <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
//           <div className="p-4 md:p-6" ref={formRef}>
//             {showSavedRoster && renderSavedRosterTable()}
//             {!showSavedRoster && employees.length > 0 && (
//               <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
//                 <h2 className="text-lg font-semibold text-blue-800 mb-3">📊 Weekly Summary</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-gray-800">{weeklySummary.totalEmployees}</div>
//                     <div className="text-sm text-gray-600">Total Employees</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-green-600">{weeklySummary.totalPresents}</div>
//                     <div className="text-sm text-gray-600">Total Presents</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalWeekOffs}</div>
//                     <div className="text-sm text-gray-600">Total Week Offs</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-red-600">{weeklySummary.totalLeaves}</div>
//                     <div className="text-sm text-gray-600">Total Leaves</div>
//                   </div>
//                 </div>
//                 <div className="mt-4">
//                   <h3 className="font-medium text-blue-700 mb-2">Day-wise Status Overview</h3>
//                   <div className="grid grid-cols-7 gap-2">
//                     {daysOfWeek.map((day, dayIndex) => {
//                       const daySummary = weeklySummary.dayWiseSummary[dayIndex];
//                       return (
//                         <div key={dayIndex} className={`bg-white rounded-lg p-3 text-center cursor-pointer border transition-all hover:shadow-md ${selectedDayOverview === dayIndex ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedDayOverview(selectedDayOverview === dayIndex ? null : dayIndex)}>
//                           <div className="font-semibold text-gray-800">{day}</div>
//                           <div className="mt-2 space-y-1">
//                             <div className="flex items-center justify-center"><span className="text-green-600 text-sm">✅ {daySummary.presents}</span></div>
//                             <div className="flex items-center justify-center"><span className="text-blue-600 text-sm">🗓️ {daySummary.weekOffs}</span></div>
//                             <div className="flex items-center justify-center"><span className="text-red-600 text-sm">❌ {daySummary.leaves}</span></div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//                 {selectedDayOverview !== null && (
//                   <div className="mt-4 bg-white rounded-lg p-4 border shadow-sm">
//                     <div className="flex justify-between items-center mb-3">
//                       <h4 className="font-semibold text-gray-800">{daysOfWeek[selectedDayOverview]} - Employee Details</h4>
//                       <button onClick={() => setSelectedDayOverview(null)} className="text-gray-500 hover:text-gray-700">✕</button>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-green-600 mb-2 flex items-center">✅ Present ({getEmployeesForDay(employees, selectedDayOverview, "P").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "P").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "P").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>
//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-blue-600 mb-2 flex items-center">🗓️ Week Off ({getEmployeesForDay(employees, selectedDayOverview, "WO").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "WO").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "WO").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>

//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-red-600 mb-2 flex items-center">❌ Leave ({getEmployeesForDay(employees, selectedDayOverview, "L").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "L").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "L").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {!showSavedRoster && (
//               <>
//                 <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
//                   <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Employee</h2>

//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <input ref={inputRef} type="text" name="name" value={employeeInput.name} onChange={handleInputChange} placeholder="Name *" className="border p-3 rounded text-gray-800 placeholder-gray-500" required />
//                     <select name="transport" value={employeeInput.transport} onChange={handleInputChange} className="border p-3 rounded text-gray-800">
//                       <option value="" className="text-gray-500">Transport?</option>
//                       <option value="Yes" className="text-gray-800">Yes</option>
//                       <option value="No" className="text-gray-800">No</option>
//                     </select>
//                     <input type="text" name="cabRoute" value={employeeInput.cabRoute} onChange={handleInputChange} placeholder="CAB Route" className="border p-3 rounded text-gray-800 placeholder-gray-500" />
//                     {!employeeInput.isCoreTeam && (
//                       <>
//                         <div className="grid grid-cols-2 gap-3">
//                           <input type="number" name="shiftStartHour" value={employeeInput.shiftStartHour} onChange={handleInputChange} placeholder="Start Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                           <input type="number" name="shiftEndHour" value={employeeInput.shiftEndHour} onChange={handleInputChange} placeholder="End Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                         </div>
//                           <div className="grid grid-cols-2 gap-3">
//                           <input type="date" name="Start Date" value={employeeInput.shiftStartDay} onChange={handleInputChange} placeholder="Start Date (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                           <input type="date" name="End Date" value={employeeInput.shiftEndDay} onChange={handleInputChange} placeholder="End Date (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                         </div>

//                       </>
//                     )}
//                     <button type="button" onClick={handleAddEmployee} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded font-medium cursor-pointer">{editIndex !== null ? "Update Employee" : "Add Employee"}</button>
//                   </div>
//                   <div className="mt-6">
//                     <h3 className="font-semibold mb-3 text-gray-800">Daily Status for <span className="text-blue-600">{employeeInput.name || "Selected Employee"}</span></h3>
//                     <div className="grid grid-cols-7 gap-2">
//                       {daysOfWeek.map((day, i) => (
//                         <div key={i} className="flex flex-col items-center">
//                           <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//                           <select name={`day${i}`} value={employeeInput.dailyStatus[i]} onChange={(e) => handleInputChange(e, i)} className={`border p-2 rounded w-full text-center text-gray-800 ${employeeInput.dailyStatus[i] === "P" ? "border-green-300" : employeeInput.dailyStatus[i] === "WO" ? "border-blue-300" : employeeInput.dailyStatus[i] === "L" ? "border-red-300" : "border-gray-300"}`}>
//                             <option value="P" className="text-green-600">Present (P)</option>
//                             <option value="WO" className="text-blue-600">Week Off (WO)</option>
//                             <option value="L" className="text-red-600">Leave (L)</option>
//                             <option value="H" className="text-purple-600">Holiday (H)</option>
//                           </select>
//                           <div className="mt-1 text-lg">
//                             {employeeInput.dailyStatus[i] === "P" && "✅"}
//                             {employeeInput.dailyStatus[i] === "WO" && "🗓️"}
//                             {employeeInput.dailyStatus[i] === "L" && "❌"}
//                             {employeeInput.dailyStatus[i] === "H" && "🎉"}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//                 {employees.length > 0 && (
//                   <div className="bg-white rounded-lg border shadow-sm mb-6">
//                     <div className="p-4 border-b">
//                       <div className="flex justify-between items-center">
//                         <h3 className="text-lg font-semibold text-gray-800">Employee Roster ({employees.length})</h3>
//                         <div className="text-sm text-gray-600">Click on status icons to filter</div>
//                       </div>
//                     </div>
//                     <div className="overflow-x-auto">
//                       <table className="w-full">
//                         <thead>
//                           <tr className="bg-gray-50">
//                             <th className="border p-3 text-left font-semibold text-gray-800">Name</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Transport</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">CAB Route</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Shift Hours</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Weekly Status</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {employees.map((emp, index) => {
//                             const empSummary = {
//                               presents: emp.dailyStatus.filter((s) => s === "P").length,
//                               weekOffs: emp.dailyStatus.filter((s) => s === "WO").length,
//                               leaves: emp.dailyStatus.filter((s) => s === "L").length,
//                             };

//                             return (
//                               <tr key={index} className="border-b hover:bg-gray-50">
//                                 <td className="border p-3 text-gray-800 font-medium">{emp.name}</td>
//                                 <td className="border p-3 text-gray-800">{emp.transport || "-"}</td>
//                                 <td className="border p-3 text-gray-800">{emp.cabRoute || "-"}</td>

//                                 <td className="border p-3 text-gray-800">{emp.isCoreTeam ? "N/A" : `${emp.shiftStartHour || 0}:00 - ${emp.shiftEndHour || 0}:00`}</td>
//                                 <td className="border p-3">
//                                   <div className="mb-2">
//                                     <div className="flex space-x-2 mb-1">
//                                       <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
//                                       <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
//                                       <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>

//                                     </div>
//                                     <div className="flex space-x-1">
//                                       {emp.dailyStatus.map((status, dayIndex) => (
//                                         <div key={dayIndex} className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" : status === "WO" ? "bg-blue-100 border-blue-300" : status === "L" ? "bg-red-100 border-red-300" : "bg-gray-100 border-gray-300"}`} title={`${daysOfWeek[dayIndex]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : "Leave"}`}>
//                                           <span className="text-base">{getStatusIcon(status)}</span>
//                                         </div>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 </td>
//                                 <td className="border p-3">
//                                   <div className="flex space-x-2">
//                                     <button onClick={() => handleEdit(index)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Edit</button>
//                                     <button onClick={() => handleRemoveEmployee(index)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Remove</button>
//                                   </div>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}

//                 <div className="sticky bottom-0 bg-white border-t py-4 mt-6">
//                   <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
//                     <div>
//                       {employees.length > 0 && (
//                         <div className="flex items-center space-x-4">
//                           <p className="text-gray-600">Total: <span className="font-semibold text-gray-800">{employees.length}</span> employee(s)</p>
//                           <div className="flex space-x-2 text-sm"><span className="text-green-600">✅ {weeklySummary.totalPresents} Presents</span><span className="text-blue-600">🗓️ {weeklySummary.totalWeekOffs} Week Offs</span><span className="text-red-600">❌ {weeklySummary.totalLeaves} Leaves</span></div>
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex space-x-3">
//                       <button onClick={handleSaveRoster} disabled={loading || employees.length === 0} className={`px-6 py-3 rounded font-medium ${loading || employees.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"}`}>
//                         {loading ? (
//                           <span className="flex items-center">
//                             <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                             </svg>
//                             Saving...
//                           </span>
//                         ) : "Save Roster"}
//                       </button>
//                       <button onClick={handleExport} disabled={!generated || loading} className={`px-6 py-3 rounded font-medium ${!generated || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}>Export Excel</button>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}

//           </div>
//         </div>

//         {showScrollTop && (
//           <button onClick={scrollToTop} className="fixed right-6 bottom-6 bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg z-50" aria-label="Scroll to top">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
//           </button>
//         )}
//       </div>

//       {showSaveModal && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Save Roster</h2>
//               <button
//                 onClick={() => {
//                   setShowSaveModal(false);
//                   setSaveAction("create");
//                 }}
//                 className="text-gray-600 hover:text-gray-900"
//                 disabled={loading}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <h3 className="font-medium text-blue-800 mb-3">Choose Save Option</h3>
//                 <div className="space-y-3">
//                   <label className="flex items-start cursor-pointer">
//                     <input
//                       type="radio"
//                       name="saveAction"
//                       value="create"
//                       checked={saveAction === "create"}
//                       onChange={(e) => setSaveAction(e.target.value)}
//                       className="mt-1 mr-3"
//                     />
//                     <div>
//                       <div className="font-medium">Create New / Replace Roster</div>
//                       <div className="text-sm text-gray-600 mt-1">
//                         This will create a new roster or replace an existing one with the same week number.
//                         <br />
//                         <span className="font-medium">Warning: This will overwrite any existing data.</span>
//                       </div>
//                     </div>
//                   </label>

//                   <label className="flex items-start cursor-pointer">
//                     <input
//                       type="radio"
//                       name="saveAction"
//                       value="add"
//                       checked={saveAction === "add"}
//                       onChange={(e) => setSaveAction(e.target.value)}
//                       className="mt-1 mr-3"
//                     />
//                     <div>
//                       <div className="font-medium">Add to Existing Roster</div>
//                       <div className="text-sm text-gray-600 mt-1">
//                         This will add new employees to an existing roster without removing current ones.
//                         <br />
//                         <span className="font-medium">Note: Duplicate employees will be skipped.</span>
//                       </div>
//                     </div>
//                   </label>
//                 </div>
//               </div>

//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//                 <p className="text-sm text-gray-700">
//                   <strong>Summary:</strong>
//                 </p>
//                 <ul className="text-sm text-gray-600 mt-1 space-y-1">
//                   <li>• Employees to save: {employees.length}</li>
//                   <li>• Month/Year: {new Date().getMonth() + 1}/{new Date().getFullYear()}</li>
//                   <li>• Current week: Week {Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)}</li>
//                 </ul>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => {
//                   setShowSaveModal(false);
//                   setSaveAction("create");
//                 }}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={executeSaveRoster}
//                 disabled={loading}
//                 className={`px-4 py-2 rounded font-medium ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//               >
//                 {loading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Saving...
//                   </span>
//                 ) : (
//                   `Confirm ${saveAction === "create" ? "Create" : "Add"}`
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showExportModal && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Export Saved Roster</h2>
//               <button
//                 onClick={() => setShowExportModal(false)}
//                 className="text-gray-600 hover:text-gray-900"
//                 disabled={savedExportLoading}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Month
//                 </label>
//                 <select
//                   value={exportMonth}
//                   onChange={(e) => setExportMonth(parseInt(e.target.value))}
//                   className="w-full border p-3 rounded text-gray-800"
//                   disabled={savedExportLoading}
//                 >
//                   <option value="1">January</option>
//                   <option value="2">February</option>
//                   <option value="3">March</option>
//                   <option value="4">April</option>
//                   <option value="5">May</option>
//                   <option value="6">June</option>
//                   <option value="7">July</option>
//                   <option value="8">August</option>
//                   <option value="9">September</option>
//                   <option value="10">October</option>
//                   <option value="11">November</option>
//                   <option value="12">December</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Year
//                 </label>
//                 <input
//                   type="number"
//                   value={exportYear}
//                   onChange={(e) => setExportYear(parseInt(e.target.value))}
//                   className="w-full border p-3 rounded text-gray-800"
//                   min="2000"
//                   max="2100"
//                   disabled={savedExportLoading}
//                 />
//               </div>

//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//                 <p className="text-sm text-blue-800">
//                   This will export the saved roster from the database for the selected month and year.
//                   The Excel file will include all weeks with the same formatting as the roster.
//                 </p>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => setShowExportModal(false)}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//                 disabled={savedExportLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={executeExportSavedRoster}
//                 disabled={savedExportLoading}
//                 className={`px-4 py-2 rounded font-medium ${savedExportLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//               >
//                 {savedExportLoading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Exporting...
//                   </span>
//                 ) : (
//                   'Export to Excel'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showEditModal && editSavedEmployee && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
//               <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="text-gray-600 hover:text-gray-900">✕</button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input type="text" name="name" value={editSavedEmployee.name} onChange={handleEditSavedChange} placeholder="Name" className="border p-3 rounded text-gray-800" />
//               <select name="transport" value={editSavedEmployee.transport} onChange={handleEditSavedChange} className="border p-3 rounded text-gray-800">
//                 <option value="">Transport?</option>
//                 <option value="Yes">Yes</option>
//                 <option value="No">No</option>
//               </select>
//               <input type="text" name="cabRoute" value={editSavedEmployee.cabRoute} onChange={handleEditSavedChange} placeholder="CAB Route" className="border p-3 rounded text-gray-800" />
//               <input type="number" name="shiftStartHour" value={editSavedEmployee.shiftStartHour} onChange={handleEditSavedChange} placeholder="Start Hour (0-23)" min="0" max="23" className="border p-3 rounded text-gray-800" />
//               <input type="number" name="shiftEndHour" value={editSavedEmployee.shiftEndHour} onChange={handleEditSavedChange} placeholder="End Hour (0-23)" min="0" max="23" className="border p-3 rounded text-gray-800" />
//             </div>

//             <div className="mt-6">
//               <h3 className="font-semibold mb-3 text-gray-800">Daily Status</h3>
//               <div className="grid grid-cols-7 gap-2">
//                 {daysOfWeek.map((day, i) => (
//                   <div key={i} className="flex flex-col items-center">
//                     <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//                     <select name={`day${i}`} value={editSavedEmployee.dailyStatus[i]} onChange={(e) => handleEditSavedChange(e, i)} className="border p-2 rounded w-full text-center text-gray-800">
//                       <option value="P">Present (P)</option>
//                       <option value="WO">Week Off (WO)</option>
//                       <option value="L">Leave (L)</option>
//                       <option value="NCNS">NCNS (L)</option>
//                       <option value="UL">UL (L)</option>
//                       <option value="LWP">LWP (L)</option>
//                       <option value="BL">BL (L)</option>
//                       <option value="H">Holiday (H)</option>
//                     </select>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="px-4 py-2 rounded border">Cancel</button>
//               <button onClick={handleSaveEditedSaved} className="px-4 py-2 rounded bg-green-500 text-white">Save Changes</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default RosterForm;

const RosterForm = () => {
  const dispatch = useDispatch();
  const {
    roster,
    loading,
    error,
    allRosters,
    rosterDetailLoading,
    savedExportLoading,
    savedExportSuccess,
    deleteLoading,      // Added
    deleteSuccess,      // Added
    deleteError         // Added
  } = useSelector((state) => state.roster || {});

  const [employeeInput, setEmployeeInput] = useState({
    name: "",
    transport: "",
    cabRoute: "",
    shift: "",
    shiftStartHour: "",
    shiftEndHour: "",
    isCoreTeam: false,
    dailyStatus: Array(7).fill("P"),
  });

  const [employees, setEmployees] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedDayOverview, setSelectedDayOverview] = useState(null);
  const [showSavedRoster, setShowSavedRoster] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [showSaveModal, setShowSaveModal] = useState(false); 
  const [saveAction, setSaveAction] = useState("create"); 

  const [showEditModal, setShowEditModal] = useState(false);
  const [editSavedEmployee, setEditSavedEmployee] = useState(null);

  // ADDED: State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // ADDED: State for roster dates
  const [rosterDates, setRosterDates] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().slice(0, 10),
  });

  // Add this with your other state declarations:
const [showCopyPopup, setShowCopyPopup] = useState(false);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const formRef = useRef(null);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop } = scrollContainerRef.current;
        setShowScrollTop(scrollTop > 100);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (deleteSuccess || deleteError) {
        // dispatch(clearDeleteState());
      }
    };
  }, [dispatch, deleteSuccess, deleteError]);

  useEffect(() => {
    if (deleteSuccess) {
      toast.success("Employee deleted successfully");
    }
    if (deleteError) {
      toast.error(deleteError);
    }
  }, [deleteSuccess, deleteError]);

  const handleExportSavedRoster = async () => {
    try {
      if (allRosters && allRosters.length > 0) {
        setExportMonth(allRosters[0].month || new Date().getMonth() + 1);
        setExportYear(allRosters[0].year || new Date().getFullYear());
      }
      setShowExportModal(true);
    } catch (err) {
      toast.success("Failed to prepare export");
    }
  };

  const executeExportSavedRoster = async () => {
    try {
      if (!exportMonth || !exportYear) {
        toast.success("Please select month and year");
        return;
      }

      await dispatch(
        exportSavedRoster({
          month: exportMonth,
          year: exportYear,
        })
      ).unwrap();

      toast.success("Saved roster exported successfully!");
      setShowExportModal(false);
    } catch (err) {
      toast.success(err.message || "Failed to export saved roster");
    }
  };

  const handleViewSavedRoster = async () => {
    try {
      await dispatch(fetchAllRosters({})).unwrap();
      setShowSavedRoster(true);
      setSelectedWeek(null);
    } catch (err) {
      toast.error("Failed to load saved roster data");
    }
  };

  const handleInputChange = (e, dayIndex) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("day")) {
      const newDaily = [...employeeInput.dailyStatus];
      newDaily[dayIndex] = value;
      setEmployeeInput({ ...employeeInput, dailyStatus: newDaily });
    } else {
      setEmployeeInput({
        ...employeeInput,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // ADDED: Handle roster dates change
  const handleRosterDateChange = (e) => {
    const { name, value } = e.target;
    setRosterDates({
      ...rosterDates,
      [name]: value
    });
  };

  const handleAddEmployee = () => {
    if (!employeeInput.name) return toast.success("Enter employee name");

    if (!employeeInput.isCoreTeam) {
      if (!employeeInput.shiftStartHour) return toast.info("Enter shift start hour");
      if (!employeeInput.shiftEndHour) return toast.info("Enter shift end hour");

      const startHour = parseInt(employeeInput.shiftStartHour);
      const endHour = parseInt(employeeInput.shiftEndHour);

      if (isNaN(startHour) || isNaN(endHour)) {
        return toast.info("Shift hours must be numbers");
      }
    }

    const newEmployees = [...employees];
    if (editIndex !== null) {
      newEmployees[editIndex] = employeeInput;
      setEditIndex(null);
    } else {
      newEmployees.push(employeeInput);
    }
    setEmployees(newEmployees);
    setEmployeeInput({
      name: "",
      transport: "",
      cabRoute: "",
      shift: "",
      shiftStartHour: "",
      shiftEndHour: "",
      isCoreTeam: false,
      dailyStatus: Array(7).fill("P"),
    });
    inputRef.current?.focus();
  };

  const handleEdit = (index) => {
    setEmployeeInput(employees[index]);
    setEditIndex(index);
    inputRef.current?.focus();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveRoster = () => {
    if (!employees.length) return toast.success("Add at least one employee");
    setShowSaveModal(true);
  };

  // UPDATED: executeSaveRoster function with rosterStartDate and rosterEndDate
 const executeSaveRoster = async () => {
  try {
    // Validate roster dates
    if (!rosterDates.startDate || !rosterDates.endDate) {
      toast.error("Please select both start and end dates for the roster");
      return;
    }

    const startDate = new Date(rosterDates.startDate);
    const endDate = new Date(rosterDates.endDate);
    
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    // Calculate week number based on roster dates
    const rosterMonth = startDate.getMonth() + 1;
    const rosterYear = startDate.getFullYear();
    
    // Calculate week number from start date
    const firstDayOfMonth = new Date(rosterYear, rosterMonth - 1, 1);
    const pastDaysOfYear = Math.floor((startDate - firstDayOfMonth) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.max(1, Math.ceil((firstDayOfMonth.getDay() + pastDaysOfYear + 1) / 7));

    // Prepare the data object correctly
    const rosterData = {
      month: rosterMonth,
      year: rosterYear,
      rosterStartDate: rosterDates.startDate, // Make sure this is a valid date string
      rosterEndDate: rosterDates.endDate,     // Make sure this is a valid date string
      weekNumber: weekNumber,
      startDate: rosterDates.startDate,
      endDate: rosterDates.endDate,
      employees: employees.map((emp) => {
        const employeeData = {
          name: emp.name,
          transport: emp.transport || "",
          cabRoute: emp.cabRoute || "",
          isCoreTeam: emp.isCoreTeam || false,
          dailyStatus: emp.dailyStatus.map((status, index) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + index);
            return {
              date: date.toISOString(),
              status: status || "P",
            };
          }),
        };

        if (!emp.isCoreTeam) {
          employeeData.shift = emp.shift;
          employeeData.shiftStartHour = parseInt(emp.shiftStartHour) || 0;
          employeeData.shiftEndHour = parseInt(emp.shiftEndHour) || 0;
        }

        return employeeData;
      }),
      action: saveAction, 
    };

    console.log("Sending roster data:", JSON.stringify(rosterData, null, 2));

    await dispatch(
      addRosterWeek({
        data: rosterData, // Send the properly structured data
      })
    ).unwrap();

    setGenerated(true);
    setShowSaveModal(false);

    const message = saveAction === "create"
      ? "Roster created successfully!"
      : "Employees added to existing roster successfully!";
    toast.success(message);

    if (saveAction === "create") {
      setEmployees([]);
    }

    await dispatch(fetchAllRosters({})).unwrap();

  } catch (err) {
    console.error("Save roster error:", err);
    toast.error(err.message || "Failed to save roster");
  }
};

  const handleExport = async () => {
    if (!generated) return;
    try {
      const today = new Date();
      await dispatch(
        exportRosterExcel({
          month: today.getMonth() + 1,
          year: today.getFullYear(),
        })
      ).unwrap();
    } catch (err) {
      toast.error("Failed to export roster");
    }
  };

  const handleRemoveEmployee = (index) => {
    const newEmployees = [...employees];
    newEmployees.splice(index, 1);
    setEmployees(newEmployees);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getWeeklySummary = (rosterEmployees = []) => {
    const summary = {
      totalEmployees: rosterEmployees.length,
      totalWeekOffs: 0,
      totalLeaves: 0,
      totalPresents: 0,
      dayWiseSummary: daysOfWeek.map(() => ({
        presents: 0,
        weekOffs: 0,
        leaves: 0,
      })),
    };

    rosterEmployees.forEach((emp) => {
      const dailyStatus = emp.dailyStatus || [];
      dailyStatus.forEach((ds, dayIndex) => {
        const status = typeof ds === "object" ? ds.status : ds;
        if (status === "P") {
          summary.totalPresents++;
          summary.dayWiseSummary[dayIndex].presents++;
        } else if (status === "WO") {
          summary.totalWeekOffs++;
          summary.dayWiseSummary[dayIndex].weekOffs++;
        } else if (status === "L") {
          summary.totalLeaves++;
          summary.dayWiseSummary[dayIndex].leaves++;
        }
      });
    });

    return summary;
  };

  const weeklySummary = getWeeklySummary(employees);

  const getEmployeesForDay = (rosterEmployees, dayIndex, status) => {
    return rosterEmployees
      .filter((emp) => {
        const dailyStatus = emp.dailyStatus || [];
        const dayStatus = typeof dailyStatus[dayIndex] === "object" ? dailyStatus[dayIndex]?.status : dailyStatus[dayIndex];
        return dayStatus === status;
      })
      .map((emp) => emp.name);
  };

 const getStatusIcon = (status) => {
  switch (status) {
    case "P":
      return "✅";
    case "WO":
      return "🗓️";
    case "L":
      return "❌";
    case "NCNS":
      return "🚫";
    case "UL":
      return "💸";
    case "LWP":
      return "💰";
    case "BL":
      return "⚫";
    case "H":
      return "🎉";
    default:
      return "📝";
  }
};

  const calculateEmployeeSummary = (dailyStatus) => {
    if (!dailyStatus || !Array.isArray(dailyStatus)) {
      return { presents: 0, weekOffs: 0, leaves: 0, holidays: 0 };
    }

    const presents = dailyStatus.filter((ds) => {
      const status = typeof ds === "object" ? ds.status : ds;
      return status === "P";
    }).length;

    const weekOffs = dailyStatus.filter((ds) => {
      const status = typeof ds === "object" ? ds.status : ds;
      return status === "WO";
    }).length;

    const leaves = dailyStatus.filter((ds) => {
      const status = typeof ds === "object" ? ds.status : ds;
      return status === "L";
    }).length;

    const holidays = dailyStatus.filter((ds) => {
      const status = typeof ds === "object" ? ds.status : ds;
      return status === "H";
    }).length;

    return { presents, weekOffs, leaves, holidays };
  };

  const formatShiftHours = (startHour, endHour) => {
    if (startHour === undefined || endHour === undefined) return "N/A";
    return `${startHour}:00 - ${endHour}:00`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getLatestRosterWeek = () => {
    if (!allRosters || allRosters.length === 0) return null;
    const latestRoster = allRosters[0];
    if (!latestRoster.weeks || latestRoster.weeks.length === 0) return null;
    return latestRoster.weeks[0];
  };

  const handleEditSaved = (emp, rosterWeek) => {
    const startDate = rosterWeek?.startDate ? new Date(rosterWeek.startDate) : new Date();
    const ds = (emp.dailyStatus || []).slice(0, 7).map((d, i) => {
      if (typeof d === "object") return d.status || "P";
      return d || "P";
    });
    while (ds.length < 7) ds.push("P");
    setEditSavedEmployee({
      _id: emp._id,
      name: emp.name || "",
      transport: emp.transport || "",
      cabRoute: emp.cabRoute || "",
      shiftStartHour: emp.shiftStartHour ?? "",
      shiftEndHour: emp.shiftEndHour ?? "",
      dailyStatus: ds,
      startDate: startDate.toISOString().slice(0, 10),
      weekNumber: rosterWeek.weekNumber,
    });
    setShowEditModal(true);
  };

  const handleEditSavedChange = (e, dayIndex) => {
    const { name, value } = e.target;
    if (name && name.startsWith("day")) {
      const newDaily = [...editSavedEmployee.dailyStatus];
      newDaily[dayIndex] = value;
      setEditSavedEmployee({ ...editSavedEmployee, dailyStatus: newDaily });
    } else {
      setEditSavedEmployee({ ...editSavedEmployee, [name]: value });
    }
  };

  const handleSaveEditedSaved = async () => {
    try {
      if (!editSavedEmployee) return;
      const rosterObj = selectedWeek ? { month: allRosters[0].month, year: allRosters[0].year } : allRosters && allRosters[0] ? { month: allRosters[0].month, year: allRosters[0].year } : null;
      if (!rosterObj) return toast.error("Roster context missing");
      const { month, year } = rosterObj;
      const startDate = new Date(editSavedEmployee.startDate);
      const dailyStatusObjects = editSavedEmployee.dailyStatus.map((status, idx) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + idx);
        return { date: date.toISOString(), status: status || "P" };
      });

      const updates = {
        name: editSavedEmployee.name,
        transport: editSavedEmployee.transport,
        cabRoute: editSavedEmployee.cabRoute,
        shiftStartHour: editSavedEmployee.shiftStartHour === "" ? undefined : parseInt(editSavedEmployee.shiftStartHour),
        shiftEndHour: editSavedEmployee.shiftEndHour === "" ? undefined : parseInt(editSavedEmployee.shiftEndHour),
        dailyStatus: dailyStatusObjects,
      };

      await dispatch(
        updateRosterEmployee({
          month,
          year,
          weekNumber: editSavedEmployee.weekNumber,
          employeeId: editSavedEmployee._id,
          updates,
        })
      ).unwrap();

      await dispatch(fetchAllRosters({})).unwrap();
      setShowEditModal(false);
      setEditSavedEmployee(null);
      toast.success("Employee updated successfully");
    } catch (err) {
<<<<<<< HEAD
      console.error(err);
=======
>>>>>>> keshav_dev
      toast.error(err || "Only HR and Super Admin can edit current week roster");
    }
  };

  // ADDED: Handle delete button click
  const handleDeleteSaved = (emp, rosterWeek) => {
    setEmployeeToDelete({
      employeeId: emp._id,
      name: emp.name,
      userId: emp.userId,
      weekNumber: rosterWeek.weekNumber,
      rosterId: allRosters[0]?._id
    });
    setShowDeleteModal(true);
  };

  // ADDED: Confirm and execute deletion
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete || !employeeToDelete.rosterId || !employeeToDelete.weekNumber) {
      toast.error("Missing delete information");
      return;
    }

    try {
      let deletePromise;
      
      if (employeeToDelete.userId) {
        // Delete by userId (CRM user)
        deletePromise = dispatch(deleteEmployeeByUserId({
          rosterId: employeeToDelete.rosterId,
          weekNumber: employeeToDelete.weekNumber,
          userId: employeeToDelete.userId
        }));
      } else {
        // Delete by employeeId (non-CRM user or fallback)
        deletePromise = dispatch(deleteEmployeeFromRoster({
          rosterId: employeeToDelete.rosterId,
          weekNumber: employeeToDelete.weekNumber,
          employeeId: employeeToDelete.employeeId
        }));
      }

      await deletePromise.unwrap();
      
      // Refresh the saved roster data
      await dispatch(fetchAllRosters({})).unwrap();
      
      // Close modal
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      
    } catch (err) {
      toast.error(err.message || "Failed to delete employee");
    }
  };

 const renderSavedRosterTable = () => {
    if (rosterDetailLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading saved roster...</span>
        </div>
      );
    }

    if (!allRosters || !Array.isArray(allRosters) || allRosters.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700">No saved roster data found.</p>
        </div>
      );
    }

    // Get the current roster (first one or use a selected one)
    const currentRoster = allRosters[0]; // Assuming we're showing the first roster
    const weeks = currentRoster?.weeks || [];
    
    // Get the latest week as default if no week is selected
    const getLatestWeekWithEmployees = () => {
      // Find the latest week with employees
      for (let i = weeks.length - 1; i >= 0; i--) {
        const week = weeks[i];
        if (week?.employees && week.employees.length > 0) {
          return week;
        }
      }
      // If no weeks have employees, return the latest week
      return weeks[weeks.length - 1] || null;
    };

    // Get the week to display
    let rosterWeek = selectedWeek;
    
    // If no week is selected or selected week doesn't exist in current roster, use latest week
    if (!rosterWeek || !weeks.find(w => w.weekNumber === rosterWeek.weekNumber)) {
      rosterWeek = getLatestWeekWithEmployees();
    }
    
    // Check if the week exists and has employees
    if (!rosterWeek) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Roster Weeks Found</h3>
          <p className="text-gray-600 mb-4">
            This roster doesn't have any weeks configured yet.
          </p>
          <button 
            onClick={() => setShowSavedRoster(false)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      );
    }

    // Check if current week has employees
    if (!rosterWeek.employees || rosterWeek.employees.length === 0) {
      // Find other weeks that have employees
      const weeksWithEmployees = weeks.filter(week => 
        week.weekNumber !== rosterWeek.weekNumber && 
        week.employees && 
        week.employees.length > 0
      );
      
      return (
        <div className="mt-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 mb-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Week {rosterWeek.weekNumber} is Empty
              </h3>
              <p className="text-gray-600 mb-4">
                No employee data found in Week {rosterWeek.weekNumber}. 
                {weeksWithEmployees.length > 0 ? ' Select another week:' : ' No other weeks have employee data.'}
              </p>
              
              {weeksWithEmployees.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    {weeksWithEmployees.map((week, index) => (
                      <button 
                        key={index} 
                        onClick={() => setSelectedWeek(week)} 
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Week {week.weekNumber} ({week.employees.length} employees)
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Or create new employees for this week
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => setShowSavedRoster(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          
          {/* Show week selector even when current week is empty */}
          {weeks.length > 1 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">All Weeks in Roster:</h4>
              <div className="flex flex-wrap gap-2">
                {weeks.map((week, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedWeek(week)} 
                    className={`px-3 py-1 rounded text-sm ${
                      rosterWeek.weekNumber === week.weekNumber 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-gray-300' : ''}`}
                    title={`Week ${week.weekNumber}: ${week.employees?.length || 0} employees`}
                  >
                    Week {week.weekNumber} ({week.employees?.length || 0})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    const weeklySummaryLocal = getWeeklySummary(rosterWeek.employees);

    return (
      <div className="mt-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Saved Roster</h3>
              <p className="text-gray-600">
                Week {rosterWeek.weekNumber} • {formatDate(rosterWeek.startDate)} to {formatDate(rosterWeek.endDate)}
              </p>
            </div>
            <button onClick={() => setShowSavedRoster(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">✕ Close</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xl font-bold text-gray-800">{weeklySummaryLocal.totalEmployees}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xl font-bold text-green-600">{weeklySummaryLocal.totalPresents}</div>
              <div className="text-sm text-gray-600">Total Presents</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xl font-bold text-blue-600">{weeklySummaryLocal.totalWeekOffs}</div>
              <div className="text-sm text-gray-600">Total Week Offs</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xl font-bold text-red-600">{weeklySummaryLocal.totalLeaves}</div>
              <div className="text-sm text-gray-600">Total Leaves</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Week {rosterWeek.weekNumber} Employee Roster ({rosterWeek.employees.length})
              </h3>
              {weeks.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Switch Week:</span>
                  <select 
                    value={rosterWeek.weekNumber} 
                    onChange={(e) => {
                      const weekNumber = parseInt(e.target.value);
                      const week = weeks.find(w => w.weekNumber === weekNumber);
                      if (week) setSelectedWeek(week);
                    }}
                    className="border rounded px-3 py-1 text-sm bg-white"
                  >
                    {weeks.map((week, index) => (
                      <option key={index} value={week.weekNumber}>
                        Week {week.weekNumber} ({week.employees?.length || 0} employees)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left font-semibold text-gray-800">Name</th>
                  <th className="border p-3 text-left font-semibold text-gray-800">Transport</th>
                  <th className="border p-3 text-left font-semibold text-gray-800">CAB Route</th>
                  <th className="border p-3 text-left font-semibold text-gray-800">Shift Hours</th>
                  <th className="border p-3 text-left font-semibold text-gray-800">Weekly Status</th>
                  <th className="border p-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosterWeek.employees.map((emp, index) => {
                  const empSummary = calculateEmployeeSummary(emp.dailyStatus);
                  return (
                    <tr key={emp._id || index} className="border-b hover:bg-gray-50">
                      <td className="border p-3 text-gray-800 font-medium">{emp.name}</td>
                      <td className="border p-3 text-gray-800">{emp.transport || "-"}</td>
                      <td className="border p-3 text-gray-800">{emp.cabRoute || "-"}</td>
                     
                      <td className="border p-3 text-gray-800">
                        {emp.isCoreTeam ? "N/A" : formatShiftHours(emp.shiftStartHour, emp.shiftEndHour)}
                      </td>
                      <td className="border p-3">
                        <div className="mb-2">
                          <div className="flex space-x-2 mb-1">
                            <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
                            <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
                            <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>
                            {empSummary.holidays > 0 && <span className="text-xs text-purple-600">🎉 {empSummary.holidays}H</span>}
                          </div>
                          <div className="flex space-x-1">
                            {emp.dailyStatus && emp.dailyStatus.map((ds, dayIndex) => {
                              const status = typeof ds === "object" ? ds.status : ds;
                              return (
                                <div
                                  key={dayIndex}
                                  className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" :
                                    status === "WO" ? "bg-blue-100 border-blue-300" :
                                      status === "L" ? "bg-red-100 border-red-300" :
                                        status === "H" ? "bg-purple-100 border-purple-300" :
                                          "bg-gray-100 border-gray-300"
                                    }`}
                                  title={`${daysOfWeek[dayIndex % 7]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : "Holiday"}`}
                                >
                                  <span className="text-base">{getStatusIcon(status)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="border p-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditSaved(emp, rosterWeek)} 
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteSaved(emp, rosterWeek)} 
                            disabled={deleteLoading && employeeToDelete?.employeeId === emp._id}
                            className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm cursor-pointer ${
                              deleteLoading && employeeToDelete?.employeeId === emp._id 
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                          >
                            {deleteLoading && employeeToDelete?.employeeId === emp._id 
                              ? 'Deleting...' 
                              : 'Delete'
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom week selector */}
        {weeks.length > 1 && (
          <div className="mt-4 bg-white rounded-lg border p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Week Navigation:</h4>
            <div className="flex flex-wrap gap-2">
              {weeks.map((week, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedWeek(week)} 
                  className={`px-3 py-1 rounded text-sm ${
                    rosterWeek.weekNumber === week.weekNumber 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-gray-300 opacity-75' : ''}`}
                  title={`Week ${week.weekNumber}: ${week.employees?.length || 0} employees`}
                >
                  Week {week.weekNumber} ({week.employees?.length || 0})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
//     <>
//       <AdminNavbar />
//       <div className="fixed inset-0 bg-white flex flex-col mt-10">
//         <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
//           <div className="p-4 md:p-6 flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-800">Roster Management</h1>
//               <p className="text-gray-600 mt-1">Manage weekly roster with day-wise status tracking</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={handleExportSavedRoster}
//                 disabled={savedExportLoading}
//                 className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer"
//               >
//                 {savedExportLoading ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Exporting...
//                   </>
//                 ) : (
//                   <>
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                     Export Roster
//                   </>
//                 )}
//               </button>
//               <button onClick={handleViewSavedRoster} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer">
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
//                 </svg>
//                 View Saved Roster
//               </button>
//             </div>
//           </div>
//         </div>
//         <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
//           <div className="p-4 md:p-6" ref={formRef}>
//             {showSavedRoster && renderSavedRosterTable()}
//             {!showSavedRoster && employees.length > 0 && (
//               <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
//                 <h2 className="text-lg font-semibold text-blue-800 mb-3">📊 Weekly Summary</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-gray-800">{weeklySummary.totalEmployees}</div>
//                     <div className="text-sm text-gray-600">Total Employees</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-green-600">{weeklySummary.totalPresents}</div>
//                     <div className="text-sm text-gray-600">Total Presents</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalWeekOffs}</div>
//                     <div className="text-sm text-gray-600">Total Week Offs</div>
//                   </div>
//                   <div className="bg-white p-4 rounded-lg shadow-sm">
//                     <div className="text-2xl font-bold text-red-600">{weeklySummary.totalLeaves}</div>
//                     <div className="text-sm text-gray-600">Total Leaves</div>
//                   </div>
//                 </div>
//                 <div className="mt-4">
//                   <h3 className="font-medium text-blue-700 mb-2">Day-wise Status Overview</h3>
//                   <div className="grid grid-cols-7 gap-2">
//                     {daysOfWeek.map((day, dayIndex) => {
//                       const daySummary = weeklySummary.dayWiseSummary[dayIndex];
//                       return (
//                         <div key={dayIndex} className={`bg-white rounded-lg p-3 text-center cursor-pointer border transition-all hover:shadow-md ${selectedDayOverview === dayIndex ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedDayOverview(selectedDayOverview === dayIndex ? null : dayIndex)}>
//                           <div className="font-semibold text-gray-800">{day}</div>
//                           <div className="mt-2 space-y-1">
//                             <div className="flex items-center justify-center"><span className="text-green-600 text-sm">✅ {daySummary.presents}</span></div>
//                             <div className="flex items-center justify-center"><span className="text-blue-600 text-sm">🗓️ {daySummary.weekOffs}</span></div>
//                             <div className="flex items-center justify-center"><span className="text-red-600 text-sm">❌ {daySummary.leaves}</span></div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//                 {selectedDayOverview !== null && (
//                   <div className="mt-4 bg-white rounded-lg p-4 border shadow-sm">
//                     <div className="flex justify-between items-center mb-3">
//                       <h4 className="font-semibold text-gray-800">{daysOfWeek[selectedDayOverview]} - Employee Details</h4>
//                       <button onClick={() => setSelectedDayOverview(null)} className="text-gray-500 hover:text-gray-700">✕</button>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-green-600 mb-2 flex items-center">✅ Present ({getEmployeesForDay(employees, selectedDayOverview, "P").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "P").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "P").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>
//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-blue-600 mb-2 flex items-center">🗓️ Week Off ({getEmployeesForDay(employees, selectedDayOverview, "WO").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "WO").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "WO").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>

//                       <div className="border rounded-lg p-3">
//                         <div className="font-medium text-red-600 mb-2 flex items-center">❌ Leave ({getEmployeesForDay(employees, selectedDayOverview, "L").length})</div>
//                         <div className="space-y-1">
//                           {getEmployeesForDay(employees, selectedDayOverview, "L").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded">{name}</div>))}
//                           {getEmployeesForDay(employees, selectedDayOverview, "L").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {!showSavedRoster && (
//               <>
//                 <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
//                   <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Employee</h2>

//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <input ref={inputRef} type="text" name="name" value={employeeInput.name} onChange={handleInputChange} placeholder="Name *" className="border p-3 rounded text-gray-800 placeholder-gray-500" required />
//                     <select name="transport" value={employeeInput.transport} onChange={handleInputChange} className="border p-3 rounded text-gray-800">
//                       <option value="" className="text-gray-500">Transport?</option>
//                       <option value="Yes" className="text-gray-800">Yes</option>
//                       <option value="No" className="text-gray-800">No</option>
//                     </select>
//                     <input type="text" name="cabRoute" value={employeeInput.cabRoute} onChange={handleInputChange} placeholder="CAB Route" className="border p-3 rounded text-gray-800 placeholder-gray-500" />
                    
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Roster Start Date *
//                         </label>
//                         <input 
//                           type="date" 
//                           name="startDate" 
//                           value={rosterDates.startDate} 
//                           onChange={handleRosterDateChange} 
//                           className="border p-3 rounded text-gray-800 placeholder-gray-500 w-full" 
//                           required 
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Roster End Date *
//                         </label>
//                         <input 
//                           type="date" 
//                           name="endDate" 
//                           value={rosterDates.endDate} 
//                           onChange={handleRosterDateChange} 
//                           className="border p-3 rounded text-gray-800 placeholder-gray-500 w-full" 
//                           required 
//                         />
//                       </div>
//                     </div>

//                     {!employeeInput.isCoreTeam && (
//                       <>
//                         <div className="grid grid-cols-2 gap-3">
//                           <input type="number" name="shiftStartHour" value={employeeInput.shiftStartHour} onChange={handleInputChange} placeholder="Start Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                           <input type="number" name="shiftEndHour" value={employeeInput.shiftEndHour} onChange={handleInputChange} placeholder="End Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
//                         </div>
//                       </>
//                     )}
//                     <button type="button" onClick={handleAddEmployee} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded font-medium cursor-pointer">{editIndex !== null ? "Update Employee" : "Add Employee"}</button>
//                   </div>
//                   <div className="mt-6">
//   <h3 className="font-semibold mb-3 text-gray-800">Daily Status for <span className="text-blue-600">{employeeInput.name || "Selected Employee"}</span></h3>
//   <div className="grid grid-cols-7 gap-2">
//     {daysOfWeek.map((day, i) => (
//       <div key={i} className="flex flex-col items-center">
//         <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//         <select 
//           name={`day${i}`} 
//           value={employeeInput.dailyStatus[i]} 
//           onChange={(e) => handleInputChange(e, i)} 
//           className={`border p-2 rounded w-full text-center text-gray-800 ${
//             employeeInput.dailyStatus[i] === "P" ? "border-green-300 bg-green-50" : 
//             employeeInput.dailyStatus[i] === "WO" ? "border-blue-300 bg-blue-50" : 
//             employeeInput.dailyStatus[i] === "L" ? "border-red-300 bg-red-50" : 
//             employeeInput.dailyStatus[i] === "NCNS" ? "border-red-400 bg-red-100" : 
//             employeeInput.dailyStatus[i] === "UL" ? "border-orange-300 bg-orange-50" : 
//             employeeInput.dailyStatus[i] === "LWP" ? "border-yellow-300 bg-yellow-50" : 
//             employeeInput.dailyStatus[i] === "BL" ? "border-purple-300 bg-purple-50" : 
//             employeeInput.dailyStatus[i] === "H" ? "border-purple-400 bg-purple-100" : 
//             "border-gray-300"
//           }`}
//         >
//           <option value="P" className="text-green-600">Present (P)</option>
//           <option value="WO" className="text-blue-600">Week Off (WO)</option>
//           <option value="L" className="text-red-600">Leave (L)</option>
//           <option value="NCNS" className="text-red-700">No Call No Show (NCNS)</option>
//           <option value="UL" className="text-orange-600">Unpaid Leave (UL)</option>
//           <option value="LWP" className="text-yellow-600">Leave Without Pay (LWP)</option>
//           <option value="BL" className="text-purple-600">Bereavement Leave (BL)</option>
//           <option value="H" className="text-purple-700">Holiday (H)</option>
//         </select>
//         <div className="mt-1 text-lg">
//           {employeeInput.dailyStatus[i] === "P" && "✅"}
//           {employeeInput.dailyStatus[i] === "WO" && "🗓️"}
//           {employeeInput.dailyStatus[i] === "L" && "❌"}
//           {employeeInput.dailyStatus[i] === "NCNS" && "🚫"}
//           {employeeInput.dailyStatus[i] === "UL" && "💸"}
//           {employeeInput.dailyStatus[i] === "LWP" && "💰"}
//           {employeeInput.dailyStatus[i] === "BL" && "⚫"}
//           {employeeInput.dailyStatus[i] === "H" && "🎉"}
//         </div>
//       </div>
//     ))}
//   </div>
// </div>
//                 </div>
//                 {employees.length > 0 && (
//                   <div className="bg-white rounded-lg border shadow-sm mb-6">
//                     <div className="p-4 border-b">
//                       <div className="flex justify-between items-center">
//                         <h3 className="text-lg font-semibold text-gray-800">Employee Roster ({employees.length})</h3>
//                         <div className="text-sm text-gray-600">
//                           Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="overflow-x-auto">
//                       <table className="w-full">
//                         <thead>
//                           <tr className="bg-gray-50">
//                             <th className="border p-3 text-left font-semibold text-gray-800">Name</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Transport</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">CAB Route</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Shift Hours</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Weekly Status</th>
//                             <th className="border p-3 text-left font-semibold text-gray-800">Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {employees.map((emp, index) => {
//                             const empSummary = {
//                               presents: emp.dailyStatus.filter((s) => s === "P").length,
//                               weekOffs: emp.dailyStatus.filter((s) => s === "WO").length,
//                               leaves: emp.dailyStatus.filter((s) => s === "L").length,
//                             };

//                             return (
//                               <tr key={index} className="border-b hover:bg-gray-50">
//                                 <td className="border p-3 text-gray-800 font-medium">{emp.name}</td>
//                                 <td className="border p-3 text-gray-800">{emp.transport || "-"}</td>
//                                 <td className="border p-3 text-gray-800">{emp.cabRoute || "-"}</td>

//                                 <td className="border p-3 text-gray-800">{emp.isCoreTeam ? "N/A" : `${emp.shiftStartHour || 0}:00 - ${emp.shiftEndHour || 0}:00`}</td>
//                                 <td className="border p-3">
//                                   <div className="mb-2">
//                                     <div className="flex space-x-2 mb-1">
//                                       <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
//                                       <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
//                                       <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>

//                                     </div>
//                                     <div className="flex space-x-1">
//                                       {emp.dailyStatus.map((status, dayIndex) => (
//                                         <div key={dayIndex} className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" : status === "WO" ? "bg-blue-100 border-blue-300" : status === "L" ? "bg-red-100 border-red-300" : "bg-gray-100 border-gray-300"}`} title={`${daysOfWeek[dayIndex]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : "Leave"}`}>
//                                           <span className="text-base">{getStatusIcon(status)}</span>
//                                         </div>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 </td>
//                                 <td className="border p-3">
//                                   <div className="flex space-x-2">
//                                     <button onClick={() => handleEdit(index)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Edit</button>
//                                     <button onClick={() => handleRemoveEmployee(index)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Remove</button>
//                                   </div>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}

//                 <div className="sticky bottom-0 bg-white border-t py-4 mt-6">
//                   <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
//                     <div>
//                       {employees.length > 0 && (
//                         <div className="flex items-center space-x-4">
//                           <p className="text-gray-600">Total: <span className="font-semibold text-gray-800">{employees.length}</span> employee(s)</p>
//                           <div className="flex space-x-2 text-sm"><span className="text-green-600">✅ {weeklySummary.totalPresents} Presents</span><span className="text-blue-600">🗓️ {weeklySummary.totalWeekOffs} Week Offs</span><span className="text-red-600">❌ {weeklySummary.totalLeaves} Leaves</span></div>
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex space-x-3">
//                       <button onClick={handleSaveRoster} disabled={loading || employees.length === 0} className={`px-6 py-3 rounded font-medium ${loading || employees.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"}`}>
//                         {loading ? (
//                           <span className="flex items-center">
//                             <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                             </svg>
//                             Saving...
//                           </span>
//                         ) : "Save Roster"}
//                       </button>
//                       <button onClick={handleExport} disabled={!generated || loading} className={`px-6 py-3 rounded font-medium ${!generated || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}>Export Excel</button>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}

//           </div>
//         </div>

//         {showScrollTop && (
//           <button onClick={scrollToTop} className="fixed right-6 bottom-6 bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg z-50" aria-label="Scroll to top">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
//           </button>
//         )}
//       </div>

//       {showSaveModal && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Save Roster</h2>
//               <button
//                 onClick={() => {
//                   setShowSaveModal(false);
//                   setSaveAction("create");
//                 }}
//                 className="text-gray-600 hover:text-gray-900"
//                 disabled={loading}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <h3 className="font-medium text-blue-800 mb-3">Choose Save Option</h3>
//                 <div className="space-y-3">
//                   <label className="flex items-start cursor-pointer">
//                     <input
//                       type="radio"
//                       name="saveAction"
//                       value="create"
//                       checked={saveAction === "create"}
//                       onChange={(e) => setSaveAction(e.target.value)}
//                       className="mt-1 mr-3"
//                     />
//                     <div>
//                       <div className="font-medium">Create New / Replace Roster</div>
//                       <div className="text-sm text-gray-600 mt-1">
//                         This will create a new roster or replace an existing one with the same week number.
//                         <br />
//                         <span className="font-medium">Warning: This will overwrite any existing data.</span>
//                       </div>
//                     </div>
//                   </label>

//                   <label className="flex items-start cursor-pointer">
//                     <input
//                       type="radio"
//                       name="saveAction"
//                       value="add"
//                       checked={saveAction === "add"}
//                       onChange={(e) => setSaveAction(e.target.value)}
//                       className="mt-1 mr-3"
//                     />
//                     <div>
//                       <div className="font-medium">Add to Existing Roster</div>
//                       <div className="text-sm text-gray-600 mt-1">
//                         This will add new employees to an existing roster without removing current ones.
//                         <br />
//                         <span className="font-medium">Note: Duplicate employees will be skipped.</span>
//                       </div>
//                     </div>
//                   </label>
//                 </div>
//               </div>

//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//                 <p className="text-sm text-gray-700">
//                   <strong>Roster Details:</strong>
//                 </p>
//                 <ul className="text-sm text-gray-600 mt-1 space-y-1">
//                   <li>• Employees to save: {employees.length}</li>
//                   <li>• Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}</li>
//                   <li>• Month/Year: {new Date(rosterDates.startDate).getMonth() + 1}/{new Date(rosterDates.startDate).getFullYear()}</li>
//                   <li>• Duration: {Math.ceil((new Date(rosterDates.endDate) - new Date(rosterDates.startDate)) / (1000 * 60 * 60 * 24)) + 1} days</li>
//                 </ul>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => {
//                   setShowSaveModal(false);
//                   setSaveAction("create");
//                 }}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={executeSaveRoster}
//                 disabled={loading}
//                 className={`px-4 py-2 rounded font-medium ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//               >
//                 {loading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Saving...
//                   </span>
//                 ) : (
//                   `Confirm ${saveAction === "create" ? "Create" : "Add"}`
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showExportModal && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Export Saved Roster</h2>
//               <button
//                 onClick={() => setShowExportModal(false)}
//                 className="text-gray-600 hover:text-gray-900"
//                 disabled={savedExportLoading}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Month
//                 </label>
//                 <select
//                   value={exportMonth}
//                   onChange={(e) => setExportMonth(parseInt(e.target.value))}
//                   className="w-full border p-3 rounded text-gray-800"
//                   disabled={savedExportLoading}
//                 >
//                   <option value="1">January</option>
//                   <option value="2">February</option>
//                   <option value="3">March</option>
//                   <option value="4">April</option>
//                   <option value="5">May</option>
//                   <option value="6">June</option>
//                   <option value="7">July</option>
//                   <option value="8">August</option>
//                   <option value="9">September</option>
//                   <option value="10">October</option>
//                   <option value="11">November</option>
//                   <option value="12">December</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Year
//                 </label>
//                 <input
//                   type="number"
//                   value={exportYear}
//                   onChange={(e) => setExportYear(parseInt(e.target.value))}
//                   className="w-full border p-3 rounded text-gray-800"
//                   min="2000"
//                   max="2100"
//                   disabled={savedExportLoading}
//                 />
//               </div>

//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//                 <p className="text-sm text-blue-800">
//                   This will export the saved roster from the database for the selected month and year.
//                   The Excel file will include all weeks with the same formatting as the roster.
//                 </p>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => setShowExportModal(false)}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//                 disabled={savedExportLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={executeExportSavedRoster}
//                 disabled={savedExportLoading}
//                 className={`px-4 py-2 rounded font-medium ${savedExportLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//               >
//                 {savedExportLoading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Exporting...
//                   </span>
//                 ) : (
//                   'Export to Excel'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showEditModal && editSavedEmployee && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
//               <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="text-gray-600 hover:text-gray-900">✕</button>
//             </div>

//            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//   {/* Name */}
//   <div className="relative">
//     <input
//       type="text"
//       name="name"
//       value={editSavedEmployee.name}
//       onChange={handleEditSavedChange}
//       className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//       // placeholder="Name"
//     />
//     <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all 
//       peer-placeholder-shown:top-3.5 
//       peer-placeholder-shown:text-base 
//       peer-focus:-top-2 
//       peer-focus:text-sm 
//       peer-focus:text-blue-500">
//       Name
//     </label>
//   </div>

//   {/* Transport */}
//   <div className="relative">
//     <select
//       name="transport"
//       value={editSavedEmployee.transport}
//       onChange={handleEditSavedChange}
//       className="peer w-full border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500"
//     >
//       <option value="" disabled></option>
//       <option value="Yes">Yes</option>
//       <option value="No">No</option>
//     </select>
//     <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1">
//       Transport
//     </label>
//   </div>

//   {/* Cab Route */}
//   <div className="relative">
//     <input
//       type="text"
//       name="cabRoute"
//       value={editSavedEmployee.cabRoute}
//       onChange={handleEditSavedChange}
//       className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//       // placeholder="Cab Route"
//     />
//     <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//       peer-placeholder-shown:top-3.5
//       peer-focus:-top-2
//       peer-focus:text-sm
//       peer-focus:text-blue-500">
//       CAB Route
//     </label>
//   </div>

//   {/* Shift Start */}
//   <div className="relative">
//     <input
//       type="number"
//       name="shiftStartHour"
//       value={editSavedEmployee.shiftStartHour}
//       onChange={handleEditSavedChange}
//       min="0"
//       max="23"
//       className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//       placeholder="Start Hour"
//     />
//     <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//       peer-placeholder-shown:top-3.5
//       peer-focus:-top-2
//       peer-focus:text-sm
//       peer-focus:text-blue-500">
//       Start Hour (0–23)
//     </label>
//   </div>

//   {/* Shift End */}
//   <div className="relative">
//     <input
//       type="number"
//       name="shiftEndHour"
//       value={editSavedEmployee.shiftEndHour}
//       onChange={handleEditSavedChange}
//       min="0"
//       max="23"
//       className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//       placeholder="End Hour"
//     />
//     <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//       peer-placeholder-shown:top-3.5
//       peer-focus:-top-2
//       peer-focus:text-sm
//       peer-focus:text-blue-500">
//       End Hour (0–23)
//     </label>
//   </div>

// </div>


//             <div className="mt-6">
//               <h3 className="font-semibold mb-3 text-gray-800">Daily Status</h3>
//               <div className="grid grid-cols-7 gap-2">
//                 {daysOfWeek.map((day, i) => (
//                   <div key={i} className="flex flex-col items-center">
//                     <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//                     <select name={`day${i}`} value={editSavedEmployee.dailyStatus[i]} onChange={(e) => handleEditSavedChange(e, i)} className="border p-2 rounded w-full text-center text-gray-800">
//                       <option value="P">Present (P)</option>
//                       <option value="WO">Week Off (WO)</option>
//                       <option value="L">Leave (L)</option>
//                       <option value="NCNS">NCNS (L)</option>
//                       <option value="UL">UL (L)</option>
//                       <option value="LWP">LWP (L)</option>
//                       <option value="BL">BL (L)</option>
//                       <option value="H">Holiday (H)</option>
//                     </select>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="px-4 py-2 rounded border">Cancel</button>
//               <button onClick={handleSaveEditedSaved} className="px-4 py-2 rounded bg-green-500 text-white">Save Changes</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ADDED: Delete Confirmation Modal */}
//       {showDeleteModal && employeeToDelete && (
//         <div className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">Delete Employee</h2>
//               <button
//                 onClick={() => {
//                   setShowDeleteModal(false);
//                   setEmployeeToDelete(null);
//                 }}
//                 className="text-gray-600 hover:text-gray-900"
//                 disabled={deleteLoading}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                 <div className="flex items-center mb-2">
//                   <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.771-.833-2.542 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                   </svg>
//                   <h3 className="font-medium text-red-800">Warning</h3>
//                 </div>
//                 <p className="text-sm text-red-700">
//                   Are you sure you want to delete <span className="font-semibold">{employeeToDelete.name}</span> from the roster?
//                   This action cannot be undone.
//                 </p>
//               </div>

//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//                 <p className="text-sm text-gray-700">
//                   <strong>Employee Details:</strong>
//                 </p>
//                 <ul className="text-sm text-gray-600 mt-1 space-y-1">
//                   <li>• Name: {employeeToDelete.name}</li>
//                   <li>• Week: {employeeToDelete.weekNumber}</li>
//                   <li>• Type: {employeeToDelete.userId ? 'CRM User' : 'Non-CRM User'}</li>
//                   {employeeToDelete.userId && (
//                     <li>• User ID: {employeeToDelete.userId.substring(0, 8)}...</li>
//                   )}
//                 </ul>
//               </div>

//               {deleteError && (
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//                   <p className="text-sm text-yellow-700">{deleteError}</p>
//                 </div>
//               )}
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => {
//                   setShowDeleteModal(false);
//                   setEmployeeToDelete(null);
//                 }}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//                 disabled={deleteLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDeleteEmployee}
//                 disabled={deleteLoading}
//                 className={`px-4 py-2 rounded font-medium ${deleteLoading ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} text-white flex items-center`}
//               >
//                 {deleteLoading ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                     </svg>
//                     Delete Employee
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>

<>
  <AdminNavbar />
  <div className="fixed inset-0 bg-white flex flex-col mt-10">
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="p-4 md:p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Roster Management</h1>
          <p className="text-gray-600 mt-1">Manage weekly roster with day-wise status tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCopyPopup(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            Auto-Propagate
          </button>
          
          <button
            onClick={handleExportSavedRoster}
            disabled={savedExportLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer"
          >
            {savedExportLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Roster
              </>
            )}
          </button>
          <button onClick={handleViewSavedRoster} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium flex items-center cursor-pointer">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            View Saved Roster
          </button>
        </div>
      </div>
    </div>
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6" ref={formRef}>
        {showSavedRoster && renderSavedRosterTable()}
        {!showSavedRoster && employees.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">📊 Weekly Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-gray-800">{weeklySummary.totalEmployees}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{weeklySummary.totalPresents}</div>
                <div className="text-sm text-gray-600">Total Presents</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalWeekOffs}</div>
                <div className="text-sm text-gray-600">Total Week Offs</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-red-600">{weeklySummary.totalLeaves}</div>
                <div className="text-sm text-gray-600">Total Leaves</div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-blue-700 mb-2">Day-wise Status Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day, dayIndex) => {
                  const daySummary = weeklySummary.dayWiseSummary[dayIndex];
                  return (
                    <div key={dayIndex} className={`bg-white rounded-lg p-3 text-center cursor-pointer border transition-all hover:shadow-md ${selectedDayOverview === dayIndex ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedDayOverview(selectedDayOverview === dayIndex ? null : dayIndex)}>
                      <div className="font-semibold text-gray-800">{day}</div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-center"><span className="text-green-600 text-sm">✅ {daySummary.presents}</span></div>
                        <div className="flex items-center justify-center"><span className="text-blue-600 text-sm">🗓️ {daySummary.weekOffs}</span></div>
                        <div className="flex items-center justify-center"><span className="text-red-600 text-sm">❌ {daySummary.leaves}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedDayOverview !== null && (
              <div className="mt-4 bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">{daysOfWeek[selectedDayOverview]} - Employee Details</h4>
                  <button onClick={() => setSelectedDayOverview(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-green-600 mb-2 flex items-center">✅ Present ({getEmployeesForDay(employees, selectedDayOverview, "P").length})</div>
                    <div className="space-y-1">
                      {getEmployeesForDay(employees, selectedDayOverview, "P").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">{name}</div>))}
                      {getEmployeesForDay(employees, selectedDayOverview, "P").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-blue-600 mb-2 flex items-center">🗓️ Week Off ({getEmployeesForDay(employees, selectedDayOverview, "WO").length})</div>
                    <div className="space-y-1">
                      {getEmployeesForDay(employees, selectedDayOverview, "WO").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{name}</div>))}
                      {getEmployeesForDay(employees, selectedDayOverview, "WO").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-red-600 mb-2 flex items-center">❌ Leave ({getEmployeesForDay(employees, selectedDayOverview, "L").length})</div>
                    <div className="space-y-1">
                      {getEmployeesForDay(employees, selectedDayOverview, "L").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded">{name}</div>))}
                      {getEmployeesForDay(employees, selectedDayOverview, "L").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!showSavedRoster && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Employee</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input ref={inputRef} type="text" name="name" value={employeeInput.name} onChange={handleInputChange} placeholder="Name *" className="border p-3 rounded text-gray-800 placeholder-gray-500" required />
                <select name="transport" value={employeeInput.transport} onChange={handleInputChange} className="border p-3 rounded text-gray-800">
                  <option value="" className="text-gray-500">Transport?</option>
                  <option value="Yes" className="text-gray-800">Yes</option>
                  <option value="No" className="text-gray-800">No</option>
                </select>
                <input type="text" name="cabRoute" value={employeeInput.cabRoute} onChange={handleInputChange} placeholder="CAB Route" className="border p-3 rounded text-gray-800 placeholder-gray-500" />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roster Start Date *
                    </label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={rosterDates.startDate} 
                      onChange={handleRosterDateChange} 
                      className="border p-3 rounded text-gray-800 placeholder-gray-500 w-full" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roster End Date *
                    </label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={rosterDates.endDate} 
                      onChange={handleRosterDateChange} 
                      className="border p-3 rounded text-gray-800 placeholder-gray-500 w-full" 
                      required 
                    />
                  </div>
                </div>

                {!employeeInput.isCoreTeam && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" name="shiftStartHour" value={employeeInput.shiftStartHour} onChange={handleInputChange} placeholder="Start Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
                      <input type="number" name="shiftEndHour" value={employeeInput.shiftEndHour} onChange={handleInputChange} placeholder="End Hour (0-23) *" min="0" max="23" className="border p-3 rounded text-gray-800 placeholder-gray-500" required={!employeeInput.isCoreTeam} />
                    </div>
                  </>
                )}
                <button type="button" onClick={handleAddEmployee} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded font-medium cursor-pointer">{editIndex !== null ? "Update Employee" : "Add Employee"}</button>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-gray-800">Daily Status for <span className="text-blue-600">{employeeInput.name || "Selected Employee"}</span></h3>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
                      <select 
                        name={`day${i}`} 
                        value={employeeInput.dailyStatus[i]} 
                        onChange={(e) => handleInputChange(e, i)} 
                        className={`border p-2 rounded w-full text-center text-gray-800 ${
                          employeeInput.dailyStatus[i] === "P" ? "border-green-300 bg-green-50" : 
                          employeeInput.dailyStatus[i] === "WO" ? "border-blue-300 bg-blue-50" : 
                          employeeInput.dailyStatus[i] === "L" ? "border-red-300 bg-red-50" : 
                          employeeInput.dailyStatus[i] === "NCNS" ? "border-red-400 bg-red-100" : 
                          employeeInput.dailyStatus[i] === "UL" ? "border-orange-300 bg-orange-50" : 
                          employeeInput.dailyStatus[i] === "LWP" ? "border-yellow-300 bg-yellow-50" : 
                          employeeInput.dailyStatus[i] === "BL" ? "border-purple-300 bg-purple-50" : 
                          employeeInput.dailyStatus[i] === "H" ? "border-purple-400 bg-purple-100" : 
                          "border-gray-300"
                        }`}
                      >
                        <option value="P" className="text-green-600">Present (P)</option>
                        <option value="WO" className="text-blue-600">Week Off (WO)</option>
                        <option value="L" className="text-red-600">Leave (L)</option>
                        <option value="NCNS" className="text-red-700">No Call No Show (NCNS)</option>
                        <option value="UL" className="text-orange-600">Unpaid Leave (UL)</option>
                        <option value="LWP" className="text-yellow-600">Leave Without Pay (LWP)</option>
                        <option value="BL" className="text-purple-600">Bereavement Leave (BL)</option>
                        <option value="H" className="text-purple-700">Holiday (H)</option>
                      </select>
                      <div className="mt-1 text-lg">
                        {employeeInput.dailyStatus[i] === "P" && "✅"}
                        {employeeInput.dailyStatus[i] === "WO" && "🗓️"}
                        {employeeInput.dailyStatus[i] === "L" && "❌"}
                        {employeeInput.dailyStatus[i] === "NCNS" && "🚫"}
                        {employeeInput.dailyStatus[i] === "UL" && "💸"}
                        {employeeInput.dailyStatus[i] === "LWP" && "💰"}
                        {employeeInput.dailyStatus[i] === "BL" && "⚫"}
                        {employeeInput.dailyStatus[i] === "H" && "🎉"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {employees.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm mb-6">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Employee Roster ({employees.length})</h3>
                    {/* <div className="text-sm text-gray-600">
                      Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}
                    </div> */}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-3 text-left font-semibold text-gray-800">Name</th>
                        <th className="border p-3 text-left font-semibold text-gray-800">Transport</th>
                        <th className="border p-3 text-left font-semibold text-gray-800">CAB Route</th>
                        <th className="border p-3 text-left font-semibold text-gray-800">Shift Hours</th>
                        <th className="border p-3 text-left font-semibold text-gray-800">Weekly Status</th>
                        <th className="border p-3 text-left font-semibold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => {
                        const empSummary = {
                          presents: emp.dailyStatus.filter((s) => s === "P").length,
                          weekOffs: emp.dailyStatus.filter((s) => s === "WO").length,
                          leaves: emp.dailyStatus.filter((s) => s === "L").length,
                        };

                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="border p-3 text-gray-800 font-medium">{emp.name}</td>
                            <td className="border p-3 text-gray-800">{emp.transport || "-"}</td>
                            <td className="border p-3 text-gray-800">{emp.cabRoute || "-"}</td>

                            <td className="border p-3 text-gray-800">{emp.isCoreTeam ? "N/A" : `${emp.shiftStartHour || 0}:00 - ${emp.shiftEndHour || 0}:00`}</td>
                            <td className="border p-3">
                              <div className="mb-2">
                                <div className="flex space-x-2 mb-1">
                                  <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
                                  <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
                                  <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>

                                </div>
                                <div className="flex space-x-1">
                                  {emp.dailyStatus.map((status, dayIndex) => (
                                    <div key={dayIndex} className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" : status === "WO" ? "bg-blue-100 border-blue-300" : status === "L" ? "bg-red-100 border-red-300" : "bg-gray-100 border-gray-300"}`} title={`${daysOfWeek[dayIndex]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : "Leave"}`}>
                                      <span className="text-base">{getStatusIcon(status)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="border p-3">
                              <div className="flex space-x-2">
                                <button onClick={() => handleEdit(index)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleRemoveEmployee(index)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Remove</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-white border-t py-4 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div>
                  {employees.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <p className="text-gray-600">Total: <span className="font-semibold text-gray-800">{employees.length}</span> employee(s)</p>
                      <div className="flex space-x-2 text-sm"><span className="text-green-600">✅ {weeklySummary.totalPresents} Presents</span><span className="text-blue-600">🗓️ {weeklySummary.totalWeekOffs} Week Offs</span><span className="text-red-600">❌ {weeklySummary.totalLeaves} Leaves</span></div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button onClick={handleSaveRoster} disabled={loading || employees.length === 0} className={`px-6 py-3 rounded font-medium ${loading || employees.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"}`}>
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : "Save Roster"}
                  </button>
                  <button onClick={handleExport} disabled={!generated || loading} className={`px-6 py-3 rounded font-medium ${!generated || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}>Export Excel</button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>

    {showScrollTop && (
      <button onClick={scrollToTop} className="fixed right-6 bottom-6 bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg z-50" aria-label="Scroll to top">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    )}
  </div>

  {showSaveModal && (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Save Roster</h2>
          <button
            onClick={() => {
              setShowSaveModal(false);
              setSaveAction("create");
            }}
            className="text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Choose Save Option</h3>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="saveAction"
                  value="create"
                  checked={saveAction === "create"}
                  onChange={(e) => setSaveAction(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">Create New / Replace Roster</div>
                  <div className="text-sm text-gray-600 mt-1">
                    This will create a new roster or replace an existing one with the same week number.
                    <br />
                    <span className="font-medium">Warning: This will overwrite any existing data.</span>
                  </div>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="saveAction"
                  value="add"
                  checked={saveAction === "add"}
                  onChange={(e) => setSaveAction(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">Add to Existing Roster</div>
                  <div className="text-sm text-gray-600 mt-1">
                    This will add new employees to an existing roster without removing current ones.
                    <br />
                    <span className="font-medium">Note: Duplicate employees will be skipped.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Roster Details:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Employees to save: {employees.length}</li>
              <li>• Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}</li>
              <li>• Month/Year: {new Date(rosterDates.startDate).getMonth() + 1}/{new Date(rosterDates.startDate).getFullYear()}</li>
              <li>• Duration: {Math.ceil((new Date(rosterDates.endDate) - new Date(rosterDates.startDate)) / (1000 * 60 * 60 * 24)) + 1} days</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowSaveModal(false);
              setSaveAction("create");
            }}
            className="px-4 py-2 rounded border hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={executeSaveRoster}
            disabled={loading}
            className={`px-4 py-2 rounded font-medium ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              `Confirm ${saveAction === "create" ? "Create" : "Add"}`
            )}
          </button>
        </div>
      </div>
    </div>
  )}

  {showExportModal && (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Export Saved Roster</h2>
          <button
            onClick={() => setShowExportModal(false)}
            className="text-gray-600 hover:text-gray-900"
            disabled={savedExportLoading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(parseInt(e.target.value))}
              className="w-full border p-3 rounded text-gray-800"
              disabled={savedExportLoading}
            >
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={exportYear}
              onChange={(e) => setExportYear(parseInt(e.target.value))}
              className="w-full border p-3 rounded text-gray-800"
              min="2000"
              max="2100"
              disabled={savedExportLoading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              This will export the saved roster from the database for the selected month and year.
              The Excel file will include all weeks with the same formatting as the roster.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 rounded border hover:bg-gray-50"
            disabled={savedExportLoading}
          >
            Cancel
          </button>
          <button
            onClick={executeExportSavedRoster}
            disabled={savedExportLoading}
            className={`px-4 py-2 rounded font-medium ${savedExportLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {savedExportLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </span>
            ) : (
              'Export to Excel'
            )}
          </button>
        </div>
      </div>
    </div>
  )}

  {showEditModal && editSavedEmployee && (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
          <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Name */}
        <div className="relative">
          <input
            type="text"
            name="name"
            value={editSavedEmployee.name}
            onChange={handleEditSavedChange}
            className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
          />
          <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all 
            peer-placeholder-shown:top-3.5 
            peer-placeholder-shown:text-base 
            peer-focus:-top-2 
            peer-focus:text-sm 
            peer-focus:text-blue-500">
            Name
          </label>
        </div>

        {/* Transport */}
        <div className="relative">
          <select
            name="transport"
            value={editSavedEmployee.transport}
            onChange={handleEditSavedChange}
            className="peer w-full border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled></option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1">
            Transport
          </label>
        </div>

        {/* Cab Route */}
        <div className="relative">
          <input
            type="text"
            name="cabRoute"
            value={editSavedEmployee.cabRoute}
            onChange={handleEditSavedChange}
            className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
          />
          <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
            peer-placeholder-shown:top-3.5
            peer-focus:-top-2
            peer-focus:text-sm
            peer-focus:text-blue-500">
            CAB Route
          </label>
        </div>

        {/* Shift Start */}
        <div className="relative">
          <input
            type="number"
            name="shiftStartHour"
            value={editSavedEmployee.shiftStartHour}
            onChange={handleEditSavedChange}
            min="0"
            max="23"
            className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
            placeholder="Start Hour"
          />
          <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
            peer-placeholder-shown:top-3.5
            peer-focus:-top-2
            peer-focus:text-sm
            peer-focus:text-blue-500">
            Start Hour (0–23)
          </label>
        </div>

        {/* Shift End */}
        <div className="relative">
          <input
            type="number"
            name="shiftEndHour"
            value={editSavedEmployee.shiftEndHour}
            onChange={handleEditSavedChange}
            min="0"
            max="23"
            className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
            placeholder="End Hour"
          />
          <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
            peer-placeholder-shown:top-3.5
            peer-focus:-top-2
            peer-focus:text-sm
            peer-focus:text-blue-500">
            End Hour (0–23)
          </label>
        </div>

      </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-gray-800">Daily Status</h3>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
                <select name={`day${i}`} value={editSavedEmployee.dailyStatus[i]} onChange={(e) => handleEditSavedChange(e, i)} className="border p-2 rounded w-full text-center text-gray-800">
                  <option value="P">Present (P)</option>
                  <option value="WO">Week Off (WO)</option>
                  <option value="L">Leave (L)</option>
                  <option value="NCNS">NCNS (L)</option>
                  <option value="UL">UL (L)</option>
                  <option value="LWP">LWP (L)</option>
                  <option value="BL">BL (L)</option>
                  <option value="H">Holiday (H)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={handleSaveEditedSaved} className="px-4 py-2 rounded bg-green-500 text-white">Save Changes</button>
        </div>
      </div>
    </div>
  )}

  {/* ADDED: Delete Confirmation Modal */}
  {showDeleteModal && employeeToDelete && (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Delete Employee</h2>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setEmployeeToDelete(null);
            }}
            className="text-gray-600 hover:text-gray-900"
            disabled={deleteLoading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.771-.833-2.542 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="font-medium text-red-800">Warning</h3>
            </div>
            <p className="text-sm text-red-700">
              Are you sure you want to delete <span className="font-semibold">{employeeToDelete.name}</span> from the roster?
              This action cannot be undone.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Employee Details:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Name: {employeeToDelete.name}</li>
              <li>• Week: {employeeToDelete.weekNumber}</li>
              <li>• Type: {employeeToDelete.userId ? 'CRM User' : 'Non-CRM User'}</li>
              {employeeToDelete.userId && (
                <li>• User ID: {employeeToDelete.userId.substring(0, 8)}...</li>
              )}
            </ul>
          </div>

          {deleteError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">{deleteError}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setEmployeeToDelete(null);
            }}
            className="px-4 py-2 rounded border hover:bg-gray-50"
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteEmployee}
            disabled={deleteLoading}
            className={`px-4 py-2 rounded font-medium ${deleteLoading ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} text-white flex items-center`}
          >
            {deleteLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Employee
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ADD THE ROSTER COPY POPUP MODAL HERE */}
  {showCopyPopup && (
    <RosterCopyPopup
      isOpen={showCopyPopup}
      onClose={() => setShowCopyPopup(false)}
      currentRosterData={allRosters?.data?.[0]}
    />
  )}
</>
  );
};

export default RosterForm;
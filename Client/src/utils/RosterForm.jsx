// import React, { useState, useRef, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import AdminNavbar from "../components/AdminNavbar";
// import RosterCopyPopup from "../components/RosterCopyPopup";
// import { toast } from "react-toastify";
// import {
//   addRosterWeek,
//   fetchAllRosters,
//   // fetchRoster,
//   updateRosterEmployee,
//   // exportRosterExcel,
//   exportSavedRoster,
//   deleteEmployeeFromRoster,
//   deleteEmployeeByUserId,
//   // deleteEmployeeByName
// } from "../features/slices/rosterSlice";
// import RosterBulkEditForm from "../Roster/RosterBulkEditForm.jsx"


// const RosterForm = () => {
//   const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}/;
//   const pad2 = (value) => String(value).padStart(2, "0");
//   const getLocalDateKey = (date = new Date()) =>
//     `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
//   const getDateKey = (value) => {
//     if (!value) return "";
//     if (typeof value === "string" && DATE_ONLY_REGEX.test(value)) return value.slice(0, 10);
//     const date = new Date(value);
//     if (Number.isNaN(date.getTime())) return "";
//     return date.toISOString().slice(0, 10);
//   };
//   const dateFromKeyUTC = (dateKey) => {
//     const [year, month, day] = dateKey.split("-").map(Number);
//     return new Date(Date.UTC(year, month - 1, day));
//   };
//   const addDaysToDateKeyUTC = (dateKey, days) => {
//     const date = dateFromKeyUTC(dateKey);
//     date.setUTCDate(date.getUTCDate() + days);
//     return date.toISOString().slice(0, 10);
//   };
//   const getUTCISOStringFromDateKey = (dateKey) => `${dateKey}T00:00:00.000Z`;
//   const getMonthFromDateKeyUTC = (dateKey) => dateFromKeyUTC(dateKey).getUTCMonth() + 1;
//   const getYearFromDateKeyUTC = (dateKey) => dateFromKeyUTC(dateKey).getUTCFullYear();
//   const getDateRangeDurationDaysUTC = (startDateKey, endDateKey) =>
//     Math.ceil((dateFromKeyUTC(endDateKey) - dateFromKeyUTC(startDateKey)) / (1000 * 60 * 60 * 24)) + 1;
//   const dispatch = useDispatch();
//   const {
//     roster,
//     loading,
//     error,
//     allRosters,
//     rosterDetailLoading,
//     savedExportLoading,
//     savedExportSuccess,
//     deleteLoading,      // Added
//     deleteSuccess,      // Added
//     deleteError         // Added
//   } = useSelector((state) => state.roster || {});

//   const [employeeInput, setEmployeeInput] = useState({
//     name: "",
//     transport: "",
//     cabRoute: "",
//     shift: "",
//     shiftStartHour: "",
//     shiftEndHour: "",
//     teamLeader: "",
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

//   // ADDED: State for delete confirmation
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [employeeToDelete, setEmployeeToDelete] = useState(null);

//   // ADDED: State for roster dates
//   const [rosterDates, setRosterDates] = useState({
//     startDate: getLocalDateKey(),
//     endDate: addDaysToDateKeyUTC(getLocalDateKey(), 6),
//   });

//   // Add this with your other state declarations:
// const [showCopyPopup, setShowCopyPopup] = useState(false);

// const [showBulkEdit, setShowBulkEdit] = useState(false);
//   const [selectedRosterId, setSelectedRosterId] = useState(null);

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

//   useEffect(() => {
//     return () => {
//       if (deleteSuccess || deleteError) {
//         // dispatch(clearDeleteState());
//       }
//     };
//   }, [dispatch, deleteSuccess, deleteError]);

//   useEffect(() => {
//     if (deleteSuccess) {
//       toast.success("Employee deleted successfully");
//     }
//     if (deleteError) {
//       toast.error(deleteError);
//     }
//   }, [deleteSuccess, deleteError]);

//  const handleBulkEditRoster = async () => {
//   try {
//     // First, always try to fetch fresh data
//     toast.info("Loading rosters...");
    
//     const result = await dispatch(fetchAllRosters({})).unwrap();
//     console.log("Fetch result:", result);
    
//     // Wait a moment for state update
//     setTimeout(() => {
//       proceedWithBulkEditAfterFetch();
//     }, 500);
    
//   } catch (error) {
//     console.error("Error fetching rosters:", error);
//     toast.error("Failed to load rosters. Please try again.");
//   }
// };

// const proceedWithBulkEditAfterFetch = () => {
//   console.log("allRosters after fetch:", allRosters);
  
//   // Try to extract roster from different possible structures
//   let rosterToEdit = null;
  
//   // Debug: Log the exact structure
//   console.log("Type of allRosters:", typeof allRosters);
//   console.log("Is array?", Array.isArray(allRosters));
//   if (allRosters) {
//     console.log("Keys:", Object.keys(allRosters));
//     console.log("Has _id?", allRosters._id);
//     console.log("Has data?", allRosters.data);
//     console.log("Has success?", allRosters.success);
//   }
  
//   // Try multiple extraction methods
//   if (Array.isArray(allRosters) && allRosters.length > 0) {
//     rosterToEdit = allRosters[0];
//   } else if (allRosters && allRosters.data && Array.isArray(allRosters.data) && allRosters.data.length > 0) {
//     rosterToEdit = allRosters.data[0];
//   } else if (allRosters && allRosters._id) {
//     rosterToEdit = allRosters;
//   } else if (allRosters && allRosters.success && allRosters.data && Array.isArray(allRosters.data) && allRosters.data.length > 0) {
//     rosterToEdit = allRosters.data[0];
//   }
  
//   if (!rosterToEdit || !rosterToEdit._id) {
//     // Try hardcoded ID from your example
//     const hardcodedId = "69736c0fc66c89fb88c65c30";
//     console.log("Using hardcoded ID:", hardcodedId);
//     setSelectedRosterId(hardcodedId);
//     setShowBulkEdit(true);
//     toast.info("Using test roster ID. Please make sure it exists in your database.");
//     return;
//   }
  
//   console.log("Found roster:", rosterToEdit);
//   setSelectedRosterId(rosterToEdit._id);
//   setShowBulkEdit(true);
//   toast.success("Opening bulk edit...");
// };

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

//   // ADDED: Handle roster dates change
//   const handleRosterDateChange = (e) => {
//     const { name, value } = e.target;
//     setRosterDates({
//       ...rosterDates,
//       [name]: value
//     });
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
//       teamLeader: "",
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

//   // UPDATED: executeSaveRoster function with rosterStartDate and rosterEndDate
//  const executeSaveRoster = async () => {
//   try {
//     // Validate roster dates
//     if (!rosterDates.startDate || !rosterDates.endDate) {
//       toast.error("Please select both start and end dates for the roster");
//       return;
//     }

//     const startDate = dateFromKeyUTC(rosterDates.startDate);
//     const endDate = dateFromKeyUTC(rosterDates.endDate);
    
//     if (startDate > endDate) {
//       toast.error("Start date cannot be after end date");
//       return;
//     }

//     // Calculate week number based on roster dates
//     const rosterMonth = startDate.getUTCMonth() + 1;
//     const rosterYear = startDate.getUTCFullYear();
    
//     // Calculate week number from start date
//     const firstDayOfMonth = new Date(Date.UTC(rosterYear, rosterMonth - 1, 1));
//     const pastDaysOfYear = Math.floor((startDate - firstDayOfMonth) / (24 * 60 * 60 * 1000));
//     const weekNumber = Math.max(1, Math.ceil((firstDayOfMonth.getUTCDay() + pastDaysOfYear + 1) / 7));

//     // Prepare the data object correctly
//     const rosterData = {
//       month: rosterMonth,
//       year: rosterYear,
//       rosterStartDate: rosterDates.startDate, // Make sure this is a valid date string
//       rosterEndDate: rosterDates.endDate,     // Make sure this is a valid date string
//       weekNumber: weekNumber,
//       startDate: rosterDates.startDate,
//       endDate: rosterDates.endDate,
//       employees: employees.map((emp) => {
//         const employeeData = {
//           name: emp.name,
//           transport: emp.transport || "",
//           cabRoute: emp.cabRoute || "",
//           teamLeader: emp.teamLeader || "",
//           isCoreTeam: emp.isCoreTeam || false,
//           dailyStatus: emp.dailyStatus.map((status, index) => {
//             const dateKey = addDaysToDateKeyUTC(rosterDates.startDate, index);
//             return {
//               date: getUTCISOStringFromDateKey(dateKey),
//               status: status || "P",
//             };
//           }),
//         };

//         if (!emp.isCoreTeam) {
//           employeeData.shift = emp.shift;
//           employeeData.shiftStartHour = parseInt(emp.shiftStartHour) || 0;
//           employeeData.shiftEndHour = parseInt(emp.shiftEndHour) || 0;
//         }

//         return employeeData;
//       }),
//       action: saveAction, 
//     };

//     console.log("Sending roster data:", JSON.stringify(rosterData, null, 2));

//     await dispatch(
//       addRosterWeek({
//         data: rosterData, // Send the properly structured data
//       })
//     ).unwrap();

//     setGenerated(true);
//     setShowSaveModal(false);

//     const message = saveAction === "create"
//       ? "Roster created successfully!"
//       : "Employees added to existing roster successfully!";
//     toast.success(message);

//     if (saveAction === "create") {
//       setEmployees([]);
//     }

//     await dispatch(fetchAllRosters({})).unwrap();

//   } catch (err) {
//     console.error("Save roster error:", err);
//     toast.error(err.message || "Failed to save roster");
//   }
// };

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

//  const getStatusIcon = (status) => {
//   switch (status) {
//     case "P":
//       return "✅";
//     case "WO":
//       return "🗓️";
//     case "L":
//       return "❌";
//     case "NCNS":
//       return "🚫";
//     case "UL":
//       return "💸";
//     case "LWP":
//       return "💰";
//     case "BL":
//       return "⚫";
//     case "H":
//       return "🎉";
//     case "HD":
//       return "🌓";
//     case "LWD":
//       return "📅";
//     default:
//       return "📝";
//   }
// };

//   const calculateEmployeeSummary = (dailyStatus) => {
//     if (!dailyStatus || !Array.isArray(dailyStatus)) {
//       return { presents: 0, weekOffs: 0, leaves: 0, holidays: 0, halfDays: 0 };
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

//     const halfDays = dailyStatus.filter((ds) => {
//       const status = typeof ds === "object" ? ds.status : ds;
//       return status === "HD";
//     }).length;

//     return { presents, weekOffs, leaves, holidays, halfDays };
//   };

//   const formatShiftHours = (startHour, endHour) => {
//     if (startHour === undefined || endHour === undefined) return "N/A";
//     return `${startHour}:00 - ${endHour}:00`;
//   };

//   const formatDate = (dateString) => {
//     try {
//       const dateKey = getDateKey(dateString);
//       if (!dateKey) return dateString;
//       const date = dateFromKeyUTC(dateKey);
//       return date.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         timeZone: "UTC",
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };
//   const formatDateShort = (dateString) => {
//     try {
//       const dateKey = getDateKey(dateString);
//       if (!dateKey) return dateString;
//       const date = dateFromKeyUTC(dateKey);
//       return date.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         timeZone: "UTC",
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };
//   const getWeekDayDateLabel = (startDate, dayIndex) =>
//     formatDateShort(addDaysToDateKeyUTC(getDateKey(startDate), dayIndex));

//   const getLatestRosterWeek = () => {
//     if (!allRosters || allRosters.length === 0) return null;
//     const latestRoster = allRosters[0];
//     if (!latestRoster.weeks || latestRoster.weeks.length === 0) return null;
//     return latestRoster.weeks[0];
//   };

//   const handleEditSaved = (emp, rosterWeek) => {
//     const startDateKey = rosterWeek?.startDate ? getDateKey(rosterWeek.startDate) : getLocalDateKey();
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
//       startDate: startDateKey,
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
//       const dailyStatusObjects = editSavedEmployee.dailyStatus.map((status, idx) => {
//         const dateKey = addDaysToDateKeyUTC(editSavedEmployee.startDate, idx);
//         return { date: getUTCISOStringFromDateKey(dateKey), status: status || "P" };
//       });

//       const updates = {
//         name: editSavedEmployee.name,
//         transport: editSavedEmployee.transport,
//         cabRoute: editSavedEmployee.cabRoute,
//         teamLeader: editSavedEmployee.teamLeader || "",
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
//       console.error(err);
//       toast.error(err || "Only HR and Super Admin can edit current week roster");
//     }
//   };

//   // ADDED: Handle delete button click
//   const handleDeleteSaved = (emp, rosterWeek) => {
//     setEmployeeToDelete({
//       employeeId: emp._id,
//       name: emp.name,
//       userId: emp.userId,
//       weekNumber: rosterWeek.weekNumber,
//       rosterId: allRosters[0]?._id
//     });
//     setShowDeleteModal(true);
//   };

//   // ADDED: Confirm and execute deletion
//   const confirmDeleteEmployee = async () => {
//     if (!employeeToDelete || !employeeToDelete.rosterId || !employeeToDelete.weekNumber) {
//       toast.error("Missing delete information");
//       return;
//     }

//     try {
//       let deletePromise;
      
//       if (employeeToDelete.userId) {
//         // Delete by userId (CRM user)
//         deletePromise = dispatch(deleteEmployeeByUserId({
//           rosterId: employeeToDelete.rosterId,
//           weekNumber: employeeToDelete.weekNumber,
//           userId: employeeToDelete.userId
//         }));
//       } else {
//         // Delete by employeeId (non-CRM user or fallback)
//         deletePromise = dispatch(deleteEmployeeFromRoster({
//           rosterId: employeeToDelete.rosterId,
//           weekNumber: employeeToDelete.weekNumber,
//           employeeId: employeeToDelete.employeeId
//         }));
//       }

//       await deletePromise.unwrap();
      
//       // Refresh the saved roster data
//       await dispatch(fetchAllRosters({})).unwrap();
      
//       // Close modal
//       setShowDeleteModal(false);
//       setEmployeeToDelete(null);
      
//     } catch (err) {
//       toast.error(err.message || "Failed to delete employee");
//     }
//   };

//  const renderSavedRosterTable = () => {
//     if (rosterDetailLoading) {
//       return (
//         <div className="flex justify-center items-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <span className="ml-3 text-slate-600 font-medium">Loading saved roster...</span>
//         </div>
//       );
//     }

//     if (!allRosters || !Array.isArray(allRosters) || allRosters.length === 0) {
//       return (
//         <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
//           <p className="text-amber-800 font-medium">No saved roster data found.</p>
//         </div>
//       );
//     }

//     // Get the current roster (first one or use a selected one)
//     const currentRoster = allRosters[0]; // Assuming we're showing the first roster
//     const weeks = currentRoster?.weeks || [];
    
//     // Get the latest week as default if no week is selected
//     const getLatestWeekWithEmployees = () => {
//       // Find the latest week with employees
//       for (let i = weeks.length - 1; i >= 0; i--) {
//         const week = weeks[i];
//         if (week?.employees && week.employees.length > 0) {
//           return week;
//         }
//       }
//       // If no weeks have employees, return the latest week
//       return weeks[weeks.length - 1] || null;
//     };

//     // Get the week to display
//     let rosterWeek = selectedWeek;
    
//     // If no week is selected or selected week doesn't exist in current roster, use latest week
//     if (!rosterWeek || !weeks.find(w => w.weekNumber === rosterWeek.weekNumber)) {
//       rosterWeek = getLatestWeekWithEmployees();
//     }
    
//     // Check if the week exists and has employees
//     if (!rosterWeek) {
//       return (
//         <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
//           <div className="flex justify-center mb-4">
//             <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Roster Weeks Found</h3>
//           <p className="text-gray-600 mb-4">
//             This roster doesn't have any weeks configured yet.
//           </p>
//           <button 
//             onClick={() => setShowSavedRoster(false)}
//             className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
//           >
//             Close
//           </button>
//         </div>
//       );
//     }

//     // Check if current week has employees
//     if (!rosterWeek.employees || rosterWeek.employees.length === 0) {
//       // Find other weeks that have employees
//       const weeksWithEmployees = weeks.filter(week => 
//         week.weekNumber !== rosterWeek.weekNumber && 
//         week.employees && 
//         week.employees.length > 0
//       );
      
//       return (
//         <div className="mt-6">
//           <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 mb-6">
//             <div className="text-center">
//               <div className="flex justify-center mb-4">
//                 <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-yellow-800 mb-2">
//                 Week {rosterWeek.weekNumber} is Empty
//               </h3>
//               <p className="text-gray-600 mb-4">
//                 No employee data found in Week {rosterWeek.weekNumber}. 
//                 {weeksWithEmployees.length > 0 ? ' Select another week:' : ' No other weeks have employee data.'}
//               </p>
              
//               {weeksWithEmployees.length > 0 ? (
//                 <div className="space-y-3">
//                   <div className="flex flex-wrap justify-center gap-2">
//                     {weeksWithEmployees.map((week, index) => (
//                       <button 
//                         key={index} 
//                         onClick={() => setSelectedWeek(week)} 
//                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors shadow-sm"
//                       >
//                         Week {week.weekNumber} ({week.employees.length} employees)
//                       </button>
//                     ))}
//                   </div>
//                   <p className="text-sm text-gray-500 mt-2">
//                     Or create new employees for this week
//                   </p>
//                 </div>
//               ) : (
//                 <button 
//                   onClick={() => setShowSavedRoster(false)}
//                   className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
//                 >
//                   Close
//                 </button>
//               )}
//             </div>
//           </div>
          
//           {/* Show week selector even when current week is empty */}
//           {weeks.length > 1 && (
//             <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
//               <h4 className="text-sm font-medium text-slate-700 mb-2">All Weeks in Roster:</h4>
//               <div className="flex flex-wrap gap-2">
//                 {weeks.map((week, index) => (
//                   <button 
//                     key={index} 
//                     onClick={() => setSelectedWeek(week)} 
//                     className={`px-3 py-1 rounded text-sm ${
//                       rosterWeek.weekNumber === week.weekNumber 
//                         ? "bg-blue-600 text-white" 
//                         : "bg-slate-100 text-slate-700 hover:bg-slate-200"
//                     } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-slate-300' : ''}`}
//                     title={`Week ${week.weekNumber}: ${week.employees?.length || 0} employees`}
//                   >
//                     Week {week.weekNumber} ({week.employees?.length || 0})
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       );
//     }

//     const weeklySummaryLocal = getWeeklySummary(rosterWeek.employees);

//     return (
//       <div className="mt-6">
//         <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Saved Data</p>
//               <h3 className="text-xl font-semibold text-slate-900">Saved Roster</h3>
//               <p className="text-slate-600">
//                 Week {rosterWeek.weekNumber} • {formatDate(rosterWeek.startDate)} to {formatDate(rosterWeek.endDate)}
//               </p>
//             </div>
//             <button onClick={() => setShowSavedRoster(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Close</button>
//           </div>

//           <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
//               <div className="text-xl font-bold text-gray-800">{weeklySummaryLocal.totalEmployees}</div>
//               <div className="text-sm text-gray-600">Total Employees</div>
//             </div>
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
//               <div className="text-xl font-bold text-green-600">{weeklySummaryLocal.totalPresents}</div>
//               <div className="text-sm text-gray-600">Total Presents</div>
//             </div>
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
//               <div className="text-xl font-bold text-blue-600">{weeklySummaryLocal.totalWeekOffs}</div>
//               <div className="text-sm text-gray-600">Total Week Offs</div>
//             </div>
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
//               <div className="text-xl font-bold text-red-600">{weeklySummaryLocal.totalLeaves}</div>
//               <div className="text-sm text-gray-600">Total Leaves</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//           <div className="p-4 border-b border-slate-200">
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Week {rosterWeek.weekNumber} Employee Roster ({rosterWeek.employees.length})
//               </h3>
//               {weeks.length > 1 && (
//                 <div className="flex items-center space-x-2">
//                   <span className="text-sm text-gray-600">Switch Week:</span>
//                   <select 
//                     value={rosterWeek.weekNumber} 
//                     onChange={(e) => {
//                       const weekNumber = parseInt(e.target.value);
//                       const week = weeks.find(w => w.weekNumber === weekNumber);
//                       if (week) setSelectedWeek(week);
//                     }}
//                     className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-700"
//                   >
//                     {weeks.map((week, index) => (
//                       <option key={index} value={week.weekNumber}>
//                         Week {week.weekNumber} ({week.employees?.length || 0} employees)
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-slate-100/90">
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Name</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Transport</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">CAB Route</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Team Leader</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Shift Hours</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Weekly Status</th>
//                   <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rosterWeek.employees.map((emp, index) => {
//                   const empSummary = calculateEmployeeSummary(emp.dailyStatus);
//                   return (
//                     <tr key={emp._id || index} className="border-b border-slate-100 hover:bg-slate-50/80">
//                       <td className="border border-slate-200 p-3 text-gray-800 font-medium">{emp.name}</td>
//                       <td className="border border-slate-200 p-3 text-gray-800">{emp.transport || "-"}</td>
//                       <td className="border border-slate-200 p-3 text-gray-800">{emp.cabRoute || "-"}</td>
//                      <td className="border border-slate-200 p-3 text-gray-800">{emp.teamLeader || "-"}</td>
//                       <td className="border border-slate-200 p-3 text-gray-800">
//                         {emp.isCoreTeam ? "N/A" : formatShiftHours(emp.shiftStartHour, emp.shiftEndHour)}
//                       </td>
//                       <td className="border border-slate-200 p-3">
//                         <div className="mb-2">
//                           <div className="flex space-x-2 mb-1">
//                             <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
//                             <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
//                             <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>
//                             {empSummary.holidays > 0 && <span className="text-xs text-purple-600">🎉 {empSummary.holidays}H</span>}
//                             {empSummary.halfDays > 0 && <span className="text-xs text-amber-600">🌓 {empSummary.halfDays}HD</span>}
//                           </div>
//                           <div className="flex space-x-1">
//                             {emp.dailyStatus && emp.dailyStatus.map((ds, dayIndex) => {
//                               const status = typeof ds === "object" ? ds.status : ds;
//                               const dayDate = getWeekDayDateLabel(rosterWeek.startDate, dayIndex);
//                               return (
//                                 <div
//                                   key={dayIndex}
//                                   className={`w-12 h-12 flex flex-col items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" :
//                                     status === "WO" ? "bg-blue-100 border-blue-300" :
//                                       status === "L" ? "bg-red-100 border-red-300" :
//                                         status === "HD" ? "bg-amber-100 border-amber-300" :
//                                         status === "H" ? "bg-purple-100 border-purple-300" :
//                                           "bg-gray-100 border-gray-300"
//                                     }`}
//                                   title={`${daysOfWeek[dayIndex % 7]} (${dayDate}): ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : status === "HD" ? "Half Day" : status === "H" ? "Holiday" : status}`}
//                                 >
//                                   <span className="text-sm leading-none">{getStatusIcon(status)}</span>
//                                   <span className="text-[10px] leading-none text-gray-700 mt-0.5">{dayDate}</span>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="border border-slate-200 p-3">
//                         <div className="flex space-x-2">
//                           <button 
//                             onClick={() => handleEditSaved(emp, rosterWeek)} 
//                             className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm"
//                           >
//                             Edit
//                           </button>
//                           <button 
//                             onClick={() => handleDeleteSaved(emp, rosterWeek)} 
//                             disabled={deleteLoading && employeeToDelete?.employeeId === emp._id}
//                             className={`bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-md text-sm ${
//                               deleteLoading && employeeToDelete?.employeeId === emp._id 
//                                 ? 'opacity-50 cursor-not-allowed' 
//                                 : ''
//                             }`}
//                           >
//                             {deleteLoading && employeeToDelete?.employeeId === emp._id 
//                               ? 'Deleting...' 
//                               : 'Delete'
//                             }
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Bottom week selector */}
//         {weeks.length > 1 && (
//           <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
//             <h4 className="text-sm font-medium text-slate-700 mb-2">Quick Week Navigation:</h4>
//             <div className="flex flex-wrap gap-2">
//               {weeks.map((week, index) => (
//                 <button 
//                   key={index} 
//                   onClick={() => setSelectedWeek(week)} 
//                   className={`px-3 py-1 rounded text-sm ${
//                     rosterWeek.weekNumber === week.weekNumber 
//                       ? "bg-blue-600 text-white" 
//                       : "bg-slate-100 text-slate-700 hover:bg-slate-200"
//                   } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-slate-300 opacity-75' : ''}`}
//                   title={`Week ${week.weekNumber}: ${week.employees?.length || 0} employees`}
//                 >
//                   Week {week.weekNumber} ({week.employees?.length || 0})
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (    
// <>
//   <AdminNavbar />
//   <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col mt-10 [&_button]:cursor-pointer [&_select]:cursor-pointer">
//     <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
//       <div className="p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
//         <div>
//           <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Roster Workspace</p>
//           <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Roster Management</h1>
//           <p className="text-slate-600 mt-2">Manage weekly roster with day-wise status tracking</p>
//         </div>
//         <div className="flex flex-col items-end sm:flex-row gap-2 w-full lg:w-auto">
//   <button
//     onClick={handleBulkEditRoster}
//     className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm"
//   >
//     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//     </svg>
//     Bulk Edit Roster
//   </button>

//   <button
//     onClick={() => setShowCopyPopup(true)}
//     className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm"
//   >
//     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
//     </svg>
//     Auto-Propagate
//   </button>

//   <button
//     onClick={handleExportSavedRoster}
//     disabled={savedExportLoading}
//     className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
//   >
//     {savedExportLoading ? (
//       <>
//         <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10"
//             stroke="currentColor" strokeWidth="4" fill="none" />
//           <path className="opacity-75" fill="currentColor"
//             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//         </svg>
//         Exporting...
//       </>
//     ) : (
//       <>
//         <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//             d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//         </svg>
//         Export Roster
//       </>
//     )}
//   </button>

//   <button
//     onClick={handleViewSavedRoster}
//     className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
//   >
//     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
//     </svg>
//     View Saved Roster
//   </button>
// </div>

//       </div>
//     </div>
//     {showBulkEdit && selectedRosterId && (
//           <RosterBulkEditForm
//             rosterId={selectedRosterId}
//             onClose={() => {
//               setShowBulkEdit(false);
//               setSelectedRosterId(null);
//               dispatch(fetchAllRosters({}));
//             }}
//           />
//         )}
//     <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
//       <div className="p-4 md:p-6" ref={formRef}>
//         {showSavedRoster && renderSavedRosterTable()}
//         {!showSavedRoster && employees.length > 0 && (
//           <div className="mb-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
//             <h2 className="text-lg font-semibold text-slate-900 mb-3">Weekly Summary</h2>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
//                 <div className="text-2xl font-bold text-gray-800">{weeklySummary.totalEmployees}</div>
//                 <div className="text-sm text-gray-600">Total Employees</div>
//               </div>
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
//                 <div className="text-2xl font-bold text-green-600">{weeklySummary.totalPresents}</div>
//                 <div className="text-sm text-gray-600">Total Presents</div>
//               </div>
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
//                 <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalWeekOffs}</div>
//                 <div className="text-sm text-gray-600">Total Week Offs</div>
//               </div>
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
//                 <div className="text-2xl font-bold text-red-600">{weeklySummary.totalLeaves}</div>
//                 <div className="text-sm text-gray-600">Total Leaves</div>
//               </div>
//             </div>
//             <div className="mt-4">
//               <h3 className="font-medium text-slate-700 mb-2">Day-wise Status Overview</h3>
//               <div className="grid grid-cols-7 gap-2">
//                 {daysOfWeek.map((day, dayIndex) => {
//                   const daySummary = weeklySummary.dayWiseSummary[dayIndex];
//                   return (
//                     <div key={dayIndex} className={`bg-slate-50 rounded-xl p-3 text-center border border-slate-200 transition-all hover:shadow-sm ${selectedDayOverview === dayIndex ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedDayOverview(selectedDayOverview === dayIndex ? null : dayIndex)}>
//                       <div className="font-semibold text-gray-800">{day}</div>
//                       <div className="mt-2 space-y-1">
//                         <div className="flex items-center justify-center"><span className="text-green-600 text-sm">✅ {daySummary.presents}</span></div>
//                         <div className="flex items-center justify-center"><span className="text-blue-600 text-sm">🗓️ {daySummary.weekOffs}</span></div>
//                         <div className="flex items-center justify-center"><span className="text-red-600 text-sm">❌ {daySummary.leaves}</span></div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//             {selectedDayOverview !== null && (
//               <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
//                 <div className="flex justify-between items-center mb-3">
//                   <h4 className="font-semibold text-gray-800">{daysOfWeek[selectedDayOverview]} - Employee Details</h4>
//                   <button onClick={() => setSelectedDayOverview(null)} className="text-gray-500 hover:text-gray-700">✕</button>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="border rounded-lg p-3">
//                     <div className="font-medium text-green-600 mb-2 flex items-center">✅ Present ({getEmployeesForDay(employees, selectedDayOverview, "P").length})</div>
//                     <div className="space-y-1">
//                       {getEmployeesForDay(employees, selectedDayOverview, "P").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">{name}</div>))}
//                       {getEmployeesForDay(employees, selectedDayOverview, "P").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                     </div>
//                   </div>
//                   <div className="border rounded-lg p-3">
//                     <div className="font-medium text-blue-600 mb-2 flex items-center">🗓️ Week Off ({getEmployeesForDay(employees, selectedDayOverview, "WO").length})</div>
//                     <div className="space-y-1">
//                       {getEmployeesForDay(employees, selectedDayOverview, "WO").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{name}</div>))}
//                       {getEmployeesForDay(employees, selectedDayOverview, "WO").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                     </div>
//                   </div>

//                   <div className="border rounded-lg p-3">
//                     <div className="font-medium text-red-600 mb-2 flex items-center">❌ Leave ({getEmployeesForDay(employees, selectedDayOverview, "L").length})</div>
//                     <div className="space-y-1">
//                       {getEmployeesForDay(employees, selectedDayOverview, "L").map((name, idx) => (<div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded">{name}</div>))}
//                       {getEmployeesForDay(employees, selectedDayOverview, "L").length === 0 && (<div className="text-sm text-gray-500 italic">No employees</div>)}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {!showSavedRoster && (
//           <>
//             <div className="bg-white p-5 rounded-2xl mb-6 border border-slate-200 shadow-sm">
//               <h2 className="text-lg font-semibold mb-4 text-slate-900">Add Employee</h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <input ref={inputRef} type="text" name="name" value={employeeInput.name} onChange={handleInputChange} placeholder="Name *" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required />
//                 <select name="transport" value={employeeInput.transport} onChange={handleInputChange} className="border border-slate-300 p-3 rounded-lg text-gray-800 bg-white">
//                   <option value="" className="text-gray-500">Transport?</option>
//                   <option value="Yes" className="text-gray-800">Yes</option>
//                   <option value="No" className="text-gray-800">No</option>
//                 </select>
//                 <input type="text" name="cabRoute" value={employeeInput.cabRoute} onChange={handleInputChange} placeholder="CAB Route" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" />
//                 <input type="text" name="teamLeader" value={employeeInput.teamLeader || ""} onChange={handleInputChange} placeholder="Team Leader (Optional)" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" />
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Roster Start Date *
//                     </label>
//                     <input 
//                       type="date" 
//                       name="startDate" 
//                       value={rosterDates.startDate} 
//                       onChange={handleRosterDateChange} 
//                       className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 w-full bg-white" 
//                       required 
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Roster End Date *
//                     </label>
//                     <input 
//                       type="date" 
//                       name="endDate" 
//                       value={rosterDates.endDate} 
//                       onChange={handleRosterDateChange} 
//                       className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 w-full bg-white" 
//                       required 
//                     />
//                   </div>
//                 </div>

//                 {!employeeInput.isCoreTeam && (
//                   <>
//                     <div className="grid grid-cols-2 gap-3">
//                       <input type="number" name="shiftStartHour" value={employeeInput.shiftStartHour} onChange={handleInputChange} placeholder="Start Hour (0-23) *" min="0" max="23" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required={!employeeInput.isCoreTeam} />
//                       <input type="number" name="shiftEndHour" value={employeeInput.shiftEndHour} onChange={handleInputChange} placeholder="End Hour (0-23) *" min="0" max="23" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required={!employeeInput.isCoreTeam} />
//                     </div>
//                   </>
//                 )}
//                 <button type="button" onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium shadow-sm">{editIndex !== null ? "Update Employee" : "Add Employee"}</button>
//               </div>
//               <div className="mt-6">
//                 <h3 className="font-semibold mb-3 text-gray-800">Daily Status for <span className="text-blue-600">{employeeInput.name || "Selected Employee"}</span></h3>
//                 <div className="grid grid-cols-7 gap-2">
//                   {daysOfWeek.map((day, i) => (
//                     <div key={i} className="flex flex-col items-center">
//                       <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//                       <select 
//                         name={`day${i}`} 
//                         value={employeeInput.dailyStatus[i]} 
//                         onChange={(e) => handleInputChange(e, i)} 
//                         className={`border p-2 rounded-lg w-full text-center text-gray-800 ${
//                           employeeInput.dailyStatus[i] === "P" ? "border-green-300 bg-green-50" : 
//                           employeeInput.dailyStatus[i] === "WO" ? "border-blue-300 bg-blue-50" : 
//                           employeeInput.dailyStatus[i] === "L" ? "border-red-300 bg-red-50" : 
//                           employeeInput.dailyStatus[i] === "NCNS" ? "border-red-400 bg-red-100" : 
//                           employeeInput.dailyStatus[i] === "UL" ? "border-orange-300 bg-orange-50" : 
//                           employeeInput.dailyStatus[i] === "LWP" ? "border-yellow-300 bg-yellow-50" : 
//                           employeeInput.dailyStatus[i] === "BL" ? "border-purple-300 bg-purple-50" : 
//                           employeeInput.dailyStatus[i] === "H" ? "border-purple-400 bg-purple-100" : 
//                           employeeInput.dailyStatus[i] === "HD" ? "border-amber-400 bg-amber-100" :
//                           employeeInput.dailyStatus[i] === "LWD" ? "border-yellow-400 bg-yellow-100" :
//                           "border-gray-300"
//                         }`}
//                       >
//                         <option value="P" className="text-green-600">Present (P)</option>
//                         <option value="WO" className="text-blue-600">Week Off (WO)</option>
//                         <option value="L" className="text-red-600">Leave (L)</option>
//                         <option value="NCNS" className="text-red-700">No Call No Show (NCNS)</option>
//                         <option value="UL" className="text-orange-600">Unpaid Leave (UL)</option>
//                         <option value="LWP" className="text-yellow-600">Leave Without Pay (LWP)</option>
//                         <option value="BL" className="text-purple-600">Bereavement Leave (BL)</option>
//                         <option value="H" className="text-purple-700">Holiday (H)</option>
//                         <option value="HD" className="text-amber-700">Half Day (HD)</option>
//                         <option value="LWD" className="text-yellow-700">Last Working Day (LWD)</option>
//                       </select>
//                       <div className="mt-1 text-lg">
//                         {employeeInput.dailyStatus[i] === "P" && "✅"}
//                         {employeeInput.dailyStatus[i] === "WO" && "🗓️"}
//                         {employeeInput.dailyStatus[i] === "L" && "❌"}
//                         {employeeInput.dailyStatus[i] === "NCNS" && "🚫"}
//                         {employeeInput.dailyStatus[i] === "UL" && "💸"}
//                         {employeeInput.dailyStatus[i] === "LWP" && "💰"}
//                         {employeeInput.dailyStatus[i] === "BL" && "⚫"}
//                         {employeeInput.dailyStatus[i] === "H" && "🎉"}
//                         {employeeInput.dailyStatus[i] === "HD" && "🌓"}
//                         {employeeInput.dailyStatus[i] === "LWD" && "📅"}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             {employees.length > 0 && (
//               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
//                 <div className="p-4 border-b border-slate-200">
//                   <div className="flex justify-between items-center">
//                     <h3 className="text-lg font-semibold text-gray-800">Employee Roster ({employees.length})</h3>
//                     {/* <div className="text-sm text-gray-600">
//                       Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}
//                     </div> */}
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="bg-slate-100/90">
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Name</th>
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Transport</th>
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">CAB Route</th>
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Shift Hours</th>
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Weekly Status</th>
//                         <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {employees.map((emp, index) => {
//                         const empSummary = {
//                           presents: emp.dailyStatus.filter((s) => s === "P").length,
//                           weekOffs: emp.dailyStatus.filter((s) => s === "WO").length,
//                           leaves: emp.dailyStatus.filter((s) => s === "L").length,
//                         };

//                         return (
//                           <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80">
//                             <td className="border border-slate-200 p-3 text-gray-800 font-medium">{emp.name}</td>
//                             <td className="border border-slate-200 p-3 text-gray-800">{emp.transport || "-"}</td>
//                             <td className="border border-slate-200 p-3 text-gray-800">{emp.cabRoute || "-"}</td>

//                             <td className="border border-slate-200 p-3 text-gray-800">{emp.isCoreTeam ? "N/A" : `${emp.shiftStartHour || 0}:00 - ${emp.shiftEndHour || 0}:00`}</td>
//                             <td className="border border-slate-200 p-3">
//                               <div className="mb-2">
//                                 <div className="flex space-x-2 mb-1">
//                                   <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
//                                   <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
//                                   <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>

//                                 </div>
//                                 <div className="flex space-x-1">
//                                   {emp.dailyStatus.map((status, dayIndex) => (
//                                     <div key={dayIndex} className={`w-12 h-12 flex flex-col items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" : status === "WO" ? "bg-blue-100 border-blue-300" : status === "L" ? "bg-red-100 border-red-300" : status === "HD" ? "bg-amber-100 border-amber-300" : "bg-gray-100 border-gray-300"}`} title={`${daysOfWeek[dayIndex]} (${getWeekDayDateLabel(rosterDates.startDate, dayIndex)}): ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : status === "HD" ? "Half Day" : status}`}>
//                                       <span className="text-sm leading-none">{getStatusIcon(status)}</span>
//                                       <span className="text-[10px] leading-none text-gray-700 mt-0.5">{getWeekDayDateLabel(rosterDates.startDate, dayIndex)}</span>
//                                     </div>
//                                   ))}
//                                 </div>
//                               </div>
//                             </td>
//                             <td className="border border-slate-200 p-3">
//                               <div className="flex space-x-2">
//                                 <button onClick={() => handleEdit(index)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm">Edit</button>
//                                 <button onClick={() => handleRemoveEmployee(index)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-md text-sm">Remove</button>
//                               </div>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 py-4 mt-6">
//               <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
//                 <div>
//                   {employees.length > 0 && (
//                     <div className="flex items-center space-x-4">
//                       <p className="text-gray-600">Total: <span className="font-semibold text-gray-800">{employees.length}</span> employee(s)</p>
//                       <div className="flex space-x-2 text-sm"><span className="text-green-600">✅ {weeklySummary.totalPresents} Presents</span><span className="text-blue-600">🗓️ {weeklySummary.totalWeekOffs} Week Offs</span><span className="text-red-600">❌ {weeklySummary.totalLeaves} Leaves</span></div>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex space-x-3">
//                   <button onClick={handleSaveRoster} disabled={loading || employees.length === 0} className={`px-6 py-3 rounded-lg font-medium ${loading || employees.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
//                     {loading ? (
//                       <span className="flex items-center">
//                         <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                         </svg>
//                         Saving...
//                       </span>
//                     ) : "Save Roster"}
//                   </button>
//                   {/* <button onClick={handleExport} disabled={!generated || loading} className={`px-6 py-3 rounded font-medium ${!generated || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}>Export Excel</button> */}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}

//       </div>
//     </div>

//     {showScrollTop && (
//       <button onClick={scrollToTop} className="fixed right-6 bottom-6 bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg z-50" aria-label="Scroll to top">
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
//       </button>
//     )}
//   </div>

//   {showSaveModal && (
//     <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//       <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-800">Save Roster</h2>
//           <button
//             onClick={() => {
//               setShowSaveModal(false);
//               setSaveAction("create");
//             }}
//             className="text-gray-600 hover:text-gray-900"
//             disabled={loading}
//           >
//             ✕
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <h3 className="font-medium text-blue-800 mb-3">Choose Save Option</h3>
//             <div className="space-y-3">
//               <label className="flex items-start cursor-pointer">
//                 <input
//                   type="radio"
//                   name="saveAction"
//                   value="create"
//                   checked={saveAction === "create"}
//                   onChange={(e) => setSaveAction(e.target.value)}
//                   className="mt-1 mr-3"
//                 />
//                 <div>
//                   <div className="font-medium">Create New / Replace Roster</div>
//                   <div className="text-sm text-gray-600 mt-1">
//                     This will create a new roster or replace an existing one with the same week number.
//                     <br />
//                     <span className="font-medium">Warning: This will overwrite any existing data.</span>
//                   </div>
//                 </div>
//               </label>

//               <label className="flex items-start cursor-pointer">
//                 <input
//                   type="radio"
//                   name="saveAction"
//                   value="add"
//                   checked={saveAction === "add"}
//                   onChange={(e) => setSaveAction(e.target.value)}
//                   className="mt-1 mr-3"
//                 />
//                 <div>
//                   <div className="font-medium">Add to Existing Roster</div>
//                   <div className="text-sm text-gray-600 mt-1">
//                     This will add new employees to an existing roster without removing current ones.
//                     <br />
//                     <span className="font-medium">Note: Duplicate employees will be skipped.</span>
//                   </div>
//                 </div>
//               </label>
//             </div>
//           </div>

//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//             <p className="text-sm text-gray-700">
//               <strong>Roster Details:</strong>
//             </p>
//             <ul className="text-sm text-gray-600 mt-1 space-y-1">
//               <li>• Employees to save: {employees.length}</li>
//               <li>• Roster Period: {formatDate(rosterDates.startDate)} to {formatDate(rosterDates.endDate)}</li>
//               <li>• Month/Year: {getMonthFromDateKeyUTC(rosterDates.startDate)}/{getYearFromDateKeyUTC(rosterDates.startDate)}</li>
//               <li>• Duration: {getDateRangeDurationDaysUTC(rosterDates.startDate, rosterDates.endDate)} days</li>
//             </ul>
//           </div>
//         </div>

//         <div className="mt-6 flex justify-end space-x-3">
//           <button
//             onClick={() => {
//               setShowSaveModal(false);
//               setSaveAction("create");
//             }}
//             className="px-4 py-2 rounded border hover:bg-gray-50"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={executeSaveRoster}
//             disabled={loading}
//             className={`px-4 py-2 rounded font-medium ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//           >
//             {loading ? (
//               <span className="flex items-center">
//                 <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                 </svg>
//                 Saving...
//               </span>
//             ) : (
//               `Confirm ${saveAction === "create" ? "Create" : "Add"}`
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   )}

//   {showExportModal && (
//     <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//       <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-800">Export Saved Roster</h2>
//           <button
//             onClick={() => setShowExportModal(false)}
//             className="text-gray-600 hover:text-gray-900"
//             disabled={savedExportLoading}
//           >
//             ✕
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Month
//             </label>
//             <select
//               value={exportMonth}
//               onChange={(e) => setExportMonth(parseInt(e.target.value))}
//               className="w-full border p-3 rounded text-gray-800"
//               disabled={savedExportLoading}
//             >
//               <option value="1">January</option>
//               <option value="2">February</option>
//               <option value="3">March</option>
//               <option value="4">April</option>
//               <option value="5">May</option>
//               <option value="6">June</option>
//               <option value="7">July</option>
//               <option value="8">August</option>
//               <option value="9">September</option>
//               <option value="10">October</option>
//               <option value="11">November</option>
//               <option value="12">December</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Year
//             </label>
//             <input
//               type="number"
//               value={exportYear}
//               onChange={(e) => setExportYear(parseInt(e.target.value))}
//               className="w-full border p-3 rounded text-gray-800"
//               min="2000"
//               max="2100"
//               disabled={savedExportLoading}
//             />
//           </div>

//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//             <p className="text-sm text-blue-800">
//               This will export the saved roster from the database for the selected month and year.
//               The Excel file will include all weeks with the same formatting as the roster.
//             </p>
//           </div>
//         </div>

//         <div className="mt-6 flex justify-end space-x-3">
//           <button
//             onClick={() => setShowExportModal(false)}
//             className="px-4 py-2 rounded border hover:bg-gray-50"
//             disabled={savedExportLoading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={executeExportSavedRoster}
//             disabled={savedExportLoading}
//             className={`px-4 py-2 rounded font-medium ${savedExportLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
//           >
//             {savedExportLoading ? (
//               <span className="flex items-center">
//                 <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                 </svg>
//                 Exporting...
//               </span>
//             ) : (
//               'Export to Excel'
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   )}

//   {showEditModal && editSavedEmployee && (
//     <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
//       <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
//           <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="text-gray-600 hover:text-gray-900">✕</button>
//         </div>

//        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//         {/* Name */}
//         <div className="relative">
//           <input
//             type="text"
//             name="name"
//             value={editSavedEmployee.name}
//             onChange={handleEditSavedChange}
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//           />
//           <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all 
//             peer-placeholder-shown:top-3.5 
//             peer-placeholder-shown:text-base 
//             peer-focus:-top-2 
//             peer-focus:text-sm 
//             peer-focus:text-blue-500">
//             Name
//           </label>
//         </div>

//         {/* Transport */}
//         <div className="relative">
//           <select
//             name="transport"
//             value={editSavedEmployee.transport}
//             onChange={handleEditSavedChange}
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500"
//           >
//             <option value="" disabled></option>
//             <option value="Yes">Yes</option>
//             <option value="No">No</option>
//           </select>
//           <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1">
//             Transport
//           </label>
//         </div>

//         {/* Cab Route */}
//         <div className="relative">
//           <input
//             type="text"
//             name="cabRoute"
//             value={editSavedEmployee.cabRoute}
//             onChange={handleEditSavedChange}
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//           />
//           <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//             peer-placeholder-shown:top-3.5
//             peer-focus:-top-2
//             peer-focus:text-sm
//             peer-focus:text-blue-500">
//             CAB Route
//           </label>
//         </div>
//       <div className="relative">
//           <input
//             type="text"
//             name="teamLeader"
//             value={editSavedEmployee.teamLeader || ""}
//             onChange={handleEditSavedChange}
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//           />
//           <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//             peer-placeholder-shown:top-3.5
//             peer-focus:-top-2
//             peer-focus:text-sm
//             peer-focus:text-blue-500">
//             Team Leader
//           </label>
//         </div>
//         {/* Shift Start */}
//         <div className="relative">
//           <input
//             type="number"
//             name="shiftStartHour"
//             value={editSavedEmployee.shiftStartHour}
//             onChange={handleEditSavedChange}
//             min="0"
//             max="23"
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//             placeholder="Start Hour"
//           />
//           <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//             peer-placeholder-shown:top-3.5
//             peer-focus:-top-2
//             peer-focus:text-sm
//             peer-focus:text-blue-500">
//             Start Hour (0–23)
//           </label>
//         </div>

//         {/* Shift End */}
//         <div className="relative">
//           <input
//             type="number"
//             name="shiftEndHour"
//             value={editSavedEmployee.shiftEndHour}
//             onChange={handleEditSavedChange}
//             min="0"
//             max="23"
//             className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
//             placeholder="End Hour"
//           />
//           <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
//             peer-placeholder-shown:top-3.5
//             peer-focus:-top-2
//             peer-focus:text-sm
//             peer-focus:text-blue-500">
//             End Hour (0–23)
//           </label>
//         </div>

//       </div>

//         <div className="mt-6">
//           <h3 className="font-semibold mb-3 text-gray-800">Daily Status</h3>
//           <p className="text-sm text-gray-600 mb-3">
//             Roster Period: {formatDate(editSavedEmployee.startDate)} to {formatDate(addDaysToDateKeyUTC(editSavedEmployee.startDate, 6))}
//           </p>
//           <div className="grid grid-cols-7 gap-2">
//             {daysOfWeek.map((day, i) => (
//               <div key={i} className="flex flex-col items-center">
//                 <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
//                 <span className="text-xs mb-2 text-gray-500">{formatDateShort(addDaysToDateKeyUTC(editSavedEmployee.startDate, i))}</span>
//                 <select name={`day${i}`} value={editSavedEmployee.dailyStatus[i]} onChange={(e) => handleEditSavedChange(e, i)} className="border p-2 rounded w-full text-center text-gray-800">
//                   <option value="P">Present (P)</option>
//                   <option value="WO">Week Off (WO)</option>
//                   <option value="L">Leave (L)</option>
//                   <option value="NCNS">NCNS (L)</option>
//                   <option value="UL">UL (L)</option>
//                   <option value="LWP">LWP (L)</option>
//                   <option value="BL">BL (L)</option>
//                   <option value="H">Holiday (H)</option>
//                   <option value="HD">Half Day (HD)</option>
//                   <option value="LWD">Last Working Day(LWD)</option>
//                 </select>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="mt-6 flex justify-end space-x-3">
//           <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="px-4 py-2 rounded border">Cancel</button>
//           <button onClick={handleSaveEditedSaved} className="px-4 py-2 rounded bg-green-500 text-white">Save Changes</button>
//         </div>
//       </div>
//     </div>
//   )}

//   {/* ADDED: Delete Confirmation Modal */}
//   {showDeleteModal && employeeToDelete && (
//     <div className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-800">Delete Employee</h2>
//           <button
//             onClick={() => {
//               setShowDeleteModal(false);
//               setEmployeeToDelete(null);
//             }}
//             className="text-gray-600 hover:text-gray-900"
//             disabled={deleteLoading}
//           >
//             ✕
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//             <div className="flex items-center mb-2">
//               <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.771-.833-2.542 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//               </svg>
//               <h3 className="font-medium text-red-800">Warning</h3>
//             </div>
//             <p className="text-sm text-red-700">
//               Are you sure you want to delete <span className="font-semibold">{employeeToDelete.name}</span> from the roster?
//               This action cannot be undone.
//             </p>
//           </div>

//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//             <p className="text-sm text-gray-700">
//               <strong>Employee Details:</strong>
//             </p>
//             <ul className="text-sm text-gray-600 mt-1 space-y-1">
//               <li>• Name: {employeeToDelete.name}</li>
//               <li>• Week: {employeeToDelete.weekNumber}</li>
//               <li>• Type: {employeeToDelete.userId ? 'CRM User' : 'Non-CRM User'}</li>
//               {employeeToDelete.userId && (
//                 <li>• User ID: {employeeToDelete.userId.substring(0, 8)}...</li>
//               )}
//             </ul>
//           </div>

//           {deleteError && (
//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//               <p className="text-sm text-yellow-700">{deleteError}</p>
//             </div>
//           )}
//         </div>

//         <div className="mt-6 flex justify-end space-x-3">
//           <button
//             onClick={() => {
//               setShowDeleteModal(false);
//               setEmployeeToDelete(null);
//             }}
//             className="px-4 py-2 rounded border hover:bg-gray-50"
//             disabled={deleteLoading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={confirmDeleteEmployee}
//             disabled={deleteLoading}
//             className={`px-4 py-2 rounded font-medium ${deleteLoading ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} text-white flex items-center`}
//           >
//             {deleteLoading ? (
//               <>
//                 <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                 </svg>
//                 Deleting...
//               </>
//             ) : (
//               <>
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                 </svg>
//                 Delete Employee
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   )}
//   {showCopyPopup && (
//     <RosterCopyPopup
//       isOpen={showCopyPopup}
//       onClose={() => setShowCopyPopup(false)}
//       currentRosterData={allRosters?.data?.[0]}
//     />
//   )}
// </>
//   );
// };

// export default RosterForm;





import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminNavbar from "../components/AdminNavbar";
import RosterCopyPopup from "../components/RosterCopyPopup";
import { toast } from "react-toastify";
import {
  addRosterWeek,
  fetchAllRosters,
  updateRosterEmployee,
  exportSavedRoster,
  deleteEmployeeFromRoster,
  deleteEmployeeByUserId,
  clearBulkEditState,
  clearBulkSaveState,
} from "../features/slices/rosterSlice";
import RosterBulkEditForm from "../Roster/RosterBulkEditForm.jsx"

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
    deleteLoading,
    deleteSuccess,
    deleteError
  } = useSelector((state) => state.roster || {});

  const [employeeInput, setEmployeeInput] = useState({
    name: "",
    transport: "",
    cabRoute: "",
    shift: "",
    shiftStartHour: "",
    shiftEndHour: "",
    teamLeader: "",
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

  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // State for roster dates
  const [rosterDates, setRosterDates] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().slice(0, 10),
  });

  // Department Filter State
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectedRosterId, setSelectedRosterId] = useState(null);
  
  // Add loading state for bulk edit
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  // Add flag to track if we're waiting for data
  const [waitingForData, setWaitingForData] = useState(false);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const formRef = useRef(null);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Helper function to get date for a specific day
  const getDateForDay = (startDate, dayIndex) => {
    try {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayIndex);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
      });
    } catch (error) {
      return "";
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (error) {
      return dateString;
    }
  };

  // Effect to handle bulk edit when data is loaded
  useEffect(() => {
    if (waitingForData && allRosters) {
      // Check if we have valid data
      let hasValidData = false;
      
      if (Array.isArray(allRosters) && allRosters.length > 0) {
        for (let i = 0; i < allRosters.length; i++) {
          if (allRosters[i] && allRosters[i]._id) {
            hasValidData = true;
            break;
          }
        }
      } else if (allRosters && allRosters.data && Array.isArray(allRosters.data) && allRosters.data.length > 0) {
        for (let i = 0; i < allRosters.data.length; i++) {
          if (allRosters.data[i] && allRosters.data[i]._id) {
            hasValidData = true;
            break;
          }
        }
      } else if (allRosters && allRosters._id) {
        hasValidData = true;
      }
      
      if (hasValidData) {
        setWaitingForData(false);
        proceedWithBulkEditAfterFetch();
      } else {
        setWaitingForData(false);
        setBulkEditLoading(false);
        toast.error("No valid roster data available");
      }
    }
  }, [allRosters, waitingForData]);

  // ========== MOVED useEffect from renderSavedRosterTable to here ==========
  useEffect(() => {
    if (selectedWeek?.employees) {
      const depts = new Set();
      selectedWeek.employees.forEach(emp => {
        if (emp.department) {
          depts.add(emp.department);
        }
      });
      setAvailableDepartments(Array.from(depts).sort());
    }
  }, [selectedWeek]);

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

  // Extract departments from employees when data loads
  useEffect(() => {
    if (allRosters && allRosters.length > 0 && allRosters[0]?.weeks) {
      const depts = new Set();
      allRosters.forEach(roster => {
        if (roster.weeks) {
          roster.weeks.forEach(week => {
            if (week.employees) {
              week.employees.forEach(emp => {
                if (emp.department) {
                  depts.add(emp.department);
                }
              });
            }
          });
        }
      });
      setAvailableDepartments(Array.from(depts).sort());
    }
  }, [allRosters]);

  // Helper functions for department filtering and pagination
  const handleDepartmentFilter = (e) => {
    setDepartmentFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearDepartmentFilter = () => {
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const getFilteredEmployees = (employeesList) => {
    if (!departmentFilter) return employeesList;
    return employeesList.filter(emp =>
      emp.department && emp.department.toLowerCase() === departmentFilter.toLowerCase()
    );
  };

  const getCurrentPageEmployees = (employeesList) => {
    const filtered = getFilteredEmployees(employeesList);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (employeesList) => {
    const filtered = getFilteredEmployees(employeesList);
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // FIXED: Added proper null checking and validation
  const proceedWithBulkEditAfterFetch = () => {
    // Clear any existing bulk edit state first
    dispatch(clearBulkEditState());
    dispatch(clearBulkSaveState());
    
    let rosterToEdit = null;
    
    // Check if allRosters exists and has data
    if (!allRosters) {
      toast.error("No roster data available");
      setBulkEditLoading(false);
      return;
    }
    
    // Try to find a valid roster with _id
    if (Array.isArray(allRosters) && allRosters.length > 0) {
      // Find first roster that has an _id
      for (let i = 0; i < allRosters.length; i++) {
        if (allRosters[i] && allRosters[i]._id) {
          rosterToEdit = allRosters[i];
          break;
        }
      }
      
      // If no roster with _id found, try the first one anyway
      if (!rosterToEdit && allRosters[0]) {
        rosterToEdit = allRosters[0];
      }
    } else if (allRosters && allRosters.data && Array.isArray(allRosters.data) && allRosters.data.length > 0) {
      // Handle nested data structure
      for (let i = 0; i < allRosters.data.length; i++) {
        if (allRosters.data[i] && allRosters.data[i]._id) {
          rosterToEdit = allRosters.data[i];
          break;
        }
      }
      
      if (!rosterToEdit && allRosters.data[0]) {
        rosterToEdit = allRosters.data[0];
      }
    } else if (allRosters && allRosters._id) {
      // Single roster object
      rosterToEdit = allRosters;
    } else if (allRosters && allRosters.success && allRosters.data && Array.isArray(allRosters.data) && allRosters.data.length > 0) {
      // Handle API response structure
      for (let i = 0; i < allRosters.data.length; i++) {
        if (allRosters.data[i] && allRosters.data[i]._id) {
          rosterToEdit = allRosters.data[i];
          break;
        }
      }
      
      if (!rosterToEdit && allRosters.data[0]) {
        rosterToEdit = allRosters.data[0];
      }
    }
    
    // Validate that we have a roster with _id
    if (!rosterToEdit) {
      toast.error("No valid roster found to edit");
      setBulkEditLoading(false);
      return;
    }
    
    if (!rosterToEdit._id) {
      toast.error("Selected roster doesn't have a valid ID");
      setBulkEditLoading(false);
      return;
    }
    
    // Set the selected roster ID and show bulk edit
    setSelectedRosterId(rosterToEdit._id);
    setShowBulkEdit(true);
    setBulkEditLoading(false);
    toast.success("Opening bulk edit...");
  };

  // FIXED: Handle bulk edit with loading state to prevent multiple clicks
  const handleBulkEditRoster = async () => {
    // Prevent multiple clicks while loading
    if (bulkEditLoading || waitingForData) {
      return;
    }
    
    try {
      setBulkEditLoading(true);
     // toast.info("Loading rosters...");
      
      // Clear any existing bulk edit state
      dispatch(clearBulkEditState());
      dispatch(clearBulkSaveState());
      
      // Fetch all rosters
      const result = await dispatch(fetchAllRosters({})).unwrap();
      
      // Check if we got any data back
      if (!result) {
        toast.error("No roster data received");
        setBulkEditLoading(false);
        return;
      }
      
      // Check if we have data in the result
      let hasData = false;
      if (Array.isArray(result) && result.length > 0) {
        hasData = true;
      } else if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        hasData = true;
      } else if (result && result._id) {
        hasData = true;
      }
      
      if (!hasData) {
        toast.error("No roster data available to edit");
        setBulkEditLoading(false);
        return;
      }
      
      // Set waiting flag to true - the useEffect will handle the rest
      setWaitingForData(true);
      
    } catch (error) {
      console.error("Error fetching rosters:", error);
      toast.error("Failed to load rosters. Please try again.");
      setBulkEditLoading(false);
      setWaitingForData(false);
    }
  };

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
      teamLeader: "",
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

  const executeSaveRoster = async () => {
    try {
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

      const rosterMonth = startDate.getMonth() + 1;
      const rosterYear = startDate.getFullYear();
      
      const firstDayOfMonth = new Date(rosterYear, rosterMonth - 1, 1);
      const pastDaysOfYear = Math.floor((startDate - firstDayOfMonth) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.max(1, Math.ceil((firstDayOfMonth.getDay() + pastDaysOfYear + 1) / 7));

      const rosterData = {
        month: rosterMonth,
        year: rosterYear,
        rosterStartDate: rosterDates.startDate,
        rosterEndDate: rosterDates.endDate,
        weekNumber: weekNumber,
        startDate: rosterDates.startDate,
        endDate: rosterDates.endDate,
        employees: employees.map((emp) => {
          const employeeData = {
            name: emp.name,
            transport: emp.transport || "",
            cabRoute: emp.cabRoute || "",
            teamLeader: emp.teamLeader || "",
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


      await dispatch(
        addRosterWeek({
          data: rosterData,
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
      case "HD":
        return "🌓";
      case "LWD":
        return "📅";
      default:
        return "📝";
    }
  };

  const calculateEmployeeSummary = (dailyStatus) => {
    if (!dailyStatus || !Array.isArray(dailyStatus)) {
      return { presents: 0, weekOffs: 0, leaves: 0, holidays: 0, halfDays: 0 };
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

    const halfDays = dailyStatus.filter((ds) => {
      const status = typeof ds === "object" ? ds.status : ds;
      return status === "HD";
    }).length;

    return { presents, weekOffs, leaves, holidays, halfDays };
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
    userId: emp.userId || null,
    rosterStartDate: rosterWeek.startDate, 
    rosterEndDate: rosterWeek.endDate 
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

//  const handleSaveEditedSaved = async () => {
//   try {
//     if (!editSavedEmployee) return;
    
    
//     // Find the correct month, year, and roster containing this employee
//     let month = null;
//     let year = null;
//     let foundRoster = null;
//     let foundWeek = null;
//     let rosterId = null;
    
//     // Search through all rosters to find the one containing this employee
//     if (allRosters && allRosters.length > 0) {
//       for (const roster of allRosters) {
//         if (roster.weeks && Array.isArray(roster.weeks)) {
//           for (const week of roster.weeks) {
//             if (week.weekNumber === editSavedEmployee.weekNumber) {
//               // Check if this week contains the employee
//               const employeeExists = week.employees.some(emp => {
//                 // Compare as strings to ensure proper matching
//                 const empId = emp._id?.toString();
//                 const targetId = editSavedEmployee._id?.toString();
//                 const userId = emp.userId?.toString();
//                 const targetUserId = editSavedEmployee.userId?.toString();
                
//                 return empId === targetId || (userId && userId === targetUserId);
//               });
              
//               if (employeeExists) {
//                 foundRoster = roster;
//                 foundWeek = week;
//                 month = roster.month;
//                 year = roster.year;
//                 rosterId = roster._id;
             
//                 break;
//               }
//             }
//           }
//         }
//         if (foundRoster) break;
//       }
//     }
    
//     if (!month || !year) {
//       console.error("Could not determine month/year from allRosters:", allRosters);
//       return toast.error("Could not determine roster month/year");
//     }
    
//     const employeeId = editSavedEmployee._id;
//     if (!employeeId) {
//       console.error("Missing employee ID in editSavedEmployee");
//       return toast.error("Employee ID is missing");
//     }
    
    
    
//     const startDate = new Date(editSavedEmployee.startDate);
//     const dailyStatusObjects = editSavedEmployee.dailyStatus.map((status, idx) => {
//       const date = new Date(startDate);
//       date.setDate(date.getDate() + idx);
//       return { date: date.toISOString(), status: status || "P" };
//     });

//     const updates = {
//       name: editSavedEmployee.name,
//       transport: editSavedEmployee.transport,
//       cabRoute: editSavedEmployee.cabRoute,
//       teamLeader: editSavedEmployee.teamLeader || "",
//       shiftStartHour: editSavedEmployee.shiftStartHour === "" ? undefined : parseInt(editSavedEmployee.shiftStartHour),
//       shiftEndHour: editSavedEmployee.shiftEndHour === "" ? undefined : parseInt(editSavedEmployee.shiftEndHour),
//       dailyStatus: dailyStatusObjects,
//     };

//     // Add a flag to indicate this is a regular edit (not bulk edit)
//     // This will be used by the backend to determine whether to log to history
//     const options = {
//       skipHistory: true // Add this flag to skip logging to edit history
//     };

//     // Try with rosterId first (more specific)
//     let result;
//     if (rosterId) {
//       result = await dispatch(
//         updateRosterEmployee({
//           month,
//           year,
//           weekNumber: editSavedEmployee.weekNumber,
//           employeeId: employeeId,
//           rosterId: rosterId,
//           updates,
//           skipHistory: true // Pass the flag to the action
//         })
//       ).unwrap();
//     } else {
//       result = await dispatch(
//         updateRosterEmployee({
//           month,
//           year,
//           weekNumber: editSavedEmployee.weekNumber,
//           employeeId: employeeId,
//           updates,
//           skipHistory: true // Pass the flag to the action
//         })
//       ).unwrap();
//     }

    
//     await dispatch(fetchAllRosters({})).unwrap();
//     setShowEditModal(false);
//     setEditSavedEmployee(null);
//     toast.success("Employee updated successfully");
//   } catch (err) {
//     console.error("Update error in component:", err);
    
//     const errorMessage = err?.message || err || "Failed to update employee";
    
//     if (errorMessage.includes("not found") || errorMessage.includes("No employee found")) {
//       toast.error("Employee not found. It may have been moved or deleted. Refreshing data...");
//       await dispatch(fetchAllRosters({})).unwrap();
//       setShowEditModal(false);
//       setEditSavedEmployee(null);
//     } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
//       toast.error("You don't have permission to edit this employee");
//     } else {
//       toast.error(errorMessage);
//     }
//   }
// };

  // UPDATED: Handle delete button click with proper validation and debugging
  
  
  const handleSaveEditedSaved = async () => {
  try {
    if (!editSavedEmployee) return;
    
    
    // Find the correct month, year, and roster containing this employee
    let month = null;
    let year = null;
    let foundRoster = null;
    let foundWeek = null;
    let rosterId = null;
    
    // Search through all rosters to find the one containing this employee
    if (allRosters && allRosters.length > 0) {
      for (const roster of allRosters) {
        if (roster.weeks && Array.isArray(roster.weeks)) {
          for (const week of roster.weeks) {
            if (week.weekNumber === editSavedEmployee.weekNumber) {
              // Check if this week contains the employee
              const employeeExists = week.employees.some(emp => {
                // Compare as strings to ensure proper matching
                const empId = emp._id?.toString();
                const targetId = editSavedEmployee._id?.toString();
                const userId = emp.userId?.toString();
                const targetUserId = editSavedEmployee.userId?.toString();
                
                return empId === targetId || (userId && userId === targetUserId);
              });
              
              if (employeeExists) {
                foundRoster = roster;
                foundWeek = week;
                month = roster.month;
                year = roster.year;
                rosterId = roster._id;
             
                break;
              }
            }
          }
        }
        if (foundRoster) break;
      }
    }
    
    if (!month || !year) {
      console.error("Could not determine month/year from allRosters:", allRosters);
      return toast.error("Could not determine roster month/year");
    }
    
    const employeeId = editSavedEmployee._id;
    if (!employeeId) {
      console.error("Missing employee ID in editSavedEmployee");
      return toast.error("Employee ID is missing");
    }
    
    
    
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
      teamLeader: editSavedEmployee.teamLeader || "",
      shiftStartHour: editSavedEmployee.shiftStartHour === "" ? undefined : parseInt(editSavedEmployee.shiftStartHour),
      shiftEndHour: editSavedEmployee.shiftEndHour === "" ? undefined : parseInt(editSavedEmployee.shiftEndHour),
      dailyStatus: dailyStatusObjects,
    };

    // Add skipHistory flag to prevent logging in bulk edit history
    const skipHistory = true;

    // Try with rosterId first (more specific)
    let result;
    if (rosterId) {
      result = await dispatch(
        updateRosterEmployee({
          month,
          year,
          weekNumber: editSavedEmployee.weekNumber,
          employeeId: employeeId,
          rosterId: rosterId,
          updates,
          skipHistory: skipHistory // Pass the flag
        })
      ).unwrap();
    } else {
      result = await dispatch(
        updateRosterEmployee({
          month,
          year,
          weekNumber: editSavedEmployee.weekNumber,
          employeeId: employeeId,
          updates,
          skipHistory: skipHistory // Pass the flag
        })
      ).unwrap();
    }

    
    await dispatch(fetchAllRosters({})).unwrap();
    setShowEditModal(false);
    setEditSavedEmployee(null);
    toast.success("Employee updated successfully");
  } catch (err) {
    console.error("Update error in component:", err);
    
    const errorMessage = err?.message || err || "Failed to update employee";
    
    if (errorMessage.includes("not found") || errorMessage.includes("No employee found")) {
      toast.error("Employee not found. It may have been moved or deleted. Refreshing data...");
      await dispatch(fetchAllRosters({})).unwrap();
      setShowEditModal(false);
      setEditSavedEmployee(null);
    } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      toast.error("You don't have permission to edit this employee");
    } else {
      toast.error(errorMessage);
    }
  }
};
  
  const handleDeleteSaved = (emp, rosterWeek) => {
    
    
    // Validate employee data
    if (!emp || !emp._id) {
      console.error("Invalid employee data - missing ID");
      toast.error("Invalid employee data - cannot delete");
      return;
    }
    
    // Validate week data
    if (!rosterWeek || !rosterWeek.weekNumber) {
      console.error("Invalid week data - missing week number");
      toast.error("Invalid week data - cannot delete");
      return;
    }

    // Find the correct roster ID from the data structure
    let rosterId = null;
    
    if (allRosters && allRosters.length > 0) {
      // Check the structure of your data
      
      // Your data has _id at the top level of each roster object
      if (allRosters[0]._id) {
        rosterId = allRosters[0]._id;
      }
      // Check if data is nested
      else if (allRosters[0].data && allRosters[0].data.length > 0) {
        if (allRosters[0].data[0]._id) {
          rosterId = allRosters[0].data[0]._id;
        }
      }
    }
    
    if (!rosterId) {
      console.error("Could not find roster ID in the data");
      toast.error("Could not determine roster ID. Please refresh and try again.");
      return;
    }

   

    setEmployeeToDelete({
      employeeId: emp._id,
      name: emp.name || "Unknown",
      userId: emp.userId || null,
      weekNumber: rosterWeek.weekNumber,
      rosterId: rosterId
    });
    setShowDeleteModal(true);
  };

  // UPDATED: Confirm and execute deletion with better error handling
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) {
      toast.error("Missing delete information");
      return;
    }

    // Validate all required fields
    if (!employeeToDelete.rosterId) {
      console.error("Missing rosterId in employeeToDelete:", employeeToDelete);
      toast.error("Missing roster ID");
      return;
    }
    
    if (!employeeToDelete.weekNumber) {
      console.error("Missing weekNumber in employeeToDelete:", employeeToDelete);
      toast.error("Missing week number");
      return;
    }

    if (!employeeToDelete.employeeId && !employeeToDelete.userId) {
      console.error("Missing both employeeId and userId in employeeToDelete:", employeeToDelete);
      toast.error("Missing employee identifier");
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
        // Delete by employeeId (using the _id from the employee object)
        deletePromise = dispatch(deleteEmployeeFromRoster({
          rosterId: employeeToDelete.rosterId,
          weekNumber: employeeToDelete.weekNumber,
          employeeId: employeeToDelete.employeeId
        }));
      }

      const result = await deletePromise.unwrap();
      
      // Refresh the saved roster data
      await dispatch(fetchAllRosters({})).unwrap();
      
      // Close modal and show success
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      toast.success("Employee deleted successfully");
      
    } catch (err) {
      
      // Handle specific error messages
      const errorMessage = err?.message || err || "Failed to delete employee";
      
      if (errorMessage.includes("not found") || errorMessage.includes("No employee found")) {
        toast.error("Employee not found. It may have been already deleted. Refreshing data...");
        // Refresh data to sync with server
        await dispatch(fetchAllRosters({})).unwrap();
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // ========== FIXED renderSavedRosterTable - NO useEffect inside ==========
  const renderSavedRosterTable = () => {
    if (rosterDetailLoading) {
      return (
        <div className="flex justify-center items-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 font-medium">Loading saved roster...</span>
        </div>
      );
    }

    if (!allRosters || !Array.isArray(allRosters) || allRosters.length === 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-800 font-medium">No saved roster data found.</p>
        </div>
      );
    }

    const currentRoster = allRosters[0];
    const weeks = currentRoster?.weeks || [];
    
    // ========== FIX: Group weeks by weekNumber and merge employees ==========
    const weeksMap = new Map();
    
    weeks.forEach(week => {
      const weekKey = week.weekNumber.toString();
      
      if (!weeksMap.has(weekKey)) {
        // Create a new week entry for this week number
        weeksMap.set(weekKey, {
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          _id: week._id,
          employees: []
        });
      }
      
      // Add all employees from this week entry
      const existingWeek = weeksMap.get(weekKey);
      if (week.employees && week.employees.length > 0) {
        week.employees.forEach(emp => {
          // Check if employee already exists (by _id to avoid duplicates)
          const employeeExists = existingWeek.employees.some(e => e._id === emp._id);
          if (!employeeExists) {
            existingWeek.employees.push(emp);
          }
        });
      }
    });
    
    // Convert map to array and sort by weekNumber
    const groupedWeeks = Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
    
    
    const getLatestWeekWithEmployees = () => {
      for (let i = groupedWeeks.length - 1; i >= 0; i--) {
        const week = groupedWeeks[i];
        if (week?.employees && week.employees.length > 0) {
          return week;
        }
      }
      return groupedWeeks[groupedWeeks.length - 1] || null;
    };

    let rosterWeek = selectedWeek;
    
    // If selectedWeek exists, find it in groupedWeeks
    if (selectedWeek) {
      rosterWeek = groupedWeeks.find(w => w.weekNumber === selectedWeek.weekNumber);
    }
    
    // If no valid selectedWeek, get the latest week with employees
    if (!rosterWeek) {
      rosterWeek = getLatestWeekWithEmployees();
    }
    
    if (!rosterWeek) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
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
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      );
    }

    if (!rosterWeek.employees || rosterWeek.employees.length === 0) {
      const weeksWithEmployees = groupedWeeks.filter(week => 
        week.weekNumber !== rosterWeek.weekNumber && 
        week.employees && 
        week.employees.length > 0
      );
      
      return (
        <div className="mt-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 mb-6">
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors shadow-sm"
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
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          
          {groupedWeeks.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-slate-700 mb-2">All Weeks in Roster:</h4>
              <div className="flex flex-wrap gap-2">
                {groupedWeeks.map((week, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedWeek(week)} 
                    className={`px-3 py-1 rounded text-sm ${
                      rosterWeek.weekNumber === week.weekNumber 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-slate-300' : ''}`}
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
    const filteredEmployees = getFilteredEmployees(rosterWeek.employees);

    return (
      <div className="mt-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Saved Data</p>
              <h3 className="text-xl font-semibold text-slate-900">Saved Roster</h3>
              <p className="text-slate-600">
                Week {rosterWeek.weekNumber} • {formatDate(rosterWeek.startDate)} to {formatDate(rosterWeek.endDate)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Total Employees: {rosterWeek.employees.length} 
                {rosterWeek.employees.length > 0 && (
                  <span className="ml-2 text-gray-600">
                    (Departments: {[...new Set(rosterWeek.employees.map(e => e.department))].filter(Boolean).join(', ')})
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setShowSavedRoster(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Close</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-gray-800">{weeklySummaryLocal.totalEmployees}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-green-600">{weeklySummaryLocal.totalPresents}</div>
              <div className="text-sm text-gray-600">Total Presents</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-blue-600">{weeklySummaryLocal.totalWeekOffs}</div>
              <div className="text-sm text-gray-600">Total Week Offs</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-red-600">{weeklySummaryLocal.totalLeaves}</div>
              <div className="text-sm text-gray-600">Total Leaves</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Week {rosterWeek.weekNumber} Employee Roster
                </h3>
                {/* Department Filter Button */}
                <button
                  onClick={() => setShowDepartmentFilter(!showDepartmentFilter)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm shadow-sm flex items-center gap-2"
                >
                  <span>🔍</span>
                  {showDepartmentFilter ? 'Hide Filter' : 'Filter by Department'}
                </button>
              </div>
              
              {groupedWeeks.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Switch Week:</span>
                  <select 
                    value={rosterWeek.weekNumber} 
                    onChange={(e) => {
                      const weekNumber = parseInt(e.target.value);
                      const week = groupedWeeks.find(w => w.weekNumber === weekNumber);
                      if (week) setSelectedWeek(week);
                    }}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-700"
                  >
                    {groupedWeeks.map((week, index) => (
                      <option key={index} value={week.weekNumber}>
                        Week {week.weekNumber} ({week.employees?.length || 0} employees)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Department Filter Dropdown */}
            {showDepartmentFilter && (
              <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select Department
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={handleDepartmentFilter}
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                    >
                      <option value="">All Departments</option>
                      {availableDepartments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {departmentFilter && (
                    <button
                      onClick={clearDepartmentFilter}
                      className="mt-4 md:mt-7 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                {departmentFilter && (
                  <div className="mt-2 text-sm text-purple-600">
                    Showing employees from: <span className="font-semibold">{departmentFilter}</span> ({filteredEmployees.length} of {rosterWeek.employees.length} employees)
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100/90">
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Name</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Department</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Transport</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">CAB Route</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Team Leader</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Shift Hours</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Weekly Status</th>
                  <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const empSummary = calculateEmployeeSummary(emp.dailyStatus);
                  return (
                    <tr key={emp._id || index} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="border border-slate-200 p-3 text-gray-800 font-medium">{emp.name}</td>
                      <td className="border border-slate-200 p-3 text-gray-800">{emp.department || "-"}</td>
                      <td className="border border-slate-200 p-3 text-gray-800">{emp.transport || "-"}</td>
                      <td className="border border-slate-200 p-3 text-gray-800">{emp.cabRoute || "-"}</td>
                      <td className="border border-slate-200 p-3 text-gray-800">{emp.teamLeader || "-"}</td>
                      <td className="border border-slate-200 p-3 text-gray-800">
                        {emp.isCoreTeam ? "N/A" : formatShiftHours(emp.shiftStartHour, emp.shiftEndHour)}
                      </td>
                      <td className="border border-slate-200 p-3">
                        <div className="mb-2">
                          <div className="flex space-x-2 mb-1">
                            <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
                            <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
                            <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>
                            {empSummary.holidays > 0 && <span className="text-xs text-purple-600">🎉 {empSummary.holidays}H</span>}
                            {empSummary.halfDays > 0 && <span className="text-xs text-amber-600">🌓 {empSummary.halfDays}HD</span>}
                          </div>
                          <div className="flex space-x-1">
                            {emp.dailyStatus && emp.dailyStatus.map((ds, dayIndex) => {
                              const status = typeof ds === "object" ? ds.status : ds;
                              // Get the date for this day - FIXED: Use rosterWeek.startDate instead of rosterDates.startDate
                              let dateStr = "";
                              if (rosterWeek?.startDate) {
                                const statusDate = new Date(rosterWeek.startDate);
                                statusDate.setDate(statusDate.getDate() + dayIndex);
                                dateStr = statusDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                              }
                              
                              return (
                                <div
                                  key={dayIndex}
                                  className={`w-10 h-10 flex flex-col items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" :
                                    status === "WO" ? "bg-blue-100 border-blue-300" :
                                      status === "L" ? "bg-red-100 border-red-300" :
                                        status === "HD" ? "bg-amber-100 border-amber-300" :
                                        status === "H" ? "bg-purple-100 border-purple-300" :
                                          "bg-gray-100 border-gray-300"
                                    }`}
                                  title={`${daysOfWeek[dayIndex % 7]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : status === "HD" ? "Half Day" : status === "H" ? "Holiday" : status}`}
                                >
                                  <span className="text-base">{getStatusIcon(status)}</span>
                                  <span className="text-[8px] leading-tight">{dateStr}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="border border-slate-200 p-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditSaved(emp, rosterWeek)} 
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteSaved(emp, rosterWeek)} 
                            disabled={deleteLoading && employeeToDelete?.employeeId === emp._id}
                            className={`bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-md text-sm ${
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
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      {departmentFilter ? (
                        <>No employees found in <span className="font-semibold">{departmentFilter}</span> department.</>
                      ) : (
                        'No employees in this week.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredEmployees.length > itemsPerPage && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">
                  Page {currentPage} of {Math.ceil(filteredEmployees.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredEmployees.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredEmployees.length / itemsPerPage)}
                  className="px-3 py-1 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {groupedWeeks.length > 1 && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Quick Week Navigation:</h4>
            <div className="flex flex-wrap gap-2">
              {groupedWeeks.map((week, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedWeek(week)} 
                  className={`px-3 py-1 rounded text-sm ${
                    rosterWeek.weekNumber === week.weekNumber 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  } ${(!week.employees || week.employees.length === 0) ? 'border border-dashed border-slate-300 opacity-75' : ''}`}
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
    <>
      <AdminNavbar />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col mt-10 [&_button]:cursor-pointer [&_select]:cursor-pointer">
        <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Roster Workspace</p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Roster Management</h1>
              <p className="text-slate-600 mt-2">Manage weekly roster with day-wise status tracking</p>
            </div>
            <div className="flex flex-col items-end sm:flex-row gap-2 w-full lg:w-auto">
              <button
                onClick={handleBulkEditRoster}
                disabled={bulkEditLoading || waitingForData}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm ${
                  bulkEditLoading || waitingForData
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {bulkEditLoading || waitingForData ? 'Loading...' : 'Bulk Edit Roster'}
              </button>

              <button
                onClick={() => setShowCopyPopup(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Auto-Propagate
              </button>

              <button
                onClick={handleExportSavedRoster}
                disabled={savedExportLoading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savedExportLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Roster
                  </>
                )}
              </button>

              <button
                onClick={handleViewSavedRoster}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
                </svg>
                View Saved Roster
              </button>
            </div>
          </div>
        </div>
        
        {showBulkEdit && selectedRosterId && (
          <RosterBulkEditForm
            rosterId={selectedRosterId}
            onClose={() => {
              setShowBulkEdit(false);
              setSelectedRosterId(null);
              setBulkEditLoading(false);
              setWaitingForData(false);
              dispatch(fetchAllRosters({}));
            }}
          />
        )}
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6" ref={formRef}>
            {showSavedRoster && renderSavedRosterTable()}
            
            {!showSavedRoster && employees.length > 0 && (
              <div className="mb-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Weekly Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-gray-800">{weeklySummary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Total Employees</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-green-600">{weeklySummary.totalPresents}</div>
                    <div className="text-sm text-gray-600">Total Presents</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalWeekOffs}</div>
                    <div className="text-sm text-gray-600">Total Week Offs</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-red-600">{weeklySummary.totalLeaves}</div>
                    <div className="text-sm text-gray-600">Total Leaves</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-slate-700 mb-2">Day-wise Status Overview</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day, dayIndex) => {
                      const daySummary = weeklySummary.dayWiseSummary[dayIndex];
                      const dateStr = getDateForDay(rosterDates.startDate, dayIndex);
                      return (
                        <div key={dayIndex} className={`bg-slate-50 rounded-xl p-3 text-center border border-slate-200 transition-all hover:shadow-sm ${selectedDayOverview === dayIndex ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedDayOverview(selectedDayOverview === dayIndex ? null : dayIndex)}>
                          <div className="font-semibold text-gray-800">{day}</div>
                          <div className="text-xs text-gray-500 mb-1">{dateStr}</div>
                          <div className="mt-1 space-y-1">
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
                  <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
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
                <div className="bg-white p-5 rounded-2xl mb-6 border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-slate-900">Add Employee</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input ref={inputRef} type="text" name="name" value={employeeInput.name} onChange={handleInputChange} placeholder="Name *" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required />
                    <select name="transport" value={employeeInput.transport} onChange={handleInputChange} className="border border-slate-300 p-3 rounded-lg text-gray-800 bg-white">
                      <option value="" className="text-gray-500">Transport?</option>
                      <option value="Yes" className="text-gray-800">Yes</option>
                      <option value="No" className="text-gray-800">No</option>
                    </select>
                    <input type="text" name="cabRoute" value={employeeInput.cabRoute} onChange={handleInputChange} placeholder="CAB Route" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" />
                    <input type="text" name="teamLeader" value={employeeInput.teamLeader || ""} onChange={handleInputChange} placeholder="Team Leader (Optional)" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" />
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
                          className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 w-full bg-white" 
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
                          className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 w-full bg-white" 
                          required 
                        />
                      </div>
                    </div>

                    {!employeeInput.isCoreTeam && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" name="shiftStartHour" value={employeeInput.shiftStartHour} onChange={handleInputChange} placeholder="Start Hour (0-23) *" min="0" max="23" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required={!employeeInput.isCoreTeam} />
                          <input type="number" name="shiftEndHour" value={employeeInput.shiftEndHour} onChange={handleInputChange} placeholder="End Hour (0-23) *" min="0" max="23" className="border border-slate-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 bg-white" required={!employeeInput.isCoreTeam} />
                        </div>
                      </>
                    )}
                    <button type="button" onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium shadow-sm">{editIndex !== null ? "Update Employee" : "Add Employee"}</button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-gray-800">Daily Status for <span className="text-blue-600">{employeeInput.name || "Selected Employee"}</span></h3>
                    <div className="grid grid-cols-7 gap-2">
                      {daysOfWeek.map((day, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
                          <span className="text-xs text-gray-500 mb-1">{getDateForDay(rosterDates.startDate, i)}</span>
                          <select 
                            name={`day${i}`} 
                            value={employeeInput.dailyStatus[i]} 
                            onChange={(e) => handleInputChange(e, i)} 
                            className={`border p-2 rounded-lg w-full text-center text-gray-800 ${
                              employeeInput.dailyStatus[i] === "P" ? "border-green-300 bg-green-50" : 
                              employeeInput.dailyStatus[i] === "WO" ? "border-blue-300 bg-blue-50" : 
                              employeeInput.dailyStatus[i] === "L" ? "border-red-300 bg-red-50" : 
                              employeeInput.dailyStatus[i] === "NCNS" ? "border-red-400 bg-red-100" : 
                              employeeInput.dailyStatus[i] === "UL" ? "border-orange-300 bg-orange-50" : 
                              employeeInput.dailyStatus[i] === "LWP" ? "border-yellow-300 bg-yellow-50" : 
                              employeeInput.dailyStatus[i] === "BL" ? "border-purple-300 bg-purple-50" : 
                              employeeInput.dailyStatus[i] === "H" ? "border-purple-400 bg-purple-100" : 
                              employeeInput.dailyStatus[i] === "HD" ? "border-amber-400 bg-amber-100" :
                              employeeInput.dailyStatus[i] === "LWD" ? "border-yellow-400 bg-yellow-100" :
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
                            <option value="HD" className="text-amber-700">Half Day (HD)</option>
                            <option value="LWD" className="text-yellow-700">Last Working Day (LWD)</option>
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
                            {employeeInput.dailyStatus[i] === "HD" && "🌓"}
                            {employeeInput.dailyStatus[i] === "LWD" && "📅"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {employees.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Employee Roster ({employees.length})</h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100/90">
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Name</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Transport</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">CAB Route</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Shift Hours</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Weekly Status</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-gray-800">Actions</th>
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
                              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80">
                                <td className="border border-slate-200 p-3 text-gray-800 font-medium">{emp.name}</td>
                                <td className="border border-slate-200 p-3 text-gray-800">{emp.transport || "-"}</td>
                                <td className="border border-slate-200 p-3 text-gray-800">{emp.cabRoute || "-"}</td>
                                <td className="border border-slate-200 p-3 text-gray-800">{emp.isCoreTeam ? "N/A" : `${emp.shiftStartHour || 0}:00 - ${emp.shiftEndHour || 0}:00`}</td>
                                <td className="border border-slate-200 p-3">
                                  <div className="mb-2">
                                    <div className="flex space-x-2 mb-1">
                                      <span className="text-xs text-green-600">✅ {empSummary.presents}P</span>
                                      <span className="text-xs text-blue-600">🗓️ {empSummary.weekOffs}WO</span>
                                      <span className="text-xs text-red-600">❌ {empSummary.leaves}L</span>
                                    </div>
                                    <div className="flex space-x-1">
                                      {emp.dailyStatus.map((status, dayIndex) => {
                                        const dateStr = getDateForDay(rosterDates.startDate, dayIndex);
                                        return (
                                          <div key={dayIndex} className={`w-10 h-10 flex flex-col items-center justify-center rounded border cursor-pointer ${status === "P" ? "bg-green-100 border-green-300" : status === "WO" ? "bg-blue-100 border-blue-300" : status === "L" ? "bg-red-100 border-red-300" : status === "HD" ? "bg-amber-100 border-amber-300" : "bg-gray-100 border-gray-300"}`} title={`${daysOfWeek[dayIndex]}: ${status === "P" ? "Present" : status === "WO" ? "Week Off" : status === "L" ? "Leave" : status === "HD" ? "Half Day" : status}`}>
                                            <span className="text-base">{getStatusIcon(status)}</span>
                                            <span className="text-[8px] leading-tight">{dateStr}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-slate-200 p-3">
                                  <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(index)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm">Edit</button>
                                    <button onClick={() => handleRemoveEmployee(index)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-md text-sm">Remove</button>
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

                <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 py-4 mt-6">
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
                      <button onClick={handleSaveRoster} disabled={loading || employees.length === 0} className={`px-6 py-3 rounded-lg font-medium ${loading || employees.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
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

      {/* Save Modal */}
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

      {/* Export Modal */}
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

      {/* Edit Modal - FIXED */}
      {showEditModal && editSavedEmployee && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
              <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>

            {/* Add Roster Period Display */}
            {editSavedEmployee.rosterStartDate && editSavedEmployee.rosterEndDate && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Roster Period:</span> {formatDateDisplay(editSavedEmployee.rosterStartDate)} to {formatDateDisplay(editSavedEmployee.rosterEndDate)}
                </p>
              </div>
            )}

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
              
              <div className="relative">
                <input
                  type="text"
                  name="teamLeader"
                  value={editSavedEmployee.teamLeader || ""}
                  onChange={handleEditSavedChange}
                  className="peer w-full border border-gray-300 rounded p-3 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
                />
                <label className="absolute left-3 top-3 text-gray-500 bg-white px-1 transition-all
                  peer-placeholder-shown:top-3.5
                  peer-focus:-top-2
                  peer-focus:text-sm
                  peer-focus:text-blue-500">
                  Team Leader
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
                {daysOfWeek.map((day, i) => {
                  // FIXED: Use the roster start date from editSavedEmployee.rosterStartDate instead of editSavedEmployee.startDate
                  const dateStr = editSavedEmployee.rosterStartDate ? 
                    getDateForDay(editSavedEmployee.rosterStartDate, i) : 
                    getDateForDay(editSavedEmployee.startDate, i);
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-sm mb-1 font-medium text-gray-700">{day}</span>
                      <span className="text-xs text-gray-500 mb-1">{dateStr}</span>
                      <select 
                        name={`day${i}`} 
                        value={editSavedEmployee.dailyStatus[i]} 
                        onChange={(e) => handleEditSavedChange(e, i)} 
                        className="border p-2 rounded w-full text-center text-gray-800"
                      >
                        <option value="P">Present (P)</option>
                        <option value="WO">Week Off (WO)</option>
                        <option value="L">Leave (L)</option>
                        <option value="NCNS">NCNS (L)</option>
                        <option value="UL">UL (L)</option>
                        <option value="LWP">LWP (L)</option>
                        <option value="BL">BL (L)</option>
                        <option value="H">Holiday (H)</option>
                        <option value="HD">Half Day (HD)</option>
                        <option value="LWD">Last Working Day(LWD)</option>
                      </select>
                      <div className="mt-1 text-lg">
                        {editSavedEmployee.dailyStatus[i] === "P" && "✅"}
                        {editSavedEmployee.dailyStatus[i] === "WO" && "🗓️"}
                        {editSavedEmployee.dailyStatus[i] === "L" && "❌"}
                        {editSavedEmployee.dailyStatus[i] === "NCNS" && "🚫"}
                        {editSavedEmployee.dailyStatus[i] === "UL" && "💸"}
                        {editSavedEmployee.dailyStatus[i] === "LWP" && "💰"}
                        {editSavedEmployee.dailyStatus[i] === "BL" && "⚫"}
                        {editSavedEmployee.dailyStatus[i] === "H" && "🎉"}
                        {editSavedEmployee.dailyStatus[i] === "HD" && "🌓"}
                        {editSavedEmployee.dailyStatus[i] === "LWD" && "📅"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => { setShowEditModal(false); setEditSavedEmployee(null); }} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleSaveEditedSaved} className="px-4 py-2 rounded bg-green-500 text-white">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                  <li>• Employee ID: {employeeToDelete.employeeId?.substring(0, 8)}...</li>
                  <li>• Roster ID: {employeeToDelete.rosterId?.substring(0, 8)}...</li>
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
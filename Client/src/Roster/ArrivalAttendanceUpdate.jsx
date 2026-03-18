import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateArrivalTime,
  updateAttendance,
  updateAttendanceBulk,
  getEmployeesForUpdates,
  updatePunchTimes,
  bulkUpdatePunchTimes,
} from "../features/slices/rosterSlice.js";
import Navbar from "../pages/Navbar.jsx";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { Clock, CheckCircle, AlertCircle, Truck, Users, ChevronLeft, ChevronRight, Sun, Moon, Coffee } from "lucide-react";
import { toast } from "react-toastify";

// 🔹 Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

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

const getLocalDateKey = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().split("T")[0];
};

const toLocalDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return getLocalDateKey(new Date(value));
};

// Time validation function
const isValidTimeFormat = (time) => {
  if (!time || time === "") return true;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Function to determine HR attendance based on hours worked
const getHRAttendanceFromHours = (hours) => {
  if (!hours) return null;
  if (hours >= 8.5) return "P";
  if (hours >= 5 && hours < 8.5) return "HD";
  if (hours > 0 && hours < 5) return "LWP";
  return null;
};

const formatTimeForInput = (dateString) => {
  if (!dateString) return '';
  
  // If it's already in HH:MM format, return as is
  if (typeof dateString === "string" && /^\d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle ISO date strings from API
  if (typeof dateString === "string" && dateString.includes("T")) {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      
      // Get hours and minutes in local time
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  }
  
  return '';
};

// FIXED: Format time for display (HH:MM AM/PM) - Uses local time
const formatTimeForDisplay = (dateString) => {
  if (!dateString) return '--:-- --';
  
  // If it's already in HH:MM format, convert to 12-hour format
  if (typeof dateString === "string" && /^\d{2}:\d{2}$/.test(dateString)) {
    const [hours, minutes] = dateString.split(':').map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  }
  
  // Handle ISO date strings from API
  if (typeof dateString === "string" && dateString.includes("T")) {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '--:-- --';
      
      // Get hours and minutes in local time (browser will handle timezone)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      const suffix = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
    } catch (e) {
      return '--:-- --';
    }
  }
  
  return '--:-- --';
};

const formatShift = (startHour, endHour) => {
  const isEmpty = (v) => v === null || v === undefined || v === "";
  const toHour = (v) => {
    if (isEmpty(v)) return null;
    const n = Number.parseInt(String(v), 10);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  const start = toHour(startHour);
  const end = toHour(endHour);
  if (start === null && end === null) return "-";

  const startLabel = start === null ? "??" : start;
  const endLabel = end === null ? "??" : end;
  return `${startLabel}:00 - ${endLabel}:00`;
};

const getStatusColor = (status) => {
  const option = STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.color || "bg-gray-100 text-gray-800";
};

const ArrivalAttendanceUpdate = ({ rosterId }) => {
  const dispatch = useDispatch();
  const currentUser = getCurrentUser();
  const { updateEmployeesData, loading } = useSelector((state) => state.roster);
  
  // Use ref to track if initial fetch has been done
  const initialFetchDone = useRef(false);
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey());
  const [selectedWeek, setSelectedWeek] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tableTheme, setTableTheme] = useState("dark");
  const [updates, setUpdates] = useState({});
  const [searchBy, setSearchBy] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewType, setViewType] = useState({});
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [bulkUpdate, setBulkUpdate] = useState({
    transportStatus: "",
    departmentStatus: "",
    arrivalTime: "",
    punchIn: "",
    punchOut: ""
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [punchTimeErrors, setPunchTimeErrors] = useState({});

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
      const weekNumber = parseInt(selectedWeek);
      const currentData = updateEmployeesData?.data;
      const currentPagination = currentData?.pagination;
      const currentLimit =
        currentPagination?.limit ?? currentPagination?.pageSize ?? currentPagination?.perPage;
      const currentDateKeyRaw = currentData?.requestedDate ?? currentData?.date ?? null;
      const currentDateKey = currentDateKeyRaw ? toLocalDateKey(currentDateKeyRaw) : null;
      const requestedDateKey = toLocalDateKey(selectedDate);

      const isSameRequest =
        currentData &&
        String(currentData.rosterId) === String(rosterId) &&
        String(currentData.weekNumber) === String(weekNumber) &&
        (!currentDateKey || currentDateKey === requestedDateKey) &&
        String(currentData.q || "") === String(appliedSearch || "") &&
        String(currentData.searchBy || "all") === String(searchBy || "all") &&
        (currentPagination?.page == null || Number(currentPagination.page) === Number(currentPage)) &&
        (currentLimit == null || Number(currentLimit) === Number(pageSize));

      if (isSameRequest) return;

      dispatch(getEmployeesForUpdates({
        rosterId,
        weekNumber,
        date: selectedDate,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy
      }));
    }
  }, [dispatch, rosterId, selectedWeek, selectedDate, currentPage, pageSize, appliedSearch, searchBy]);

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
    if (pagination?.page != null) {
      const nextPage = Number(pagination.page);
      setCurrentPage((prev) => (Number(prev) === nextPage ? prev : nextPage));
    }
  }, [pagination?.page]);

  useEffect(() => {
    setSelectedEmployeeIds([]);
  }, [rosterId, selectedWeek, selectedDate]);

  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedSearch(String(searchInput || "").trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, searchBy]);

  useEffect(() => {
    const currentIds = new Set(rosterEntries.map((e) => String(e._id)));
    setSelectedEmployeeIds((prev) => prev.filter((id) => currentIds.has(String(id))));
  }, [rosterEntries]);

  // Handle punch in change
  const handlePunchInChange = (employeeId, value) => {
    if (!isValidTimeFormat(value) && value !== "") {
      setPunchTimeErrors(prev => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], punchIn: "Invalid time format (HH:MM)" }
      }));
    } else {
      setPunchTimeErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[employeeId]) delete newErrors[employeeId].punchIn;
        if (newErrors[employeeId] && Object.keys(newErrors[employeeId]).length === 0) {
          delete newErrors[employeeId];
        }
        return newErrors;
      });
    }

    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        punchIn: value
      }
    }));
  };

  // Handle punch out change
  const handlePunchOutChange = (employeeId, value) => {
    if (!isValidTimeFormat(value) && value !== "") {
      setPunchTimeErrors(prev => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], punchOut: "Invalid time format (HH:MM)" }
      }));
    } else {
      setPunchTimeErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[employeeId]) delete newErrors[employeeId].punchOut;
        if (newErrors[employeeId] && Object.keys(newErrors[employeeId]).length === 0) {
          delete newErrors[employeeId];
        }
        return newErrors;
      });
    }

    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        punchOut: value
      }
    }));
  };

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

  const clearEmployeeUpdateField = (employeeId, field) => {
    setUpdates((prev) => {
      const existing = prev?.[employeeId];
      if (!existing) return prev;
      const nextEmployee = { ...existing };
      delete nextEmployee[field];
      const hasAny = Object.values(nextEmployee).some((v) => v !== undefined && v !== "");
      const next = { ...prev };
      if (!hasAny) {
        delete next[employeeId];
      } else {
        next[employeeId] = nextEmployee;
      }
      return next;
    });
  };

  const refetchEmployees = () => {
    if (!rosterId || !selectedWeek || !selectedDate) return;
    dispatch(
      getEmployeesForUpdates({
        rosterId,
        weekNumber: parseInt(selectedWeek),
        date: selectedDate,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy,
      })
    );
  };

  // Handle punch time update
  const handlePunchTimeUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    const hasPunchIn = employeeUpdate?.punchIn !== undefined && employeeUpdate?.punchIn !== "";
    const hasPunchOut = employeeUpdate?.punchOut !== undefined && employeeUpdate?.punchOut !== "";
    
    if (!hasPunchIn && !hasPunchOut) {
      alert(`Please enter punch in or punch out time for ${employee.name}`);
      return;
    }

    if (hasPunchIn && !isValidTimeFormat(employeeUpdate.punchIn)) {
      alert(`Invalid punch in time format for ${employee.name}. Use HH:MM format (e.g., 09:30)`);
      return;
    }
    
    if (hasPunchOut && !isValidTimeFormat(employeeUpdate.punchOut)) {
      alert(`Invalid punch out time format for ${employee.name}. Use HH:MM format (e.g., 18:30)`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      const payload = {
        rosterId,
        weekNumber: parseInt(selectedWeek),
        employeeId: employee._id,
        date: selectedDate,
      };
      
      if (hasPunchIn) payload.punchIn = employeeUpdate.punchIn;
      if (hasPunchOut) payload.punchOut = employeeUpdate.punchOut;

      await dispatch(updatePunchTimes(payload)).unwrap();

      clearEmployeeUpdateField(employee._id, "punchIn");
      clearEmployeeUpdateField(employee._id, "punchOut");
      
      setPunchTimeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[employee._id];
        return newErrors;
      });
      
      refetchEmployees();
      
      toast.success(`Punch times updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update punch times:", error);
    } finally {
      setUpdatingId(null);
    }
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

      clearEmployeeUpdateField(employee._id, "transportArrivalTime");
      refetchEmployees();
      
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

      clearEmployeeUpdateField(employee._id, "departmentArrivalTime");
      refetchEmployees();
      
      toast.success(`Department arrival updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department arrival:", error);
    } finally {
      setUpdatingId(null);
    }
  };

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

      clearEmployeeUpdateField(employee._id, "transportStatus");
      refetchEmployees();
      
      toast.success(`Transport status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update transport status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

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

      clearEmployeeUpdateField(employee._id, "departmentStatus");
      refetchEmployees();
      
      toast.success(`Department status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getTodayStatus = (employee) => {
    if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) {
      return null;
    }

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const match = employee.dailyStatus.find(d => {
      if (!d?.date) return false;
      const dDate = new Date(d.date);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() === selectedDateObj.getTime();
    });
    
    return match;
  };

  const isDarkTable = tableTheme === "dark";

  const canUpdateTransport = (viewType.isTransport || viewType.isSuperAdmin || viewType.isHR) && weekInfo?.canEdit !== false;
  const canUpdateDepartment = (!viewType.isTransport) && (viewType.isSuperAdmin || viewType.isHR || viewType.isEmployee) && weekInfo?.canEdit !== false;
  // HR and SuperAdmin can update punch times
  const canUpdatePunchTimes = (viewType.isHR || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;

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

    if (canUpdatePunchTimes) {
      if (bulkUpdate.punchIn) payload.punchIn = bulkUpdate.punchIn;
      if (bulkUpdate.punchOut) payload.punchOut = bulkUpdate.punchOut;
    }

    if (!payload.transportStatus && !payload.departmentStatus && !payload.arrivalTime && !payload.punchIn && !payload.punchOut) {
      toast.error("Select at least one bulk update value (status, arrival time, or punch times).");
      return;
    }

    if (bulkUpdate.punchIn && !isValidTimeFormat(bulkUpdate.punchIn)) {
      toast.error("Invalid bulk punch in time format. Use HH:MM (e.g., 09:30)");
      return;
    }
    
    if (bulkUpdate.punchOut && !isValidTimeFormat(bulkUpdate.punchOut)) {
      toast.error("Invalid bulk punch out time format. Use HH:MM (e.g., 18:30)");
      return;
    }

    setBulkUpdating(true);
    try {
      if (payload.punchIn || payload.punchOut) {
        await dispatch(bulkUpdatePunchTimes(payload)).unwrap();
      } else {
        await dispatch(updateAttendanceBulk(payload)).unwrap();
      }
      
      dispatch(getEmployeesForUpdates({
        rosterId,
        weekNumber: parseInt(selectedWeek),
        date: selectedDate,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy
      }));
      
      setSelectedEmployeeIds([]);
      setBulkUpdate({
        transportStatus: "",
        departmentStatus: "",
        arrivalTime: "",
        punchIn: "",
        punchOut: ""
      });
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
                Update employee attendance, arrival times, and punch in/out
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
                Week {weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(weekInfo.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
              </p>
              <p className="text-xs mt-1">{weekInfo.editMessage}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(week.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}) - {week.employeeCount || 0} employees
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="flex gap-2">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Search by"
                >
                  <option value="all">All</option>
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="teamLeader">Team Leader</option>
                </select>
                <div className="flex-1 relative">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Type to search…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Employees:</span> {totalEmployees}
              </p>
              {appliedSearch ? (
                <p className="text-xs text-gray-500 mt-1">
                  Showing results for: <span className="font-medium">{appliedSearch}</span>
                </p>
              ) : null}
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
        {loading && rosterEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
        ) : rosterEntries.length > 0 ? (
          <div className="space-y-4">
            {loading && (
              <div className="text-xs text-gray-500 px-1">Loading…</div>
            )}
            {/* Bulk Update */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Selected:</span> {selectedEmployeeIds.length}
                </div>

                {canUpdatePunchTimes && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Punch In</label>
                      <input
                        type="time"
                        value={bulkUpdate.punchIn}
                        onChange={(e) => setBulkUpdate((p) => ({ ...p, punchIn: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-2 text-sm w-28"
                        disabled={bulkUpdating}
                        step="60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Punch Out</label>
                      <input
                        type="time"
                        value={bulkUpdate.punchOut}
                        onChange={(e) => setBulkUpdate((p) => ({ ...p, punchOut: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-2 text-sm w-28"
                        disabled={bulkUpdating}
                        step="60"
                      />
                    </div>
                  </>
                )}

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
                      setBulkUpdate({ 
                        transportStatus: "", 
                        departmentStatus: "", 
                        arrivalTime: "",
                        punchIn: "",
                        punchOut: ""
                      });
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
                    
                    {/* Punch In/Out Column Headers */}
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Punch In</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Punch Out</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Total Hours</th>
                    
                    {/* HR Attendance Column - Auto-calculated from punch hours */}
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>
                      HR Attendance
                      {canUpdatePunchTimes && (
                        <span className="ml-1 text-xs text-purple-400">(auto)</span>
                      )}
                    </th>
                    
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Roster Status</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
                    
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
                    
                    const punchIn = employeeUpdate.punchIn !== undefined 
                      ? employeeUpdate.punchIn 
                      : (todayStatus?.punchIn ? formatTimeForInput(todayStatus.punchIn) : '');
                    
                    const punchOut = employeeUpdate.punchOut !== undefined 
                      ? employeeUpdate.punchOut 
                      : (todayStatus?.punchOut ? formatTimeForInput(todayStatus.punchOut) : '');
                    
                    const totalHours = todayStatus?.totalHours;
                    
                    // Calculate HR Attendance based on total hours
                    let hrAttendance = null;
                    if (totalHours) {
                      hrAttendance = getHRAttendanceFromHours(totalHours);
                    }

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
                        
                        {/* Punch In Field */}
                        <td className="px-4 py-3">
                          {canUpdatePunchTimes ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="time"
                                value={punchIn}
                                onChange={(e) => handlePunchInChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className={`w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                  punchTimeErrors[employee._id]?.punchIn 
                                    ? 'border-red-500' 
                                    : isDarkTable 
                                      ? 'bg-neutral-950 border-neutral-700 text-neutral-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="--:--"
                                step="60"
                              />
                              {punchTimeErrors[employee._id]?.punchIn && (
                                <span className="text-[10px] text-red-500">{punchTimeErrors[employee._id].punchIn}</span>
                              )}
                              {todayStatus?.punchIn && !employeeUpdate.punchIn && (
                                <span className="text-[10px] text-purple-600">
                                  {/* Current: {formatTimeForDisplay(todayStatus.punchIn)} */}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={isDarkTable ? "text-neutral-300" : "text-gray-700"}>
                              {todayStatus?.punchIn ? formatTimeForDisplay(todayStatus.punchIn) : '--:-- --'}
                            </span>
                          )}
                        </td>
                        
                        {/* Punch Out Field */}
                        <td className="px-4 py-3">
                          {canUpdatePunchTimes ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="time"
                                value={punchOut}
                                onChange={(e) => handlePunchOutChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className={`w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                  punchTimeErrors[employee._id]?.punchOut 
                                    ? 'border-red-500' 
                                    : isDarkTable 
                                      ? 'bg-neutral-950 border-neutral-700 text-neutral-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="--:--"
                                step="60"
                              />
                              {punchTimeErrors[employee._id]?.punchOut && (
                                <span className="text-[10px] text-red-500">{punchTimeErrors[employee._id].punchOut}</span>
                              )}
                              {todayStatus?.punchOut && !employeeUpdate.punchOut && (
                                <span className="text-[10px] text-purple-600">
                                  {/* Current: {formatTimeForDisplay(todayStatus.punchOut)} */}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={isDarkTable ? "text-neutral-300" : "text-gray-700"}>
                              {todayStatus?.punchOut ? formatTimeForDisplay(todayStatus.punchOut) : '--:-- --'}
                            </span>
                          )}
                        </td>
                        
                        {/* Total Hours Display */}
                        <td className="px-4 py-3">
                          {totalHours ? (
                            <span className={`font-medium ${isDarkTable ? 'text-purple-300' : 'text-purple-700'}`}>
                              {totalHours} hrs
                            </span>
                          ) : (
                            <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
                              --
                            </span>
                          )}
                        </td>
                        
                        {/* HR Attendance Display - Auto-calculated from punch hours */}
                        <td className="px-4 py-3">
                          {hrAttendance ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(hrAttendance)}`}>
                              {hrAttendance}
                              {canUpdatePunchTimes && !todayStatus?.departmentStatus && (
                                <span className="ml-1 text-[8px]">(auto)</span>
                              )}
                            </span>
                          ) : (
                            <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
                              --
                            </span>
                          )}
                        </td>
                        
                        {/* Roster Status Display */}
                        <td className="px-4 py-3">
                          {todayStatus?.status ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.status)}`}>
                              {todayStatus.status}
                            </span>
                          ) : (
                            <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
                              Not set
                            </span>
                          )}
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

                        {/* Department Status Display - Shows only short code */}
<td className="px-4 py-3">
  {todayStatus?.departmentStatus ? (
    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
      {todayStatus.departmentStatus}
    </span>
  ) : (
    <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
  )}
</td>
                        
                        {/* Transport Arrival */}
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
                                  {/* Current: {formatTimeForDisplay(todayStatus.transportArrivalTime)} */}
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

                        {/* Department Arrival */}
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
                                  {/* Current: {formatTimeForDisplay(todayStatus.departmentArrivalTime)} */}
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
                            
                            {/* Punch Time Update Button - Only for HR/SuperAdmin */}
                            {canUpdatePunchTimes && (
                              (employeeUpdate.punchIn !== undefined || employeeUpdate.punchOut !== undefined) && 
                              (employeeUpdate.punchIn !== (todayStatus?.punchIn ? formatTimeForInput(todayStatus.punchIn) : '') ||
                               employeeUpdate.punchOut !== (todayStatus?.punchOut ? formatTimeForInput(todayStatus.punchOut) : ''))
                            ) && (
                              <button
                                onClick={() => handlePunchTimeUpdate(employee)}
                                disabled={isUpdating || punchTimeErrors[employee._id]}
                                className={`${isDarkTable ? 'bg-purple-600' : 'bg-purple-600'} text-white px-2 py-1 text-xs rounded hover:bg-purple-700 flex items-center justify-center gap-1`}
                              >
                                <Coffee className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
                                Update Punch Times
                              </button>
                            )}
                            
                            {/* Transport Status Update */}
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
                                  className={isDarkTable ? "w-32 bg-neutral-950 text-neutral-200 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" : "w-32 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"}
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
                                    {/* Current: {todayStatus.transportStatus} */}
                                  </span>
                                )}
                                {employeeUpdate.transportStatus && employeeUpdate.transportStatus !== todayStatus?.transportStatus && (
                                  <button
                                    onClick={() => handleTransportStatusUpdate(employee)}
                                    disabled={isUpdating}
                                    className={`${isDarkTable ? 'bg-blue-600' : 'bg-blue-600'} text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1`}
                                  >
                                    <CheckCircle className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
                                    Update Transport Status
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Department Status Update */}
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
                                  className={isDarkTable ? "w-32 bg-neutral-950 text-neutral-200 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" : "w-32 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"}
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
                                    {/* Current: {todayStatus.departmentStatus} */}
                                  </span>
                                )}
                                {employeeUpdate.departmentStatus && employeeUpdate.departmentStatus !== todayStatus?.departmentStatus && (
                                  <button
                                    onClick={() => handleDepartmentStatusUpdate(employee)}
                                    disabled={isUpdating}
                                    className={`${isDarkTable ? 'bg-green-600' : 'bg-green-600'} text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1`}
                                  >
                                    <CheckCircle className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
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
                                className={`${isDarkTable ? 'bg-blue-600' : 'bg-blue-600'} text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 mt-1`}
                              >
                                <Truck className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
                                Update Transport Arrival
                              </button>
                            )}
                            
                            {/* Department Arrival Update */}
                            {canUpdateDepartment && employeeUpdate.departmentArrivalTime && employeeUpdate.departmentArrivalTime !== formatTimeForInput(todayStatus?.departmentArrivalTime) && (
                              <button
                                onClick={() => handleDepartmentArrivalUpdate(employee)}
                                disabled={isUpdating}
                                className={`${isDarkTable ? 'bg-green-600' : 'bg-green-600'} text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 mt-1`}
                              >
                                <Users className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
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
          {canUpdatePunchTimes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1"></span>
                HR Attendance (Auto-calculated): Based on punch hours:
                <span className="ml-2 px-1 bg-green-100 text-green-800 rounded">P (≥8.5h)</span>
                <span className="ml-1 px-1 bg-cyan-100 text-cyan-800 rounded">HD (5-8.5h)</span>
                <span className="ml-1 px-1 bg-purple-100 text-purple-800 rounded">LWP (&lt;5h)</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArrivalAttendanceUpdate;



// import React, { useState, useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
// 	  updateArrivalTime,
// 	  updateAttendance,
// 	  updateAttendanceBulk,
// 	  getEmployeesForUpdates,
// 	} from "../features/slices/rosterSlice.js";
// import Navbar from "../pages/Navbar.jsx";
// import AdminNavbar from "../components/AdminNavbar.jsx";
// import { Clock, CheckCircle, AlertCircle, Truck, Users, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
// import { toast } from "react-toastify";

// // 🔹 Get current user safely
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

// const getLocalDateKey = (d = new Date()) => {
//   const date = d instanceof Date ? d : new Date(d);
//   if (Number.isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
//   const tzOffsetMs = date.getTimezoneOffset() * 60000;
//   return new Date(date.getTime() - tzOffsetMs).toISOString().split("T")[0];
// };

// const toLocalDateKey = (value) => {
//   if (!value) return null;
//   if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
//   return getLocalDateKey(new Date(value));
// };

// const toUtcDateKey = (value) => {
//   if (!value) return null;
//   if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return null;
//   return date.toISOString().slice(0, 10);
// };

// const ArrivalAttendanceUpdate = ({ rosterId }) => {
//   const dispatch = useDispatch();
//   const currentUser = getCurrentUser();
//   const { updateEmployeesData, loading } = useSelector((state) => state.roster);
  
//   // Use ref to track if initial fetch has been done
//   const initialFetchDone = useRef(false);
  
//   // State
//   const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey());
// 		  const [selectedWeek, setSelectedWeek] = useState("");
// 		  const [currentPage, setCurrentPage] = useState(1);
// 			  const [pageSize, setPageSize] = useState(25);
// 			  const [tableTheme, setTableTheme] = useState("dark"); // "dark" | "light"
// 			  const [updates, setUpdates] = useState({});
// 	  const [searchBy, setSearchBy] = useState("all"); // all | name | department | teamLeader
// 	  const [searchInput, setSearchInput] = useState("");
// 	  const [appliedSearch, setAppliedSearch] = useState("");
// 	  const [updatingId, setUpdatingId] = useState(null);
// 		  const [viewType, setViewType] = useState({});
// 		  const [availableWeeks, setAvailableWeeks] = useState([]);
// 		  const [weekInfo, setWeekInfo] = useState(null);
// 	  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
// 	  const [bulkUpdate, setBulkUpdate] = useState({
// 	    transportStatus: "",
// 	    departmentStatus: "",
// 	    arrivalTime: ""
// 	  });
// 	  const [bulkUpdating, setBulkUpdating] = useState(false);

//   // If no rosterId is provided, show message
//   if (!rosterId) {
//     return (
//       <div className="min-h-screen bg-gray-100">
//         {currentUser?.accountType === "superAdmin" ? <AdminNavbar /> : <Navbar />}
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

//   // Determine view type based on user
// 	  useEffect(() => {
// 	    if (currentUser) {
// 	      setViewType({
// 	        isSuperAdmin: currentUser.accountType === "superAdmin",
// 	        isHR: currentUser.accountType === "HR",
// 	        isTransport: currentUser.department === "Transport",
// 	        isEmployee: currentUser.accountType === "employee",
// 	        isTeamLeader: currentUser.accountType === "employee" && Boolean(currentUser.username),
// 	        username: currentUser.username,
// 	        department: currentUser.department
// 	      });
// 	    }
// 	  }, [currentUser]);

//   // Initial fetch when component mounts
//   useEffect(() => {
//     if (rosterId && !initialFetchDone.current) {
//       setSelectedWeek("1");
//       initialFetchDone.current = true;
//     }
//   }, [rosterId]);

// 	  // Fetch employees when rosterId, week, or date changes
// 		  useEffect(() => {
// 		    if (rosterId && selectedWeek && selectedDate) {
// 		      const weekNumber = parseInt(selectedWeek);
// 			      const currentData = updateEmployeesData?.data;
// 			      const currentPagination = currentData?.pagination;
// 			      const currentLimit =
// 			        currentPagination?.limit ?? currentPagination?.pageSize ?? currentPagination?.perPage;
// 			      const currentDateKeyRaw = currentData?.requestedDate ?? currentData?.date ?? null;
// 			      const currentDateKey = currentDateKeyRaw ? toLocalDateKey(currentDateKeyRaw) : null;
// 			      const requestedDateKey = toLocalDateKey(selectedDate);

// 			      const isSameRequest =
// 			        currentData &&
// 			        String(currentData.rosterId) === String(rosterId) &&
// 			        String(currentData.weekNumber) === String(weekNumber) &&
// 			        (!currentDateKey || currentDateKey === requestedDateKey) &&
// 			        String(currentData.q || "") === String(appliedSearch || "") &&
// 			        String(currentData.searchBy || "all") === String(searchBy || "all") &&
// 			        (currentPagination?.page == null || Number(currentPagination.page) === Number(currentPage)) &&
// 			        (currentLimit == null || Number(currentLimit) === Number(pageSize));

// 		      if (isSameRequest) return;

// 			      dispatch(getEmployeesForUpdates({
// 			        rosterId,
// 			        weekNumber,
// 			        date: selectedDate,
// 			        page: currentPage,
// 			        limit: pageSize,
// 			        q: appliedSearch,
// 			        searchBy
// 			      }));
// 			    }
// 			  }, [dispatch, rosterId, selectedWeek, selectedDate, currentPage, pageSize, appliedSearch, searchBy]);

//   // Process the response data
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

// 		  const rosterEntries = updateEmployeesData?.data?.rosterEntries || [];
// 		  const pagination = updateEmployeesData?.data?.pagination;
// 		  const totalEmployees = pagination?.totalEmployees ?? rosterEntries.length;
// 		  const totalPages = pagination?.totalPages ?? 1;
// 		  const rangeStart = totalEmployees === 0 ? 0 : (currentPage - 1) * pageSize + 1;
// 		  const rangeEnd = Math.min(currentPage * pageSize, totalEmployees);

// 			  useEffect(() => {
// 			    if (pagination?.page != null) {
// 			      const nextPage = Number(pagination.page);
// 			      setCurrentPage((prev) => (Number(prev) === nextPage ? prev : nextPage));
// 			    }
// 			  }, [pagination?.page]);

// 		  useEffect(() => {
// 		    setSelectedEmployeeIds([]);
// 		  }, [rosterId, selectedWeek, selectedDate]);

// 		  useEffect(() => {
// 		    const t = setTimeout(() => {
// 		      setAppliedSearch(String(searchInput || "").trim());
// 		    }, 350);
// 		    return () => clearTimeout(t);
// 		  }, [searchInput]);

// 		  useEffect(() => {
// 		    setCurrentPage(1);
// 		  }, [appliedSearch, searchBy]);

// 	  useEffect(() => {
// 	    const currentIds = new Set(rosterEntries.map((e) => String(e._id)));
// 	    setSelectedEmployeeIds((prev) => prev.filter((id) => currentIds.has(String(id))));
// 	  }, [rosterEntries]);

// 	  // Handle transport arrival update
// 	  const handleTransportArrivalChange = (employeeId, value) => {
// 	    setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         transportArrivalTime: value
//       }
//     }));
//   };

//   // Handle department arrival update
//   const handleDepartmentArrivalChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         departmentArrivalTime: value
//       }
//     }));
//   };

//   // Handle transport status change
//   const handleTransportStatusChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         transportStatus: value
//       }
//     }));
//   };

//   // Handle department status change
//   const handleDepartmentStatusChange = (employeeId, value) => {
//     setUpdates(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         departmentStatus: value
//       }
//     }));
//   };

//   const clearEmployeeUpdateField = (employeeId, field) => {
//     setUpdates((prev) => {
//       const existing = prev?.[employeeId];
//       if (!existing) return prev;
//       const nextEmployee = { ...existing };
//       delete nextEmployee[field];
//       const hasAny = Object.values(nextEmployee).some((v) => v !== undefined && v !== "");
//       const next = { ...prev };
//       if (!hasAny) {
//         delete next[employeeId];
//       } else {
//         next[employeeId] = nextEmployee;
//       }
//       return next;
//     });
//   };

//   const refetchEmployees = () => {
//     if (!rosterId || !selectedWeek || !selectedDate) return;
//     dispatch(
// 	      getEmployeesForUpdates({
// 	        rosterId,
// 	        weekNumber: parseInt(selectedWeek),
// 	        date: selectedDate,
// 	        page: currentPage,
// 	        limit: pageSize,
// 	        q: appliedSearch,
// 	        searchBy,
// 	      })
// 	    );
// 	  };

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

//       clearEmployeeUpdateField(employee._id, "transportArrivalTime");
//       refetchEmployees();
      
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

//       clearEmployeeUpdateField(employee._id, "departmentArrivalTime");
//       refetchEmployees();
      
//       toast.success(`Department arrival updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update department arrival:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   // Handle transport status update - only send transportStatus
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

//       clearEmployeeUpdateField(employee._id, "transportStatus");
//       refetchEmployees();
      
//       toast.success(`Transport status updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update transport status:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   // Handle department status update - only send departmentStatus
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

//       clearEmployeeUpdateField(employee._id, "departmentStatus");
//       refetchEmployees();
      
//       toast.success(`Department status updated for ${employee.name}`);
//     } catch (error) {
//       console.error("Failed to update department status:", error);
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const getTodayStatus = (employee) => {
//   console.log('getTodayStatus called for', employee.name, 'selectedDate:', selectedDate);
//   if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) {
//     console.log('No dailyStatus array');
//     return null;
//   }

//   const selectedDateObj = new Date(selectedDate);
//   selectedDateObj.setHours(0, 0, 0, 0);
//   console.log('selectedDateObj:', selectedDateObj.toISOString());
  
//   const match = employee.dailyStatus.find(d => {
//     if (!d?.date) {
//       console.log('No d.date');
//       return false;
//     }
//     const dDate = new Date(d.date);
//     dDate.setHours(0, 0, 0, 0);
//     const isMatch = dDate.getTime() === selectedDateObj.getTime();
//     console.log(`d.date: ${d.date} -> ${dDate.toISOString()} match:`, isMatch);
//     return isMatch;
//   });
  
//   console.log('Match found:', match);
  
//   // Return the match with rosterStatus mapped from status field
//   if (match) {
//     return {
//       ...match,
//       rosterStatus: match.status // Map the status field to rosterStatus
//     };
//   }
//   return match;
// };
//   // Get today's status for an employee with all fields
// //   const getTodayStatus = (employee) => {
// //     console.log('getTodayStatus called for', employee.name, 'selectedDate:', selectedDate);
// //     if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) {
// //       console.log('No dailyStatus array');
// //       return null;
// //     }

// //     const selectedDateObj = new Date(selectedDate);
// //     selectedDateObj.setHours(0, 0, 0, 0);
// //     console.log('selectedDateObj:', selectedDateObj.toISOString());
    
// //     const match = employee.dailyStatus.find(d => {
// //       if (!d?.date) {
// //         console.log('No d.date');
// //         return false;
// //       }
// //       const dDate = new Date(d.date);
// //       dDate.setHours(0, 0, 0, 0);
// //       const isMatch = dDate.getTime() === selectedDateObj.getTime();
// //       console.log(`d.date: ${d.date} -> ${dDate.toISOString()} match:`, isMatch);
// //       return isMatch;
// //     });
    
// //     console.log('Match found:', match);
// //     return match;
// //   };

// 	  // Format time for input field (HH:MM)
// 			  const formatTimeForInput = (dateString) => {
// 			    if (!dateString) return '';
// 			    const IST_TIME_ZONE = "Asia/Kolkata";

// 			    const pad2 = (n) => String(n).padStart(2, "0");

// 			    const formatTimeOnlyToHM = (hours, minutes) => `${pad2(hours)}:${pad2(minutes)}`;

// 			    const getISTTimeParts = (dt) => {
// 			      const parts = new Intl.DateTimeFormat("en-GB", {
// 			        timeZone: IST_TIME_ZONE,
// 			        hour: "2-digit",
// 			        minute: "2-digit",
// 			        hour12: false,
// 			      }).formatToParts(dt);
// 			      const hour = parts.find((p) => p.type === "hour")?.value;
// 			      const minute = parts.find((p) => p.type === "minute")?.value;
// 			      if (!hour || !minute) return null;
// 			      return { hour, minute };
// 			    };

// 			    const getISTDateKeyFromDate = (dt) => {
// 			      const parts = new Intl.DateTimeFormat("en-GB", {
// 			        timeZone: IST_TIME_ZONE,
// 			        year: "numeric",
// 			        month: "2-digit",
// 			        day: "2-digit",
// 			      }).formatToParts(dt);
// 			      const year = parts.find((p) => p.type === "year")?.value;
// 			      const month = parts.find((p) => p.type === "month")?.value;
// 			      const day = parts.find((p) => p.type === "day")?.value;
// 			      if (!year || !month || !day) return null;
// 			      return `${year}-${month}-${day}`;
// 			    };

// 			    if (typeof dateString === "string") {
// 			      const timeOnly = dateString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
// 			      if (timeOnly) {
// 			        return formatTimeOnlyToHM(Number(timeOnly[1]), Number(timeOnly[2]));
// 			      }
// 			      if (dateString.includes("T")) {
// 			        const hasTz = /[zZ]$/.test(dateString) || /[+-]\d{2}:\d{2}$/.test(dateString);
// 			        if (hasTz) {
// 			          const dt = new Date(dateString);
// 			          if (!Number.isNaN(dt.getTime())) {
// 			            const expectedKey = selectedDate; // roster day key (treat as IST day)
// 			            const actualKey = getISTDateKeyFromDate(dt);
// 			            if (expectedKey && actualKey && expectedKey !== actualKey) {
// 			              const isoTime = dateString.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
// 			              if (isoTime) return `${isoTime[1]}:${isoTime[2]}`;
// 			            }
// 			            const istParts = getISTTimeParts(dt);
// 			            if (istParts) return `${istParts.hour}:${istParts.minute}`;
// 			          }
// 			        }

// 			        const isoTime = dateString.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
// 			        if (isoTime) return `${isoTime[1]}:${isoTime[2]}`;
// 			      }
// 			    }
// 			    try {
// 			      const date = new Date(dateString);
// 			      if (Number.isNaN(date.getTime())) return "";
// 			      const istParts = getISTTimeParts(date);
// 			      if (istParts) return `${istParts.hour}:${istParts.minute}`;
// 			      return "";
// 	    } catch (e) {
// 	      return '';
// 	    }
// 	  };

// 		  // Format time for display (HH:MM:SS AM/PM)
// 				  const formatTimeForDisplay = (dateString) => {
// 				    if (!dateString) return '--:-- --';
// 				    const IST_TIME_ZONE = "Asia/Kolkata";

// 				    const pad2 = (n) => String(n).padStart(2, "0");
// 				    const formatTimeOnlyTo12h = (hours, minutes) => {
// 				      const h = Number(hours);
// 				      const m = Number(minutes);
// 				      if (Number.isNaN(h) || Number.isNaN(m)) return "--:-- --";
// 				      const suffix = h >= 12 ? "PM" : "AM";
// 				      const hour12 = h % 12 === 0 ? 12 : h % 12;
// 				      return `${pad2(hour12)}:${pad2(m)} ${suffix}`;
// 				    };

// 				    const getISTDateKeyFromDate = (dt) => {
// 				      const parts = new Intl.DateTimeFormat("en-GB", {
// 				        timeZone: IST_TIME_ZONE,
// 				        year: "numeric",
// 				        month: "2-digit",
// 				        day: "2-digit",
// 				      }).formatToParts(dt);
// 				      const year = parts.find((p) => p.type === "year")?.value;
// 				      const month = parts.find((p) => p.type === "month")?.value;
// 				      const day = parts.find((p) => p.type === "day")?.value;
// 				      if (!year || !month || !day) return null;
// 				      return `${year}-${month}-${day}`;
// 				    };

// 				    if (typeof dateString === "string") {
// 				      const timeOnly = dateString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
// 				      if (timeOnly) {
// 				        return formatTimeOnlyTo12h(timeOnly[1], timeOnly[2]);
// 				      }
// 				      if (dateString.includes("T")) {
// 				        const hasTz = /[zZ]$/.test(dateString) || /[+-]\d{2}:\d{2}$/.test(dateString);
// 				        if (hasTz) {
// 				          const dt = new Date(dateString);
// 				          if (!Number.isNaN(dt.getTime())) {
// 			            const expectedKey = selectedDate; // roster day key (treat as IST day)
// 			            const actualKey = getISTDateKeyFromDate(dt);
// 				            if (expectedKey && actualKey && expectedKey !== actualKey) {
// 				              const isoTime = dateString.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
// 				              if (isoTime) {
// 				                return formatTimeOnlyTo12h(isoTime[1], isoTime[2]);
// 				              }
// 				            }
// 				            // return dt.toLocaleTimeString([], { timeZone: IST_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
// 							return dt.toLocaleTimeString([], {
//   hour: "2-digit",
//   minute: "2-digit",
// });
// 				          }
// 				        }

// 				        const isoTime = dateString.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
// 				        if (isoTime) {
// 				          return formatTimeOnlyTo12h(isoTime[1], isoTime[2]);
// 				        }
// 				      }
// 				    }
// 				    try {
// 				      const dt = new Date(dateString);
// 				      if (Number.isNaN(dt.getTime())) return "--:-- --";
// 				    //   return dt.toLocaleTimeString([], { timeZone: IST_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
// 					return dt.toLocaleTimeString([], {
//   								hour: "2-digit",
//   								minute: "2-digit",
// 							});
// 				    } catch (e) {
// 				      return '--:-- --';
// 				    }
// 				  };

// 		  const formatShift = (startHour, endHour) => {
// 		    const isEmpty = (v) => v === null || v === undefined || v === "";
// 		    const toHour = (v) => {
// 		      if (isEmpty(v)) return null;
// 		      const n = Number.parseInt(String(v), 10);
// 		      if (!Number.isFinite(n)) return null;
// 		      return n;
// 		    };

// 		    const start = toHour(startHour);
// 		    const end = toHour(endHour);
// 		    if (start === null && end === null) return "-";

// 		    const startLabel = start === null ? "??" : start;
// 		    const endLabel = end === null ? "??" : end;
// 		    return `${startLabel}:00 - ${endLabel}:00`;
// 		  };

// 	  const getStatusColor = (status) => {
// 	    const option = STATUS_OPTIONS.find(opt => opt.value === status);
// 	    return option?.color || "bg-gray-100 text-gray-800";
// 	  };

// 	  const isDarkTable = tableTheme === "dark";

// 	  const canUpdateTransport = (viewType.isTransport || viewType.isSuperAdmin || viewType.isHR) && weekInfo?.canEdit !== false;
// 	  const canUpdateDepartment = (!viewType.isTransport) && (viewType.isSuperAdmin || viewType.isHR || viewType.isEmployee) && weekInfo?.canEdit !== false;

// 	  const isAllSelected = rosterEntries.length > 0 && selectedEmployeeIds.length === rosterEntries.length;

// 	  const handleToggleSelectAll = (checked) => {
// 	    setSelectedEmployeeIds(checked ? rosterEntries.map((e) => e._id) : []);
// 	  };

// 	  const handleToggleSelectOne = (employeeId, checked) => {
// 	    setSelectedEmployeeIds((prev) => {
// 	      const id = String(employeeId);
// 	      if (checked) return Array.from(new Set([...prev.map(String), id]));
// 	      return prev.filter((x) => String(x) !== id);
// 	    });
// 	  };

// 	  const handleApplyBulkUpdate = async () => {
// 	    if (!selectedWeek || !selectedDate) {
// 	      toast.error("Please select week and date first.");
// 	      return;
// 	    }

// 	    if (selectedEmployeeIds.length === 0) {
// 	      toast.error("Please select at least one employee.");
// 	      return;
// 	    }

// 	    const payload = {
// 	      rosterId,
// 	      weekNumber: parseInt(selectedWeek),
// 	      employeeIds: selectedEmployeeIds,
// 	      date: selectedDate,
// 	    };

// 	    if (canUpdateTransport && bulkUpdate.transportStatus) {
// 	      payload.transportStatus = bulkUpdate.transportStatus;
// 	    }

// 	    if (canUpdateDepartment && bulkUpdate.departmentStatus) {
// 	      payload.departmentStatus = bulkUpdate.departmentStatus;
// 	    }

// 	    if ((canUpdateTransport || canUpdateDepartment) && bulkUpdate.arrivalTime) {
// 	      payload.arrivalTime = bulkUpdate.arrivalTime;
// 	    }

// 	    if (!payload.transportStatus && !payload.departmentStatus && !payload.arrivalTime) {
// 	      toast.error("Select at least one bulk update value (status or arrival time).");
// 	      return;
// 	    }

// 	    setBulkUpdating(true);
// 	    try {
// 		      await dispatch(updateAttendanceBulk(payload)).unwrap();
// 			      dispatch(getEmployeesForUpdates({
// 			        rosterId,
// 			        weekNumber: parseInt(selectedWeek),
// 			        date: selectedDate,
// 			        page: currentPage,
// 			        limit: pageSize,
// 			        q: appliedSearch,
// 			        searchBy
// 			      }));
// 	      setSelectedEmployeeIds([]);
// 	    } catch {
// 	      // thunk toasts on failure
// 	    } finally {
// 	      setBulkUpdating(false);
// 	    }
// 	  };

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
//       {/* Conditional Navbar Rendering - SuperAdmin sees AdminNavbar, others see regular Navbar */}
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
// 	            <div className={`px-4 py-2 rounded-lg ${
// 	              viewType.isSuperAdmin ? "bg-purple-100 text-purple-800" :
// 	              viewType.isHR ? "bg-amber-100 text-amber-800" :
// 	              viewType.isTransport ? "bg-blue-100 text-blue-800" :
// 	              "bg-green-100 text-green-800"
// 	            }`}>
//               <span className="font-semibold flex items-center gap-2">
//                 <Clock className="w-4 h-4" />
//                 {viewType.isSuperAdmin && "👑 Super Admin"}
//                 {viewType.isHR && "HR"}
//                 {viewType.isTransport && "🚌 Transport"}
//                 {viewType.isEmployee && !viewType.isTransport && `${currentUser.department}`}
//               </span>
//             </div>
//           </div>

//           {/* Week Info Banner */}
// 	          {weekInfo && (
// 	            <div className={`mt-4 p-3 rounded-lg ${
// 	              weekInfo.canEdit ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
// 	            }`}>
// 	              <p className="text-sm font-medium">
// 	                Week {weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(weekInfo.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
// 	              </p>
// 	              <p className="text-xs mt-1">{weekInfo.editMessage}</p>
// 	            </div>
// 	          )}

// 	          {/* Filters */}
// 	          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
// 	            <div>
// 	              <label className="block text-sm font-medium text-gray-700 mb-1">
// 	                Select Week
// 	              </label>
// 	              <select
// 	                value={selectedWeek}
// 	                onChange={(e) => {
// 	                  setSelectedWeek(e.target.value);
// 	                  setCurrentPage(1);
// 	                }}
// 	                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
// 	              >
//                 <option value="">Choose a week</option>
// 	                {availableWeeks.map((week) => (
// 	                  <option key={week.weekNumber} value={week.weekNumber}>
// 	                    Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(week.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}) - {week.employeeCount || 0} employees
// 	                  </option>
// 	                ))}
//               </select>
//             </div>

// 	            <div>
// 	              <label className="block text-sm font-medium text-gray-700 mb-1">
// 	                Select Date
// 	              </label>
// 	              <input
// 	                type="date"
// 	                value={selectedDate}
// 	                onChange={(e) => {
// 	                  setSelectedDate(e.target.value);
// 	                  setCurrentPage(1);
// 	                }}
// 		                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
// 		              />
// 	            </div>

// 	            <div>
// 	              <label className="block text-sm font-medium text-gray-700 mb-1">
// 	                Search
// 	              </label>
// 	              <div className="flex gap-2">
// 	                <select
// 	                  value={searchBy}
// 	                  onChange={(e) => setSearchBy(e.target.value)}
// 	                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
// 	                  title="Search by"
// 	                >
// 	                  <option value="all">All</option>
// 	                  <option value="name">Name</option>
// 	                  <option value="department">Department</option>
// 	                  <option value="teamLeader">Team Leader</option>
// 	                </select>
// 	                <div className="flex-1 relative">
// 	                  <input
// 	                    value={searchInput}
// 	                    onChange={(e) => setSearchInput(e.target.value)}
// 	                    placeholder="Type to search…"
// 	                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
// 	                  />
// 	                  {searchInput ? (
// 	                    <button
// 	                      type="button"
// 	                      onClick={() => setSearchInput("")}
// 	                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800"
// 	                    >
// 	                      Clear
// 	                    </button>
// 	                  ) : null}
// 	                </div>
// 	              </div>
// 	            </div>

// 	            <div className="bg-gray-50 rounded-lg p-3">
// 	              <p className="text-sm text-gray-600">
// 	                <span className="font-semibold">Employees:</span> {totalEmployees}
// 	              </p>
// 	              {appliedSearch ? (
// 	                <p className="text-xs text-gray-500 mt-1">
// 	                  Showing results for: <span className="font-medium">{appliedSearch}</span>
// 	                </p>
// 	              ) : null}
// 	              <p className="text-sm text-gray-600 mt-1">
// 	                <span className="font-semibold">Department:</span> {currentUser.department}
// 	              </p>
//               <p className="text-sm text-gray-600 mt-1">
//                 <span className="font-semibold">Team Leader:</span> {currentUser.username}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Employees Table */}
// 	        {loading && rosterEntries.length === 0 ? (
// 	          <div className="bg-white rounded-lg shadow p-8 text-center">
// 	            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
// 	            <p className="mt-4 text-gray-600">Loading employees...</p>
// 	          </div>
// 		        ) : rosterEntries.length > 0 ? (
// 		          <div className="space-y-4">
// 		            {loading && (
// 		              <div className="text-xs text-gray-500 px-1">Loading…</div>
// 		            )}
// 		            {/* Bulk Update */}
// 		            <div className="bg-white rounded-lg shadow p-4">
// 	              <div className="flex flex-wrap items-end gap-4">
// 	                <div className="text-sm text-gray-700">
// 	                  <span className="font-semibold">Selected:</span> {selectedEmployeeIds.length}
// 	                </div>

// 	                {canUpdateTransport && (
// 	                  <div>
// 	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Transport Status</label>
// 	                    <select
// 	                      value={bulkUpdate.transportStatus}
// 	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, transportStatus: e.target.value }))}
// 	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-56"
// 	                      disabled={bulkUpdating}
// 	                    >
// 	                      <option value="">(No change)</option>
// 	                      {STATUS_OPTIONS.map((option) => (
// 	                        <option key={option.value} value={option.value}>
// 	                          {option.label}
// 	                        </option>
// 	                      ))}
// 	                    </select>
// 	                  </div>
// 	                )}

// 	                {canUpdateDepartment && (
// 	                  <div>
// 	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Dept Status</label>
// 	                    <select
// 	                      value={bulkUpdate.departmentStatus}
// 	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, departmentStatus: e.target.value }))}
// 	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-56"
// 	                      disabled={bulkUpdating}
// 	                    >
// 	                      <option value="">(No change)</option>
// 	                      {STATUS_OPTIONS.map((option) => (
// 	                        <option key={option.value} value={option.value}>
// 	                          {option.label}
// 	                        </option>
// 	                      ))}
// 	                    </select>
// 	                  </div>
// 	                )}

// 	                {(canUpdateTransport || canUpdateDepartment) && (
// 	                  <div>
// 	                    <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Arrival Time</label>
// 	                    <input
// 	                      type="time"
// 	                      value={bulkUpdate.arrivalTime}
// 	                      onChange={(e) => setBulkUpdate((p) => ({ ...p, arrivalTime: e.target.value }))}
// 	                      className="border border-gray-300 rounded px-2 py-2 text-sm w-40"
// 	                      disabled={bulkUpdating}
// 	                    />
// 	                  </div>
// 	                )}

// 		                <div className="flex items-center gap-2 ml-auto">
// 		                  <button
// 		                    type="button"
// 		                    onClick={() => setTableTheme((t) => (t === "dark" ? "light" : "dark"))}
// 		                    className="px-3 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50"
// 		                  >
// 		                    {isDarkTable ? (
// 		                      <span className="inline-flex items-center gap-2">
// 		                        <Sun className="w-4 h-4" /> Light
// 		                      </span>
// 		                    ) : (
// 		                      <span className="inline-flex items-center gap-2">
// 		                        <Moon className="w-4 h-4" /> Dark
// 		                      </span>
// 		                    )}
// 		                  </button>
// 		                  <button
// 		                    type="button"
// 		                    onClick={() => {
// 	                      setSelectedEmployeeIds([]);
// 	                      setBulkUpdate({ transportStatus: "", departmentStatus: "", arrivalTime: "" });
// 	                    }}
// 	                    className="px-3 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
// 	                    disabled={bulkUpdating}
// 	                  >
// 	                    Clear
// 	                  </button>
// 	                  <button
// 	                    type="button"
// 	                    onClick={handleApplyBulkUpdate}
// 	                    className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
// 	                    disabled={bulkUpdating || selectedEmployeeIds.length === 0}
// 	                  >
// 	                    Apply to Selected
// 	                  </button>
// 	                </div>
// 	              </div>
// 	            </div>

// 			            <div className={
// 			              isDarkTable
// 			                ? "rounded-lg shadow border border-neutral-800 bg-neutral-900 text-neutral-100 overflow-auto max-h-[70vh]"
// 			                : "rounded-lg shadow border border-gray-200 bg-white text-gray-900 overflow-auto max-h-[70vh]"
// 			            }>
// <table className={isDarkTable ? "min-w-full divide-y divide-neutral-800" : "min-w-full divide-y divide-gray-200"}>
//   <thead className={isDarkTable ? "bg-neutral-950 sticky top-0 z-10" : "bg-gray-50 sticky top-0 z-10"}>
//     <tr>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>
//         <input
//           type="checkbox"
//           checked={isAllSelected}
//           onChange={(e) => handleToggleSelectAll(e.target.checked)}
//           aria-label="Select all employees"
//           className="h-4 w-4 accent-indigo-500"
//         />
//       </th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Employee</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Department</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Cab Route</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Team Leader</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Shift</th>
//       {/* Roster Status Column Header */}
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Roster Status</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Arrival</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Arrival</th>
//       <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Actions</th>
//     </tr>
//   </thead>
//   <tbody className={isDarkTable ? "bg-neutral-900 divide-y divide-neutral-800" : "bg-white divide-y divide-gray-200"}>
//     {rosterEntries.map((employee) => {
//       const todayStatus = getTodayStatus(employee);
//       const employeeUpdate = updates[employee._id] || {};
//       const isUpdating = updatingId === employee._id;
//       const isSelected = selectedEmployeeIds.some((id) => String(id) === String(employee._id));

//       return (
//         <tr
//           key={employee._id}
//           className={`${isDarkTable ? "hover:bg-neutral-800/40" : "hover:bg-gray-50"} ${isSelected ? (isDarkTable ? "bg-indigo-500/10" : "bg-indigo-50") : ""}`}
//         >
//           <td className="px-4 py-3">
//             <input
//               type="checkbox"
//               checked={isSelected}
//               onChange={(e) => handleToggleSelectOne(employee._id, e.target.checked)}
//               aria-label={`Select ${employee.name}`}
//               className="h-4 w-4 accent-indigo-500"
//             />
//           </td>
//           <td className="px-4 py-3">
//             <div className={isDarkTable ? "font-medium text-neutral-100" : "font-medium text-gray-900"}>{employee.name}</div>
//           </td>
//           <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.department}</td>
//           <td className="px-4 py-3">
//             <span className={`px-2 py-1 text-xs rounded-full ${
//               employee.transport === "Yes" 
//                 ? "bg-green-100 text-green-800" 
//                 : "bg-gray-100 text-gray-800"
//             }`}>
//               {employee.transport || "No"}
//             </span>
//           </td>
//           <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.cabRoute || "-"}</td>
//           <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>{employee.teamLeader || "-"}</td>
//           <td className={isDarkTable ? "px-4 py-3 text-sm text-neutral-300" : "px-4 py-3 text-sm text-gray-600"}>
//             {formatShift(employee.shiftStartHour, employee.shiftEndHour)}
//           </td>
          
//           {/* Roster Status Display - Shows only short code */}
//           <td className="px-4 py-3">
//             {todayStatus?.status ? (
//               <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.status)}`}>
//                 {todayStatus.status}
//               </span>
//             ) : (
//               <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
//                 Not set
//               </span>
//             )}
//           </td>
          
//           {/* Transport Status Display - Shows only short code */}
//           <td className="px-4 py-3">
//             {todayStatus?.transportStatus ? (
//               <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.transportStatus)}`}>
//                 {todayStatus.transportStatus}
//               </span>
//             ) : (
//               <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
//             )}
//           </td>

//           {/* Department Status Display - Shows only short code */}
//           <td className="px-4 py-3">
//             {todayStatus?.departmentStatus ? (
//               <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
//                 {todayStatus.departmentStatus}
//               </span>
//             ) : (
//               <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
//             )}
//           </td>
          
//           {/* Transport Arrival - Input OR Display Value */}
//           <td className="px-4 py-3">
//             {canUpdateTransport ? (
//               <div className="flex flex-col gap-1">
//                 <input
//                   type="time"
//                   value={
//                     employeeUpdate.transportArrivalTime !== undefined 
//                       ? employeeUpdate.transportArrivalTime 
//                       : (todayStatus?.transportArrivalTime 
//                           ? formatTimeForInput(todayStatus.transportArrivalTime)
//                           : '')
//                   }
//                   onChange={(e) => handleTransportArrivalChange(employee._id, e.target.value)}
//                   disabled={isUpdating}
//                   className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   placeholder="Transport"
//                 />
//                 {todayStatus?.transportArrivalTime && !employeeUpdate.transportArrivalTime && (
//                   <span className="text-[10px] text-blue-600">
//                     Current: {formatTimeForDisplay(todayStatus.transportArrivalTime)}
//                   </span>
//                 )}
//               </div>
//             ) : (
//               <div className="text-sm text-gray-700">
//                 {todayStatus?.transportArrivalTime ? (
//                   <span className="text-blue-600 font-medium">
//                     {formatTimeForDisplay(todayStatus.transportArrivalTime)}
//                   </span>
//                 ) : (
//                   <span className="text-gray-400">--:-- --</span>
//                 )}
//               </div>
//             )}
//           </td>

//           {/* Department Arrival - Input OR Display Value */}
//           <td className="px-4 py-3">
//             {canUpdateDepartment ? (
//               <div className="flex flex-col gap-1">
//                 <input
//                   type="time"
//                   value={
//                     employeeUpdate.departmentArrivalTime !== undefined 
//                       ? employeeUpdate.departmentArrivalTime 
//                       : (todayStatus?.departmentArrivalTime 
//                           ? formatTimeForInput(todayStatus.departmentArrivalTime)
//                           : '')
//                   }
//                   onChange={(e) => handleDepartmentArrivalChange(employee._id, e.target.value)}
//                   disabled={isUpdating}
//                   className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
//                   placeholder="Department"
//                 />
//                 {todayStatus?.departmentArrivalTime && !employeeUpdate.departmentArrivalTime && (
//                   <span className="text-[10px] text-green-600">
//                     Current: {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
//                   </span>
//                 )}
//               </div>
//             ) : (
//               <div className="text-sm text-gray-700">
//                 {todayStatus?.departmentArrivalTime ? (
//                   <span className="text-green-600 font-medium">
//                     {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
//                   </span>
//                 ) : (
//                   <span className="text-gray-400">--:-- --</span>
//                 )}
//               </div>
//             )}
//           </td>

//           {/* Actions */}
//           <td className="px-4 py-3">
//             <div className="flex flex-col gap-2">
//               {/* Transport Status Update */}
//               {canUpdateTransport && (
//                 <div className="flex flex-col gap-1 mb-2">
//                   <select
//                     value={
//                       employeeUpdate.transportStatus !== undefined 
//                         ? employeeUpdate.transportStatus 
//                         : (todayStatus?.transportStatus || '')
//                     }
//                     onChange={(e) => handleTransportStatusChange(employee._id, e.target.value)}
//                     disabled={isUpdating}
//                     className={isDarkTable ? "w-32 bg-neutral-950 text-neutral-200 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" : "w-32 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"}
//                   >
//                     <option value="">Transport Attendance</option>
//                     {STATUS_OPTIONS.map(option => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                   {todayStatus?.transportStatus && !employeeUpdate.transportStatus && (
//                     <span className="text-[10px] text-blue-600">
//                       Current: {todayStatus.transportStatus}
//                     </span>
//                   )}
//                   {employeeUpdate.transportStatus && employeeUpdate.transportStatus !== todayStatus?.transportStatus && (
//                     <button
//                       onClick={() => handleTransportStatusUpdate(employee)}
//                       disabled={isUpdating}
//                       className={`${isDarkTable ? 'bg-blue-600' : 'bg-blue-600'} text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1`}
//                     >
//                       <CheckCircle className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
//                       Update Transport Status
//                     </button>
//                   )}
//                 </div>
//               )}
              
//               {/* Department Status Update */}
//               {canUpdateDepartment && (
//                 <div className="flex flex-col gap-1 mb-2">
//                   <select
//                     value={
//                       employeeUpdate.departmentStatus !== undefined 
//                         ? employeeUpdate.departmentStatus 
//                         : (todayStatus?.departmentStatus || '')
//                     }
//                     onChange={(e) => handleDepartmentStatusChange(employee._id, e.target.value)}
//                     disabled={isUpdating}
//                     className={isDarkTable ? "w-32 bg-neutral-950 text-neutral-200 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" : "w-32 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"}
//                   >
//                     <option value="">Dept ATTENDANCE</option>
//                     {STATUS_OPTIONS.map(option => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                   {todayStatus?.departmentStatus && !employeeUpdate.departmentStatus && (
//                     <span className="text-[10px] text-green-600">
//                       Current: {todayStatus.departmentStatus}
//                     </span>
//                   )}
//                   {employeeUpdate.departmentStatus && employeeUpdate.departmentStatus !== todayStatus?.departmentStatus && (
//                     <button
//                       onClick={() => handleDepartmentStatusUpdate(employee)}
//                       disabled={isUpdating}
//                       className={`${isDarkTable ? 'bg-green-600' : 'bg-green-600'} text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1`}
//                     >
//                       <CheckCircle className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
//                       Update Dept Status
//                     </button>
//                   )}
//                 </div>
//               )}
              
//               {/* Transport Arrival Update */}
//               {canUpdateTransport && employeeUpdate.transportArrivalTime && employeeUpdate.transportArrivalTime !== formatTimeForInput(todayStatus?.transportArrivalTime) && (
//                 <button
//                   onClick={() => handleTransportArrivalUpdate(employee)}
//                   disabled={isUpdating}
//                   className={`${isDarkTable ? 'bg-blue-600' : 'bg-blue-600'} text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 mt-1`}
//                 >
//                   <Truck className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
//                   Update Transport Arrival
//                 </button>
//               )}
              
//               {/* Department Arrival Update */}
//               {canUpdateDepartment && employeeUpdate.departmentArrivalTime && employeeUpdate.departmentArrivalTime !== formatTimeForInput(todayStatus?.departmentArrivalTime) && (
//                 <button
//                   onClick={() => handleDepartmentArrivalUpdate(employee)}
//                   disabled={isUpdating}
//                   className={`${isDarkTable ? 'bg-green-600' : 'bg-green-600'} text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 mt-1`}
//                 >
//                   <Users className={`w-3 h-3 ${isDarkTable ? 'text-white' : 'text-white'}`} />
//                   Update Dept Arrival
//                 </button>
//               )}
//             </div>
//           </td>
//         </tr>
//       );
//     })}
//   </tbody>
// </table>
// 			            {pagination && (
// 				              <div className={isDarkTable ? "flex flex-wrap items-center justify-end gap-6 border-t border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-300" : "flex flex-wrap items-center justify-end gap-6 border-t border-gray-200 bg-gray-50 px-4 py-3 text-gray-700"}>
// 			                <div className="flex items-center gap-2 text-sm">
// 			                  <span>Rows per page:</span>
// 			                  <select
// 			                    value={pageSize}
// 			                    onChange={(e) => {
// 			                      setPageSize(parseInt(e.target.value));
// 			                      setCurrentPage(1);
// 			                    }}
// 				                    className={isDarkTable ? "bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200" : "bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"}
// 			                  >
// 			                    {[10, 25, 50, 100].map((n) => (
// 			                      <option key={n} value={n}>
// 			                        {n}
// 			                      </option>
// 			                    ))}
// 			                  </select>
// 			                </div>

// 				                <div className={isDarkTable ? "text-sm text-neutral-200" : "text-sm text-gray-700"}>
// 			                  {rangeStart}–{rangeEnd} of {totalEmployees}
// 			                </div>

// 			                <div className="flex items-center gap-1">
// 			                  <button
// 			                    type="button"
// 			                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
// 			                    disabled={currentPage <= 1}
// 				                    className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
// 			                    aria-label="Previous page"
// 			                  >
// 			                    <ChevronLeft className="h-4 w-4" />
// 			                  </button>
// 			                  <button
// 			                    type="button"
// 			                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
// 			                    disabled={currentPage >= totalPages}
// 				                    className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
// 			                    aria-label="Next page"
// 			                  >
// 			                    <ChevronRight className="h-4 w-4" />
// 			                  </button>
// 			                </div>
// 			              </div>
// 			            )}
// 		          </div>
// 		          </div>
// 		        ) : (
// 	          <div className="bg-white rounded-lg shadow p-8 text-center">
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

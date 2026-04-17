
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEmployeesForUpdates, fetchAllRosters, exportAttendanceSnapshot } from '../features/slices/rosterSlice.js';
import { Calendar, Users, Clock, RefreshCw, AlertCircle, ChevronDown, SlidersHorizontal, ChevronLeft, ChevronRight, Sun, Moon, X, Sparkles } from 'lucide-react';
import AdminNavbar from "../components/AdminNavbar.jsx";
import Navbar from "../pages/Navbar.jsx";
import html2canvas from "html2canvas";
import { useLocation } from "react-router-dom";
import { fetchMyDelegations, selectMyDelegations } from "../features/slices/delegationSlice.js";

const toDateKeyLocal = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
};

const toDateKeyPlain = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKeyToDate = (dateKey) => {
  const match = String(dateKey || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getMonthStartDateKey = (month, year) => {
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return "";
  return `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01`;
};

const getMonthBounds = (month, year) => {
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return null;
  const monthStart = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
  return { monthStart, monthEnd, parsedMonth, parsedYear };
};

const getWeekNumberForMonth = (dateValue, month, year) => {
  const dateKey = typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? dateValue
    : toDateKeyLocal(dateValue);
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (
    !dateKey ||
    !Number.isFinite(parsedMonth) ||
    !Number.isFinite(parsedYear)
  ) {
    return 1;
  }
  const dayOfMonth = Number.parseInt(dateKey.split("-")[2], 10);
  if (!Number.isFinite(dayOfMonth)) return 1;
  const firstDayOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
  return Math.max(1, Math.ceil((firstDayOfMonth.getUTCDay() + dayOfMonth) / 7));
};

const getDisplayWeeksForMonth = (weeks = [], month, year) => {
  const bounds = getMonthBounds(month, year);
  if (!bounds) return Array.isArray(weeks) ? weeks : [];
  const { parsedMonth, parsedYear } = bounds;
  const monthStartKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01`;
  const monthEndDay = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
  const monthEndKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;

  return (Array.isArray(weeks) ? weeks : [])
    .filter((week) => {
      if (!week?.startDate || !week?.endDate) return false;
      const startKey = toDateKeyLocal(week.startDate);
      const endKey = toDateKeyLocal(week.endDate);
      if (!startKey || !endKey) return false;
      return startKey <= monthEndKey && endKey >= monthStartKey;
    })
    .map((week) => {
      const startKey = toDateKeyLocal(week.startDate);
      const endKey = toDateKeyLocal(week.endDate);
      const clippedStartKey = startKey < monthStartKey ? monthStartKey : startKey;
      const clippedEndKey = endKey > monthEndKey ? monthEndKey : endKey;
      return {
        ...week,
        startDate: new Date(`${clippedStartKey}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${clippedEndKey}T00:00:00.000Z`).toISOString(),
        displayWeekNumber: getWeekNumberForMonth(clippedStartKey, parsedMonth, parsedYear),
      };
    });
};

const formatPrettyDate = (dateKey) => {
  const date = parseDateKeyToDate(dateKey);
  if (!date) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

		const AttendanceSnapshot = () => {
			  const dispatch = useDispatch();
			  const location = useLocation();
			  const { user } = useSelector((state) => state.auth);
			  const myDelegations = useSelector(selectMyDelegations);
			  const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
			  const isAdminUser = ["admin", "superAdmin", "HR", "Operations", "AM"].includes(currentUser?.accountType);
			  const isEmployeeUser = currentUser?.accountType === "employee";
			  const isEmployeeTransportUser = isEmployeeUser && currentUser?.department === "Transport";
			  const isEmployeeNonTransportUser = isEmployeeUser && currentUser?.department !== "Transport";
			  const canDownloadSnapshotImage = ["HR", "superAdmin", "employee"].includes(currentUser?.accountType);
			  const isNonEmployeeExcelUser = !isEmployeeUser;
		  const { 
			    updateEmployeesData,
		    allRosters,
		    rosterDetailLoading,
		    rosterDetailError,
		    error,
		  } = useSelector((state) => state.roster);

		  const [selectedDate, setSelectedDate] = useState(() => {
		    const now = new Date();
		    return getMonthStartDateKey(now.getMonth() + 1, now.getFullYear()) || toDateKeyLocal(now);
		  });
		  const [exportStartDate, setExportStartDate] = useState(() => toDateKeyLocal(new Date()));
		  const [exportEndDate, setExportEndDate] = useState(() => toDateKeyLocal(new Date()));
		  const [isExportRangeModalOpen, setIsExportRangeModalOpen] = useState(false);
		  const [draftExportStartDate, setDraftExportStartDate] = useState("");
		  const [draftExportEndDate, setDraftExportEndDate] = useState("");
		  const [exportCalendarBaseMonth, setExportCalendarBaseMonth] = useState(() => {
		    const now = new Date();
		    return new Date(now.getFullYear(), now.getMonth(), 1);
		  });
		  
		  const [selectedDepartments, setSelectedDepartments] = useState([]);
		  const [selectedTeamLeaders, setSelectedTeamLeaders] = useState([]);
		  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
		  const [isTeamLeaderDropdownOpen, setIsTeamLeaderDropdownOpen] = useState(false);
		  const [allEmployees, setAllEmployees] = useState([]);
		  const [availableWeeks, setAvailableWeeks] = useState([]);
		  const [selectedRoster, setSelectedRoster] = useState(null);
		  const [selectedWeek, setSelectedWeek] = useState(null);
		  const [loadingState, setLoadingState] = useState('idle');
	  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
		  const [summary, setSummary] = useState(null);
		  const [rostersByMonth, setRostersByMonth] = useState({});
		  const dateInputRef = useRef(null);
		  const exportCaptureRef = useRef(null);
		  const departmentDropdownRef = useRef(null);
		  const teamLeaderDropdownRef = useRef(null);
			  const [showColumnMenu, setShowColumnMenu] = useState(false);
					  const [columnVisibility, setColumnVisibility] = useState({
					    employee: true,
					    teamLeader: true,
					    department: true,
					    shift: true,
					    rosterStatus: true,
					    transportStatus: true,
					    departmentStatus: true,
					    hrAttendance: true,
					    transportArrival: true,
					    departmentArrival: true,
				  });
		  const [currentPage, setCurrentPage] = useState(1);
		  const [pageSize, setPageSize] = useState(25);
		  const [tableTheme, setTableTheme] = useState("dark"); // "dark" | "light"
		  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
	  
	  // Month and Year state
	  const [selectedMonth, setSelectedMonth] = useState(() => {
	    return new Date().getMonth() + 1;
	  });
	  const [selectedYear, setSelectedYear] = useState(() => {
	    return new Date().getFullYear();
	  });
	  const delegatedFromParam = useMemo(() => {
	    const searchParams = new URLSearchParams(location.search || "");
	    return String(searchParams.get("delegatedFrom") || "").trim();
	  }, [location.search]);

  // All 12 months for dropdown
  const allMonths = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Years for dropdown
  const years = [2025, 2026, 2027];

  const pickWeekNumberForDate = (roster, dateKey) => {
    const weeks = roster?.weeks || [];
    if (!Array.isArray(weeks) || weeks.length === 0) return null;

    const targetKey = typeof dateKey === 'string' ? dateKey : toDateKeyLocal(dateKey);
    if (targetKey) {
      const matching = weeks.find((w) => {
        const startKey = toDateKeyLocal(w?.startDate);
        const endKey = toDateKeyLocal(w?.endDate);
        if (!startKey || !endKey) return false;
        return targetKey >= startKey && targetKey <= endKey;
      });
      if (matching?.weekNumber != null) return Number(matching.weekNumber);
    }

    const sorted = [...weeks].sort((a, b) => Number(a?.weekNumber ?? 0) - Number(b?.weekNumber ?? 0));
    return sorted[0]?.weekNumber != null ? Number(sorted[0].weekNumber) : null;
  };

  // ✅ Fetch all rosters on component mount and when month/year changes
  useEffect(() => {
    if (user) {
	      dispatch(fetchAllRosters({ 
        month: selectedMonth, 
        year: selectedYear,
        page: 1,
        limit: 50 
      }));
    }
  }, [dispatch, user, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isEmployeeUser) {
      dispatch(fetchMyDelegations());
    }
  }, [dispatch, isEmployeeUser]);

  useEffect(() => {
    if (rosterDetailError) {
      setLoadingState('error');
    }
  }, [rosterDetailError]);

  useEffect(() => {
    if (error && loadingState === 'loading') {
      setLoadingState('error');
    }
  }, [error, loadingState]);

  useEffect(() => {
    const monthStartKey = getMonthStartDateKey(selectedMonth, selectedYear);
    if (!monthStartKey) return;
    if (selectedDate !== monthStartKey) {
      setSelectedDate(monthStartKey);
      setCurrentPage(1);
    }
  }, [selectedMonth, selectedYear]);

  // ✅ Process allRosters data to find available rosters
  useEffect(() => {
    if (rosterDetailLoading) return;

    const rosterList = Array.isArray(allRosters?.data)
      ? allRosters.data
      : Array.isArray(allRosters)
        ? allRosters
        : [];

    // Create a map of rosters by month/year
    const rosterMap = {};

    rosterList.forEach(roster => {
        const key = `${roster.month}-${roster.year}`;
        rosterMap[key] = roster;
      });

    setRostersByMonth(rosterMap);

    // Check if we have a roster for the selected month/year
    const currentKey = `${selectedMonth}-${selectedYear}`;
    const currentRoster = rosterMap[currentKey];

	    if (currentRoster) {
		      setSelectedRoster(currentRoster._id);

			      const weeks = currentRoster.weeks || [];
	      let requestDate = selectedDate;
	      let resolvedWeekNumber = null;
	      if (Array.isArray(weeks) && weeks.length > 0) {
	        const displayWeeks = getDisplayWeeksForMonth(weeks, selectedMonth, selectedYear);
	        setAvailableWeeks(displayWeeks.map(w => ({
	          weekNumber: w.weekNumber,
	          displayWeekNumber: w.displayWeekNumber || w.weekNumber,
	          startDate: w.startDate,
	          endDate: w.endDate,
	          employeeCount: w.employees?.length || 0
	        })));

	        const weekForSelectedDate = displayWeeks.find((w) => {
	          const startKey = toDateKeyLocal(w?.startDate);
	          const endKey = toDateKeyLocal(w?.endDate);
	          if (!startKey || !endKey || !requestDate) return false;
	          return requestDate >= startKey && requestDate <= endKey;
	        });

	        if (!weekForSelectedDate && displayWeeks.length > 0) {
	          requestDate = toDateKeyLocal(displayWeeks[0].startDate) || requestDate;
	          if (requestDate && requestDate !== selectedDate) {
	            setSelectedDate(requestDate);
	          }
	          resolvedWeekNumber = Number(displayWeeks[0].weekNumber);
	        }
	      } else {
	        setAvailableWeeks([]);
	      }

	      const weekNumber =
	        resolvedWeekNumber ?? pickWeekNumberForDate(currentRoster, requestDate);
	      if (weekNumber != null) {
	        setSelectedWeek(weekNumber);
	        setLoadingState('loading');
	        dispatch(getEmployeesForUpdates({
	          rosterId: currentRoster._id,
	          weekNumber,
	          date: requestDate,
            month: selectedMonth,
            year: selectedYear,
	          ...(delegatedFromParam ? { delegatedFrom: delegatedFromParam } : {}),
	        }));
	      } else {
	        setAllEmployees([]);
	        setSelectedWeek(null);
	        setLoadingState('success');
	      }
    } else {
	      setAllEmployees([]);
      setSelectedRoster(null);
      setSelectedWeek(null);
      setAvailableWeeks([]);
      setLoadingState('success');
    }
  }, [allRosters, rosterDetailLoading, selectedMonth, selectedYear, dispatch, selectedDate, delegatedFromParam]);

  // ✅ Process the dynamic data from API
  useEffect(() => {
    if (updateEmployeesData?.data) {
	      
      const responseData = updateEmployeesData.data;
      
      // Set employees from rosterEntries
      if (responseData.rosterEntries && responseData.rosterEntries.length > 0) {
	        setAllEmployees(responseData.rosterEntries);
      } else {
        setAllEmployees([]);
      }
      
	      // Set available weeks for dropdown
	      if (responseData.weeks && responseData.weeks.length > 0) {
	        const displayWeeks = getDisplayWeeksForMonth(responseData.weeks, selectedMonth, selectedYear);
	        setAvailableWeeks(displayWeeks);
	      }
      
      // Set summary data
      if (responseData.summary) {
        setSummary(responseData.summary);
      }
      
      // Update selected week if needed
      if (responseData.weekNumber) {
        setSelectedWeek(responseData.weekNumber);
      }
      
      setLoadingState('success');
    }
  }, [updateEmployeesData]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Prevent timezone drift for date-only strings (YYYY-MM-DD).
    if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  // Get attendance for specific date using IST date keys to avoid timezone drift.
	  const getAttendanceForDate = (employee, date) => {
	    if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) return null;
	    const targetKey = typeof date === "string" ? date : toDateKeyLocal(date);
	    if (!targetKey) return null;

	    return employee.dailyStatus.find((d) => {
	      if (!d?.date) return false;
	      return toDateKeyLocal(d.date) === targetKey;
	    });
	  };

			  const formatTimeForDisplay = (dateString) => {
			    if (!dateString) return "--:-- --";
			    try {
			      const IST_TIME_ZONE = "Asia/Kolkata";
			      const pad2 = (n) => String(n).padStart(2, "0");
			      const formatTimeOnlyTo12h = (hours, minutes) => {
			        const h = Number(hours);
			        const m = Number(minutes);
			        if (Number.isNaN(h) || Number.isNaN(m)) return "--:-- --";
			        const hour12 = h % 12 === 0 ? 12 : h % 12;
			        const suffix = h >= 12 ? "pm" : "am";
			        return `${hour12}:${pad2(m)} ${suffix}`;
			      };

			      const formatDateToIST12h = (dt) =>
			        new Intl.DateTimeFormat("en-US", {
			          timeZone: IST_TIME_ZONE,
			          hour: "numeric",
			          minute: "2-digit",
			          hour12: true,
			        })
			          .format(dt)
			          .toLowerCase();

			      if (typeof dateString === "string") {
			        const trimmed = dateString.trim();

			        const timeOnly = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
			        if (timeOnly) {
			          return formatTimeOnlyTo12h(timeOnly[1], timeOnly[2]);
			        }

			        if (trimmed.includes("T")) {
			          const hasTimeZone = /[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed);
			          if (hasTimeZone) {
			            const dt = new Date(trimmed);
			            if (!Number.isNaN(dt.getTime())) {
			              return formatDateToIST12h(dt);
			            }
			          }

			          const isoTime = trimmed.match(/T(\d{2}):(\d{2})(?::\d{2})?/);
			          if (isoTime) {
			            return formatTimeOnlyTo12h(isoTime[1], isoTime[2]);
			          }
			        }
			      }

			      const dt = new Date(dateString);
			      if (Number.isNaN(dt.getTime())) return "--:-- --";
			      return formatDateToIST12h(dt);
			    } catch {
			      return "--:-- --";
			    }
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

  // Handle month change
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setShowMonthDropdown(false);
    const monthStartKey = getMonthStartDateKey(month, selectedYear);
    if (monthStartKey) setSelectedDate(monthStartKey);
    setCurrentPage(1);
    setLoadingState('loading');
  };

  // Handle year change
  const handleYearChange = (year) => {
    const parsedYear = parseInt(year);
    setSelectedYear(parsedYear);
    const monthStartKey = getMonthStartDateKey(selectedMonth, parsedYear);
    if (monthStartKey) setSelectedDate(monthStartKey);
    setCurrentPage(1);
    setLoadingState('loading');
  };

  // Handle week change
  const handleWeekChange = (weekNumber) => {
    setSelectedWeek(parseInt(weekNumber));
    setLoadingState('loading');
    
    if (selectedRoster) {
		      dispatch(getEmployeesForUpdates({
		        rosterId: selectedRoster,
		        weekNumber: parseInt(weekNumber),
		        date: selectedDate,
            month: selectedMonth,
            year: selectedYear,
		        ...(delegatedFromParam ? { delegatedFrom: delegatedFromParam } : {}),
		      }));
    }
  };

	  // Handle date change
			  const handleDateChange = (newDate) => {
			    setSelectedDate(newDate);
			    setCurrentPage(1);

			    const currentKey = `${selectedMonth}-${selectedYear}`;
			    const roster = rostersByMonth[currentKey];
			    const maybeWeek = pickWeekNumberForDate(roster, newDate);
			    const nextWeek = maybeWeek ?? selectedWeek;
			    if (maybeWeek != null && maybeWeek !== selectedWeek) {
			      setSelectedWeek(maybeWeek);
			    }

			    if (selectedRoster && nextWeek) {
		      setLoadingState('loading');
				      dispatch(getEmployeesForUpdates({
			        rosterId: selectedRoster,
			        weekNumber: nextWeek,
			        date: newDate,
              month: selectedMonth,
              year: selectedYear,
			        ...(delegatedFromParam ? { delegatedFrom: delegatedFromParam } : {}),
			      }));
	    }
	  };

  // Handle refresh
	  const handleRefresh = () => {
	    setLoadingState('loading');
	    setCurrentPage(1);
	    if (selectedRoster && selectedWeek) {
		      dispatch(getEmployeesForUpdates({
		        rosterId: selectedRoster,
		        weekNumber: selectedWeek,
		        date: selectedDate,
            month: selectedMonth,
            year: selectedYear,
		        ...(delegatedFromParam ? { delegatedFrom: delegatedFromParam } : {}),
		      }));
    }
  };

  // Get status color class
  const getStatusColor = (status) => {
    switch(status) {
      case 'P': return 'bg-green-100 text-green-700';
      case 'L': return 'bg-yellow-100 text-yellow-700';
      case 'NCNS': return 'bg-red-100 text-red-700';
      case 'H': return 'bg-purple-100 text-purple-700';
      case 'WO': return 'bg-blue-100 text-blue-700';
      case 'LWP': return 'bg-orange-100 text-orange-700';
      case 'BL': return 'bg-pink-100 text-pink-700';
      case 'UL': return 'bg-gray-100 text-gray-700';
      case 'LWD': return 'bg-indigo-100 text-indigo-700';
      case 'HD': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  const getHRAttendanceFromHours = (hours) => {
    const numericHours = Number(hours);
    if (!Number.isFinite(numericHours) || numericHours <= 0) return null;
    if (numericHours >= 7.5) return "P";
    if (numericHours >= 5) return "HD";
    return "LWP";
  };

  const getStatusInlineStyle = (status) => {
    const palette = {
      P: { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" },
      WO: { backgroundColor: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
      LWP: { backgroundColor: "#ffedd5", color: "#c2410c", borderColor: "#fdba74" },
      HD: { backgroundColor: "#ccfbf1", color: "#0f766e", borderColor: "#5eead4" },
      L: { backgroundColor: "#fef9c3", color: "#a16207", borderColor: "#fde047" },
      NCNS: { backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" },
      H: { backgroundColor: "#f3e8ff", color: "#7e22ce", borderColor: "#d8b4fe" },
      BL: { backgroundColor: "#fce7f3", color: "#be185d", borderColor: "#f9a8d4" },
      UL: { backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" },
      LWD: { backgroundColor: "#e0e7ff", color: "#4338ca", borderColor: "#a5b4fc" },
    };
    return palette[status] || { backgroundColor: "#f3f4f6", color: "#6b7280", borderColor: "#d1d5db" };
  };

  // Check if current month has roster
	  const currentMonthHasRoster = () => {
	    const key = `${selectedMonth}-${selectedYear}`;
	    return rostersByMonth[key] || false;
	  };

	  // Get current roster info
	  const getCurrentRosterInfo = () => {
	    const key = `${selectedMonth}-${selectedYear}`;
	    return rostersByMonth[key];
	  };

		  const openDatePicker = () => {
		    const input = dateInputRef.current;
		    if (!input) return;
		    if (typeof input.showPicker === 'function') {
		      input.showPicker();
		      return;
		    }
		    input.focus();
		  };

	  const availableDepartments = Array.from(
	    new Set(
	      (allEmployees || [])
	        .map((emp) => emp?.department)
	        .filter(Boolean)
	    )
	  ).sort((a, b) => String(a).localeCompare(String(b)));

			  const TEAM_LEADER_NONE = "__none__";
			  const normalizeTeamLeader = (value) => String(value || "").trim();
			  const normalizeKey = (value) => String(value || "").trim().toLowerCase();
			  const availableTeamLeaders = Array.from(
			    new Set(
			      (allEmployees || [])
		        .map((emp) => normalizeTeamLeader(emp?.teamLeader))
		        .filter(Boolean)
	    )
	  ).sort((a, b) => String(a).localeCompare(String(b)));

			  useEffect(() => {
			    setSelectedTeamLeaders((prev) =>
			      prev.filter((value) => value === TEAM_LEADER_NONE || availableTeamLeaders.includes(value))
			    );
			  }, [TEAM_LEADER_NONE, availableTeamLeaders]);
			  useEffect(() => {
			    setSelectedDepartments((prev) => prev.filter((value) => availableDepartments.includes(value)));
			  }, [availableDepartments]);
			  useEffect(() => {
			    const handleOutsideClick = (event) => {
			      if (
			        isDepartmentDropdownOpen &&
			        departmentDropdownRef.current &&
			        !departmentDropdownRef.current.contains(event.target)
			      ) {
			        setIsDepartmentDropdownOpen(false);
			      }
			      if (
			        isTeamLeaderDropdownOpen &&
			        teamLeaderDropdownRef.current &&
			        !teamLeaderDropdownRef.current.contains(event.target)
			      ) {
			        setIsTeamLeaderDropdownOpen(false);
			      }
			    };

			    document.addEventListener("mousedown", handleOutsideClick);
			    return () => {
			      document.removeEventListener("mousedown", handleOutsideClick);
			    };
			  }, [isDepartmentDropdownOpen, isTeamLeaderDropdownOpen]);

		  const selectedWeekRange = useMemo(() => {
		    const week = availableWeeks.find((w) => String(w.weekNumber) === String(selectedWeek));
		    if (!week?.startDate || !week?.endDate) return null;
		    const start = new Date(week.startDate);
		    const end = new Date(week.endDate);
		    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
		    start.setHours(0, 0, 0, 0);
		    end.setHours(23, 59, 59, 999);
		    return { start, end };
		  }, [availableWeeks, selectedWeek]);

		  const activeDelegationsForWeek = useMemo(() => {
		    if (!isEmployeeUser || !selectedWeekRange) return [];
		    const safeList = Array.isArray(myDelegations) ? myDelegations : [];
		    return safeList.filter((delegation) => {
		      if (delegation?.status !== "active") return false;
		      const start = new Date(delegation?.startDate);
		      const end = new Date(delegation?.endDate);
		      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
		      start.setHours(0, 0, 0, 0);
		      end.setHours(23, 59, 59, 999);
		      return start <= selectedWeekRange.end && end >= selectedWeekRange.start;
		    });
		  }, [isEmployeeUser, myDelegations, selectedWeekRange]);

		  const delegationByLeaderName = useMemo(() => {
		    const map = new Map();
		    activeDelegationsForWeek.forEach((delegation) => {
		      const leaderName = normalizeKey(delegation?.delegator?.username);
		      if (leaderName) map.set(leaderName, delegation);
		    });
		    return map;
		  }, [activeDelegationsForWeek]);

			  const employeeDelegatedFromForExport = useMemo(() => {
		    if (!isEmployeeUser) return "";
		    if (delegatedFromParam) {
		      const byParam = activeDelegationsForWeek.find(
		        (delegation) => String(delegation?.delegator?._id || "") === delegatedFromParam
		      );
		      if (byParam?.delegator?._id) return String(byParam.delegator._id);
		    }
			    const selectedNamedTeamLeader = selectedTeamLeaders.find((name) => name && name !== TEAM_LEADER_NONE);
			    if (selectedNamedTeamLeader) {
			      const byLeader = delegationByLeaderName.get(normalizeKey(selectedNamedTeamLeader));
			      if (byLeader?.delegator?._id) return String(byLeader.delegator._id);
			    }
			    if (activeDelegationsForWeek.length === 1) {
		      const onlyDelegation = activeDelegationsForWeek[0];
		      if (onlyDelegation?.delegator?._id) return String(onlyDelegation.delegator._id);
		    }
			    return "";
			  }, [
		    delegatedFromParam,
		    delegationByLeaderName,
		    activeDelegationsForWeek,
		    isEmployeeUser,
		    selectedTeamLeaders,
		    TEAM_LEADER_NONE,
			  ]);

				  const canDownloadExcel =
				    isNonEmployeeExcelUser || (isEmployeeUser && activeDelegationsForWeek.length > 0);

				  useEffect(() => {
				    const week = availableWeeks.find((w) => String(w.weekNumber) === String(selectedWeek));
				    if (!week?.startDate || !week?.endDate) return;
				    const weekStartKey = toDateKeyLocal(week.startDate);
				    const weekEndKey = toDateKeyLocal(week.endDate);
				    if (!weekStartKey || !weekEndKey) return;
				    setExportStartDate(weekStartKey);
				    setExportEndDate(weekEndKey);
				  }, [availableWeeks, selectedWeek]);

				  useEffect(() => {
				    if (!isExportRangeModalOpen) return undefined;
				    const onKeyDown = (event) => {
				      if (event.key === "Escape") {
				        setIsExportRangeModalOpen(false);
				      }
				    };
				    window.addEventListener("keydown", onKeyDown);
				    return () => window.removeEventListener("keydown", onKeyDown);
				  }, [isExportRangeModalOpen]);

				  const openExportRangeModal = () => {
				    const resolvedStart = exportStartDate || selectedDate || toDateKeyLocal(new Date());
				    const resolvedEnd = exportEndDate || resolvedStart;
				    setDraftExportStartDate(resolvedStart);
				    setDraftExportEndDate(resolvedEnd);

				    const monthSeed = parseDateKeyToDate(resolvedStart) || new Date();
				    setExportCalendarBaseMonth(new Date(monthSeed.getFullYear(), monthSeed.getMonth(), 1));
				    setIsExportRangeModalOpen(true);
				  };

				  const handleExportSnapshot = async (startDateKey, endDateKey) => {
					    try {
			      if (!startDateKey || !endDateKey) {
				        return;
			      }

			      if (startDateKey > endDateKey) {
			        return;
			      }

				      const exportPayload = {
				        startDate: startDateKey,
				        endDate: endDateKey,
				        department: selectedDepartments,
				        teamLeader: selectedTeamLeaders,
				      };
				      if (isEmployeeUser) {
				        const fallbackDelegationId =
				          String(activeDelegationsForWeek?.[0]?.delegator?._id || "").trim();
				        const resolvedDelegatedFrom =
				          String(employeeDelegatedFromForExport || fallbackDelegationId || "").trim();
				        if (!resolvedDelegatedFrom) return;
				        exportPayload.delegatedFrom = resolvedDelegatedFrom;
				      }
			      await dispatch(exportAttendanceSnapshot(exportPayload)).unwrap();
		    } catch (err) {
			      // exportAttendanceSnapshot already toasts on success; keep errors silent here
			      console.error('Export snapshot failed:', err);
		    }
				  };

				  const handleConfirmExportRange = async () => {
				    if (!draftExportStartDate || !draftExportEndDate) return;
				    const finalStart = draftExportStartDate <= draftExportEndDate ? draftExportStartDate : draftExportEndDate;
				    const finalEnd = draftExportStartDate <= draftExportEndDate ? draftExportEndDate : draftExportStartDate;
				    setExportStartDate(finalStart);
				    setExportEndDate(finalEnd);
				    await handleExportSnapshot(finalStart, finalEnd);
				    setIsExportRangeModalOpen(false);
				  };

				  const handleRangeDatePick = (dateKey) => {
				    if (!dateKey) return;
				    if (!draftExportStartDate || (draftExportStartDate && draftExportEndDate)) {
				      setDraftExportStartDate(dateKey);
				      setDraftExportEndDate("");
				      return;
				    }
				    if (dateKey < draftExportStartDate) {
				      setDraftExportStartDate(dateKey);
				      return;
				    }
				    setDraftExportEndDate(dateKey);
				  };

				  const goExportCalendarPrevMonth = () => {
				    setExportCalendarBaseMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
				  };

				  const goExportCalendarNextMonth = () => {
				    setExportCalendarBaseMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
				  };

				  const exportCalendarMonths = useMemo(() => {
				    const first = new Date(exportCalendarBaseMonth.getFullYear(), exportCalendarBaseMonth.getMonth(), 1);
				    const second = new Date(exportCalendarBaseMonth.getFullYear(), exportCalendarBaseMonth.getMonth() + 1, 1);
				    return [first, second];
				  }, [exportCalendarBaseMonth]);

				  const buildCalendarDays = (monthDate) => {
				    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
				    const gridStart = new Date(monthStart);
				    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
				    return Array.from({ length: 42 }, (_, idx) => {
				      const day = new Date(gridStart);
				      day.setDate(gridStart.getDate() + idx);
				      return day;
				    });
				  };

			  const filteredEmployees = (allEmployees || []).filter((emp) => {
			    const matchesDepartment =
			      selectedDepartments.length === 0 || selectedDepartments.includes(emp.department);

			    const normalizedLeader = normalizeTeamLeader(emp?.teamLeader);
			    const matchesTeamLeader =
			      selectedTeamLeaders.length === 0 ||
			      (selectedTeamLeaders.includes(TEAM_LEADER_NONE) && !normalizedLeader) ||
			      selectedTeamLeaders.includes(normalizedLeader);

			    return matchesDepartment && matchesTeamLeader;
			  });

			  const toggleDepartmentSelection = (dept) => {
			    setSelectedDepartments((prev) =>
			      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
			    );
			    setCurrentPage(1);
			  };
			  const toggleTeamLeaderSelection = (teamLeader) => {
			    setSelectedTeamLeaders((prev) =>
			      prev.includes(teamLeader) ? prev.filter((t) => t !== teamLeader) : [...prev, teamLeader]
			    );
			    setCurrentPage(1);
			  };
			  const selectedDepartmentLabel =
			    selectedDepartments.length === 0
			      ? "All Departments"
			      : `${selectedDepartments.length} Department${selectedDepartments.length > 1 ? "s" : ""}`;
			  const selectedTeamLeaderLabel =
			    selectedTeamLeaders.length === 0
			      ? "All Team Leaders"
			      : `${selectedTeamLeaders.length} Team Leader${selectedTeamLeaders.length > 1 ? "s" : ""}`;

				  const totalEmployees = filteredEmployees.length;
				  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));
				  const safePage = Math.min(currentPage, totalPages);
			  const startIndex = (safePage - 1) * pageSize;
			  const endIndexExclusive = startIndex + pageSize;
			  const pagedEmployees = filteredEmployees.slice(startIndex, endIndexExclusive);
			  const rangeStart = totalEmployees === 0 ? 0 : startIndex + 1;
				  const rangeEnd = Math.min(startIndex + pagedEmployees.length, totalEmployees);
				  const isDarkTable = tableTheme === "dark";
          const effectiveColumnVisibility = {
            ...columnVisibility,
            transportStatus: columnVisibility.transportStatus && !isEmployeeUser,
            hrAttendance: columnVisibility.hrAttendance && !isEmployeeUser,
            transportArrival: columnVisibility.transportArrival && !isEmployeeNonTransportUser,
            departmentStatus: columnVisibility.departmentStatus && !isEmployeeTransportUser,
            departmentArrival: columnVisibility.departmentArrival && !isEmployeeTransportUser,
          };
          const exportColumnDefs = [
            { key: "employee", label: "Employee" },
            { key: "teamLeader", label: "Team Leader" },
            { key: "department", label: "Department" },
            { key: "shift", label: "Shift" },
            { key: "rosterStatus", label: "Roster Status" },
            { key: "transportStatus", label: "Transport Status" },
            { key: "departmentStatus", label: "Dept Status" },
            { key: "hrAttendance", label: "Hr Attendance" },
            { key: "transportArrival", label: "Transport Arrival" },
            { key: "departmentArrival", label: "Dept Arrival" },
          ].filter((col) => {
            return Boolean(effectiveColumnVisibility[col.key]);
          });

				  const hrSummaryCounts = !isEmployeeUser ? filteredEmployees.reduce((acc, emp) => {
				    const attendance = getAttendanceForDate(emp, selectedDate);
				    const status = attendance?.hrAttendance || getHRAttendanceFromHours(attendance?.totalHours);
				    if (!status) return acc;
				    acc[status] = (acc[status] || 0) + 1;
				    return acc;
				  }, {}) : {};

			  const handleDownloadSnapshotImage = async () => {
			    if (!canDownloadSnapshotImage || !exportCaptureRef.current || filteredEmployees.length === 0 || isDownloadingImage) {
			      return;
			    }
			    setIsDownloadingImage(true);
			    try {
			      // Wait a tick so DOM reflects latest selected filters/date before capture.
			      await new Promise((resolve) => setTimeout(resolve, 60));
			      const node = exportCaptureRef.current;
			      const canvas = await html2canvas(node, {
			        scale: 2,
			        useCORS: true,
			        backgroundColor: "#f8fafc",
			        windowWidth: node.scrollWidth,
			        windowHeight: node.scrollHeight,
			        scrollX: 0,
			        scrollY: 0,
			      });
			      const link = document.createElement("a");
			      link.download = `attendance-snapshot-${selectedDate || "selected-date"}.png`;
			      link.href = canvas.toDataURL("image/png");
			      link.click();
			    } catch (captureError) {
			      console.error("Failed to export snapshot image:", captureError);
			    } finally {
			      setIsDownloadingImage(false);
			    }
			  };

	  // Loading state
		  if (rosterDetailLoading || loadingState === 'loading') {
		    return (
		      <div className="min-h-screen bg-gray-50 p-6">
		        <div className="max-w-7xl mx-auto">
		          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
		            <div className="flex flex-col items-center justify-center">
		              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
		              <p className="text-gray-600">Loading attendance data...</p>
		              {rosterDetailError && (
		                <p className="text-sm text-red-600 mt-3">{String(rosterDetailError)}</p>
		              )}
		              {!rosterDetailError && loadingState === 'error' && error && (
		                <p className="text-sm text-red-600 mt-3">{String(error)}</p>
		              )}
		            </div>
		          </div>
		        </div>
		      </div>
		    );
		  }

		  if (loadingState === 'error') {
		    return (
		      <div className="min-h-screen bg-gray-50 p-6">
		        <div className="max-w-7xl mx-auto">
		          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
		            <p className="text-red-600 font-semibold">Failed to load attendance data.</p>
		            <p className="text-sm text-gray-600 mt-2">{String(rosterDetailError || error || '')}</p>
		          </div>
		        </div>
		      </div>
		    );
		  }

	  return (
	    <div className="min-h-screen bg-gray-50 p-6">
	      {isAdminUser ? <AdminNavbar showOutlet={false} /> : <Navbar />}
	      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Snapshot</h1>
            <p className="text-gray-600 mt-1">
              {summary?.userDepartment || user?.department || 'SuperAdmin'} Department - Employee Attendance
            </p>
          </div>
        </div>

        {/* Filters Bar */}
	        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
	          <div className="flex flex-wrap items-center gap-4">
            {/* Month Selector with Year */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {/* Month Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 min-w-[140px] text-left flex items-center justify-between"
                >
                  <span>{allMonths.find(m => m.value === selectedMonth)?.name}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {showMonthDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[140px] max-h-60 overflow-y-auto">
                    {allMonths.map((month) => {
                      const key = `${month.value}-${selectedYear}`;
                      const hasRoster = rostersByMonth[key];
                      
                      return (
                        <button
                          key={month.value}
                          onClick={() => handleMonthChange(month.value)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-sky-50 flex items-center justify-between ${
                            selectedMonth === month.value
                              ? 'bg-sky-100 text-sky-700 font-medium'
                              : ''
                          }`}
                        >
                          <span>{month.name}</span>
                          {hasRoster && (
                            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Roster Status Indicator */}
              {currentMonthHasRoster() ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {getCurrentRosterInfo()?.weeks?.reduce((total, week) => total + (week.employees?.length || 0), 0)} employees
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  No Roster
                </span>
              )}
            </div>

            {/* Week Selector - Dynamically from API */}
            {availableWeeks.length > 0 && (
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gray-500" />
                <select
                  value={selectedWeek || ''}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
	                  {availableWeeks.map((week) => (
	                    <option key={week.weekNumber} value={week.weekNumber}>
	                      Week {week.displayWeekNumber || week.weekNumber}: {formatDate(week.startDate)} - {formatDate(week.endDate)} ({week.employeeCount || 0} employees)
	                    </option>
	                  ))}
	                </select>
	              </div>
            )}

		            {/* Date Picker */}
			            <div className="flex items-center gap-2">
			              <button
			                type="button"
		                onClick={openDatePicker}
		                className="text-gray-500 hover:text-gray-700"
		                aria-label="Open calendar"
		              >
		                <Calendar size={18} />
		              </button>
		              <input
		                ref={dateInputRef}
		                type="date"
		                value={selectedDate}
		                onChange={(e) => handleDateChange(e.target.value)}
		                onClick={(e) => e.currentTarget.showPicker?.()}
			                className="border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 min-w-[160px]"
			              />
			            </div>

			            {/* Department Filter */}
				            <div className="flex items-center gap-2">
				              <Users size={18} className="text-gray-500" />
				              <div ref={departmentDropdownRef} className="relative">
				                <button
				                  type="button"
				                  onClick={() => {
				                    setIsDepartmentDropdownOpen((v) => !v);
				                    setIsTeamLeaderDropdownOpen(false);
				                  }}
				                  className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[170px] text-left"
				                >
				                  {selectedDepartmentLabel}
				                </button>
				                {isDepartmentDropdownOpen && (
				                  <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
				                  <button
				                    type="button"
				                    onClick={() => {
				                      setSelectedDepartments([]);
				                      setCurrentPage(1);
				                    }}
				                    className="w-full text-left px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 rounded"
				                  >
				                    Clear (All Departments)
				                  </button>
				                  {availableDepartments.map((dept) => (
				                    <label key={dept} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 rounded">
				                      <input
				                        type="checkbox"
				                        checked={selectedDepartments.includes(dept)}
				                        onChange={() => toggleDepartmentSelection(dept)}
				                        className="h-4 w-4 accent-sky-600"
				                      />
				                      <span>{dept}</span>
				                    </label>
				                  ))}
				                  </div>
				                )}
				              </div>
			            </div>

			            {/* Team Leader Filter */}
				            <div className="flex items-center gap-2">
				              <Users size={18} className="text-gray-500" />
				              <div ref={teamLeaderDropdownRef} className="relative">
				                <button
				                  type="button"
				                  onClick={() => {
				                    setIsTeamLeaderDropdownOpen((v) => !v);
				                    setIsDepartmentDropdownOpen(false);
				                  }}
				                  className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[170px] text-left"
				                >
				                  {selectedTeamLeaderLabel}
				                </button>
				                {isTeamLeaderDropdownOpen && (
				                  <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
				                  <button
				                    type="button"
				                    onClick={() => {
				                      setSelectedTeamLeaders([]);
				                      setCurrentPage(1);
				                    }}
				                    className="w-full text-left px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 rounded"
				                  >
				                    Clear (All Team Leaders)
				                  </button>
				                  <label className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 rounded">
				                    <input
				                      type="checkbox"
				                      checked={selectedTeamLeaders.includes(TEAM_LEADER_NONE)}
				                      onChange={() => toggleTeamLeaderSelection(TEAM_LEADER_NONE)}
				                      className="h-4 w-4 accent-sky-600"
				                    />
				                    <span>Not assigned</span>
				                  </label>
				                  {availableTeamLeaders.map((tl) => (
				                    <label key={tl} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 rounded">
				                      <input
				                        type="checkbox"
				                        checked={selectedTeamLeaders.includes(tl)}
				                        onChange={() => toggleTeamLeaderSelection(tl)}
				                        className="h-4 w-4 accent-sky-600"
				                      />
				                      <span>{tl}</span>
				                    </label>
				                  ))}
				                  </div>
				                )}
				              </div>
				            </div>

		            {/* Employee Count */}
		            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
		              <Users size={16} />
	              <span>
	                {filteredEmployees.length}
	                {filteredEmployees.length !== allEmployees.length ? ` / ${allEmployees.length}` : ""} employees
	              </span>
	            </div>

	            {/* Refresh Button */}
	            <button
	              onClick={handleRefresh}
	              className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100"
	            >
	              <RefreshCw size={16} />
	              Refresh
	            </button>

	            {/* Export (HR/SuperAdmin) */}
		            {canDownloadExcel && (
		              <button
		                onClick={openExportRangeModal}
		                disabled={!selectedRoster}
		                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
		                title={!selectedRoster ? "No roster selected" : "Choose date range and export attendance snapshot Excel"}
		              >
		                <Sparkles size={15} />
		                Download Excel
		              </button>
		            )}
		            {canDownloadSnapshotImage && (
		              <button
		                onClick={handleDownloadSnapshotImage}
		                disabled={!selectedWeek || filteredEmployees.length === 0 || isDownloadingImage}
		                className="flex items-center gap-2 px-4 py-2 bg-fuchsia-50 text-fuchsia-700 rounded-lg hover:bg-fuchsia-100 disabled:opacity-50 disabled:cursor-not-allowed"
		                title={!selectedWeek ? "Select a week to export image" : "Download full snapshot image"}
		              >
		                {isDownloadingImage ? "Generating Snapshot..." : "Download Snapshot"}
		              </button>
		            )}
		          </div>
		        </div>

        {/* No Data Message */}
        {allEmployees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex flex-col items-center">
              <AlertCircle size={48} className="text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
              <p className="text-gray-500 mb-4">
                No attendance records found for {allMonths.find(m => m.value === selectedMonth)?.name} {selectedYear}.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-600 max-w-lg">
                <p className="font-medium mb-2">📋 Available Rosters:</p>
                {Object.keys(rostersByMonth).length > 0 ? (
                  Object.values(rostersByMonth).map((roster, idx) => {
                    const month = allMonths.find(m => m.value === roster.month);
                    return (
                      <p key={idx} className="mb-1">
                        • {month?.name} {roster.year}: {roster.weeks?.reduce((total, week) => total + (week.employees?.length || 0), 0)} employees across {roster.weeks?.length || 0} weeks
                      </p>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No rosters found</p>
                )}
                <p className="mt-2 text-amber-600">
                  💡 Green dot (●) indicates months with available roster.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Employees Table */
		          <div className={isDarkTable ? "rounded-lg shadow border border-neutral-800 bg-neutral-900 text-neutral-100 overflow-hidden" : "rounded-lg shadow border border-gray-200 bg-white text-gray-900 overflow-hidden"}>
		            <div className={isDarkTable ? "flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950" : "flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50"}>
		              <div className={isDarkTable ? "text-sm text-neutral-300" : "text-sm text-gray-600"}>
		                Date: <span className={isDarkTable ? "text-neutral-100 font-medium" : "text-gray-900 font-medium"}>{formatDate(selectedDate)}</span>
		              </div>

		              <div className="flex items-center gap-2">
		                <button
		                  type="button"
		                  onClick={() => setTableTheme((t) => (t === "dark" ? "light" : "dark"))}
		                  className={isDarkTable ? "inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-neutral-700 hover:bg-neutral-900" : "inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 hover:bg-white"}
		                >
		                  {isDarkTable ? <Sun size={16} /> : <Moon size={16} />}
		                  {isDarkTable ? "Light" : "Dark"}
		                </button>

		              <div className="relative">
		                <button
		                  type="button"
		                  onClick={() => setShowColumnMenu((v) => !v)}
		                  className={isDarkTable ? "inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-neutral-700 hover:bg-neutral-900" : "inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 hover:bg-white"}
		                >
		                  <SlidersHorizontal size={16} />
		                  Columns
		                </button>

		                {showColumnMenu && (
		                  <div className={isDarkTable ? "absolute right-0 mt-2 w-60 rounded-lg border border-neutral-800 bg-neutral-950 shadow-lg p-2 z-20" : "absolute right-0 mt-2 w-60 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-20"}>
				                    {[
				                      { key: "employee", label: "Employee" },
				                      { key: "teamLeader", label: "Team Leader" },
				                      { key: "department", label: "Department" },
				                      { key: "shift", label: "Shift" },
				                      { key: "rosterStatus", label: "Roster Status" },
				                      { key: "transportStatus", label: "Transport Status" },
				                      { key: "departmentStatus", label: "Dept Status" },
				                      { key: "hrAttendance", label: "Hr Attendance" },
				                      { key: "transportArrival", label: "Transport Arrival" },
			                      { key: "departmentArrival", label: "Dept Arrival" },
			                    ].filter((col) => {
                            if (col.key === "transportStatus" || col.key === "hrAttendance") return !isEmployeeUser;
                            if (col.key === "transportArrival") return !isEmployeeNonTransportUser;
                            if (col.key === "departmentStatus" || col.key === "departmentArrival") return !isEmployeeTransportUser;
                            return true;
                          }).map((col) => (
		                      <label
		                        key={col.key}
		                        className={isDarkTable ? "flex items-center gap-2 px-2 py-1 text-sm text-neutral-200 hover:bg-neutral-900 rounded" : "flex items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50 rounded"}
		                      >
		                        <input
		                          type="checkbox"
		                          checked={Boolean(effectiveColumnVisibility[col.key])}
		                          onChange={(e) =>
		                            setColumnVisibility((prev) => ({ ...prev, [col.key]: e.target.checked }))
		                          }
	                          className="h-4 w-4 accent-indigo-500"
	                        />
	                        <span>{col.label}</span>
	                      </label>
	                    ))}
	                  </div>
	                )}
		              </div>
		              </div>
		              </div>
		            <div className="overflow-auto max-h-[70vh]">
	              <table className={isDarkTable ? "w-full divide-y divide-neutral-800" : "w-full divide-y divide-gray-200"}>
	                <thead className={isDarkTable ? "bg-neutral-950 sticky top-0 z-10" : "bg-gray-50 sticky top-0 z-10"}>
	                  <tr>
		                    {effectiveColumnVisibility.employee && (
		                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Employee</th>
		                    )}
		                    {effectiveColumnVisibility.teamLeader && (
		                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Team Leader</th>
		                    )}
		                    {effectiveColumnVisibility.department && (
		                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Department</th>
		                    )}
			                    {effectiveColumnVisibility.shift && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Shift</th>
			                    )}
			                    {effectiveColumnVisibility.rosterStatus && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Roster Status</th>
			                    )}
			                    {effectiveColumnVisibility.transportStatus && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
			                    )}
			                    {effectiveColumnVisibility.departmentStatus && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
			                    )}
			                    {effectiveColumnVisibility.hrAttendance && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Hr Attendance</th>
			                    )}
			                    {effectiveColumnVisibility.transportArrival && (
			                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Arrival</th>
			                    )}
		                    {effectiveColumnVisibility.departmentArrival && (
		                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Arrival</th>
		                    )}
	                  </tr>
	                </thead>
	                <tbody className={isDarkTable ? "divide-y divide-neutral-800" : "divide-y divide-gray-200"}>
		                  {pagedEmployees.map((emp) => {
		                      const attendance = getAttendanceForDate(emp, selectedDate);
		                      const hrAttendance =
		                        attendance?.hrAttendance || getHRAttendanceFromHours(attendance?.totalHours);
		                      const rosterStatus = attendance?.status || "Not set";
		                      
		                      return (
	                      <tr key={emp._id} className={isDarkTable ? "hover:bg-neutral-800/40" : "hover:bg-gray-50"}>
		                          {effectiveColumnVisibility.employee && (
		                            <td className="px-6 py-4">
	                              <div>
	                              <p className={isDarkTable ? "font-medium text-neutral-100" : "font-medium text-gray-900"}>{emp.name || "Unknown"}</p>
	                              <p className={isDarkTable ? "text-xs text-neutral-400" : "text-xs text-gray-500"}>{emp.username || "-"}</p>
	                              </div>
	                            </td>
	                          )}

		                          {effectiveColumnVisibility.teamLeader && (
	                            <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-300" : "px-6 py-4 text-sm text-gray-600"}>
	                              {emp.teamLeader || "-"}
	                            </td>
	                          )}

		                          {effectiveColumnVisibility.department && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-300" : "px-6 py-4 text-sm text-gray-600"}>{emp.department || "N/A"}</td>
	                          )}

			                          {effectiveColumnVisibility.shift && (
		                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-300" : "px-6 py-4 text-sm text-gray-600"}>
		                            {formatShift(emp.shiftStartHour, emp.shiftEndHour)}
		                            </td>
		                          )}

			                          {effectiveColumnVisibility.rosterStatus && (
		                            <td className="px-6 py-4">
		                              <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rosterStatus)}`}>
		                                {rosterStatus}
		                              </span>
		                            </td>
		                          )}

			                          {effectiveColumnVisibility.transportStatus && (
		                            <td className="px-6 py-4">
	                              <div className="flex flex-col gap-1">
	                                <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance?.transportStatus)}`}>
	                                  {attendance?.transportStatus || "Not set"}
	                                </span>
	                              </div>
	                            </td>
	                          )}

			                          {effectiveColumnVisibility.departmentStatus && (
		                            <td className="px-6 py-4">
		                              <div className="flex flex-col gap-1">
	                                <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance?.departmentStatus)}`}>
	                                  {attendance?.departmentStatus || "Not set"}
	                                </span>
		                              </div>
		                            </td>
		                          )}

			                          {effectiveColumnVisibility.hrAttendance && (
		                            <td className="px-6 py-4">
		                              {hrAttendance ? (
		                                <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hrAttendance)}`}>
		                                  {hrAttendance}
		                                </span>
		                              ) : (
		                                <span className={isDarkTable ? "text-xs text-neutral-500" : "text-xs text-gray-400"}>
		                                  Not set
		                                </span>
		                              )}
		                            </td>
		                          )}

			                          {effectiveColumnVisibility.transportArrival && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-green-300 font-medium" : "px-6 py-4 text-sm text-green-600 font-medium"}>
	                              {attendance?.transportArrivalTime
	                                ? formatTimeForDisplay(attendance.transportArrivalTime)
	                                : "--:-- --"}
	                            </td>
	                          )}

		                          {effectiveColumnVisibility.departmentArrival && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-green-300 font-medium" : "px-6 py-4 text-sm text-green-600 font-medium"}>
	                              {attendance?.departmentArrivalTime
	                                ? formatTimeForDisplay(attendance.departmentArrivalTime)
	                                : "--:-- --"}
	                            </td>
	                          )}
	                        </tr>
	                      );
	                    })}
	                </tbody>
              </table>
            </div>
            
            {/* Footer with Summary */}
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
	                  disabled={safePage <= 1}
		                  className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
	                  aria-label="Previous page"
	                >
	                  <ChevronLeft className="h-4 w-4" />
	                </button>
	                <button
	                  type="button"
	                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
	                  disabled={safePage >= totalPages}
		                  className={isDarkTable ? "p-2 rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
	                  aria-label="Next page"
	                >
	                  <ChevronRight className="h-4 w-4" />
	                </button>
	            </div>
	            </div>
	          </div>
	        )}
	      </div>
	      {canDownloadSnapshotImage && (
	        <div
	          ref={exportCaptureRef}
	          style={{
	            position: "fixed",
	            left: "-10000px",
	            top: 0,
	            width: "1700px",
	            background: "#f8fafc",
	            padding: "24px",
	            color: "#0f172a",
	            zIndex: -1,
	          }}
	        >
	          <div
	            style={{
	              borderRadius: "16px",
	              overflow: "hidden",
	              border: "1px solid #e2e8f0",
	              boxShadow: "0 10px 40px rgba(15, 23, 42, 0.08)",
	              background: "#ffffff",
	            }}
	          >
	            <div
	              style={{
	                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #a855f7 100%)",
	                color: "#ffffff",
	                padding: "20px 24px",
	              }}
	            >
	              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
	                <div>
	                  <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.15, fontWeight: 700 }}>Attendance Snapshot</h2>
	                  <p style={{ margin: "8px 0 0", opacity: 0.95 }}>
		                    Date: {formatDate(selectedDate)} | Department: {selectedDepartments.length === 0 ? "All" : selectedDepartments.join(", ")} | Team Leader: {selectedTeamLeaders.length === 0 ? "All" : selectedTeamLeaders.map((tl) => (tl === TEAM_LEADER_NONE ? "Not assigned" : tl)).join(", ")}
	                  </p>
	                </div>
	                <div style={{ textAlign: "right", fontSize: "14px", opacity: 0.9 }}>
	                  <div>{currentUser?.username || "User"}</div>
	                  <div>{summary?.userDepartment || currentUser?.department || "-"}</div>
	                </div>
	              </div>
	            </div>

	            <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
	              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
	                <span style={{ padding: "6px 12px", borderRadius: "999px", background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0e7490", fontWeight: 600 }}>
	                  Employees: {filteredEmployees.length}
	                </span>
	                {!isEmployeeUser && Object.keys(hrSummaryCounts).length === 0 ? (
	                  <span style={{ padding: "6px 12px", borderRadius: "999px", background: "#f3f4f6", border: "1px solid #d1d5db", color: "#6b7280", fontWeight: 600 }}>
	                    Hr Attendance: No status
	                  </span>
	                ) : !isEmployeeUser ? (
	                  Object.entries(hrSummaryCounts).map(([status, count]) => (
	                    <span
	                      key={status}
	                      style={{
	                        ...getStatusInlineStyle(status),
	                        padding: "6px 12px",
	                        borderRadius: "999px",
	                        borderWidth: "1px",
	                        borderStyle: "solid",
	                        fontWeight: 700,
	                      }}
	                    >
	                      {status}: {count}
	                    </span>
	                  ))
	                ) : null}
	              </div>
	            </div>

	            <div style={{ padding: "14px 20px 24px" }}>
	              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
	                <thead>
	                  <tr>
		                    {exportColumnDefs.map((col) => (
		                      <th
		                        key={col.key}
		                        style={{
	                          textAlign: "left",
	                          padding: "12px 10px",
	                          fontSize: "12px",
	                          letterSpacing: "0.02em",
	                          textTransform: "uppercase",
	                          color: "#475569",
	                          borderBottom: "1px solid #e2e8f0",
	                          background: "#f8fafc",
	                        }}
	                      >
		                        {col.label}
		                      </th>
		                    ))}
		                  </tr>
	                </thead>
	                <tbody>
	                  {filteredEmployees.map((emp, idx) => {
	                    const attendance = getAttendanceForDate(emp, selectedDate);
	                    const hrAttendance = attendance?.hrAttendance || getHRAttendanceFromHours(attendance?.totalHours);
	                    const rosterStatus = attendance?.status || "Not set";
	                    const transportStatus = attendance?.transportStatus || "Not set";
	                    const departmentStatus = attendance?.departmentStatus || "Not set";
	                    return (
	                      <tr key={emp._id || `${emp.username || "emp"}-${idx}`} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fcfcff" }}>
                          {exportColumnDefs.map((col) => {
                            if (col.key === "employee") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>
                                  {emp.name || "Unknown"}
                                </td>
                              );
                            }
                            if (col.key === "teamLeader") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>
                                  {emp.teamLeader || "-"}
                                </td>
                              );
                            }
                            if (col.key === "department") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>
                                  {emp.department || "-"}
                                </td>
                              );
                            }
                            if (col.key === "shift") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>
                                  {formatShift(emp.shiftStartHour, emp.shiftEndHour)}
                                </td>
                              );
                            }
                            if (col.key === "rosterStatus") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ ...getStatusInlineStyle(rosterStatus), border: `1px solid ${getStatusInlineStyle(rosterStatus).borderColor}`, borderRadius: "999px", padding: "5px 10px", lineHeight: 1.2, display: "inline-block", fontSize: "12px", fontWeight: 700 }}>
                                    {rosterStatus}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === "transportStatus") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ ...getStatusInlineStyle(transportStatus), border: `1px solid ${getStatusInlineStyle(transportStatus).borderColor}`, borderRadius: "999px", padding: "5px 10px", lineHeight: 1.2, display: "inline-block", fontSize: "12px", fontWeight: 700 }}>
                                    {transportStatus}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === "departmentStatus") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ ...getStatusInlineStyle(departmentStatus), border: `1px solid ${getStatusInlineStyle(departmentStatus).borderColor}`, borderRadius: "999px", padding: "5px 10px", lineHeight: 1.2, display: "inline-block", fontSize: "12px", fontWeight: 700 }}>
                                    {departmentStatus}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === "hrAttendance") {
                              return (
                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ ...getStatusInlineStyle(hrAttendance || "Not set"), border: `1px solid ${getStatusInlineStyle(hrAttendance || "Not set").borderColor}`, borderRadius: "999px", padding: "5px 10px", lineHeight: 1.2, display: "inline-block", fontSize: "12px", fontWeight: 700 }}>
                                    {hrAttendance || "Not set"}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === "transportArrival") {
                              return (
	                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#16a34a", fontWeight: 600 }}>
	                                  {attendance?.transportArrivalTime ? formatTimeForDisplay(attendance.transportArrivalTime) : "--:-- --"}
	                                </td>
                              );
                            }
                            if (col.key === "departmentArrival") {
                              return (
	                                <td key={col.key} style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#16a34a", fontWeight: 600 }}>
	                                  {attendance?.departmentArrivalTime ? formatTimeForDisplay(attendance.departmentArrivalTime) : "--:-- --"}
	                                </td>
                              );
                            }
                            return null;
                          })}
		                      </tr>
	                    );
	                  })}
	                </tbody>
	              </table>
	            </div>
	          </div>
	        </div>
		      )}

		      {isExportRangeModalOpen && (
		        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4">
		          <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl">
		            <div className="relative p-5 md:p-6 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 text-white">
		              <button
		                type="button"
		                onClick={() => setIsExportRangeModalOpen(false)}
		                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
		                aria-label="Close export date range"
		              >
		                <X size={18} />
		              </button>
		              <h3 className="text-xl font-semibold">Export Attendance Range</h3>
		              <p className="text-sm text-emerald-50 mt-1">
		                Pick start and end date from connected calendars.
		              </p>
		              <div className="mt-4 rounded-xl bg-white/15 border border-white/25 p-3">
		                <div className="flex flex-wrap items-center gap-2">
		                  <span className="text-xs uppercase tracking-wide text-white/80">From</span>
		                  <span className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-sm font-semibold">
		                    {formatPrettyDate(draftExportStartDate)}
		                  </span>
		                  <span className="text-white/80">to</span>
		                  <span className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-sm font-semibold">
		                    {formatPrettyDate(draftExportEndDate)}
		                  </span>
		                </div>
		              </div>
		            </div>

		            <div className="p-5 md:p-6 bg-slate-50">
		              <div className="mb-4 flex items-center justify-between">
		                <button
		                  type="button"
		                  onClick={goExportCalendarPrevMonth}
		                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
		                >
		                  <ChevronLeft size={16} />
		                  Prev
		                </button>
		                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
		                  Click once for start date, click again for end date
		                </div>
		                <button
		                  type="button"
		                  onClick={goExportCalendarNextMonth}
		                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
		                >
		                  Next
		                  <ChevronRight size={16} />
		                </button>
		              </div>

		              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
		                {exportCalendarMonths.map((monthDate, monthIdx) => {
		                  const days = buildCalendarDays(monthDate);
		                  return (
		                    <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`} className="rounded-xl border border-slate-200 bg-white p-4">
		                      <div className="mb-3 text-center font-semibold text-slate-800">
		                        {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
		                      </div>
		                      <div className="grid grid-cols-7 gap-1 mb-2">
		                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
		                          <div key={`${monthIdx}-${dayName}`} className="text-[11px] uppercase tracking-wide text-slate-400 text-center py-1">
		                            {dayName}
		                          </div>
		                        ))}
		                      </div>
		                      <div className="grid grid-cols-7 gap-1">
		                        {days.map((day, idx) => {
		                          const dayKey = toDateKeyPlain(day);
		                          const inCurrentMonth = day.getMonth() === monthDate.getMonth();
		                          const isStart = dayKey === draftExportStartDate;
		                          const isEnd = dayKey === draftExportEndDate;
		                          const isInRange =
		                            Boolean(draftExportStartDate && draftExportEndDate) &&
		                            dayKey > draftExportStartDate &&
		                            dayKey < draftExportEndDate;

		                          const baseClass = "h-10 rounded-lg text-sm transition-colors border";
		                          let stateClass = "border-transparent text-slate-700 hover:bg-slate-100";
		                          if (!inCurrentMonth) stateClass = "border-transparent text-slate-300 hover:bg-slate-50";
		                          if (isInRange) stateClass = "border-sky-100 bg-sky-50 text-sky-700";
		                          if (isStart || isEnd) {
		                            stateClass = "border-emerald-500 bg-emerald-500 text-white font-semibold shadow-sm";
		                          }

		                          return (
		                            <button
		                              key={`${monthIdx}-${idx}-${dayKey}`}
		                              type="button"
		                              onClick={() => handleRangeDatePick(dayKey)}
		                              className={`${baseClass} ${stateClass}`}
		                            >
		                              {day.getDate()}
		                            </button>
		                          );
		                        })}
		                      </div>
		                    </div>
		                  );
		                })}
		              </div>
		            </div>

		            <div className="px-5 md:px-6 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-end gap-2">
		              <button
		                type="button"
		                onClick={() => setIsExportRangeModalOpen(false)}
		                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
		              >
		                Cancel
		              </button>
		              <button
		                type="button"
		                onClick={handleConfirmExportRange}
		                disabled={!draftExportStartDate || !draftExportEndDate}
		                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
		              >
		                Export Excel
		              </button>
		            </div>
		          </div>
		        </div>
		      )}
		    </div>
		  );
};

export default AttendanceSnapshot;

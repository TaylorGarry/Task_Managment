

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
import html2canvas from "html2canvas";

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
  { value: "WO", label: "Weekly Off (WO)", color: "bg-emerald-100 text-emerald-800" },
  { value: "L", label: "Leave (L)", color: "bg-yellow-100 text-yellow-800" },
  { value: "NCNS", label: "No Call No Show (NCNS)", color: "bg-red-100 text-red-800" },
  { value: "UL", label: "Unpaid Leave (UL)", color: "bg-orange-100 text-orange-800" },
  { value: "LWP", label: "Leave Without Pay (LWP)", color: "bg-purple-100 text-purple-800" },
  { value: "BL", label: "Birthday Leave (BL)", color: "bg-teal-100 text-teal-800" },
  { value: "H", label: "Holiday (H)", color: "bg-pink-100 text-pink-800" },
  { value: "LWD", label: "Last Working Day (LWD)", color: "bg-gray-100 text-gray-800" },
  { value: "HD", label: "Half Day (HD)", color: "bg-teal-100 text-teal-800" }
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

const toUtcDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toIstDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};
 
const isValidTimeFormat = (time) => {
  if (!time || time === "") return true;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};
 
const getHRAttendanceFromHours = (hours) => {
  if (!hours) return null;
  if (hours >= 7.5) return "P";
  if (hours >= 5 && hours < 7.5) return "HD";
  if (hours > 0 && hours < 5) return "LWP";
  return null;
};

const formatTimeForDisplay = (dateString) => {
  if (!dateString) return '--:-- --';
  
  if (typeof dateString === "string" && /^\d{2}:\d{2}$/.test(dateString)) {
    const [hours, minutes] = dateString.split(':').map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  }
  
  if (typeof dateString === "string" && dateString.includes("T")) {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '--:-- --';
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return formatter.format(date).toUpperCase();
    } catch (e) {
      return '--:-- --';
    }
  }
  
  return '--:-- --';
};

const formatTimeForInput = (dateString) => {
  if (!dateString) return '';
  
  if (typeof dateString === "string" && /^\d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  if (typeof dateString === "string" && dateString.includes("T")) {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const hour = parts.find(p => p.type === 'hour')?.value.padStart(2, '0') || '00';
      const minute = parts.find(p => p.type === 'minute')?.value.padStart(2, '0') || '00';
      
      return `${hour}:${minute}`;
    } catch (e) {
      return '';
    }
  }
  
  return '';
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

const isDateWithinWeek = (dateKey, week) => {
  if (!dateKey || !week) return false;
  const startKey = toIstDateKey(week.startDate);
  const endKey = toIstDateKey(week.endDate);
  if (!startKey || !endKey) return false;
  return dateKey >= startKey && dateKey <= endKey;
};

const isWeekOverlappingMonth = (week, month, year) => {
  if (!week?.startDate || !week?.endDate) return false;
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return true;

  const startKey = toIstDateKey(week.startDate);
  const endKey = toIstDateKey(week.endDate);
  if (!startKey || !endKey) return false;
  const monthStartKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01`;
  const monthEndDay = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
  const monthEndKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;
  return startKey <= monthEndKey && endKey >= monthStartKey;
};

const parseMonthYearFromDateKey = (dateKey) => {
  const match = String(dateKey || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { month, year };
};

const clipWeekToMonth = (week, month, year) => {
  if (!week?.startDate || !week?.endDate) return week;
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return week;

  const weekStartKey = toIstDateKey(week.startDate);
  const weekEndKey = toIstDateKey(week.endDate);
  if (!weekStartKey || !weekEndKey) return week;

  const monthStartKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01`;
  const monthEndDay = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
  const monthEndKey = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;
  const clippedStartKey = weekStartKey < monthStartKey ? monthStartKey : weekStartKey;
  const clippedEndKey = weekEndKey > monthEndKey ? monthEndKey : weekEndKey;
  const clippedStartDate = new Date(`${clippedStartKey}T00:00:00.000Z`);
  const clippedEndDate = new Date(`${clippedEndKey}T00:00:00.000Z`);
  const startDay = Number.parseInt(clippedStartKey.split("-")[2], 10);
  const firstDayOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
  const displayWeekNumber = Math.max(1, Math.ceil((firstDayOfMonth.getUTCDay() + startDay) / 7));

  return {
    ...week,
    startDate: clippedStartDate.toISOString(),
    endDate: clippedEndDate.toISOString(),
    displayWeekNumber,
  };
};

const ArrivalAttendanceUpdate = ({ rosterId, delegatedFromUserId = "" }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdminNavbarUser = useMemo(() => ["superAdmin", "HR"].includes(currentUser?.accountType), [currentUser]);
  const { updateEmployeesData, loading, error } = useSelector((state) => state.roster);
  
  const initialFetchDone = useRef(false);
  const autoSelectWeekDone = useRef(false); // ✅ NEW
  
  const [selectedDate, setSelectedDate] = useState(() => toIstDateKey(new Date()) || getLocalDateKey());
  const [selectedWeek, setSelectedWeek] = useState(""); // ✅ Changed to empty
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tableTheme, setTableTheme] = useState("light");
  const [updates, setUpdates] = useState({});
  const [searchBy, setSearchBy] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewType, setViewType] = useState({});
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [activeRosterId, setActiveRosterId] = useState(rosterId);
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
  const exportCaptureRef = useRef(null);
  const [isDownloadingDelegatedSnapshot, setIsDownloadingDelegatedSnapshot] = useState(false);
  const didInitMonthViewRef = useRef(false);
  const monthFilterContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const month = params.get("month");
    const year = params.get("year");
    const parsedMonth = Number.parseInt(month, 10);
    const parsedYear = Number.parseInt(year, 10);
    if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return null;
    return { month: parsedMonth, year: parsedYear };
  }, [location.search]);

  useEffect(() => {
    didInitMonthViewRef.current = false;
    if (monthFilterContext) {
      const monthStartKey = `${monthFilterContext.year}-${String(monthFilterContext.month).padStart(2, "0")}-01`;
      setSelectedDate(monthStartKey);
      setSelectedWeek(""); // ✅ Reset to empty
      setAvailableWeeks([]);
      setWeekInfo(null);
    }
  }, [monthFilterContext?.month, monthFilterContext?.year]);
  
  const selectedWeekMeta = availableWeeks.find(
    (week) => String(week?.weekNumber) === String(selectedWeek)
  );
  const selectedWeekStartKey = toIstDateKey(selectedWeekMeta?.startDate || weekInfo?.startDate);
  const selectedWeekEndKey = toIstDateKey(selectedWeekMeta?.endDate || weekInfo?.endDate);
  const effectiveSelectedDate =
    selectedWeekStartKey && selectedWeekEndKey
      ? (!selectedDate || selectedDate < selectedWeekStartKey
          ? selectedWeekStartKey
          : selectedDate > selectedWeekEndKey
            ? selectedWeekEndKey
            : selectedDate)
      : selectedDate;
  const monthYearForRequests = useMemo(() => {
    if (monthFilterContext) return monthFilterContext;
    return (
      parseMonthYearFromDateKey(effectiveSelectedDate) ||
      parseMonthYearFromDateKey(selectedDate)
    );
  }, [monthFilterContext, effectiveSelectedDate, selectedDate]);
  const isEmployeeUser = currentUser?.accountType === "employee";

  if (!rosterId) {
    return (
      <div className="bg-gray-100 overflow-x-hidden">
        {isAdminNavbarUser ? <AdminNavbar showOutlet={false} /> : <Navbar />}
        <div className="container mx-auto w-full max-w-full px-4 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No Roster Selected</h3>
            <p className="text-gray-500 mt-2">
              Please select a roster from the list to start updating attendance.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (currentUser) {
      setViewType({
        isSuperAdmin: currentUser.accountType === "superAdmin",
        isHR: currentUser.accountType === "HR",
        isTransport: currentUser.department === "Transport",
        isEmployee: currentUser.accountType === "employee",
        username: currentUser.username,
        department: currentUser.department,
        designation: currentUser.designation
      });
    }
  }, [currentUser]);

  useEffect(() => {
    initialFetchDone.current = false;
    didInitMonthViewRef.current = false;
    autoSelectWeekDone.current = false; // ✅ Reset
    setActiveRosterId(rosterId);
    setSelectedWeek(""); // ✅ Reset
    setAvailableWeeks([]);
    setWeekInfo(null);
    setCurrentPage(1);
    setUpdates({});
    setSelectedEmployeeIds([]);
  }, [rosterId, delegatedFromUserId]);

  useEffect(() => {
    if (rosterId && !initialFetchDone.current) initialFetchDone.current = true;
    // ✅ REMOVED: No longer force setSelectedWeek("1")
  }, [rosterId]);

  // ✅ NEW: Auto-select first available week when weeks load
  useEffect(() => {
    if (!activeRosterId || selectedWeek || !effectiveSelectedDate) return;

    dispatch(getEmployeesForUpdates({
      rosterId: activeRosterId,
      weekNumber: 1,
      date: effectiveSelectedDate,
      month: monthYearForRequests?.month,
      year: monthYearForRequests?.year,
      page: currentPage,
      limit: pageSize,
      q: appliedSearch,
      searchBy,
      delegatedFrom: delegatedFromUserId,
    }));
  }, [dispatch, activeRosterId, selectedWeek, effectiveSelectedDate, monthYearForRequests?.month, monthYearForRequests?.year, currentPage, pageSize, appliedSearch, searchBy, delegatedFromUserId]);

  useEffect(() => {
    if (availableWeeks.length > 0 && !selectedWeek && !autoSelectWeekDone.current) {
      const firstWeek = availableWeeks[0];
      const firstWeekNumber = String(firstWeek?.weekNumber);
      if (firstWeekNumber) {
        setSelectedWeek(firstWeekNumber);
        autoSelectWeekDone.current = true;
        
        const weekStartKey = toIstDateKey(firstWeek?.startDate);
        if (weekStartKey) {
          setSelectedDate(weekStartKey);
        }
      }
    }
  }, [availableWeeks, selectedWeek]);

  useEffect(() => {
    if (activeRosterId && selectedWeek && effectiveSelectedDate) {
      const weekNumber = parseInt(selectedWeek);
      dispatch(getEmployeesForUpdates({
        rosterId: activeRosterId,
        weekNumber,
        date: effectiveSelectedDate,
        month: monthYearForRequests?.month,
        year: monthYearForRequests?.year,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy,
        delegatedFrom: delegatedFromUserId,
      }));
    }
  }, [dispatch, activeRosterId, selectedWeek, effectiveSelectedDate, monthYearForRequests?.month, monthYearForRequests?.year, currentPage, pageSize, appliedSearch, searchBy, delegatedFromUserId]);

  useEffect(() => {
    if (!activeRosterId || !selectedWeek || !effectiveSelectedDate) return;
    if (!location.pathname.includes("/attendance-update")) return;

    dispatch(getEmployeesForUpdates({
      rosterId: activeRosterId,
      weekNumber: parseInt(selectedWeek),
      date: effectiveSelectedDate,
      month: monthYearForRequests?.month,
      year: monthYearForRequests?.year,
      page: currentPage,
      limit: pageSize,
      q: appliedSearch,
      searchBy,
      delegatedFrom: delegatedFromUserId,
    }));
  }, [location.key, activeRosterId, selectedWeek, effectiveSelectedDate, monthYearForRequests?.month, monthYearForRequests?.year, currentPage, pageSize, appliedSearch, searchBy, delegatedFromUserId, dispatch]);

  useEffect(() => {
    if (!error) return;
    const message = String(error);
    const match = message.match(/Available weeks:\s*([0-9,\s]+)/i);
    if (!match?.[1]) return;

    const availableWeekNumbers = match[1]
      .split(",")
      .map((w) => Number.parseInt(String(w).trim(), 10))
      .filter((n) => Number.isFinite(n));
    if (!availableWeekNumbers.length) return;

    const fallbackWeek = String(availableWeekNumbers[0]);
    if (String(selectedWeek) !== fallbackWeek) {
      setSelectedWeek(fallbackWeek);
      setCurrentPage(1);
    }
  }, [error, selectedWeek]);

  useEffect(() => {
    if (updateEmployeesData?.data) {
      const responseData = updateEmployeesData.data;
      
      if (responseData.weekNumber) {
        let nextWeekInfo = {
          rosterId: responseData.rosterId || activeRosterId,
          weekNumber: responseData.weekNumber,
          displayWeekNumber: responseData.weekNumber,
          startDate: responseData.startDate,
          endDate: responseData.endDate,
          canEdit: responseData.canEdit,
          editMessage: responseData.editMessage
        };
        if (
          monthFilterContext &&
          isWeekOverlappingMonth(nextWeekInfo, monthFilterContext.month, monthFilterContext.year)
        ) {
          nextWeekInfo = clipWeekToMonth(
            nextWeekInfo,
            monthFilterContext.month,
            monthFilterContext.year
          );
        }
        setWeekInfo(nextWeekInfo);
      }
      if (responseData.rosterId && String(responseData.rosterId) !== String(activeRosterId)) {
        setActiveRosterId(responseData.rosterId);
      }
      
      const responseWeeks = responseData.weeks || [];
      const weeks = monthFilterContext
        ? responseWeeks
            .filter((week) =>
              isWeekOverlappingMonth(week, monthFilterContext.month, monthFilterContext.year)
            )
            .map((week) => clipWeekToMonth(week, monthFilterContext.month, monthFilterContext.year))
        : responseWeeks;
      const sortedWeeks = [...weeks].sort((a, b) => {
        const aStart = new Date(a?.startDate || 0).getTime();
        const bStart = new Date(b?.startDate || 0).getTime();
        return aStart - bStart;
      });

      if (JSON.stringify(sortedWeeks) !== JSON.stringify(availableWeeks)) {
        setAvailableWeeks(sortedWeeks);
      }
      
      if (sortedWeeks.length > 0) {
        if (monthFilterContext && !didInitMonthViewRef.current) {
          const monthStartKey = `${monthFilterContext.year}-${String(monthFilterContext.month).padStart(2, "0")}-01`;
          const preferredWeek =
            sortedWeeks.find((week) => {
              const startKey = toIstDateKey(week?.startDate);
              const endKey = toIstDateKey(week?.endDate);
              if (!startKey || !endKey) return false;
              return monthStartKey >= startKey && monthStartKey <= endKey;
            }) || sortedWeeks[0];
          const firstWeekStartKey = toIstDateKey(preferredWeek?.startDate);
          if (preferredWeek?.weekNumber != null) {
            setSelectedWeek(String(preferredWeek.weekNumber));
          }
          if (firstWeekStartKey) {
            setSelectedDate(firstWeekStartKey);
          }
          setCurrentPage(1);
          didInitMonthViewRef.current = true;
          return;
        }
        
        // ✅ Only auto-select if no week selected yet
        if (!monthFilterContext && !selectedWeek && sortedWeeks.length > 0 && !autoSelectWeekDone.current) {
          const firstWeek = sortedWeeks[0];
          const firstWeekStartKey = toIstDateKey(firstWeek?.startDate);
          if (firstWeek?.weekNumber != null) {
            setSelectedWeek(String(firstWeek.weekNumber));
            autoSelectWeekDone.current = true;
          }
          if (firstWeekStartKey) {
            setSelectedDate(firstWeekStartKey);
          }
          setCurrentPage(1);
          return;
        }

        const weekForSelectedDate = sortedWeeks.find((week) => isDateWithinWeek(selectedDate, week));
        const hasSelectedWeek = sortedWeeks.some(
          (week) => String(week?.weekNumber) === String(selectedWeek)
        );
        if (selectedWeek && !hasSelectedWeek) {
          const preferredWeek = weekForSelectedDate || sortedWeeks[0];
          setSelectedWeek(String(preferredWeek.weekNumber));
        }
      }
    }
  }, [updateEmployeesData, availableWeeks, selectedDate, selectedWeek, monthFilterContext, activeRosterId]);

  // ✅ CRITICAL: Ensure date is within week range
  useEffect(() => {
    if (!selectedWeekStartKey || !selectedWeekEndKey) return;
    if (!selectedDate || selectedDate < selectedWeekStartKey || selectedDate > selectedWeekEndKey) {
      const weekForSelectedDate = availableWeeks.find((week) => isDateWithinWeek(selectedDate, week));
      if (weekForSelectedDate && String(weekForSelectedDate.weekNumber) !== String(selectedWeek)) {
        setSelectedWeek(String(weekForSelectedDate.weekNumber));
        setCurrentPage(1);
        return;
      }
      setSelectedDate(selectedWeekStartKey);
      setCurrentPage(1);
    }
  }, [selectedDate, selectedWeekStartKey, selectedWeekEndKey, availableWeeks, selectedWeek]);

  const rawRosterEntries = updateEmployeesData?.data?.rosterEntries || [];
  const rosterEntries = useMemo(() => {
    if (!Array.isArray(rawRosterEntries)) return [];

    const seen = new Set();
    return rawRosterEntries.filter((employee) => {
      const userId = String(employee?.userId?._id || employee?.userId || "").trim();
      const username = String(employee?.username || "").trim().toLowerCase();
      const name = String(employee?.name || "").trim().toLowerCase();
      const department = String(employee?.department || "").trim().toLowerCase();
      const teamLeader = String(employee?.teamLeader || "").trim().toLowerCase();
      const shiftKey = `${employee?.shiftStartHour ?? ""}-${employee?.shiftEndHour ?? ""}`;

      const dedupeKey = userId || username || `${name}|${department}|${teamLeader}|${shiftKey}`;
      if (!dedupeKey) return true;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [rawRosterEntries]);
  const pagination = updateEmployeesData?.data?.pagination;
  const totalEmployees = Number(pagination?.totalEmployees ?? rosterEntries.length);
  const totalPages = Number(
    pagination?.totalPages ?? Math.max(1, Math.ceil(totalEmployees / Math.max(pageSize, 1)))
  );
  const rangeStart = totalEmployees === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalEmployees === 0 ? 0 : Math.min(currentPage * pageSize, totalEmployees);

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
    setSelectedEmployeeIds((prev) => {
      const newSelected = prev.filter((id) => {
        if (!currentIds.has(String(id))) return false;
        const row = rosterEntries.find((emp) => String(emp._id) === String(id));
        return row ? !isOwnRosterRow(row) : false;
      });
      // Prevent unnecessary re-renders if the filtered list is the same
      if (newSelected.length === prev.length && newSelected.every((id, i) => id === prev[i])) {
        return prev;
      }
      return newSelected;
    });
  }, [rosterEntries]);

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
    if (!activeRosterId || !selectedWeek || !effectiveSelectedDate) return;
    dispatch(
      getEmployeesForUpdates({
        rosterId: activeRosterId,
        weekNumber: parseInt(selectedWeek),
        date: effectiveSelectedDate,
        month: monthYearForRequests?.month,
        year: monthYearForRequests?.year,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy,
        delegatedFrom: delegatedFromUserId,
      })
    );
  };

  const getTodayStatus = (employee) => {
    if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) {
      return null;
    }

    const selectedDateKey = toIstDateKey(selectedDate) || toLocalDateKey(selectedDate) || toUtcDateKey(selectedDate);
    if (!selectedDateKey) return null;

    const matches = employee.dailyStatus.filter((d) => {
      if (!d?.date) return false;
      const localKey = toLocalDateKey(d.date);
      const utcKey = toUtcDateKey(d.date);
      const istKey = toIstDateKey(d.date);
      return (
        istKey === selectedDateKey ||
        localKey === selectedDateKey ||
        utcKey === selectedDateKey
      );
    });

    if (!matches.length) return null;

    const scored = matches.map((d) => ({
      item: d,
      score: [d?.status, d?.departmentStatus, d?.transportStatus].filter((v) => Boolean(v)).length
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].item;
  };

  const isDarkTable = tableTheme === "dark";

  const serverManagedTeamCount = Number(updateEmployeesData?.data?.summary?.managedTeamCount || 0);
  const currentUserId = String(currentUser?._id || currentUser?.id || "").trim();
  const currentUsername = String(currentUser?.username || "").trim().toLowerCase();
  const inferredManagedTeamCount = rosterEntries.filter((employee) => {
    if (!employee) return false;
    const sameUserId =
      currentUserId &&
      employee.userId &&
      String(employee.userId).trim() === currentUserId;
    const sameName =
      currentUsername &&
      String(employee.name || "").trim().toLowerCase() === currentUsername;
    const sameUsername =
      currentUsername &&
      String(employee.username || "").trim().toLowerCase() === currentUsername;
    return !(sameUserId || sameName || sameUsername);
  }).length;
  const managedTeamCount = Math.max(serverManagedTeamCount, inferredManagedTeamCount);
  const hasManagedTeam = managedTeamCount > 0;
  const canTeamLeaderManageTeam = hasManagedTeam;
  const canUpdateTransport =
    (viewType.isSuperAdmin || viewType.isHR || (!isEmployeeUser && viewType.isTransport)) &&
    weekInfo?.canEdit !== false;
  const canUpdateDepartment =
    (viewType.isSuperAdmin || viewType.isHR || canTeamLeaderManageTeam) &&
    weekInfo?.canEdit !== false;
  const canUpdatePunchTimes = (viewType.isHR || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;
  const isEmployeeReadOnly = isEmployeeUser && !hasManagedTeam;
  const canBulkUpdate = canUpdateTransport || canUpdateDepartment || canUpdatePunchTimes;
  const isEmployeeTransportUser = isEmployeeUser && viewType.department === "Transport";
  const isEmployeeNonTransportUser = isEmployeeUser && viewType.department !== "Transport";
  const canViewPunchColumns = !isEmployeeUser;
  const canViewTotalHours = !isEmployeeUser;
  const canViewHrAttendance = !isEmployeeUser;
  const canViewTransportStatus = !isEmployeeUser;
  const canViewTransportArrival = !isEmployeeNonTransportUser;
  const canViewDepartmentStatus = !isEmployeeTransportUser;
  const canViewDepartmentArrival = !isEmployeeTransportUser;
  const exportColumnDefs = [
    { key: "employee", label: "Employee" },
    { key: "teamLeader", label: "Team Leader" },
    { key: "department", label: "Department" },
    { key: "shift", label: "Shift" },
    { key: "rosterStatus", label: "Roster Status" },
    ...(canViewTransportStatus ? [{ key: "transportStatus", label: "Transport Status" }] : []),
    ...(canViewDepartmentStatus ? [{ key: "departmentStatus", label: "Dept Status" }] : []),
    ...(canViewTransportArrival ? [{ key: "transportArrival", label: "Transport Arrival" }] : []),
    ...(canViewDepartmentArrival ? [{ key: "departmentArrival", label: "Dept Arrival" }] : []),
  ];
  const isOwnRosterRow = (employee) => {
    if (!employee) return false;
    const currentUserId = String(currentUser?._id || currentUser?.id || "").trim();
    const sameUserId =
      currentUserId &&
      employee.userId &&
      String(employee.userId).trim() === currentUserId;
    const currentUsername = String(currentUser?.username || "").trim().toLowerCase();
    const employeeUsername = String(employee.username || "").trim().toLowerCase();
    const sameName =
      currentUsername &&
      String(employee.name || "").trim().toLowerCase() === currentUsername;
    const sameUsername = currentUsername && employeeUsername === currentUsername;
    return Boolean(sameUserId || sameName || sameUsername);
  };
  const selectableEntries = rosterEntries.filter((employee) => !isOwnRosterRow(employee));

  const isAllSelected =
    selectableEntries.length > 0 &&
    selectedEmployeeIds.length > 0 &&
    selectedEmployeeIds.length === selectableEntries.length;
  const selectedEditableCount = selectedEmployeeIds.filter((id) => {
    const row = rosterEntries.find((emp) => String(emp._id) === String(id));
    return row && !isOwnRosterRow(row);
  }).length;

  const handleToggleSelectAll = (checked) => {
    if (!canBulkUpdate) return;
    setSelectedEmployeeIds(checked ? selectableEntries.map((e) => e._id) : []);
  };

  const handleToggleSelectOne = (employeeId, checked) => {
    if (!canBulkUpdate) return;
    setSelectedEmployeeIds((prev) => {
      const id = String(employeeId);
      if (checked) return Array.from(new Set([...prev.map(String), id]));
      return prev.filter((x) => String(x) !== id);
    });
  };

  const handleApplyBulkUpdate = async () => {
    if (!canBulkUpdate) {
      toast.error("Read-only view for your role.");
      return;
    }
    if (!selectedWeek || !effectiveSelectedDate) {
      toast.error("Please select week and date first.");
      return;
    }

    const filteredEmployeeIds = selectedEmployeeIds.filter((id) => {
      const row = rosterEntries.find((emp) => String(emp._id) === String(id));
      return row && !isOwnRosterRow(row);
    });

    if (filteredEmployeeIds.length === 0) {
      toast.error("Please select at least one employee.");
      return;
    }

    const payload = {
      rosterId: activeRosterId || rosterId,
      weekNumber: parseInt(selectedWeek),
      employeeIds: filteredEmployeeIds,
      date: effectiveSelectedDate,
      delegatedFrom: delegatedFromUserId || undefined,
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

    if (isEmployeeNonTransportUser && payload.departmentStatus === "P" && !payload.arrivalTime) {
      toast.error("Department arrival time is required when Department Status is P.");
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
        rosterId: activeRosterId || rosterId,
        weekNumber: parseInt(selectedWeek),
        date: selectedDate,
        month: monthYearForRequests?.month,
        year: monthYearForRequests?.year,
        page: currentPage,
        limit: pageSize,
        q: appliedSearch,
        searchBy,
        delegatedFrom: delegatedFromUserId,
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
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDownloadDelegatedSnapshotImage = async () => {
    if (!delegatedFromUserId || !exportCaptureRef.current || isDownloadingDelegatedSnapshot) return;
    setIsDownloadingDelegatedSnapshot(true);
    try {
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
      const dateKey = selectedDate || getLocalDateKey();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `delegated_attendance_snapshot_${dateKey}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Delegated attendance snapshot downloaded");
    } catch (err) {
      console.error("Delegated snapshot capture failed:", err);
      toast.error("Failed to generate delegated snapshot image");
    } finally {
      setIsDownloadingDelegatedSnapshot(false);
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
    <div className="bg-gray-100 overflow-x-hidden">
      {isAdminNavbarUser ? <AdminNavbar showOutlet={false} /> : <Navbar />}

      <div className="container mx-auto w-full max-w-full px-4 py-8">
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
            
            <div className={`px-4 py-2 rounded-lg ${
              viewType.isSuperAdmin ? "bg-purple-100 text-purple-800" :
              viewType.isHR ? "bg-amber-100 text-amber-800" :
              viewType.isTransport ? "bg-emerald-100 text-emerald-800" :
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
          {delegatedFromUserId && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleDownloadDelegatedSnapshotImage}
                disabled={isDownloadingDelegatedSnapshot}
                className="px-4 py-2 text-sm rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800"
              >
                {isDownloadingDelegatedSnapshot ? "Generating Snapshot..." : "Export Delegated Snapshot Image"}
              </button>
            </div>
          )}

          {weekInfo && (
            <div className={`mt-4 p-3 rounded-lg ${
              weekInfo.canEdit ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <p className="text-sm font-medium">
                Week {weekInfo.displayWeekNumber || weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(weekInfo.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
              </p>
              <p className="text-xs mt-1">{weekInfo.editMessage}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Select Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const nextWeek = availableWeeks.find(
                    (week) => String(week?.weekNumber) === String(e.target.value)
                  );
                  setSelectedWeek(e.target.value);
                  const nextWeekStartKey = toIstDateKey(nextWeek?.startDate);
                  if (nextWeekStartKey) {
                    setSelectedDate(nextWeekStartKey);
                  }
                  setCurrentPage(1);
                  setSelectedEmployeeIds([]);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">-- Select Week --</option>
                {availableWeeks.map((week) => (
                  <option
                    key={`${week.weekNumber}-${toIstDateKey(week.startDate) || ""}-${toIstDateKey(week.endDate) || ""}`}
                    value={week.weekNumber}
                  >
                    Week {week.displayWeekNumber || week.weekNumber} ({new Date(week.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(week.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}) - {week.employeeCount || 0} employees
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={effectiveSelectedDate}
                min={selectedWeekStartKey || undefined}
                max={selectedWeekEndKey || undefined}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Search (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
                    placeholder="Type to search (optional)..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-semibold"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave empty to show all employees</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Employees:</span> {totalEmployees}
              </p>
              {appliedSearch ? (
                <p className="text-xs text-gray-500 mt-1">
                  Showing results for: <span className="font-medium">{appliedSearch}</span>
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Showing all employees (no search filter)
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Department:</span> {currentUser.department}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Team Leader:</span> {currentUser.username}
              </p>
              {isEmployeeReadOnly && (
                <p className="text-xs text-amber-700 mt-1">
                  Read-only: You can only view your own roster and attendance.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employees Table */}
        {loading && rosterEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
                  <span className="font-semibold">Selected:</span> {selectedEditableCount}
                </div>
                {!canBulkUpdate && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    View only mode
                  </div>
                )}

                {canUpdatePunchTimes && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Bulk Punch In</label>
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
                      <label className="block text-xs font-bold text-gray-600 mb-1">Bulk Punch Out</label>
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
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bulk Transport Status</label>
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
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bulk Dept Status</label>
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
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bulk Arrival Time</label>
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
                    className="px-3 py-2 text-sm rounded border border-gray-200 "
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
                  {canBulkUpdate && (
                    <>
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
                        className="px-3 py-2 text-sm rounded border border-gray-200  disabled:opacity-50"
                        disabled={bulkUpdating}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyBulkUpdate}
                        className="px-4 py-2 text-sm rounded bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={bulkUpdating || selectedEditableCount === 0}
                      >
                        Apply to Selected
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={
              isDarkTable
                ? "pro-table-shell-dark w-full max-w-full text-neutral-100"
                : "pro-table-shell w-full max-w-full text-gray-900"
            }>
              <div className="pro-scroll overflow-x-auto overflow-y-auto max-h-[70vh]">
                <table className={isDarkTable ? "pro-table pro-table-dark min-w-full" : "pro-table min-w-full"}>
                  <thead className="sticky top-0 z-10">
                  <tr>
                    {canBulkUpdate && (
                      <th
                        className={`${isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"} pro-sticky-col pro-sticky-head`}
                        style={{ left: 0, minWidth: "56px" }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          aria-label="Select all employees"
                          className="h-4 w-4 accent-emerald-600"
                          disabled={selectableEntries.length === 0}
                        />
                      </th>
                    )}
                    <th
                      className={`${isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"} pro-sticky-col pro-sticky-head`}
                      style={{
                        left: canBulkUpdate ? 56 : 0,
                        minWidth: "180px",
                        width: "180px",
                      }}
                    >
                      Employee
                    </th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Department</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Cab Route</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Team Leader</th>
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Shift</th>
                    
                    {canViewPunchColumns && (
                      <>
                        <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Punch In</th>
                        <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Punch Out</th>
                      </>
                    )}
                    {canViewTotalHours && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Total Hours</th>
                    )}
                    
                    {canViewHrAttendance && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>
                        HR Attendance
                      </th>
                    )}
                    
                    <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Roster Status</th>
                    {canViewTransportStatus && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
                    )}
                    {canViewDepartmentStatus && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
                    )}
                    
                    {canViewTransportArrival && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Arrival</th>
                    )}
                    {canViewDepartmentArrival && (
                      <th className={isDarkTable ? "px-4 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Arrival</th>
                    )}
                  </tr>
                  </thead>
                  <tbody className={isDarkTable ? "bg-[#13214f]" : "bg-white"}>
                  {rosterEntries.map((employee) => {
                    const todayStatus = getTodayStatus(employee);
                    const isSelected = selectedEmployeeIds.some((id) => String(id) === String(employee._id));
                    const isOwnRow = isOwnRosterRow(employee);
                    
                    const totalHours = todayStatus?.totalHours;
                    
                    let hrAttendance = null;
                    if (totalHours) {
                      hrAttendance = getHRAttendanceFromHours(totalHours);
                    }

                    return (
                      <tr
                        key={employee._id}
                        className={`pro-row ${isSelected ? (isDarkTable ? "bg-emerald-100" : "bg-emerald-50") : ""}`}
                      >
                        {canBulkUpdate && (
                          <td
                            className="px-4 py-3 pro-sticky-col"
                            style={{ left: 0, minWidth: "56px", width: "56px" }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectOne(employee._id, e.target.checked)}
                              aria-label={`Select ${employee.name}`}
                              className="h-4 w-4 accent-emerald-600"
                              disabled={isOwnRow}
                              title={isOwnRow ? "You cannot edit your own attendance" : ""}
                            />
                          </td>
                        )}
                        <td
                          className="px-4 py-3 pro-sticky-col whitespace-nowrap"
                          style={{
                            left: canBulkUpdate ? 56 : 0,
                            minWidth: "180px",
                            width: "180px",
                          }}
                        >
                          <div className={isDarkTable ? "font-bold text-neutral-100" : "font-bold text-gray-900"}>{employee.name}</div>
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
                        
                        {canViewPunchColumns && (
                          <td className="px-4 py-3">
                            <span className={isDarkTable ? "text-neutral-300" : "text-gray-700"}>
                              {todayStatus?.punchIn ? formatTimeForDisplay(todayStatus.punchIn) : '--:-- --'}
                            </span>
                          </td>
                        )}
                        
                        {canViewPunchColumns && (
                          <td className="px-4 py-3">
                            <span className={isDarkTable ? "text-neutral-300" : "text-gray-700"}>
                              {todayStatus?.punchOut ? formatTimeForDisplay(todayStatus.punchOut) : '--:-- --'}
                            </span>
                          </td>
                        )}
                        
                        {canViewTotalHours && (
                          <td className="px-4 py-3">
                            {totalHours ? (
                              <span className={`font-bold ${isDarkTable ? 'text-purple-300' : 'text-purple-700'}`}>
                                {totalHours} hrs
                              </span>
                            ) : (
                              <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
                                --
                              </span>
                            )}
                          </td>
                        )}
                        
                        {canViewHrAttendance && (
                          <td className="px-4 py-3">
                            {hrAttendance ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(hrAttendance)}`}>
                                {hrAttendance}
                              </span>
                            ) : (
                              <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>
                                --
                              </span>
                            )}
                          </td>
                        )}
                        
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
                        
                        {canViewTransportStatus && (
                          <td className="px-4 py-3">
                            {todayStatus?.transportStatus ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.transportStatus)}`}>
                                {todayStatus.transportStatus}
                              </span>
                            ) : (
                              <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
                            )}
                          </td>
                        )}

                        {canViewDepartmentStatus && (
                          <td className="px-4 py-3">
                            {todayStatus?.departmentStatus ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
                                {todayStatus.departmentStatus}
                              </span>
                            ) : (
                              <span className={isDarkTable ? "text-neutral-500 text-xs" : "text-gray-400 text-xs"}>Not set</span>
                            )}
                          </td>
                        )}
                        
                        {canViewTransportArrival && (
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {todayStatus?.transportArrivalTime ? (
                                <span className={isDarkTable ? "text-teal-700 font-bold" : "text-teal-700 font-bold"}>
                                  {formatTimeForDisplay(todayStatus.transportArrivalTime)}
                                </span>
                              ) : (
                                <span className={isDarkTable ? "text-neutral-500" : "text-gray-400"}>--:-- --</span>
                              )}
                            </div>
                          </td>
                        )}

                        {canViewDepartmentArrival && (
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {todayStatus?.departmentArrivalTime ? (
                                <span className={isDarkTable ? "text-green-300" : "text-green-600 font-medium"}>
                                  {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
                                </span>
                              ) : (
                                <span className={isDarkTable ? "text-neutral-500" : "text-gray-400"}>--:-- --</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
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
                      className={isDarkTable ? "p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className={isDarkTable ? "p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed" : "p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"}
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
            <h3 className="text-lg font-bold text-gray-900">No employees found</h3>
            <p className="text-gray-500 mt-2">
              {selectedWeek ? "No employees available for the selected week" : "Please select a week to view employees"}
            </p>
            {availableWeeks.length === 0 && !loading && (
              <button
                onClick={() => {
                  setSelectedWeek("");
                  autoSelectWeekDone.current = false;
                  if (activeRosterId) {
                    dispatch(getEmployeesForUpdates({
                      rosterId: activeRosterId,
                      weekNumber: null,
                      date: effectiveSelectedDate,
                      month: monthYearForRequests?.month,
                      year: monthYearForRequests?.year,
                      page: 1,
                      limit: pageSize,
                      q: "",
                      searchBy,
                      delegatedFrom: delegatedFromUserId,
                    }));
                  }
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                Refresh Weeks
              </button>
            )}
          </div>
        )}

        {delegatedFromUserId && (
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
                      Date: {selectedDate || "-"} | Week: {selectedWeek || "-"} | Team Mode: Delegated
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "14px", opacity: 0.9 }}>
                    <div>{currentUser?.username || "User"}</div>
                    <div>{currentUser?.department || "-"}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "999px", background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0e7490", fontWeight: 600 }}>
                    Employees: {rosterEntries.length}
                  </span>
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
                    {rosterEntries.map((emp, idx) => {
                      const attendance = getTodayStatus(emp);
                      const values = {
                        employee: emp?.name || "-",
                        teamLeader: emp?.teamLeader || "-",
                        department: emp?.department || "-",
                        shift: formatShift(emp?.shiftStartHour, emp?.shiftEndHour),
                        rosterStatus: attendance?.status || "Not set",
                        transportStatus: attendance?.transportStatus || "Not set",
                        departmentStatus: attendance?.departmentStatus || "Not set",
                        transportArrival: attendance?.transportArrivalTime ? formatTimeForDisplay(attendance.transportArrivalTime) : "--:-- --",
                        departmentArrival: attendance?.departmentArrivalTime ? formatTimeForDisplay(attendance.departmentArrivalTime) : "--:-- --",
                      };
                      return (
                        <tr key={emp._id || `${emp.username || "emp"}-${idx}`} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fcfcff" }}>
                          {exportColumnDefs.map((col) => (
                            <td
                              key={col.key}
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #f1f5f9",
                                fontWeight: col.key === "employee" ? 600 : 400,
                                color: "#0f172a",
                                fontSize: "13px",
                              }}
                            >
                              {values[col.key] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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
                <span className="ml-2 px-1 bg-green-100 text-green-800 rounded">P (≥7.5h)</span>
                <span className="ml-1 px-1 bg-teal-100 text-teal-800 rounded">HD (5-7.5h)</span>
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

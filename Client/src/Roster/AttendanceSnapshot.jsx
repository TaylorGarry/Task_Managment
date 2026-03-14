
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEmployeesForUpdates, fetchAllRosters, exportAttendanceSnapshot } from '../features/slices/rosterSlice';
import { Calendar, Users, Clock, RefreshCw, AlertCircle, ChevronDown, SlidersHorizontal, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import AdminNavbar from "../components/AdminNavbar.jsx";

const toDateKeyLocal = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad2 = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const AttendanceSnapshot = () => {
	  const dispatch = useDispatch();
	  const { user } = useSelector((state) => state.auth);
	  const { 
	    updateEmployeesData,
    allRosters,
    loading 
  } = useSelector((state) => state.roster);

	  const [selectedDate, setSelectedDate] = useState(() => toDateKeyLocal(new Date()));
	  
	  const [selectedDepartment, setSelectedDepartment] = useState('all');
	  const [allEmployees, setAllEmployees] = useState([]);
	  const [availableWeeks, setAvailableWeeks] = useState([]);
	  const [selectedRoster, setSelectedRoster] = useState(null);
	  const [selectedWeek, setSelectedWeek] = useState(null);
	  const [loadingState, setLoadingState] = useState('loading');
	  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
		  const [summary, setSummary] = useState(null);
		  const [rostersByMonth, setRostersByMonth] = useState({});
		  const dateInputRef = useRef(null);
		  const [showColumnMenu, setShowColumnMenu] = useState(false);
		  const [columnVisibility, setColumnVisibility] = useState({
		    employee: true,
		    department: true,
		    shift: true,
		    transportStatus: true,
		    departmentStatus: true,
		    transportArrival: true,
		    departmentArrival: true,
		  });
		  const [currentPage, setCurrentPage] = useState(1);
		  const [pageSize, setPageSize] = useState(25);
		  const [tableTheme, setTableTheme] = useState("dark"); // "dark" | "light"
	  
	  // Month and Year state
	  const [selectedMonth, setSelectedMonth] = useState(() => {
	    return new Date().getMonth() + 1;
	  });
	  const [selectedYear, setSelectedYear] = useState(() => {
	    return new Date().getFullYear();
	  });

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

  // ✅ Fetch all rosters on component mount and when month/year changes
  useEffect(() => {
    if (user) {
      console.log(`📡 Fetching all rosters for ${selectedMonth}/${selectedYear}`);
      dispatch(fetchAllRosters({ 
        month: selectedMonth, 
        year: selectedYear,
        page: 1,
        limit: 50 
      }));
    }
  }, [dispatch, user, selectedMonth, selectedYear]);

  // ✅ Process allRosters data to find available rosters
  useEffect(() => {
    if (allRosters?.success && allRosters?.data) {
      console.log("📋 All rosters received:", allRosters.data);
      
      // Create a map of rosters by month/year
      const rosterMap = {};
      
      allRosters.data.forEach(roster => {
        const key = `${roster.month}-${roster.year}`;
        rosterMap[key] = roster;
      });
      
      setRostersByMonth(rosterMap);
      
      // Check if we have a roster for the selected month/year
      const currentKey = `${selectedMonth}-${selectedYear}`;
      const currentRoster = rosterMap[currentKey];
      
      if (currentRoster) {
        console.log(`✅ Found roster for ${selectedMonth}/${selectedYear}:`, currentRoster);
        setSelectedRoster(currentRoster._id);
        
        // Find week 2 specifically (from your data)
        const week2 = currentRoster.weeks?.find(w => w.weekNumber === 2);
        if (week2) {
          setSelectedWeek(2);
          
          // Set available weeks
          if (currentRoster.weeks && currentRoster.weeks.length > 0) {
            const weeks = currentRoster.weeks.map(w => ({
              weekNumber: w.weekNumber,
              startDate: w.startDate,
              endDate: w.endDate,
              employeeCount: w.employees?.length || 0
            }));
            setAvailableWeeks(weeks);
          }
          
          // Fetch employees data
          setLoadingState('loading');
          dispatch(getEmployeesForUpdates({
            rosterId: currentRoster._id,
            weekNumber: 2, // Week 2
            date: selectedDate
          }));
        }
      } else {
        console.log(`❌ No roster found for ${selectedMonth}/${selectedYear}`);
        setAllEmployees([]);
        setSelectedRoster(null);
        setSelectedWeek(null);
        setAvailableWeeks([]);
        setLoadingState('success');
      }
    }
  }, [allRosters, selectedMonth, selectedYear, dispatch, selectedDate]);

  // ✅ Process the dynamic data from API
  useEffect(() => {
    if (updateEmployeesData?.data) {
      console.log("📦 Dynamic data received from API:", updateEmployeesData);
      
      const responseData = updateEmployeesData.data;
      
      // Set employees from rosterEntries
      if (responseData.rosterEntries && responseData.rosterEntries.length > 0) {
        console.log(`✅ Found ${responseData.rosterEntries.length} employees`);
        setAllEmployees(responseData.rosterEntries);
      } else {
        setAllEmployees([]);
      }
      
      // Set available weeks for dropdown
      if (responseData.weeks && responseData.weeks.length > 0) {
        console.log("📅 Available weeks:", responseData.weeks);
        setAvailableWeeks(responseData.weeks);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('/');
  };

  // Get attendance for specific date
	  const getAttendanceForDate = (employee, date) => {
	    if (!employee?.dailyStatus || !Array.isArray(employee.dailyStatus)) return null;
    
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);
    
	    return employee.dailyStatus.find(d => {
      if (!d?.date) return false;
      const dDate = new Date(d.date);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() === selectedDateObj.getTime();
	    });
	  };

	  const formatTimeForDisplay = (dateString) => {
	    if (!dateString) return "--:-- --";
	    try {
	      return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	    } catch {
	      return "--:-- --";
	    }
	  };

	  const formatShift = (startHour, endHour) => {
	    const start = Number.parseInt(startHour, 10);
	    const end = Number.parseInt(endHour, 10);
	    if (Number.isNaN(start) || Number.isNaN(end)) return "-";
	    if (start === 0 && end === 0) return "-";
	    return `${start}:00 - ${end}:00`;
	  };

  // Handle month change
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setShowMonthDropdown(false);
    setLoadingState('loading');
    
    // Check if we have a roster for this month
    const key = `${month}-${selectedYear}`;
    const roster = rostersByMonth[key];
    
    if (roster) {
      setSelectedRoster(roster._id);
      
      // Find week 2
      const week2 = roster.weeks?.find(w => w.weekNumber === 2);
      if (week2) {
        setSelectedWeek(2);
        
        // Set weeks
        if (roster.weeks) {
          setAvailableWeeks(roster.weeks.map(w => ({
            weekNumber: w.weekNumber,
            startDate: w.startDate,
            endDate: w.endDate,
            employeeCount: w.employees?.length || 0
          })));
        }
        
        // Fetch data
        dispatch(getEmployeesForUpdates({
          rosterId: roster._id,
          weekNumber: 2,
          date: selectedDate
        }));
      }
    } else {
      setAllEmployees([]);
      setSelectedRoster(null);
      setSelectedWeek(null);
      setAvailableWeeks([]);
      setLoadingState('success');
    }
  };

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
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
        date: selectedDate
      }));
    }
  };

	  // Handle date change
		  const handleDateChange = (newDate) => {
		    setSelectedDate(newDate);
		    setCurrentPage(1);
		    
		    if (selectedRoster && selectedWeek) {
	      setLoadingState('loading');
	      dispatch(getEmployeesForUpdates({
        rosterId: selectedRoster,
        weekNumber: selectedWeek,
        date: newDate
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
        date: selectedDate
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

		  const handleExportSnapshot = async () => {
		    try {
	      const week = availableWeeks.find((w) => String(w.weekNumber) === String(selectedWeek));
	      if (!week?.startDate || !week?.endDate) {
	        return;
	      }

	      const startDateKey = toDateKeyLocal(week.startDate);
	      const endDateKey = toDateKeyLocal(week.endDate);
	      if (!startDateKey || !endDateKey) {
	        return;
	      }

	      const dept = selectedDepartment === 'all' ? '' : selectedDepartment;
	      await dispatch(exportAttendanceSnapshot({ startDate: startDateKey, endDate: endDateKey, department: dept })).unwrap();
	    } catch (err) {
	      // exportAttendanceSnapshot already toasts on success; keep errors silent here
	      console.error('Export snapshot failed:', err);
	    }
		  };

		  const filteredEmployees = (allEmployees || []).filter(
		    (emp) => selectedDepartment === "all" || emp.department === selectedDepartment
		  );

		  const totalEmployees = filteredEmployees.length;
		  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));
		  const safePage = Math.min(currentPage, totalPages);
		  const startIndex = (safePage - 1) * pageSize;
		  const endIndexExclusive = startIndex + pageSize;
		  const pagedEmployees = filteredEmployees.slice(startIndex, endIndexExclusive);
		  const rangeStart = totalEmployees === 0 ? 0 : startIndex + 1;
		  const rangeEnd = Math.min(startIndex + pagedEmployees.length, totalEmployees);
		  const isDarkTable = tableTheme === "dark";

  // Loading state
	  if (loadingState === 'loading' || loading) {
	    return (
	      <div className="min-h-screen bg-gray-50 p-6">
	        <div className="max-w-7xl mx-auto">
	          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
	            <div className="flex flex-col items-center justify-center">
	              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
	              <p className="text-gray-600">Loading attendance data...</p>
	            </div>
	          </div>
	        </div>
	      </div>
	    );
	  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminNavbar/>
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
                      Week {week.weekNumber}: {formatDate(week.startDate)} - {formatDate(week.endDate)} ({week.employeeCount || 0} employees)
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
		              <select
		                value={selectedDepartment}
		                onChange={(e) => {
		                  setSelectedDepartment(e.target.value);
		                  setCurrentPage(1);
		                }}
		                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
		              >
	                <option value="all">All</option>
	                {availableDepartments.map((dept) => (
	                  <option key={dept} value={dept}>
	                    {dept}
	                  </option>
	                ))}
	              </select>
	            </div>

	            {/* Employee Count */}
	            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
	              <Users size={16} />
              <span>{allEmployees.length} employees</span>
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
	            <button
	              onClick={handleExportSnapshot}
	              disabled={!selectedWeek}
	              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
	              title={!selectedWeek ? 'Select a week to export' : 'Download attendance snapshot Excel'}
	            >
	              Download Excel
	            </button>
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
	                      { key: "department", label: "Department" },
	                      { key: "shift", label: "Shift" },
	                      { key: "transportStatus", label: "Transport Status" },
	                      { key: "departmentStatus", label: "Dept Status" },
	                      { key: "transportArrival", label: "Transport Arrival" },
	                      { key: "departmentArrival", label: "Dept Arrival" },
	                    ].map((col) => (
	                      <label
	                        key={col.key}
	                        className={isDarkTable ? "flex items-center gap-2 px-2 py-1 text-sm text-neutral-200 hover:bg-neutral-900 rounded" : "flex items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50 rounded"}
	                      >
	                        <input
	                          type="checkbox"
	                          checked={Boolean(columnVisibility[col.key])}
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
	                    {columnVisibility.employee && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Employee</th>
	                    )}
	                    {columnVisibility.department && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Department</th>
	                    )}
	                    {columnVisibility.shift && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Shift</th>
	                    )}
	                    {columnVisibility.transportStatus && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Status</th>
	                    )}
	                    {columnVisibility.departmentStatus && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Status</th>
	                    )}
	                    {columnVisibility.transportArrival && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Transport Arrival</th>
	                    )}
	                    {columnVisibility.departmentArrival && (
	                      <th className={isDarkTable ? "px-6 py-3 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider" : "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"}>Dept Arrival</th>
	                    )}
	                  </tr>
	                </thead>
	                <tbody className={isDarkTable ? "divide-y divide-neutral-800" : "divide-y divide-gray-200"}>
	                  {pagedEmployees.map((emp) => {
	                      const attendance = getAttendanceForDate(emp, selectedDate);
	                      
	                      return (
	                      <tr key={emp._id} className={isDarkTable ? "hover:bg-neutral-800/40" : "hover:bg-gray-50"}>
	                          {columnVisibility.employee && (
	                            <td className="px-6 py-4">
	                              <div>
	                              <p className={isDarkTable ? "font-medium text-neutral-100" : "font-medium text-gray-900"}>{emp.name || "Unknown"}</p>
	                              <p className={isDarkTable ? "text-xs text-neutral-400" : "text-xs text-gray-500"}>{emp.username || "-"}</p>
	                              </div>
	                            </td>
	                          )}

	                          {columnVisibility.department && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-300" : "px-6 py-4 text-sm text-gray-600"}>{emp.department || "N/A"}</td>
	                          )}

	                          {columnVisibility.shift && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-300" : "px-6 py-4 text-sm text-gray-600"}>
	                            {formatShift(emp.shiftStartHour, emp.shiftEndHour)}
	                            </td>
	                          )}

	                          {columnVisibility.transportStatus && (
	                            <td className="px-6 py-4">
	                              <div className="flex flex-col gap-1">
	                                <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance?.transportStatus)}`}>
	                                  {attendance?.transportStatus || "Not set"}
	                                </span>
	                                {attendance?.transportArrivalTime && (
	                                <span className={isDarkTable ? "text-xs text-neutral-400" : "text-xs text-gray-500"}>
	                                    Arrival: {formatTimeForDisplay(attendance.transportArrivalTime)}
	                                  </span>
	                                )}
	                              </div>
	                            </td>
	                          )}

	                          {columnVisibility.departmentStatus && (
	                            <td className="px-6 py-4">
	                              <div className="flex flex-col gap-1">
	                                <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance?.departmentStatus)}`}>
	                                  {attendance?.departmentStatus || "Not set"}
	                                </span>
	                                {attendance?.departmentArrivalTime && (
	                                <span className={isDarkTable ? "text-xs text-neutral-400" : "text-xs text-gray-500"}>
	                                    Arrival: {formatTimeForDisplay(attendance.departmentArrivalTime)}
	                                  </span>
	                                )}
	                              </div>
	                            </td>
	                          )}

	                          {columnVisibility.transportArrival && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-200" : "px-6 py-4 text-sm text-gray-700"}>
	                              {attendance?.transportArrivalTime
	                                ? formatTimeForDisplay(attendance.transportArrivalTime)
	                                : "--:-- --"}
	                            </td>
	                          )}

	                          {columnVisibility.departmentArrival && (
	                          <td className={isDarkTable ? "px-6 py-4 text-sm text-neutral-200" : "px-6 py-4 text-sm text-gray-700"}>
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
    </div>
  );
};

export default AttendanceSnapshot;

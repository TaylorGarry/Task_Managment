import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeeMyDefaults, clearEmployeeMyDefaults } from "../features/slices/taskSlice";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Calendar, 
  Clock, 
  FileText, 
  Building, 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  PieChart,
  BarChart3,
  TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "./Navbar";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

const MyDefaults = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { employeeMyDefaults, loading, error } = useSelector((state) => state.tasks);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chartType, setChartType] = useState("pie");
  const [showCharts, setShowCharts] = useState(true);
  
  // ✅ FIXED: Define helper functions FIRST before they are used
  // ✅ FIXED: Proper date formatting function for ISO strings
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Handle ISO date string (2026-02-05T18:30:00.000Z)
      if (typeof dateString === 'string' && dateString.includes('T')) {
        const date = new Date(dateString);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          const day = date.getUTCDate().toString().padStart(2, '0');
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
          const year = date.getUTCFullYear();
          return `${day}/${month}/${year}`; // DD/MM/YYYY format
        }
      }
      
      // Handle YYYY-MM-DD format
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      return dateString;
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  // Helper function for date comparison (used in stats calculation)
  const formatDateForComparison = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase() || '';
    switch (priorityLower) {
      case 'high': return 'bg-red-100 text-red-800 border border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'not done': return 'bg-red-100 text-red-800 border border-red-200';
      case 'done': return 'bg-green-100 text-green-800 border border-green-200';
      case 'not recorded': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const chartColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  // ✅ FIXED: Extract tasks from the correct path in the response
  const tasks = useMemo(() => {
    if (!employeeMyDefaults) return [];
    
    // Check if data exists and is an array (this is your actual response structure)
    if (employeeMyDefaults.data && Array.isArray(employeeMyDefaults.data)) {
      console.log("✅ Using employeeMyDefaults.data array:", employeeMyDefaults.data.length);
      return employeeMyDefaults.data;
    }
    
    // Check if tasks array exists
    if (employeeMyDefaults.tasks && Array.isArray(employeeMyDefaults.tasks)) {
      console.log("✅ Using employeeMyDefaults.tasks array:", employeeMyDefaults.tasks.length);
      return employeeMyDefaults.tasks;
    }
    
    // Check nested data structure
    if (employeeMyDefaults.data?.tasks && Array.isArray(employeeMyDefaults.data.tasks)) {
      console.log("✅ Using employeeMyDefaults.data.tasks array:", employeeMyDefaults.data.tasks.length);
      return employeeMyDefaults.data.tasks;
    }
    
    // Check if the response itself is an array
    if (Array.isArray(employeeMyDefaults)) {
      console.log("✅ employeeMyDefaults is array:", employeeMyDefaults.length);
      return employeeMyDefaults;
    }
    
    console.log("❌ No tasks array found in:", employeeMyDefaults);
    return [];
  }, [employeeMyDefaults]);

  // Extract pagination from the response
  const pagination = useMemo(() => {
    if (!employeeMyDefaults) return {};
    
    if (employeeMyDefaults.pagination) {
      return employeeMyDefaults.pagination;
    }
    
    if (employeeMyDefaults.data?.pagination) {
      return employeeMyDefaults.data.pagination;
    }
    
    return {
      totalPages: employeeMyDefaults.totalPages || 1,
      totalItems: employeeMyDefaults.totalDefaults || tasks.length,
      currentPage: employeeMyDefaults.currentPage || 1
    };
  }, [employeeMyDefaults, tasks.length]);

  // Extract employee info
  const employeeInfo = useMemo(() => {
    if (!employeeMyDefaults) return {};
    
    return {
      id: employeeMyDefaults.employeeId || user?._id,
      username: employeeMyDefaults.employeeName || user?.username,
      department: user?.department || 'N/A'
    };
  }, [employeeMyDefaults, user]);

  // ✅ FIXED: Extract stats - formatDateForComparison is now defined above
  const stats = useMemo(() => {
    if (!employeeMyDefaults) return {};
    
    // Calculate stats from tasks
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    let todayCount = 0;
    let yesterdayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    
    tasks.forEach(task => {
      if (task.date) {
        const taskDate = new Date(task.date);
        const dateStr = formatDateForComparison(task.date);
        const todayStr = formatDateForComparison(today.toISOString());
        const yesterdayStr = formatDateForComparison(yesterday.toISOString());
        
        if (dateStr === todayStr) todayCount++;
        if (dateStr === yesterdayStr) yesterdayCount++;
        if (taskDate >= weekAgo) weekCount++;
        if (taskDate >= monthAgo) monthCount++;
      }
    });
    
    return {
      today: todayCount,
      yesterday: yesterdayCount || employeeMyDefaults.yesterdayDefaults || 0,
      thisWeek: weekCount || employeeMyDefaults.weekDefaults || 0,
      thisMonth: monthCount || employeeMyDefaults.monthDefaults || 0,
      total: employeeMyDefaults.totalDefaults || tasks.length || 0
    };
  }, [tasks, employeeMyDefaults]);

  // DEBUG: Log raw API response
  useEffect(() => {
    if (employeeMyDefaults) {
      console.log("🔍 RAW API RESPONSE:", employeeMyDefaults);
      console.log("📋 TASKS COUNT:", tasks.length);
      console.log("📋 FIRST TASK:", tasks[0]);
      
      // Log date format for first task
      if (tasks[0]?.date) {
        console.log("📅 FIRST TASK DATE RAW:", tasks[0].date);
        console.log("📅 FIRST TASK DATE FORMATTED:", formatDate(tasks[0].date));
      }
    }
  }, [employeeMyDefaults, tasks]);

  // Chart data processing
  const chartData = useMemo(() => {
    // Group tasks by date
    const tasksByDate = {};
    tasks.forEach(task => {
      const date = task.date;
      if (date) {
        const formattedDate = formatDate(date);
        tasksByDate[formattedDate] = (tasksByDate[formattedDate] || 0) + 1;
      }
    });

    // Sort dates and get top 5
    const sortedDates = Object.entries(tasksByDate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Group tasks by status
    const tasksByStatus = {};
    tasks.forEach(task => {
      const status = task.status || 'Not Recorded';
      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
    });

    // Group tasks by priority
    const tasksByPriority = {};
    tasks.forEach(task => {
      const priority = task.priority || 'Not Specified';
      tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
    });

    // Group tasks by shift
    const tasksByShift = {};
    tasks.forEach(task => {
      const shift = task.shift || 'N/A';
      tasksByShift[shift] = (tasksByShift[shift] || 0) + 1;
    });

    return {
      dailyLabels: sortedDates.map(([date]) => date),
      dailyData: sortedDates.map(([, count]) => count),
      statusLabels: Object.keys(tasksByStatus),
      statusData: Object.values(tasksByStatus),
      priorityLabels: Object.keys(tasksByPriority),
      priorityData: Object.values(tasksByPriority),
      shiftLabels: Object.keys(tasksByShift),
      shiftData: Object.values(tasksByShift),
      totalTasks: tasks.length,
      stats: stats,
    };
  }, [tasks, stats]);

  const pieChartConfig = (labels, data) => ({
    labels,
    datasets: [
      {
        data,
        backgroundColor: chartColors.slice(0, labels.length),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  });

  const barLineChartConfig = (labels, data, title) => ({
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: chartColors.slice(0, labels.length),
        borderColor: chartColors.slice(0, labels.length).map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const filters = {
    page: currentPage,
    limit: itemsPerPage
  };

  useEffect(() => {
    dispatch(clearEmployeeMyDefaults());
    fetchData();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (user && user.accountType !== "employee") {
      toast.error("Access denied. This page is only for employees.");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const fetchData = () => {
    dispatch(fetchEmployeeMyDefaults(filters));
  };

  const handleRefresh = () => {
    fetchData();
    toast.success("Data refreshed!");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-3">Error Loading Data</h2>
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = pagination.totalPages || 1;
  const totalItems = employeeMyDefaults?.totalDefaults || tasks.length || 0;

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (task.title && task.title.toLowerCase().includes(searchLower)) ||
      (task.taskTitle && task.taskTitle.toLowerCase().includes(searchLower)) ||
      (task.taskName && task.taskName.toLowerCase().includes(searchLower)) ||
      (task.department && task.department.toLowerCase().includes(searchLower)) ||
      (task.shift && task.shift.toLowerCase().includes(searchLower)) ||
      (task.status && task.status.toLowerCase().includes(searchLower)) ||
      (task.priority && task.priority.toLowerCase().includes(searchLower)) ||
      (task.date && formatDate(task.date).toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-4 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">My Default Tasks</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Department: {employeeInfo.department || user?.department || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Total Tasks: {employeeMyDefaults?.totalDefaults || tasks.length || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full md:w-64"
                />
              </div>
              
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                <PieChart className="w-4 h-4" />
                {showCharts ? 'Hide Charts' : 'Show Charts'}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Stats Overview - FIXED: Show correct stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="text-sm text-gray-500 font-medium mb-1">Total Defaults</div>
              <div className="text-2xl font-bold text-blue-600">{employeeMyDefaults?.totalDefaults || tasks.length || 0}</div>
              <div className="text-xs text-gray-400 mt-1">All time</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="text-sm text-gray-500 font-medium mb-1">Today's Missed</div>
              <div className="text-2xl font-bold text-orange-600">{stats.today || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Tasks from today</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="text-sm text-gray-500 font-medium mb-1">Yesterday's Missed</div>
              <div className="text-2xl font-bold text-amber-600">{stats.yesterday || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Tasks from yesterday</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="text-sm text-gray-500 font-medium mb-1">This Week</div>
              <div className="text-2xl font-bold text-purple-600">{stats.thisWeek || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Last 7 days</div>
            </div>
          </div>

          {/* Charts Section */}
          {showCharts && chartData.totalTasks > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Default Tasks Analysis</h3>
                  <p className="text-gray-600">Visual representation of your default tasks distribution</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => setChartType('pie')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      chartType === 'pie' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <PieChart className="w-4 h-4" />
                    Pie Chart
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Line Chart
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Defaults by {chartType === 'pie' ? 'Date' : 'Category'}
                    </h4>
                    <div className="text-sm font-medium text-gray-500">
                      Total: {chartData.totalTasks} tasks
                    </div>
                  </div>
                  
                  <div className="h-80">
                    {chartType === 'pie' && chartData.dailyLabels.length > 0 && (
                      <Pie
                        data={pieChartConfig(chartData.dailyLabels, chartData.dailyData)}
                        options={chartOptions}
                      />
                    )}
                    {chartType === 'bar' && chartData.priorityLabels.length > 0 && (
                      <Bar
                        data={barLineChartConfig(chartData.priorityLabels, chartData.priorityData, 'Tasks by Priority')}
                        options={chartOptions}
                      />
                    )}
                    {chartType === 'line' && chartData.dailyLabels.length > 0 && (
                      <Line
                        data={barLineChartConfig(chartData.dailyLabels, chartData.dailyData, 'Tasks Trend')}
                        options={{
                          ...chartOptions,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1
                              }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h4>
                    <div className="space-y-4">
                      {chartData.statusLabels.map((status, index) => {
                        const count = chartData.statusData[index];
                        const percentage = chartData.totalTasks > 0 
                          ? Math.round((count / chartData.totalTasks) * 100) 
                          : 0;
                        return (
                          <div key={status} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">{status}</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="h-2.5 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: chartColors[index % chartColors.length]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Shift Distribution</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {chartData.shiftLabels.map((shift, index) => (
                        <div key={shift} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-500 mb-1">{shift}</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {chartData.shiftData[index]}
                          </div>
                          <div className="text-xs text-gray-400">
                            {chartData.totalTasks > 0 
                              ? Math.round((chartData.shiftData[index] / chartData.totalTasks) * 100) 
                              : 0}% of total
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl p-6 mb-8 shadow border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items per page
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="10">10 items</option>
                    <option value="25">25 items</option>
                    <option value="50">50 items</option>
                    <option value="100">100 items</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && tasks.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-sky-500"></div>
            <p className="mt-6 text-lg text-gray-600 font-medium">Loading your default tasks...</p>
            <p className="text-gray-500">Please wait while we fetch your data</p>
          </div>
        )}

        {/* Tasks Table - ✅ FIXED: Properly display all fields */}
        {!loading && filteredTasks.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Shift
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task, index) => {
                      const uniqueKey = `${task._id || index}-${task.date || index}`;
                      
                      return (
                        <tr key={uniqueKey} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(task.date || task.missingDate)}
                                </div>
                                {/* Debug: Show raw date in small text (remove in production) */}
                                <div className="text-xs text-gray-400">
                                  {task.date}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                {task.title || task.taskTitle || task.taskName || 'Untitled Task'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-md">
                              {task.description || task.taskDescription || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {task.department || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                                {task.shift || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority || 'Not Specified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                              {task.status || 'Not Recorded'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl shadow border border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span> of{' '}
                <span className="font-semibold">{totalItems}</span> tasks
                {searchTerm && (
                  <span className="ml-2 text-sky-600">
                    (Filtered: {filteredTasks.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentPage === pageNum
                            ? 'bg-sky-500 text-white font-semibold'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty State - Only show when no tasks and not loading */}
        {!loading && tasks.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Default Tasks Found!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
              Excellent work! You have no pending or default tasks. Keep up the good performance!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Check Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDefaults;
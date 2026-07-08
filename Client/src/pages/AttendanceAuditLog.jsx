import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  RefreshCcw,
  Search,
  X,
  Users,
  Clock,
  Monitor,
  ArrowDown,
  ChevronDown,
  FileText,
  User,
  Activity,
  SlidersHorizontal,
  ChevronUp,
  UserCheck,
  Briefcase,
  MapPin,
  Calendar as CalendarIcon,
  Hash,
  Globe,
  Laptop,
  Shield,
  BarChart3
} from "lucide-react";
import { attendanceAuditApi } from "../services/attendanceAuditService.js";

const actionOptions = ["ALL", "CREATE", "UPDATE", "BULK_UPDATE", "OVERRIDE"];

const statusColors = {
  P: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Absent: "bg-rose-50 text-rose-700 border-rose-200",
  A: "bg-rose-50 text-rose-700 border-rose-200",
  L: "bg-amber-50 text-amber-700 border-amber-200",
  HD: "bg-orange-50 text-orange-700 border-orange-200",
  WO: "bg-sky-50 text-sky-700 border-sky-200",
  NCNS: "bg-red-50 text-red-700 border-red-200",
  UL: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  LWP: "bg-violet-50 text-violet-700 border-violet-200",
  BL: "bg-indigo-50 text-indigo-700 border-indigo-200",
  H: "bg-pink-50 text-pink-700 border-pink-200",
  LWD: "bg-cyan-50 text-cyan-700 border-cyan-200",
  OT: "bg-teal-50 text-teal-700 border-teal-200",
  FWO: "bg-rose-50 text-rose-700 border-rose-200",
  EXIT: "bg-gray-50 text-gray-700 border-gray-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  BULK_UPDATE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERRIDE: "bg-purple-50 text-purple-700 border-purple-200",
};

const emptyFilters = {
  dateFrom: "",
  dateTo: "",
  supervisor: "",
  employee: "",
  branch: "",
  department: "",
  attendanceDate: "",
  action: "ALL",
  search: "",
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
};

const getPersonName = (user, fallback = "-") =>
  user?.realName || user?.pseudoName || user?.username || fallback;

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return formatDateTime(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  return String(value);
};

const Badge = ({ value, size = "sm" }) => {
  const baseClasses = "inline-flex items-center gap-1.5 rounded-full border font-medium";
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const colorClass = statusColors[value] || "bg-slate-50 text-slate-700 border-slate-200";
  
  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colorClass.includes('bg-') ? colorClass.split(' ')[0].replace('bg-', 'bg-') : 'bg-slate-400'}`}></span>
      {value || "-"}
    </span>
  );
};

const toCsvCell = (value) => `"${String(displayValue(value)).replace(/"/g, '""')}"`;

const getRecordTime = (record = {}) => {
  const date = new Date(record.createdAt || record.updatedAt || record.updatedAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const getAttendanceDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getAuditGroupKey = (record = {}) => {
  const employeeKey =
    getIdValue(record.employeeId) ||
    getIdValue(record.rosterEmployeeId) ||
    String(record.employeeCode || record.employeeName || "").trim().toLowerCase();
  return `${employeeKey}|${getAttendanceDateKey(record.attendanceDate)}`;
};

const groupAuditRows = (items = []) => {
  const groups = new Map();
  for (const item of items) {
    const key = getAuditGroupKey(item);
    if (!key || key === "|") continue;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .map((records) => {
      const chronological = [...records].sort((a, b) => getRecordTime(a) - getRecordTime(b));
      const latest = chronological[chronological.length - 1] || {};
      return {
        ...latest,
        _id: latest._id || `${getAuditGroupKey(latest)}-group`,
        auditRecords: chronological,
        auditRecordCount: chronological.length,
      };
    })
    .sort((a, b) => getRecordTime(b) - getRecordTime(a));
};

const paginateRows = (items = [], page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 10, 1);
  return items.slice((safePage - 1) * safeLimit, safePage * safeLimit);
};

const downloadCsv = (rows = []) => {
  const headers = [
    "Date & Time",
    "Supervisor",
    "Employee",
    "Employee ID",
    "Attendance Date",
    "Action",
    "Field",
    "Old Status",
    "New Status",
    "IP Address",
    "Device",
    "Department",
    "Branch",
    "Request Id",
    "Audit Entries",
  ];
  const lines = rows.map((row) => [
    row.createdAt,
    row.updatedByName || getPersonName(row.updatedBy),
    row.employeeName || getPersonName(row.employeeId),
    row.employeeCode || row.employeeId?.empId,
    row.attendanceDate,
    row.action,
    row.field,
    row.oldStatus,
    row.newStatus,
    row.ipAddress,
    row.device,
    row.department,
    row.branch,
    row.requestId,
    row.auditRecordCount || row.auditRecords?.length || 1,
  ].map(toCsvCell).join(","));
  const blob = new Blob([[headers.map(toCsvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const AttendanceAuditLog = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeAudit, setActiveAudit] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const queryParams = useMemo(() => {
    const params = { page: pagination.page, limit: pagination.limit, sortBy: "createdAt", sortOrder: "desc" };
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "ALL") params[key] = value;
    });
    return params;
  }, [filters, pagination.limit, pagination.page]);

  const loadData = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);
      const allItems = [];
      let apiPage = 1;
      let apiTotalPages = 1;
      do {
        const params = { ...queryParams, page: apiPage, limit: 500 };
        const res = await attendanceAuditApi.list(params);
        const payload = res.data?.data || {};
        allItems.push(...(Array.isArray(payload.items) ? payload.items : []));
        apiTotalPages = payload.pagination?.totalPages || 1;
        apiPage += 1;
      } while (apiPage <= apiTotalPages);

      const groupedRows = groupAuditRows(allItems);
      const limit = pagination.limit;
      const totalPages = Math.max(Math.ceil(groupedRows.length / limit), 1);
      const safePage = Math.min(Math.max(page, 1), totalPages);
      setRows(paginateRows(groupedRows, safePage, limit));
      setPagination({
        page: safePage,
        limit,
        total: groupedRows.length,
        totalPages,
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load attendance audit logs");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, queryParams]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(1), 300);
    return () => clearTimeout(timer);
  }, [filters, pagination.limit]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDetails = async (row) => {
    try {
      setSelected(row);
      const records = Array.isArray(row.auditRecords) && row.auditRecords.length
        ? row.auditRecords
        : [row];
      setHistory(records);
      setActiveAudit(records[records.length - 1] || row);
      setDetailsLoading(true);
      setDetailsLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to open audit details");
      setHistory([]);
      setActiveAudit(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleTimelineClick = (item) => {
    setActiveAudit(item);
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      const allRows = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = { ...queryParams, page, limit: 500 };
        const res = await attendanceAuditApi.list(params);
        const payload = res.data?.data || {};
        allRows.push(...(Array.isArray(payload.items) ? payload.items : []));
        totalPages = payload.pagination?.totalPages || 1;
        page += 1;
      } while (page <= totalPages);
      downloadCsv(groupAuditRows(allRows));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  const currentAudit = activeAudit || selected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
        {/* Header Section - Redesigned */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 shadow-2xl">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-20 -translate-y-20 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl"></div>
          
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="hidden rounded-2xl bg-white/20 p-4 backdrop-blur-sm lg:block">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                    Audit Log
                  </span>
                  <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                    Live
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  Attendance Update Log
                </h1>
                <p className="mt-2 text-blue-100/90">
                  Comprehensive audit trail of attendance changes, overrides, and bulk operations
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <BarChart3 className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-medium text-white">
                  {pagination.total} Records
                </span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={exporting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Total Updates</p>
              <p className="text-lg font-bold text-white">{pagination.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Bulk Actions</p>
              <p className="text-lg font-bold text-white">
                {rows.filter(r => r.action === "BULK_UPDATE").length}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Status Changes</p>
              <p className="text-lg font-bold text-white">
                {rows.filter(r => r.action === "UPDATE").length}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Overrides</p>
              <p className="text-lg font-bold text-white">
                {rows.filter(r => r.action === "OVERRIDE").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section - Collapsible */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-700">Advanced Filters</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                {Object.values(filters).filter(v => v && v !== "ALL").length} active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {showFilters ? "Hide filters" : "Show filters"}
              </span>
              {showFilters ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </button>

          {showFilters && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilter("dateFrom", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilter("dateTo", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <UserCheck className="h-3.5 w-3.5" />
                    Supervisor
                  </label>
                  <input
                    value={filters.supervisor}
                    onChange={(e) => setFilter("supervisor", e.target.value)}
                    placeholder="Search supervisor..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    Employee
                  </label>
                  <input
                    value={filters.employee}
                    onChange={(e) => setFilter("employee", e.target.value)}
                    placeholder="Search employee..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Calendar className="h-3.5 w-3.5" />
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={filters.attendanceDate}
                    onChange={(e) => setFilter("attendanceDate", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Audit Records</p>
                <p className="text-xs text-slate-500">{pagination.total} total entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination((prev) => ({ ...prev, page: 1, limit: Number(e.target.value) }))}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {[10, 20, 50, 100].map((limit) => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      #
                    </span>
                  </th>
                  <th className="px-4 py-3.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Date & Time
                    </span>
                  </th>
                  <th className="px-4 py-3.5">Supervisor</th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Attendance Date
                    </span>
                  </th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Old Status</th>
                  <th className="px-4 py-3.5">New Status</th>
                  <th className="px-4 py-3.5">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      IP
                    </span>
                  </th>
                  <th className="px-4 py-3.5">
                    <span className="flex items-center gap-1">
                      <Laptop className="h-3 w-3" />
                      Device
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, index) => (
                  <tr
                    key={row._id}
                    className="group transition-all hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-blue-50/20"
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-400">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-slate-800">{formatDateTime(row.createdAt || row.updatedAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900">{row.updatedByName || getPersonName(row.updatedBy)}</p>
                        <span className="mt-0.5 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {row.updatedByRole || "Supervisor"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900">{row.employeeName || getPersonName(row.employeeId)}</p>
                        <span className="text-xs text-slate-400">{row.employeeCode || row.employeeId?.empId || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(row.attendanceDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge value={row.action} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge value={row.oldStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge value={row.newStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-slate-500">{row.ipAddress || "-"}</span>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3.5 text-xs text-slate-500">
                      {row.device || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(row)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-600/20 bg-blue-50/50 px-3.5 py-2 text-sm font-medium text-blue-700 transition-all hover:border-blue-600 hover:bg-blue-100 hover:shadow-sm group-hover:border-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loading && rows.length === 0 && (
              <div className="py-20 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <FileText className="h-10 w-10 text-slate-300" />
                </div>
                <p className="mt-4 text-base font-medium text-slate-600">No audit records found</p>
                <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search terms</p>
              </div>
            )}
            
            {loading && (
              <div className="py-20 text-center">
                <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-sm font-medium text-slate-600">Loading audit records...</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </span> to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of{" "}
              <span className="font-medium text-slate-700">{pagination.total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadData(Math.max(1, pagination.page - 1))}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="mx-2 text-sm text-slate-500">
                Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{" "}
                <span className="font-semibold text-slate-700">{pagination.totalPages}</span>
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => loadData(Math.min(pagination.totalPages, pagination.page + 1))}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Drawer */}
      {selected && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm transition-all duration-300" 
          onClick={() => setSelected(null)}
        >
          <aside 
            className="h-full w-full max-w-[900px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-right" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header - Blue Gradient */}
            <div className="sticky top-0 z-20 bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">
                      {selected.employeeName ? selected.employeeName.charAt(0).toUpperCase() : "E"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.employeeName || "Employee"}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="cursor-default rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {selected.employeeCode || "EMP-001"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/40"></span>
                      <span className="text-sm text-white/90">Attendance: {formatDate(selected.attendanceDate)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        {selected.action}
                      </span>
                      {selected.source && (
                        <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-100 backdrop-blur-sm">
                          {selected.source}
                        </span>
                      )}
                      <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-100 backdrop-blur-sm">
                        {selected.department || "Department"}
                      </span>
                      <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-100 backdrop-blur-sm">
                        {selected.branch || "Branch"}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelected(null)} 
                  className="cursor-pointer rounded-xl bg-white/10 p-2.5 text-white transition-all hover:bg-white/20 hover:scale-105"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Summary Cards */}
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-flex h-8 w-8 cursor-default animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="cursor-default rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Changed By</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-900">{currentAudit?.updatedByName || getPersonName(currentAudit?.updatedBy)}</p>
                          <p className="text-xs text-slate-500">{currentAudit?.updatedByRole || "Supervisor"}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    <div className="cursor-default rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Changed On</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-900">{formatDate(currentAudit?.createdAt || currentAudit?.updatedAt)}</p>
                          <p className="text-xs text-slate-500">{formatTime(currentAudit?.createdAt || currentAudit?.updatedAt)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                          <Clock className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    <div className="cursor-default rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Device</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-900">{currentAudit?.device || "Unknown Device"}</p>
                          <p className="text-xs text-slate-500">{currentAudit?.ipAddress || "IP not recorded"}</p>
                        </div>
                        <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                          <Monitor className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content - 2 Column Layout */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
                    {/* Left - Timeline */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-blue-600"></div>
                        <h3 className="text-sm font-semibold text-slate-900">Activity Timeline</h3>
                      </div>
                      <div className="space-y-0">
                        {(history.length ? history : [selected]).map((item, index) => {
                          const isActive = activeAudit?._id === item._id || 
                            (activeAudit === item) || 
                            (index === history.length - 1 && !activeAudit);
                          const isLast = index === history.length - 1;
                          
                          return (
                            <div 
                              key={item._id || index} 
                              className={`relative pl-6 pb-6 last:pb-0 cursor-pointer group ${
                                !isLast ? "border-l-2" : ""
                              } ${
                                isActive ? "border-l-2 border-blue-600" : "border-l-2 border-slate-200"
                              }`}
                              onClick={() => handleTimelineClick(item)}
                            >
                              {isActive && !isLast && (
                                <div className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white z-10">
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                </div>
                              )}
                              {!isActive && !isLast && (
                                <div className="absolute -left-[5px] top-0 flex h-3 w-3 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-400"></div>
                                </div>
                              )}
                              {isLast && isActive && (
                                <div className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white z-10">
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                </div>
                              )}
                              {isLast && !isActive && (
                                <div className="absolute -left-[5px] top-0 flex h-3 w-3 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-400"></div>
                                </div>
                              )}
                              <div className={`rounded-xl border p-3.5 transition-all hover:shadow-md ${
                                isActive 
                                  ? "border-blue-500 bg-blue-50/70 shadow-sm" 
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-semibold ${
                                    isActive ? "text-blue-700" : "text-slate-700"
                                  }`}>
                                    {String(item.action || "").replace("_", " ")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {formatDateTime(item.createdAt || item.updatedAt)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">
                                  by {item.updatedByName || getPersonName(item.updatedBy)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right - Change Details */}
                    <div className="space-y-6">
                      {/* Change Comparison */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">Change Comparison</h3>
                        <div className="space-y-3">
                          <div className="cursor-default rounded-xl border-l-4 border-red-500 bg-red-50/50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-red-600">Old Value</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{currentAudit?.oldStatus || "-"}</p>
                            {currentAudit?.oldRemarks && (
                              <p className="mt-0.5 text-xs text-slate-600">{currentAudit.oldRemarks}</p>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <div className="cursor-default rounded-full bg-slate-100 p-1.5 text-slate-400 animate-bounce">
                              <ArrowDown className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="cursor-default rounded-xl border-l-4 border-emerald-500 bg-emerald-50/50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">New Value</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{currentAudit?.newStatus || "-"}</p>
                            {currentAudit?.newRemarks && (
                              <p className="mt-0.5 text-xs text-slate-600">{currentAudit.newRemarks}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remarks Comparison */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">Remarks Changes</h3>
                        <div className="space-y-3">
                          <div className="cursor-default rounded-xl bg-red-50/50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-red-600">Old Remarks</p>
                            <p className="mt-1 text-sm text-slate-700">{currentAudit?.oldRemarks || "-"}</p>
                          </div>
                          <div className="flex justify-center">
                            <ArrowDown className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="cursor-default rounded-xl bg-emerald-50/50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">New Remarks</p>
                            <p className="mt-1 text-sm text-slate-700">{currentAudit?.newRemarks || "-"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">Metadata</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Attendance Date</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatDate(currentAudit?.attendanceDate)}</p>
                          </div>
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Request ID</p>
                            <p className="mt-0.5 text-sm font-mono text-slate-900">{currentAudit?.requestId || "-"}</p>
                          </div>
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Source</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{currentAudit?.source || "-"}</p>
                          </div>
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Department</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{currentAudit?.department || "-"}</p>
                          </div>
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Branch</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{currentAudit?.branch || "-"}</p>
                          </div>
                          <div className="cursor-default rounded-xl bg-slate-50 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Supervisor</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{currentAudit?.updatedByName || getPersonName(currentAudit?.updatedBy)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AttendanceAuditLog;
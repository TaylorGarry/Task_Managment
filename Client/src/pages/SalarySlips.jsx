import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { 
  Download, 
  FileSpreadsheet, 
  Loader2, 
  Upload, 
  Search,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import axios from "axios";
import {
  isAccountsDepartment,
  isHrDepartment,
  isSuperAdmin,
} from "../utils/roleAccess.js";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentDate = new Date();
const SALARY_LIVE_SERVER_URL = "https://fdbs-server-a9gqg.ondigitalocean.app";
const SALARY_LOCAL_SERVER_URL = "http://localhost:4000";

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const isLocalHost = () => {
  if (typeof window === "undefined") return false;
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
};

const getSalaryApiBaseUrl = () => {
  const envUrl = trimTrailingSlash(import.meta?.env?.VITE_API_URL);

  if (isLocalHost()) {
    return envUrl || SALARY_LOCAL_SERVER_URL;
  }

  return envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")
    ? envUrl
    : SALARY_LIVE_SERVER_URL;
};

const salaryApi = axios.create({
  baseURL: getSalaryApiBaseUrl(),
});

salaryApi.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const SalarySlips = () => {
  const { user } = useSelector((state) => state.auth);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");
  const [slips, setSlips] = useState([]);
  const [batches, setBatches] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const canUpload =
    isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);
  const selectedMonthLabel = useMemo(
    () => MONTHS.find((item) => Number(item.value) === Number(month))?.label || "",
    [month]
  );
  
  const availableYears = useMemo(() => {
    const years = new Set(slips.map((slip) => slip.year).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [slips]);
  
  const filteredSlips = useMemo(() => {
    return slips.filter((slip) => {
      const monthMatches = filterMonth === "all" || Number(slip.month) === Number(filterMonth);
      const yearMatches = filterYear === "all" || Number(slip.year) === Number(filterYear);
      const searchMatches = searchTerm === "" || 
        slip.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      return monthMatches && yearMatches && searchMatches;
    });
  }, [filterMonth, filterYear, searchTerm, slips]);

  const stats = useMemo(() => {
    const total = slips.length;
    const uniqueYears = new Set(slips.map(s => s.year)).size;
    const latest = slips.length > 0 ? slips[0] : null;
    return { total, uniqueYears, latest };
  }, [slips]);

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const [slipRes, batchRes] = await Promise.all([
        salaryApi.get("/api/payroll/my-slips"),
        canUpload ? salaryApi.get("/api/payroll/batches") : Promise.resolve({ data: { data: [] } }),
      ]);
      setSlips(Array.isArray(slipRes.data?.data) ? slipRes.data.data : []);
      setBatches(Array.isArray(batchRes.data?.data) ? batchRes.data.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load salary slips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [canUpload]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("month", month);
    formData.append("year", year);
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await salaryApi.post("/api/payroll/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data || {};
      setUploadResult(data);
      toast.success(
        `Uploaded ${data.successRows || 0} rows, failed ${data.failedRows || 0}`
      );
      setFile(null);
      event.target.reset();
      await fetchSalaryData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Salary sheet upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (slip) => {
    setDownloadingId(slip._id);
    try {
      const res = await salaryApi.get(`/api/payroll/my-slips/${slip._id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `salary-slip-${slip.year}-${String(slip.month).padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to download salary slip");
    } finally {
      setDownloadingId("");
    }
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setSearchTerm("");
    setShowFilters(false);
  };

	  return (
	    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 ml-5">
	      <div className="w-full space-y-5">
        {/* Header Section - Reduced height */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 shadow-lg">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white"></div>
            <div className="absolute right-40 bottom-10 h-48 w-48 rounded-full bg-white"></div>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Salary Management</h1>
              <p className="mt-0.5 text-sm text-blue-100">View and manage your salary slips efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">
                  {slips.length} {slips.length === 1 ? "Slip" : "Slips"} Available
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards - Reduced gap */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Slips</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Years Active</p>
                <p className="text-xl font-bold text-slate-900">{stats.uniqueYears}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Latest Slip</p>
                <p className="text-sm font-semibold text-slate-900">
                  {stats.latest ? `${stats.latest.monthName} ${stats.latest.year}` : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Status</p>
                <p className="text-sm font-semibold text-emerald-600">Active</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Reduced padding */}
        {canUpload && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Upload Salary Sheet</h2>
                <p className="text-xs text-slate-500">Upload employee salary data in Excel format</p>
              </div>
            </div>
            
            <form onSubmit={handleUpload} className="grid gap-3 md:grid-cols-4 md:items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {MONTHS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Year
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload Sheet"}
              </button>
            </form>
            
            {uploadResult && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Upload Complete: {uploadResult.successRows || 0} successful, {uploadResult.failedRows || 0} failed
                    </p>
                    <p className="text-xs text-slate-600">
                      {selectedMonthLabel} {year}
                    </p>
                  </div>
                </div>
                {Array.isArray(uploadResult.failedRecords) && uploadResult.failedRecords.length > 0 && (
                  <div className="mt-2 max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">
                    {uploadResult.failedRecords.slice(0, 5).map((item, index) => (
                      <p key={`${item.employee || "row"}-${index}`} className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {item.employee || "Unknown employee"}: {item.reason}
                      </p>
                    ))}
                    {uploadResult.failedRecords.length > 5 && (
                      <p className="mt-1 text-red-600">
                        +{uploadResult.failedRecords.length - 5} more failed rows
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Salary Slips List - Reduced padding */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">My Salary Slips</h2>
              <p className="text-xs text-slate-500">Download your salary slips in PDF format</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-36 rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-40"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {(filterMonth !== "all" || filterYear !== "all") && (
                  <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                    Active
                  </span>
                )}
              </button>
              
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="border-b border-slate-100 bg-slate-50/50 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-slate-600">Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="all">All months</option>
                    {MONTHS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-slate-600">Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="all">All years</option>
                    {availableYears.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            </div>
          )}
          
          <div className="divide-y divide-slate-100">
            {!loading && filteredSlips.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="rounded-full bg-slate-100 p-3">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">No salary slips found</p>
                <p className="text-xs text-slate-500">
                  {searchTerm || filterMonth !== "all" || filterYear !== "all" 
                    ? "Try adjusting your filters or search terms" 
                    : "Your salary slips will appear here once processed"}
                </p>
              </div>
            ) : (
              filteredSlips.map((slip) => (
                <div 
                  key={slip._id} 
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {slip.monthName} {slip.year}
                      </p>
                      <p className="text-xs text-slate-500">
                        {slip.employeeName} • {slip.employeeCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="mr-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Available
                    </span>
                    <button
                      onClick={() => handleDownload(slip)}
                      disabled={downloadingId === slip._id}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {downloadingId === slip._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Uploads - Reduced padding */}
        {canUpload && batches.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent Upload History</h2>
                  <p className="text-xs text-slate-500">Track your salary sheet uploads</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Month</th>
                    <th className="px-4 py-2.5 font-medium">File Name</th>
                    <th className="px-4 py-2.5 font-medium">Success Rate</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const successRate = batch.totalRows > 0 
                      ? Math.round((batch.successRows / batch.totalRows) * 100)
                      : 0;
                    return (
                      <tr key={batch._id} className="transition hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                          {MONTHS.find((item) => item.value === batch.month)?.label || batch.month} {batch.year}
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-600">
                          {batch.fileName}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                              <div 
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">
                              {batch.successRows}/{batch.totalRows}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
                            ${batch.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                              batch.status === 'processing' ? 'bg-amber-50 text-amber-700' : 
                              'bg-red-50 text-red-700'}`}
                          >
                            {batch.status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
                            {batch.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                            {batch.status === 'failed' && <AlertCircle className="h-2.5 w-2.5" />}
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default SalarySlips;

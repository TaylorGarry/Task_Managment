

// import React, { useEffect, useMemo, useState } from "react";

// import { useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { 
//   Download, 
//   FileSpreadsheet, 
//   Loader2, 
//   Upload, 
//   Search,
//   Calendar,
//   Users,
//   FileText,
//   TrendingUp,
//   Filter,
//   X,
//   CheckCircle,
//   AlertCircle,
//   Clock,
//   UserCog,
//   Eye,
//   UserCheck,
//   RefreshCw,
//   XCircle
// } from "lucide-react";
// import axios from "axios";
// import {
//   isAccountsDepartment,
//   isHrDepartment,
//   isSuperAdmin,
// } from "../utils/roleAccess.js";

// const MONTHS = [
//   { value: 1, label: "January" },
//   { value: 2, label: "February" },
//   { value: 3, label: "March" },
//   { value: 4, label: "April" },
//   { value: 5, label: "May" },
//   { value: 6, label: "June" },
//   { value: 7, label: "July" },
//   { value: 8, label: "August" },
//   { value: 9, label: "September" },
//   { value: 10, label: "October" },
//   { value: 11, label: "November" },
//   { value: 12, label: "December" },
// ];

// const currentDate = new Date();
// const SALARY_LIVE_SERVER_URL = "https://fdbs-server-a9gqg.ondigitalocean.app";
// const SALARY_LOCAL_SERVER_URL = "http://localhost:4000";

// const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

// const isLocalHost = () => {
//   if (typeof window === "undefined") return false;
//   const host = String(window.location.hostname || "").toLowerCase();
//   return host === "localhost" || host === "127.0.0.1";
// };

// const getSalaryApiBaseUrl = () => {
//   const envUrl = trimTrailingSlash(import.meta?.env?.VITE_API_URL);

//   if (isLocalHost()) {
//     return envUrl || SALARY_LOCAL_SERVER_URL;
//   }

//   return envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")
//     ? envUrl
//     : SALARY_LIVE_SERVER_URL;
// };

// const salaryApi = axios.create({
//   baseURL: getSalaryApiBaseUrl(),
// });

// salaryApi.interceptors.request.use(
//   (config) => {
//     const user = JSON.parse(localStorage.getItem("user"));

//     if (user?.token) {
//       config.headers.Authorization = `Bearer ${user.token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const SalarySlips = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [month, setMonth] = useState(currentDate.getMonth() + 1);
//   const [year, setYear] = useState(currentDate.getFullYear());
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [downloadingId, setDownloadingId] = useState("");
//   const [slips, setSlips] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [uploadResult, setUploadResult] = useState(null);
//   const [filterMonth, setFilterMonth] = useState("all");
//   const [filterYear, setFilterYear] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
  
//   // New state for HR/Accounts features
//   const [viewMode, setViewMode] = useState("my-slips");
//   const [employees, setEmployees] = useState([]);
//   const [employeeStats, setEmployeeStats] = useState({ total: 0, uploaded: 0, pending: 0, noAccount: 0 });
//   const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all");
//   const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
//   const [salaryRecords, setSalaryRecords] = useState([]);

//   // ===== Failed Employees Modal States =====
//   const [showFailedModal, setShowFailedModal] = useState(false);
//   const [failedEmployees, setFailedEmployees] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [downloadingFailed, setDownloadingFailed] = useState(false);
//   const [loadingFailed, setLoadingFailed] = useState(false);

//   const canUpload = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);
//   const isHRorAccounts = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);

//   const selectedMonthLabel = useMemo(
//     () => MONTHS.find((item) => Number(item.value) === Number(month))?.label || "",
//     [month]
//   );
  
//   const availableYears = useMemo(() => {
//     const years = new Set(slips.map((slip) => slip.year).filter(Boolean));
//     return Array.from(years).sort((a, b) => b - a);
//   }, [slips]);
  
//   const filteredSlips = useMemo(() => {
//     return slips.filter((slip) => {
//       const monthMatches = filterMonth === "all" || Number(slip.month) === Number(filterMonth);
//       const yearMatches = filterYear === "all" || Number(slip.year) === Number(filterYear);
//       const searchMatches = searchTerm === "" || 
//         slip.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         slip.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
//       return monthMatches && yearMatches && searchMatches;
//     });
//   }, [filterMonth, filterYear, searchTerm, slips]);

//   const stats = useMemo(() => {
//     const total = slips.length;
//     const uniqueYears = new Set(slips.map(s => s.year)).size;
//     const latest = slips.length > 0 ? slips[0] : null;
//     return { total, uniqueYears, latest };
//   }, [slips]);

//   // Create employee list from salary records if employees state is empty
//   const employeeList = useMemo(() => {
//     if (employees.length > 0) {
//       return employees;
//     }
    
//     const employeeMap = new Map();
//     salaryRecords.forEach(record => {
//       const key = record.employeeCode || record._id;
//       if (!employeeMap.has(key)) {
//         employeeMap.set(key, {
//           employeeId: record.employee?._id || record._id,
//           employeeCode: record.employeeCode || 'N/A',
//           employeeName: record.employee?.username || record.employee?.realName || 'Unknown',
//           department: record.department || record.employee?.department || 'N/A',
//           designation: record.designation || 'N/A',
//           hasSalarySlip: true,
//           hasUserAccount: true,
//           status: 'Uploaded',
//           salaryRecordId: record._id
//         });
//       }
//     });
//     return Array.from(employeeMap.values());
//   }, [employees, salaryRecords]);

//   const filteredEmployees = useMemo(() => {
//     return employeeList.filter(emp => {
//       const matchesSearch = emp.employeeName?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
//                            emp.employeeCode?.toLowerCase().includes(employeeSearchTerm.toLowerCase());
//       const matchesStatus = employeeFilterStatus === "all" || 
//                            (employeeFilterStatus === "uploaded" && emp.hasSalarySlip) ||
//                            (employeeFilterStatus === "pending" && !emp.hasSalarySlip);
//       return matchesSearch && matchesStatus;
//     });
//   }, [employeeList, employeeSearchTerm, employeeFilterStatus]);

//   const salaryRecordsMap = useMemo(() => {
//     const map = new Map();
//     salaryRecords.forEach(record => {
//       if (record.employeeCode) {
//         map.set(record.employeeCode, record);
//       }
//       if (record.employee?.employeeCode) {
//         map.set(record.employee.employeeCode, record);
//       }
//       if (record.employee?._id) {
//         map.set(record.employee._id, record);
//       }
//       if (record._id) {
//         map.set(record._id, record);
//       }
//     });
//     return map;
//   }, [salaryRecords]);

//   // ===== Fetch Failed Employees - Using upload result data =====
//   const fetchFailedEmployees = async (batchId) => {
//     setLoadingFailed(true);
//     try {
//       // First check if we have the data from upload result
//       if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
//         const failedData = uploadResult.failedEmployees.map(item => ({
//           employeeName: item.employeeName || item.employee || 'Unknown',
//           employeeCode: item.employeeCode || 'N/A',
//           reason: item.reason || 'Unknown error',
//           existsInSystem: false,
//           hasUserAccount: false
//         }));
//         setFailedEmployees(failedData);
//         setSelectedBatch({
//           batchId: batchId,
//           month: month,
//           year: year,
//           fileName: uploadResult.batch?.fileName || 'Unknown',
//           totalFailed: failedData.length
//         });
//         setShowFailedModal(true);
//         setLoadingFailed(false);
//         return;
//       }

//       // Fallback: Try API call
//       const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees`);
//       const data = response.data?.data;
      
//       if (data && data.failedEmployees && data.failedEmployees.length > 0) {
//         setFailedEmployees(data.failedEmployees);
//         setSelectedBatch(data);
//       } else {
//         setFailedEmployees([]);
//         setSelectedBatch(data || {});
//       }
//       setShowFailedModal(true);
//     } catch (error) {
//       console.error('Failed to fetch failed employees:', error);
//       toast.error(error.response?.data?.message || 'Failed to fetch failed employees');
//     } finally {
//       setLoadingFailed(false);
//     }
//   };

//   // ===== Download Failed Employees CSV =====
//   const downloadFailedEmployees = async (batchId) => {
//     setDownloadingFailed(true);
//     try {
//       // If we have data from upload result, create CSV directly
//       if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
//         let csv = 'Sl. No.,Employee Name,Employee Code,Reason\n';
//         uploadResult.failedEmployees.forEach((item, index) => {
//           csv += `${index + 1},${item.employeeName || item.employee || 'Unknown'},${item.employeeCode || 'N/A'},${item.reason || 'Unknown error'}\n`;
//         });
        
//         const blob = new Blob([csv], { type: 'text/csv' });
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `failed-employees-${month}-${year}.csv`;
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//         window.URL.revokeObjectURL(url);
//         toast.success('Failed employees list downloaded successfully');
//         setDownloadingFailed(false);
//         return;
//       }

//       // Fallback: API call
//       const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees/download`, {
//         responseType: 'blob'
//       });
      
//       const blob = new Blob([response.data], { type: 'text/csv' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `failed-employees-${selectedMonth}-${selectedYear}.csv`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Failed employees list downloaded successfully');
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to download failed employees list');
//     } finally {
//       setDownloadingFailed(false);
//     }
//   };

//   const fetchSalaryData = async () => {
//     setLoading(true);
//     try {
//       const [slipRes, batchRes] = await Promise.all([
//         salaryApi.get("/api/payroll/my-slips"),
//         canUpload ? salaryApi.get("/api/payroll/batches") : Promise.resolve({ data: { data: [] } }),
//       ]);
//       setSlips(Array.isArray(slipRes.data?.data) ? slipRes.data.data : []);
//       setBatches(Array.isArray(batchRes.data?.data) ? batchRes.data.data : []);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Unable to load salary slips");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployeeSalaryStatus = async () => {
//     if (!isHRorAccounts) return;
//     try {
//       setLoading(true);
//       const response = await salaryApi.get("/api/payroll/employee-salary-status", {
//         params: { month: selectedMonth, year: selectedYear }
//       });
//       const data = response.data?.data || {};
//       setEmployees(data.employees || []);
//       setEmployeeStats({
//         total: data.total || 0,
//         uploaded: data.uploaded || 0,
//         pending: data.pending || 0,
//         noAccount: data.noAccount || 0
//       });
//     } catch (error) {
//       console.error("Failed to fetch employee status:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployeeSalarySlips = async () => {
//     if (!isHRorAccounts) return;
//     try {
//       const response = await salaryApi.get("/api/payroll/employee-slips", {
//         params: { month: selectedMonth, year: selectedYear }
//       });
//       const records = Array.isArray(response.data?.data) ? response.data.data : [];
//       setSalaryRecords(records);
      
//       if (employees.length === 0 && records.length > 0) {
//         setEmployeeStats({
//           total: records.length,
//           uploaded: records.length,
//           pending: 0,
//           noAccount: 0
//         });
//       }
//     } catch (error) {
//       console.error("Failed to fetch salary slips:", error);
//     }
//   };

//   useEffect(() => {
//     fetchSalaryData();
//   }, [canUpload]);

//   useEffect(() => {
//     if (viewMode === "employee-management" && isHRorAccounts) {
//       fetchEmployeeSalaryStatus();
//       fetchEmployeeSalarySlips();
//     }
//   }, [selectedMonth, selectedYear, viewMode]);

//   const handleUpload = async (event) => {
//     event.preventDefault();
//     if (!file) {
//       toast.error("Please select an Excel file");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("month", month);
//     formData.append("year", year);
//     formData.append("file", file);

//     setUploading(true);
//     try {
//       const res = await salaryApi.post("/api/payroll/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       const data = res.data?.data || {};
//       setUploadResult(data);
//       toast.success(
//         `Uploaded ${data.successRows || 0} rows, failed ${data.failedRows || 0}`
//       );
//       setFile(null);
//       event.target.reset();
//       await fetchSalaryData();
//       if (viewMode === "employee-management") {
//         await fetchEmployeeSalaryStatus();
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Salary sheet upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDownload = async (slip) => {
//     setDownloadingId(slip._id);
//     try {
//       const res = await salaryApi.get(`/api/payroll/my-slips/${slip._id}/download`, {
//         responseType: "blob",
//       });
//       const blob = new Blob([res.data], { type: "application/pdf" });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `salary-slip-${slip.year}-${String(slip.month).padStart(2, "0")}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Unable to download salary slip");
//     } finally {
//       setDownloadingId("");
//     }
//   };

//   const downloadEmployeeSlip = async (recordId, employeeName) => {
//     setDownloadingId(recordId);
//     try {
//       const response = await salaryApi.get(`/api/payroll/download/${recordId}`, {
//         responseType: 'blob'
//       });
      
//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `salary-slip-${employeeName}-${selectedMonth}-${selectedYear}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Salary slip downloaded successfully');
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to download salary slip');
//     } finally {
//       setDownloadingId('');
//     }
//   };

//   const clearFilters = () => {
//     setFilterMonth("all");
//     setFilterYear("all");
//     setSearchTerm("");
//     setShowFilters(false);
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 ml-5">
//       <div className="w-full space-y-5">
//         {/* Header Section */}
//         <header className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 shadow-lg">
//           <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
//             <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white"></div>
//             <div className="absolute right-40 bottom-10 h-48 w-48 rounded-full bg-white"></div>
//           </div>
//           <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <h1 className="text-xl font-bold text-white">Salary Management</h1>
//               <p className="mt-0.5 text-sm text-blue-100">View and manage your salary slips efficiently</p>
//             </div>
//             <div className="flex items-center gap-3">
//               {isHRorAccounts && (
//                 <div className="flex rounded-lg bg-white/20 p-1 backdrop-blur-sm">
//                   <button
//                     onClick={() => setViewMode("my-slips")}
//                     className={`px-3 py-1 text-xs font-medium rounded transition ${
//                       viewMode === "my-slips" 
//                         ? "bg-white text-blue-700" 
//                         : "text-white hover:bg-white/10"
//                     }`}
//                   >
//                     <UserCheck className="inline h-3.5 w-3.5 mr-1" />
//                     My Slips
//                   </button>
//                   <button
//                     onClick={() => setViewMode("employee-management")}
//                     className={`px-3 py-1 text-xs font-medium rounded transition ${
//                       viewMode === "employee-management" 
//                         ? "bg-white text-blue-700" 
//                         : "text-white hover:bg-white/10"
//                     }`}
//                   >
//                     <Users className="inline h-3.5 w-3.5 mr-1" />
//                     All Employees
//                   </button>
//                 </div>
//               )}
//               <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
//                 <span className="text-sm font-medium text-white">
//                   {viewMode === "my-slips" 
//                     ? `${slips.length} ${slips.length === 1 ? "Slip" : "Slips"} Available`
//                     : `${employeeList.length} Employees`}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//           {viewMode === "my-slips" ? (
//             <>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Total Slips</p>
//                     <p className="text-xl font-bold text-slate-900">{stats.total}</p>
//                   </div>
//                   <div className="rounded-lg bg-blue-50 p-2.5">
//                     <FileText className="h-4 w-4 text-blue-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Years Active</p>
//                     <p className="text-xl font-bold text-slate-900">{stats.uniqueYears}</p>
//                   </div>
//                   <div className="rounded-lg bg-purple-50 p-2.5">
//                     <Calendar className="h-4 w-4 text-purple-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Latest Slip</p>
//                     <p className="text-sm font-semibold text-slate-900">
//                       {stats.latest ? `${stats.latest.monthName} ${stats.latest.year}` : "N/A"}
//                     </p>
//                   </div>
//                   <div className="rounded-lg bg-emerald-50 p-2.5">
//                     <TrendingUp className="h-4 w-4 text-emerald-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Status</p>
//                     <p className="text-sm font-semibold text-emerald-600">Active</p>
//                   </div>
//                   <div className="rounded-lg bg-amber-50 p-2.5">
//                     <Clock className="h-4 w-4 text-amber-600" />
//                   </div>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Total Employees</p>
//                     <p className="text-xl font-bold text-slate-900">{employeeList.length}</p>
//                   </div>
//                   <div className="rounded-lg bg-blue-50 p-2.5">
//                     <Users className="h-4 w-4 text-blue-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Salary Uploaded</p>
//                     <p className="text-xl font-bold text-emerald-600">{employeeStats.uploaded}</p>
//                   </div>
//                   <div className="rounded-lg bg-green-50 p-2.5">
//                     <CheckCircle className="h-4 w-4 text-green-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Pending Upload</p>
//                     <p className="text-xl font-bold text-yellow-600">{employeeStats.pending}</p>
//                   </div>
//                   <div className="rounded-lg bg-yellow-50 p-2.5">
//                     <AlertCircle className="h-4 w-4 text-yellow-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">No Account</p>
//                     <p className="text-xl font-bold text-red-600">{employeeStats.noAccount}</p>
//                   </div>
//                   <div className="rounded-lg bg-red-50 p-2.5">
//                     <XCircle className="h-4 w-4 text-red-600" />
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Upload Section */}
//         {canUpload && viewMode === "my-slips" && (
//           <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
//             <div className="mb-4 flex items-center gap-3">
//               <div className="rounded-lg bg-blue-50 p-2">
//                 <FileSpreadsheet className="h-4 w-4 text-blue-600" />
//               </div>
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">Upload Salary Sheet</h2>
//                 <p className="text-xs text-slate-500">Upload employee salary data in Excel format</p>
//               </div>
//             </div>
            
//             <form onSubmit={handleUpload} className="grid gap-3 md:grid-cols-4 md:items-end">
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Month
//                 </label>
//                 <select
//                   value={month}
//                   onChange={(e) => setMonth(Number(e.target.value))}
//                   className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                 >
//                   {MONTHS.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </div>
              
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Year
//                 </label>
//                 <input
//                   type="number"
//                   min="2020"
//                   max="2100"
//                   value={year}
//                   onChange={(e) => setYear(e.target.value)}
//                   className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                 />
//               </div>
              
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Excel File
//                 </label>
//                 <input
//                   type="file"
//                   accept=".xlsx,.xls"
//                   onChange={(e) => setFile(e.target.files?.[0] || null)}
//                   className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
//                 />
//               </div>
              
//               <button
//                 type="submit"
//                 disabled={uploading}
//                 className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
//                 {uploading ? "Uploading..." : "Upload Sheet"}
//               </button>
//             </form>
            
//             {uploadResult && (
//               <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="h-4 w-4 text-emerald-600" />
//                   <div>
//                     <p className="text-sm font-semibold text-slate-900">
//                       Upload Complete: {uploadResult.successRows || 0} successful, {uploadResult.failedRows || 0} failed
//                     </p>
//                     <p className="text-xs text-slate-600">
//                       {selectedMonthLabel} {year}
//                     </p>
//                   </div>
//                 </div>
                
//                 {/* ===== FIX: Show all failed employees from upload result ===== */}
//                 {uploadResult.failedEmployees && uploadResult.failedEmployees.length > 0 && (
//                   <div className="mt-2">
//                     <p className="text-xs font-semibold text-red-600 mb-1">
//                       Failed Employees ({uploadResult.failedEmployees.length}):
//                     </p>
//                     <div className="max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">
//                       {uploadResult.failedEmployees.slice(0, 10).map((item, index) => (
//                         <p key={index} className="flex items-center gap-1">
//                           <AlertCircle className="h-3 w-3 flex-shrink-0" />
//                           <span className="font-medium">{item.employeeName || item.employee || 'Unknown'}</span>
//                           {item.employeeCode && item.employeeCode !== 'N/A' && (
//                             <span className="text-red-500">({item.employeeCode})</span>
//                           )}
//                           <span className="text-red-400">-</span>
//                           <span className="truncate">{item.reason || 'Unknown error'}</span>
//                         </p>
//                       ))}
//                       {uploadResult.failedEmployees.length > 10 && (
//                         <p className="mt-1 text-red-600 font-medium">
//                           +{uploadResult.failedEmployees.length - 10} more failed employees
//                           <button 
//                             onClick={() => {
//                               // Use upload result data directly
//                               const failedData = uploadResult.failedEmployees.map(item => ({
//                                 employeeName: item.employeeName || item.employee || 'Unknown',
//                                 employeeCode: item.employeeCode || 'N/A',
//                                 reason: item.reason || 'Unknown error',
//                                 existsInSystem: false,
//                                 hasUserAccount: false
//                               }));
//                               setFailedEmployees(failedData);
//                               setSelectedBatch({
//                                 batchId: uploadResult.batch?._id || 'unknown',
//                                 month: month,
//                                 year: year,
//                                 fileName: uploadResult.batch?.fileName || 'Unknown',
//                                 totalFailed: failedData.length
//                               });
//                               setShowFailedModal(true);
//                             }}
//                             className="ml-2 text-blue-600 hover:underline"
//                           >
//                             View all
//                           </button>
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </section>
//         )}

//         {/* Main Content - My Salary Slips */}
//         {viewMode === "my-slips" && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">My Salary Slips</h2>
//                 <p className="text-xs text-slate-500">Download your salary slips in PDF format</p>
//               </div>
              
//               <div className="flex flex-wrap items-center gap-2">
//                 <div className="relative">
//                   <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-36 rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-40"
//                   />
//                 </div>
                
//                 <button
//                   onClick={() => setShowFilters(!showFilters)}
//                   className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
//                 >
//                   <Filter className="h-3.5 w-3.5" />
//                   Filters
//                   {(filterMonth !== "all" || filterYear !== "all") && (
//                     <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
//                       Active
//                     </span>
//                   )}
//                 </button>
                
//                 {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
//               </div>
//             </div>
            
//             {showFilters && (
//               <div className="border-b border-slate-100 bg-slate-50/50 p-3">
//                 <div className="flex flex-wrap items-end gap-3">
//                   <div>
//                     <label className="mb-0.5 block text-xs font-medium text-slate-600">Month</label>
//                     <select
//                       value={filterMonth}
//                       onChange={(e) => setFilterMonth(e.target.value)}
//                       className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
//                     >
//                       <option value="all">All months</option>
//                       {MONTHS.map((item) => (
//                         <option key={item.value} value={item.value}>{item.label}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="mb-0.5 block text-xs font-medium text-slate-600">Year</label>
//                     <select
//                       value={filterYear}
//                       onChange={(e) => setFilterYear(e.target.value)}
//                       className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
//                     >
//                       <option value="all">All years</option>
//                       {availableYears.map((item) => (
//                         <option key={item} value={item}>{item}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <button
//                     onClick={clearFilters}
//                     className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:text-slate-700"
//                   >
//                     <X className="h-3.5 w-3.5" />
//                     Clear all
//                   </button>
//                 </div>
//               </div>
//             )}
            
//             <div className="divide-y divide-slate-100">
//               {!loading && filteredSlips.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
//                   <div className="rounded-full bg-slate-100 p-3">
//                     <FileText className="h-6 w-6 text-slate-400" />
//                   </div>
//                   <p className="mt-3 text-sm font-medium text-slate-900">No salary slips found</p>
//                   <p className="text-xs text-slate-500">
//                     {searchTerm || filterMonth !== "all" || filterYear !== "all" 
//                       ? "Try adjusting your filters or search terms" 
//                       : "Your salary slips will appear here once processed"}
//                   </p>
//                 </div>
//               ) : (
//                 filteredSlips.map((slip) => (
//                   <div 
//                     key={slip._id} 
//                     className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//                         <Calendar className="h-4 w-4" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-slate-900">
//                           {slip.monthName} {slip.year}
//                         </p>
//                         <p className="text-xs text-slate-500">
//                           {slip.employeeName} • {slip.employeeCode}
//                         </p>
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center gap-2">
//                       <span className="mr-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
//                         Available
//                       </span>
//                       <button
//                         // onClick={() => handleDownload(slip)}
//                         disabled={downloadingId === slip._id}
//                         className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
//                       >
//                         {downloadingId === slip._id ? (
//                           <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                         ) : (
//                           <Download className="h-3.5 w-3.5" />
//                         )}
//                         Download PDF
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </section>
//         )}

//         {/* Employee Management View - HR/Accounts */}
//         {viewMode === "employee-management" && isHRorAccounts && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">Employee Salary Status</h2>
//                 <p className="text-xs text-slate-500">View and download salary slips for all employees</p>
//               </div>
              
//               <div className="flex flex-wrap items-center gap-2">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                 >
//                   {MONTHS.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//                 <input
//                   type="number"
//                   value={selectedYear}
//                   onChange={(e) => setSelectedYear(Number(e.target.value))}
//                   className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                   min="2020"
//                   max="2100"
//                 />
//                 <button
//                   onClick={() => {
//                     fetchEmployeeSalaryStatus();
//                     fetchEmployeeSalarySlips();
//                   }}
//                   className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
//                 >
//                   <RefreshCw className="h-3.5 w-3.5" />
//                   Refresh
//                 </button>
//               </div>
//             </div>
            
//             <div className="border-b border-slate-100 p-4 bg-slate-50/50">
//               <div className="flex flex-wrap gap-3">
//                 <div className="relative flex-1 min-w-[200px]">
//                   <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search by name or code..."
//                     value={employeeSearchTerm}
//                     onChange={(e) => setEmployeeSearchTerm(e.target.value)}
//                     className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                   />
//                 </div>
//                 <select
//                   value={employeeFilterStatus}
//                   onChange={(e) => setEmployeeFilterStatus(e.target.value)}
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="uploaded">Uploaded</option>
//                   <option value="pending">Pending</option>
//                 </select>
//               </div>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Status</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {loading ? (
//                     <tr>
//                       <td colSpan="5" className="px-4 py-4 text-center">
//                         <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
//                       </td>
//                     </tr>
//                   ) : filteredEmployees.length === 0 ? (
//                     <tr>
//                       <td colSpan="5" className="px-4 py-4 text-center text-gray-500 text-sm">
//                         No employees found
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredEmployees.map((emp) => {
//                       let salaryRecord = salaryRecordsMap.get(emp.employeeCode) || 
//                                         salaryRecordsMap.get(emp.employeeId);
                      
//                       return (
//                         <tr key={emp.employeeId || emp._id} className="hover:bg-gray-50 transition">
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.employeeCode || 'N/A'}</td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.department || 'N/A'}</td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                               emp.hasSalarySlip || salaryRecord
//                                 ? 'bg-green-100 text-green-800' 
//                                 : 'bg-yellow-100 text-yellow-800'
//                             }`}>
//                               {emp.hasSalarySlip || salaryRecord ? '✅ Uploaded' : '⏳ Pending'}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm">
//                             {(emp.hasSalarySlip || salaryRecord) && (salaryRecord || emp.salaryRecordId) ? (
//                               <button
//                                 onClick={() => downloadEmployeeSlip(
//                                   salaryRecord?._id || emp.salaryRecordId, 
//                                   emp.employeeName
//                                 )}
//                                 disabled={downloadingId === (salaryRecord?._id || emp.salaryRecordId)}
//                                 className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
//                               >
//                                 {downloadingId === (salaryRecord?._id || emp.salaryRecordId) ? (
//                                   <Loader2 className="h-3 w-3 animate-spin mr-1" />
//                                 ) : (
//                                   <Download className="h-3 w-3 mr-1" />
//                                 )}
//                                 Download
//                               </button>
//                             ) : (
//                               <span className="text-xs text-gray-400">
//                                 {!emp.hasUserAccount ? 'No account' : 'Not uploaded'}
//                               </span>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         )}

//         {/* Recent Uploads */}
//         {canUpload && batches.length > 0 && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="border-b border-slate-100 px-4 py-3">
//               <div className="flex items-center gap-3">
//                 <div className="rounded-lg bg-purple-50 p-2">
//                   <Clock className="h-4 w-4 text-purple-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-base font-semibold text-slate-900">Recent Upload History</h2>
//                   <p className="text-xs text-slate-500">Track your salary sheet uploads</p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-left text-sm">
//                 <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
//                   <tr>
//                     <th className="px-4 py-2.5 font-medium">Month</th>
//                     <th className="px-4 py-2.5 font-medium">File Name</th>
//                     <th className="px-4 py-2.5 font-medium">Success Rate</th>
//                     <th className="px-4 py-2.5 font-medium">Status</th>
//                     <th className="px-4 py-2.5 font-medium">Failed</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {batches.map((batch) => {
//                     const successRate = batch.totalRows > 0 
//                       ? Math.round((batch.successRows / batch.totalRows) * 100)
//                       : 0;
//                     const failedCount = batch.failedCount || (batch.totalRows - batch.successRows);
//                     return (
//                       <tr key={batch._id} className="transition hover:bg-slate-50/50">
//                         <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
//                           {MONTHS.find((item) => item.value === batch.month)?.label || batch.month} {batch.year}
//                         </td>
//                         <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-600">
//                           {batch.fileName}
//                         </td>
//                         <td className="px-4 py-2.5">
//                           <div className="flex items-center gap-2">
//                             <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
//                               <div 
//                                 className="h-full rounded-full bg-emerald-500 transition-all"
//                                 style={{ width: `${successRate}%` }}
//                               />
//                             </div>
//                             <span className="text-[10px] font-medium text-slate-600">
//                               {batch.successRows}/{batch.totalRows}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-4 py-2.5">
//                           <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
//                             ${batch.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
//                               batch.status === 'processing' ? 'bg-amber-50 text-amber-700' : 
//                               'bg-red-50 text-red-700'}`}
//                           >
//                             {batch.status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
//                             {batch.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
//                             {batch.status === 'failed' && <AlertCircle className="h-2.5 w-2.5" />}
//                             {batch.status}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2.5">
//                           {failedCount > 0 ? (
//                             <button
//                               onClick={() => fetchFailedEmployees(batch._id)}
//                               className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline inline-flex items-center gap-1"
//                             >
//                               <AlertCircle className="h-3 w-3" />
//                               {failedCount} failed
//                             </button>
//                           ) : (
//                             <span className="text-emerald-600 text-xs">None</span>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         )}
//       </div>

//       {/* ===== Failed Employees Modal ===== */}
//       {showFailedModal && selectedBatch && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-4 border-b border-slate-200">
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900">Failed Employees</h3>
//                 <p className="text-sm text-slate-500">
//                   {selectedBatch.monthName || MONTHS.find(m => m.value === selectedBatch.month)?.label || selectedBatch.month} {selectedBatch.year} - {selectedBatch.fileName}
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowFailedModal(false)}
//                 className="text-slate-400 hover:text-slate-600"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>
            
//             {/* Modal Body */}
//             <div className="flex-1 overflow-y-auto p-4">
//               {/* Summary Stats */}
//               <div className="grid grid-cols-4 gap-3 mb-4">
//                 <div className="bg-red-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{failedEmployees.length}</p>
//                   <p className="text-xs text-red-600">Total Failed</p>
//                 </div>
//                 <div className="bg-yellow-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-yellow-600">
//                     {failedEmployees.filter(e => e.existsInSystem).length}
//                   </p>
//                   <p className="text-xs text-yellow-600">Exists in System</p>
//                 </div>
//                 <div className="bg-orange-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-orange-600">
//                     {failedEmployees.filter(e => e.existsInSystem && !e.hasUserAccount).length}
//                   </p>
//                   <p className="text-xs text-orange-600">No User Account</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-gray-600">
//                     {failedEmployees.filter(e => !e.existsInSystem).length}
//                   </p>
//                   <p className="text-xs text-gray-600">Not in System</p>
//                 </div>
//               </div>
              
//               {/* Failed Employees Table */}
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {loadingFailed ? (
//                       <tr>
//                         <td colSpan="5" className="px-3 py-4 text-center">
//                           <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
//                         </td>
//                       </tr>
//                     ) : failedEmployees.length === 0 ? (
//                       <tr>
//                         <td colSpan="5" className="px-3 py-4 text-center text-gray-500 text-sm">
//                           No failed employees found
//                         </td>
//                       </tr>
//                     ) : (
//                       failedEmployees.map((emp, index) => (
//                         <tr key={index} className="hover:bg-gray-50">
//                           <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
//                           <td className="px-3 py-2 text-sm font-medium text-gray-900">{emp.employeeName}</td>
//                           <td className="px-3 py-2 text-sm text-gray-500">{emp.employeeCode}</td>
//                           <td className="px-3 py-2 text-sm text-red-600">{emp.reason}</td>
//                           <td className="px-3 py-2">
//                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                               emp.existsInSystem 
//                                 ? emp.hasUserAccount 
//                                   ? 'bg-green-100 text-green-800' 
//                                   : 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-red-100 text-red-800'
//                             }`}>
//                               {emp.existsInSystem 
//                                 ? emp.hasUserAccount 
//                                   ? '✅ Has Account' 
//                                   : '⚠️ No Account'
//                                 : '❌ Not Found'}
//                             </span>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
            
//             {/* Modal Footer */}
//             <div className="flex items-center justify-between p-4 border-t border-slate-200">
//               <div className="text-sm text-slate-500">
//                 Total: {failedEmployees.length} failed employees
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => downloadFailedEmployees(selectedBatch.batchId)}
//                   disabled={downloadingFailed}
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
//                 >
//                   {downloadingFailed ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Download className="h-4 w-4" />
//                   )}
//                   Download CSV
//                 </button>
//                 <button
//                   onClick={() => setShowFailedModal(false)}
//                   className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// };

// export default SalarySlips;




// import React, { useEffect, useMemo, useState } from "react";
// import { useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { 
//   Download, 
//   FileSpreadsheet, 
//   Loader2, 
//   Upload, 
//   Search,
//   Calendar,
//   Users,
//   FileText,
//   TrendingUp,
//   Filter,
//   X,
//   CheckCircle,
//   AlertCircle,
//   Clock,
//   UserCog,
//   Eye,
//   UserCheck,
//   RefreshCw,
//   XCircle,
//   Mail,
//   Send
// } from "lucide-react";
// import axios from "axios";
// import {
//   isAccountsDepartment,
//   isHrDepartment,
//   isSuperAdmin,
// } from "../utils/roleAccess.js";

// const MONTHS = [
//   { value: 1, label: "January" },
//   { value: 2, label: "February" },
//   { value: 3, label: "March" },
//   { value: 4, label: "April" },
//   { value: 5, label: "May" },
//   { value: 6, label: "June" },
//   { value: 7, label: "July" },
//   { value: 8, label: "August" },
//   { value: 9, label: "September" },
//   { value: 10, label: "October" },
//   { value: 11, label: "November" },
//   { value: 12, label: "December" },
// ];

// const currentDate = new Date();
// const SALARY_LIVE_SERVER_URL = "https://fdbs-server-a9gqg.ondigitalocean.app";
// const SALARY_LOCAL_SERVER_URL = "http://localhost:4000";

// const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

// const isLocalHost = () => {
//   if (typeof window === "undefined") return false;
//   const host = String(window.location.hostname || "").toLowerCase();
//   return host === "localhost" || host === "127.0.0.1";
// };

// const getSalaryApiBaseUrl = () => {
//   const envUrl = trimTrailingSlash(import.meta?.env?.VITE_API_URL);

//   if (isLocalHost()) {
//     return envUrl || SALARY_LOCAL_SERVER_URL;
//   }

//   return envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")
//     ? envUrl
//     : SALARY_LIVE_SERVER_URL;
// };

// const salaryApi = axios.create({
//   baseURL: getSalaryApiBaseUrl(),
// });

// salaryApi.interceptors.request.use(
//   (config) => {
//     const user = JSON.parse(localStorage.getItem("user"));

//     if (user?.token) {
//       config.headers.Authorization = `Bearer ${user.token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const SalarySlips = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [month, setMonth] = useState(currentDate.getMonth() + 1);
//   const [year, setYear] = useState(currentDate.getFullYear());
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [sendingId, setSendingId] = useState("");
//   const [downloadingId, setDownloadingId] = useState("");
//   const [slips, setSlips] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [uploadResult, setUploadResult] = useState(null);
//   const [filterMonth, setFilterMonth] = useState("all");
//   const [filterYear, setFilterYear] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
  
//   // New state for HR/Accounts features
//   const [viewMode, setViewMode] = useState("my-slips");
//   const [employees, setEmployees] = useState([]);
//   const [employeeStats, setEmployeeStats] = useState({ total: 0, uploaded: 0, pending: 0, noAccount: 0 });
//   const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all");
//   const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
//   const [salaryRecords, setSalaryRecords] = useState([]);
//   const [sendingBulk, setSendingBulk] = useState(false);

//   // ===== Failed Employees Modal States =====
//   const [showFailedModal, setShowFailedModal] = useState(false);
//   const [failedEmployees, setFailedEmployees] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [downloadingFailed, setDownloadingFailed] = useState(false);
//   const [loadingFailed, setLoadingFailed] = useState(false);

//   const canUpload = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);
//   const isHRorAccounts = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);

//   const selectedMonthLabel = useMemo(
//     () => MONTHS.find((item) => Number(item.value) === Number(month))?.label || "",
//     [month]
//   );
  
//   const availableYears = useMemo(() => {
//     const years = new Set(slips.map((slip) => slip.year).filter(Boolean));
//     return Array.from(years).sort((a, b) => b - a);
//   }, [slips]);
  
//   const filteredSlips = useMemo(() => {
//     return slips.filter((slip) => {
//       const monthMatches = filterMonth === "all" || Number(slip.month) === Number(filterMonth);
//       const yearMatches = filterYear === "all" || Number(slip.year) === Number(filterYear);
//       const searchMatches = searchTerm === "" || 
//         slip.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         slip.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
//       return monthMatches && yearMatches && searchMatches;
//     });
//   }, [filterMonth, filterYear, searchTerm, slips]);

//   const stats = useMemo(() => {
//     const total = slips.length;
//     const uniqueYears = new Set(slips.map(s => s.year)).size;
//     const latest = slips.length > 0 ? slips[0] : null;
//     return { total, uniqueYears, latest };
//   }, [slips]);

//   // Create employee list from salary records if employees state is empty
//   const employeeList = useMemo(() => {
//     if (employees.length > 0) {
//       return employees;
//     }
    
//     const employeeMap = new Map();
//     salaryRecords.forEach(record => {
//       const key = record.employeeCode || record._id;
//       if (!employeeMap.has(key)) {
//         employeeMap.set(key, {
//           employeeId: record.employee?._id || record._id,
//           employeeCode: record.employeeCode || 'N/A',
//           employeeName: record.employee?.username || record.employee?.realName || 'Unknown',
//           department: record.department || record.employee?.department || 'N/A',
//           designation: record.designation || 'N/A',
//           hasSalarySlip: true,
//           hasUserAccount: true,
//           status: 'Uploaded',
//           salaryRecordId: record._id,
//           email: record.employee?.email || null
//         });
//       }
//     });
//     return Array.from(employeeMap.values());
//   }, [employees, salaryRecords]);

//   const filteredEmployees = useMemo(() => {
//     return employeeList.filter(emp => {
//       const matchesSearch = emp.employeeName?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
//                            emp.employeeCode?.toLowerCase().includes(employeeSearchTerm.toLowerCase());
//       const matchesStatus = employeeFilterStatus === "all" || 
//                            (employeeFilterStatus === "uploaded" && emp.hasSalarySlip) ||
//                            (employeeFilterStatus === "pending" && !emp.hasSalarySlip);
//       return matchesSearch && matchesStatus;
//     });
//   }, [employeeList, employeeSearchTerm, employeeFilterStatus]);

//   const salaryRecordsMap = useMemo(() => {
//     const map = new Map();
//     salaryRecords.forEach(record => {
//       if (record.employeeCode) {
//         map.set(record.employeeCode, record);
//       }
//       if (record.employee?.employeeCode) {
//         map.set(record.employee.employeeCode, record);
//       }
//       if (record.employee?._id) {
//         map.set(record.employee._id, record);
//       }
//       if (record._id) {
//         map.set(record._id, record);
//       }
//     });
//     return map;
//   }, [salaryRecords]);

//   // ===== Fetch Failed Employees - Using upload result data =====
//   const fetchFailedEmployees = async (batchId) => {
//     setLoadingFailed(true);
//     try {
//       if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
//         const failedData = uploadResult.failedEmployees.map(item => ({
//           employeeName: item.employeeName || item.employee || 'Unknown',
//           employeeCode: item.employeeCode || 'N/A',
//           reason: item.reason || 'Unknown error',
//           existsInSystem: false,
//           hasUserAccount: false
//         }));
//         setFailedEmployees(failedData);
//         setSelectedBatch({
//           batchId: batchId,
//           month: month,
//           year: year,
//           fileName: uploadResult.batch?.fileName || 'Unknown',
//           totalFailed: failedData.length
//         });
//         setShowFailedModal(true);
//         setLoadingFailed(false);
//         return;
//       }

//       const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees`);
//       const data = response.data?.data;
      
//       if (data && data.failedEmployees && data.failedEmployees.length > 0) {
//         setFailedEmployees(data.failedEmployees);
//         setSelectedBatch(data);
//       } else {
//         setFailedEmployees([]);
//         setSelectedBatch(data || {});
//       }
//       setShowFailedModal(true);
//     } catch (error) {
//       console.error('Failed to fetch failed employees:', error);
//       toast.error(error.response?.data?.message || 'Failed to fetch failed employees');
//     } finally {
//       setLoadingFailed(false);
//     }
//   };

//   // ===== Download Failed Employees CSV =====
//   const downloadFailedEmployees = async (batchId) => {
//     setDownloadingFailed(true);
//     try {
//       if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
//         let csv = 'Sl. No.,Employee Name,Employee Code,Reason\n';
//         uploadResult.failedEmployees.forEach((item, index) => {
//           csv += `${index + 1},${item.employeeName || item.employee || 'Unknown'},${item.employeeCode || 'N/A'},${item.reason || 'Unknown error'}\n`;
//         });
        
//         const blob = new Blob([csv], { type: 'text/csv' });
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `failed-employees-${month}-${year}.csv`;
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//         window.URL.revokeObjectURL(url);
//         toast.success('Failed employees list downloaded successfully');
//         setDownloadingFailed(false);
//         return;
//       }

//       const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees/download`, {
//         responseType: 'blob'
//       });
      
//       const blob = new Blob([response.data], { type: 'text/csv' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `failed-employees-${selectedMonth}-${selectedYear}.csv`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Failed employees list downloaded successfully');
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to download failed employees list');
//     } finally {
//       setDownloadingFailed(false);
//     }
//   };

//   const fetchSalaryData = async () => {
//     setLoading(true);
//     try {
//       const [slipRes, batchRes] = await Promise.all([
//         salaryApi.get("/api/payroll/my-slips"),
//         canUpload ? salaryApi.get("/api/payroll/batches") : Promise.resolve({ data: { data: [] } }),
//       ]);
//       setSlips(Array.isArray(slipRes.data?.data) ? slipRes.data.data : []);
//       setBatches(Array.isArray(batchRes.data?.data) ? batchRes.data.data : []);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Unable to load salary slips");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployeeSalaryStatus = async () => {
//     if (!isHRorAccounts) return;
//     try {
//       setLoading(true);
//       const response = await salaryApi.get("/api/payroll/employee-salary-status", {
//         params: { month: selectedMonth, year: selectedYear }
//       });
//       const data = response.data?.data || {};
//       setEmployees(data.employees || []);
//       setEmployeeStats({
//         total: data.total || 0,
//         uploaded: data.uploaded || 0,
//         pending: data.pending || 0,
//         noAccount: data.noAccount || 0
//       });
//     } catch (error) {
//       console.error("Failed to fetch employee status:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployeeSalarySlips = async () => {
//     if (!isHRorAccounts) return;
//     try {
//       const response = await salaryApi.get("/api/payroll/employee-slips", {
//         params: { month: selectedMonth, year: selectedYear }
//       });
//       const records = Array.isArray(response.data?.data) ? response.data.data : [];
//       setSalaryRecords(records);
      
//       if (employees.length === 0 && records.length > 0) {
//         setEmployeeStats({
//           total: records.length,
//           uploaded: records.length,
//           pending: 0,
//           noAccount: 0
//         });
//       }
//     } catch (error) {
//       console.error("Failed to fetch salary slips:", error);
//     }
//   };

//   useEffect(() => {
//     fetchSalaryData();
//   }, [canUpload]);

//   useEffect(() => {
//     if (viewMode === "employee-management" && isHRorAccounts) {
//       fetchEmployeeSalaryStatus();
//       fetchEmployeeSalarySlips();
//     }
//   }, [selectedMonth, selectedYear, viewMode]);

//   const handleUpload = async (event) => {
//     event.preventDefault();
//     if (!file) {
//       toast.error("Please select an Excel file");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("month", month);
//     formData.append("year", year);
//     formData.append("excelFile", file);

//     setUploading(true);
//     try {
//       const res = await salaryApi.post("/api/payroll/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       const data = res.data?.data || {};
//       setUploadResult(data);
//       toast.success(
//         `Uploaded ${data.successRows || 0} rows, failed ${data.failedRows || 0}`
//       );
//       setFile(null);
//       event.target.reset();
//       await fetchSalaryData();
//       if (viewMode === "employee-management") {
//         await fetchEmployeeSalaryStatus();
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Salary sheet upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // ===== DOWNLOAD MY SALARY SLIP PDF (Only HR/Accounts/SuperAdmin) =====
//  // ===== DOWNLOAD MY SALARY SLIP PDF (Only HR/Accounts/SuperAdmin) =====
// const downloadMySlipPdf = async (slip) => {
//   // Only HR/Accounts can download
//   if (!isHRorAccounts) {
//     toast.error("You are not authorized to download salary slips");
//     return;
//   }

//   setDownloadingId(slip._id);
//   let loadingToast = null;
  
//   try {
//     loadingToast = toast.loading('Downloading salary slip...');
    
//     // Use the correct endpoint for PDF download
//     const response = await salaryApi.get(`/api/payroll/my-slips/${slip._id}/download-pdf`, {
//       responseType: 'blob',
//       timeout: 30000
//     });

//     // Check if response is actually a PDF
//     const contentType = response.headers['content-type'] || '';
//     if (!contentType.includes('application/pdf')) {
//       // If not PDF, it might be an error response as blob
//       const text = await response.data.text();
//       try {
//         const errorData = JSON.parse(text);
//         throw new Error(errorData.message || 'Failed to download salary slip');
//       } catch {
//         throw new Error('Invalid response format. Please try again.');
//       }
//     }

//     const blob = new Blob([response.data], { type: 'application/pdf' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     const sanitizedName = (slip.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
//     link.download = `Salary_Slip_${sanitizedName}_${slip.monthName}_${slip.year}.pdf`;
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
    
//     if (loadingToast) toast.dismiss(loadingToast);
//     toast.success('Salary slip downloaded successfully');
    
//   } catch (error) {
//     console.error('Download my salary PDF error:', error);
//     if (loadingToast) toast.dismiss(loadingToast);
    
//     let errorMessage = "Failed to download salary slip. Please try again.";
//     if (error.response?.status === 403) {
//       errorMessage = "You are not authorized to download this salary slip.";
//     } else if (error.response?.status === 404) {
//       errorMessage = "Salary slip not found.";
//     } else if (error.response?.status === 500) {
//       errorMessage = "Server error. Please try again later.";
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     toast.error(errorMessage);
//   } finally {
//     setDownloadingId("");
//   }
// };

// // ===== DOWNLOAD EMPLOYEE SALARY SLIP PDF (Only HR/Accounts/SuperAdmin) =====
// const downloadEmployeeSlipPdf = async (recordId, employeeName) => {
//   // Only HR/Accounts can download
//   if (!isHRorAccounts) {
//     toast.error("You are not authorized to download salary slips");
//     return;
//   }

//   if (!recordId) {
//     toast.error("Invalid salary record ID");
//     return;
//   }

//   setDownloadingId(recordId);
//   let loadingToast = null;
  
//   try {
//     loadingToast = toast.loading(`Downloading salary slip for ${employeeName || 'Employee'}...`);
    
//     // Use the correct endpoint for PDF download
//     const response = await salaryApi.get(`/api/payroll/employee-slips/${recordId}/download-pdf`, {
//       responseType: 'blob',
//       timeout: 30000
//     });

//     // Check if response is actually a PDF
//     const contentType = response.headers['content-type'] || '';
//     if (!contentType.includes('application/pdf')) {
//       // If not PDF, it might be an error response as blob
//       const text = await response.data.text();
//       try {
//         const errorData = JSON.parse(text);
//         throw new Error(errorData.message || 'Failed to download salary slip');
//       } catch {
//         throw new Error('Invalid response format. Please try again.');
//       }
//     }

//     const blob = new Blob([response.data], { type: 'application/pdf' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth;
//     const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
//     link.download = `Salary_Slip_${sanitizedName}_${monthLabel}_${selectedYear}.pdf`;
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
    
//     if (loadingToast) toast.dismiss(loadingToast);
//     toast.success(`Salary slip downloaded successfully for ${employeeName}`);
    
//   } catch (error) {
//     console.error('Download employee salary PDF error:', error);
//     if (loadingToast) toast.dismiss(loadingToast);
    
//     let errorMessage = "Failed to download salary slip. Please try again.";
//     if (error.response?.status === 403) {
//       errorMessage = "You are not authorized to download this salary slip.";
//     } else if (error.response?.status === 404) {
//       errorMessage = "Salary slip not found.";
//     } else if (error.response?.status === 500) {
//       errorMessage = "Server error. Please try again later.";
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     toast.error(errorMessage);
//   } finally {
//     setDownloadingId("");
//   }
// };

//   // ===== SEND MY SALARY SLIP TO EMAIL =====
//   const handleSendToEmail = async (slip) => {
//     setSendingId(slip._id);
//     try {
//       const response = await salaryApi.post(`/api/payroll/my-slips/${slip._id}/send`);
      
//       if (response.data.success) {
//         toast.success(`Salary slip sent to ${response.data.data?.sentTo || 'your email'}`);
//       } else {
//         toast.error(response.data.message || 'Failed to send salary slip');
//       }
//     } catch (error) {
//       console.error('Send email error:', error);
//       toast.error(error.response?.data?.message || "Unable to send salary slip to email");
//     } finally {
//       setSendingId("");
//     }
//   };

//   // ===== SEND EMPLOYEE SALARY SLIP TO EMAIL (HR/Accounts) =====
//   const handleSendEmployeeSlip = async (recordId, employeeName) => {
//     setSendingId(recordId);
//     try {
//       const response = await salaryApi.post(`/api/payroll/employee-slips/${recordId}/send`);
      
//       if (response.data.success) {
//         toast.success(`Salary slip sent to ${response.data.data?.sentTo || employeeName}`);
//       } else {
//         toast.error(response.data.message || 'Failed to send salary slip');
//       }
//     } catch (error) {
//       console.error('Send employee salary error:', error);
//       toast.error(error.response?.data?.message || "Unable to send salary slip to employee email");
//     } finally {
//       setSendingId("");
//     }
//   };

//   // ===== SEND BULK SALARY SLIPS =====
//   const handleSendBulkSalarySlips = async () => {
//     if (!window.confirm(`Send salary slips for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} to all employees?`)) {
//       return;
//     }

//     setSendingBulk(true);
//     try {
//       const response = await salaryApi.post("/api/payroll/bulk-send", {
//         month: selectedMonth,
//         year: selectedYear
//       });

//       if (response.data.success) {
//         const data = response.data.data;
//         toast.success(`Bulk salary slips sent: ${data.successCount} successful, ${data.failedCount} failed`);
        
//         if (data.failedList && data.failedList.length > 0) {
//           const failedNames = data.failedList.map(item => item.employeeName).join(', ');
//           toast.error(`Failed to send to: ${failedNames}`);
//         }
//       } else {
//         toast.error(response.data.message || 'Failed to send bulk salary slips');
//       }
//     } catch (error) {
//       console.error('Bulk send error:', error);
//       toast.error(error.response?.data?.message || "Unable to send bulk salary slips");
//     } finally {
//       setSendingBulk(false);
//     }
//   };

//   const clearFilters = () => {
//     setFilterMonth("all");
//     setFilterYear("all");
//     setSearchTerm("");
//     setShowFilters(false);
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 ml-5">
//       <div className="w-full space-y-5">
//         {/* Header Section */}
//         <header className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 shadow-lg">
//           <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
//             <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white"></div>
//             <div className="absolute right-40 bottom-10 h-48 w-48 rounded-full bg-white"></div>
//           </div>
//           <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <h1 className="text-xl font-bold text-white">Salary Management</h1>
//               <p className="mt-0.5 text-sm text-blue-100">View and manage your salary slips efficiently</p>
//             </div>
//             <div className="flex items-center gap-3">
//               {isHRorAccounts && (
//                 <div className="flex rounded-lg bg-white/20 p-1 backdrop-blur-sm">
//                   <button
//                     onClick={() => setViewMode("my-slips")}
//                     className={`px-3 py-1 text-xs font-medium rounded transition ${
//                       viewMode === "my-slips" 
//                         ? "bg-white text-blue-700" 
//                         : "text-white hover:bg-white/10"
//                     }`}
//                   >
//                     <UserCheck className="inline h-3.5 w-3.5 mr-1" />
//                     My Slips
//                   </button>
//                   <button
//                     onClick={() => setViewMode("employee-management")}
//                     className={`px-3 py-1 text-xs font-medium rounded transition ${
//                       viewMode === "employee-management" 
//                         ? "bg-white text-blue-700" 
//                         : "text-white hover:bg-white/10"
//                     }`}
//                   >
//                     <Users className="inline h-3.5 w-3.5 mr-1" />
//                     All Employees
//                   </button>
//                 </div>
//               )}
//               <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
//                 <span className="text-sm font-medium text-white">
//                   {viewMode === "my-slips" 
//                     ? `${slips.length} ${slips.length === 1 ? "Slip" : "Slips"} Available`
//                     : `${employeeList.length} Employees`}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//           {viewMode === "my-slips" ? (
//             <>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Total Slips</p>
//                     <p className="text-xl font-bold text-slate-900">{stats.total}</p>
//                   </div>
//                   <div className="rounded-lg bg-blue-50 p-2.5">
//                     <FileText className="h-4 w-4 text-blue-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Years Active</p>
//                     <p className="text-xl font-bold text-slate-900">{stats.uniqueYears}</p>
//                   </div>
//                   <div className="rounded-lg bg-purple-50 p-2.5">
//                     <Calendar className="h-4 w-4 text-purple-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Latest Slip</p>
//                     <p className="text-sm font-semibold text-slate-900">
//                       {stats.latest ? `${stats.latest.monthName} ${stats.latest.year}` : "N/A"}
//                     </p>
//                   </div>
//                   <div className="rounded-lg bg-emerald-50 p-2.5">
//                     <TrendingUp className="h-4 w-4 text-emerald-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Status</p>
//                     <p className="text-sm font-semibold text-emerald-600">Active</p>
//                   </div>
//                   <div className="rounded-lg bg-amber-50 p-2.5">
//                     <Clock className="h-4 w-4 text-amber-600" />
//                   </div>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Total Employees</p>
//                     <p className="text-xl font-bold text-slate-900">{employeeList.length}</p>
//                   </div>
//                   <div className="rounded-lg bg-blue-50 p-2.5">
//                     <Users className="h-4 w-4 text-blue-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Salary Uploaded</p>
//                     <p className="text-xl font-bold text-emerald-600">{employeeStats.uploaded}</p>
//                   </div>
//                   <div className="rounded-lg bg-green-50 p-2.5">
//                     <CheckCircle className="h-4 w-4 text-green-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">Pending Upload</p>
//                     <p className="text-xl font-bold text-yellow-600">{employeeStats.pending}</p>
//                   </div>
//                   <div className="rounded-lg bg-yellow-50 p-2.5">
//                     <AlertCircle className="h-4 w-4 text-yellow-600" />
//                   </div>
//                 </div>
//               </div>
//               <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500">No Account</p>
//                     <p className="text-xl font-bold text-red-600">{employeeStats.noAccount}</p>
//                   </div>
//                   <div className="rounded-lg bg-red-50 p-2.5">
//                     <XCircle className="h-4 w-4 text-red-600" />
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Upload Section */}
//         {canUpload && viewMode === "my-slips" && (
//           <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
//             <div className="mb-4 flex items-center gap-3">
//               <div className="rounded-lg bg-blue-50 p-2">
//                 <FileSpreadsheet className="h-4 w-4 text-blue-600" />
//               </div>
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">Upload Salary Sheet</h2>
//                 <p className="text-xs text-slate-500">Upload employee salary data in Excel format</p>
//               </div>
//             </div>
            
//             <form onSubmit={handleUpload} className="grid gap-3 md:grid-cols-4 md:items-end">
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Month
//                 </label>
//                 <select
//                   value={month}
//                   onChange={(e) => setMonth(Number(e.target.value))}
//                   className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                 >
//                   {MONTHS.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </div>
              
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Year
//                 </label>
//                 <input
//                   type="number"
//                   min="2020"
//                   max="2100"
//                   value={year}
//                   onChange={(e) => setYear(e.target.value)}
//                   className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                 />
//               </div>
              
//               <div>
//                 <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
//                   Excel File
//                 </label>
//                 <input
//                   type="file"
//                   accept=".xlsx,.xls"
//                   onChange={(e) => setFile(e.target.files?.[0] || null)}
//                   className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
//                 />
//               </div>
              
//               <button
//                 type="submit"
//                 disabled={uploading}
//                 className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
//                 {uploading ? "Uploading..." : "Upload Sheet"}
//               </button>
//             </form>
            
//             {uploadResult && (
//               <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="h-4 w-4 text-emerald-600" />
//                   <div>
//                     <p className="text-sm font-semibold text-slate-900">
//                       Upload Complete: {uploadResult.successRows || 0} successful, {uploadResult.failedRows || 0} failed
//                     </p>
//                     <p className="text-xs text-slate-600">
//                       {selectedMonthLabel} {year}
//                     </p>
//                   </div>
//                 </div>
                
//                 {uploadResult.failedEmployees && uploadResult.failedEmployees.length > 0 && (
//                   <div className="mt-2">
//                     <p className="text-xs font-semibold text-red-600 mb-1">
//                       Failed Employees ({uploadResult.failedEmployees.length}):
//                     </p>
//                     <div className="max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">
//                       {uploadResult.failedEmployees.slice(0, 10).map((item, index) => (
//                         <p key={index} className="flex items-center gap-1">
//                           <AlertCircle className="h-3 w-3 flex-shrink-0" />
//                           <span className="font-medium">{item.employeeName || item.employee || 'Unknown'}</span>
//                           {item.employeeCode && item.employeeCode !== 'N/A' && (
//                             <span className="text-red-500">({item.employeeCode})</span>
//                           )}
//                           <span className="text-red-400">-</span>
//                           <span className="truncate">{item.reason || 'Unknown error'}</span>
//                         </p>
//                       ))}
//                       {uploadResult.failedEmployees.length > 10 && (
//                         <p className="mt-1 text-red-600 font-medium">
//                           +{uploadResult.failedEmployees.length - 10} more failed employees
//                           <button 
//                             onClick={() => {
//                               const failedData = uploadResult.failedEmployees.map(item => ({
//                                 employeeName: item.employeeName || item.employee || 'Unknown',
//                                 employeeCode: item.employeeCode || 'N/A',
//                                 reason: item.reason || 'Unknown error',
//                                 existsInSystem: false,
//                                 hasUserAccount: false
//                               }));
//                               setFailedEmployees(failedData);
//                               setSelectedBatch({
//                                 batchId: uploadResult.batch?._id || 'unknown',
//                                 month: month,
//                                 year: year,
//                                 fileName: uploadResult.batch?.fileName || 'Unknown',
//                                 totalFailed: failedData.length
//                               });
//                               setShowFailedModal(true);
//                             }}
//                             className="ml-2 text-blue-600 hover:underline"
//                           >
//                             View all
//                           </button>
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </section>
//         )}

//         {/* Main Content - My Salary Slips */}
//         {viewMode === "my-slips" && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">My Salary Slips</h2>
//                 <p className="text-xs text-slate-500">Send your salary slips to your registered email</p>
//               </div>
              
//               <div className="flex flex-wrap items-center gap-2">
//                 <div className="relative">
//                   <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-36 rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-40"
//                   />
//                 </div>
                
//                 <button
//                   onClick={() => setShowFilters(!showFilters)}
//                   className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
//                 >
//                   <Filter className="h-3.5 w-3.5" />
//                   Filters
//                   {(filterMonth !== "all" || filterYear !== "all") && (
//                     <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
//                       Active
//                     </span>
//                   )}
//                 </button>
                
//                 {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
//               </div>
//             </div>
            
//             {showFilters && (
//               <div className="border-b border-slate-100 bg-slate-50/50 p-3">
//                 <div className="flex flex-wrap items-end gap-3">
//                   <div>
//                     <label className="mb-0.5 block text-xs font-medium text-slate-600">Month</label>
//                     <select
//                       value={filterMonth}
//                       onChange={(e) => setFilterMonth(e.target.value)}
//                       className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
//                     >
//                       <option value="all">All months</option>
//                       {MONTHS.map((item) => (
//                         <option key={item.value} value={item.value}>{item.label}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="mb-0.5 block text-xs font-medium text-slate-600">Year</label>
//                     <select
//                       value={filterYear}
//                       onChange={(e) => setFilterYear(e.target.value)}
//                       className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
//                     >
//                       <option value="all">All years</option>
//                       {availableYears.map((item) => (
//                         <option key={item} value={item}>{item}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <button
//                     onClick={clearFilters}
//                     className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:text-slate-700"
//                   >
//                     <X className="h-3.5 w-3.5" />
//                     Clear all
//                   </button>
//                 </div>
//               </div>
//             )}
            
//             <div className="divide-y divide-slate-100">
//               {!loading && filteredSlips.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
//                   <div className="rounded-full bg-slate-100 p-3">
//                     <FileText className="h-6 w-6 text-slate-400" />
//                   </div>
//                   <p className="mt-3 text-sm font-medium text-slate-900">No salary slips found</p>
//                   <p className="text-xs text-slate-500">
//                     {searchTerm || filterMonth !== "all" || filterYear !== "all" 
//                       ? "Try adjusting your filters or search terms" 
//                       : "Your salary slips will appear here once processed"}
//                   </p>
//                 </div>
//               ) : (
//                 filteredSlips.map((slip) => (
//                   <div 
//                     key={slip._id} 
//                     className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//                         <Calendar className="h-4 w-4" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-slate-900">
//                           {slip.monthName} {slip.year}
//                         </p>
//                         <p className="text-xs text-slate-500">
//                           {slip.employeeName} • {slip.employeeCode}
//                         </p>
//                       </div>
//                     </div>
                    
//                    <div className="flex items-center gap-2">
//   <span className="mr-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
//     Available
//   </span>
  
//   {/* Send to Email - Visible to ALL users */}
//   <button
//     onClick={() => handleSendToEmail(slip)}
//     // disabled={sendingId === slip._id}
//     disabled={true}
//     className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
//   >
//     {sendingId === slip._id ? (
//       <Loader2 className="h-3.5 w-3.5 animate-spin" />
//     ) : (
//       <Mail className="h-3.5 w-3.5" />
//     )}
//     Send to Email
//   </button>
  
//   {/* Download - ONLY for HR/Accounts/SuperAdmin */}
//   {isHRorAccounts && (
//     <button
//       onClick={() => downloadMySlipPdf(slip)}
//       disabled={downloadingId === slip._id}
//       className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
//     >
//       {downloadingId === slip._id ? (
//         <Loader2 className="h-3.5 w-3.5 animate-spin" />
//       ) : (
//         <Download className="h-3.5 w-3.5" />
//       )}
//       Download
//     </button>
//   )}
// </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </section>
//         )}

//         {/* Employee Management View - HR/Accounts */}
//         {viewMode === "employee-management" && isHRorAccounts && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900">Employee Salary Status</h2>
//                 <p className="text-xs text-slate-500">View, download, and send salary slips to employees</p>
//               </div>
              
//               <div className="flex flex-wrap items-center gap-2">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                 >
//                   {MONTHS.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//                 <input
//                   type="number"
//                   value={selectedYear}
//                   onChange={(e) => setSelectedYear(Number(e.target.value))}
//                   className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                   min="2020"
//                   max="2100"
//                 />
//                 <button
//                   onClick={() => {
//                     fetchEmployeeSalaryStatus();
//                     fetchEmployeeSalarySlips();
//                   }}
//                   className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
//                 >
//                   <RefreshCw className="h-3.5 w-3.5" />
//                   Refresh
//                 </button>
//                 {/* Bulk Send Button */}
//                 <button
//                   onClick={handleSendBulkSalarySlips}
//                   disabled={sendingBulk || employeeList.length === 0}
//                   className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {sendingBulk ? (
//                     <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                   ) : (
//                     <Send className="h-3.5 w-3.5" />
//                   )}
//                   Send All
//                 </button>
//               </div>
//             </div>
            
//             <div className="border-b border-slate-100 p-4 bg-slate-50/50">
//               <div className="flex flex-wrap gap-3">
//                 <div className="relative flex-1 min-w-[200px]">
//                   <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search by name or code..."
//                     value={employeeSearchTerm}
//                     onChange={(e) => setEmployeeSearchTerm(e.target.value)}
//                     className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                   />
//                 </div>
//                 <select
//                   value={employeeFilterStatus}
//                   onChange={(e) => setEmployeeFilterStatus(e.target.value)}
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="uploaded">Uploaded</option>
//                   <option value="pending">Pending</option>
//                 </select>
//               </div>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Status</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {loading ? (
//                     <tr>
//                       <td colSpan="5" className="px-4 py-4 text-center">
//                         <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
//                       </td>
//                     </tr>
//                   ) : filteredEmployees.length === 0 ? (
//                     <tr>
//                       <td colSpan="5" className="px-4 py-4 text-center text-gray-500 text-sm">
//                         No employees found
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredEmployees.map((emp) => {
//                       let salaryRecord = salaryRecordsMap.get(emp.employeeCode) || 
//                                         salaryRecordsMap.get(emp.employeeId);
                      
//                       return (
//                         <tr key={emp.employeeId || emp._id} className="hover:bg-gray-50 transition">
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
//                             {emp.email && <div className="text-xs text-gray-400">{emp.email}</div>}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.employeeCode || 'N/A'}</td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.department || 'N/A'}</td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                               emp.hasSalarySlip || salaryRecord
//                                 ? 'bg-green-100 text-green-800' 
//                                 : 'bg-yellow-100 text-yellow-800'
//                             }`}>
//                               {emp.hasSalarySlip || salaryRecord ? '✅ Uploaded' : '⏳ Pending'}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm">
//                             {(emp.hasSalarySlip || salaryRecord) && (salaryRecord || emp.salaryRecordId) ? (
//                               <div className="flex items-center gap-2">
//                                 {/* Send Email Button */}
//                                 <button
//                                   onClick={() => handleSendEmployeeSlip(
//                                     salaryRecord?._id || emp.salaryRecordId, 
//                                     emp.employeeName
//                                   )}
//                                   disabled={sendingId === (salaryRecord?._id || emp.salaryRecordId)}
//                                   className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
//                                 >
//                                   {sendingId === (salaryRecord?._id || emp.salaryRecordId) ? (
//                                     <Loader2 className="h-3 w-3 animate-spin mr-1" />
//                                   ) : (
//                                     <Mail className="h-3 w-3 mr-1" />
//                                   )}
//                                   Send Email
//                                 </button>
//                                 {/* Download Button - HR/Accounts only */}
//                                 <button
//                                   onClick={() => downloadEmployeeSlipPdf(
//                                     salaryRecord?._id || emp.salaryRecordId, 
//                                     emp.employeeName
//                                   )}
//                                   disabled={downloadingId === (salaryRecord?._id || emp.salaryRecordId)}
//                                   className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
//                                 >
//                                   {downloadingId === (salaryRecord?._id || emp.salaryRecordId) ? (
//                                     <Loader2 className="h-3 w-3 animate-spin mr-1" />
//                                   ) : (
//                                     <Download className="h-3 w-3 mr-1" />
//                                   )}
//                                   Download
//                                 </button>
//                               </div>
//                             ) : (
//                               <span className="text-xs text-gray-400">
//                                 {!emp.hasUserAccount ? 'No account' : 'Not uploaded'}
//                               </span>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         )}

//         {/* Recent Uploads */}
//         {canUpload && batches.length > 0 && (
//           <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
//             <div className="border-b border-slate-100 px-4 py-3">
//               <div className="flex items-center gap-3">
//                 <div className="rounded-lg bg-purple-50 p-2">
//                   <Clock className="h-4 w-4 text-purple-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-base font-semibold text-slate-900">Recent Upload History</h2>
//                   <p className="text-xs text-slate-500">Track your salary sheet uploads</p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-left text-sm">
//                 <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
//                   <tr>
//                     <th className="px-4 py-2.5 font-medium">Month</th>
//                     <th className="px-4 py-2.5 font-medium">File Name</th>
//                     <th className="px-4 py-2.5 font-medium">Success Rate</th>
//                     <th className="px-4 py-2.5 font-medium">Status</th>
//                     <th className="px-4 py-2.5 font-medium">Failed</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {batches.map((batch) => {
//                     const successRate = batch.totalRows > 0 
//                       ? Math.round((batch.successRows / batch.totalRows) * 100)
//                       : 0;
//                     const failedCount = batch.failedCount || (batch.totalRows - batch.successRows);
//                     return (
//                       <tr key={batch._id} className="transition hover:bg-slate-50/50">
//                         <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
//                           {MONTHS.find((item) => item.value === batch.month)?.label || batch.month} {batch.year}
//                         </td>
//                         <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-600">
//                           {batch.fileName}
//                         </td>
//                         <td className="px-4 py-2.5">
//                           <div className="flex items-center gap-2">
//                             <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
//                               <div 
//                                 className="h-full rounded-full bg-emerald-500 transition-all"
//                                 style={{ width: `${successRate}%` }}
//                               />
//                             </div>
//                             <span className="text-[10px] font-medium text-slate-600">
//                               {batch.successRows}/{batch.totalRows}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-4 py-2.5">
//                           <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
//                             ${batch.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
//                               batch.status === 'processing' ? 'bg-amber-50 text-amber-700' : 
//                               'bg-red-50 text-red-700'}`}
//                           >
//                             {batch.status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
//                             {batch.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
//                             {batch.status === 'failed' && <AlertCircle className="h-2.5 w-2.5" />}
//                             {batch.status}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2.5">
//                           {failedCount > 0 ? (
//                             <button
//                               onClick={() => fetchFailedEmployees(batch._id)}
//                               className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline inline-flex items-center gap-1"
//                             >
//                               <AlertCircle className="h-3 w-3" />
//                               {failedCount} failed
//                             </button>
//                           ) : (
//                             <span className="text-emerald-600 text-xs">None</span>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         )}
//       </div>

//       {/* ===== Failed Employees Modal ===== */}
//       {showFailedModal && selectedBatch && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-4 border-b border-slate-200">
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900">Failed Employees</h3>
//                 <p className="text-sm text-slate-500">
//                   {selectedBatch.monthName || MONTHS.find(m => m.value === selectedBatch.month)?.label || selectedBatch.month} {selectedBatch.year} - {selectedBatch.fileName}
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowFailedModal(false)}
//                 className="text-slate-400 hover:text-slate-600"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>
            
//             {/* Modal Body */}
//             <div className="flex-1 overflow-y-auto p-4">
//               {/* Summary Stats */}
//               <div className="grid grid-cols-4 gap-3 mb-4">
//                 <div className="bg-red-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{failedEmployees.length}</p>
//                   <p className="text-xs text-red-600">Total Failed</p>
//                 </div>
//                 <div className="bg-yellow-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-yellow-600">
//                     {failedEmployees.filter(e => e.existsInSystem).length}
//                   </p>
//                   <p className="text-xs text-yellow-600">Exists in System</p>
//                 </div>
//                 <div className="bg-orange-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-orange-600">
//                     {failedEmployees.filter(e => e.existsInSystem && !e.hasUserAccount).length}
//                   </p>
//                   <p className="text-xs text-orange-600">No User Account</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-gray-600">
//                     {failedEmployees.filter(e => !e.existsInSystem).length}
//                   </p>
//                   <p className="text-xs text-gray-600">Not in System</p>
//                 </div>
//               </div>
              
//               {/* Failed Employees Table */}
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {loadingFailed ? (
//                       <tr>
//                         <td colSpan="5" className="px-3 py-4 text-center">
//                           <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
//                         </td>
//                       </tr>
//                     ) : failedEmployees.length === 0 ? (
//                       <tr>
//                         <td colSpan="5" className="px-3 py-4 text-center text-gray-500 text-sm">
//                           No failed employees found
//                         </td>
//                       </tr>
//                     ) : (
//                       failedEmployees.map((emp, index) => (
//                         <tr key={index} className="hover:bg-gray-50">
//                           <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
//                           <td className="px-3 py-2 text-sm font-medium text-gray-900">{emp.employeeName}</td>
//                           <td className="px-3 py-2 text-sm text-gray-500">{emp.employeeCode}</td>
//                           <td className="px-3 py-2 text-sm text-red-600">{emp.reason}</td>
//                           <td className="px-3 py-2">
//                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                               emp.existsInSystem 
//                                 ? emp.hasUserAccount 
//                                   ? 'bg-green-100 text-green-800' 
//                                   : 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-red-100 text-red-800'
//                             }`}>
//                               {emp.existsInSystem 
//                                 ? emp.hasUserAccount 
//                                   ? '✅ Has Account' 
//                                   : '⚠️ No Account'
//                                 : '❌ Not Found'}
//                             </span>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
            
//             {/* Modal Footer */}
//             <div className="flex items-center justify-between p-4 border-t border-slate-200">
//               <div className="text-sm text-slate-500">
//                 Total: {failedEmployees.length} failed employees
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => downloadFailedEmployees(selectedBatch.batchId)}
//                   disabled={downloadingFailed}
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
//                 >
//                   {downloadingFailed ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Download className="h-4 w-4" />
//                   )}
//                   Download CSV
//                 </button>
//                 <button
//                   onClick={() => setShowFailedModal(false)}
//                   className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// };

// export default SalarySlips;



















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
  Clock,
  UserCog,
  Eye,
  UserCheck,
  RefreshCw,
  XCircle,
  Mail,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
  EyeOff,
  DollarSign,
  CreditCard,
  User,
  Briefcase,
  Building,
  Calendar as CalendarIcon,
  Hash,
  File,
  ArrowLeft
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

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('en-IN');
};

// Helper function to check if value exists and is not N/A
const hasValue = (value) => {
  return value && value !== 'N/A' && value !== '';
};

// Salary Slip View Component
const SalarySlipView = ({ slip, onBack }) => {
  // Get salary data from the record
  const salaryData = slip.salaryData || {};
  
  // Extract all fields with fallbacks
  const employeeName = slip.employeeName || 'N/A';
  const employeeCode = slip.employeeCode || 'N/A';
  const department = slip.department || 'N/A';
  const designation = slip.designation || 'N/A';
  const monthName = slip.monthName || MONTHS[slip.month - 1]?.label || 'N/A';
  const year = slip.year || 'N/A';
  
  // Bank & Personal Details
  const bankAccountNo = salaryData.bankAccountNo || slip.bankAccountNo || 'N/A';
  const panNo = salaryData.panNo || slip.panNo || 'N/A';
  const uanNo = salaryData.uanNo || slip.uanNo || 'N/A';
  const aadhaarNo = salaryData.aadhaarNo || slip.aadhaarNo || 'N/A';
  
  // Earnings
  const basicSalary = salaryData.basicSalary || slip.basicSalary || 0;
  const hra = salaryData.hra || slip.hra || 0;
  const media = salaryData.media || slip.media || 0;
  const conveyance = salaryData.conv || salaryData.conveyance || slip.conv || slip.conveyance || 0;
  const salaryPayable = salaryData.salaryPayable || slip.salaryPayable || 0;
  const otIncentive = salaryData.otIncentive || slip.otIncentive || 0;
  const extraConveyance = salaryData.extraConveyance || slip.extraConveyance || 0;
  const arrears = salaryData.arrears || slip.arrears || 0;
  const totalEarnings = salaryData.totalEarnings || slip.totalEarnings || 0;
  
  // Deductions
  const advance = salaryData.advance || slip.advance || 0;
  const ulNcnsDeduction = salaryData.ulNcnsDeduction || slip.ulNcnsDeduction || 0;
  const epfDeduction = salaryData.epfDeduction || slip.epfDeduction || 0;
  const esic = salaryData.esic || slip.esic || 0;
  const tds = salaryData.tds || slip.tds || 0;
  const totalDeduction = salaryData.totalDeduction || slip.totalDeduction || 0;
  
  // Others
  const daysPayable = salaryData.daysPayable || slip.daysPayable || 0;
  const grossSalary = salaryData.grossSalary || slip.grossSalary || 0;
  const netPay = salaryData.netPay || slip.netPay || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-t-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-blue-600" />
            </button>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Salary Slip</h3>
              <p className="text-sm text-slate-600">{monthName} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 print:p-4" id="salary-slip-content">
          {/* Company Header */}
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-xl font-bold text-slate-800">Suncity Success Tower</h2>
            <p className="text-sm text-slate-600">118-119-120 Suncity Success Tower, Sector-65, Gurgaon 122101</p>
          </div>

          {/* Employee Details Section */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500">Employee Name</p>
              <p className="text-sm font-semibold text-slate-900">{employeeName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Employee ID</p>
              <p className="text-sm font-semibold text-slate-900">{employeeCode}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Department</p>
              <p className="text-sm font-semibold text-slate-900">{department}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Designation</p>
              <p className="text-sm font-semibold text-slate-900">{designation}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">UAN No.</p>
              <p className="text-sm font-semibold text-slate-900">{uanNo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Bank Account No.</p>
              <p className="text-sm font-semibold text-slate-900">{bankAccountNo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PAN No.</p>
              <p className="text-sm font-semibold text-slate-900">{panNo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Aadhaar No.</p>
              <p className="text-sm font-semibold text-slate-900">{aadhaarNo}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-medium text-slate-500">Days Payable</p>
              <p className="text-sm font-semibold text-slate-900">{daysPayable}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-medium text-slate-500">Gross Salary</p>
              <p className="text-sm font-semibold text-slate-900">₹{formatCurrency(grossSalary)}</p>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Earnings */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">Earnings</h4>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Particulars</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Basic Salary</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(basicSalary)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">HRA</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(hra)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Media</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(media)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Conveyance</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(conveyance)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Salary Payable</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(salaryPayable)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">OT Incentive</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(otIncentive)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Extra Conveyance</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(extraConveyance)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Arrears</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(arrears)}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-4 py-2 text-slate-800">Total Earnings</td>
                    <td className="px-4 py-2 text-right text-blue-700">₹{formatCurrency(totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">Deductions</h4>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Particulars</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2 text-slate-700">Advance</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(advance)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">UL/NCNS Deduction</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(ulNcnsDeduction)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">EPF Deduction</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(epfDeduction)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">ESIC</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(esic)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-700">T.D.S.</td>
                    <td className="px-4 py-2 text-right font-medium">₹{formatCurrency(tds)}</td>
                  </tr>
                  <tr className="bg-red-50 font-semibold">
                    <td className="px-4 py-2 text-slate-800">Total Deduction</td>
                    <td className="px-4 py-2 text-right text-red-700">₹{formatCurrency(totalDeduction)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Pay Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">Net Pay</p>
                <p className="text-sm text-emerald-600">After all deductions</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold text-emerald-700">₹{formatCurrency(netPay)}</p>
              <p className="text-xs text-emerald-600">
                Total Earnings: ₹{formatCurrency(totalEarnings)} - Total Deduction: ₹{formatCurrency(totalDeduction)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>This is a system generated salary slip for {monthName} {year}</p>
            <p className="mt-1">Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalarySlips = () => {
  const { user } = useSelector((state) => state.auth);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [slips, setSlips] = useState([]);
  const [batches, setBatches] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSlip, setExpandedSlip] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null); // For detailed view
  
  // New state for HR/Accounts features
  const [viewMode, setViewMode] = useState("my-slips");
  const [employees, setEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({ total: 0, uploaded: 0, pending: 0, noAccount: 0 });
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [sendingBulk, setSendingBulk] = useState(false);

  // ===== Failed Employees Modal States =====
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedEmployees, setFailedEmployees] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [downloadingFailed, setDownloadingFailed] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const canUpload = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);
  const isHRorAccounts = isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);

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

  // Create employee list from salary records if employees state is empty
  const employeeList = useMemo(() => {
    if (employees.length > 0) {
      return employees;
    }
    
    const employeeMap = new Map();
    salaryRecords.forEach(record => {
      const key = record.employeeCode || record._id;
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employeeId: record.employee?._id || record._id,
          employeeCode: record.employeeCode || 'N/A',
          employeeName: record.employee?.username || record.employee?.realName || 'Unknown',
          department: record.department || record.employee?.department || 'N/A',
          designation: record.designation || 'N/A',
          hasSalarySlip: true,
          hasUserAccount: true,
          status: 'Uploaded',
          salaryRecordId: record._id,
          email: record.employee?.email || null,
          salaryData: record.salaryData || record
        });
      }
    });
    return Array.from(employeeMap.values());
  }, [employees, salaryRecords]);

  const filteredEmployees = useMemo(() => {
    return employeeList.filter(emp => {
      const matchesSearch = emp.employeeName?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                           emp.employeeCode?.toLowerCase().includes(employeeSearchTerm.toLowerCase());
      const matchesStatus = employeeFilterStatus === "all" || 
                           (employeeFilterStatus === "uploaded" && emp.hasSalarySlip) ||
                           (employeeFilterStatus === "pending" && !emp.hasSalarySlip);
      return matchesSearch && matchesStatus;
    });
  }, [employeeList, employeeSearchTerm, employeeFilterStatus]);

  const salaryRecordsMap = useMemo(() => {
    const map = new Map();
    salaryRecords.forEach(record => {
      if (record.employeeCode) {
        map.set(record.employeeCode, record);
      }
      if (record.employee?.employeeCode) {
        map.set(record.employee.employeeCode, record);
      }
      if (record.employee?._id) {
        map.set(record.employee._id, record);
      }
      if (record._id) {
        map.set(record._id, record);
      }
    });
    return map;
  }, [salaryRecords]);

  // ===== Fetch Failed Employees =====
  const fetchFailedEmployees = async (batchId) => {
    setLoadingFailed(true);
    try {
      if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
        const failedData = uploadResult.failedEmployees.map(item => ({
          employeeName: item.employeeName || item.employee || 'Unknown',
          employeeCode: item.employeeCode || 'N/A',
          reason: item.reason || 'Unknown error',
          existsInSystem: false,
          hasUserAccount: false
        }));
        setFailedEmployees(failedData);
        setSelectedBatch({
          batchId: batchId,
          month: month,
          year: year,
          fileName: uploadResult.batch?.fileName || 'Unknown',
          totalFailed: failedData.length
        });
        setShowFailedModal(true);
        setLoadingFailed(false);
        return;
      }

      const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees`);
      const data = response.data?.data;
      
      if (data && data.failedEmployees && data.failedEmployees.length > 0) {
        setFailedEmployees(data.failedEmployees);
        setSelectedBatch(data);
      } else {
        setFailedEmployees([]);
        setSelectedBatch(data || {});
      }
      setShowFailedModal(true);
    } catch (error) {
      console.error('Failed to fetch failed employees:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch failed employees');
    } finally {
      setLoadingFailed(false);
    }
  };

  // ===== Download Failed Employees CSV =====
  const downloadFailedEmployees = async (batchId) => {
    setDownloadingFailed(true);
    try {
      if (uploadResult?.failedEmployees && uploadResult.failedEmployees.length > 0) {
        let csv = 'Sl. No.,Employee Name,Employee Code,Reason\n';
        uploadResult.failedEmployees.forEach((item, index) => {
          csv += `${index + 1},${item.employeeName || item.employee || 'Unknown'},${item.employeeCode || 'N/A'},${item.reason || 'Unknown error'}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `failed-employees-${month}-${year}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Failed employees list downloaded successfully');
        setDownloadingFailed(false);
        return;
      }

      const response = await salaryApi.get(`/api/payroll/batch/${batchId}/failed-employees/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `failed-employees-${selectedMonth}-${selectedYear}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Failed employees list downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download failed employees list');
    } finally {
      setDownloadingFailed(false);
    }
  };

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

  const fetchEmployeeSalaryStatus = async () => {
    if (!isHRorAccounts) return;
    try {
      setLoading(true);
      const response = await salaryApi.get("/api/payroll/employee-salary-status", {
        params: { month: selectedMonth, year: selectedYear }
      });
      const data = response.data?.data || {};
      setEmployees(data.employees || []);
      setEmployeeStats({
        total: data.total || 0,
        uploaded: data.uploaded || 0,
        pending: data.pending || 0,
        noAccount: data.noAccount || 0
      });
    } catch (error) {
      console.error("Failed to fetch employee status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeSalarySlips = async () => {
    if (!isHRorAccounts) return;
    try {
      const response = await salaryApi.get("/api/payroll/employee-slips", {
        params: { month: selectedMonth, year: selectedYear }
      });
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      setSalaryRecords(records);
      
      if (employees.length === 0 && records.length > 0) {
        setEmployeeStats({
          total: records.length,
          uploaded: records.length,
          pending: 0,
          noAccount: 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch salary slips:", error);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [canUpload]);

  useEffect(() => {
    if (viewMode === "employee-management" && isHRorAccounts) {
      fetchEmployeeSalaryStatus();
      fetchEmployeeSalarySlips();
    }
  }, [selectedMonth, selectedYear, viewMode]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("month", month);
    formData.append("year", year);
    formData.append("excelFile", file);

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
      if (viewMode === "employee-management") {
        await fetchEmployeeSalaryStatus();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Salary sheet upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ===== DOWNLOAD MY SALARY SLIP PDF =====
  const downloadMySlipPdf = async (slip) => {
    if (!isHRorAccounts) {
      toast.error("You are not authorized to download salary slips");
      return;
    }

    setDownloadingId(slip._id);
    let loadingToast = null;
    
    try {
      loadingToast = toast.loading('Downloading salary slip...');
      
      const response = await salaryApi.get(`/api/payroll/my-slips/${slip._id}/download-pdf`, {
        responseType: 'blob',
        timeout: 30000
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download salary slip');
        } catch {
          throw new Error('Invalid response format. Please try again.');
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = (slip.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Salary_Slip_${sanitizedName}_${slip.monthName}_${slip.year}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (loadingToast) toast.dismiss(loadingToast);
      toast.success('Salary slip downloaded successfully');
      
    } catch (error) {
      console.error('Download my salary PDF error:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      
      let errorMessage = "Failed to download salary slip. Please try again.";
      if (error.response?.status === 403) {
        errorMessage = "You are not authorized to download this salary slip.";
      } else if (error.response?.status === 404) {
        errorMessage = "Salary slip not found.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setDownloadingId("");
    }
  };

  // ===== DOWNLOAD EMPLOYEE SALARY SLIP PDF =====
  const downloadEmployeeSlipPdf = async (recordId, employeeName) => {
    if (!isHRorAccounts) {
      toast.error("You are not authorized to download salary slips");
      return;
    }

    if (!recordId) {
      toast.error("Invalid salary record ID");
      return;
    }

    setDownloadingId(recordId);
    let loadingToast = null;
    
    try {
      loadingToast = toast.loading(`Downloading salary slip for ${employeeName || 'Employee'}...`);
      
      const response = await salaryApi.get(`/api/payroll/employee-slips/${recordId}/download-pdf`, {
        responseType: 'blob',
        timeout: 30000
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download salary slip');
        } catch {
          throw new Error('Invalid response format. Please try again.');
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth;
      const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Salary_Slip_${sanitizedName}_${monthLabel}_${selectedYear}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (loadingToast) toast.dismiss(loadingToast);
      toast.success(`Salary slip downloaded successfully for ${employeeName}`);
      
    } catch (error) {
      console.error('Download employee salary PDF error:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      
      let errorMessage = "Failed to download salary slip. Please try again.";
      if (error.response?.status === 403) {
        errorMessage = "You are not authorized to download this salary slip.";
      } else if (error.response?.status === 404) {
        errorMessage = "Salary slip not found.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setDownloadingId("");
    }
  };

  // ===== SEND MY SALARY SLIP TO EMAIL =====
  const handleSendToEmail = async (slip) => {
    setSendingId(slip._id);
    try {
      const response = await salaryApi.post(`/api/payroll/my-slips/${slip._id}/send`);
      
      if (response.data.success) {
        toast.success(`Salary slip sent to ${response.data.data?.sentTo || 'your email'}`);
      } else {
        toast.error(response.data.message || 'Failed to send salary slip');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(error.response?.data?.message || "Unable to send salary slip to email");
    } finally {
      setSendingId("");
    }
  };

  // ===== SEND EMPLOYEE SALARY SLIP TO EMAIL =====
  const handleSendEmployeeSlip = async (recordId, employeeName) => {
    setSendingId(recordId);
    try {
      const response = await salaryApi.post(`/api/payroll/employee-slips/${recordId}/send`);
      
      if (response.data.success) {
        toast.success(`Salary slip sent to ${response.data.data?.sentTo || employeeName}`);
      } else {
        toast.error(response.data.message || 'Failed to send salary slip');
      }
    } catch (error) {
      console.error('Send employee salary error:', error);
      toast.error(error.response?.data?.message || "Unable to send salary slip to employee email");
    } finally {
      setSendingId("");
    }
  };

  // ===== SEND BULK SALARY SLIPS =====
  const handleSendBulkSalarySlips = async () => {
    if (!window.confirm(`Send salary slips for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} to all employees?`)) {
      return;
    }

    setSendingBulk(true);
    try {
      const response = await salaryApi.post("/api/payroll/bulk-send", {
        month: selectedMonth,
        year: selectedYear
      });

      if (response.data.success) {
        const data = response.data.data;
        toast.success(`Bulk salary slips sent: ${data.successCount} successful, ${data.failedCount} failed`);
        
        if (data.failedList && data.failedList.length > 0) {
          const failedNames = data.failedList.map(item => item.employeeName).join(', ');
          toast.error(`Failed to send to: ${failedNames}`);
        }
      } else {
        toast.error(response.data.message || 'Failed to send bulk salary slips');
      }
    } catch (error) {
      console.error('Bulk send error:', error);
      toast.error(error.response?.data?.message || "Unable to send bulk salary slips");
    } finally {
      setSendingBulk(false);
    }
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setSearchTerm("");
    setShowFilters(false);
  };

  // Toggle expanded slip details
  const toggleSlipDetails = (slipId) => {
    setExpandedSlip(expandedSlip === slipId ? null : slipId);
  };

  // View full salary slip
  const viewSalarySlip = (slip) => {
    setSelectedSlip(slip);
  };

  // Close salary slip view
  const closeSalarySlipView = () => {
    setSelectedSlip(null);
  };

  // If a slip is selected for detailed view, render the SalarySlipView
  if (selectedSlip) {
    return <SalarySlipView slip={selectedSlip} onBack={closeSalarySlipView} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 ml-5">
      <div className="w-full space-y-5">
        {/* Header Section */}
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
              {isHRorAccounts && (
                <div className="flex rounded-lg bg-white/20 p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode("my-slips")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      viewMode === "my-slips" 
                        ? "bg-white text-blue-700" 
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <UserCheck className="inline h-3.5 w-3.5 mr-1" />
                    My Slips
                  </button>
                  <button
                    onClick={() => setViewMode("employee-management")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      viewMode === "employee-management" 
                        ? "bg-white text-blue-700" 
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Users className="inline h-3.5 w-3.5 mr-1" />
                    All Employees
                  </button>
                </div>
              )}
              <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">
                  {viewMode === "my-slips" 
                    ? `${slips.length} ${slips.length === 1 ? "Slip" : "Slips"} Available`
                    : `${employeeList.length} Employees`}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {viewMode === "my-slips" ? (
            <>
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
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Employees</p>
                    <p className="text-xl font-bold text-slate-900">{employeeList.length}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2.5">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Salary Uploaded</p>
                    <p className="text-xl font-bold text-emerald-600">{employeeStats.uploaded}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Pending Upload</p>
                    <p className="text-xl font-bold text-yellow-600">{employeeStats.pending}</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-2.5">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">No Account</p>
                    <p className="text-xl font-bold text-red-600">{employeeStats.noAccount}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2.5">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload Section */}
        {canUpload && viewMode === "my-slips" && (
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
                
                {uploadResult.failedEmployees && uploadResult.failedEmployees.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-600 mb-1">
                      Failed Employees ({uploadResult.failedEmployees.length}):
                    </p>
                    <div className="max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">
                      {uploadResult.failedEmployees.slice(0, 10).map((item, index) => (
                        <p key={index} className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">{item.employeeName || item.employee || 'Unknown'}</span>
                          {item.employeeCode && item.employeeCode !== 'N/A' && (
                            <span className="text-red-500">({item.employeeCode})</span>
                          )}
                          <span className="text-red-400">-</span>
                          <span className="truncate">{item.reason || 'Unknown error'}</span>
                        </p>
                      ))}
                      {uploadResult.failedEmployees.length > 10 && (
                        <p className="mt-1 text-red-600 font-medium">
                          +{uploadResult.failedEmployees.length - 10} more failed employees
                          <button 
                            onClick={() => {
                              const failedData = uploadResult.failedEmployees.map(item => ({
                                employeeName: item.employeeName || item.employee || 'Unknown',
                                employeeCode: item.employeeCode || 'N/A',
                                reason: item.reason || 'Unknown error',
                                existsInSystem: false,
                                hasUserAccount: false
                              }));
                              setFailedEmployees(failedData);
                              setSelectedBatch({
                                batchId: uploadResult.batch?._id || 'unknown',
                                month: month,
                                year: year,
                                fileName: uploadResult.batch?.fileName || 'Unknown',
                                totalFailed: failedData.length
                              });
                              setShowFailedModal(true);
                            }}
                            className="ml-2 text-blue-600 hover:underline"
                          >
                            View all
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Main Content - My Salary Slips */}
        {viewMode === "my-slips" && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">My Salary Slips</h2>
                <p className="text-xs text-slate-500">View, download, and manage your salary slips</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
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
                filteredSlips.map((slip) => {
                  // Get bank details from the slip
                  const salaryData = slip.salaryData || {};
                  const bankAccountNo = salaryData.bankAccountNo || slip.bankAccountNo || 'N/A';
                  const panNo = salaryData.panNo || slip.panNo || 'N/A';
                  const uanNo = salaryData.uanNo || slip.uanNo || 'N/A';
                  const aadhaarNo = salaryData.aadhaarNo || slip.aadhaarNo || 'N/A';
                  const netPay = salaryData.netPay || slip.netPay || 0;
                  
                  return (
                    <div key={slip._id} className="px-4 py-3 transition hover:bg-slate-50/50">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => viewSalarySlip(slip)}
                        >
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
                            {netPay > 0 && (
                              <p className="text-xs font-medium text-emerald-600">
                                Net Pay: ₹{formatCurrency(netPay)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="mr-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            Available
                          </span>
                          
                         
                          
                          {/* Send to Email - Disabled for now */}
                          <button
                            onClick={() => handleSendToEmail(slip)}
                            disabled={true}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {sendingId === slip._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            Send to Email
                          </button>
                          
                          {/* Download - ONLY for HR/Accounts/SuperAdmin */}
                          {isHRorAccounts && (
                            <button
                              onClick={() => downloadMySlipPdf(slip)}
                              disabled={downloadingId === slip._id}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {downloadingId === slip._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              Download
                            </button>
                          )}
                          
                          {/* Expand/Collapse button for quick details */}
                          <button
                            onClick={() => toggleSlipDetails(slip._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          >
                            {expandedSlip === slip._id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Details - Bank/PAN/UAN/Aadhaar */}
                      {expandedSlip === slip._id && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-4 border border-slate-200">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs font-medium text-slate-500">Bank Account No</p>
                              <p className="text-sm font-semibold text-slate-900">{bankAccountNo}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">PAN No</p>
                              <p className="text-sm font-semibold text-slate-900">{panNo}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">UAN No</p>
                              <p className="text-sm font-semibold text-slate-900">{uanNo}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Aadhaar No</p>
                              <p className="text-sm font-semibold text-slate-900">{aadhaarNo}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Days Payable</p>
                              <p className="text-sm font-semibold text-slate-900">{salaryData.daysPayable || slip.daysPayable || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Gross Salary</p>
                              <p className="text-sm font-semibold text-slate-900">₹{formatCurrency(salaryData.grossSalary || slip.grossSalary || 0)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Total Earnings</p>
                              <p className="text-sm font-semibold text-emerald-600">₹{formatCurrency(salaryData.totalEarnings || slip.totalEarnings || 0)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500">Total Deductions</p>
                              <p className="text-sm font-semibold text-red-600">₹{formatCurrency(salaryData.totalDeduction || slip.totalDeduction || 0)}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-slate-700">Net Pay</p>
                              <p className="text-lg font-bold text-emerald-700">₹{formatCurrency(netPay)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Employee Management View - HR/Accounts */}
        {viewMode === "employee-management" && isHRorAccounts && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Employee Salary Status</h2>
                <p className="text-xs text-slate-500">View, download, and send salary slips to employees</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                >
                  {MONTHS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  min="2020"
                  max="2100"
                />
                <button
                  onClick={() => {
                    fetchEmployeeSalaryStatus();
                    fetchEmployeeSalarySlips();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
                <button
                  onClick={handleSendBulkSalarySlips}
                  disabled={sendingBulk || employeeList.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingBulk ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send All
                </button>
              </div>
            </div>
            
            <div className="border-b border-slate-100 p-4 bg-slate-50/50">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <select
                  value={employeeFilterStatus}
                  onChange={(e) => setEmployeeFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Status</th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 text-center text-gray-500 text-sm">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      let salaryRecord = salaryRecordsMap.get(emp.employeeCode) || 
                                        salaryRecordsMap.get(emp.employeeId);
                      
                      // Get bank details from salary record
                      const salaryData = salaryRecord?.salaryData || salaryRecord || {};
                      const bankAccountNo = salaryData.bankAccountNo || salaryRecord?.bankAccountNo || 'N/A';
                      const panNo = salaryData.panNo || salaryRecord?.panNo || 'N/A';
                      const uanNo = salaryData.uanNo || salaryRecord?.uanNo || 'N/A';
                      const aadhaarNo = salaryData.aadhaarNo || salaryRecord?.aadhaarNo || 'N/A';
                      
                      return (
                        <tr key={emp.employeeId || emp._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
                            {emp.email && <div className="text-xs text-gray-400">{emp.email}</div>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.employeeCode || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.department || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              emp.hasSalarySlip || salaryRecord
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {emp.hasSalarySlip || salaryRecord ? '✅ Uploaded' : '⏳ Pending'}
                            </span>
                          </td>
                          {/* <td className="px-4 py-3">
                            {(emp.hasSalarySlip || salaryRecord) ? (
                              <div className="text-xs space-y-0.5">
                                <p className="text-gray-600"><span className="font-medium">Bank:</span> {bankAccountNo}</p>
                                <p className="text-gray-600"><span className="font-medium">PAN:</span> {panNo}</p>
                                <p className="text-gray-600"><span className="font-medium">UAN:</span> {uanNo}</p>
                                <p className="text-gray-600"><span className="font-medium">Aadhaar:</span> {aadhaarNo}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No data</span>
                            )}
                          </td> */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {(emp.hasSalarySlip || salaryRecord) && (salaryRecord || emp.salaryRecordId) ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => handleSendEmployeeSlip(
                                    salaryRecord?._id || emp.salaryRecordId, 
                                    emp.employeeName
                                  )}
                                  disabled={sendingId === (salaryRecord?._id || emp.salaryRecordId)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                                >
                                  {sendingId === (salaryRecord?._id || emp.salaryRecordId) ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Mail className="h-3 w-3 mr-1" />
                                  )}
                                  Send
                                </button>
                                <button
                                  onClick={() => downloadEmployeeSlipPdf(
                                    salaryRecord?._id || emp.salaryRecordId, 
                                    emp.employeeName
                                  )}
                                  disabled={downloadingId === (salaryRecord?._id || emp.salaryRecordId)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                                >
                                  {downloadingId === (salaryRecord?._id || emp.salaryRecordId) ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                  )}
                                  Download
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {!emp.hasUserAccount ? 'No account' : 'Not uploaded'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent Uploads */}
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
                    <th className="px-4 py-2.5 font-medium">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const successRate = batch.totalRows > 0 
                      ? Math.round((batch.successRows / batch.totalRows) * 100)
                      : 0;
                    const failedCount = batch.failedCount || (batch.totalRows - batch.successRows);
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
                        <td className="px-4 py-2.5">
                          {failedCount > 0 ? (
                            <button
                              onClick={() => fetchFailedEmployees(batch._id)}
                              className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline inline-flex items-center gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              {failedCount} failed
                            </button>
                          ) : (
                            <span className="text-emerald-600 text-xs">None</span>
                          )}
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

      {showFailedModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Failed Employees</h3>
                <p className="text-sm text-slate-500">
                  {selectedBatch.monthName || MONTHS.find(m => m.value === selectedBatch.month)?.label || selectedBatch.month} {selectedBatch.year} - {selectedBatch.fileName}
                </p>
              </div>
              <button
                onClick={() => setShowFailedModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{failedEmployees.length}</p>
                  <p className="text-xs text-red-600">Total Failed</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {failedEmployees.filter(e => e.existsInSystem).length}
                  </p>
                  <p className="text-xs text-yellow-600">Exists in System</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {failedEmployees.filter(e => e.existsInSystem && !e.hasUserAccount).length}
                  </p>
                  <p className="text-xs text-orange-600">No User Account</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">
                    {failedEmployees.filter(e => !e.existsInSystem).length}
                  </p>
                  <p className="text-xs text-gray-600">Not in System</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingFailed ? (
                      <tr>
                        <td colSpan="5" className="px-3 py-4 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
                        </td>
                      </tr>
                    ) : failedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-3 py-4 text-center text-gray-500 text-sm">
                          No failed employees found
                        </td>
                      </tr>
                    ) : (
                      failedEmployees.map((emp, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{emp.employeeName}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{emp.employeeCode}</td>
                          <td className="px-3 py-2 text-sm text-red-600">{emp.reason}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              emp.existsInSystem 
                                ? emp.hasUserAccount 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {emp.existsInSystem 
                                ? emp.hasUserAccount 
                                  ? '✅ Has Account' 
                                  : '⚠️ No Account'
                                : '❌ Not Found'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Total: {failedEmployees.length} failed employees
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFailedEmployees(selectedBatch.batchId)}
                  disabled={downloadingFailed}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {downloadingFailed ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download CSV
                </button>
                <button
                  onClick={() => setShowFailedModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SalarySlips;
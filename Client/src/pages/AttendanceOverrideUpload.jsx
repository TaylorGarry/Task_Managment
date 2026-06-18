// import React, { useMemo, useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { useSelector } from "react-redux";

// // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
// const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

// const toDateInputValue = (d) => {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const AttendanceOverrideUpload = () => {
//   const { user } = useSelector((state) => state.auth);
//   const token = user?.token || "";
//   const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
//   const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
//   const [file, setFile] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [result, setResult] = useState(null);

//   const canSubmit = useMemo(
//     () => Boolean(token && startDate && endDate && file && !submitting),
//     [token, startDate, endDate, file, submitting]
//   );

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!canSubmit) return;
//     try {
//       setSubmitting(true);
//       setResult(null);
//       const formData = new FormData();
//       formData.append("startDate", startDate);
//       formData.append("endDate", endDate);
//       formData.append("excelFile", file);

//       const res = await axios.post(`${API_URL}/roster/attendance-override/upload`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       setResult(res?.data || null);
//       const refreshToken = String(Date.now());
//       localStorage.setItem("attendanceOverride:lastUpdatedAt", refreshToken);
//       window.dispatchEvent(new Event("attendance-override-updated"));
//       const warnings = Array.isArray(res?.data?.warnings) ? res.data.warnings : [];
//       if (warnings.length > 0) {
//         toast.error(
//           warnings
//             .map((warning) => warning?.message || "Payroll sync warning")
//             .join(" | ")
//         );
//       } else {
//         toast.success("Attendance override uploaded successfully.");
//       }
//     } catch (err) {
//       const msg = err?.response?.data?.message || "Failed to upload attendance override.";
//       toast.error(msg);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 md:p-6">
//       <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
//         <h1 className="text-xl font-semibold text-slate-900">Attendance Override Upload</h1>
//         <p className="mt-1 text-sm text-slate-600">
//           Upload monthly sheet with <span className="font-medium">AGENT</span> or <span className="font-medium">Employee ID</span>.
//           Only daily status in selected range will be overridden.
//         </p>

//         <form onSubmit={onSubmit} className="mt-5 space-y-4">
//           <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//             <label className="text-sm text-slate-700">
//               Start Date
//               <input
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//                 required
//               />
//             </label>
//             <label className="text-sm text-slate-700">
//               End Date
//               <input
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//                 required
//               />
//             </label>
//           </div>

//           <label className="block text-sm text-slate-700">
//             Excel File (.xlsx/.xls)
//             <input
//               type="file"
//               accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
//               onChange={(e) => setFile(e.target.files?.[0] || null)}
//               className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
//               required
//             />
//           </label>

//           <button
//             type="submit"
//             disabled={!canSubmit}
//             className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {submitting ? "Uploading..." : "Upload Override"}
//           </button>
//         </form>

//         {result && (
//           <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
//             <p><span className="font-medium">Updated Employees:</span> {result?.data?.updatedEmployees ?? 0}</p>
//             <p><span className="font-medium">Updated Days:</span> {result?.data?.updatedDays ?? 0}</p>
//             <p><span className="font-medium">Touched Rosters:</span> {result?.data?.touchedRosters ?? 0}</p>
//             <p><span className="font-medium">Invalid Status Cells:</span> {result?.data?.invalidStatusCells ?? 0}</p>
//             <p><span className="font-medium">Unmatched Rows (sample):</span> {(result?.data?.unmatchedRows || []).length}</p>
//             <p><span className="font-medium">Payroll Sync:</span> {result?.data?.payrollSync?.success ? "Completed" : (Array.isArray(result?.warnings) && result.warnings.length > 0 ? "Warning" : "Not available")}</p>
//             <p><span className="font-medium">Payroll Records:</span> {result?.data?.payrollSync?.insertedOrUpdatedRecords ?? 0}</p>
//             <p><span className="font-medium">Payroll Unmatched Rows:</span> {(result?.data?.payrollSync?.unmatchedRows || []).length}</p>
//             {Array.isArray(result?.warnings) && result.warnings.length > 0 ? (
//               <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
//                 <p className="font-semibold">Payroll warning</p>
//                 <ul className="mt-1 list-disc pl-5 text-xs">
//                   {result.warnings.map((warning, index) => (
//                     <li key={`${warning?.module || "warning"}-${index}`}>{warning?.message || "Payroll sync warning"}</li>
//                   ))}
//                 </ul>
//               </div>
//             ) : null}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AttendanceOverrideUpload;






import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUploadCloud,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiActivity,
  FiClock,
  FiUsers,
  FiBarChart2,
  FiAlertCircle,
} from "react-icons/fi";

const toDateInputValue = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const AttendanceOverrideUpload = () => {
  const { user } = useSelector((state) => state.auth);
  const token = user?.token || "";
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(token && startDate && endDate && file && !submitting),
    [token, startDate, endDate, file, submitting]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      setFile(droppedFile);
    } else {
      toast.error("Please drop a valid Excel file (.xlsx or .xls)");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setResult(null);
      const formData = new FormData();
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("excelFile", file);

      const res = await axios.post(`${API_URL}/roster/attendance-override/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(res?.data || null);
      const refreshToken = String(Date.now());
      localStorage.setItem("attendanceOverride:lastUpdatedAt", refreshToken);
      window.dispatchEvent(new Event("attendance-override-updated"));
      const warnings = Array.isArray(res?.data?.warnings) ? res.data.warnings : [];
      if (warnings.length > 0) {
        toast.error(
          warnings
            .map((warning) => warning?.message || "Payroll sync warning")
            .join(" | ")
        );
      } else {
        toast.success("Attendance override uploaded successfully.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to upload attendance override.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/60 p-3 sm:p-4 md:p-6 lg:p-8 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-sans { font-family: 'Inter', -apple-system, system-ui, sans-serif; }
        .shadow-soft { box-shadow: 0 2px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02); }
        .shadow-card { box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.02); }
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        /* Mobile touch improvements */
        input[type="date"] { 
          min-height: 44px; 
          font-size: 16px !important; /* Prevents iOS zoom */
        }
        button { 
          min-height: 44px; 
          min-width: 44px; 
        }
        /* Better touch targets on mobile */
        @media (max-width: 640px) {
          input, select, button { 
            font-size: 16px !important; 
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[#0e5c7a] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <FiActivity className="text-sm flex-shrink-0" />
              <span>Control Panel</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5 sm:mt-1 break-words">
              Attendance Override
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Upload monthly attendance sheets using <span className="font-semibold text-slate-700 whitespace-nowrap">Agent</span> or{" "}
              <span className="font-semibold text-slate-700 whitespace-nowrap">Employee ID</span> tokens.
              <span className="hidden xs:inline"> Operational statuses within the selected date range will be permanently overridden.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-xl border border-slate-200 shadow-soft flex-shrink-0 self-start md:self-center">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-600 whitespace-nowrap">System Ready</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          {/* Form Section */}
          <div className="p-4 sm:p-5 md:p-6 lg:p-8">
            <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 md:space-y-7">
              {/* Date Range Section */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1.5 rounded-lg bg-[#0e5c7a]/10 text-[#0e5c7a] flex-shrink-0">
                    <FiCalendar className="text-sm" />
                  </div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Operational Date Range
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0e5c7a] transition-colors z-10">
                      <FiCalendar className="text-sm flex-shrink-0" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="w-full h-11 sm:h-12 pl-9 pr-14 sm:pr-16 rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-medium text-slate-700 focus:bg-white focus:border-[#0e5c7a] focus:ring-2 focus:ring-[#0e5c7a]/15 transition-all outline-none cursor-pointer hover:border-slate-300"
                      required
                    />
                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase pointer-events-none bg-white/80 px-1.5 sm:px-2 py-0.5 rounded border border-slate-200">
                      Start
                    </span>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0e5c7a] transition-colors z-10">
                      <FiCalendar className="text-sm flex-shrink-0" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="w-full h-11 sm:h-12 pl-9 pr-14 sm:pr-16 rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-medium text-slate-700 focus:bg-white focus:border-[#0e5c7a] focus:ring-2 focus:ring-[#0e5c7a]/15 transition-all outline-none cursor-pointer hover:border-slate-300"
                      required
                    />
                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase pointer-events-none bg-white/80 px-1.5 sm:px-2 py-0.5 rounded border border-slate-200">
                      End
                    </span>
                  </div>
                </div>
                {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                  <div className="mt-2 text-[10px] sm:text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <FiClock className="text-slate-400 text-xs flex-shrink-0" />
                    <span className="truncate">
                      Range: {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
                    </span>
                    <span className="text-slate-400 whitespace-nowrap">
                      ({Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} days)
                    </span>
                  </div>
                )}
              </div>

              {/* File Upload Section */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1.5 rounded-lg bg-[#0e5c7a]/10 text-[#0e5c7a] flex-shrink-0">
                    <FiFileText className="text-sm" />
                  </div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Source Document
                  </label>
                  {file && (
                    <span className="ml-auto text-[10px] sm:text-xs text-emerald-600 font-medium bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-200 truncate max-w-[120px] sm:max-w-[200px]">
                      File attached
                    </span>
                  )}
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-200 min-h-[180px] sm:min-h-[200px] ${
                    file
                      ? "border-emerald-300 bg-emerald-50/40"
                      : isDragOver
                      ? "border-[#0e5c7a] bg-[#0e5c7a]/5 scale-[1.01]"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="file"
                    id="excelFileInput"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required={!file}
                  />

                  <div
                    className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 transition-all ${
                      file
                        ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-200"
                        : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300"
                    }`}
                  >
                    {file ? <FiCheckCircle className="text-xl sm:text-2xl" /> : <FiUploadCloud className="text-xl sm:text-2xl" />}
                  </div>

                  {file ? (
                    <div className="z-20 pointer-events-none w-full max-w-full">
                      <p className="text-sm font-semibold text-slate-800 truncate w-full px-2">{file.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Ready to commit
                      </p>
                    </div>
                  ) : (
                    <div className="px-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">
                        Drag & drop your Excel file here, or{" "}
                        <span className="text-[#0e5c7a] font-semibold underline hover:text-[#1681ab] transition-colors">
                          browse files
                        </span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-2">
                        Supports .xlsx and .xls formats
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button - Full width on mobile */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end pt-3 border-t border-slate-100 gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-[#0e5c7a] hover:bg-[#1681ab] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:cursor-not-allowed hover:shadow-md"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-current"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="text-sm flex-shrink-0" />
                      <span>Upload Override</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Results Panel - Mobile optimized */}
            {result && (
              <div className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden animate-in">
                {/* Results Header */}
                <div className="border-b border-slate-100 bg-slate-50/70 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <FiCheckCircle className="text-emerald-500 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Transaction Summary
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 bg-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-slate-200">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                {/* Metrics Grid - 2 columns on mobile, 4 on larger screens */}
                <div className="p-3 sm:p-5 grid grid-cols-2 gap-2 sm:gap-3 border-b border-slate-100">
                  <div className="p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      <FiUsers className="text-[10px] sm:text-xs flex-shrink-0" />
                      <span className="hidden xs:inline">Active Staff</span>
                      <span className="xs:hidden">Staff</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 sm:mt-1">{result?.data?.updatedEmployees ?? 0}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      <FiCalendar className="text-[10px] sm:text-xs flex-shrink-0" />
                      <span className="hidden xs:inline">Days Overridden</span>
                      <span className="xs:hidden">Days</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 sm:mt-1">{result?.data?.updatedDays ?? 0}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      <FiBarChart2 className="text-[10px] sm:text-xs flex-shrink-0" />
                      <span className="hidden xs:inline">Rosters Touched</span>
                      <span className="xs:hidden">Rosters</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 sm:mt-1">{result?.data?.touchedRosters ?? 0}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      <FiAlertCircle className="text-[10px] sm:text-xs flex-shrink-0" />
                      <span className="hidden xs:inline">Invalid Flags</span>
                      <span className="xs:hidden">Flags</span>
                    </div>
                    <p
                      className={`text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 ${
                        Number(result?.data?.invalidStatusCells) > 0 ? "text-rose-500" : "text-slate-800"
                      }`}
                    >
                      {result?.data?.invalidStatusCells ?? 0}
                    </p>
                  </div>
                </div>

                {/* Detailed Technical Info - Mobile optimized */}
                <div className="p-3 sm:p-5 bg-slate-50/30 text-[10px] sm:text-xs text-slate-600 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-2 sm:pb-2.5 gap-1 sm:gap-0">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <FiInfo className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0" />
                      Unmatched Rows
                    </span>
                    <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs">
                      {(result?.data?.unmatchedRows || []).length} entries
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-2 sm:pb-2.5 gap-1 sm:gap-0">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <FiActivity className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0" />
                      Payroll Sync Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase ${
                        result?.data?.payrollSync?.success
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : Array.isArray(result?.warnings) && result.warnings.length > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {result?.data?.payrollSync?.success
                        ? "Completed"
                        : Array.isArray(result?.warnings) && result.warnings.length > 0
                        ? "Warning"
                        : "Not available"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-2 sm:pb-2.5 gap-1 sm:gap-0">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <FiCheckCircle className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0" />
                      Records Committed
                    </span>
                    <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs">
                      {result?.data?.payrollSync?.insertedOrUpdatedRecords ?? 0} items
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <FiAlertTriangle className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0" />
                      Unmatched Exception Lines
                    </span>
                    <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs">
                      {(result?.data?.payrollSync?.unmatchedRows || []).length} nodes
                    </span>
                  </div>
                </div>

                {/* Warnings - Mobile optimized */}
                {Array.isArray(result?.warnings) && result.warnings.length > 0 && (
                  <div className="mx-3 sm:mx-5 mb-3 sm:mb-5 mt-0 border border-amber-200 bg-amber-50/50 rounded-xl p-3 sm:p-4 animate-in">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-2">
                      <FiAlertTriangle className="text-amber-600 text-sm flex-shrink-0" />
                      Integration Exceptions
                    </div>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-slate-600 text-[10px] sm:text-xs leading-relaxed">
                      {result.warnings.map((warning, index) => (
                        <li key={`${warning?.module || "warning"}-${index}`} className="marker:text-amber-500 break-words">
                          {warning?.message || "Payroll sync warning"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Helper */}
        <div className="mt-3 sm:mt-4 text-center text-[8px] sm:text-[10px] text-slate-400 px-2">
          All attendance overrides are permanent and will affect payroll calculations
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverrideUpload;
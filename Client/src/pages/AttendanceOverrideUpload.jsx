import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const toDateInputValue = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const AttendanceOverrideUpload = () => {
  const { user } = useSelector((state) => state.auth);
  const token = user?.token || "";
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(
    () => Boolean(token && startDate && endDate && file && !submitting),
    [token, startDate, endDate, file, submitting]
  );

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <h1 className="text-xl font-semibold text-slate-900">Attendance Override Upload</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload monthly sheet with <span className="font-medium">AGENT</span> or <span className="font-medium">Employee ID</span>.
          Only daily status in selected range will be overridden.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </label>
          </div>

          <label className="block text-sm text-slate-700">
            Excel File (.xlsx/.xls)
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              required
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Uploading..." : "Upload Override"}
          </button>
        </form>

        {result && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p><span className="font-medium">Updated Employees:</span> {result?.data?.updatedEmployees ?? 0}</p>
            <p><span className="font-medium">Updated Days:</span> {result?.data?.updatedDays ?? 0}</p>
            <p><span className="font-medium">Touched Rosters:</span> {result?.data?.touchedRosters ?? 0}</p>
            <p><span className="font-medium">Invalid Status Cells:</span> {result?.data?.invalidStatusCells ?? 0}</p>
            <p><span className="font-medium">Unmatched Rows (sample):</span> {(result?.data?.unmatchedRows || []).length}</p>
            <p><span className="font-medium">Payroll Sync:</span> {result?.data?.payrollSync?.success ? "Completed" : (Array.isArray(result?.warnings) && result.warnings.length > 0 ? "Warning" : "Not available")}</p>
            <p><span className="font-medium">Payroll Records:</span> {result?.data?.payrollSync?.insertedOrUpdatedRecords ?? 0}</p>
            <p><span className="font-medium">Payroll Unmatched Rows:</span> {(result?.data?.payrollSync?.unmatchedRows || []).length}</p>
            {Array.isArray(result?.warnings) && result.warnings.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-semibold">Payroll warning</p>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {result.warnings.map((warning, index) => (
                    <li key={`${warning?.module || "warning"}-${index}`}>{warning?.message || "Payroll sync warning"}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceOverrideUpload;

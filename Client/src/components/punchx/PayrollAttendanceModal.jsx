import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getApiBaseUrl } from "../../utils/apiUrl";

const STATUS_META = {
  P: { label: "Present", chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  WO: { label: "Week Off", chip: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  L: { label: "Leave", chip: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  NCNS: { label: "No Call No Show", chip: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-600" },
  UL: { label: "Unplanned Leave", chip: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", dot: "bg-fuchsia-500" },
  LWP: { label: "Leave Without Pay", chip: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  BL: { label: "Birthday Leave", chip: "bg-slate-200 text-slate-700 border-slate-300", dot: "bg-slate-500" },
  H: { label: "Holiday", chip: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  LWD: { label: "Late Working Day", chip: "bg-cyan-100 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  HD: { label: "Half Day", chip: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  OT: { label: "Overtime", chip: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
};

const toIsoDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return "--";
  const [year, month, day] = String(dateKey).split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PayrollAttendanceModal = ({ open, onClose, token, currentUser }) => {
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toIsoDateKey(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportRange, setExportRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: toIsoDateKey(start),
      endDate: toIsoDateKey(end),
    };
  });
  const [isExporting, setIsExporting] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const API_URL = getApiBaseUrl();
  const monthLabel = activeMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const activeMonthKey = `${activeMonth.getFullYear()}-${String(activeMonth.getMonth() + 1).padStart(2, "0")}`;
  const todayMonthKeyParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const todayYear = todayMonthKeyParts.find((part) => part.type === "year")?.value;
  const todayMonth = todayMonthKeyParts.find((part) => part.type === "month")?.value;
  const todayMonthKey = todayYear && todayMonth ? `${todayYear}-${todayMonth}` : activeMonthKey;
  const isCurrentMonth = activeMonthKey === todayMonthKey;
  const currentDepartment = String(currentUser?.department || "").trim().toLowerCase();
  const currentAccountType = String(currentUser?.accountType || "").trim().toLowerCase();
  const canExportPayroll =
    currentAccountType === "superadmin" ||
    currentDepartment === "account" ||
    currentDepartment === "accounts";

  const recordsByDate = useMemo(() => {
    const map = {};
    records.forEach((record) => {
      const dateKey = record?.attendanceDateKey || toIsoDateKey(record?.attendanceDate);
      if (!dateKey) return;
      map[dateKey] = record;
    });
    return map;
  }, [records]);

  const monthStart = useMemo(() => new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1), [activeMonth]);
  const monthEnd = useMemo(() => new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0), [activeMonth]);
  const calendarDays = useMemo(() => {
    const days = [];
    const startingWeekday = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    const todayKey = toIsoDateKey(new Date());

    for (let i = 0; i < startingWeekday; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateObj = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day);
      const dateKey = toIsoDateKey(dateObj);
      days.push({
        day,
        dateKey,
        attendance: recordsByDate[dateKey] || null,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateKey,
      });
    }

    return days;
  }, [activeMonth, monthStart, monthEnd, recordsByDate, selectedDateKey]);

  const selectedRecord = selectedDateKey ? recordsByDate[selectedDateKey] || null : null;

  useEffect(() => {
    if (!open) return;
    if (!token) {
      setError("Missing auth token.");
      return;
    }

    const loadMonth = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_URL}/payroll/attendance-month`, {
          params: {
            month: activeMonth.getMonth() + 1,
            year: activeMonth.getFullYear(),
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = res?.data?.data || {};
        setRecords(Array.isArray(payload.records) ? payload.records : []);
        setSummary(payload.summary || null);
        const nextRecords = Array.isArray(payload.records) ? payload.records : [];
        const currentKey = toIsoDateKey(new Date());
        const firstRecordKey = nextRecords[0]?.attendanceDateKey || toIsoDateKey(nextRecords[0]?.attendanceDate);
        setSelectedDateKey((prev) => {
          if (nextRecords.some((item) => (item?.attendanceDateKey || toIsoDateKey(item?.attendanceDate)) === prev)) {
            return prev;
          }
          return firstRecordKey || currentKey;
        });
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load payroll attendance.";
        setRecords([]);
        setSummary(null);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadMonth();
  }, [API_URL, activeMonth, open, reloadTick, token]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setExportRange({
      startDate: toIsoDateKey(monthStart),
      endDate: toIsoDateKey(monthEnd),
    });
  }, [activeMonth, monthStart, monthEnd, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPayrollRefresh = () => setReloadTick((current) => current + 1);
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("attendance-override-updated", onPayrollRefresh);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("attendance-override-updated", onPayrollRefresh);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const handleExport = async () => {
    if (!token) {
      toast.error("Missing auth token. Please login again.");
      return;
    }
    if (!exportRange.startDate || !exportRange.endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (exportRange.startDate > exportRange.endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_URL}/payroll/export?startDate=${encodeURIComponent(exportRange.startDate)}&endDate=${encodeURIComponent(exportRange.endDate)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || `Failed to export (${response.status})`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fileName = fileNameMatch?.[1] || `payroll_attendance_${exportRange.startDate}_to_${exportRange.endDate}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Payroll attendance exported successfully.");
    } catch (err) {
      toast.error(err?.message || "Failed to export payroll attendance.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 px-5 py-4 text-white md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">Payroll Attendance</p>
              <h3 className="mt-1 text-2xl font-semibold">View Payroll Attendance</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Calendar data is loaded only from payroll attendance records. It does not depend on roster or department attendance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isCurrentMonth ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-white/20 bg-white/10 text-slate-100"}`}>
                {isCurrentMonth ? "Current Month" : monthLabel}
              </span>
              <button
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="grid gap-4 px-4 py-4 md:px-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loaded Days</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.totalDays ?? records.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Present</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{summary?.presentDays ?? records.filter((item) => item.status === "P").length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leave</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{summary?.leaveDays ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Off Days</p>
                  <p className="mt-1 text-2xl font-bold text-sky-600">{summary?.offDays ?? 0}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{monthLabel}</h4>
                    <p className="text-sm text-slate-500">Use the arrows to navigate payroll months.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setActiveMonth(new Date())}
                      className="rounded-xl border border-slate-200 bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Current
                    </button>
                    <button
                      onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {loading ? (
                    Array.from({ length: 35 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                      />
                    ))
                  ) : records.length === 0 ? (
                    <div className="col-span-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                      <p className="text-lg font-semibold text-slate-800">No payroll attendance found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        This month has no payroll attendance records yet.
                      </p>
                    </div>
                  ) : (
                    calendarDays.map((item, index) => {
                      if (!item) {
                        return <div key={`blank-${index}`} className="h-16 rounded-2xl bg-transparent" />;
                      }

                      const statusMeta = STATUS_META[item.attendance?.status] || {
                        label: item.attendance?.status || "No Record",
                        dot: "bg-slate-300",
                        chip: "bg-slate-100 text-slate-700 border-slate-200",
                      };

                      return (
                        <button
                          key={item.dateKey}
                          onClick={() => setSelectedDateKey(item.dateKey)}
                          className={`group relative h-16 rounded-2xl border px-2 py-2 text-left transition ${
                            item.isSelected
                              ? "border-sky-500 bg-sky-50 shadow-sm"
                              : item.isToday
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">{item.day}</span>
                            {item.attendance?.status ? (
                              <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`} />
                            ) : null}
                          </div>
                          <p className="mt-2 truncate text-[10px] font-medium text-slate-500">
                            {item.attendance?.status ? statusMeta.label : "No record"}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Details</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">
                      {formatDateLabel(selectedDateKey)}
                    </h4>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_META[selectedRecord?.status]?.chip || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {STATUS_META[selectedRecord?.status]?.label || selectedRecord?.status || "No Record"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employee Name</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRecord?.employeeName || "--"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pseudo Name</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRecord?.pseudoName || "--"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employee ID</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRecord?.empId || "--"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Batch ID</p>
                      <p className="mt-1 break-all font-semibold text-slate-900">{selectedRecord?.batchId || "--"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Uploaded At</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedRecord?.uploadedAt ? new Date(selectedRecord.uploadedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "--"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Original Row</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRecord?.originalRowNumber ?? "--"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedRecord?.status || "--"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Payroll attendance is dataset-driven. If the day is missing, it was not uploaded in payroll records for this range.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Legend</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(STATUS_META).map(([status, meta]) => (
                    <div key={status} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{status}</p>
                        <p className="truncate text-xs text-slate-500">{meta.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 md:px-6">
          <div className={`flex flex-col gap-4 ${canExportPayroll ? "lg:flex-row lg:items-center lg:justify-between" : "items-end"}`}>
            {canExportPayroll ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Start Date
                  <input
                    type="date"
                    value={exportRange.startDate}
                    onChange={(e) => setExportRange((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  End Date
                  <input
                    type="date"
                    value={exportRange.endDate}
                    onChange={(e) => setExportRange((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  onClose?.();
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {canExportPayroll ? (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="rounded-xl border border-sky-700 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? "Exporting..." : "Export Payroll Attendance"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollAttendanceModal;

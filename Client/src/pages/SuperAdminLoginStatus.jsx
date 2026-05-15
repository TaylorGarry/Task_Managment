import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getRoleType } from "../utils/roleAccess.js";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50];
const IST_TIME_ZONE = "Asia/Kolkata";

const toDateKey = (date) => {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const yyyy = parts.find((p) => p.type === "year")?.value;
  const mm = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatDuration = (ms = 0) => {
  const safe = Math.max(0, Number(ms) || 0);
  const totalMinutes = Math.floor(safe / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const getLateByFallbackMs = (loginTime, shiftStartHour) => {
  if (!loginTime) return 0;
  const shiftHourNum = Number(shiftStartHour);
  if (!Number.isFinite(shiftHourNum)) return 0;
  const login = new Date(loginTime);
  if (Number.isNaN(login.getTime())) return 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(login);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const second = Number(parts.find((p) => p.type === "second")?.value || 0);
  const loginClockMs = hour * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000;
  const expectedClockMs = shiftHourNum * 60 * 60 * 1000;
  return loginClockMs > expectedClockMs ? loginClockMs - expectedClockMs : 0;
};

const SuperAdminLoginStatus = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const isSuperAdminView = getRoleType(currentUser) === "superAdmin";
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const token = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.token || "";
    } catch {
      return "";
    }
  }, []);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = isSuperAdminView
        ? `${API_URL}/punchx/superadmin/daily-status`
        : `${API_URL}/punchx/manager/team-status`;
      const res = await axios.get(endpoint, {
        params: { dateKey },
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawRows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
      const normalizedRows = rawRows.map((r) => {
        const loginTime = r.loginTime || r.shiftStartedAt || null;
        const serverLateByMs = Number(r.lateByMs || 0);
        const fallbackLateByMs = getLateByFallbackMs(loginTime, r.shiftStartHour);
        const explicitManualBreakMs = Number(r.manualBreakMs);
        const hasExplicitSplit = Number.isFinite(explicitManualBreakMs);
        const totalBreakMs = Number(r.totalBreakMs || 0);
        const manualBreakMs = hasExplicitSplit ? explicitManualBreakMs : totalBreakMs;
        return {
          ...r,
          loginTime,
          logoutTime: r.logoutTime || null,
          isOnBreak:
            typeof r.isOnBreak === "boolean"
              ? r.isOnBreak
              : Boolean(r.breakType) || ["manual_break", "auto_break"].includes(r.activityStatus),
          lateByMs: serverLateByMs > 0 ? serverLateByMs : fallbackLateByMs,
          totalWorkedMs: Number(r.totalWorkedMs || 0),
          totalBreakMs,
          manualBreakMs,
          hasCompletedNineHours:
            typeof r.hasCompletedNineHours === "boolean"
              ? r.hasCompletedNineHours
              : Number(r.totalWorkedMs || 0) >= 9 * 60 * 60 * 1000,
          remainingForNineHoursMs:
            typeof r.remainingForNineHoursMs === "number"
              ? r.remainingForNineHoursMs
              : Math.max(0, 9 * 60 * 60 * 1000 - Number(r.totalWorkedMs || 0)),
        };
      });
      setRows(normalizedRows);
      setSummary(
        res?.data?.summary || {
          totalEmployees: normalizedRows.length,
          loggedInCount: normalizedRows.filter((r) => Boolean(r.loginTime)).length,
          onBreakCount: normalizedRows.filter((r) => r.isOnBreak).length,
          notCompletedNineHoursCount: normalizedRows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
          lateLoginCount: normalizedRows.filter((r) => r.lateByMs > 0).length,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load login status");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!token || !isSuperAdminView) return;
    try {
      setExporting(true);
      const res = await axios.get(`${API_URL}/punchx/superadmin/daily-status/export`, {
        params: { dateKey },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const disposition = res.headers?.["content-disposition"] || "";
      const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = fileNameMatch?.[1] || `superadmin-login-status-${dateKey}.xlsx`;
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to export login status");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [dateKey, isSuperAdminView]);

  const departments = useMemo(() => {
    const set = new Set(rows.map((r) => r.department).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (dept !== "All" && r.department !== dept) return false;
      if (status === "On Break" && !r.isOnBreak) return false;
      if (status === "Logged In" && !r.loginTime) return false;
      if (status === "Not Logged In" && r.loginTime) return false;
      if (status === "Late" && !(r.loginTime && r.lateByMs > 0)) return false;
      if (status === "9h Incomplete" && !(r.loginTime && !r.hasCompletedNineHours)) return false;
      if (!q) return true;
      const hay = `${r.pseudoName || ""} ${r.name || ""} ${r.username || ""} ${r.department || ""} ${r.accountType || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, dept, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, dept, status, pageSize, dateKey]);

  const onBreakNames = useMemo(
    () => filteredRows.filter((r) => r.isOnBreak).slice(0, 4).map((r) => r.pseudoName || r.name || r.username || "Employee"),
    [filteredRows]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-[#0F2C78] to-[#1D4ED8] p-4 text-white md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                {isSuperAdminView ? "SuperAdmin View" : "Supervisor View"}
              </p>
              <h1 className="text-2xl font-semibold">
                {isSuperAdminView ? "Employee Login Monitoring Dashboard" : "Team Login Monitoring Dashboard"}
              </h1>
              <p className="text-sm text-blue-100">Real-time attendance and break intelligence</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="rounded-lg border border-blue-200 bg-white/95 px-3 py-2 text-sm text-slate-800"
              />
              {isSuperAdminView && (
                <button
                  onClick={exportExcel}
                  disabled={exporting}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting ? "Exporting..." : "Export Excel"}
                </button>
              )}
              <button
                onClick={loadData}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total Employees</p><p className="text-2xl font-semibold text-slate-900">{summary?.totalEmployees || 0}</p></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Logged In</p><p className="text-2xl font-semibold text-emerald-800">{summary?.loggedInCount || 0}</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700">On Break</p><p className="text-2xl font-semibold text-amber-800">{summary?.onBreakCount || 0}</p></div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs text-rose-700">9h Incomplete</p><p className="text-2xl font-semibold text-rose-800">{summary?.notCompletedNineHoursCount || 0}</p></div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-xs text-indigo-700">Late Logins</p><p className="text-2xl font-semibold text-indigo-800">{summary?.lateLoginCount || 0}</p></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Live Attendance Grid</h2>
            <div className="text-xs text-slate-500">
              {onBreakNames.length ? `On break: ${onBreakNames.join(", ")}` : "No one currently on break"}
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {["All", "Logged In", "Not Logged In", "On Break", "Late", "9h Incomplete"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Login</th>
                    <th className="px-3 py-2">Logout</th>
                    <th className="px-3 py-2">Late By</th>
                    <th className="px-3 py-2">Worked</th>
                    <th className="px-3 py-2">9h Progress</th>
                    <th className="px-3 py-2">Break Used</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.userId} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-900">{row.pseudoName || row.name || row.username || "--"}</p>
                      </td>
                      <td className="px-3 py-2">{row.department || "--"}</td>
                      <td className="px-3 py-2">
                        {row.isOnBreak ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">On Break</span>
                        ) : row.loginTime ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">On Shift</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Not Logged In</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{formatDateTime(row.loginTime)}</td>
                      <td className="px-3 py-2">{formatDateTime(row.logoutTime)}</td>
                      <td className="px-3 py-2">{!row.loginTime ? "--" : row.lateByMs > 0 ? formatDuration(row.lateByMs) : "On Time"}</td>
                      <td className="px-3 py-2">{row.loginTime ? formatDuration(row.totalWorkedMs || 0) : "--"}</td>
                      <td className="px-3 py-2">
                        {!row.loginTime ? (
                          "--"
                        ) : row.hasCompletedNineHours ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Completed</span>
                        ) : (
                          <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                            Pending {formatDuration(row.remainingForNineHoursMs || 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {!row.loginTime ? (
                          "--"
                        ) : (
                          <>
                            <p>{formatDuration(row.totalBreakMs || 0)}</p>
                            <p className="text-xs text-slate-500">
                              {`Manual: ${formatDuration(row.manualBreakMs || 0)}`}
                            </p>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">No records found for selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
              {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm font-medium text-slate-700">Page {safePage} / {totalPages}</span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
};

export default SuperAdminLoginStatus;

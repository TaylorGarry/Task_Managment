import React, { useEffect, useState } from "react";
import axios from "axios";
import IdleMonitor from "./IdleMonitor";
import BreakTracker from "./BreakTracker";
import AlertsPanel from "./AlertsPanel";
import { formatDuration } from "./utils";

const toIsoDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const directDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directDate) return directDate[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateKeyLabel = (dateKey) => {
  if (!dateKey) return "--";
  const [year, month, day] = String(dateKey).split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusMeta = (rawStatus = "") => {
  const status = String(rawStatus || "").trim().toUpperCase();
  const map = {
    P: { label: "Present", chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    A: { label: "Absent", chip: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
    L: { label: "Leave", chip: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    WO: { label: "Week Off", chip: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
    H: { label: "Holiday", chip: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
    HD: { label: "Half Day", chip: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
    LWP: { label: "Leave Without Pay", chip: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
    UL: { label: "Unplanned Leave", chip: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", dot: "bg-fuchsia-500" },
    NCNS: { label: "No Call No Show", chip: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-600" },
    BL: { label: "Bereavement Leave", chip: "bg-slate-200 text-slate-700 border-slate-300", dot: "bg-slate-500" },
    LWD: { label: "Late Working Day", chip: "bg-cyan-100 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  };
  return map[status] || { label: status || "Not Marked", chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
};

const buildAttendanceByDate = (summary) => {
  const attendanceMap = {};
  const pushRecord = (dateValue, sourceValue) => {
    const dateKey = toIsoDateKey(dateValue);
    if (!dateKey) return;
    const value = typeof sourceValue === "string" ? { status: sourceValue } : (sourceValue || {});
    attendanceMap[dateKey] = {
      ...value,
      status:
        value.status ||
        value.departmentStatus ||
        value.transportStatus ||
        value.attendanceStatus ||
        value.employeeStatus ||
        value.dayStatus ||
        "",
      checkIn: value.checkIn || value.inTime || "",
      checkOut: value.checkOut || value.outTime || "",
      hoursWorked: value.hoursWorked ?? value.totalHours ?? "",
      updatedBy: value.updatedByName || value.updatedBy || value.markedBy || value.teamLeaderName || "",
      note: value.note || value.remarks || value.comment || "",
      date: dateKey,
    };
  };

  const consume = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((entry) => {
        if (!entry) return;
        if (entry.date || entry.day || entry.attendanceDate) {
          pushRecord(entry.date || entry.day || entry.attendanceDate, entry);
        }
      });
      return;
    }
    if (typeof node === "object") {
      Object.entries(node).forEach(([key, value]) => {
        if (toIsoDateKey(key)) {
          pushRecord(key, value);
        }
      });
    }
  };

  consume(summary?.attendance);
  consume(summary?.attendance?.currentWeek);
  consume(summary?.attendanceByDate);
  consume(summary?.attendanceHistory);
  consume(summary?.dailyStatus);
  consume(summary?.profile?.attendance);
  consume(summary?.profile?.dailyStatus);
  consume(summary?.roster?.currentWeek?.dailyStatus);
  consume(summary?.roster?.nextWeek?.dailyStatus);
  consume(summary?.roster?.dailyStatus);

  return attendanceMap;
};

const AgentDashboard = ({ session, attendanceScore, employeeDashboardSummary, onStartShift, onEndShift, onStartBreak, onEndBreak }) => {
  const [nowMs, setNowMs] = useState(Date.now());
  const [monthAttendanceByDate, setMonthAttendanceByDate] = useState({});
  const [activeMonth, setActiveMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toIsoDateKey(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalHoursMs = session?.shiftStartAt
    ? (session?.shiftEndAt
        ? new Date(session.shiftEndAt).getTime() - new Date(session.shiftStartAt).getTime()
        : nowMs - new Date(session.shiftStartAt).getTime())
    : 0;
  const breakMs = session?.totalBreakMs || 0;
  const manualBreakMs = (session?.breaks || [])
    .filter((b) => b.type === "manual")
    .reduce((sum, b) => sum + (b.durationMs || 0), 0);
  const autoBreakMs = (session?.breaks || [])
    .filter((b) => b.type === "auto_idle")
    .reduce((sum, b) => sum + (b.durationMs || 0), 0);
  const disconnectBreakMs = (session?.breaks || [])
    .filter((b) => b.type === "system_disconnect")
    .reduce((sum, b) => sum + (b.durationMs || 0), 0);
  const remainingMs = Math.max(0, 9 * 60 * 60 * 1000 - totalHoursMs);
  const summaryAttendanceByDate = buildAttendanceByDate(employeeDashboardSummary || {});
  const attendanceByDate = { ...summaryAttendanceByDate, ...monthAttendanceByDate };
  const selectedAttendance = attendanceByDate[selectedDateKey] || null;
  const todayDateKey = toIsoDateKey(new Date());
  const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const monthEnd = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
  const startingWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const monthLabel = activeMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const calendarDays = [];
  for (let i = 0; i < startingWeekday; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day);
    const dateKey = toIsoDateKey(dateObj);
    calendarDays.push({
      day,
      dateKey,
      attendance: attendanceByDate[dateKey] || null,
      isToday: dateKey === todayDateKey,
      isSelected: dateKey === selectedDateKey,
    });
  }

  useEffect(() => {
    const loadMonthAttendance = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = user?.token;
        if (!token) return;
        // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
        const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";
        const month = activeMonth.getMonth() + 1;
        const year = activeMonth.getFullYear();
        const res = await axios.get(`${API_URL}/employee/attendance-month`, {
          params: { month, year },
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res?.data?.attendance) ? res.data.attendance : [];
        const nextMap = {};
        list.forEach((item) => {
          const key = toIsoDateKey(item?.date);
          if (!key) return;
          nextMap[key] = {
            ...item,
            date: key,
            status: item?.departmentStatus || item?.transportStatus || item?.status || "",
            checkIn: item?.checkIn || item?.punchIn || "",
            checkOut: item?.checkOut || item?.punchOut || "",
            hoursWorked: item?.hoursWorked ?? item?.totalHours ?? "",
            updatedBy: item?.updatedByDepartment || "",
          };
        });
        setMonthAttendanceByDate(nextMap);
      } catch (err) {
        setMonthAttendanceByDate({});
      }
    };
    loadMonthAttendance();
  }, [activeMonth]);

  return (
    <section className="mb-8 rounded-[14px] border border-[#E2E8F0] bg-white p-4 md:p-6">
      <div className="mb-4 rounded-xl bg-[#0B2A6F] px-4 py-2 text-white">
        <h2 className="text-lg font-semibold">Shift Detail</h2>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={onStartShift} className="rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-3 py-2 text-xs font-semibold text-[#166534]">Start Shift</button>
          <button onClick={onEndShift} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">End Shift</button>
          <button onClick={() => onStartBreak("manual")} className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs font-semibold text-[#B45309]">Pause</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IdleMonitor
          activityStatus={session?.activityStatus}
          lastActivityAt={session?.lastActivityAt}
          autoBreakStartedAt={session?.autoBreakStartedAt}
        />
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Today&apos;s Snapshot</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748B]">Total Working</span><span className="font-semibold">{formatDuration(totalHoursMs)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Break Time</span><span className="font-semibold">{formatDuration(breakMs)}</span></div>
            <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1D4ED8]">Remaining Shift</p>
              <p className="font-mono text-2xl font-bold text-[#0F172A]">{formatDuration(remainingMs)}</p>
            </div>
            <div className="h-2 rounded-full bg-[#DBEAFE]"><div className="h-2 rounded-full bg-[#16A34A]" style={{ width: `${Math.min(100, Math.round(((attendanceScore?.total || 0) / 100) * 100))}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Break Time Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748B]">Total Break</span><span className="font-semibold">{formatDuration(breakMs)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Manual Break</span><span className="font-semibold">{formatDuration(manualBreakMs)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Auto Idle Break</span><span className="font-semibold">{formatDuration(autoBreakMs)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Disconnect Break</span><span className="font-semibold">{formatDuration(disconnectBreakMs)}</span></div>
          </div>
        </div>
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Current Break Status</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748B]">Break Running</span><span className="font-semibold">{session?.breaks?.some((b) => !b.endAt) ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Break Sessions</span><span className="font-semibold">{session?.breaks?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Idle Time</span><span className="font-semibold">{formatDuration(session?.totalIdleMs || 0)}</span></div>
          </div>
        </div>
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Attendance Score Trend</h3>
          <div className="mt-4 flex h-24 items-end gap-2">
            {[78, 82, 85, 90, 88, 92, attendanceScore?.total || 87].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[#2563EB]" style={{ height: `${Math.max(18, v)}%` }} />
                <span className="text-[10px] text-[#64748B]">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakTracker session={session} onStartBreak={onStartBreak} onEndBreak={onEndBreak} />
        <AlertsPanel session={session} />
      </div>

      <div className="mt-4 rounded-[14px] border border-[#DCE7F3] bg-gradient-to-br from-[#F8FBFF] via-white to-[#EFF8FF] p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#0F172A]">Attendance Calendar</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">Prev</button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-slate-700">{monthLabel}</span>
            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">Next</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map((item, idx) => {
            if (!item) return <div key={`blank-${idx}`} className="h-14 rounded-xl bg-transparent" />;
            const statusMeta = getStatusMeta(item.attendance?.status);
            return (
              <button
                key={item.dateKey}
                onClick={() => setSelectedDateKey(item.dateKey)}
                className={`group relative h-14 rounded-xl border text-left px-2 py-1 transition ${
                  item.isSelected
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : item.isToday
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{item.day}</span>
                  {item.attendance?.status ? <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} /> : null}
                </div>
                <p className="mt-1 truncate text-[10px] text-slate-500">
                  {item.attendance?.status ? statusMeta.label : "No update"}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              {formatDateKeyLabel(selectedDateKey)}
            </p>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusMeta(selectedAttendance?.status).chip}`}>
              {getStatusMeta(selectedAttendance?.status).label}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-2">
            <p><span className="font-semibold text-slate-700">Check-in:</span> {selectedAttendance?.checkIn || "--"}</p>
            <p><span className="font-semibold text-slate-700">Check-out:</span> {selectedAttendance?.checkOut || "--"}</p>
            <p><span className="font-semibold text-slate-700">Hours:</span> {selectedAttendance?.hoursWorked || "--"}</p>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department Status:</span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                  getStatusMeta(selectedAttendance?.departmentStatus || selectedAttendance?.transportStatus || selectedAttendance?.status).chip
                }`}
              >
                {getStatusMeta(selectedAttendance?.departmentStatus || selectedAttendance?.transportStatus || selectedAttendance?.status).label}
              </span>
            </div>
          </div>
          {selectedAttendance?.note ? (
            <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-700">
              <span className="font-semibold">Note:</span> {selectedAttendance.note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default AgentDashboard;

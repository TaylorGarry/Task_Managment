import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Clock3, Coffee, UserRound } from "lucide-react";
import { getApiBaseUrl } from "../utils/apiUrl.js";
import "./FloorStatusDashboard.css";

const API_URL = getApiBaseUrl();
const DATA_REFRESH_MS = 15000;
const PAGE_MS = 10000;

const pad = (value) => String(value).padStart(2, "0");

const formatDuration = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}` : `${pad(minutes)}:${pad(seconds)}`;
};

const formatClock = (date) =>
  date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const formatDate = (date) =>
  date
    .toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();

const formatDateKey = (dateKey = "") => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return "";
  const date = new Date(`${dateKey}T00:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? "" : formatDate(date);
};

const getDisplayName = (row = {}) => row.pseudoName || row.name || row.username || "-";

const getBreakTypeLabel = (type = "") => {
  const map = {
    lunch: "Lunch",
    bio_1: "Short Break 1",
    bio_2: "Short Break 2",
    manual: "Lunch",
    auto_idle: "Auto Idle",
  };
  return map[type] || type || "On Break";
};

const getAttendanceClass = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("half")) return "floor-status-attendance floor-status-attendance-half";
  if (normalized.includes("present")) return "floor-status-attendance floor-status-attendance-present";
  if (normalized.includes("absent") || normalized.includes("leave")) return "floor-status-attendance floor-status-attendance-alert";
  return "floor-status-attendance";
};

const chunkRows = (rows, size) => {
  if (!rows.length) return [[]];
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
};

const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

const usePageSize = () => {
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    const update = () => {
      const height = window.innerHeight || 900;
      setPageSize(Math.max(8, Math.min(18, Math.floor((height - 340) / 52))));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return pageSize;
};

const FloorStatusDashboard = () => {
  const now = useNow();
  const pageSize = usePageSize();
  const [payload, setPayload] = useState({ summary: {}, onBreakRows: [], notLoggedInRows: [] });
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const res = await axios.get(`${API_URL}/punchx/floor-status`, {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
        });
        if (!isMounted) return;
        setPayload(res.data || {});
        setError("");
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || "Unable to load floor status");
      }
    };

    fetchStatus();
    const id = window.setInterval(fetchStatus, DATA_REFRESH_MS);
    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, []);

  const onBreakRows = Array.isArray(payload.onBreakRows) ? payload.onBreakRows : [];
  const notLoggedInRows = Array.isArray(payload.notLoggedInRows) ? payload.notLoggedInRows : [];

  const onBreakPages = useMemo(() => chunkRows(onBreakRows, pageSize), [onBreakRows, pageSize]);
  const notLoggedInPages = useMemo(() => chunkRows(notLoggedInRows, pageSize), [notLoggedInRows, pageSize]);
  const maxPages = Math.max(onBreakPages.length, notLoggedInPages.length, 1);

  useEffect(() => {
    setPage(0);
  }, [pageSize, onBreakRows.length, notLoggedInRows.length]);

  useEffect(() => {
    if (maxPages <= 1) return undefined;
    const id = window.setInterval(() => setPage((current) => (current + 1) % maxPages), PAGE_MS);
    return () => window.clearInterval(id);
  }, [maxPages]);

  const activeBreakRows = onBreakPages[page % onBreakPages.length] || [];
  const inactiveRows = notLoggedInPages[page % notLoggedInPages.length] || [];
  const summary = payload.summary || {};
  const onBreakCount = Number(summary.onBreakCount ?? onBreakRows.length) || 0;
  const notLoggedInCount = Number(summary.notLoggedInCount ?? notLoggedInRows.length) || 0;
  const lateCount = Number(summary.lateLoginCount || 0);
  const displayDate = formatDateKey(payload.dateKey) || formatDate(now);

  return (
    <main className="floor-status-screen">
      <header className="floor-status-topbar">
        <div className="floor-status-brand"><span>F</span>DBS</div>
        <div className="floor-status-clockline">
	          <div className="floor-status-timepiece">
	            <CalendarDays size={30} strokeWidth={2.2} />
	            <span>{displayDate}</span>
	          </div>
          <div className="floor-status-divider" />
          <div className="floor-status-timepiece">
            <Clock3 size={31} strokeWidth={2.2} />
            <span>{formatClock(now)}</span>
          </div>
        </div>
        <div className="floor-status-live"><span />LIVE</div>
      </header>

      <section className="floor-status-kpis">
        <div className="floor-status-kpi floor-status-kpi-break">
          <Coffee size={58} fill="currentColor" strokeWidth={1.8} />
          <div><p>ON BREAK</p><strong>{pad(onBreakCount)}</strong></div>
        </div>
        <div className="floor-status-kpi floor-status-kpi-away">
          <UserRound size={58} fill="currentColor" strokeWidth={1.8} />
          <div><p>NOT LOGGED IN</p><strong>{pad(notLoggedInCount)}</strong></div>
        </div>
        <div className="floor-status-kpi floor-status-kpi-late">
          <Clock3 size={66} strokeWidth={2.8} />
          <div><p>LATE</p><strong>{pad(lateCount)}</strong></div>
        </div>
      </section>

      {error ? <div className="floor-status-error">{error}</div> : null}

      <section className="floor-status-panels">
        <div className="floor-status-panel floor-status-panel-break">
          <div className="floor-status-panel-title">
            <Coffee size={43} fill="currentColor" strokeWidth={1.7} />
            <h1>CURRENTLY ON BREAK ({pad(onBreakCount)})</h1>
          </div>
          <div className="floor-status-table floor-status-table-break">
            <div className="floor-status-row floor-status-head">
	              <span>#</span>
	              <span>EMPLOYEE NAME</span>
	              <span>BREAK TYPE</span>
	              <span>BREAK TIME</span>
	              <span>WORKED TODAY</span>
	              <span>TOTAL BREAK</span>
            </div>
            {activeBreakRows.map((row, index) => (
              <div className="floor-status-row" key={String(row.userId || row.username || index)}>
	                <span>{page * pageSize + index + 1}</span>
	                <span>{getDisplayName(row)}</span>
	                <span>{getBreakTypeLabel(row.breakType)}</span>
	                <span>{formatDuration(now.getTime() - new Date(row.breakStartAt || now).getTime())}</span>
	                <span>{formatDuration(row.totalWorkedMs || 0)}</span>
                <span>{formatDuration(row.totalBreakMs || 0)}</span>
              </div>
            ))}
            {!activeBreakRows.length ? <div className="floor-status-empty">No employees on break</div> : null}
          </div>
        </div>

        <div className="floor-status-panel floor-status-panel-away">
          <div className="floor-status-panel-title">
            <UserRound size={43} fill="currentColor" strokeWidth={1.7} />
            <h1>NOT LOGGED IN ({pad(notLoggedInCount)})</h1>
          </div>
          <div className="floor-status-table floor-status-table-away">
            <div className="floor-status-row floor-status-head">
              <span>#</span>
              <span>EMPLOYEE NAME</span>
              <span>DEPT ATTENDANCE STATUS</span>
            </div>
            {inactiveRows.map((row, index) => {
              const status = row.floorRosterStatus || "Not Marked";
              return (
                <div className="floor-status-row" key={String(row.userId || row.username || index)}>
                  <span>{page * pageSize + index + 1}</span>
                  <span>{getDisplayName(row)}</span>
                  <span className={getAttendanceClass(status)}>{status}</span>
                </div>
              );
            })}
            {!inactiveRows.length ? <div className="floor-status-empty">All roster employees logged in</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FloorStatusDashboard;

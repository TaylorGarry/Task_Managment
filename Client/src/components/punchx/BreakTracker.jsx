import React from "react";
import { formatDuration } from "./utils";

const toIstDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
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

const getDisplayIstDateKey = (session) => {
  const shiftStartAt = session?.shiftStartAt || session?.shiftStartedAt || null;
  if (shiftStartAt) return toIstDateKey(shiftStartAt);

  const now = new Date();
  const istHour = Number.parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(now),
    10
  );
  if (!Number.isNaN(istHour) && istHour < 11) {
    const prev = new Date(now);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return toIstDateKey(prev);
  }
  return toIstDateKey(now);
};

const formatIstDateTime = (value, displayDateKey) => {
  if (!value) return "-";
  const time = new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (!displayDateKey) {
    return `${new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "2-digit",
    })}, ${time}`;
  }
  const [year, month, day] = displayDateKey.split("-").map(Number);
  const displayDate = new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
  });
  return `${displayDate}, ${time}`;
};

const BREAK_LABELS = {
  lunch: "Lunch",
  bio_1: "Short Break 1",
  bio_2: "Short Break 2",
  manual: "Manual Break",
  system_disconnect: "System Disconnect Break",
};

const BreakTracker = ({ session, onStartBreak, onEndBreak }) => {
  const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
  const history = [...(session?.breaks || [])].slice(-5).reverse();
  const displayDateKey = getDisplayIstDateKey(session);

  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0F172A]">Break Management</h3>
        <div className="flex gap-2">
          <button onClick={() => onStartBreak("lunch")} className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Start Break</button>
          <button onClick={onEndBreak} className="rounded-lg border border-[#DBEAFE] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">End Break</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-xs text-[#64748B]">Current Break</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{openBreak ? (BREAK_LABELS[openBreak.type] || "Break") : "None"}</p>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-xs text-[#64748B]">Current Duration</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{openBreak ? formatDuration(Date.now() - new Date(openBreak.startAt).getTime()) : "00:00:00"}</p>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-xs text-[#64748B]">Total Break Time</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{formatDuration(session?.totalBreakMs || 0)}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Break History</p>
        <div className="mt-2 space-y-2">
          {history.length === 0 && <p className="text-xs text-[#64748B]">No breaks logged.</p>}
          {history.map((item, idx) => (
            <div key={`${item.startAt}-${idx}`} className="rounded-lg border border-[#E2E8F0] p-2 text-xs text-[#334155]">
              <div className="font-medium">{BREAK_LABELS[item.type] || "Break"}</div>
              <div>{formatIstDateTime(item.startAt, displayDateKey)} - {formatIstDateTime(item.endAt, displayDateKey)}</div>
              <div>Duration: {formatDuration(item.durationMs || 0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BreakTracker;

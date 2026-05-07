import React from "react";
import { formatDuration, formatDateTime } from "./utils";

const BREAK_LABELS = {
  manual: "Manual Break",
  auto_idle: "Auto Idle Break",
  system_disconnect: "System Disconnect Break",
};

const BreakTracker = ({ session, onStartBreak, onEndBreak }) => {
  const openBreak = session?.breaks?.find((b) => !b.endAt) || null;
  const history = [...(session?.breaks || [])].slice(-5).reverse();

  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0F172A]">Break Management</h3>
        <div className="flex gap-2">
          <button onClick={() => onStartBreak("manual")} className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Start Break</button>
          <button onClick={onEndBreak} className="rounded-lg border border-[#DBEAFE] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">End Break</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-xs text-[#64748B]">Current Break</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{openBreak ? BREAK_LABELS[openBreak.type] : "None"}</p>
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
              <div className="font-medium">{BREAK_LABELS[item.type]}</div>
              <div>{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</div>
              <div>Duration: {formatDuration(item.durationMs || 0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BreakTracker;

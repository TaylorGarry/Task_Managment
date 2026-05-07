import React from "react";
import { formatDateTime, statusClasses, statusLabel } from "./utils";

const IdleMonitor = ({ activityStatus, lastActivityAt, autoBreakStartedAt }) => {
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A]">Current Status</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[activityStatus] || statusClasses.no_activity}`}>
          {statusLabel(activityStatus)}
        </span>
      </div>
      <p className="mt-3 text-xs text-[#64748B]">Last Activity: {formatDateTime(lastActivityAt)}</p>
      <p className="mt-1 text-xs text-[#64748B]">Auto Break Started: {formatDateTime(autoBreakStartedAt)}</p>
    </div>
  );
};

export default IdleMonitor;

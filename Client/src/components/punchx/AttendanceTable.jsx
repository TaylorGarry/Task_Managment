import React from "react";
import { formatDuration, formatDateTime, statusClasses } from "./utils";

const AttendanceTable = ({ rows = [] }) => {
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A]">Live Attendance Grid</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-left text-[#64748B]">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Activity Status</th>
              <th className="px-2 py-2">Idle Time</th>
              <th className="px-2 py-2">Break Type</th>
              <th className="px-2 py-2">Total Break</th>
              <th className="px-2 py-2">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-[#F1F5F9] text-[#0F172A]">
                <td className="px-2 py-2">{row.name}</td>
                <td className="px-2 py-2"><span className={`rounded-full px-2 py-1 ${statusClasses[row.activityStatus] || statusClasses.no_activity}`}>{row.activityStatus}</span></td>
                <td className="px-2 py-2">{formatDuration(row.idleTimeMs || 0)}</td>
                <td className="px-2 py-2">{row.breakType || "-"}</td>
                <td className="px-2 py-2">{formatDuration(row.totalBreakMs || 0)}</td>
                <td className="px-2 py-2">{formatDateTime(row.lastActivityAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-2 py-3 text-[#64748B]" colSpan={6}>No team rows found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;

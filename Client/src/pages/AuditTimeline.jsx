import React, { memo } from "react";
import { formatExitDateTime } from "../services/employeeExitService.js";

const getActorName = (actor = {}) => actor?.realName || actor?.pseudoName || actor?.username || "System";

const AuditTimeline = memo(({ logs = [], loading = false }) => {
  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading audit logs...</div>;
  }

  if (!logs.length) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">No audit logs found.</div>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Audit Timeline</h2>
      <div className="mt-4 space-y-4">
        {logs.map((log) => (
          <div key={log._id} className="relative border-l border-slate-200 pl-4">
            <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-700" />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {getActorName(log.performedBy)} · {log.department || "System"}
                </p>
                {log.remarks ? <p className="mt-2 text-sm text-slate-600">{log.remarks}</p> : null}
              </div>
              <p className="text-xs text-slate-500">{formatExitDateTime(log.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AuditTimeline.displayName = "AuditTimeline";

export default AuditTimeline;

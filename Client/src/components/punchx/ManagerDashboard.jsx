import React from "react";
import AttendanceTable from "./AttendanceTable";

const ManagerDashboard = ({ rows = [] }) => {
  const loggedIn = rows.filter((r) => r.activityStatus === "active").length;
  const onBreak = rows.filter((r) => ["manual_break", "auto_break"].includes(r.activityStatus)).length;
  const idle = rows.filter((r) => r.activityStatus === "idle_warning").length;
  const noActivity = rows.filter((r) => r.activityStatus === "no_activity").length;
  const total = rows.length || 1;

  const Metric = ({ label, value, tone = "text-[#0F172A]" }) => (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <p className="text-xs text-[#64748B]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );

  return (
    <section className="mb-8 rounded-[14px] border border-[#E2E8F0] bg-white p-4 md:p-6">
      <div className="mb-4 rounded-xl bg-[#0B2A6F] px-4 py-2 text-white">
        <h2 className="text-lg font-semibold">2. Manager Dashboard</h2>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">Top Control Panel (Real-Time Floor View)</h2>
        <p className="text-sm text-[#64748B]">Live workforce visibility with idle and break intelligence.</p>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Total Agents" value={rows.length} />
        <Metric label="Logged In" value={`${loggedIn} (${Math.round((loggedIn / total) * 100)}%)`} tone="text-[#16A34A]" />
        <Metric label="Idle Warning" value={idle} tone="text-[#D97706]" />
        <Metric label="On Break" value={onBreak} tone="text-[#2563EB]" />
        <Metric label="No Activity" value={noActivity} tone="text-[#DC2626]" />
      </div>
      <AttendanceTable rows={rows} />
    </section>
  );
};

export default ManagerDashboard;

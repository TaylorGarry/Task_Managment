import React from "react";

const AlertsPanel = ({ session }) => {
  const alerts = [...(session?.alerts || [])].slice(-6).reverse();
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A]">Alerts</h3>
      <div className="mt-3 space-y-2">
        {alerts.length === 0 && <p className="text-xs text-[#64748B]">No active alerts.</p>}
        {alerts.map((a, idx) => (
          <div key={`${a.at}-${idx}`} className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-2 text-xs text-[#92400E]">
            <p className="font-semibold">{a.type || "Notice"}</p>
            <p>{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;

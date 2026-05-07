export const formatDuration = (ms = 0) => {
  const safe = Number(ms || 0);
  const totalSec = Math.max(0, Math.floor(safe / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const statusClasses = {
  active: "bg-emerald-100 text-emerald-700",
  idle_warning: "bg-amber-100 text-amber-700",
  auto_break: "bg-blue-100 text-blue-700",
  manual_break: "bg-indigo-100 text-indigo-700",
  no_activity: "bg-slate-100 text-slate-600",
};

export const statusLabel = (value = "") =>
  ({
    active: "On Shift",
    idle_warning: "Idle Warning",
    auto_break: "Auto Break",
    manual_break: "Manual Break",
    no_activity: "No Activity",
  }[value] || "No Activity");

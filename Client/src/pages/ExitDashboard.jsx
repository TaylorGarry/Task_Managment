import React, { memo } from "react";
import { BadgeDollarSign, CheckCircle2, CircleX, Clock3, Hourglass, ShieldCheck, UserRound, Workflow } from "lucide-react";

const cards = [
  { key: "noticePeriod", label: "Notice Period", icon: UserRound },
  { key: "itVerificationPending", label: "IT Verification Pending", icon: ShieldCheck },
  { key: "hrClearancePending", label: "HR Clearance Pending", icon: Workflow },
  { key: "accountsClearancePending", label: "Accounts FNF Pending", icon: BadgeDollarSign },
  { key: "waitingForLastWorkingDay", label: "Waiting For Last Working Day", icon: Hourglass },
  { key: "completedExits", label: "Completed Exits", icon: CheckCircle2 },
  { key: "revokedExits", label: "Revoked Exits", icon: CircleX },
  { key: "overdueItClearances", label: "Overdue IT Clearances", icon: Clock3 },
  { key: "overdueHrClearances", label: "Overdue HR Clearances", icon: Clock3 },
  { key: "overdueAccountsClearances", label: "Overdue Accounts FNF", icon: Clock3 },
];

const ExitDashboard = memo(({ dashboard = {} }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map(({ key, label, icon: Icon }) => (
      <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(dashboard[key] || 0)}</p>
          </div>
          <div className="grid h-10 w-10 place-content-center rounded-lg bg-slate-50 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

ExitDashboard.displayName = "ExitDashboard";

export default ExitDashboard;

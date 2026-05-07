import React from "react";

const ProgressRow = ({ label, value }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-semibold text-[#0F172A]">{value}/25</span>
    </div>
    <div className="h-2 rounded-full bg-[#DBEAFE]">
      <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: `${Math.max(0, Math.min(100, (value / 25) * 100))}%` }} />
    </div>
  </div>
);

const AttendanceScoreCard = ({ attendanceScore }) => {
  const breakdown = attendanceScore?.breakdown || {};
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A]">Attendance Score</h3>
      <p className="mt-1 text-2xl font-bold text-[#2563EB]">{attendanceScore?.total ?? 0}<span className="text-sm text-[#64748B]">/100</span></p>
      <div className="mt-4 space-y-3">
        <ProgressRow label="On-time login" value={breakdown.onTimeLogin || 0} />
        <ProgressRow label="Shift completion" value={breakdown.shiftCompletion || 0} />
        <ProgressRow label="Break discipline" value={breakdown.breakDiscipline || 0} />
        <ProgressRow label="Idle discipline" value={breakdown.idleDiscipline || 0} />
      </div>
    </div>
  );
};

export default AttendanceScoreCard;

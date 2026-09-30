import React from "react";

const formatValue = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const EmployeeCreateConfirmModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  summary = {},
}) => {
  if (!open) return null;

  const rows = [
    { label: "Username", value: summary.username },
    { label: "Account Type", value: summary.accountType },
    { label: "Department", value: summary.department },
    { label: "Real Name", value: summary.realName },
    { label: "Pseudo Name", value: summary.pseudoName },
    { label: "Employee ID", value: summary.empId },
    { label: "Date of Joining", value: summary.dateOfJoining },
    { label: "Designation", value: summary.designation },
    { label: "Reporting Manager", value: summary.reportingManagerLabel },
    { label: "Transport Office", value: summary.transportOffice },
    { label: "Docs Status", value: summary.docsStatus },
    { label: "Shift", value: summary.shiftLabel },
    { label: "Core Team", value: summary.isCoreTeam },
    { label: "Team Leader Eligible", value: summary.isTeamLeader },
    { label: "Documents", value: summary.documentsCount },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Confirm Submission</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Review Employee Details</h3>
        </div>
        <div className="max-h-[60vh] overflow-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{row.label}</p>
                <p className="text-sm font-medium text-slate-800">{formatValue(row.value)}</p>
              </div>
            ))}
          </div>
          {Array.isArray(summary.documentNames) && summary.documentNames.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-xs font-semibold text-slate-600">Document Names</p>
              <p className="mt-1 text-sm text-slate-800">{summary.documentNames.join(", ")}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Confirm & Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCreateConfirmModal;

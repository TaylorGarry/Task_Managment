import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, BadgeDollarSign, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import AccountsClearance from "./AccountsClearance.jsx";
import AuditTimeline from "./AuditTimeline.jsx";
import HRClearance from "./HRClearance.jsx";
import ITVerification from "./ITVerification.jsx";
import {
  EXIT_STATUS_LABELS,
  EXIT_TYPE_LABELS,
  employeeExitApi,
  formatExitDate,
  formatExitDateTime,
  getExitEmployeeName,
  getStatusClass,
} from "../services/employeeExitService.js";
import { isAccountsDepartment, isHrDepartment, isSuperAdmin, normalizeDepartment } from "../utils/roleAccess.js";

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</p>
  </div>
);

const boolLabel = (value) => (value ? "Yes" : "No");

const checklistRows = (items = []) => (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {items.map(([label, value]) => (
      <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={value ? "font-semibold text-emerald-700" : "text-slate-400"}>{boolLabel(value)}</span>
      </div>
    ))}
  </div>
);

const EmployeeExitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [approving, setApproving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const role = useMemo(() => {
    if (isSuperAdmin(user)) return "superAdmin";
    if (isHrDepartment(user)) return "HR";
    if (isAccountsDepartment(user)) return "Accounts";
    if (normalizeDepartment(user?.department) === "IT") return "IT";
    return "employee";
  }, [user]);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeExitApi.details(id);
      setData(res.data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load exit details");
      navigate("/employee-exits");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadAuditLogs = useCallback(async () => {
    if (role !== "superAdmin") return;
    try {
      setLoadingLogs(true);
      const res = await employeeExitApi.auditLogs(id);
      setLogs(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [id, role]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const refresh = async () => {
    await Promise.all([loadDetails(), loadAuditLogs()]);
  };

  const submitFinalApproval = async () => {
    try {
      setApproving(true);
      await employeeExitApi.finalApproval(id, { remarks: "Final approval submitted" });
      toast.success("Final approval submitted");
      await refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit final approval");
    } finally {
      setApproving(false);
    }
  };

  const revokeExit = async () => {
    const confirmed = window.confirm("Revoke this employee exit?");
    if (!confirmed) return;

    try {
      setRevoking(true);
      await employeeExitApi.revoke(id, { remarks: "Exit revoked by HR" });
      toast.success("Employee exit revoked");
      await refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to revoke employee exit");
    } finally {
      setRevoking(false);
    }
  };

  const exit = data?.exit;
  const itChecklist = data?.itChecklist;
  const hrChecklist = data?.hrChecklist;
  const accountsChecklist = data?.accountsChecklist;

  if (loading && !exit) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading exit details...</div>;
  }

  if (!exit) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Employee exit not found.</div>;
  }

  const employee = exit.employeeId || {};
  const canSubmitIT = role === "IT" && exit.status === "it_verification_pending";
  const canSubmitHR = role === "HR" && exit.status === "hr_clearance_pending";
  const canSubmitAccounts = role === "Accounts" && exit.status === "accounts_clearance_pending";
  const canFinalApprove = role === "superAdmin" && exit.status === "superadmin_approval_pending";
  const canRevoke = role === "HR" && !["exit_completed", "exit_revoked"].includes(exit.status);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/employee-exits" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee Exit</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{getExitEmployeeName(employee)}</h1>
              <p className="mt-1 text-sm text-slate-500">{employee.empId || employee.username || "-"}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(exit.status)}`}>
              {EXIT_STATUS_LABELS[exit.status] || exit.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Department" value={employee.department} />
            <Info label="Exit Type" value={EXIT_TYPE_LABELS[exit.exitType] || "-"} />
            <Info label="Resignation Date" value={formatExitDate(exit.resignationDate)} />
            <Info label="Last Working Date" value={formatExitDate(exit.lastWorkingDate)} />
            <Info label="Completed At" value={formatExitDateTime(exit.exitCompletedAt)} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Info label="Reason" value={exit.reason} />
            <Info label="Remarks" value={exit.remarks} />
          </div>
        </div>

        {canFinalApprove ? (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-900">Final approval pending</p>
                <p className="text-sm text-violet-700">Approval moves the exit to last-working-day scheduling.</p>
              </div>
              <button
                type="button"
                disabled={approving}
                onClick={submitFinalApproval}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approving ? "Approving..." : "Final Approval"}
              </button>
            </div>
          </div>
        ) : null}

        {canRevoke ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Revoke exit</p>
                <p className="text-sm text-rose-700">This stops the active exit workflow.</p>
              </div>
              <button
                type="button"
                disabled={revoking}
                onClick={revokeExit}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {revoking ? "Revoking..." : "Revoke Exit"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {canSubmitIT ? (
            <ITVerification exitId={id} onSubmitted={refresh} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-semibold text-slate-900">IT Checklist</h2>
              </div>
              <div className="mt-4">
                {itChecklist
                  ? checklistRows([
                      ["Laptop returned", itChecklist.laptopReturned],
                      ["Charger returned", itChecklist.chargerReturned],
                      ["ID card returned", itChecklist.idCardReturned],
                      ["Email disabled", itChecklist.emailDisabled],
                      ["CRM access removed", itChecklist.crmAccessRemoved],
                      ["Gate punch removed", itChecklist.gatePunchRemoved],
                      ["VPN removed", itChecklist.vpnRemoved],
                      ["GitHub removed", itChecklist.githubRemoved],
                      ["Google Workspace removed", itChecklist.googleWorkspaceRemoved],
                      ["Slack removed", itChecklist.slackRemoved],
                    ])
                  : <p className="text-sm text-slate-500">IT checklist not submitted yet.</p>}
              </div>
            </div>
          )}

          {canSubmitHR ? (
            <HRClearance exitId={id} onSubmitted={refresh} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">HR Checklist</h2>
              <div className="mt-4">
                {hrChecklist
                  ? checklistRows([
                      ["Exit interview done", hrChecklist.exitInterviewDone],
                      ["Leave adjusted", hrChecklist.leaveAdjusted],
                      ["Experience letter issued", hrChecklist.experienceLetterIssued],
                      ["Relieving letter issued", hrChecklist.relievingLetterIssued],
                      ["Documents uploaded", hrChecklist.documentsUploaded],
                    ])
                  : <p className="text-sm text-slate-500">HR checklist not submitted yet.</p>}
	              </div>
	            </div>
	          )}

          {canSubmitAccounts ? (
            <AccountsClearance exitId={id} onSubmitted={refresh} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-teal-700" />
                <h2 className="text-base font-semibold text-slate-900">Accounts FNF Checklist</h2>
              </div>
              <div className="mt-4">
                {accountsChecklist
                  ? checklistRows([
                      ["Salary dues calculated", accountsChecklist.salaryDuesCalculated],
                      ["Incentives calculated", accountsChecklist.incentivesCalculated],
                      ["Leave encashment calculated", accountsChecklist.leaveEncashmentCalculated],
                      ["Statutory dues checked", accountsChecklist.statutoryDuesChecked],
                      ["Recoveries adjusted", accountsChecklist.recoveriesAdjusted],
                      ["FNF processed", accountsChecklist.fnfProcessed],
                    ])
                  : <p className="text-sm text-slate-500">Accounts FNF checklist not submitted yet.</p>}
              </div>
            </div>
          )}
        </div>

        {role === "superAdmin" ? <AuditTimeline logs={logs} loading={loadingLogs} /> : null}
      </div>
    </div>
  );
};

export default EmployeeExitDetails;

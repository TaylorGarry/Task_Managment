import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createDelegation,
  endDelegationEarly,
  fetchActiveDelegations,
  fetchDelegationHistory,
  fetchMyDelegatedWork,
  fetchMyDelegations,
  fetchTeamLeaders,
  fetchTeamMembers,
  selectActiveDelegations,
  selectCreateError,
  selectDelegationCreating,
  selectDelegationError,
  selectDelegationLoading,
  selectDelegationHistory,
  selectDelegationEnding,
  selectHistoryLoading,
  selectMyDelegatedWork,
  selectMyDelegations,
  selectTeamLeaders,
  selectTeamMembers,
} from "../features/slices/delegationSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import { Calendar, Users, UserCheck, Clock, AlertCircle, CheckCircle, XCircle, FileText, RefreshCw, Plus, Trash2, History } from "lucide-react";

const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getStatusBadge = (status) => {
  switch (status) {
    case "active":
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><CheckCircle className="h-3 w-3" />Active</span>;
    case "expired":
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"><Clock className="h-3 w-3" />Expired</span>;
    case "ended_early":
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><XCircle className="h-3 w-3" />Ended Early</span>;
    default:
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{status}</span>;
  }
};

const getId = (obj) => obj?._id || obj?.id || "";

const DelegationPage = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const currentUser = authUser || JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = ["HR", "superAdmin"].includes(currentUser?.accountType);

  const activeDelegations = useSelector(selectActiveDelegations);
  const myDelegatedWork = useSelector(selectMyDelegatedWork);
  const myDelegations = useSelector(selectMyDelegations);
  const teamLeaders = useSelector(selectTeamLeaders);
  const teamMembers = useSelector(selectTeamMembers);
  const history = useSelector(selectDelegationHistory);
  const loading = useSelector(selectDelegationLoading);
  const historyLoading = useSelector(selectHistoryLoading);
  const creating = useSelector(selectDelegationCreating);
  const ending = useSelector(selectDelegationEnding);
  const error = useSelector(selectDelegationError);
  const createError = useSelector(selectCreateError);
  const employees = useSelector((state) => state.auth.employees || []);

  const [delegatorId, setDelegatorId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState("leave");
  const [notes, setNotes] = useState("");
  const [historyLeaderId, setHistoryLeaderId] = useState("");
  const [endReasonById, setEndReasonById] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const hasLoadedRef = useRef(false);

  const safeActiveDelegations = Array.isArray(activeDelegations) ? activeDelegations : [];
  const safeMyDelegatedWork = Array.isArray(myDelegatedWork) ? myDelegatedWork : [];
  const safeMyDelegations = Array.isArray(myDelegations) ? myDelegations : [];
  const safeTeamLeaders = Array.isArray(teamLeaders) ? teamLeaders : [];
  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const myDelegationRows = useMemo(() => {
    const rows = [];
    const seen = new Set();

    safeMyDelegations.forEach((d) => {
      const id = getId(d);
      if (!id || seen.has(id)) return;
      seen.add(id);
      rows.push({
        id,
        role: "Assignee",
        counterpart: d.delegator?.username || "-",
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status || "-",
      });
    });

    safeMyDelegatedWork.forEach((d) => {
      const id = getId(d);
      if (!id || seen.has(id)) return;
      seen.add(id);
      rows.push({
        id,
        role: "Delegator",
        counterpart: d.assignee?.username || "-",
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status || "-",
      });
    });

    return rows;
  }, [safeMyDelegations, safeMyDelegatedWork]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    dispatch(fetchMyDelegations());
    dispatch(fetchMyDelegatedWork());
    if (isAdmin) {
      dispatch(fetchActiveDelegations());
      dispatch(fetchTeamLeaders());
      dispatch(fetchEmployees());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !delegatorId) return;
    dispatch(fetchTeamMembers(delegatorId));
  }, [dispatch, isAdmin, delegatorId]);

  useEffect(() => {
    if (!isAdmin || !historyLeaderId) return;
    dispatch(fetchDelegationHistory(historyLeaderId));
  }, [dispatch, isAdmin, historyLeaderId]);

  const assigneeOptions = useMemo(() => {
    return (employees || []).filter((emp) => {
      const empId = getId(emp);
      return Boolean(empId) && empId !== delegatorId;
    });
  }, [employees, delegatorId]);

  const teamLeaderOptions = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.filter((emp) => Boolean(getId(emp)));
  }, [employees]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await dispatch(
      createDelegation({
        delegatorId,
        assigneeId,
        startDate,
        endDate,
        reason,
        notes,
      })
    ).unwrap();
    dispatch(fetchActiveDelegations());
    dispatch(fetchMyDelegations());
    dispatch(fetchMyDelegatedWork());
    if (historyLeaderId) dispatch(fetchDelegationHistory(historyLeaderId));
    setShowCreateForm(false);
    setDelegatorId("");
    setAssigneeId("");
    setNotes("");
  };

  const handleEnd = async (delegationId) => {
    const reasonText = endReasonById[delegationId] || "Ended by admin";
    await dispatch(endDelegationEarly({ delegationId, reason: reasonText })).unwrap();
    dispatch(fetchActiveDelegations());
    dispatch(fetchMyDelegations());
    dispatch(fetchMyDelegatedWork());
    if (historyLeaderId) dispatch(fetchDelegationHistory(historyLeaderId));
  };

  const visibleHistory = historyLeaderId ? safeHistory : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="rounded-2xl mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between ">
            <div>
              <h1 className="text-3xl font-bold">Delegation Management</h1>
              <p className="mt-1 text-indigo-100">Manage temporary authority assignments and track delegation history</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30"
              >
                <Plus className="h-4 w-4" />
                {showCreateForm ? "Cancel" : "New Delegation"}
              </button>
            )}
          </div>
          {(error || createError) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-white">
              <AlertCircle className="h-4 w-4" />
              {createError || error}
            </div>
          )}
        </div>

        {/* Create Delegation Form */}
        {isAdmin && showCreateForm && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create New Delegation</h2>
            </div>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Team Leader</label>
                  <select
                    value={delegatorId}
                    onChange={(e) => setDelegatorId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select team leader</option>
                    {(teamLeaderOptions.length > 0 ? teamLeaderOptions : safeTeamLeaders).map((tl) => (
                      <option key={getId(tl)} value={getId(tl)}>
                        {tl.username} ({tl.department || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Assigned To</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select assignee</option>
                    {assigneeOptions.map((emp) => (
                      <option key={getId(emp)} value={getId(emp)}>
                        {emp.username} ({emp.department || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="leave">Leave</option>
                    <option value="weekoff">Week Off</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes about this delegation..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {delegatorId && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Affected Team Members</h3>
                    <span className="ml-auto text-xs text-gray-500">{safeTeamMembers.length} members</span>
                  </div>
                  <div className="mt-2 max-h-32 overflow-auto rounded border border-gray-200 bg-white">
                    {safeTeamMembers.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-500">No members found under this team leader</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {safeTeamMembers.map((m) => (
                          <div key={`${m.userId}-${m.name}`} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span>{m.name}</span>
                            <span className="text-xs text-gray-400">{m.department || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !delegatorId || !assigneeId}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Delegation"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Delegations */}
        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Active Delegations</h2>
              </div>
              <button
                onClick={() => dispatch(fetchActiveDelegations())}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-all hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Delegator</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assignee</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {safeActiveDelegations.map((d) => (
                    <tr key={getId(d)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.delegator?.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.assignee?.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(d.startDate)} - {formatDate(d.endDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.reason || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={endReasonById[getId(d)] || ""}
                            onChange={(e) => setEndReasonById((prev) => ({ ...prev, [getId(d)]: e.target.value }))}
                            placeholder="End reason"
                            className="w-32 rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleEnd(getId(d))}
                            disabled={ending}
                            className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            End
                          </button>
                          <button
                            onClick={() => setHistoryLeaderId(getId(d.delegator) || "")}
                            className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            <History className="h-3 w-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {safeActiveDelegations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {loading ? "Loading..." : "No active delegations"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* My Delegations Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">My Delegations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myDelegationRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.role === "Assignee" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.counterpart}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(row.startDate)} - {formatDate(row.endDate)}</td>
                    <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                  </tr>
                ))}
                {myDelegationRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      {loading ? "Loading..." : "No delegations found for your account"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delegation History */}
        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Delegation History</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={historyLeaderId}
                  onChange={(e) => setHistoryLeaderId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select team leader</option>
                  {(safeTeamLeaders.length > 0 ? safeTeamLeaders : teamLeaderOptions).map((tl) => (
                    <option key={getId(tl)} value={getId(tl)}>
                      {tl.username} ({tl.department || "N/A"})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => historyLeaderId && dispatch(fetchDelegationHistory(historyLeaderId))}
                  disabled={!historyLeaderId || historyLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {historyLoading ? "Loading..." : "Load History"}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assigned To</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">End Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleHistory.map((h) => (
                    <tr key={getId(h)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.assignee?.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(h.startDate)} - {formatDate(h.endDate)}</td>
                      <td className="px-4 py-3">{getStatusBadge(h.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {h.status === "ended_early"
                          ? `Ended early: ${formatDate(h.endedEarlyAt)}${h.endedEarlyReason ? ` (${h.endedEarlyReason})` : ""}`
                          : `Expired: ${formatDate(h.endDate)}`}
                      </td>
                    </tr>
                  ))}
                  {visibleHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        {!historyLeaderId
                          ? "Select a team leader to view delegation history"
                          : historyLoading
                            ? "Loading..."
                            : "No delegation history found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DelegationPage;

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RefreshCw, RotateCcw, Send, TicketCheck, Search, FileText, User, Calendar, CheckCircle, HelpCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { getApiBaseUrl } from "../utils/apiUrl";
import { getRoleLabel, normalizeDepartment } from "../utils/roleAccess";

const API_URL = getApiBaseUrl();
const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

// Enhanced Status Styles for a premium UI feel
const statusClass = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200/60 ring-1 ring-amber-600/10",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-1 ring-emerald-600/10",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200/60 ring-1 ring-rose-600/10",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCreatorName = (ticket) => {
  const creator = ticket?.createdBy || {};
  return creator.realName || creator.pseudoName || creator.username || "User";
};

const TicketManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const isITUser = normalizeDepartment(user?.department) === "IT";
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [sourceTicket, setSourceTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${user?.token}` }),
    [user?.token]
  );

  const fetchTickets = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const endpoint = isITUser ? "/tickets/it" : "/tickets/my";
      const res = await axios.get(`${API_URL}${endpoint}`, { headers });
      const fetchedTickets = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
      setTickets(fetchedTickets);
      setFilteredTickets(fetchedTickets);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isITUser, user?.token]);

  // Search functionality - only for IT users
  useEffect(() => {
    if (!isITUser) {
      setFilteredTickets(tickets);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredTickets(tickets);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = tickets.filter((ticket) => {
      const creatorName = getCreatorName(ticket).toLowerCase();
      return creatorName.includes(query);
    });
    setFilteredTickets(filtered);
  }, [searchQuery, tickets, isITUser]);

  const resetForm = () => {
    setForm({ title: "", description: "" });
    setSourceTicket(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title,
        description,
        reRaisedFrom: sourceTicket?._id || undefined,
      };
      const res = await axios.post(`${API_URL}/tickets`, payload, { headers });
      toast.success(res.data?.message || "Ticket submitted");
      resetForm();
      await fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      setUpdatingId(ticketId);
      const res = await axios.patch(
        `${API_URL}/tickets/${ticketId}/status`,
        { status },
        { headers }
      );
      setTickets((prev) =>
        prev.map((ticket) => (ticket._id === ticketId ? res.data.ticket : ticket))
      );
      toast.success("Ticket status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId("");
    }
  };

  const handleReRaise = (ticket) => {
    setSourceTicket(ticket);
    setForm({
      title: ticket.title || "",
      description: ticket.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dynamically calculate columns for responsive colSpan
  const totalColumns = isITUser ? 6 : 6; 

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8 font-sans antialiased selection:bg-blue-500/10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between transition-all duration-300">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              {isITUser ? "IT Dashboard" : "Ticket Center"}
            </div>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">
              {isITUser ? "Raised Tickets History" : "My Support Tickets"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 max-w-xl">
              {isITUser
                ? "Manage incoming organizational issues, track updates, and process ticket resolutions seamlessly."
                : "Need help? File an incident report or tracking request below and get assistance from our IT support desk."}
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-98 disabled:opacity-50"
            >
              <RefreshCw size={15} className={`text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* User - Create / Re-raise Ticket Form */}
        {!isITUser && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_12px_-5px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${sourceTicket ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {sourceTicket ? "Re-Raise Existing Incident" : "Create New Support Ticket"}
                  </h2>
                  {sourceTicket && (
                    <p className="mt-0.5 text-xs font-medium text-amber-600">
                      Linking updates to: <span className="underline">{sourceTicket.title}</span>
                    </p>
                  )}
                </div>
              </div>
              {sourceTicket && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancel Re-raise
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Issue Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    maxLength={160}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                    placeholder="Briefly state the issue..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Detailed Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={1}
                    maxLength={3000}
                    className="mt-2 min-h-[44px] h-11 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                    placeholder="Provide context, error messages, or steps to reproduce..."
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 active:scale-98 disabled:opacity-60"
                >
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {submitting ? "Submitting Request..." : sourceTicket ? "Confirm Re-Raise" : "Dispatch Ticket"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Tickets Grid/Table Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_12px_-5px_rgba(0,0,0,0.05)] transition-all duration-300">
          
          {/* Table Control Header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <TicketCheck size={18} />
              </div>
              <h2 className="text-base font-bold">
                {isITUser ? "All Corporate Logs" : "Personal Tracking Ledger"}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {isITUser && (
                <div className="relative min-w-[240px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by ticket creator..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                  />
                </div>
              )}
              <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 h-10 text-xs font-semibold text-slate-600 border border-slate-200/40">
                {filteredTickets.length} Entries
              </span>
            </div>
          </div>

          {/* Clean Modern Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5 font-bold">Incident / Context</th>
                  {isITUser && <th className="px-5 py-3.5 font-bold">Reporter</th>}
                  <th className="px-5 py-3.5 font-bold">Logs Created</th>
                  <th className="px-5 py-3.5 font-bold">Current Status</th>
                  <th className="px-5 py-3.5 font-bold">Closed Date</th>
                  <th className="px-5 py-3.5 font-bold">Lineage</th>
                  {!isITUser && <th className="px-5 py-3.5 font-bold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={totalColumns} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-slate-500">Retrieving secure logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <HelpCircle size={28} className="text-slate-300" />
                        <h3 className="text-sm font-semibold text-slate-900">No records discovered</h3>
                        <p className="text-xs text-slate-500">
                          {searchQuery && isITUser 
                            ? "Adjust your filter terms. We couldn't match any employee profiles." 
                            : "Excellent! No outstanding hardware or software malfunctions reported."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="group transition-colors hover:bg-slate-50/50 align-top">
                      
                      {/* Ticket Issue Info */}
                      <td className="max-w-xs md:max-w-sm px-5 py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {ticket.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </div>
                      </td>

                      {/* IT Only: User Identity Details */}
                      {isITUser && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <User size={13} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{getCreatorName(ticket)}</div>
                              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                {getRoleLabel(ticket.createdBy)} • {ticket.creatorDepartment || "Staff"}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Created DateTime */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {formatDateTime(ticket.createdAt)}
                        </div>
                      </td>

                      {/* Status Pillar / Select dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isITUser ? (
                          <div className="relative inline-block">
                            <select
                              value={ticket.status}
                              disabled={updatingId === ticket._id}
                              onChange={(event) => handleStatusChange(ticket._id, event.target.value)}
                              className="h-8 rounded-lg border border-slate-200 bg-white pl-2 pr-6 text-xs font-semibold text-slate-700 outline-none transition-all shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 appearance-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0"></span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm ${statusClass[ticket.status] || statusClass.Pending}`}>
                            {ticket.status}
                          </span>
                        )}
                      </td>

                      {/* Closed At */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                        {ticket.closedAt ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-fit">
                            <CheckCircle size={12} />
                            {formatDateTime(ticket.closedAt)}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Processing...</span>
                        )}
                      </td>

                      {/* FIX: Removed max-w and line-clamp to allow natural full text wrapping */}
                      <td className="px-5 py-4 text-xs min-w-[150px] max-w-xs whitespace-normal">
                        {ticket.reRaisedFrom ? (
                          <div className="text-[11px] font-medium text-amber-700 bg-amber-50/60 border border-amber-100 rounded-xl p-2 break-words shadow-sm">
                            Ref: {ticket.reRaisedFrom.title}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                            Original Node
                          </span>
                        )}
                      </td>

                      {/* Employee Action Tools */}
                      {!isITUser && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleReRaise(ticket)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/50 px-3 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                          >
                            <RotateCcw size={12} />
                            Re-Open Issue
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TicketManagement;
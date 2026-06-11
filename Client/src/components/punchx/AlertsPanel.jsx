import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/apiUrl";

const PAGE_SIZE = 5;

const formatIstDateTime = (value) => {
  if (!value) return "Running";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDuration = (ms = 0) => {
  const safe = Math.max(0, Number(ms) || 0);
  const totalMinutes = Math.floor(safe / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const getReasonLabel = (reason = "") => {
  const value = String(reason || "").trim();
  if (!value || value === "auto_9h" || value === "auto_window" || value === "manual") return "";
  return value;
};

const AlertsPanel = ({ session, token }) => {
  const alerts = useMemo(() => [...(session?.alerts || [])].slice(-6).reverse(), [session?.alerts]);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let alive = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const API_URL = getApiBaseUrl();
        const res = await axios.get(`${API_URL}/punchx/session/history`, {
          params: { page, limit: PAGE_SIZE },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!alive) return;
        setHistory(Array.isArray(res?.data?.items) ? res.data.items : []);
        setPagination(res?.data?.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "Failed to load session history.");
        setHistory([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      alive = false;
    };
  }, [page, token, session?.shiftStartAt, session?.shiftEndAt, session?.status, session?.alerts?.length]);

  const historyRows = history;

  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0F172A]">Daily login Status</h3>
        <span className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
          Session History
        </span>
      </div>

      

      <div className="mt-4 border-t border-[#E2E8F0] pt-4">
       

        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-xs text-[#64748B]">Loading history...</p>
          ) : error ? (
            <p className="text-xs text-rose-600">{error}</p>
          ) : historyRows.length === 0 ? (
            <p className="text-xs text-[#64748B]">No login/logout history found.</p>
          ) : (
            historyRows.map((item) => {
              const completed = Boolean(item.logoutTime);
              return (
                <div key={item.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-[#334155]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0F172A]">{item.dateKey || "--"}</p>
                      <p className="mt-1 text-[11px] text-[#64748B]">
                        Login: {formatIstDateTime(item.loginTime)}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Logout: {formatIstDateTime(item.logoutTime)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        item.logoutReason === "auto_9h"
                          ? "bg-red-700 text-amber-700"
                          : completed
                            ? "bg-green-700 text-emerald-700"
                            : "bg-sky-100 text-sky-700"
                      }`}>
                        {getReasonLabel(item.logoutReason)}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {completed ? formatDuration(item.totalWorkedMs || 0) : "Running"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || page <= 1}
            className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-[11px] font-semibold text-[#64748B]">
            Page {pagination.page || page} / {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.totalPages || 1, current + 1))}
            disabled={loading || page >= (pagination.totalPages || 1)}
            className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;

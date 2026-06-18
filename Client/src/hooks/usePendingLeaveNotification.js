import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { canManageAdminPanels, isSuperAdmin } from "../utils/roleAccess.js";
import { fetchPendingLeaveRequests } from "../services/pendingLeaveService.js";

const STORAGE_KEY = "hidePendingLeavePopup";
const POLL_INTERVAL_MS = 30000;
const getDismissStorageKey = (user = {}) =>
  `${STORAGE_KEY}:${String(user?._id || user?.id || "unknown")}:${String(user?.token || "session")}`;

const getEmployeeName = (request = {}) =>
  request?.userId?.pseudoName ||
  request?.userId?.realName ||
  request?.userId?.username ||
  request?.userId?.name ||
  "Employee";

const getLeaveDate = (request = {}) => {
  const raw = request?.startDate || request?.createdAt || request?.updatedAt || null;
  if (!raw) return "--";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLeaveTypeLabel = (request = {}) => {
  const type = String(request?.leaveType || "").trim().toUpperCase();
  return type || "Leave";
};

const getAvatarLabel = (request = {}) => {
  const name = getEmployeeName(request);
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "E";
};

export const usePendingLeaveNotification = () => {
  const user = useSelector((state) => state.auth.user);
  const isEligible = isSuperAdmin(user) && canManageAdminPanels(user);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = String(user?._id || user?.id || "");
  const dismissStorageKey = getDismissStorageKey(user);
  const previousUserIdRef = useRef(currentUserId);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (previousUserIdRef.current !== currentUserId) {
      previousUserIdRef.current = currentUserId;
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!isEligible) {
      setPendingRequests([]);
      setIsVisible(false);
      setError(null);
      return undefined;
    }

    let active = true;
    let controller = new AbortController();

    const syncPendingLeaveRequests = async () => {
      if (!active) return;

      try {
        setIsLoading(true);
        setError(null);
        controller.abort();
        controller = new AbortController();

        const { requests } = await fetchPendingLeaveRequests(controller.signal);
        if (!active) return;

        setPendingRequests(requests);
        if (requests.length > 0 && !sessionStorage.getItem(dismissStorageKey)) {
          setIsVisible(true);
        }
        if (requests.length === 0) {
          setIsVisible(false);
        }
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load pending leave requests");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    syncPendingLeaveRequests();
    const intervalId = window.setInterval(syncPendingLeaveRequests, POLL_INTERVAL_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [dismissStorageKey, isEligible]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissStorageKey, "true");
    }
    setIsVisible(false);
  };

  const viewAllRequests = () => {
    dismiss();
  };

  const pendingLeaveCount = pendingRequests.length;
  const firstThreePendingRequests = pendingRequests.slice(0, 3).map((request) => ({
    id: String(request?._id || request?.id || `${request?.userId?._id || request?.userId || "pending"}-${request?.createdAt || ""}`),
    avatarLabel: getAvatarLabel(request),
    employeeName: getEmployeeName(request),
    leaveType: getLeaveTypeLabel(request),
    leaveDate: getLeaveDate(request),
  }));

  return {
    pendingLeaveCount,
    firstThreePendingRequests,
    isVisible,
    isLoading,
    error,
    dismiss,
    viewAllRequests,
  };
};

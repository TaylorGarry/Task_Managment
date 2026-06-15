import api from "../../api.js";

const normalizePendingLeaveRequest = (request = {}) => ({
  ...request,
  userId: request?.userId || null,
});

export const fetchPendingLeaveRequests = async (signal) => {
  const response = await api.get("/api/v1/leaves/admin/requests", {
    params: { status: "pending" },
    signal,
  });

  const requests = Array.isArray(response?.data?.requests)
    ? response.data.requests.map(normalizePendingLeaveRequest)
    : [];

  return {
    requests,
    count: requests.length,
  };
};

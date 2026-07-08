import api from "../../api.js";

const BASE = "/api/v1/attendance/audit";

export const attendanceAuditApi = {
  list: (params = {}) => api.get(BASE, { params }),
  details: (id) => api.get(`${BASE}/${id}`),
  history: (employeeId, attendanceDate) => api.get(`${BASE}/history/${employeeId}/${attendanceDate}`),
};

export default attendanceAuditApi;

// client/src/services/changeLogService.js
import { API_BASE, apiJson } from "./api";

export const changeLogService = {
  async getLeadLogs(leadId, authToken) {
    const payload = await apiJson(`${API_BASE}/api/leads/${leadId}/logs/`, { authToken });
    const logs = Array.isArray(payload) ? payload : payload?.results || [];
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};

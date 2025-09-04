// client/src/services/courseService.js
import { API_BASE, apiJson } from "./api";

export const courseService = {
  async getCourses(authToken) {
    return apiJson(`${API_BASE}/api/courses/`, { authToken });
  },
};

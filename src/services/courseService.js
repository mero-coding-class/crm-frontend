import { API_BASE, apiJson } from "./api";

export const courseService = {
  async getCourses(authToken) {
    console.log("Fetching courses from:", `${API_BASE}/api/courses/`);
    const courses = await apiJson(`${API_BASE}/api/courses/`, { authToken });
    console.log("Course data received:", courses);
    return courses;
  },

  async createCourse(name, authToken) {
    return apiJson(`${API_BASE}/api/courses/`, {
      method: "POST",
      authToken,
      body: { course_name: name },
    });
  },

  async updateCourse(id, name, authToken) {
    return apiJson(`${API_BASE}/api/courses/${id}/`, {
      method: "PUT",
      authToken,
      body: { course_name: name },
    });
  },

  async deleteCourse(id, authToken) {
    return apiJson(`${API_BASE}/api/courses/${id}/`, {
      method: "DELETE",
      authToken,
    });
  },
};

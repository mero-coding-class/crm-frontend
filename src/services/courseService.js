import { BASE_URL } from "../config";

const handleJsonResponse = async (response) => {
  if (!response.ok) {
    let msg = `HTTP ${response.status} ${response.statusText}`;
    try {
      const d = await response.json();
      msg = d.detail || JSON.stringify(d);
    } catch (e) {
      try {
        msg = await response.text();
      } catch {}
    }
    throw new Error(msg);
  }
  return response.json();
};

export const courseService = {
  async getCourses(authToken) {
    if (!authToken) throw new Error("Authentication token not found.");
    const url = `${BASE_URL}/courses/`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return handleJsonResponse(res);
  },

  async createCourse(name, authToken) {
    if (!authToken) throw new Error("Authentication token not found.");
    const url = `${BASE_URL}/courses/`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course_name: name }),
      credentials: "include",
    });
    return handleJsonResponse(res);
  },

  async updateCourse(id, name, authToken) {
    if (!authToken) throw new Error("Authentication token not found.");
    const url = `${BASE_URL}/courses/${id}/`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course_name: name }),
      credentials: "include",
    });
    return handleJsonResponse(res);
  },

  async deleteCourse(id, authToken) {
    if (!authToken) throw new Error("Authentication token not found.");
    const url = `${BASE_URL}/courses/${id}/`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    // Some delete endpoints return 204 No Content
    if (res.status === 204) return { ok: true };
    return handleJsonResponse(res);
  },
};

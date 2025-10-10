import { useEffect, useState } from "react";
import { courseService } from "../../services/api";

export default function useCourses(authToken) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const fetchCourses = async () => {
      try {
        const res = await courseService.getCourses(authToken);
        const list = Array.isArray(res) ? res : res?.results || [];
        if (!cancelled) setCourses(list);
        console.debug("Leads: fetched courses count=", list.length);
      } catch (err) {
        console.warn("Leads: failed to fetch courses", err);
        if (!cancelled) setCourses([]);
      }
    };
    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  return { courses };
}

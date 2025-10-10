import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../config";
import { leadService, courseService } from "../../services/api";
import { deduplicateLeads, ensureLeadIds } from "./utils";

export default function useLeadsCore(authToken, pageSize) {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingAll, setFetchingAll] = useState(false);
  const allLeadsFullRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (!authToken) return;
    allLeadsFullRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const [leadsData, coursesData] = await Promise.all([
        leadService.getLeads(authToken),
        courseService.getCourses(authToken),
      ]);

      const processedLeads = (
        Array.isArray(leadsData) ? leadsData : leadsData.results || []
      )
        .map((lead) => ({
          ...lead,
          sub_status: lead.sub_status || lead.substatus || "New",
          assigned_to:
            lead.assigned_to ||
            lead.assigned_to_username ||
            lead.assigned_to ||
            "",
          assigned_to_username:
            lead.assigned_to_username || lead.assigned_to || "",
          course_name: lead.course_name || "N/A",
          course_duration: lead.course_duration || "",
        }))
        .slice(0, pageSize);

      setAllLeads(deduplicateLeads(processedLeads));
    } catch (err) {
      setError(err.message || "Failed to refresh leads");
    } finally {
      setLoading(false);
    }
  }, [authToken, pageSize]);

  const fetchAllLeads = useCallback(async () => {
    if (!authToken) return [];
    setFetchingAll(true);
    const pageSizeForFetch = 200;
    const baseUrl = `${BASE_URL}/leads/`;
    let page = 1;
    let accumulated = [];
    try {
      while (true) {
        const url = `${baseUrl}?page=${page}&page_size=${pageSizeForFetch}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!resp.ok) throw new Error(`Failed to fetch leads page ${page}: ${resp.status}`);
        const json = await resp.json();
        let list = [];
        if (Array.isArray(json)) list = json;
        else if (Array.isArray(json.results)) list = json.results;
        else list = json.data || [];

        if (!list || list.length === 0) break;

        const normalized = ensureLeadIds(list || []);
        accumulated = accumulated.concat(normalized);

        if (list.length < pageSizeForFetch) break;
        page += 1;
      }
      setAllLeads(deduplicateLeads(accumulated));
      allLeadsFullRef.current = true;
      return accumulated;
    } catch (err) {
      console.warn("fetchAllLeads failed:", err);
      throw err;
    } finally {
      setFetchingAll(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    // initial load first page via handleRefresh (keeps behavior close to existing)
    handleRefresh();
  }, [authToken, handleRefresh]);

  return {
    allLeads,
    setAllLeads,
    loading,
    error,
    setError,
    fetchingAll,
    setFetchingAll,
    allLeadsFullRef,
    handleRefresh,
    fetchAllLeads,
  };
}

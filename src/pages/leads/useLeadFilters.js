import { useEffect, useMemo, useState } from "react";
import { deduplicateLeads } from "./utils";

export default function useLeadFilters(allLeads, allLeadsFullRef, fetchAllLeads) {
  // Filter state
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAge, setFilterAge] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class");
  const [filterShift, setFilterShift] = useState("");
  const [filterDevice, setFilterDevice] = useState("Device");
  const [filterSubStatus, setFilterSubStatus] = useState("SubStatus");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("CodingExp");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");

  const [leads, setLeads] = useState([]);

  useEffect(() => {
    let workingSet = deduplicateLeads(allLeads);

    const applyFilters = (items) => {
      let filtered = [...items];
      if (filterStatus && filterStatus !== "All") {
        filtered = filtered.filter((l) => l.status === filterStatus);
      }
      const sTerm = (v) => (v || "").toString().toLowerCase();
      // Note: term-based filtering happens outside; keeping only simple filters here
      if (filterAge && filterAge.trim()) {
        filtered = filtered.filter((l) => String(l.age) === String(filterAge));
      }
      if (filterGrade && filterGrade.trim()) {
        filtered = filtered.filter((l) => String(l.grade) === String(filterGrade));
      }
      if (filterLastCall && filterLastCall.trim()) {
        filtered = filtered.filter((l) => (l.last_call || "").startsWith(filterLastCall));
      }
      if (filterClassType && filterClassType !== "Class") {
        filtered = filtered.filter((l) => l.class_type === filterClassType);
      }
      if (filterShift && filterShift.trim() !== "") {
        const s = filterShift.trim();
        filtered = filtered.filter((l) => (l.shift || "") === s);
      }
      if (filterDevice && filterDevice !== "Device") {
        filtered = filtered.filter((l) => l.device === filterDevice);
      }
      if (filterSubStatus && filterSubStatus !== "SubStatus") {
        filtered = filtered.filter(
          (l) => l.substatus === filterSubStatus || l.sub_status === filterSubStatus
        );
      }
      if (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") {
        filtered = filtered.filter(
          (l) => l.previous_coding_experience === filterPrevCodingExp
        );
      }
      if (filterAssignedTo && filterAssignedTo !== "") {
        filtered = filtered.filter(
          (l) => (l.assigned_to_username || l.assigned_to || "") === filterAssignedTo
        );
      }
      return filtered;
    };

    const anyFilterActive =
      (filterStatus && filterStatus !== "All") ||
      (filterAge && filterAge.trim()) ||
      (filterGrade && filterGrade.trim()) ||
      (filterLastCall && filterLastCall.trim()) ||
      (filterClassType && filterClassType !== "Class") ||
      (filterShift && filterShift.trim() !== "") ||
      (filterDevice && filterDevice !== "Device") ||
      (filterSubStatus && filterSubStatus !== "SubStatus") ||
      (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") ||
      (filterAssignedTo && filterAssignedTo !== "");

    if (anyFilterActive && !allLeadsFullRef.current) {
      (async () => {
        try {
          const all = await fetchAllLeads();
          const filteredAll = applyFilters(all);
          setLeads(filteredAll);
        } catch (e) {
          const filtered = applyFilters(workingSet);
          setLeads(filtered);
        }
      })();
      return;
    }

    setLeads(applyFilters(workingSet));
  }, [
    allLeads,
    filterStatus,
    filterAge,
    filterGrade,
    filterLastCall,
    filterClassType,
    filterShift,
    filterDevice,
    filterSubStatus,
    filterPrevCodingExp,
    filterAssignedTo,
    allLeadsFullRef,
    fetchAllLeads,
  ]);

  return {
    leads,
    setLeads,
    // filters and setters
    filterStatus,
    setFilterStatus,
    filterAge,
    setFilterAge,
    filterGrade,
    setFilterGrade,
    filterLastCall,
    setFilterLastCall,
    filterClassType,
    setFilterClassType,
    filterShift,
    setFilterShift,
    filterDevice,
    setFilterDevice,
    filterSubStatus,
    setFilterSubStatus,
    filterPrevCodingExp,
    setFilterPrevCodingExp,
    filterAssignedTo,
    setFilterAssignedTo,
  };
}

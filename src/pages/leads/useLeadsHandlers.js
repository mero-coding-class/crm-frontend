import { useCallback, useState } from "react";
import { resolveServerId, leadService } from "../../services/api";
import { deduplicateLeads, matchId } from "./utils";

export default function useLeadsHandlers(ctx) {
  const { authToken, allLeads, setAllLeads, setToast, setError, courses } = ctx;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const handleOpenAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  }, []);

  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      const prevLeads = (allLeads || []).slice();
      try {
        let leadObj = (allLeads || []).find((l) => matchId(l, leadId));
        const serverId = resolveServerId(leadObj || leadId, prevLeads);
        if (!serverId) throw new Error("Unable to resolve Lead ID");

        if (!leadObj) leadObj = prevLeads.find((l) => matchId(l, serverId));

        if (
          fieldName === "status" &&
          (newValue === "Lost" || newValue === "Converted")
        ) {
          setAllLeads((prev) =>
            deduplicateLeads(
              prev.map((l) => (matchId(l, serverId) ? { ...l, status: newValue } : l))
            )
          );
        } else {
          setAllLeads((prev) =>
            deduplicateLeads(
              prev.map((l) => (matchId(l, serverId) ? { ...l, [fieldName]: newValue } : l))
            )
          );
        }

        let updatesToSend = { [fieldName]: newValue };
        if (fieldName === "shift") {
          updatesToSend.shift = (newValue || "").toString().trim();
        }

        const serverResp = await leadService.updateLead(serverId, updatesToSend, authToken);

        setToast({ show: true, message: `${fieldName} updated successfully`, type: "success" });

        setAllLeads((prev) =>
          deduplicateLeads(
            prev.map((l) => (matchId(l, serverId) ? { ...l, ...serverResp, _id: l._id || serverResp.id } : l))
          )
        );
      } catch (err) {
        setAllLeads(prevLeads);
        setToast({ show: true, message: err.message || `Failed to update ${fieldName}`, type: "error" });
      }
    },
    [authToken, allLeads, setAllLeads, setToast]
  );

  const handleAssignedToChange = useCallback(
    (leadId, newAssignedTo) => updateLeadField(leadId, "assigned_to_username", newAssignedTo),
    [updateLeadField]
  );

  const handleAddNewLead = useCallback(
    async (newLeadData) => {
      try {
        const formattedLead = {
          ...newLeadData,
          _id: newLeadData.id?.toString() || newLeadData._id || `new-${Date.now()}`,
          id: newLeadData.id || parseInt(newLeadData._id) || null,
          student_name: newLeadData.student_name?.trim() || "",
          parents_name: newLeadData.parents_name?.trim() || "",
          phone_number: newLeadData.phone_number?.trim() || "",
          whatsapp_number: newLeadData.whatsapp_number?.trim() || "",
          email: newLeadData.email || "",
          age: newLeadData.age || "",
          grade: newLeadData.grade || "",
          source: newLeadData.source || "",
          course_name: newLeadData.course_name || "",
          status: newLeadData.status || "New",
          studentName: newLeadData.student_name?.trim() || "",
          parentsName: newLeadData.parents_name?.trim() || "",
          phone: newLeadData.phone_number?.trim() || "",
          contactWhatsapp: newLeadData.whatsapp_number?.trim() || "",
          created_at: newLeadData.created_at || new Date().toISOString(),
          updated_at: newLeadData.updated_at || new Date().toISOString(),
          logs_url: newLeadData.logs_url || null,
          change_logs: [
            { action: "Created", timestamp: new Date().toISOString(), changes: "New lead created", user: "System" },
          ],
        };

        // Avoid duplicate rows when optimistic add is followed by server response:
        // Prefer merging/replacing an existing row matched by natural keys (email or name+phone).
        setAllLeads((prevLeads) => {
          const norm = (v) => (v === undefined || v === null ? "" : String(v).trim().toLowerCase());
          const emailKey = norm(formattedLead.email);
          const namePhoneKey = `${norm(formattedLead.student_name)}-${norm(formattedLead.phone_number)}`;

          const idx = prevLeads.findIndex((l) => {
            const lEmail = norm(l.email);
            if (emailKey && lEmail && lEmail === emailKey) return true;
            const lNamePhone = `${norm(l.student_name)}-${norm(l.phone_number)}`;
            return namePhoneKey !== "-" && lNamePhone === namePhoneKey;
          });

          let next;
          if (idx >= 0) {
            // Replace/merge the existing optimistic row with the authoritative data (server or refined optimistic)
        const norm = (v) => (v === undefined || v === null ? "" : String(v).trim().toLowerCase());
        const existedBefore = (() => {
          const emailKey = norm(formattedLead.email);
          const namePhoneKey = `${norm(formattedLead.student_name)}-${norm(formattedLead.phone_number)}`;
          const idx = (allLeads || []).findIndex((l) => {
            const lEmail = norm(l.email);
            if (emailKey && lEmail && lEmail === emailKey) return true;
            const lNamePhone = `${norm(l.student_name)}-${norm(l.phone_number)}`;
            return namePhoneKey !== "-" && lNamePhone === namePhoneKey;
          });
          return idx >= 0;
        })();
            next = prevLeads.slice();
            next[idx] = { ...next[idx], ...formattedLead };
          } else {
            next = [formattedLead, ...prevLeads];
          }
          return deduplicateLeads(next);
        });

        // Only show "added" toast if this was a brand new insert (no existing match)
        if (!existedBefore) {
          setToast({ show: true, message: `New lead added: ${formattedLead.student_name}`, type: "success" });
        }
      } catch (error) {
        console.error("Error adding lead:", error);
        setToast({ show: true, message: "Failed to add lead. Please try again.", type: "error" });
      }
    },
    [allLeads, setAllLeads, setToast]
  );

  const handleDelete = useCallback(
    async (leadId) => {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          await leadService.updateLead(leadId, { status: "Lost" }, authToken);
          setAllLeads((prevLeads) => deduplicateLeads(prevLeads.filter((lead) => !matchId(lead, leadId))));
        } catch (err) {
          setError(err.message || "Failed to move lead to trash");
        }
      }
    },
    [authToken, setAllLeads, setError]
  );

  const handleBulkDelete = useCallback(
    async (leadIds) => {
      try {
        await Promise.all(leadIds.map((id) => leadService.updateLead(id, { status: "Lost" }, authToken)));
        setAllLeads((prevLeads) => deduplicateLeads(prevLeads.filter((lead) => !leadIds.some((id) => matchId(lead, id)))));
      } catch (err) {
        setError(err.message || "Failed to move selected leads to trash");
      }
    },
    [authToken, setAllLeads, setError]
  );

  const handleSaveEdit = useCallback(
    async (updatedLead) => {
      const prevLeadsSnapshot = (allLeads || []).slice();
      try {
        setAllLeads((prev) =>
          prev.map((l) => (String(l.id || l._id || "") === String(updatedLead.id || updatedLead._id || "")) ? { ...l, ...updatedLead } : l)
        );

        const serverId = resolveServerId(updatedLead.id || updatedLead._id || {}, prevLeadsSnapshot);
        if (!serverId) throw new Error("Unable to resolve Lead ID");

        const serverResp = await leadService.updateLead(serverId, updatedLead, authToken);

        setAllLeads((prev) => deduplicateLeads(prev.map((l) => (String(l.id || l._id || "") === String(serverResp.id || serverResp._id || "")) ? { ...l, ...serverResp } : l)));

        setToast({ show: true, message: "Lead updated successfully", type: "success", duration: 3000 });
        setIsEditModalOpen(false);
        setEditingLead(null);
      } catch (err) {
        setAllLeads(prevLeadsSnapshot);
        setToast({ show: true, message: err.message || "Failed to update lead", type: "error" });
      }
    },
    [authToken, allLeads, setAllLeads, setToast]
  );

  return {
    // modal states
    isEditModalOpen,
    setIsEditModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    editingLead,
    setEditingLead,

    // open/close
    handleOpenAddModal,
    handleCloseAddModal,
    handleEdit,
    handleCloseEditModal,

    // updates
    updateLeadField,
    handleAssignedToChange,

    // add/edit/delete
    handleAddNewLead,
    handleSaveEdit,
    handleDelete,
    handleBulkDelete,
  };
}

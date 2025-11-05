import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LuBriefcase, LuRefreshCw, LuUser, LuUsers } from "react-icons/lu";
import toast from "react-hot-toast";

import Modal from "../Modal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getRoleLabel, normalizeRole } from "../../utils/roleUtils";

const MATTER_STATUSES = ["Intake", "Active", "On Hold", "Closed"];

const defaultFormState = {
  title: "",
  matterNumber: "",
  practiceArea: "",
  status: "Active",
  client: "",
  leadAttorney: "",
  openedDate: "",
  description: "",
  notes: "",
  tags: "",
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Failed to parse date for input", error);
    return "";
  }
};

const MatterFormModal = ({ isOpen, onClose, onSuccess, matter }) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [teamMembers, setTeamMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(matter?._id);

  const resetForm = useCallback(() => {
    setFormData(defaultFormState);
    setTeamMembers([]);
  }, []);

  const handleModalClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    setClients([]);
    setUsers([]);
    setIsLoadingMetadata(false);
    onClose?.();
  }, [isSubmitting, onClose, resetForm]);

  const applyMatterToForm = useCallback(
    (targetMatter) => {
      if (!targetMatter) {
        resetForm();
        return;
      }

      const normalizedClient =
        targetMatter?.client?._id || targetMatter?.client || "";
      const normalizedLeadAttorney =
        targetMatter?.leadAttorney?._id || targetMatter?.leadAttorney || "";
      const normalizedTeamMembers = Array.isArray(targetMatter?.teamMembers)
        ? targetMatter.teamMembers
            .map((member) =>
              typeof member === "string" ? member : member?._id || ""
            )
            .filter(Boolean)
        : [];
      const normalizedTags = Array.isArray(targetMatter?.tags)
        ? targetMatter.tags.join(", ")
        : typeof targetMatter?.tags === "string"
        ? targetMatter.tags
        : "";

      setFormData({
        title: targetMatter?.title || "",
        matterNumber: targetMatter?.matterNumber || "",
        practiceArea: targetMatter?.practiceArea || "",
        status: targetMatter?.status || "Active",
        client: normalizedClient,
        leadAttorney: normalizedLeadAttorney,
        openedDate: formatDateForInput(targetMatter?.openedDate),
        description: targetMatter?.description || "",
        notes: targetMatter?.notes || "",
        tags: normalizedTags,
      });
      setTeamMembers(normalizedTeamMembers);
    },
    [resetForm]
  );

  const fetchMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      const [clientsResponse, usersResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.MATTERS.GET_CLIENTS),
        axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS),
      ]);

      const normalizedClients = Array.isArray(clientsResponse.data?.clients)
        ? clientsResponse.data.clients
        : [];
      setClients(normalizedClients);

      const normalizedUsers = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : [];

      const staffUsers = normalizedUsers.filter(
        (user) => normalizeRole(user?.role) !== "client"
      );

      const sortedUsers = [...staffUsers].sort((userA, userB) =>
        (userA?.name || "").localeCompare(userB?.name || "")
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Failed to load matter metadata", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load matter data.";
      toast.error(message);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    if (isEditMode && matter) {
      applyMatterToForm(matter);
    } else {
      resetForm();
    }

    fetchMetadata();
  }, [applyMatterToForm, fetchMetadata, isEditMode, isOpen, matter, resetForm]);

  const handleValueChange = (key, value) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleTeamMembersChange = (event) => {
    const selected = Array.from(event.target.selectedOptions || []).map(
      (option) => option.value
    );
    setTeamMembers(selected);
  };

  const leadAttorneyOptions = useMemo(() => users, [users]);

  const teamMemberHelperText = useMemo(() => {
    if (!teamMembers.length) {
      return "Select the team members who will collaborate on this matter.";
    }

    const names = teamMembers
      .map((memberId) =>
        users.find((user) => user?._id === memberId)?.name || ""
      )
      .filter(Boolean);

    if (!names.length) {
      return "Select the team members who will collaborate on this matter.";
    }

    return `Assigned: ${names.join(", ")}`;
  }, [teamMembers, users]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      toast.error("Matter title is required.");
      return;
    }

    if (!formData.client) {
      toast.error("Please select a client for this matter.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      client: formData.client,
      status: formData.status,
    };

    if (formData.matterNumber.trim()) {
      payload.matterNumber = formData.matterNumber.trim();
    }

    if (formData.practiceArea.trim()) {
      payload.practiceArea = formData.practiceArea.trim();
    }

    if (formData.description.trim()) {
      payload.description = formData.description.trim();
    }

    if (formData.notes.trim()) {
      payload.notes = formData.notes.trim();
    }

    if (formData.openedDate) {
      payload.openedDate = formData.openedDate;
    }

    if (formData.leadAttorney) {
      payload.leadAttorney = formData.leadAttorney;
    }

    if (teamMembers.length) {
      payload.teamMembers = teamMembers;
    }

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tags.length) {
      payload.tags = tags;
    }

    try {
      setIsSubmitting(true);
      let response;

      if (isEditMode && matter?._id) {
        response = await axiosInstance.put(
          API_PATHS.MATTERS.UPDATE(matter._id),
          payload
        );
      } else {
        response = await axiosInstance.post(
          API_PATHS.MATTERS.CREATE,
          payload
        );
      }

      const message =
        response.data?.message ||
        (isEditMode
          ? "Matter updated successfully"
          : "Matter created successfully");
      toast.success(message);
      onSuccess?.(response.data?.matter || matter);

      if (!isEditMode) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to submit matter", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        (isEditMode
          ? "Failed to update matter."
          : "Failed to create matter.");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isEditMode ? "Update Matter" : "Create Matter"}
      maxWidthClass="max-w-3xl"
    >
      {isLoadingMetadata ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LuRefreshCw className="h-4 w-4 animate-spin" />
          Loading matter details...
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Title
              <div className="relative">
                <LuBriefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleValueChange("title", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  placeholder="Matter title"
                  required
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Matter Number
              <input
                type="text"
                value={formData.matterNumber}
                onChange={(event) => handleValueChange("matterNumber", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="Optional tracking number"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Practice Area
              <input
                type="text"
                value={formData.practiceArea}
                onChange={(event) => handleValueChange("practiceArea", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="E.g. Corporate Law"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
              <select
                value={formData.status}
                onChange={(event) => handleValueChange("status", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                {MATTER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Client
              <select
                value={formData.client}
                onChange={(event) => handleValueChange("client", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                required
              >
                <option value="" disabled>
                  Select a client
                </option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name || client.email}
                    {client.email && client.name ? ` (${client.email})` : ""}
                  </option>
                ))}
              </select>
              {!clients.length && (
                <p className="text-xs font-medium text-amber-600">
                  No client accounts available. Create a client user first.
                </p>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Lead Attorney
              <div className="relative">
                <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.leadAttorney}
                  onChange={(event) => handleValueChange("leadAttorney", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <option value="">Unassigned</option>
                  {leadAttorneyOptions.map((user) => {
                    const roleLabel = getRoleLabel(user?.role);
                    return (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                        {roleLabel ? ` • ${roleLabel}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Opened Date
              <input
                type="date"
                value={formData.openedDate}
                onChange={(event) => handleValueChange("openedDate", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Team Members
              <div className="relative">
                <LuUsers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  multiple
                  value={teamMembers}
                  onChange={handleTeamMembersChange}
                  className="h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  {users.map((user) => {
                    const roleLabel = getRoleLabel(user?.role);
                    return (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                        {roleLabel ? ` • ${roleLabel}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">{teamMemberHelperText}</p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
            <textarea
              value={formData.description}
              onChange={(event) => handleValueChange("description", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              placeholder="Brief summary of the matter"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Internal Notes
            <textarea
              value={formData.notes}
              onChange={(event) => handleValueChange("notes", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              placeholder="Notes visible to your internal team"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Tags
            <input
              type="text"
              value={formData.tags}
              onChange={(event) => handleValueChange("tags", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              placeholder="Comma separated (e.g. High Priority, VIP Client)"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || isLoadingMetadata}
            >
              {isSubmitting ? (
                <>
                  <LuRefreshCw className="h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Matter" : "Create Matter"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default MatterFormModal;
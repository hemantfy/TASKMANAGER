import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuBriefcase,
  LuCalendarDays,
  LuFileText,
  LuRefreshCw,
  LuTag,
  LuUser,
} from "react-icons/lu";
import toast from "react-hot-toast";

import Modal from "../Modal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getRoleLabel, normalizeRole } from "../../utils/roleUtils";

const CASE_STATUSES = ["Pre-Filing", "Active", "Discovery", "Trial", "Closed"];

const defaultFormState = {
  title: "",
  caseNumber: "",
  status: "Active",
  jurisdiction: "",
  court: "",
  leadCounsel: "",
  filingDate: "",
  opposingCounsel: "",
  description: "",
  notes: "",
  tags: "",
};

const CaseFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  matterId,
  matterTitle,
}) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [users, setUsers] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(defaultFormState);
  }, []);

  const handleModalClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    setUsers([]);
    setIsLoadingMetadata(false);
    onClose?.();
  }, [isSubmitting, onClose, resetForm]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const normalizedUsers = Array.isArray(response.data) ? response.data : [];
      const staffUsers = normalizedUsers.filter(
        (user) => normalizeRole(user?.role) !== "client"
      );
      const sortedUsers = [...staffUsers].sort((userA, userB) =>
        (userA?.name || "").localeCompare(userB?.name || "")
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Failed to load case metadata", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load case data.";
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

    resetForm();
    if (matterId) {
      fetchUsers();
    }
  }, [fetchUsers, isOpen, matterId, resetForm]);

  const handleValueChange = (key, value) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const leadCounselOptions = useMemo(() => users, [users]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!matterId) {
      toast.error("An active matter is required to create a case file.");
      return;
    }

    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      toast.error("Case title is required.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      matter: matterId,
    };

    if (formData.caseNumber.trim()) {
      payload.caseNumber = formData.caseNumber.trim();
    }

    if (formData.status) {
      payload.status = formData.status;
    }

    if (formData.jurisdiction.trim()) {
      payload.jurisdiction = formData.jurisdiction.trim();
    }

    if (formData.court.trim()) {
      payload.court = formData.court.trim();
    }

    if (formData.leadCounsel) {
      payload.leadCounsel = formData.leadCounsel;
    }

    if (formData.opposingCounsel.trim()) {
      payload.opposingCounsel = formData.opposingCounsel.trim();
    }

    if (formData.description.trim()) {
      payload.description = formData.description.trim();
    }

    if (formData.notes.trim()) {
      payload.notes = formData.notes.trim();
    }

    if (formData.filingDate) {
      payload.filingDate = formData.filingDate;
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
      const response = await axiosInstance.post(
        API_PATHS.CASES.CREATE,
        payload
      );

      const message =
        response.data?.message || "Case file created successfully";
      toast.success(message);
      onSuccess?.(response.data?.caseFile);
      resetForm();
    } catch (error) {
      console.error("Failed to create case file", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create case file.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatterMissing = !matterId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Create Case File"
      maxWidthClass="max-w-3xl"
    >
      {isMatterMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Select a matter before creating a case file.
        </div>
      ) : isLoadingMetadata ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LuRefreshCw className="h-4 w-4 animate-spin" />
          Loading case details...
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {matterTitle && (
            <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary dark:bg-primary/20 dark:text-primary">
              Case will be added to <span className="font-semibold">{matterTitle}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Title
              <div className="relative">
                <LuBriefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleValueChange("title", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  placeholder="Case title"
                  required
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Case Number
              <div className="relative">
                <LuTag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.caseNumber}
                  onChange={(event) => handleValueChange("caseNumber", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  placeholder="Optional tracking number"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
              <select
                value={formData.status}
                onChange={(event) => handleValueChange("status", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                {CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Lead Counsel
              <div className="relative">
                <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.leadCounsel}
                  onChange={(event) => handleValueChange("leadCounsel", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <option value="">Unassigned</option>
                  {leadCounselOptions.map((user) => {
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
              Filing Date
              <div className="relative">
                <LuCalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.filingDate}
                  onChange={(event) => handleValueChange("filingDate", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Jurisdiction
              <input
                type="text"
                value={formData.jurisdiction}
                onChange={(event) => handleValueChange("jurisdiction", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="E.g. State of California"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Court
              <input
                type="text"
                value={formData.court}
                onChange={(event) => handleValueChange("court", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="Assigning court"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Opposing Counsel
              <input
                type="text"
                value={formData.opposingCounsel}
                onChange={(event) => handleValueChange("opposingCounsel", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="Opposing counsel name"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
            <textarea
              value={formData.description}
              onChange={(event) => handleValueChange("description", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              placeholder="Brief summary of the case"
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
            <div className="relative">
              <LuFileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.tags}
                onChange={(event) => handleValueChange("tags", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                placeholder="Comma separated (e.g. Litigation, High Value)"
              />
            </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LuRefreshCw className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Case"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CaseFormModal;
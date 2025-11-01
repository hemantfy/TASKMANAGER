import React, { useEffect, useState } from "react";
import {
  LuBriefcase,
  LuCalendarDays,
  LuBadgeCheck,
  LuFileText,
  LuFolder,
  LuGavel,
  LuLayers,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuUsers,
  LuCircleAlert,
} from "react-icons/lu";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/Modal";
import LoadingOverlay from "../../components/LoadingOverlay";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateLabel } from "../../utils/dateUtils";

const MATTER_STATUSES = ["Intake", "Active", "On Hold", "Closed"];
const CASE_STATUSES = ["Pre-Filing", "Active", "Discovery", "Trial", "Closed"];

const createDefaultMatterForm = () => ({
  title: "",
  client: "",
  matterNumber: "",
  practiceArea: "",
  status: "Active",
  openedDate: "",
  notes: "",
});

const createDefaultCaseForm = (matterId) => ({
  title: "",
  matter: matterId || "",
  caseNumber: "",
  jurisdiction: "",
  court: "",
  status: "Active",
  filingDate: "",
  description: "",
});

const createDefaultDocumentForm = (matterId, caseId) => ({
  title: "",
  matter: matterId || "",
  caseFile: caseId || "",
  documentType: "",
  description: "",
  fileUrl: "",
  version: 1,
  isFinal: false,
  tags: "",
  receivedFrom: "",
  producedTo: "",
});

const Matters = () => {
  const [matterList, setMatterList] = useState([]);
  const [selectedMatterId, setSelectedMatterId] = useState("");
  const [matterDetails, setMatterDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isMatterModalOpen, setIsMatterModalOpen] = useState(false);
  const [matterForm, setMatterForm] = useState(createDefaultMatterForm());
  const [activeMatter, setActiveMatter] = useState(null);
  const [isMatterSubmitting, setIsMatterSubmitting] = useState(false);

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseForm, setCaseForm] = useState(createDefaultCaseForm(""));
  const [activeCase, setActiveCase] = useState(null);
  const [isCaseSubmitting, setIsCaseSubmitting] = useState(false);

  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState(createDefaultDocumentForm("", ""));
  const [activeDocument, setActiveDocument] = useState(null);
  const [isDocumentSubmitting, setIsDocumentSubmitting] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [isClientListLoading, setIsClientListLoading] = useState(false);

  const fetchMatters = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(API_PATHS.MATTERS.GET_ALL);
      const matters = Array.isArray(response.data?.matters)
        ? response.data.matters
        : [];

      setMatterList(matters);

      if (matters.length) {
        setSelectedMatterId((current) => current || matters[0]._id);
      } else {
        setSelectedMatterId("");
        setMatterDetails(null);
      }
    } catch (error) {
      console.error("Failed to fetch matters", error);
      toast.error("Unable to load matters. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatterDetails = async (matterId) => {
    if (!matterId) {
      setMatterDetails(null);
      return;
    }

    try {
      setIsDetailLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.MATTERS.GET_BY_ID(matterId)
      );
      setMatterDetails(response.data || null);
    } catch (error) {
      console.error("Failed to fetch matter details", error);
      toast.error("Unable to load matter details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const fetchClientOptions = async () => {
    try {
      setIsClientListLoading(true);
      const response = await axiosInstance.get(API_PATHS.MATTERS.GET_CLIENTS);
      const clients = Array.isArray(response.data?.clients)
        ? response.data.clients
        : [];

      setClientOptions(clients);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load clients. Please try again later.";
      toast.error(message);
    } finally {
      setIsClientListLoading(false);
    }
  };

  useEffect(() => {
    fetchMatters();
    fetchClientOptions();    
    return () => {};
  }, []);

  useEffect(() => {
    if (selectedMatterId) {
      fetchMatterDetails(selectedMatterId);
    }
  }, [selectedMatterId]);

  const openMatterModal = (matter = null) => {
    if (!clientOptions.length && !isClientListLoading) {
      fetchClientOptions();
    }

    if (matter) {
      setActiveMatter(matter);
      setMatterForm({
        title: matter.title || "",
        client: matter.client?._id || "",
        matterNumber: matter.matterNumber || "",
        practiceArea: matter.practiceArea || "",
        status: matter.status || "Active",
        openedDate: matter.openedDate
          ? new Date(matter.openedDate).toISOString().split("T")[0]
          : "",
        notes: matter.notes || "",
      });

      if (matter.client?._id) {
        setClientOptions((prev) => {
          const exists = prev.some(
            (client) => client._id === matter.client._id
          );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            {
              _id: matter.client._id,
              name: matter.client.name || "",
              email: matter.client.email || "",
            },
          ];
        });
      }      
    } else {
      setActiveMatter(null);
      setMatterForm(createDefaultMatterForm());
    }

    setIsMatterModalOpen(true);
  };

  const handleMatterSubmit = async (event) => {
    event.preventDefault();
    if (isMatterSubmitting) return;

    if (!matterForm.title.trim()) {
      toast.error("Matter title is required.");
      return;
    }

    if (!matterForm.client) {
      toast.error("Select a client for this matter.");
      return;
    }

    try {
      setIsMatterSubmitting(true);
      const payload = {
        ...matterForm,
        client: matterForm.client || undefined,        
        openedDate: matterForm.openedDate || undefined,
      };

      if (!payload.client) {
        delete payload.client;
      }

      let nextSelectedId = selectedMatterId;

      if (activeMatter?._id) {
        await axiosInstance.put(
          API_PATHS.MATTERS.UPDATE(activeMatter._id),
          payload
        );
        nextSelectedId = activeMatter._id;
        toast.success("Matter updated successfully");
      } else {
        const response = await axiosInstance.post(
          API_PATHS.MATTERS.CREATE,
          payload
        );
        nextSelectedId = response.data?.matter?._id || nextSelectedId;
        toast.success("Matter created successfully");
      }

      setIsMatterModalOpen(false);
      setActiveMatter(null);
      setMatterForm(createDefaultMatterForm());
      if (nextSelectedId) {
        setSelectedMatterId(nextSelectedId);
      }
      await fetchMatters();
      if (nextSelectedId) {
        fetchMatterDetails(nextSelectedId);
      }
    } catch (error) {
      console.error("Failed to save matter", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to save matter.";
      toast.error(message);
    } finally {
      setIsMatterSubmitting(false);
    }
  };

  const handleDeleteMatter = async (matterId) => {
    if (!matterId) return;
    const confirmDelete = window.confirm(
      "Delete this matter? Associated cases and documents will also be removed."
    );

    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(API_PATHS.MATTERS.DELETE(matterId));
      toast.success("Matter deleted successfully");
      if (selectedMatterId === matterId) {
        setSelectedMatterId("");
        setMatterDetails(null);
      }
      await fetchMatters();
    } catch (error) {
      console.error("Failed to delete matter", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to delete matter.";
      toast.error(message);
    }
  };

  const openCaseModal = (caseFile = null) => {
    const baseMatterId = selectedMatterId || caseFile?.matter?._id || "";
    if (caseFile) {
      setActiveCase(caseFile);
      setCaseForm({
        title: caseFile.title || "",
        matter: caseFile.matter?._id || baseMatterId,
        caseNumber: caseFile.caseNumber || "",
        jurisdiction: caseFile.jurisdiction || "",
        court: caseFile.court || "",
        status: caseFile.status || "Active",
        filingDate: caseFile.filingDate
          ? new Date(caseFile.filingDate).toISOString().split("T")[0]
          : "",
        description: caseFile.description || "",
      });
    } else {
      setActiveCase(null);
      setCaseForm(createDefaultCaseForm(baseMatterId));
    }

    setIsCaseModalOpen(true);
  };

  const handleCaseSubmit = async (event) => {
    event.preventDefault();
    if (isCaseSubmitting) return;

    if (!caseForm.matter) {
      toast.error("Select a matter before saving the case file.");
      return;
    }

    if (!caseForm.title.trim()) {
      toast.error("Case title is required.");
      return;
    }

    try {
      setIsCaseSubmitting(true);
      const payload = {
        ...caseForm,
        filingDate: caseForm.filingDate || undefined,
      };

      if (activeCase?._id) {
        await axiosInstance.put(
          API_PATHS.CASES.UPDATE(activeCase._id),
          payload
        );
        toast.success("Case file updated successfully");
      } else {
        await axiosInstance.post(API_PATHS.CASES.CREATE, payload);
        toast.success("Case file created successfully");
      }

      setIsCaseModalOpen(false);
      setActiveCase(null);
      setCaseForm(createDefaultCaseForm(selectedMatterId));
      if (selectedMatterId) {
        fetchMatterDetails(selectedMatterId);
      }
    } catch (error) {
      console.error("Failed to save case file", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to save case file.";
      toast.error(message);
    } finally {
      setIsCaseSubmitting(false);
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (!caseId) return;

    const confirmDelete = window.confirm(
      "Delete this case file? Linked documents will retain their matter reference."
    );

    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(API_PATHS.CASES.DELETE(caseId));
      toast.success("Case file deleted successfully");
      if (selectedMatterId) {
        fetchMatterDetails(selectedMatterId);
      }
    } catch (error) {
      console.error("Failed to delete case file", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to delete case file.";
      toast.error(message);
    }
  };

  const openDocumentModal = (document = null) => {
    const baseMatterId = selectedMatterId || document?.matter?._id || "";
    const defaultCaseId = document?.caseFile?._id || "";

    if (document) {
      setActiveDocument(document);
      setDocumentForm({
        title: document.title || "",
        matter: baseMatterId,
        caseFile: defaultCaseId,
        documentType: document.documentType || "",
        description: document.description || "",
        fileUrl: document.fileUrl || "",
        version: document.version ?? 1,
        isFinal: Boolean(document.isFinal),
        tags: Array.isArray(document.tags) ? document.tags.join(", ") : "",
        receivedFrom: document.receivedFrom || "",
        producedTo: document.producedTo || "",
      });
    } else {
      setActiveDocument(null);
      setDocumentForm(createDefaultDocumentForm(baseMatterId, defaultCaseId));
    }

    setIsDocumentModalOpen(true);
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();
    if (isDocumentSubmitting) return;

    if (!documentForm.matter) {
      toast.error("Select a matter before saving the document.");
      return;
    }

    if (!documentForm.title.trim()) {
      toast.error("Document title is required.");
      return;
    }

    try {
      setIsDocumentSubmitting(true);
      const payload = {
        ...documentForm,
        version: Number(documentForm.version) || 1,
        tags: documentForm.tags
          ? documentForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      if (!payload.caseFile) {
        delete payload.caseFile;
      }

      if (activeDocument?._id) {
        await axiosInstance.put(
          API_PATHS.DOCUMENTS.UPDATE(activeDocument._id),
          payload
        );
        toast.success("Document updated successfully");
      } else {
        await axiosInstance.post(API_PATHS.DOCUMENTS.CREATE, payload);
        toast.success("Document created successfully");
      }

      setIsDocumentModalOpen(false);
      setActiveDocument(null);
      setDocumentForm(createDefaultDocumentForm(selectedMatterId, ""));
      if (selectedMatterId) {
        fetchMatterDetails(selectedMatterId);
      }
    } catch (error) {
      console.error("Failed to save document", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to save document.";
      toast.error(message);
    } finally {
      setIsDocumentSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!documentId) return;

    const confirmDelete = window.confirm(
      "Delete this document? Linked tasks will have the reference removed."
    );

    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(API_PATHS.DOCUMENTS.DELETE(documentId));
      toast.success("Document deleted successfully");
      if (selectedMatterId) {
        fetchMatterDetails(selectedMatterId);
      }
    } catch (error) {
      console.error("Failed to delete document", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to delete document.";
      toast.error(message);
    }
  };

  const renderMatterCard = (matter) => {
    const isActive = selectedMatterId === matter._id;
    const stats = matter.stats || {};
    const clientLabel = matter?.client?.name || matter.clientName || "";

    return (
      <button
        key={matter._id}
        type="button"
        onClick={() => setSelectedMatterId(matter._id)}
        className={`relative w-full rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40 sm:p-5 ${
          isActive
            ? "border-primary/70 bg-primary/5 shadow-[0_20px_40px_rgba(79,70,229,0.15)]"
            : "border-white/60 bg-white/70 shadow-[0_18px_32px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <LuBriefcase className="text-base" /> Matter
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {matter.status || "Active"}
          </div>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-900 line-clamp-2 dark:text-slate-100">
          {matter.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          {clientLabel}
        </p>
        {matter.matterNumber && (
          <p className="mt-2 text-xs font-medium text-slate-400">
            Matter #: {matter.matterNumber}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <LuLayers /> Cases
            </div>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              {stats.caseCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <LuFileText /> Docs
            </div>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              {stats.documentCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <LuCircleAlert /> Open Tasks
            </div>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              {stats.openTaskCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <LuBadgeCheck /> Closed
            </div>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              {stats.closedTaskCount ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openMatterModal(matter);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-medium text-primary transition hover:border-primary/40 hover:bg-primary/20"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleDeleteMatter(matter._id);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </button>
    );
  };

  const renderCaseCard = (caseFile) => (
    <div
      key={caseFile._id}
      className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 dark:border-slate-800/60 dark:bg-slate-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Case File</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {caseFile.title}
          </h4>
          {caseFile.caseNumber && (
            <p className="text-xs font-medium text-slate-500">Case #: {caseFile.caseNumber}</p>
          )}
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {caseFile.status || "Active"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-500 dark:text-slate-300 sm:grid-cols-2">
        {caseFile.jurisdiction && (
          <div className="flex items-center gap-2">
            <LuLayers className="text-primary" />
            <span>{caseFile.jurisdiction}</span>
          </div>
        )}
        {caseFile.court && (
          <div className="flex items-center gap-2">
            <LuGavel className="text-primary" />
            <span>{caseFile.court}</span>
          </div>
        )}
        {caseFile.filingDate && (
          <div className="flex items-center gap-2">
            <LuCalendarDays className="text-primary" />
            <span>{formatDateLabel(caseFile.filingDate)}</span>
          </div>
        )}
      </div>
      {caseFile.description && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
          {caseFile.description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => openCaseModal(caseFile)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-medium text-primary transition hover:border-primary/40 hover:bg-primary/20"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDeleteCase(caseFile._id)}
          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const renderDocumentCard = (document) => (
    <div
      key={document._id}
      className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 dark:border-slate-800/60 dark:bg-slate-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Document</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {document.title}
          </h4>
          {document.documentType && (
            <p className="text-xs font-medium text-slate-500">{document.documentType}</p>
          )}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
          v{document.version || 1}
        </span>
      </div>
      {document.description && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300 line-clamp-3">
          {document.description}
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <LuFolder className="text-primary" />
          <span>{document.caseFile?.title || "General"}</span>
        </div>
        <div className="flex items-center gap-2">
          <LuUsers className="text-primary" />
          <span>{document.uploadedBy?.name || "Unassigned"}</span>
        </div>
        {document.isFinal && (
          <div className="flex items-center gap-2 text-emerald-500">
            <LuCheckBadge />
            <span>Finalized</span>
          </div>
        )}
        {document.updatedAt && (
          <div className="flex items-center gap-2">
            <LuRefreshCw className="text-primary" />
            <span>{formatDateLabel(document.updatedAt)}</span>
          </div>
        )}
      </div>
      {Array.isArray(document.tags) && document.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {document.tags.map((tag) => (
            <span
              key={`${document._id}_${tag}`}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => openDocumentModal(document)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-medium text-primary transition hover:border-primary/40 hover:bg-primary/20"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDeleteDocument(document._id)}
          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout activeMenu="Matters">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-500 px-4 py-7 text-white shadow-[0_20px_45px_rgba(59,130,246,0.25)] sm:px-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/70">Matter Management</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Matters & Case Files</h2>
            <p className="mt-3 text-sm text-white/70">
              Track clients, cases, and their key documents in a single collaborative workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => openMatterModal()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
            >
              <LuPlus className="text-base" /> New Matter
            </button>
            {selectedMatterId && (
              <button
                type="button"
                onClick={() => openCaseModal()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
              >
                <LuFolder className="text-base" /> New Case
              </button>
            )}
            {selectedMatterId && (
              <button
                type="button"
                onClick={() => openDocumentModal()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
              >
                <LuFileText className="text-base" /> New Document
              </button>
            )}
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingOverlay message="Loading matters..." className="py-16" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs text-slate-500">
                <LuSearch />
                <span>Active Matters ({matterList.length})</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {matterList.map((matter) => renderMatterCard(matter))}

              {!matterList.length && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-sm text-slate-500 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                  No matters found. Create one to get started.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            {isDetailLoading ? (
              <LoadingOverlay message="Loading matter details..." className="py-16" />
            ) : !matterDetails ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-500 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                Select a matter to view its cases and documents.
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.1)] dark:border-slate-800/60 dark:bg-slate-900/60">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Client</p>
                      <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {matterDetails.matter?.client?.name ||
                          matterDetails.matter?.clientName ||
                          ""}
                      </h3>
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                        {matterDetails.matter?.description || "No description provided."}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-500 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <LuCalendarDays className="text-primary" />
                        <span>
                          Opened: {formatDateLabel(matterDetails.matter?.openedDate) || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LuUsers className="text-primary" />
                        <span>
                          Lead Attorney: {matterDetails.matter?.leadAttorney?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Case Files</h4>
                    <button
                      type="button"
                      onClick={() => openCaseModal()}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition hover:border-primary/40 hover:bg-primary/20"
                    >
                      <LuPlus /> New Case
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {matterDetails.caseFiles?.map((caseFile) => renderCaseCard(caseFile))}
                    {!matterDetails.caseFiles?.length && (
                      <div className="md:col-span-2">
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                          No case files created yet.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Documents & Evidence</h4>
                    <button
                      type="button"
                      onClick={() => openDocumentModal()}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition hover:border-primary/40 hover:bg-primary/20"
                    >
                      <LuPlus /> Add Document
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {matterDetails.documents?.map((document) => renderDocumentCard(document))}
                    {!matterDetails.documents?.length && (
                      <div className="md:col-span-2">
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                          No documents uploaded for this matter yet.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <Modal
        isOpen={isMatterModalOpen}
        onClose={() => {
          setIsMatterModalOpen(false);
          setActiveMatter(null);
          setMatterForm(createDefaultMatterForm());
        }}
        title={activeMatter ? "Update Matter" : "Create Matter"}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleMatterSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Matter Title</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.title}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, title: target.value }))
                }
                disabled={isMatterSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Client</label>
              <select
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.client}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, client: target.value }))
                }
                disabled={isMatterSubmitting || isClientListLoading}
                required
              >
                <option value="">Select a client</option>
                {clientOptions.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} {client.email ? `(${client.email})` : ""}
                  </option>
                ))}
              </select>
              {isClientListLoading && (
                <p className="text-xs text-slate-400">Loading clients...</p>
              )}
              {!isClientListLoading && !clientOptions.length && (
                <p className="text-xs text-slate-400">
                  No clients found. Add a client account to continue.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Matter Number</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.matterNumber}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, matterNumber: target.value }))
                }
                disabled={isMatterSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Practice Area</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.practiceArea}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, practiceArea: target.value }))
                }
                disabled={isMatterSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</label>
              <select
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.status}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, status: target.value }))
                }
                disabled={isMatterSubmitting}
              >
                {MATTER_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Opened Date</label>
              <input
                type="date"
                className="form-input mt-0 h-11 bg-slate-50"
                value={matterForm.openedDate}
                onChange={({ target }) =>
                  setMatterForm((prev) => ({ ...prev, openedDate: target.value }))
                }
                disabled={isMatterSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Notes</label>
            <textarea
              className="form-input mt-0 min-h-[120px] bg-slate-50"
              value={matterForm.notes}
              onChange={({ target }) =>
                setMatterForm((prev) => ({ ...prev, notes: target.value }))
              }
              disabled={isMatterSubmitting}
              placeholder="Key deadlines, parties, or strategy notes"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsMatterModalOpen(false);
                setActiveMatter(null);
                setMatterForm(createDefaultMatterForm());
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMatterSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isMatterSubmitting ? "Saving..." : "Save Matter"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCaseModalOpen}
        onClose={() => {
          setIsCaseModalOpen(false);
          setActiveCase(null);
          setCaseForm(createDefaultCaseForm(selectedMatterId));
        }}
        title={activeCase ? "Update Case File" : "Create Case File"}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleCaseSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Case Title</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.title}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, title: target.value }))
                }
                disabled={isCaseSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</label>
              <select
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.status}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, status: target.value }))
                }
                disabled={isCaseSubmitting}
              >
                {CASE_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Case Number</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.caseNumber}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, caseNumber: target.value }))
                }
                disabled={isCaseSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Jurisdiction</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.jurisdiction}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, jurisdiction: target.value }))
                }
                disabled={isCaseSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Court</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.court}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, court: target.value }))
                }
                disabled={isCaseSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Filing Date</label>
              <input
                type="date"
                className="form-input mt-0 h-11 bg-slate-50"
                value={caseForm.filingDate}
                onChange={({ target }) =>
                  setCaseForm((prev) => ({ ...prev, filingDate: target.value }))
                }
                disabled={isCaseSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Description</label>
            <textarea
              className="form-input mt-0 min-h-[120px] bg-slate-50"
              value={caseForm.description}
              onChange={({ target }) =>
                setCaseForm((prev) => ({ ...prev, description: target.value }))
              }
              disabled={isCaseSubmitting}
              placeholder="Key facts, deadlines or strategy notes"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCaseModalOpen(false);
                setActiveCase(null);
                setCaseForm(createDefaultCaseForm(selectedMatterId));
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCaseSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCaseSubmitting ? "Saving..." : "Save Case"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setActiveDocument(null);
          setDocumentForm(createDefaultDocumentForm(selectedMatterId, ""));
        }}
        title={activeDocument ? "Update Document" : "Add Document"}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Title</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.title}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, title: target.value }))
                }
                disabled={isDocumentSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Document Type</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.documentType}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, documentType: target.value }))
                }
                disabled={isDocumentSubmitting}
                placeholder="e.g. Pleading, Evidence"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Case File</label>
              <select
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.caseFile}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, caseFile: target.value }))
                }
                disabled={isDocumentSubmitting || !selectedMatterId}
              >
                <option value="">General Matter</option>
                {matterDetails?.caseFiles?.map((caseFile) => (
                  <option key={caseFile._id} value={caseFile._id}>
                    {caseFile.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Version</label>
              <input
                type="number"
                min={1}
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.version}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, version: target.value }))
                }
                disabled={isDocumentSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <input
                  type="checkbox"
                  checked={documentForm.isFinal}
                  onChange={({ target }) =>
                    setDocumentForm((prev) => ({ ...prev, isFinal: target.checked }))
                  }
                  disabled={isDocumentSubmitting}
                />
                Final Version
              </label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">File URL</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.fileUrl}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, fileUrl: target.value }))
                }
                disabled={isDocumentSubmitting}
                placeholder="Link to stored document"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Description</label>
            <textarea
              className="form-input mt-0 min-h-[120px] bg-slate-50"
              value={documentForm.description}
              onChange={({ target }) =>
                setDocumentForm((prev) => ({ ...prev, description: target.value }))
              }
              disabled={isDocumentSubmitting}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Tags</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.tags}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, tags: target.value }))
                }
                disabled={isDocumentSubmitting}
                placeholder="Comma separated"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Received From</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.receivedFrom}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, receivedFrom: target.value }))
                }
                disabled={isDocumentSubmitting}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Produced To</label>
              <input
                className="form-input mt-0 h-11 bg-slate-50"
                value={documentForm.producedTo}
                onChange={({ target }) =>
                  setDocumentForm((prev) => ({ ...prev, producedTo: target.value }))
                }
                disabled={isDocumentSubmitting}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsDocumentModalOpen(false);
                setActiveDocument(null);
                setDocumentForm(createDefaultDocumentForm(selectedMatterId, ""));
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDocumentSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDocumentSubmitting ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Matters;
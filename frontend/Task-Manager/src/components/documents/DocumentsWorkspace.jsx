import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuArrowDownWideNarrow,
  LuCheck,
  LuCircleDashed,
  LuFileText,
  LuFilter,
  LuFolder,
  LuFolderTree,
  LuLayers,
  LuRefreshCw,
  LuSearch,
  LuShare2,
  LuSparkles,
} from "react-icons/lu";
import toast from "react-hot-toast";

import LoadingOverlay from "../LoadingOverlay";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateLabel, formatMediumDateTime } from "../../utils/dateUtils";

const SHARE_OPTIONS = [
  { value: "view", label: "View only", description: "Recipients can view but not edit." },
  { value: "edit", label: "Can Edit", description: "Recipients can update files and add new versions." },
  { value: "owner", label: "Owner", description: "Full permissions including managing access." },
];

const DocumentsWorkspace = () => {
  const [matters, setMatters] = useState([]);
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedMatterId, setSelectedMatterId] = useState("all");
  const [selectedCaseId, setSelectedCaseId] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFinalOnly, setShowFinalOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [shareTarget, setShareTarget] = useState(null);

  const fetchWorkspaceData = async () => {
    try {
      const [mattersResponse, casesResponse, documentsResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.MATTERS.GET_ALL),
        axiosInstance.get(API_PATHS.CASES.GET_ALL),
        axiosInstance.get(API_PATHS.DOCUMENTS.GET_ALL),
      ]);

      const fetchedMatters = Array.isArray(mattersResponse.data?.matters)
        ? mattersResponse.data.matters
        : [];
      const fetchedCases = Array.isArray(casesResponse.data?.cases)
        ? casesResponse.data.cases
        : [];
      const fetchedDocuments = Array.isArray(documentsResponse.data?.documents)
        ? documentsResponse.data.documents
        : [];

      setMatters(fetchedMatters);
      setCases(fetchedCases);
      setDocuments(fetchedDocuments);
    } catch (error) {
      console.error("Failed to fetch document workspace data", error);
      toast.error(
        error.response?.data?.message ||
          "We were unable to load the documents workspace. Please try again."
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await fetchWorkspaceData();
      setIsLoading(false);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!shareTarget) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        event.target.closest("[data-share-menu]") ||
        event.target.closest("[data-share-trigger]")
      ) {
        return;
      }

      setShareTarget(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [shareTarget]);

  const matterLookup = useMemo(() => {
    const lookup = new Map();
    matters.forEach((matter) => {
      if (matter?._id) {
        lookup.set(matter._id, matter);
      }
    });
    return lookup;
  }, [matters]);

  const caseLookupByMatter = useMemo(() => {
    const grouped = new Map();
    cases.forEach((caseFile) => {
      const matterId = caseFile?.matter?._id || caseFile?.matter;
      if (!matterId) {
        return;
      }

      if (!grouped.has(matterId)) {
        grouped.set(matterId, []);
      }

      grouped.get(matterId).push(caseFile);
    });
    return grouped;
  }, [cases]);

  const documentTypes = useMemo(() => {
    const typeSet = new Set();
    documents.forEach((document) => {
      if (document?.documentType) {
        typeSet.add(document.documentType.trim());
      }
    });
    return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const matterFolders = useMemo(() => {
    const folderMap = new Map();

    matters.forEach((matter) => {
      if (!matter?._id) {
        return;
      }

      folderMap.set(matter._id, {
        matter,
        documents: [],
        cases: [],
      });
    });

    cases.forEach((caseFile) => {
      const matterId = caseFile?.matter?._id || caseFile?.matter;
      if (!matterId) {
        return;
      }

      if (!folderMap.has(matterId)) {
        const fallbackMatter = matterLookup.get(matterId) || {
          _id: matterId,
          title: "Unassigned Matter",
        };
        folderMap.set(matterId, {
          matter: fallbackMatter,
          documents: [],
          cases: [],
        });
      }

      folderMap.get(matterId).cases.push({
        caseFile,
        documents: [],
      });
    });

    documents.forEach((document) => {
      const matterId = document?.matter?._id || document?.matter;
      const caseId = document?.caseFile?._id || document?.caseFile;

      if (!matterId) {
        return;
      }

      if (!folderMap.has(matterId)) {
        const fallbackMatter = matterLookup.get(matterId) || {
          _id: matterId,
          title: "Unassigned Matter",
        };
        folderMap.set(matterId, {
          matter: fallbackMatter,
          documents: [],
          cases: [],
        });
      }

      if (caseId) {
        const targetMatter = folderMap.get(matterId);
        let targetCase = targetMatter.cases.find((entry) => {
          const entryId = entry.caseFile?._id || entry.caseFile?.id;
          return entryId === caseId;
        });

        if (!targetCase) {
          targetCase = {
            caseFile: {
              _id: caseId,
              title: document.caseFile?.title || "Case Folder",
            },
            documents: [],
          };
          targetMatter.cases.push(targetCase);
        }

        targetCase.documents.push(document);
      } else {
        folderMap.get(matterId).documents.push(document);
      }
    });

    return Array.from(folderMap.values()).sort((a, b) => {
      const titleA = a.matter?.title || "";
      const titleB = b.matter?.title || "";
      return titleA.localeCompare(titleB);
    });
  }, [cases, documents, matterLookup, matters]);

  const caseOptionsForSelectedMatter = useMemo(() => {
    if (selectedMatterId === "all") {
      return [];
    }

    const relatedCases = caseLookupByMatter.get(selectedMatterId) || [];
    return relatedCases
      .map((caseFile) => ({
        label: caseFile?.title || "Untitled Case",
        value: caseFile?._id || "",
      }))
      .filter((option) => option.value);
  }, [caseLookupByMatter, selectedMatterId]);

  const filterDocuments = useCallback(
    (items) =>
      items.filter((document) => {
        if (!document) {
          return false;
        }

        if (selectedType !== "all") {
          const normalizedType = document?.documentType?.trim() || "";
          if (normalizedType.toLowerCase() !== selectedType.toLowerCase()) {
            return false;
          }
        }

        if (showFinalOnly && !document?.isFinal) {
          return false;
        }

        if (selectedMatterId !== "all") {
          const documentMatterId = document?.matter?._id || document?.matter;
          if (documentMatterId !== selectedMatterId) {
            return false;
          }
        }

        if (selectedCaseId !== "all") {
          const documentCaseId = document?.caseFile?._id || document?.caseFile;
          if (documentCaseId !== selectedCaseId) {
            return false;
          }
        }

        if (searchTerm.trim()) {
          const normalizedSearch = searchTerm.trim().toLowerCase();
          const matches = [
            document?.title,
            document?.description,
            document?.documentType,
            ...(Array.isArray(document?.tags) ? document.tags : []),
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch));

          if (!matches) {
            return false;
          }
        }

        return true;
      }),
    [
      searchTerm,
      selectedCaseId,
      selectedMatterId,
      selectedType,
      showFinalOnly,
    ]
  );

  const filteredFolders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return matterFolders
      .map((folder) => {
        if (!folder?.matter?._id) {
          return null;
        }

        const matterId = folder.matter._id;
        const matterMatchesFilter =
          selectedMatterId === "all" || selectedMatterId === matterId;

        if (!matterMatchesFilter) {
          return null;
        }

        const matterMatchesSearch = normalizedSearch
          ? [
              folder.matter.title,
              folder.matter.client?.name,
              folder.matter.matterNumber,
            ]
              .filter(Boolean)
              .some((value) =>
                value.toLowerCase().includes(normalizedSearch)
              )
          : true;

        const filteredMatterDocuments = filterDocuments(folder.documents);

        const filteredCases = folder.cases
          .map((caseEntry) => {
            const caseId = caseEntry.caseFile?._id || caseEntry.caseFile?.id;
            if (!caseId) {
              return null;
            }

            if (selectedCaseId !== "all" && selectedCaseId !== caseId) {
              return null;
            }

            const caseMatchesSearch = normalizedSearch
              ? [caseEntry.caseFile?.title, caseEntry.caseFile?.caseNumber]
                  .filter(Boolean)
                  .some((value) =>
                    value.toLowerCase().includes(normalizedSearch)
                  )
              : true;

            const filteredDocuments = filterDocuments(caseEntry.documents);

            if (!caseMatchesSearch && normalizedSearch && filteredDocuments.length === 0) {
              return null;
            }

            return {
              ...caseEntry,
              documents: filteredDocuments,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const titleA = a.caseFile?.title || "";
            const titleB = b.caseFile?.title || "";
            return titleA.localeCompare(titleB);
          });

        const hasVisibleContent =
          filteredMatterDocuments.length > 0 || filteredCases.length > 0;

        if (normalizedSearch && !matterMatchesSearch && !hasVisibleContent) {
          return null;
        }

        return {
          ...folder,
          documents: filteredMatterDocuments,
          cases: filteredCases,
        };
      })
      .filter(Boolean);
  }, [filterDocuments, matterFolders, searchTerm, selectedCaseId, selectedMatterId]);

  const totalCaseCount = useMemo(() => cases.length, [cases]);
  const totalDocumentCount = useMemo(() => documents.length, [documents]);

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await fetchWorkspaceData();
      toast.success("Workspace refreshed");
    } catch (error) {
      console.error("Failed to refresh workspace", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleShareMenu = (target) => {
    setShareTarget((current) => {
      if (current && current.type === target.type && current.id === target.id) {
        return null;
      }

      return target;
    });
  };

  const handleShareOptionSelect = (option) => {
    if (!shareTarget) {
      return;
    }

    toast.success(`${option.label} access ready to configure for ${shareTarget.name}`);
    setShareTarget(null);
  };

  const renderShareMenu = (targetId, targetType, targetName) => {
    const isOpen =
      shareTarget &&
      shareTarget.id === targetId &&
      shareTarget.type === targetType;

    if (!isOpen) {
      return null;
    }

    return (
      <div
        data-share-menu
        className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900"
      >
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Sharing access
        </p>
        <div className="space-y-1">
          {SHARE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => handleShareOptionSelect(option)}
            >
              <span className="flex items-center gap-2 font-medium">
                <LuCheck className="h-4 w-4 text-slate-300" />
                {option.label}
              </span>
              <span className="text-xs text-slate-400">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentCard = (document) => {
    const documentId = document?._id || document?.id;
    const updatedAt = formatMediumDateTime(document?.updatedAt, "");
    const uploadedDate = formatDateLabel(document?.createdAt, "");
    const uploadedBy = document?.uploadedBy?.name || document?.uploadedBy?.email || "Unknown";
    const typeLabel = document?.documentType || "General";

    return (
      <div
        key={documentId || Math.random()}
        className="relative rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-primary/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid gap-y-3 gap-x-4 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <LuFileText />
            </span>
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {document?.title || "Untitled Document"}
              </h4>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {typeLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                  <LuLayers className="h-3 w-3" /> v{document?.version || 1}
                </span>
                {document?.isFinal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <LuSparkles className="h-3 w-3" /> Final
                  </span>
                )}
                {Array.isArray(document?.tags) && document.tags.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                    <LuFilter className="h-3 w-3" /> {document.tags.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Uploaded </span>
            {uploadedDate || "Recently"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {updatedAt ? (
              <span className="inline-flex items-center gap-1">
                <LuArrowDownWideNarrow className="h-3 w-3" /> {updatedAt}
              </span>
            ) : (
              "No recent updates"
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <LuCircleDashed className="h-3 w-3" /> {uploadedBy}
            </span>
          </div>
          <div className="relative flex justify-end" data-share-trigger>
            <button
              type="button"
              onClick={() =>
                toggleShareMenu({
                  id: documentId,
                  type: "document",
                  name: document?.title || "Document",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <LuShare2 className="h-4 w-4" /> Share
            </button>
            {renderShareMenu(documentId, "document", document?.title || "Document")}
          </div>
        </div>
      </div>
    );
  };

  const renderCaseFolder = (caseEntry) => {
    const caseId = caseEntry.caseFile?._id || caseEntry.caseFile?.id;
    const title = caseEntry.caseFile?.title || "Untitled Case";
    const caseNumber = caseEntry.caseFile?.caseNumber || "No case number";

    return (
      <div
        key={caseId || title}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <LuFolder />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{caseNumber}</p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                {caseEntry.documents.length} document{caseEntry.documents.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="relative" data-share-trigger>
            <button
              type="button"
              onClick={() => toggleShareMenu({ id: caseId, type: "case", name: title })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <LuShare2 className="h-4 w-4" /> Share
            </button>
            {renderShareMenu(caseId, "case", title)}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {caseEntry.documents.length > 0 ? (
            caseEntry.documents.map((document) => renderDocumentCard(document))
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <LuCircleDashed className="h-4 w-4" />
              <span>No documents have been added to this case folder yet.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMatterFolder = (folder) => {
    const matterId = folder.matter?._id || folder.matter?.id;
    const title = folder.matter?.title || "Untitled Matter";
    const clientName =
      folder.matter?.client?.name || folder.matter?.clientName || "Client pending";
    const totalDocuments =
      folder.documents.length +
      folder.cases.reduce((total, entry) => total + entry.documents.length, 0);

    return (
      <div
        key={matterId || title}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <LuFolderTree />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{clientName}</p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                {totalDocuments} document{totalDocuments === 1 ? "" : "s"} • {folder.cases.length} case folder{folder.cases.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="relative" data-share-trigger>
            <button
              type="button"
              onClick={() => toggleShareMenu({ id: matterId, type: "matter", name: title })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <LuShare2 className="h-4 w-4" /> Share
            </button>
            {renderShareMenu(matterId, "matter", title)}
          </div>
        </div>

        <div className="space-y-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          {folder.documents.length > 0 ? (
            folder.documents.map((document) => renderDocumentCard(document))
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <LuCircleDashed className="h-4 w-4" />
              <span>No documents filed directly under this matter yet.</span>
            </div>
          )}
        </div>

        {folder.cases.length > 0 ? (
          <div className="space-y-3 px-6 py-5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Case subfolders</h4>
            <div className="space-y-3">
              {folder.cases.map((caseEntry) => renderCaseFolder(caseEntry))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
            <LuCircleDashed className="h-4 w-4" />
            <span>No case folders have been created for this matter yet.</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message="Preparing document workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
            Documents
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
            Collaborative Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Every new matter automatically spins up a secure folder, with case files neatly organised inside. Apply filters, search across descriptions or tags, and share access in a click.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
        >
          <LuRefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Matters
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {matterFolders.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              active folders
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Case files
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalCaseCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">subfolders</span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Documents
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalDocumentCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">files stored</span>
          </div>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-indigo-200/20 to-sky-200/20 p-4 text-primary shadow-[0_18px_36px_rgba(59,130,246,0.25)] dark:border-indigo-400/40 dark:from-indigo-500/20 dark:via-sky-500/10 dark:to-transparent">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]">
            Sharing
          </p>
          <div className="mt-2 text-sm font-medium">
            Grant "View only", "Can Edit", or "Owner" access on any folder in seconds.
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[30px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Search workspace
            </label>
            <div className="relative mt-2">
              <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by document title, description, tag, matter, or case"
                className="w-full rounded-2xl border border-slate-200 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[520px]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Matter folder
              </label>
              <select
                value={selectedMatterId}
                onChange={(event) => {
                  setSelectedMatterId(event.target.value);
                  setSelectedCaseId("all");
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <option value="all">All matters</option>
                {matterFolders.map((folder) => (
                  <option key={folder.matter?._id} value={folder.matter?._id}>
                    {folder.matter?.title || "Untitled Matter"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Case subfolder
              </label>
              <select
                value={selectedCaseId}
                onChange={(event) => setSelectedCaseId(event.target.value)}
                disabled={selectedMatterId === "all" || caseOptionsForSelectedMatter.length === 0}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <option value="all">All cases</option>
                {caseOptionsForSelectedMatter.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Document type
              </label>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <option value="all">All types</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Quick filter
              </label>
              <button
                type="button"
                onClick={() => setShowFinalOnly((prev) => !prev)}
                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  showFinalOnly
                    ? "border-emerald-400 bg-emerald-50/70 text-emerald-600 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                }`}
              >
                <LuSparkles className="h-4 w-4" /> Final versions only
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredFolders.length > 0 ? (
          filteredFolders.map((folder) => renderMatterFolder(folder))
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            <LuCircleDashed className="h-10 w-10" />
            <div className="text-base font-medium">
              No documents matched your filters. Try adjusting the search or filters above.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsWorkspace;
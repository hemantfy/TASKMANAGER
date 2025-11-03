import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuArrowLeft,
  LuFileText,
  LuFolder,
  LuFolderTree,
  LuRefreshCw,
} from "react-icons/lu";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import LoadingOverlay from "../LoadingOverlay";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatMediumDateTime } from "../../utils/dateUtils";

const trimSlashes = (value, { keepLeading = false } = {}) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  const withoutLeading = keepLeading
    ? trimmed.replace(/\/+$/g, "")
    : trimmed.replace(/^\/+/, "").replace(/\/+$/g, "");

  if (keepLeading) {
    return withoutLeading.startsWith("/")
      ? withoutLeading
      : `/${withoutLeading.replace(/^\/+/, "")}`;
  }

  return withoutLeading;
};

const joinPaths = (...parts) => {
  const filtered = parts
    .filter((part) => part !== null && part !== undefined && `${part}`.trim().length > 0)
    .map((part) => `${part}`);

  if (filtered.length === 0) {
    return "/";
  }

  const [first, ...rest] = filtered;
  let base = trimSlashes(first, { keepLeading: true });

  if (!base) {
    base = "/";
  }

  if (rest.length === 0) {
    return base === "/" ? "/" : base.replace(/\/+$/g, "");
  }

  const tail = rest
    .map((segment) => trimSlashes(segment))
    .filter((segment) => segment.length > 0);

  if (tail.length === 0) {
    return base === "/" ? "/" : base.replace(/\/+$/g, "");
  }

  return `${base.replace(/\/+$/g, "")}/${tail.join("/")}`.replace(/\/+$/g, "");
};

const resolveDocumentUrl = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") {
    return "";
  }

  if (/^https?:\/\//iu.test(fileUrl)) {
    return fileUrl;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const normalizedBase = baseUrl.replace(/\/+$/g, "");
  const normalizedPath = fileUrl.replace(/^\/+/, "");

  if (!normalizedBase) {
    return `/${normalizedPath}`.replace(/\/+$/g, "");
  }

  return `${normalizedBase}/${normalizedPath}`;
};

const DocumentsWorkspace = ({ basePath = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matterId, caseId } = useParams();

  const [matters, setMatters] = useState([]);
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseRoute = useMemo(() => {
    if (basePath) {
      return joinPaths(basePath);
    }

    const segments = location.pathname.split("/").filter(Boolean);

    if (!matterId) {
      return joinPaths(`/${segments.join("/")}`);
    }

    if (matterId && !caseId) {
      const baseSegments = segments.slice(0, -1);
      return joinPaths(`/${baseSegments.join("/")}`);
    }

    const baseSegments = segments.slice(0, -3);
    return joinPaths(`/${baseSegments.join("/")}`);
  }, [basePath, location.pathname, matterId, caseId]);

  const fetchWorkspaceData = useCallback(async () => {
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
      throw error;      
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await fetchWorkspaceData();
      } catch {
        // Error already handled in fetchWorkspaceData.
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [fetchWorkspaceData]);

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await fetchWorkspaceData();
      toast.success("Workspace refreshed");
    } catch {
      // Error already surfaced in fetchWorkspaceData.
    } finally {
      setIsRefreshing(false);
    }
  };

  const matterLookup = useMemo(() => {
    const lookup = new Map();
    matters.forEach((matter) => {
      if (matter?._id) {
        lookup.set(matter._id, matter);
      }
    });
    return lookup;
  }, [matters]);

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
      const relatedMatterId = caseFile?.matter?._id || caseFile?.matter;
      if (!relatedMatterId) {
        return;
      }

      if (!folderMap.has(relatedMatterId)) {
        const fallbackMatter = matterLookup.get(relatedMatterId) || {
          _id: relatedMatterId,
          title: "Unassigned Matter",
        };

        folderMap.set(relatedMatterId, {
          matter: fallbackMatter,
          documents: [],
          cases: [],
        });
      }

      folderMap.get(relatedMatterId).cases.push({
        caseFile,
        documents: [],
      });
    });

    documents.forEach((document) => {
      const relatedMatterId = document?.matter?._id || document?.matter;
      const relatedCaseId = document?.caseFile?._id || document?.caseFile;

      if (!relatedMatterId) {
        return;
      }

      if (!folderMap.has(relatedMatterId)) {
        const fallbackMatter = matterLookup.get(relatedMatterId) || {
          _id: relatedMatterId,
          title: "Unassigned Matter",
        };

        folderMap.set(relatedMatterId, {
          matter: fallbackMatter,
          documents: [],
          cases: [],
        });
      }

      if (relatedCaseId) {
        const targetMatter = folderMap.get(relatedMatterId);
        let targetCase = targetMatter.cases.find((entry) => {
          const entryId = entry.caseFile?._id || entry.caseFile?.id;
          return entryId === relatedCaseId;
        });

        if (!targetCase) {
          targetCase = {
            caseFile: {
              _id: relatedCaseId,
              title: document.caseFile?.title || "Case Folder",
            },
            documents: [],
          };
          targetMatter.cases.push(targetCase);
        }

        targetCase.documents.push(document);
      } else {
        folderMap.get(relatedMatterId).documents.push(document);
      }
    });

    return Array.from(folderMap.values()).sort((a, b) => {
      const titleA = a.matter?.title || "";
      const titleB = b.matter?.title || "";
      return titleA.localeCompare(titleB);
    });
  }, [cases, documents, matterLookup, matters]);

  const selectedMatter = useMemo(() => {
    if (!matterId) {
      return null;
    }

    return matterFolders.find((folder) => folder.matter?._id === matterId) || null;
  }, [matterFolders, matterId]);

  const selectedCase = useMemo(() => {
    if (!caseId || !selectedMatter) {
      return null;
    }

    return (
      selectedMatter.cases.find((entry) => {
        const entryId = entry.caseFile?._id || entry.caseFile?.id;
        return entryId === caseId;
      }) || null
    );
  }, [caseId, selectedMatter]);

  useEffect(() => {
    if (!isLoading && matterId && !selectedMatter) {
      toast.error("We couldn't find that matter folder.");
      navigate(joinPaths(baseRoute), { replace: true });
    }
  }, [baseRoute, isLoading, matterId, navigate, selectedMatter]);

  useEffect(() => {
    if (!isLoading && caseId && selectedMatter && !selectedCase) {
      toast.error("We couldn't find that subfolder.");
      navigate(joinPaths(baseRoute, matterId), { replace: true });
    }
  }, [baseRoute, caseId, isLoading, matterId, navigate, selectedCase, selectedMatter]);

  const handleOpenMatter = (targetMatterId) => {
    if (!targetMatterId) {
      return;
    }

    navigate(joinPaths(baseRoute, targetMatterId));
  };

  const handleOpenCase = (targetCaseId) => {
    if (!targetCaseId || !matterId) {
      return;
    }

     navigate(joinPaths(baseRoute, matterId, "cases", targetCaseId));
  };

  const handleBackToMatters = () => {
    navigate(joinPaths(baseRoute)); 
  };

  const handleBackToMatter = () => {
    if (!matterId) {
      handleBackToMatters();
      return;
    }

    navigate(joinPaths(baseRoute, matterId));
  };

  const visibleDocuments = useMemo(() => {
    if (caseId && selectedCase) {
      return selectedCase.documents;
    }

    if (matterId && selectedMatter) {
      return selectedMatter.documents;
    }

    return [];
  }, [caseId, matterId, selectedCase, selectedMatter]);

  const renderDocumentList = () => {
    if (!visibleDocuments || visibleDocuments.length === 0) {
      return (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No documents available in this folder yet.
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {visibleDocuments.map((document) => {
          const documentId = document?._id || document?.id || document?.uuid;
          const documentUrl = resolveDocumentUrl(document?.fileUrl);
          const updatedLabel = formatMediumDateTime(document?.updatedAt, "Recently updated");

          return (
            <li
              key={documentId || Math.random()}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm transition hover:border-primary/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <LuFileText className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {document?.title || "Untitled Document"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{updatedLabel}</p>
                  {document?.version && (
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">v{document.version}</p>
                  )}
                </div>
              </div>
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 dark:border-primary/50"
                >
                  Open document
                </a>
              )}
            </li>
          );
        })}
      </ul>
    );
  };      

  const renderMatterList = () => (
    <div className="rounded-[30px] border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
      {matterFolders.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No matter folders are available yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {matterFolders.map((folder) => (
            <li key={folder.matter?._id || Math.random()}>
              <button
                type="button"
                onClick={() => handleOpenMatter(folder.matter?._id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 text-left text-base font-medium text-slate-700 transition hover:border-primary/40 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:bg-slate-800/70"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <LuFolder className="h-5 w-5" />
                  </span>
                  <span>{folder.matter?.title || "Untitled Matter"}</span>
                </span>
                <LuFolderTree className="h-5 w-5 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderMatterDetail = () => {
    if (!selectedMatter) {
      return null;
    }

    const caseEntries = selectedMatter.cases || [];

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBackToMatters}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to all matters
        </button>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
              <LuFolder className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedMatter.matter?.title || "Untitled Matter"}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Subfolders
          </h3>
          {caseEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No case subfolders are available for this matter.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {caseEntries
                .slice()
                .sort((a, b) => {
                  const titleA = a.caseFile?.title || "";
                  const titleB = b.caseFile?.title || "";
                  return titleA.localeCompare(titleB);
                })
                .map((caseEntry) => {
                  const targetCaseId = caseEntry.caseFile?._id || caseEntry.caseFile?.id;

                  return (
                    <li key={targetCaseId || Math.random()}>
                      <button
                        type="button"
                        onClick={() => handleOpenCase(targetCaseId)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 text-left text-base font-medium text-slate-700 transition hover:border-primary/40 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:bg-slate-800/70"
                      >
                        <span className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                            <LuFolderTree className="h-5 w-5" />
                          </span>
                          <span>{caseEntry.caseFile?.title || "Untitled Case"}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Documents in this folder
          </h3>
          <div className="mt-4">{renderDocumentList()}</div>
        </div>        
      </div>
    );
  };

  const renderCaseDetail = () => {
    if (!selectedMatter || !selectedCase) {
      return null;
    }

    return (
     <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBackToMatters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
          >
            <LuArrowLeft className="h-4 w-4" />
            All matters
          </button>
          <button
            type="button"
            onClick={handleBackToMatter}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
          >
            <LuArrowLeft className="h-4 w-4" />
            {selectedMatter.matter?.title || "Back to matter"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
             <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
              <LuFolderTree className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedCase.caseFile?.title || "Untitled Case"}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/70">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Documents in this subfolder
          </h3>
          <div className="mt-4">{renderDocumentList()}</div>
        </div>
      </div>
    );
  };

  if (isLoading) {
      return (
      <div className="relative">
        <LoadingOverlay message="Loading documents..." />
      </div>
    );
  }

  const isMatterView = Boolean(matterId);
  const isCaseView = Boolean(matterId && caseId);

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Documents
          </h1>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
        >
          <LuRefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {!isMatterView && renderMatterList()}
      {isMatterView && !isCaseView && renderMatterDetail()}
      {isCaseView && renderCaseDetail()}
    </div>
  );
};

export default DocumentsWorkspace;
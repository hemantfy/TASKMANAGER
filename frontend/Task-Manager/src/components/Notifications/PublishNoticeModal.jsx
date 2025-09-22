import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const PublishNoticeModal = ({ open, onClose, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a notice message");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosInstance.post(API_PATHS.NOTICES.PUBLISH, {
        message: message.trim(),
      });

      toast.success(
        response.data?.message || "Notice published successfully"
      );

      setSubmitting(false);
      if (typeof onSuccess === "function") {
        onSuccess(response.data?.notice || null);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to publish notice";
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Publish Notice
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            disabled={submitting}
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="notice-message"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            >
              Notice Message
            </label>
            <textarea
              id="notice-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Write the announcement you want users to see"
              disabled={submitting}
            />
          </div>

          <p className="text-xs text-slate-500">
            Publishing a new notice will replace the current announcement on
            every user dashboard.
          </p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-80"
              disabled={submitting}
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PublishNoticeModal;
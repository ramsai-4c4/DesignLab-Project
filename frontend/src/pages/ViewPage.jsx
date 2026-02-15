import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiCopy,
  FiCheck,
  FiDownload,
  FiLock,
  FiTrash2,
  FiAlertTriangle,
  FiClock,
} from "react-icons/fi";
import { getMeta, viewContent, deleteUpload } from "../api";
import { formatDistanceToNow } from "date-fns";

export default function ViewPage() {
  const { slug } = useParams();

  const [status, setStatus] = useState("loading"); // loading | needsPassword | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState(null);
  const [content, setContent] = useState(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* 1) Fetch metadata (guarded against StrictMode double-mount) */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const m = await getMeta(slug);
        if (cancelled) return;          // component unmounted (StrictMode re-mount)
        setMeta(m);
        if (m.hasPassword) {
          setStatus("needsPassword");
        } else {
          const c = await viewContent(slug, null);
          if (cancelled) return;
          setContent(c);
          setStatus("ready");
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          setStatus("needsPassword");
        } else {
          handleApiError(err);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* 2) Fetch actual content */
  const fetchContent = async (pw) => {
    try {
      const c = await viewContent(slug, pw);
      setContent(c);
      setStatus("ready");
    } catch (err) {
      if (err.response?.status === 401) {
        setStatus("needsPassword");
        if (pw) toast.error("Incorrect password.");
      } else {
        handleApiError(err);
      }
    }
  };

  const handleApiError = (err) => {
    const msg =
      err.response?.data?.error || "Something went wrong.";
    setErrorMsg(msg);
    setStatus("error");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    fetchContent(password);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(content.textContent);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this upload?")) return;
    setDeleting(true);
    try {
      await deleteUpload(slug);
      toast.success("Deleted.");
      setStatus("error");
      setErrorMsg("This upload has been deleted.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Loading ────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-10 w-10 border-4 border-brand-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ─── Error / Expired ────────────────────────────────────── */
  if (status === "error") {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg border p-8 space-y-4">
        <FiAlertTriangle className="mx-auto text-5xl text-red-400" />
        <h2 className="text-xl font-bold text-gray-700">Oops!</h2>
        <p className="text-gray-500">{errorMsg}</p>
        <Link
          to="/"
          className="inline-block mt-2 px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition font-medium"
        >
          Go Home
        </Link>
      </div>
    );
  }

  /* ─── Password prompt ────────────────────────────────────── */
  if (status === "needsPassword") {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg border p-8 space-y-6 text-center">
        <FiLock className="mx-auto text-5xl text-brand-400" />
        <h2 className="text-xl font-bold text-gray-700">
          This link is password-protected
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-2 text-center focus:ring-2 focus:ring-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition font-medium"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  /* ─── Content ready ──────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Info bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl shadow border px-5 py-3 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <FiClock />
          {content.oneTimeView ? (
            <span className="text-orange-500 font-medium">
              🔥 This was a one-time view. Content is now deleted.
            </span>
          ) : (
            <span>
              Expires{" "}
              {formatDistanceToNow(new Date(content.expiresAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        {content.maxViews && (
          <span>
            Views: {content.viewCount} / {content.maxViews}
          </span>
        )}
      </div>

      {/* Content card */}
      <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
        {content.type === "text" ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Shared Text</h2>
              <button
                onClick={copyText}
                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border hover:bg-brand-50 transition text-brand-600"
              >
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-4 text-sm font-mono max-h-[60vh] overflow-auto border">
              {content.textContent}
            </pre>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-gray-700">Shared File</h2>
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border">
              <div className="flex-1">
                <p className="font-medium truncate">{content.fileName}</p>
                <p className="text-xs text-gray-400">
                  {content.fileMimeType} &middot;{" "}
                  {(content.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    toast.loading("Downloading…", { id: "dl" });
                    const resp = await fetch(content.downloadUrl);
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = content.fileName || "download";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast.success("Download started!", { id: "dl" });
                  } catch {
                    toast.error("Download failed.", { id: "dl" });
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition font-medium text-sm shrink-0"
              >
                <FiDownload /> Download
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete button — shown for anonymous uploads or to the owner */}
      {!content.oneTimeView && (meta?.isOwner !== false) && (
        <div className="text-center">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition"
          >
            <FiTrash2 /> {deleting ? "Deleting…" : "Delete this upload"}
          </button>
        </div>
      )}
    </div>
  );
}

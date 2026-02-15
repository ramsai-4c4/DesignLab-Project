import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";
import { createUpload } from "../api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".msi", ".scr", ".pif",
  ".com", ".vbs", ".vbe", ".js", ".jse", ".ws",
  ".wsf", ".wsc", ".wsh", ".ps1", ".ps2", ".reg",
  ".inf", ".lnk", ".dll", ".sys",
];

function isBlockedFile(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return BLOCKED_EXTENSIONS.includes(ext);
}

export default function HomePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [mode, setMode] = useState("text"); // "text" | "file"
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState(null);
  const [expiresIn, setExpiresIn] = useState(""); // minutes
  const [password, setPassword] = useState("");
  const [oneTimeView, setOneTimeView] = useState(false);
  const [maxViews, setMaxViews] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File exceeds 50 MB limit.");
      return;
    }
    if (isBlockedFile(f.name)) {
      toast.error("This file type is not allowed for security reasons.");
      return;
    }
    setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "text" && !textContent.trim()) {
      toast.error("Please enter some text.");
      return;
    }
    if (mode === "file" && !file) {
      toast.error("Please select a file.");
      return;
    }

    const fd = new FormData();

    if (mode === "text") {
      fd.append("textContent", textContent);
    } else {
      fd.append("file", file);
    }

    if (expiresIn) fd.append("expiresIn", expiresIn);
    if (password) fd.append("password", password);
    if (oneTimeView) fd.append("oneTimeView", "true");
    if (maxViews) fd.append("maxViews", maxViews);

    setLoading(true);
    try {
      const res = await createUpload(fd);
      toast.success("Upload successful!");
      navigate(`/result/${res.slug}`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Upload failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-brand-700 mb-2">
          Share Securely
        </h1>
        <p className="text-gray-500">
          Upload text or a file and get a unique, shareable link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl shadow-2xl border p-6 space-y-6"
      >
        {/* ── Mode toggle ───────────────────────────────── */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === "text"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📝 Text
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === "file"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📁 File
          </button>
        </div>

        {/* ── Content area ──────────────────────────────── */}
        {mode === "text" ? (
          <textarea
            rows={8}
            maxLength={500000}
            placeholder="Paste your text here…"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-400 focus:outline-none resize-y font-mono text-sm"
          />
        ) : (
          <div className="border-2 border-dashed rounded-xl p-8 text-center bg-white/60">
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FiFile className="text-2xl text-brand-500" />
                <span className="font-medium truncate max-w-xs">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-400 hover:text-red-600"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <>
                <FiUploadCloud className="mx-auto text-4xl text-brand-400 mb-2" />
                <p className="text-gray-500 mb-2">
                  Drag & drop or click to browse
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={handleFileChange}
                  className="block mx-auto text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Max 50 MB</p>
              </>
            )}
          </div>
        )}

        {/* ── Options ───────────────────────────────────── */}
        <details className="group" open>
          <summary className="cursor-pointer font-semibold text-gray-700 select-none">
            ⚙️ Options
          </summary>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Expires in (minutes)
              </label>
              <input
                type="number"
                min={1}
                placeholder="Default: 10"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password (optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank for none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
              />
            </div>

            {/* Max views */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Max views
              </label>
              <input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
              />
            </div>

            {/* One-time view */}
            <div className="flex items-center gap-2 pt-6">
              <input
                id="otv"
                type="checkbox"
                checked={oneTimeView}
                onChange={(e) => setOneTimeView(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="otv" className="text-sm text-gray-600">
                One-time view (burn after reading)
              </label>
            </div>
          </div>
        </details>

        {/* ── Submit ─────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl brand-accent font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading…" : "🔒 Create Secure Link"}
        </button>
      </form>
    </div>
  );
}

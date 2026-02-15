import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiCopy,
  FiTrash2,
  FiFile,
  FiFileText,
  FiClock,
  FiEye,
} from "react-icons/fi";
import { getMyUploads, deleteUpload } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUploads = async () => {
    try {
      const data = await getMyUploads();
      setUploads(data);
    } catch {
      toast.error("Failed to load uploads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDelete = async (slug) => {
    if (!window.confirm("Delete this upload permanently?")) return;
    try {
      await deleteUpload(slug);
      toast.success("Deleted.");
      setUploads((prev) => prev.filter((u) => u.slug !== slug));
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed.");
    }
  };

  const copyLink = async (slug) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/v/${slug}`);
      toast.success("Link copied!");
    } catch {
      toast.error("Copy failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin h-10 w-10 border-4 border-brand-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Uploads</h1>
          <p className="text-sm text-gray-400">
            Welcome, {user?.name}. You have {uploads.length} upload(s).
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition text-sm font-medium"
        >
          + New Upload
        </Link>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No uploads yet.</p>
          <Link to="/" className="text-brand-600 hover:underline font-medium">
            Create your first upload →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((u) => (
            <div
              key={u.slug}
              className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 ${
                u.isExpired ? "opacity-50" : ""
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 text-2xl text-brand-400">
                {u.type === "text" ? <FiFileText /> : <FiFile />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {u.type === "file" ? u.fileName : `Text snippet`}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <FiClock />
                    {u.isExpired
                      ? "Expired"
                      : `Expires ${formatDistanceToNow(new Date(u.expiresAt), {
                          addSuffix: true,
                        })}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiEye /> {u.viewCount}
                    {u.maxViews ? `/${u.maxViews}` : ""} views
                  </span>
                  {u.oneTimeView && (
                    <span className="text-orange-500">🔥 One-time</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!u.isExpired && (
                  <button
                    onClick={() => copyLink(u.slug)}
                    className="p-2 rounded-lg hover:bg-white/30 text-brand-600 transition"
                    title="Copy link"
                  >
                    <FiCopy />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(u.slug)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

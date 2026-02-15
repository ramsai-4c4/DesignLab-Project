import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiCopy, FiCheck, FiExternalLink, FiPlus } from "react-icons/fi";

export default function ResultPage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/v/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-brand-700">Upload Successful!</h1>
        <p className="text-gray-500">
          Share the link below. Only people with this exact link can access the
          content.
        </p>

        {/* Link display */}
        <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-4 py-3">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-sm font-mono text-brand-700 outline-none select-all"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={copy}
            className="shrink-0 p-2 rounded-lg hover:bg-brand-100 transition"
            title="Copy to clipboard"
          >
            {copied ? (
              <FiCheck className="text-green-500 text-lg" />
            ) : (
              <FiCopy className="text-brand-500 text-lg" />
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-brand-500 text-brand-600 hover:bg-brand-50 transition font-medium text-sm"
          >
            <FiExternalLink /> Open Link
          </a>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition font-medium text-sm"
          >
            <FiPlus /> New Upload
          </Link>
        </div>
      </div>
    </div>
  );
}

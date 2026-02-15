import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold text-brand-300 mb-4">404</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition font-medium"
      >
        Back to Home
      </Link>
    </div>
  );
}

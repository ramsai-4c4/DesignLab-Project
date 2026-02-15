import { Link } from "react-router-dom";
import { FiLock, FiLogOut, FiGrid } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-brand-600 to-brand-400 text-white shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <FiLock className="text-2xl" />
          LinkVault
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm bg-white/10 hover:bg-white/20 transition rounded-lg px-4 py-1.5 font-medium"
          >
            + New Upload
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm bg-white/20 hover:bg-white/30 transition rounded-lg px-3 py-1.5 font-medium flex items-center gap-1"
              >
                <FiGrid /> Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm bg-white/10 hover:bg-white/20 transition rounded-lg px-3 py-1.5 font-medium flex items-center gap-1"
              >
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm bg-white/20 hover:bg-white/30 transition rounded-lg px-4 py-1.5 font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

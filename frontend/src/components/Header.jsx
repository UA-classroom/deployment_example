import { Link } from "react-router-dom";
import authStore from "../store/authStore";

export default function Header() {
  const token = authStore((state) => state.token);
  const isLoggedIn = !!token;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="px-6 mx-auto max-w-7xl lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 shadow-md shadow-primary-600/25 transition-transform duration-200 group-hover:scale-105">
              <span className="text-sm font-bold text-white tracking-tight">UA</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              Utvecklarakademin
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors duration-150 hover:text-gray-900 hover:bg-gray-50"
            >
              Hem
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors duration-150 hover:text-gray-900 hover:bg-gray-50"
            >
              Om oss
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors duration-150 hover:text-gray-900 hover:bg-gray-50"
            >
              Kontakt
            </Link>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-sm shadow-primary-600/25 transition-all duration-200 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/30 active:scale-[0.98]"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-sm shadow-primary-600/25 transition-all duration-200 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/30 active:scale-[0.98]"
              >
                Logga in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

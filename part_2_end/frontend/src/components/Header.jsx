import { Link } from "react-router-dom";
import authStore from "../store/authStore";

export default function Header() {
  const token = authStore((state) => state.token);
  const isLoggedIn = !!token;

  return (
    <header className="relative bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                className="w-auto h-8"
                src="/short_logo_transparent.webp"
                alt="Logo"
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                Utvecklarakademin
              </h1>
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-gray-900 transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="px-3 py-2 text-sm font-medium text-gray-900 transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="px-3 py-2 text-sm font-medium text-gray-900 transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700"
            >
              Contact
            </Link>
            {isLoggedIn == true ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white transition-colors duration-150 bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Admin Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors duration-150 bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Login{" "}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors duration-150 bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Register{" "}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

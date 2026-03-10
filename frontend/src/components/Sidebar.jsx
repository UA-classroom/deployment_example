import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authStore from "../store/authStore";

const navItems = [
  { label: "Dashboard", path: "/dashboard", roles: ["admin", "utbildningsledare", "student"] },
  { label: "Users", path: "/dashboard/users", roles: ["admin"] },
  { label: "Programs", path: "/dashboard/programs", roles: ["admin", "utbildningsledare", "student"] },
  { label: "My Grades", path: "/dashboard/my-grades", roles: ["student"] },
  { label: "Settings", path: "/dashboard/settings", roles: ["admin", "utbildningsledare", "student"] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = authStore((state) => state.logout);
  const token = authStore((state) => state.token);
  const fetchUser = authStore((state) => state.fetchUser);
  const userData = authStore((state) => state.userData);
  const isLoggedIn = !!token;

  function logoutUser() {
    logout();
    navigate("/");
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, []);

  const visibleNav = navItems.filter(
    (item) => userData?.role && item.roles.includes(userData.role)
  );

  function isActive(path) {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  }

  return (
    <div className="flex flex-col w-64 h-screen shrink-0">
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="flex items-center gap-3 px-6 py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 shadow-md shadow-primary-600/25 transition-transform duration-200 group-hover:scale-105">
              <span className="text-sm font-bold text-white tracking-tight">UA</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              Utvecklarakademin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul role="list" className="flex flex-col gap-1">
            {visibleNav.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={
                      active
                        ? "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl bg-primary-50 text-primary-700 border-l-3 border-primary-500 transition-colors duration-150"
                        : "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {isLoggedIn && (
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700">
                <span className="text-xs font-semibold">
                  {userData?.first_name?.charAt(0) || "?"}
                </span>
              </div>
              {userData && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData.first_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userData.role}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => logoutUser()}
              className="w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              Logga ut
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

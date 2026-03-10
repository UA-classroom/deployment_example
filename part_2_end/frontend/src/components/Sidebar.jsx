import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authStore from "../store/authStore";

export default function Sidebar() {
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col w-64 h-screen overflow-auto">
      <div className="flex flex-col px-6 overflow-y-auto bg-white border-r border-gray-200 shadow-lg grow gap-y-5">
        <div className="flex items-center my-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            App
          </Link>
        </div>
        <nav className="flex flex-col flex-1">
          <ul role="list" className="flex flex-col flex-1 gap-y-7">
            <li>
              <Link to="/dashboard" className="underline">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" className="underline">
                Settings
              </Link>
            </li>
            { userData.is_superuser &&
              <li>
                <Link to="/dashboard/users" className="underline">
                  Users
                </Link>
              </li>
            }
            <li className="mt-auto -mx-6">
              <div className="px-6 py-3">
                {isLoggedIn && (
                  <div className="justify-between">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-2 bg-green-500 rounded-full"></span>{" "}
                      {userData && (
                        <div>
                          <p>{userData.first_name}</p>
                          <p>{userData.email}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => logoutUser()}
                      className="px-4 py-2 my-2 text-sm text-white bg-black rounded hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

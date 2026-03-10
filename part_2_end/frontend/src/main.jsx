import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import AboutPage from "./pages/About.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import DashboardIndexPage from "./pages/DashboardIndexPage.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import DashboardUserPage from "./pages/DashboardUserPage.jsx";
import DashboardUsersPage from "./pages/DashboardUsersPage.jsx";
import IndexPage from "./pages/IndexPage.jsx";
import Layout from "./pages/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserSettingsPage from "./pages/UserSettingsPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <IndexPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        path: "",
        element: <DashboardIndexPage />,
      },
      {
        path: "/dashboard/users",
        element: <DashboardUsersPage />,
      },
      {
        path: "/dashboard/users/:userId",
        element: <DashboardUserPage />,
      },
      {
        path: "/dashboard/settings",
        element: <UserSettingsPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);

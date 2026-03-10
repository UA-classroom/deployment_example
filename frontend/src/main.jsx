import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import RoleGuard from "./components/RoleGuard.jsx";
import AboutPage from "./pages/About.jsx";
import CohortDetailPage from "./pages/CohortDetailPage.jsx";
import CohortFormPage from "./pages/CohortFormPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import CourseFormPage from "./pages/CourseFormPage.jsx";
import DashboardIndexPage from "./pages/DashboardIndexPage.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import DashboardUserPage from "./pages/DashboardUserPage.jsx";
import DashboardUsersPage from "./pages/DashboardUsersPage.jsx";
import GradesPage from "./pages/GradesPage.jsx";
import IndexPage from "./pages/IndexPage.jsx";
import Layout from "./pages/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProgramDetailPage from "./pages/ProgramDetailPage.jsx";
import ProgramFormPage from "./pages/ProgramFormPage.jsx";
import ProgramsPage from "./pages/ProgramsPage.jsx";
import StudentGradesPage from "./pages/StudentGradesPage.jsx";
import UserFormPage from "./pages/UserFormPage.jsx";
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
        path: "/dashboard/users/new",
        element: <RoleGuard allowedRoles={["admin"]}><UserFormPage /></RoleGuard>,
      },
      {
        path: "/dashboard/users/:userId",
        element: <DashboardUserPage />,
      },
      {
        path: "/dashboard/settings",
        element: <UserSettingsPage />,
      },
      {
        path: "/dashboard/programs",
        element: <ProgramsPage />,
      },
      {
        path: "/dashboard/programs/new",
        element: <ProgramFormPage />,
      },
      {
        path: "/dashboard/programs/:programId",
        element: <ProgramDetailPage />,
      },
      {
        path: "/dashboard/programs/:programId/edit",
        element: <ProgramFormPage />,
      },
      {
        path: "/dashboard/programs/:programId/courses/new",
        element: <CourseFormPage />,
      },
      {
        path: "/dashboard/programs/:programId/cohorts/new",
        element: <RoleGuard allowedRoles={["admin"]}><CohortFormPage /></RoleGuard>,
      },
      {
        path: "/dashboard/courses/:courseId/edit",
        element: <CourseFormPage />,
      },
      {
        path: "/dashboard/cohorts/:cohortId",
        element: <CohortDetailPage />,
      },
      {
        path: "/dashboard/cohorts/:cohortId/edit",
        element: <RoleGuard allowedRoles={["admin"]}><CohortFormPage /></RoleGuard>,
      },
      {
        path: "/dashboard/cohorts/:cohortId/grades",
        element: <RoleGuard allowedRoles={["admin", "utbildningsledare"]}><GradesPage /></RoleGuard>,
      },
      {
        path: "/dashboard/my-grades",
        element: <RoleGuard allowedRoles={["student"]}><StudentGradesPage /></RoleGuard>,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);

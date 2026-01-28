import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AssignTask from "./components/AssignTask.jsx";
import TaskStatus from "./components/TaskStatus.jsx";
import AdminNavbar from "./components/AdminNavbar.jsx";
import AllTasks from "./pages/AllTasks.jsx";
import Defaulter from "./pages/Defaulter.jsx";
import ManageEmployee from "./components/ManageEmployee.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import RosterForm from "./utils/RosterForm.jsx";
import AdminTask from "./pages/AdminTask.jsx";
import AdminAssignedTasks from "./components/AdminAssignedTasks.jsx";
import ChatUI from "./Chat/ChatUI.jsx";

import { ToastContainer } from "react-toastify";
import Sidebar from "./components/Sidebar.jsx";


const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && ["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
    return <Navigate to="/admin/admintask" replace />;
  }

  return children;
};


function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        
        <Route
          path="/signup"
          element={
            <ProtectedRoute adminOnly={true}>
              <Signup />
              {/* <Sidebar /> */}
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
            </ProtectedRoute>
          }
        >
          <Route path="assign-task" element={<AssignTask />} />
          <Route path="tasks" element={<TaskStatus />} />
          <Route path="defaulter" element={<Defaulter />} />
          <Route path="manage-employee" element={<ManageEmployee />} />
          <Route path="adminDashboard" element={<AdminDashboard />} />
          <Route path="roster" element={<RosterForm />} />
          <Route path="admintask" element={<AdminTask />} />
          <Route path="admin/assigned-tasks" element={<AdminAssignedTasks />} />
          <Route path="chat" element={<ChatUI />} />
          <Route index element={<Navigate to="tasks" replace />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/AllTasks"
          element={
            <ProtectedRoute>
              <AllTasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={user?.accountType === "employee"
                ? "/dashboard"
                : "/admin/tasks"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import AssignTask from "./components/AssignTask.jsx";
import TaskStatus from "./components/TaskStatus.jsx";
import AdminNavbar from "./components/AdminNavbar.jsx";

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.accountType !== "admin") return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.accountType === "admin") return <Navigate to="/admin/assign-task" replace />;

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
              <Routes>
                <Route path="assign-task" element={<AssignTask />} />
                <Route path="tasks" element={<TaskStatus />} />
                <Route path="*" element={<Navigate to="assign-task" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Employee */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

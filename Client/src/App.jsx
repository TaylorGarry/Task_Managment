import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import AssignTask from "./components/AssignTask.jsx";
import TaskStatus from "./components/TaskStatus.jsx";
import AdminNavbar from "./components/AdminNavbar.jsx";
import AllTasks from "./pages/AllTasks.jsx";
import Defaulter from "./pages/Defaulter.jsx";

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.accountType !== "admin") return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.accountType === "admin") return <Navigate to="/admin/assign-task" replace />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <ProtectedRoute adminOnly={true}>
            <Signup />
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
        <Route index element={<Navigate to="assign-task" replace />} />
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}


export default App;

// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import EmployeeDashboard from "./pages/EmployeeDashboard";
// import AssignTask from "./components/AssignTask.jsx";
// import TaskStatus from "./components/TaskStatus.jsx";
// import AdminNavbar from "./components/AdminNavbar.jsx";
// import AllTasks from "./pages/AllTasks.jsx";
// import Defaulter from "./pages/Defaulter.jsx";
// import ManageEmployee from "./components/ManageEmployee.jsx";
// import AdminDashboard from "./components/AdminDashboard.jsx";
// import RosterForm from "./utils/RosterForm.jsx";
// import AdminTask from "./pages/AdminTask.jsx";
// import AdminAssignedTasks from "./components/AdminAssignedTasks.jsx";
// import ChatUI from "./Chat/ChatUI.jsx";

// import { ToastContainer } from "react-toastify";
// import OpsRoster from "./Roster/OpsRoster.jsx";


// const ProtectedRoute = ({ children, adminOnly }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   if (adminOnly && !["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   if (!adminOnly && ["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
//     return <Navigate to="/admin/admintask" replace />;
//   }

//   return children;
// };

// const OpsMetaRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   // STRICT CHECK: Only "employee" accountType from "Ops - Meta" department
//   const isEligible = user.accountType === "employee" && user.department === "Ops - Meta";

//   if (!isEligible) {
//     // Everyone else goes to their respective dashboards
//     if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     // Even other employees from different departments go to regular dashboard
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// function App() {
//   const { user } = useSelector((state) => state.auth);

//   return (
//     <>

//       <ToastContainer position="top-right" autoClose={3000} />

//       <Routes>

//         <Route
//           path="/signup"
//           element={
//             <ProtectedRoute adminOnly={true}>
//               <Signup />
//             </ProtectedRoute>
//           }
//         />

//         <Route path="/login" element={<Login />} />

//         {/* ADD THIS AS A TOP-LEVEL ROUTE (OUTSIDE /admin) */}
//         <Route
//           path="/ops-meta-roster"
//           element={
//             <OpsMetaRoute>
//               <OpsRoster />
//             </OpsMetaRoute>
//           }
//         />

//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute adminOnly={true}>
//               <AdminNavbar />
//             </ProtectedRoute>
//           }
//         >
//           <Route path="assign-task" element={<AssignTask />} />
//           <Route path="tasks" element={<TaskStatus />} />
//           <Route path="defaulter" element={<Defaulter />} />
//           <Route path="manage-employee" element={<ManageEmployee />} />
//           <Route path="adminDashboard" element={<AdminDashboard />} />
//           <Route path="roster" element={<RosterForm />} />
//           <Route path="admintask" element={<AdminTask />} />
//           <Route path="admin/assigned-tasks" element={<AdminAssignedTasks />} />
//           <Route path="chat" element={<ChatUI />} />
//           <Route index element={<Navigate to="tasks" replace />} />
//         </Route>

//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <EmployeeDashboard />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/AllTasks"
//           element={
//             <ProtectedRoute>
//               <AllTasks />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="*"
//           element={
//             <Navigate
//               to={user?.accountType === "employee"
//                 ? "/dashboard"
//                 : "/admin/tasks"}
//               replace
//             />
//           }
//         />
//       </Routes>
//     </>
//   );
// }

// export default App;





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
import OpsRoster from "./Roster/OpsRoster.jsx";
import ExcelRosterUpload from "./Roster/ExcelRosterUpload.jsx";  
import MyDefaults from "./pages/MyDefaults.jsx";

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

const OpsMetaRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  // STRICT CHECK: Only "employee" accountType from "Ops - Meta" department
  const isEligible = user.accountType === "employee" && user.department === "Ops - Meta";

  if (!isEligible) {
    // Everyone else goes to their respective dashboards
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    // Even other employees from different departments go to regular dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ADD THIS: Route for Employee Defaulters (only for employees)
const EmployeeOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  // Only employees can access this route
  if (user.accountType !== "employee") {
    // Admins/HR/superAdmin go to admin panel
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
// ADD THIS: Route for Ops-Meta Excel Upload (with Ops-Meta employees)
const OpsMetaUploadRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  // Check if user can upload (Ops-Meta employees, admin, HR, superAdmin)
  const canUploadExcel = 
    (user.accountType === "employee" && user.department === "Ops - Meta") ||
    ["admin", "superAdmin", "HR"].includes(user.accountType);

  if (!canUploadExcel) {
    // Redirect based on user type
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
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
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        {/* ADD THIS ROUTE for Excel Upload */}
        <Route
          path="/upload-roster"
          element={
            <OpsMetaUploadRoute>
              <ExcelRosterUpload />
            </OpsMetaUploadRoute>
          }
        />
        <Route
          path="/my-defaults"
          element={
            <EmployeeOnlyRoute>
              <MyDefaults />
            </EmployeeOnlyRoute>
          }
        />
        {/* Ops-Meta Current Week Roster */}
        <Route
          path="/ops-meta-roster"
          element={
            <OpsMetaRoute>
              <OpsRoster />
            </OpsMetaRoute>
          }
        />

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
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



//this is my updated before 405 line no.

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
// import ExcelRosterUpload from "./Roster/ExcelRosterUpload.jsx";  
// import MyDefaults from "./pages/MyDefaults.jsx";
// import ArrivalAttendanceUpdate from "./Roster/ArrivalAttendanceUpdate.jsx";
// import AttendanceUpdateWrapper from "./Roster/AttendanceUpdateWrapper.jsx";
// import SuperAdminTransportView from "./Roster/SuperAdminTransportView.jsx";

// const ALLOWED_ROSTER_DEPARTMENTS = ["Ops - Meta", "Marketing", "CS"];


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

//   // Allow employee users from Ops - Meta, Marketing, and CS
//   const isEligible =
//     user.accountType === "employee" &&
//     ALLOWED_ROSTER_DEPARTMENTS.includes(user.department);

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

// // ADD THIS: Route for Employee Defaulters (only for employees)
// const EmployeeOnlyRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   // Only employees can access this route
//   if (user.accountType !== "employee") {
//     // Admins/HR/superAdmin go to admin panel
//     if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };
// // Route for roster Excel Upload (allowed departments + admin roles)
// const OpsMetaUploadRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   // Check if user can upload (allowed department employees, admin, HR, superAdmin)
//   const canUploadExcel = 
//     (user.accountType === "employee" && ALLOWED_ROSTER_DEPARTMENTS.includes(user.department)) ||
//     ["admin", "superAdmin", "HR"].includes(user.accountType);

//   if (!canUploadExcel) {
//     // Redirect based on user type
//     if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// const AttendanceUpdateRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   const allowedDepartments = ["Ops - Meta", "Transport"];

//   const isAllowedEmployee =
//     user.accountType === "employee" &&
//     allowedDepartments.includes(user.department);

//   const isAdmin =
//     ["admin", "superAdmin", "HR"].includes(user.accountType);

//   if (!isAllowedEmployee && !isAdmin) {
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
//        <Route
//   path="/attendance-update"
//   element={
//     <AttendanceUpdateRoute>
//       <AttendanceUpdateWrapper />
//     </AttendanceUpdateRoute>
//   }
// />
// <Route
//   path="/attendance-update/:rosterId"
//   element={
//     <AttendanceUpdateRoute>
//       <AttendanceUpdateWrapper />  
//     </AttendanceUpdateRoute>
//   }
// />
// <Route
//   path="/superadmin/transport"
//   element={
//     <ProtectedRoute adminOnly={true}>
//       <SuperAdminTransportView />
//     </ProtectedRoute>
//   }
// />

//         <Route path="/login" element={<Login />} />

//         {/* ADD THIS ROUTE for Excel Upload */}
//         <Route
//           path="/upload-roster"
//           element={
//             <OpsMetaUploadRoute>
//               <ExcelRosterUpload />
//             </OpsMetaUploadRoute>
//           }
//         />
//         <Route
//           path="/my-defaults"
//           element={
//             <EmployeeOnlyRoute>
//               <MyDefaults />
//             </EmployeeOnlyRoute>
//           }
//         />
//         {/* Ops-Meta Current Week Roster */}
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
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import ArrivalAttendanceUpdate from "./Roster/ArrivalAttendanceUpdate.jsx";
import AttendanceUpdateWrapper from "./Roster/AttendanceUpdateWrapper.jsx";
import SuperAdminTransportView from "./Roster/SuperAdminTransportView.jsx";
import AttendanceSnapshot from "./Roster/AttendanceSnapshot.jsx";
import DelegationPage from "./pages/DelegationPage.jsx";
import DelegatedActionsPage from "./pages/DelegatedActionsPage.jsx";
import LeaveManagement from "./pages/LeaveManagement.jsx";
import { Toaster } from "react-hot-toast";

const ALLOWED_ROSTER_DEPARTMENTS = ["Ops - Meta", "Marketing", "CS", "Developer", "Ticketing", "Seo"];

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

  const isEligible =
    user.accountType === "employee" &&
    ALLOWED_ROSTER_DEPARTMENTS.includes(user.department);

  if (!isEligible) {
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const EmployeeOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  if (user.accountType !== "employee") {
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const OpsMetaUploadRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const canUploadExcel = 
    (user.accountType === "employee" && ALLOWED_ROSTER_DEPARTMENTS.includes(user.department)) ||
    ["admin", "superAdmin", "HR"].includes(user.accountType);

  if (!canUploadExcel) {
    if (["admin", "superAdmin", "HR", "Operations", "AM"].includes(user.accountType)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AttendanceUpdateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const isAllowedEmployee = user.accountType === "employee";
  const isAdmin = ["admin", "superAdmin", "HR"].includes(user.accountType);

  if (!isAllowedEmployee && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AttendanceSnapshotRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const DelegationAccessRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  const isHrOrSuperAdmin = ["HR", "superAdmin"].includes(user.accountType);
  const isOpsMetaEmployee =
    user.accountType === "employee" &&
    String(user.department || "").toLowerCase() === "ops - meta";
  if (!isHrOrSuperAdmin && !isOpsMetaEmployee) {
    return <Navigate to={user.accountType === "employee" ? "/dashboard" : "/admin/admintask"} replace />;
  }
  return children;
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const isAdminLeavePath = location.pathname === "/admin/leave-management";

  if (isAdminLeavePath) {
    return (
      <div className="theme-crm">
        <Toaster position="top-right" reverseOrder={false} />
        <ToastContainer position="top-right" autoClose={3000} />
        <ProtectedRoute adminOnly={true}>
          <>
            <AdminNavbar showOutlet={false} />
            <LeaveManagement embeddedAdmin={true} />
          </>
        </ProtectedRoute>
      </div>
    );
  }

  return (
    <div className="theme-crm">
      <Toaster position="top-right" reverseOrder={false} />
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
        <Route
          path="/attendance-update"
          element={
            <AttendanceUpdateRoute>
              <AttendanceUpdateWrapper />
            </AttendanceUpdateRoute>
          }
        />
        <Route
          path="/attendance-update/:rosterId"
          element={
            <AttendanceUpdateRoute>
              <AttendanceUpdateWrapper />
            </AttendanceUpdateRoute>
          }
        />
        <Route
          path="/delegated-attendance"
          element={
            <EmployeeOnlyRoute>
              <AttendanceUpdateWrapper delegatedMode={true} />
            </EmployeeOnlyRoute>
          }
        />
        <Route
          path="/delegated-attendance/:rosterId"
          element={
            <EmployeeOnlyRoute>
              <AttendanceUpdateWrapper delegatedMode={true} />
            </EmployeeOnlyRoute>
          }
        />
        <Route
          path="/superadmin/transport"
          element={
            <ProtectedRoute adminOnly={true}>
              <SuperAdminTransportView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance-snapshot"
          element={
            <AttendanceSnapshotRoute>
              <AttendanceSnapshot />
            </AttendanceSnapshotRoute>
          }
        />

        <Route path="/login" element={<Login />} />

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
        <Route
          path="/delegated-actions"
          element={
            <EmployeeOnlyRoute>
              <DelegatedActionsPage />
            </EmployeeOnlyRoute>
          }
        />
        <Route
          path="/delegations"
          element={
            <DelegationAccessRoute>
              <DelegationPage />
            </DelegationAccessRoute>
          }
        />
        <Route
          path="/ops-meta-roster"
          element={
            <OpsMetaRoute>
              <OpsRoster />
            </OpsMetaRoute>
          }
        />

        {/* ========== MAIN ADMIN ROUTE ========== */}
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
          
          {/* ✅ MOVED: Delegation route inside admin parent */}
          <Route 
            path="delegations" 
            element={
              <DelegationPage />
            } 
          />
          <Route path="delegation" element={<Navigate to="delegations" replace />} />
          
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
	          path="/leave-management"
	          element={
	            <ProtectedRoute>
	              <LeaveManagement />
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
    </div>
  );
}

export default App;

// import React, { useEffect } from "react";
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
// import AttendanceSnapshot from "./Roster/AttendanceSnapshot.jsx";
// import DelegationPage from "./pages/DelegationPage.jsx";
// import DelegatedActionsPage from "./pages/DelegatedActionsPage.jsx";
// import LeaveManagement from "./pages/LeaveManagement.jsx";
// import Navbar from "./pages/Navbar.jsx";
// import SuperAdminLoginStatus from "./pages/SuperAdminLoginStatus.jsx";
// import MyProfile from "./pages/MyProfile.jsx";
// import AttendanceOverrideUpload from "./pages/AttendanceOverrideUpload.jsx";
// import EmployeeOnboardingUpload from "./pages/EmployeeOnboardingUpload.jsx";
// import KraManagement from "./pages/KraManagement.jsx";
// import AnnouncementManagement from "./pages/AnnouncementManagement.jsx";
// import PendingLeaveNotification from "./components/PendingLeaveNotification.jsx";
// import { Toaster } from "react-hot-toast";
// import { disconnectSocket, updateSocketAuth } from "./socket.js";
// import { subscribeUserToPush } from "./utils/pushNotifications.js";
// import {
//   canManageAdminPanels,
//   getRoleType,
//   isAgent,
//   isHrDepartment,
//   isAccountsDepartment,
//   isSuperAdmin,
//   isTeamLeaderUser,
//   normalizeDepartment,
// } from "./utils/roleAccess.js";

// const ALLOWED_ROSTER_DEPARTMENTS = [
//   "Operations",
//   "Marketing",
//   "Customer Service",
//   "Developer",
//   "Ticketing",
//   "SEO",
//   "Accounts",
// ];

// const ProtectedRoute = ({ children, adminOnly }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;

//   if (adminOnly && !canManageAdminPanels(user)) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   if (!adminOnly && canManageAdminPanels(user)) {
//     return <Navigate to="/admin/admintask" replace />;
//   }

//   return children;
// };

// const AuthRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;
//   return children;
// };

// const OpsMetaRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   const normalizedDepartment = normalizeDepartment(user.department);
//   const isEligible =
//     (getRoleType(user) === "agent" || getRoleType(user) === "supervisor") &&
//     ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment);

//   if (!isEligible) {
//     if (canManageAdminPanels(user)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// const EmployeeOnlyRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   if (!isAgent(user) && getRoleType(user) !== "supervisor") {
//     if (canManageAdminPanels(user)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// const SupervisorOnlyRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;
//   if (getRoleType(user) !== "supervisor") {
//     return <Navigate to="/dashboard" replace />;
//   }
//   return children;
// };

// const OpsMetaUploadRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   const normalizedDepartment = normalizeDepartment(user.department);
//   const canUploadExcel = 
//     ((isAgent(user) || getRoleType(user) === "supervisor") &&
//       ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment)) ||
//     canManageAdminPanels(user);

//   if (!canUploadExcel) {
//     if (canManageAdminPanels(user)) {
//       return <Navigate to="/admin/admintask" replace />;
//     }
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// const AttendanceUpdateRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);

//   if (!user) return <Navigate to="/login" replace />;

//   const isAllowedEmployee = isAgent(user) || getRoleType(user) === "supervisor";
//   const isAdmin = canManageAdminPanels(user);

//   if (!isAllowedEmployee && !isAdmin) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// const AttendanceSnapshotRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;
//   return children;
// };

// const DelegationAccessRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;
//   const isHrOrSuperAdmin = isHrDepartment(user) || isSuperAdmin(user);
//   const isOpsMetaEmployee =
//     (isAgent(user) || getRoleType(user) === "supervisor") &&
//     normalizeDepartment(user.department) === "Operations";
//   const isTeamLeader = isTeamLeaderUser(user);
//   if (!isHrOrSuperAdmin && !isOpsMetaEmployee && !isTeamLeader) {
//     return <Navigate to={(isAgent(user) || getRoleType(user) === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
//   }
//   return children;
// };

// const AttendanceOverrideUploadRoute = ({ children }) => {
//   const { user } = useSelector((state) => state.auth);
//   if (!user) return <Navigate to="/login" replace />;
//   const roleType = getRoleType(user);
//   const isAllowed = roleType === "superAdmin" || isAccountsDepartment(user);
//   if (!isAllowed) {
//     return <Navigate to={(isAgent(user) || roleType === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
//   }
//   return children;
// };

// const AttendanceOverrideUploadShell = () => {
//   const { user } = useSelector((state) => state.auth);
//   if (canManageAdminPanels(user)) {
//     return (
//       <>
//         <AdminNavbar showOutlet={false} />
//         <AttendanceOverrideUpload />
//       </>
//     );
//   }
//   return (
//     <>
//       <Navbar />
//       <AttendanceOverrideUpload />
//     </>
//   );
// };

// const KraRouteShell = () => {
//   const { user } = useSelector((state) => state.auth);
//   if (canManageAdminPanels(user)) {
//     return (
//       <>
//         <AdminNavbar showOutlet={false} />
//         <KraManagement />
//       </>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <KraManagement />
//     </>
//   );
// };

// const AnnouncementRouteShell = () => {
//   const { user } = useSelector((state) => state.auth);
//   if (canManageAdminPanels(user)) {
//     return (
//       <>
//         <AdminNavbar showOutlet={false} />
//         <AnnouncementManagement />
//       </>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <AnnouncementManagement />
//     </>
//   );
// };

// const AdminHomeRedirect = () => {
//   const { user } = useSelector((state) => state.auth);
//   const shouldAvoidTasksLanding = isHrDepartment(user) || isSuperAdmin(user);
//   return <Navigate to={shouldAvoidTasksLanding ? "/admin/admintask" : "/admin/tasks"} replace />;
// };

// function App() {
//   const { user } = useSelector((state) => state.auth);
//   const location = useLocation();
//   const isAdminLeavePath = location.pathname === "/admin/leave-management";

//   useEffect(() => {
//     if (user?._id || user?.id) {
//       updateSocketAuth();
//       return;
//     }
//     disconnectSocket();
//   }, [user?._id, user?.id, user?.token]);

//   useEffect(() => {
//     if (!(user?._id || user?.id)) return;

//     const initPushNotifications = async () => {
//       await subscribeUserToPush();
//     };

//     initPushNotifications();
//   }, [user?._id, user?.id, user?.token]);

//   if (isAdminLeavePath) {
//     return (
//       <div className="theme-crm">
//         <Toaster position="top-right" reverseOrder={false} />
//         <ToastContainer position="top-right" autoClose={3000} />
//         <ProtectedRoute adminOnly={true}>
//           <>
//             <AdminNavbar showOutlet={false} />
//             <LeaveManagement embeddedAdmin={true} />
//           </>
//         </ProtectedRoute>
//       </div>
//     );
//   }

//   return (
//     <div className="theme-crm">
//       <Toaster position="top-right" reverseOrder={false} />
//       <ToastContainer position="top-right" autoClose={3000} />
//       <PendingLeaveNotification />

//       <Routes>
//         <Route
//           path="/signup"
//           element={
//             <ProtectedRoute adminOnly={true}>
//               <Signup />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/attendance-update"
//           element={
//             <AttendanceUpdateRoute>
//               <AttendanceUpdateWrapper />
//             </AttendanceUpdateRoute>
//           }
//         />
//         <Route
//           path="/attendance-update/:rosterId"
//           element={
//             <AttendanceUpdateRoute>
//               <AttendanceUpdateWrapper />
//             </AttendanceUpdateRoute>
//           }
//         />
//         <Route
//           path="/delegated-attendance"
//           element={
//             <EmployeeOnlyRoute>
//               <AttendanceUpdateWrapper delegatedMode={true} />
//             </EmployeeOnlyRoute>
//           }
//         />
//         <Route
//           path="/delegated-attendance/:rosterId"
//           element={
//             <EmployeeOnlyRoute>
//               <AttendanceUpdateWrapper delegatedMode={true} />
//             </EmployeeOnlyRoute>
//           }
//         />
//         <Route
//           path="/superadmin/transport"
//           element={
//             <ProtectedRoute adminOnly={true}>
//               <SuperAdminTransportView />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/attendance-snapshot"
//           element={
//             <AttendanceSnapshotRoute>
//               <AttendanceSnapshot />
//             </AttendanceSnapshotRoute>
//           }
//         />

//         <Route path="/login" element={<Login />} />
//         <Route path="/employee-onboarding" element={<EmployeeOnboardingUpload />} />

//         <Route
//           path="/upload-roster"
//           element={
//             <OpsMetaUploadRoute>
//               <ExcelRosterUpload />
//             </OpsMetaUploadRoute>
//           }
//         />
//         <Route
//           path="/attendance-override-upload"
//           element={
//             <AttendanceOverrideUploadRoute>
//               <AttendanceOverrideUploadShell />
//             </AttendanceOverrideUploadRoute>
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
//         <Route
//           path="/employee-login-status"
//           element={
//             <SupervisorOnlyRoute>
//               <>
//                 <Navbar />
//                 <SuperAdminLoginStatus />
//               </>
//             </SupervisorOnlyRoute>
//           }
//         />
//         <Route
//           path="/delegated-actions"
//           element={
//             <EmployeeOnlyRoute>
//               <DelegatedActionsPage />
//             </EmployeeOnlyRoute>
//           }
//         />
//         <Route
//           path="/delegations"
//           element={
//             <DelegationAccessRoute>
//               <DelegationPage />
//             </DelegationAccessRoute>
//           }
//         />
//         <Route
//           path="/ops-meta-roster"
//           element={
//             <OpsMetaRoute>
//               <OpsRoster />
//             </OpsMetaRoute>
//           }
//         />

//         {/* ========== MAIN ADMIN ROUTE ========== */}
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
// 	          <Route path="adminDashboard" element={<AdminDashboard />} />
//           <Route path="employee-login-status" element={<SuperAdminLoginStatus />} />
// 	          <Route path="roster" element={<RosterForm />} />
// 	          <Route path="admintask" element={<AdminTask />} />
// 	          <Route path="admin/assigned-tasks" element={<AdminAssignedTasks />} />
// 	          <Route path="chat" element={<ChatUI />} />
//             <Route
//               path="attendance-override-upload"
//               element={
//                 <AttendanceOverrideUploadRoute>
//                   <AttendanceOverrideUpload />
//                 </AttendanceOverrideUploadRoute>
//               }
//             />
          
//           {/* ✅ MOVED: Delegation route inside admin parent */}
//           <Route 
//             path="delegations" 
//             element={
//               <DelegationPage />
//             } 
//           />
//           <Route path="delegation" element={<Navigate to="delegations" replace />} />
          
//           <Route index element={<AdminHomeRedirect />} />
// 	        </Route>
//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <EmployeeDashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/chat"
//           element={
//             <EmployeeOnlyRoute>
//               <>
//                 <Navbar />
//                 <ChatUI />
//               </>
//             </EmployeeOnlyRoute>
//           }
//         />
//         <Route
//           path="/my-profile"
//           element={
//             <EmployeeOnlyRoute>
//               <MyProfile />
//             </EmployeeOnlyRoute>
//           }
//         />
//         <Route
//           path="/kra"
//           element={
//             <AuthRoute>
//               <KraRouteShell />
//             </AuthRoute>
//           }
//         />
//         <Route
//           path="/announcements"
//           element={
//             <AuthRoute>
//               <AnnouncementRouteShell />
//             </AuthRoute>
//           }
//         />
//         <Route
//           path="/leave-management"
//           element={
//             <ProtectedRoute>
//               <LeaveManagement />
// 	            </ProtectedRoute>
// 	          }
// 	        />

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
//               to={(isAgent(user) || getRoleType(user) === "supervisor")
//                 ? "/dashboard"
//                 : (isHrDepartment(user) || isSuperAdmin(user))
//                   ? "/admin/admintask"
//                   : "/admin/tasks"}
//               replace
//             />
//           }
//         />
//       </Routes>
//     </div>
//   );
// }

// export default App;




// // import React, { useEffect } from "react";
// // import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// // import { useSelector } from "react-redux";
// // import Signup from "./pages/Signup";
// // import Login from "./pages/Login";
// // import EmployeeDashboard from "./pages/EmployeeDashboard";
// // import AssignTask from "./components/AssignTask.jsx";
// // import TaskStatus from "./components/TaskStatus.jsx";
// // import AdminNavbar from "./components/AdminNavbar.jsx";
// // import AllTasks from "./pages/AllTasks.jsx";
// // import Defaulter from "./pages/Defaulter.jsx";
// // import ManageEmployee from "./components/ManageEmployee.jsx";
// // import AdminDashboard from "./components/AdminDashboard.jsx";
// // import RosterForm from "./utils/RosterForm.jsx";
// // import AdminTask from "./pages/AdminTask.jsx";
// // import AdminAssignedTasks from "./components/AdminAssignedTasks.jsx";
// // import ChatUI from "./Chat/ChatUI.jsx";
// // import { ToastContainer } from "react-toastify";
// // import OpsRoster from "./Roster/OpsRoster.jsx";
// // import ExcelRosterUpload from "./Roster/ExcelRosterUpload.jsx";  
// // import MyDefaults from "./pages/MyDefaults.jsx";
// // import ArrivalAttendanceUpdate from "./Roster/ArrivalAttendanceUpdate.jsx";
// // import AttendanceUpdateWrapper from "./Roster/AttendanceUpdateWrapper.jsx";
// // import SuperAdminTransportView from "./Roster/SuperAdminTransportView.jsx";
// // import AttendanceSnapshot from "./Roster/AttendanceSnapshot.jsx";
// // import DelegationPage from "./pages/DelegationPage.jsx";
// // import DelegatedActionsPage from "./pages/DelegatedActionsPage.jsx";
// // import LeaveManagement from "./pages/LeaveManagement.jsx";
// // import Navbar from "./pages/Navbar.jsx";
// // import SuperAdminLoginStatus from "./pages/SuperAdminLoginStatus.jsx";
// // import MyProfile from "./pages/MyProfile.jsx";
// // import AttendanceOverrideUpload from "./pages/AttendanceOverrideUpload.jsx";
// // import EmployeeOnboardingUpload from "./pages/EmployeeOnboardingUpload.jsx";
// // import { Toaster } from "react-hot-toast";
// // import { disconnectSocket, updateSocketAuth } from "./socket.js";
// // import { subscribeUserToPush } from "./utils/pushNotifications.js";
// // import {
// //   canManageAdminPanels,
// //   getRoleType,
// //   isAgent,
// //   isHrDepartment,
// //   isAccountsDepartment,
// //   isSuperAdmin,
// //   isTeamLeaderUser,
// //   normalizeDepartment,
// // } from "./utils/roleAccess.js";

// // const ALLOWED_ROSTER_DEPARTMENTS = [
// //   "Operations",
// //   "Marketing",
// //   "Customer Service",
// //   "Developer",
// //   "Ticketing",
// //   "SEO",
// //   "Accounts",
// // ];

// // const ProtectedRoute = ({ children, adminOnly }) => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (!user) return <Navigate to="/login" replace />;

// //   if (adminOnly && !canManageAdminPanels(user)) {
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   if (!adminOnly && canManageAdminPanels(user)) {
// //     return <Navigate to="/admin/admintask" replace />;
// //   }

// //   return children;
// // };

// // const OpsMetaRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);

// //   if (!user) return <Navigate to="/login" replace />;

// //   const normalizedDepartment = normalizeDepartment(user.department);
// //   const isEligible =
// //     (getRoleType(user) === "agent" || getRoleType(user) === "supervisor") &&
// //     ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment);

// //   if (!isEligible) {
// //     if (canManageAdminPanels(user)) {
// //       return <Navigate to="/admin/admintask" replace />;
// //     }
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   return children;
// // };

// // const EmployeeOnlyRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);

// //   if (!user) return <Navigate to="/login" replace />;

// //   if (!isAgent(user) && getRoleType(user) !== "supervisor") {
// //     if (canManageAdminPanels(user)) {
// //       return <Navigate to="/admin/admintask" replace />;
// //     }
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   return children;
// // };

// // const SupervisorOnlyRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (!user) return <Navigate to="/login" replace />;
// //   if (getRoleType(user) !== "supervisor") {
// //     return <Navigate to="/dashboard" replace />;
// //   }
// //   return children;
// // };

// // const OpsMetaUploadRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);

// //   if (!user) return <Navigate to="/login" replace />;

// //   const normalizedDepartment = normalizeDepartment(user.department);
// //   const canUploadExcel = 
// //     ((isAgent(user) || getRoleType(user) === "supervisor") &&
// //       ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment)) ||
// //     canManageAdminPanels(user);

// //   if (!canUploadExcel) {
// //     if (canManageAdminPanels(user)) {
// //       return <Navigate to="/admin/admintask" replace />;
// //     }
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   return children;
// // };

// // const AttendanceUpdateRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);

// //   if (!user) return <Navigate to="/login" replace />;

// //   const isAllowedEmployee = isAgent(user) || getRoleType(user) === "supervisor";
// //   const isAdmin = canManageAdminPanels(user);

// //   if (!isAllowedEmployee && !isAdmin) {
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   return children;
// // };

// // const AttendanceSnapshotRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (!user) return <Navigate to="/login" replace />;
// //   return children;
// // };

// // const DelegationAccessRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (!user) return <Navigate to="/login" replace />;
// //   const isHrOrSuperAdmin = isHrDepartment(user) || isSuperAdmin(user);
// //   const isOpsMetaEmployee =
// //     (isAgent(user) || getRoleType(user) === "supervisor") &&
// //     normalizeDepartment(user.department) === "Operations";
// //   const isTeamLeader = isTeamLeaderUser(user);
// //   if (!isHrOrSuperAdmin && !isOpsMetaEmployee && !isTeamLeader) {
// //     return <Navigate to={(isAgent(user) || getRoleType(user) === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
// //   }
// //   return children;
// // };

// // const AttendanceOverrideUploadRoute = ({ children }) => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (!user) return <Navigate to="/login" replace />;
// //   const roleType = getRoleType(user);
// //   const isAllowed = roleType === "superAdmin" || isAccountsDepartment(user);
// //   if (!isAllowed) {
// //     return <Navigate to={(isAgent(user) || roleType === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
// //   }
// //   return children;
// // };

// // const AttendanceOverrideUploadShell = () => {
// //   const { user } = useSelector((state) => state.auth);
// //   if (canManageAdminPanels(user)) {
// //     return (
// //       <>
// //         <AdminNavbar showOutlet={false} />
// //         <AttendanceOverrideUpload />
// //       </>
// //     );
// //   }
// //   return (
// //     <>
// //       <Navbar />
// //       <AttendanceOverrideUpload />
// //     </>
// //   );
// // };

// // const AdminHomeRedirect = () => {
// //   const { user } = useSelector((state) => state.auth);
// //   const shouldAvoidTasksLanding = isHrDepartment(user) || isSuperAdmin(user);
// //   return <Navigate to={shouldAvoidTasksLanding ? "/admin/admintask" : "/admin/tasks"} replace />;
// // };

// // function App() {
// //   const { user } = useSelector((state) => state.auth);
// //   const location = useLocation();
// //   const isAdminLeavePath = location.pathname === "/admin/leave-management";

// //   useEffect(() => {
// //     if (user?._id || user?.id) {
// //       updateSocketAuth();
// //       return;
// //     }
// //     disconnectSocket();
// //   }, [user?._id, user?.id, user?.token]);

// //   useEffect(() => {
// //     if (!(user?._id || user?.id)) return;

// //     const initPushNotifications = async () => {
// //       await subscribeUserToPush();
// //     };

// //     initPushNotifications();
// //   }, [user?._id, user?.id, user?.token]);

// //   if (isAdminLeavePath) {
// //     return (
// //       <div className="theme-crm">
// //         <Toaster position="top-right" reverseOrder={false} />
// //         <ToastContainer position="top-right" autoClose={3000} />
// //         <ProtectedRoute adminOnly={true}>
// //           <>
// //             <AdminNavbar showOutlet={false} />
// //             <LeaveManagement embeddedAdmin={true} />
// //           </>
// //         </ProtectedRoute>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="theme-crm">
// //       <Toaster position="top-right" reverseOrder={false} />
// //       <ToastContainer position="top-right" autoClose={3000} />

// //       <Routes>
// //         <Route
// //           path="/signup"
// //           element={
// //             <ProtectedRoute adminOnly={true}>
// //               <Signup />
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route
// //           path="/attendance-update"
// //           element={
// //             <AttendanceUpdateRoute>
// //               <AttendanceUpdateWrapper />
// //             </AttendanceUpdateRoute>
// //           }
// //         />
// //         <Route
// //           path="/attendance-update/:rosterId"
// //           element={
// //             <AttendanceUpdateRoute>
// //               <AttendanceUpdateWrapper />
// //             </AttendanceUpdateRoute>
// //           }
// //         />
// //         <Route
// //           path="/delegated-attendance"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <AttendanceUpdateWrapper delegatedMode={true} />
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/delegated-attendance/:rosterId"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <AttendanceUpdateWrapper delegatedMode={true} />
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/superadmin/transport"
// //           element={
// //             <ProtectedRoute adminOnly={true}>
// //               <SuperAdminTransportView />
// //             </ProtectedRoute>
// //           }
// //         />

// //         <Route
// //           path="/attendance-snapshot"
// //           element={
// //             <AttendanceSnapshotRoute>
// //               <AttendanceSnapshot />
// //             </AttendanceSnapshotRoute>
// //           }
// //         />

// //         <Route path="/login" element={<Login />} />
// //         <Route path="/employee-onboarding" element={<EmployeeOnboardingUpload />} />

// //         <Route
// //           path="/upload-roster"
// //           element={
// //             <OpsMetaUploadRoute>
// //               <ExcelRosterUpload />
// //             </OpsMetaUploadRoute>
// //           }
// //         />
// //         <Route
// //           path="/attendance-override-upload"
// //           element={
// //             <AttendanceOverrideUploadRoute>
// //               <AttendanceOverrideUploadShell />
// //             </AttendanceOverrideUploadRoute>
// //           }
// //         />
// //         <Route
// //           path="/my-defaults"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <MyDefaults />
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/employee-login-status"
// //           element={
// //             <SupervisorOnlyRoute>
// //               <>
// //                 <Navbar />
// //                 <SuperAdminLoginStatus />
// //               </>
// //             </SupervisorOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/delegated-actions"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <DelegatedActionsPage />
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/delegations"
// //           element={
// //             <DelegationAccessRoute>
// //               <DelegationPage />
// //             </DelegationAccessRoute>
// //           }
// //         />
// //         <Route
// //           path="/ops-meta-roster"
// //           element={
// //             <OpsMetaRoute>
// //               <OpsRoster />
// //             </OpsMetaRoute>
// //           }
// //         />

// //         {/* ========== MAIN ADMIN ROUTE ========== */}
// //         <Route
// //           path="/admin"
// //           element={
// //             <ProtectedRoute adminOnly={true}>
// //               <AdminNavbar />
// //             </ProtectedRoute>
// //           }
// //         >
// //           <Route path="assign-task" element={<AssignTask />} />
// //           <Route path="tasks" element={<TaskStatus />} />
// //           <Route path="defaulter" element={<Defaulter />} />
// //           <Route path="manage-employee" element={<ManageEmployee />} />
// // 	          <Route path="adminDashboard" element={<AdminDashboard />} />
// //           <Route path="employee-login-status" element={<SuperAdminLoginStatus />} />
// // 	          <Route path="roster" element={<RosterForm />} />
// // 	          <Route path="admintask" element={<AdminTask />} />
// // 	          <Route path="admin/assigned-tasks" element={<AdminAssignedTasks />} />
// // 	          <Route path="chat" element={<ChatUI />} />
// //             <Route
// //               path="attendance-override-upload"
// //               element={
// //                 <AttendanceOverrideUploadRoute>
// //                   <AttendanceOverrideUpload />
// //                 </AttendanceOverrideUploadRoute>
// //               }
// //             />
          
// //           {/* ✅ MOVED: Delegation route inside admin parent */}
// //           <Route 
// //             path="delegations" 
// //             element={
// //               <DelegationPage />
// //             } 
// //           />
// //           <Route path="delegation" element={<Navigate to="delegations" replace />} />
          
// //           <Route index element={<AdminHomeRedirect />} />
// // 	        </Route>
// //         <Route
// //           path="/dashboard"
// //           element={
// //             <ProtectedRoute>
// //               <EmployeeDashboard />
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route
// //           path="/chat"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <>
// //                 <Navbar />
// //                 <ChatUI />
// //               </>
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/my-profile"
// //           element={
// //             <EmployeeOnlyRoute>
// //               <MyProfile />
// //             </EmployeeOnlyRoute>
// //           }
// //         />
// //         <Route
// //           path="/leave-management"
// //           element={
// //             <ProtectedRoute>
// //               <LeaveManagement />
// // 	            </ProtectedRoute>
// // 	          }
// // 	        />

// //         <Route
// //           path="/AllTasks"
// //           element={
// //             <ProtectedRoute>
// //               <AllTasks />
// //             </ProtectedRoute>
// //           }
// //         />

// //         <Route
// //           path="*"
// //           element={
// //             <Navigate
// //               to={(isAgent(user) || getRoleType(user) === "supervisor")
// //                 ? "/dashboard"
// //                 : (isHrDepartment(user) || isSuperAdmin(user))
// //                   ? "/admin/admintask"
// //                   : "/admin/tasks"}
// //               replace
// //             />
// //           }
// //         />
// //       </Routes>
// //     </div>
// //   );
// // }

// // export default App;







import React, { lazy, Suspense, useEffect } from "react";
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
import Navbar from "./pages/Navbar.jsx";
import SuperAdminLoginStatus from "./pages/SuperAdminLoginStatus.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import AttendanceOverrideUpload from "./pages/AttendanceOverrideUpload.jsx";
import AttendanceAuditLog from "./pages/AttendanceAuditLog.jsx";
import EmployeeOnboardingUpload from "./pages/EmployeeOnboardingUpload.jsx";
import KraManagement from "./pages/KraManagement.jsx";
import AnnouncementManagement from "./pages/AnnouncementManagement.jsx";
import PendingLeaveNotification from "./components/PendingLeaveNotification.jsx";
import { Toaster } from "react-hot-toast";
import { disconnectSocket, updateSocketAuth } from "./socket.js";
import { subscribeUserToPush } from "./utils/pushNotifications.js";
import {
  canManageAdminPanels,
  getRoleType,
  isAgent,
  isHrDepartment,
  isAccountsDepartment,
  isSuperAdmin,
  isTeamLeaderUser,
  normalizeDepartment,
} from "./utils/roleAccess.js";

const EmployeeExitList = lazy(() => import("./pages/EmployeeExitList.jsx"));
const EmployeeExitDetails = lazy(() => import("./pages/EmployeeExitDetails.jsx"));

const ALLOWED_ROSTER_DEPARTMENTS = [
  "Operations",
  "Marketing",
  "Customer Service",
  "Developer",
  "Ticketing",
  "SEO",
  "Accounts",
];

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !canManageAdminPanels(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && canManageAdminPanels(user)) {
    return <Navigate to="/admin/admintask" replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const OpsMetaRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const normalizedDepartment = normalizeDepartment(user.department);
  const isEligible =
    (getRoleType(user) === "agent" || getRoleType(user) === "supervisor") &&
    ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment);

  if (!isEligible) {
    if (canManageAdminPanels(user)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const EmployeeOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  if (!isAgent(user) && getRoleType(user) !== "supervisor") {
    if (canManageAdminPanels(user)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const SupervisorOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (getRoleType(user) !== "supervisor") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const OpsMetaUploadRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const normalizedDepartment = normalizeDepartment(user.department);
  const canUploadExcel = 
    ((isAgent(user) || getRoleType(user) === "supervisor") &&
      ALLOWED_ROSTER_DEPARTMENTS.includes(normalizedDepartment)) ||
    canManageAdminPanels(user);

  if (!canUploadExcel) {
    if (canManageAdminPanels(user)) {
      return <Navigate to="/admin/admintask" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AttendanceUpdateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const isAllowedEmployee = isAgent(user) || getRoleType(user) === "supervisor";
  const isAdmin = canManageAdminPanels(user);

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
  const isHrOrSuperAdmin = isHrDepartment(user) || isSuperAdmin(user);
  const isOpsMetaEmployee =
    (isAgent(user) || getRoleType(user) === "supervisor") &&
    normalizeDepartment(user.department) === "Operations";
  const isTeamLeader = isTeamLeaderUser(user);
  if (!isHrOrSuperAdmin && !isOpsMetaEmployee && !isTeamLeader) {
    return <Navigate to={(isAgent(user) || getRoleType(user) === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
  }
  return children;
};

const AttendanceOverrideUploadRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  const roleType = getRoleType(user);
  const isAllowed = roleType === "superAdmin" || isAccountsDepartment(user);
  if (!isAllowed) {
    return <Navigate to={(isAgent(user) || roleType === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
  }
  return children;
};

const AttendanceOverrideUploadShell = () => {
  const { user } = useSelector((state) => state.auth);
  if (canManageAdminPanels(user)) {
    return (
      <>
        <AdminNavbar showOutlet={false} />
        <AttendanceOverrideUpload />
      </>
    );
  }
  return (
    <>
      <Navbar />
      <AttendanceOverrideUpload />
    </>
  );
};

const EmployeeExitAccessRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;

	  const allowed =
	    isSuperAdmin(user) ||
	    isHrDepartment(user) ||
	    isAccountsDepartment(user) ||
	    normalizeDepartment(user?.department) === "IT";

  if (!allowed) {
    return <Navigate to={(isAgent(user) || getRoleType(user) === "supervisor") ? "/dashboard" : "/admin/admintask"} replace />;
  }

  return children;
};

const EmployeeExitRouteShell = ({ details = false }) => {
  const { user } = useSelector((state) => state.auth);
  const content = (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading employee exits...</div>}>
      {details ? <EmployeeExitDetails /> : <EmployeeExitList />}
    </Suspense>
  );

  if (canManageAdminPanels(user)) {
    return (
      <>
        <AdminNavbar showOutlet={false} />
        {content}
      </>
    );
  }

  return (
    <>
      <Navbar />
      {content}
    </>
  );
};

const KraRouteShell = () => {
  const { user } = useSelector((state) => state.auth);
  if (canManageAdminPanels(user)) {
    return (
      <>
        <AdminNavbar showOutlet={false} />
        <KraManagement />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <KraManagement />
    </>
  );
};

const AnnouncementRouteShell = () => {
  const { user } = useSelector((state) => state.auth);
  if (canManageAdminPanels(user)) {
    return (
      <>
        <AdminNavbar showOutlet={false} />
        <AnnouncementManagement />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <AnnouncementManagement />
    </>
  );
};

const AdminHomeRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const shouldAvoidTasksLanding = isHrDepartment(user) || isSuperAdmin(user);
  return <Navigate to={shouldAvoidTasksLanding ? "/admin/admintask" : "/admin/tasks"} replace />;
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const isAdminLeavePath = location.pathname === "/admin/leave-management";
  const isTransportDepartment = normalizeDepartment(user?.department) === "Transport";
  const isTransportAllowedPath =
    location.pathname.startsWith("/attendance-update") ||
    location.pathname.startsWith("/attendance-snapshot") ||
    location.pathname === "/login";

  useEffect(() => {
    if (user?._id || user?.id) {
      updateSocketAuth();
      return;
    }
    disconnectSocket();
  }, [user?._id, user?.id, user?.token]);

  useEffect(() => {
    if (!(user?._id || user?.id)) return;

    const initPushNotifications = async () => {
      await subscribeUserToPush();
    };

    initPushNotifications();
  }, [user?._id, user?.id, user?.token]);

  if (user && isTransportDepartment && !isTransportAllowedPath) {
    return <Navigate to="/attendance-update" replace />;
  }

  if (isAdminLeavePath) {
    return (
      <div className="theme-crm">
        <Toaster position="top-right" reverseOrder={false} />
        <ToastContainer position="top-right" autoClose={3000} />
        <PendingLeaveNotification />
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
      <PendingLeaveNotification />

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
        <Route path="/employee-onboarding" element={<EmployeeOnboardingUpload />} />

        <Route
          path="/upload-roster"
          element={
            <OpsMetaUploadRoute>
              <ExcelRosterUpload />
            </OpsMetaUploadRoute>
          }
        />
        <Route
          path="/attendance-override-upload"
          element={
            <AttendanceOverrideUploadRoute>
              <AttendanceOverrideUploadShell />
            </AttendanceOverrideUploadRoute>
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
          path="/employee-login-status"
          element={
            <SupervisorOnlyRoute>
              <>
                <Navbar />
                <SuperAdminLoginStatus />
              </>
            </SupervisorOnlyRoute>
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
          <Route path="employee-login-status" element={<SuperAdminLoginStatus />} />
	          <Route path="roster" element={<RosterForm />} />
	          <Route path="admintask" element={<AdminTask />} />
	          <Route path="admin/assigned-tasks" element={<AdminAssignedTasks />} />
	          <Route path="chat" element={<ChatUI />} />
	          <Route path="attendance-audit" element={<AttendanceAuditLog />} />
	            <Route
              path="attendance-override-upload"
              element={
                <AttendanceOverrideUploadRoute>
                  <AttendanceOverrideUpload />
                </AttendanceOverrideUploadRoute>
              }
            />
          
          {/* ✅ MOVED: Delegation route inside admin parent */}
          <Route 
            path="delegations" 
            element={
              <DelegationPage />
            } 
          />
          <Route path="delegation" element={<Navigate to="delegations" replace />} />
          
          <Route index element={<AdminHomeRedirect />} />
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
          path="/chat"
          element={
            <EmployeeOnlyRoute>
              <>
                <Navbar />
                <ChatUI />
              </>
            </EmployeeOnlyRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <EmployeeOnlyRoute>
              <MyProfile />
            </EmployeeOnlyRoute>
          }
        />
        <Route
          path="/kra"
          element={
            <AuthRoute>
              <KraRouteShell />
            </AuthRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <AuthRoute>
              <AnnouncementRouteShell />
            </AuthRoute>
          }
        />
        <Route
          path="/employee-exits"
          element={
            <EmployeeExitAccessRoute>
              <EmployeeExitRouteShell />
            </EmployeeExitAccessRoute>
          }
        />
        <Route
          path="/employee-exits/:id"
          element={
            <EmployeeExitAccessRoute>
              <EmployeeExitRouteShell details={true} />
            </EmployeeExitAccessRoute>
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
              to={(isAgent(user) || getRoleType(user) === "supervisor")
                ? "/dashboard"
                : (isHrDepartment(user) || isSuperAdmin(user))
                  ? "/admin/admintask"
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

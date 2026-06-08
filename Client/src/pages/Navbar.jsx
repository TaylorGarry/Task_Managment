// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Menu, X, AlertCircle, Clock, Camera } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import { logoutUser } from "../features/slices/authSlice.js";
// import { fetchMyDelegations, selectMyDelegations } from "../features/slices/delegationSlice.js";
// import { socket } from "../socket.js";
// import {
//   canManageAdminPanels,
//   getRoleType,
//   isAccountsDepartment,
//   isTeamLeaderUser,
//   normalizeDepartment,
// } from "../utils/roleAccess.js";
// import { getApiBaseUrl } from "../utils/apiUrl";

// const API_URL = getApiBaseUrl();

// const ROSTER_ALLOWED_DEPARTMENTS = [
//   "Operations",
//   "Marketing",
//   "Customer Service",
//   "Developer",
//   "Ticketing",
//   "SEO",
//   "Accounts"
// ];

// const Navbar = () => {
//   const { user, employeeDashboardSummary } = useSelector((state) => state.auth);
//   const myDelegations = useSelector(selectMyDelegations);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [showPhotoPreview, setShowPhotoPreview] = useState(false);
//   const processedMessageIdsRef = useRef(new Set());
//   const knownBreakUsersRef = useRef(new Set());
//   const breakWatcherInitializedRef = useRef(false);

//   const handleLogout = async () => {
//     toast.dismiss("auth-login-success");
//     await dispatch(logoutUser());
//     toast.success("Logged out successfully!");
//     navigate("/login");
//   };

//   const roleType = getRoleType(user);
//   const normalizedDepartment = normalizeDepartment(user?.department);
//   const isEmployee = roleType === "agent" || roleType === "supervisor";
//   const isSupervisor = roleType === "supervisor";
//   const isTransportDepartment = normalizedDepartment === "Transport";

//   const canAccessAttendanceUpdate =
//     isEmployee || canManageAdminPanels(user);

//   const canAccessAttendanceSnapshot = true;
//   const canShowAttendanceSidebarLinks = isSupervisor || isTransportDepartment;

//   const isAllowedRosterDepartmentEmployee =
//     isEmployee && ROSTER_ALLOWED_DEPARTMENTS.includes(normalizedDepartment);
//   const isTeamLeader = isTeamLeaderUser(user);
//   const canCreateDelegation =
//     (isEmployee && normalizedDepartment === "Operations") || isTeamLeader;

//   const canUploadExcel =
//     (isEmployee && ROSTER_ALLOWED_DEPARTMENTS.includes(normalizedDepartment)) ||
//     canManageAdminPanels(user);
//   const canUploadAttendanceOverride =
//     roleType === "superAdmin" || isAccountsDepartment(user);

//   useEffect(() => {
//     if (isEmployee) {
//       dispatch(fetchMyDelegations());
//     }
//   }, [dispatch, isEmployee]);

//   useEffect(() => {
//     if (!user || !("Notification" in window)) return;
//     if (Notification.permission === "default") {
//       Notification.requestPermission().catch(() => {});
//     }
//   }, [user?._id, user?.id]);

//   useEffect(() => {
//     if (!isSupervisor) return;
//     const token = user?.token;
//     if (!token) return;

//     const getTodayDateKey = () => {
//       const d = new Date();
//       const yyyy = d.getFullYear();
//       const mm = String(d.getMonth() + 1).padStart(2, "0");
//       const dd = String(d.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     };

//     const checkBreakStatus = async () => {
//       const now = Date.now();
//       if (window.__dailyStatusPollLock) return;
//       if (now - (window.__dailyStatusPollAt || 0) < 5000) return;
//       window.__dailyStatusPollAt = now;
//       window.__dailyStatusPollLock = true;
//       try {
//         const res = await fetch(`${API_URL}/punchx/superadmin/daily-status?dateKey=${getTodayDateKey()}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) return;
//         const data = await res.json();
//         const rows = Array.isArray(data?.rows) ? data.rows : [];
//         const currentlyOnBreak = rows
//           .filter((r) => r?.isOnBreak)
//           .map((r) => ({
//             id: String(r.userId || ""),
//             name: r.name || r.username || "Employee",
//             breakType: r.breakType || "manual",
//           }))
//           .filter((r) => r.id);
//         const currentSet = new Set(currentlyOnBreak.map((r) => r.id));

//         if (!breakWatcherInitializedRef.current) {
//           knownBreakUsersRef.current = currentSet;
//           breakWatcherInitializedRef.current = true;
//           return;
//         }

//         const newBreakEntries = currentlyOnBreak.filter((u) => !knownBreakUsersRef.current.has(u.id));
//         newBreakEntries.forEach((u) => {
//           const msg = `${u.name} is on ${u.breakType.replace("_", " ")} break`;
//           toast(msg, { duration: 5000 });
//           if ("Notification" in window && Notification.permission === "granted") {
//             new Notification("Break Alert", { body: msg, icon: "/favicon.ico", tag: `break-${u.id}` });
//           }
//         });
//         knownBreakUsersRef.current = currentSet;
//       } catch {
//       } finally {
//         window.__dailyStatusPollLock = false;
//       }
//     };

//     checkBreakStatus();
//     const id = setInterval(checkBreakStatus, 30000);
//     return () => clearInterval(id);
//   }, [isSupervisor, user?.token]);

//   useEffect(() => {
//     if (!user) return;

//     const currentUserId = String(user?._id || user?.id || "");
//     if (!currentUserId) return;

//     const handleNewMessageNotification = (payload) => {
//       const message = payload?.message;
//       if (!message) return;

//       const messageId =
//         message._id ||
//         `${payload.chatId || message.chatId}-${message.createdAt || ""}-${message.sender?._id || message.sender?.id || message.sender || ""}-${message.content?.text || ""}`;

//       if (processedMessageIdsRef.current.has(messageId)) return;
//       processedMessageIdsRef.current.add(messageId);
//       setTimeout(() => {
//         processedMessageIdsRef.current.delete(messageId);
//       }, 15000);

//       const senderId = String(
//         message.sender?._id || message.sender?.id || message.sender || ""
//       );
//       if (!senderId || senderId === currentUserId) return;

//       const senderName =
//         message.sender?.username ||
//         message.sender?.name ||
//         "New message";
//       const messageText =
//         message.content?.text?.trim() ||
//         (message.content?.media?.length ? "Sent an attachment" : "You received a new message");

//       const shouldNotify = document.hidden || !document.hasFocus();
//       if (!shouldNotify) return;

//       if (!("Notification" in window)) return;

//       const showBrowserNotification = () => {
//         const notification = new Notification(`Message from ${senderName}`, {
//           body: messageText,
//           icon: "/favicon.ico",
//           tag: `chat-${payload.chatId || message.chatId || "general"}`,
//         });
//         notification.onclick = () => {
//           window.focus();
//           navigate("/chat");
//         };
//       };

//       if (Notification.permission === "granted") {
//         showBrowserNotification();
//       } else if (Notification.permission === "default") {
//         Notification.requestPermission()
//           .then((permission) => {
//             if (permission === "granted") {
//               showBrowserNotification();
//             }
//           })
//           .catch(() => {});
//       }
//     };

//     socket.on("new_message", handleNewMessageNotification);
//     return () => {
//       socket.off("new_message", handleNewMessageNotification);
//       processedMessageIdsRef.current.clear();
//     };
//   }, [user?._id, user?.id, location.pathname, navigate, user]);

//   useEffect(() => {
//     document.body.classList.add("employee-sidebar-layout");
//     return () => {
//       document.body.classList.remove("employee-sidebar-layout");
//     };
//   }, []);

//   const hasActiveDelegationAsAssignee = useMemo(() => {
//     const list = Array.isArray(myDelegations) ? myDelegations : [];
//     return list.some((delegation) => delegation?.status === "active");
//   }, [myDelegations]);
//   const delegatedFromInUrl = useMemo(() => {
//     const params = new URLSearchParams(location.search || "");
//     return String(params.get("delegatedFrom") || "").trim();
//   }, [location.search]);
//   const goToAttendanceSnapshot = () => {
//     if (delegatedFromInUrl) {
//       navigate(`/attendance-snapshot?delegatedFrom=${encodeURIComponent(delegatedFromInUrl)}`);
//       return;
//     }
//     navigate("/attendance-snapshot");
//   };

//   const resolvedProfilePhoto = useMemo(() => {
//     const fromUser = String(user?.profilePhotoUrl || "").trim();
//     if (fromUser) return fromUser;

//     const fromSummary = String(employeeDashboardSummary?.profile?.profilePhotoUrl || "").trim();
//     if (fromSummary) return fromSummary;

//     return "";
//   }, [user?.profilePhotoUrl, employeeDashboardSummary?.profile?.profilePhotoUrl]);

//   const highQualityPhoto = useMemo(() => {
//     const raw = String(resolvedProfilePhoto || "").trim();
//     if (!raw) return "";
//     if (!raw.includes("res.cloudinary.com") || !raw.includes("/upload/")) return raw;
//     return raw.replace(
//       "/upload/",
//       "/upload/f_auto,q_auto:best,dpr_2.0,c_fill,g_face,w_900,h_900/"
//     );
//   }, [resolvedProfilePhoto]);

//   const sideBtn = (active, tone = "default") => {
//     const toneClass =
//       tone === "indigo"
//         ? "text-indigo-700 border-indigo-200 bg-indigo-50"
//         : tone === "green"
//         ? "text-emerald-700 border-emerald-200 bg-emerald-50"
//         : tone === "amber"
//         ? "text-amber-700 border-amber-200 bg-amber-50"
//         : tone === "rose"
//         ? "text-rose-700 border-rose-200 bg-rose-50"
//         : "text-slate-700 border-[#d7e6e1] bg-white";

//     return `w-full rounded-full border px-4 py-2.5 text-[15px] leading-5 font-medium text-left whitespace-nowrap transition ${
//       active ? toneClass : "text-slate-700 border-[#d7e6e1] bg-white hover:bg-[#f6fbf9]"
//     }`;
//   };

//   return (
//     <>
//       <Toaster position="top-right" />

//       <aside className="hidden md:flex fixed left-0 inset-y-0 h-screen min-h-screen w-[232px] border-r border-[#d4e2dd] bg-white/96 z-50 overflow-hidden">
//         <div className="h-full w-full px-5 py-6 flex flex-col min-h-0">
//           <h1
//             className="text-[34px] leading-none font-bold text-sky-700 tracking-tight cursor-pointer"
//             onClick={() => navigate("/dashboard")}
//           >
//             FDBS
//           </h1>

//           <div className="mt-6 flex-1 min-h-0 rounded-[42px] border border-[#cfe3db] bg-[#f9fcfb] p-2.5 flex flex-col overflow-hidden">
//             <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
//               <div className="flex flex-col gap-2">
//               {!isTransportDepartment && (
//                 <button
//                   onClick={() => navigate("/dashboard")}
//                   className={sideBtn(location.pathname === "/dashboard")}
//                 >
//                   Today
//                 </button>
//               )}

//               {isSupervisor && !isTransportDepartment && (
//                 <button
//                   onClick={() => navigate("/my-defaults")}
//                   className={sideBtn(location.pathname === "/my-defaults", "rose")}
//                 >
//                   My Defaulters
//                 </button>
//               )}

//               {canUploadExcel && (
//                 <button
//                   onClick={() => navigate("/upload-roster")}
//                   className={sideBtn(location.pathname === "/upload-roster", "green")}
//                 >
//                   Upload Roster
//                 </button>
//               )}
//               {canUploadAttendanceOverride && (
//                 <button
//                   onClick={() => navigate("/attendance-override-upload")}
//                   className={sideBtn(location.pathname === "/attendance-override-upload", "indigo")}
//                 >
//                   Attendance Override
//                 </button>
//               )}

//               {isAllowedRosterDepartmentEmployee && (
//                 <button
//                   onClick={() => navigate("/ops-meta-roster")}
//                   className={sideBtn(location.pathname === "/ops-meta-roster", "amber")}
//                 >
//                   Ops-Meta Roster
//                 </button>
//               )}

//               {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
//                 <button
//                   onClick={() => navigate("/attendance-update")}
//                   className={sideBtn(location.pathname.startsWith("/attendance-update"), "indigo")}
//                 >
//                   Attendance Update
//                 </button>
//               )}

//               {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
//                 <button
//                   onClick={goToAttendanceSnapshot}
//                   className={sideBtn(location.pathname === "/attendance-snapshot", "indigo")}
//                 >
//                   Attendance Snapshot
//                 </button>
//               )}
//               {isSupervisor && (
//                 <button
//                   onClick={() => navigate("/employee-login-status")}
//                   className={sideBtn(location.pathname === "/employee-login-status", "indigo")}
//                 >
//                   Team Login Status
//                 </button>
//               )}

//               {isEmployee && hasActiveDelegationAsAssignee && (
//                 <button
//                   onClick={() => navigate("/delegated-actions")}
//                   className={sideBtn(location.pathname === "/delegated-actions")}
//                 >
//                   Delegation
//                 </button>
//               )}

//               {canCreateDelegation && (
//                 <button
//                   onClick={() => navigate("/delegations")}
//                   className={sideBtn(location.pathname === "/delegations", "indigo")}
//                 >
//                   Manage Delegation
//                 </button>
//               )}

//               {isEmployee && (
//                 <button
//                   onClick={() => navigate("/my-profile")}
//                   className={sideBtn(location.pathname === "/my-profile")}
//                 >
//                   My Profile
//                 </button>
//               )}

//               {isEmployee && (
//                 <button
//                   onClick={() => navigate("/chat")}
//                   className={sideBtn(location.pathname === "/chat", "indigo")}
//                 >
//                   Chat
//                 </button>
//               )}

//               <button
//                 onClick={() => navigate("/leave-management")}
//                 className={sideBtn(location.pathname === "/leave-management")}
//               >
//                 Leave
//               </button>
//               </div>
//             </div>

//             <button
//               onClick={handleLogout}
//               className="mt-auto w-full rounded-full border border-[#e4d0d0] px-4 py-2.5 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 transition"
//             >
//               Logout
//             </button>
//           </div>

//           <div className="pt-4">
//             <div className="relative">
//               <button
//                 onClick={() => setShowProfileMenu((prev) => !prev)}
//                 className="w-full rounded-full border border-[#d7e6e1] bg-white px-3 py-2 flex items-center gap-3"
//               >
//                 <span
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     if (resolvedProfilePhoto) setShowPhotoPreview(true);
//                   }}
//                   className="shrink-0"
//                   title={resolvedProfilePhoto ? "View profile photo" : "No profile photo"}
//                 >
//                   {resolvedProfilePhoto ? (
//                     <img
//                       src={highQualityPhoto || resolvedProfilePhoto}
//                       alt={user?.username || "Profile"}
//                       className="w-8 h-8 rounded-full object-cover border border-sky-100"
//                     />
//                   ) : (
//                     <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
//                       {user?.username?.charAt(0)?.toUpperCase() || "U"}
//                     </span>
//                   )}
//                 </span>
//                 <span className="truncate text-slate-800 font-medium text-sm">{user?.username}</span>
//               </button>

//               {showProfileMenu && (
//                 <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-[#d7e6e1] rounded-2xl shadow-md py-2">
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </aside>

//       <div className="md:hidden fixed top-0 left-0 right-0 z-50">
//         <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
//         <nav className="bg-white border-b border-[#d7e6e1] px-4 py-3 shadow-sm">
//           <div className="flex items-center justify-between">
//             <h1 className="text-xl font-bold text-sky-700 cursor-pointer" onClick={() => navigate("/dashboard")}>FDBS</h1>
//             <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
//               {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>

//           {isMenuOpen && (
//             <div className="mt-3 space-y-2 border-t border-[#d7e6e1] pt-3">
//               <button onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Today</button>
//               {isSupervisor && !isTransportDepartment && (
//                 <button onClick={() => { navigate("/my-defaults"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-left text-rose-700">My Defaulters</button>
//               )}
//               {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
//                 <button onClick={() => { navigate("/attendance-update"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Update</button>
//               )}
//               {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
//                 <button onClick={() => { goToAttendanceSnapshot(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Snapshot</button>
//               )}
//               {canUploadAttendanceOverride && (
//                 <button onClick={() => { navigate("/attendance-override-upload"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-left text-cyan-700">Attendance Override</button>
//               )}
//               {isSupervisor && (
//                 <button onClick={() => { navigate("/employee-login-status"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Team Login Status</button>
//               )}
//               {isEmployee && (
//                 <button onClick={() => { navigate("/my-profile"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">My Profile</button>
//               )}
//               {isEmployee && (
//                 <button onClick={() => { navigate("/chat"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Chat</button>
//               )}
//               <button onClick={() => { navigate("/leave-management"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Leave</button>
//               <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-white px-4 py-2 text-left text-rose-700">
//                 Logout ({user?.username})
//               </button>
//             </div>
//           )}
//         </nav>
//       </div>

//       <div className="pt-[78px] md:pt-0" />

//       {showPhotoPreview && resolvedProfilePhoto && (
//         <div
//           className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
//           onClick={() => setShowPhotoPreview(false)}
//         >
//           <div
//             className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <img
//               src={highQualityPhoto || resolvedProfilePhoto}
//               alt={user?.username || "Profile"}
//               className="w-full h-full object-cover"
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Navbar;






import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, AlertCircle, Clock, Camera } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { logoutUser } from "../features/slices/authSlice.js";
import { fetchMyDelegations, selectMyDelegations } from "../features/slices/delegationSlice.js";
import { socket } from "../socket.js";
import {
  canManageAdminPanels,
  getRoleType,
  isAccountsDepartment,
  isTeamLeaderUser,
  normalizeDepartment,
} from "../utils/roleAccess.js";
import { getApiBaseUrl } from "../utils/apiUrl";

const API_URL = getApiBaseUrl();

const ROSTER_ALLOWED_DEPARTMENTS = [
  "Operations",
  "Marketing",
  "Customer Service",
  "Developer",
  "Ticketing",
  "SEO",
  "Accounts"
];

const Navbar = () => {
  const { user, employeeDashboardSummary } = useSelector((state) => state.auth);
  const myDelegations = useSelector(selectMyDelegations);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [chatNotification, setChatNotification] = useState(null);
  const processedMessageIdsRef = useRef(new Set());
  const knownBreakUsersRef = useRef(new Set());
  const breakWatcherInitializedRef = useRef(false);
  const chatNotificationTimerRef = useRef(null);

  const handleLogout = async () => {
    toast.dismiss("auth-login-success");
    await dispatch(logoutUser());
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const roleType = getRoleType(user);
  const normalizedDepartment = normalizeDepartment(user?.department);
  const isEmployee = roleType === "agent" || roleType === "supervisor";
  const isSupervisor = roleType === "supervisor";
  const isTransportDepartment = normalizedDepartment === "Transport";

  const canAccessAttendanceUpdate =
    isEmployee || canManageAdminPanels(user);

  const canAccessAttendanceSnapshot = true;
  const canShowAttendanceSidebarLinks = isSupervisor || isTransportDepartment;

  const isAllowedRosterDepartmentEmployee =
    isEmployee && ROSTER_ALLOWED_DEPARTMENTS.includes(normalizedDepartment);
  const isTeamLeader = isTeamLeaderUser(user);
  const canCreateDelegation =
    (isEmployee && normalizedDepartment === "Operations") || isTeamLeader;

  const canUploadExcel =
    (isEmployee && ROSTER_ALLOWED_DEPARTMENTS.includes(normalizedDepartment)) ||
    canManageAdminPanels(user);
  const canUploadAttendanceOverride =
    roleType === "superAdmin" || isAccountsDepartment(user);

  useEffect(() => {
    if (isEmployee) {
      dispatch(fetchMyDelegations());
    }
  }, [dispatch, isEmployee]);

  useEffect(() => {
    if (!user || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      setChatNotification(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isSupervisor) return;
    const token = user?.token;
    if (!token) return;

    const getTodayDateKey = () => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const checkBreakStatus = async () => {
      const now = Date.now();
      if (window.__dailyStatusPollLock) return;
      if (now - (window.__dailyStatusPollAt || 0) < 5000) return;
      window.__dailyStatusPollAt = now;
      window.__dailyStatusPollLock = true;
      try {
        const res = await fetch(`${API_URL}/punchx/superadmin/daily-status?dateKey=${getTodayDateKey()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data?.rows) ? data.rows : [];
        const currentlyOnBreak = rows
          .filter((r) => r?.isOnBreak)
          .map((r) => ({
            id: String(r.userId || ""),
            name: r.name || r.username || "Employee",
            breakType: r.breakType || "manual",
          }))
          .filter((r) => r.id);
        const currentSet = new Set(currentlyOnBreak.map((r) => r.id));

        if (!breakWatcherInitializedRef.current) {
          knownBreakUsersRef.current = currentSet;
          breakWatcherInitializedRef.current = true;
          return;
        }

        const newBreakEntries = currentlyOnBreak.filter((u) => !knownBreakUsersRef.current.has(u.id));
        newBreakEntries.forEach((u) => {
          const msg = `${u.name} is on ${u.breakType.replace("_", " ")} break`;
          toast(msg, { duration: 5000 });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Break Alert", { body: msg, icon: "/favicon.ico", tag: `break-${u.id}` });
          }
        });
        knownBreakUsersRef.current = currentSet;
      } catch {
      } finally {
        window.__dailyStatusPollLock = false;
      }
    };

    checkBreakStatus();
    const id = setInterval(checkBreakStatus, 30000);
    return () => clearInterval(id);
  }, [isSupervisor, user?.token]);

  useEffect(() => {
    if (!user) return;

    const currentUserId = String(user?._id || user?.id || "");
    if (!currentUserId) return;

    const handleNewMessageNotification = (payload) => {
      const message = payload?.message;
      if (!message) return;

      const messageId =
        message._id ||
        `${payload.chatId || message.chatId}-${message.createdAt || ""}-${message.sender?._id || message.sender?.id || message.sender || ""}-${message.content?.text || ""}`;

      if (processedMessageIdsRef.current.has(messageId)) return;
      processedMessageIdsRef.current.add(messageId);
      setTimeout(() => {
        processedMessageIdsRef.current.delete(messageId);
      }, 15000);

      const senderId = String(
        message.sender?._id || message.sender?.id || message.sender || ""
      );
      if (!senderId || senderId === currentUserId) return;

      const senderName =
        message.sender?.username ||
        message.sender?.name ||
        "New message";
      const messageText =
        message.content?.text?.trim() ||
        (message.content?.media?.length ? "Sent an attachment" : "You received a new message");
      const targetChatId = payload.chatId || message.chatId || null;
      const isChatRoute = location.pathname.startsWith("/chat");

      if (!isChatRoute) {
        setChatNotification({
          id: messageId,
          chatId: targetChatId,
          senderName,
          messageText,
        });

        if (chatNotificationTimerRef.current) {
          clearTimeout(chatNotificationTimerRef.current);
        }

        chatNotificationTimerRef.current = setTimeout(() => {
          setChatNotification(null);
        }, 5500);
      }

      const shouldNotify = document.hidden || !document.hasFocus();
      if (!shouldNotify) return;

      if (!("Notification" in window)) return;

      const showBrowserNotification = () => {
        const notification = new Notification(`Message from ${senderName}`, {
          body: messageText,
          icon: "/favicon.ico",
          tag: `chat-${payload.chatId || message.chatId || "general"}-${messageId}`,
        });
        notification.onclick = () => {
          window.focus();
          navigate("/chat", {
            state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
          });
        };
      };

      if (Notification.permission === "granted") {
        showBrowserNotification();
      } else if (Notification.permission === "default") {
        Notification.requestPermission()
          .then((permission) => {
            if (permission === "granted") {
              showBrowserNotification();
            }
          })
          .catch(() => {});
      }
    };

    socket.on("new_message", handleNewMessageNotification);
    return () => {
      socket.off("new_message", handleNewMessageNotification);
      if (chatNotificationTimerRef.current) {
        clearTimeout(chatNotificationTimerRef.current);
      }
      processedMessageIdsRef.current.clear();
    };
  }, [user?._id, user?.id, location.pathname, navigate, user]);

  useEffect(() => {
    document.body.classList.add("employee-sidebar-layout");
    return () => {
      document.body.classList.remove("employee-sidebar-layout");
    };
  }, []);

  const hasActiveDelegationAsAssignee = useMemo(() => {
    const list = Array.isArray(myDelegations) ? myDelegations : [];
    return list.some((delegation) => delegation?.status === "active");
  }, [myDelegations]);
  const delegatedFromInUrl = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("delegatedFrom") || "").trim();
  }, [location.search]);
  const goToAttendanceSnapshot = () => {
    if (delegatedFromInUrl) {
      navigate(`/attendance-snapshot?delegatedFrom=${encodeURIComponent(delegatedFromInUrl)}`);
      return;
    }
    navigate("/attendance-snapshot");
  };

  const resolvedProfilePhoto = useMemo(() => {
    const fromUser = String(user?.profilePhotoUrl || "").trim();
    if (fromUser) return fromUser;

    const fromSummary = String(employeeDashboardSummary?.profile?.profilePhotoUrl || "").trim();
    if (fromSummary) return fromSummary;

    return "";
  }, [user?.profilePhotoUrl, employeeDashboardSummary?.profile?.profilePhotoUrl]);

  const highQualityPhoto = useMemo(() => {
    const raw = String(resolvedProfilePhoto || "").trim();
    if (!raw) return "";
    if (!raw.includes("res.cloudinary.com") || !raw.includes("/upload/")) return raw;
    return raw.replace(
      "/upload/",
      "/upload/f_auto,q_auto:best,dpr_2.0,c_fill,g_face,w_900,h_900/"
    );
  }, [resolvedProfilePhoto]);

  const sideBtn = (active, tone = "default") => {
    const toneClass =
      tone === "indigo"
        ? "text-indigo-700 border-indigo-200 bg-indigo-50"
        : tone === "green"
        ? "text-emerald-700 border-emerald-200 bg-emerald-50"
        : tone === "amber"
        ? "text-amber-700 border-amber-200 bg-amber-50"
        : tone === "rose"
        ? "text-rose-700 border-rose-200 bg-rose-50"
        : "text-slate-700 border-[#d7e6e1] bg-white";

    return `w-full rounded-full border px-4 py-2.5 text-[15px] leading-5 font-medium text-left whitespace-nowrap transition ${
      active ? toneClass : "text-slate-700 border-[#d7e6e1] bg-white hover:bg-[#f6fbf9]"
    }`;
  };

  return (
    <>
      <Toaster position="top-right" />

      <aside className="hidden md:flex fixed left-0 inset-y-0 h-screen min-h-screen w-[232px] border-r border-[#d4e2dd] bg-white/96 z-50 overflow-hidden">
        <div className="h-full w-full px-5 py-6 flex flex-col min-h-0">
          <h1
            className="text-[34px] leading-none font-bold text-sky-700 tracking-tight cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            FDBS
          </h1>

          <div className="mt-6 flex-1 min-h-0 rounded-[42px] border border-[#cfe3db] bg-[#f9fcfb] p-2.5 flex flex-col overflow-hidden">
            <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
              <div className="flex flex-col gap-2">
              {!isTransportDepartment && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className={sideBtn(location.pathname === "/dashboard")}
                >
                  Today
                </button>
              )}

              {isSupervisor && !isTransportDepartment && (
                <button
                  onClick={() => navigate("/my-defaults")}
                  className={sideBtn(location.pathname === "/my-defaults", "rose")}
                >
                  My Defaulters
                </button>
              )}

              {canUploadExcel && (
                <button
                  onClick={() => navigate("/upload-roster")}
                  className={sideBtn(location.pathname === "/upload-roster", "green")}
                >
                  Upload Roster
                </button>
              )}
              {canUploadAttendanceOverride && (
                <button
                  onClick={() => navigate("/attendance-override-upload")}
                  className={sideBtn(location.pathname === "/attendance-override-upload", "indigo")}
                >
                  Attendance Override
                </button>
              )}

              {isAllowedRosterDepartmentEmployee && (
                <button
                  onClick={() => navigate("/ops-meta-roster")}
                  className={sideBtn(location.pathname === "/ops-meta-roster", "amber")}
                >
                  Ops-Meta Roster
                </button>
              )}

              {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
                <button
                  onClick={() => navigate("/attendance-update")}
                  className={sideBtn(location.pathname.startsWith("/attendance-update"), "indigo")}
                >
                  Attendance Update
                </button>
              )}

              {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
                <button
                  onClick={goToAttendanceSnapshot}
                  className={sideBtn(location.pathname === "/attendance-snapshot", "indigo")}
                >
                  Attendance Snapshot
                </button>
              )}
              {isSupervisor && (
                <button
                  onClick={() => navigate("/employee-login-status")}
                  className={sideBtn(location.pathname === "/employee-login-status", "indigo")}
                >
                  Team Login Status
                </button>
              )}

              {isEmployee && hasActiveDelegationAsAssignee && (
                <button
                  onClick={() => navigate("/delegated-actions")}
                  className={sideBtn(location.pathname === "/delegated-actions")}
                >
                  Delegation
                </button>
              )}

              {canCreateDelegation && (
                <button
                  onClick={() => navigate("/delegations")}
                  className={sideBtn(location.pathname === "/delegations", "indigo")}
                >
                  Manage Delegation
                </button>
              )}

              {isEmployee && (
                <button
                  onClick={() => navigate("/my-profile")}
                  className={sideBtn(location.pathname === "/my-profile")}
                >
                  My Profile
                </button>
              )}

              {isEmployee && (
                <button
                  onClick={() => navigate("/chat")}
                  className={sideBtn(location.pathname === "/chat", "indigo")}
                >
                  Chat
                </button>
              )}

              <button
                onClick={() => navigate("/leave-management")}
                className={sideBtn(location.pathname === "/leave-management")}
              >
                Leave
              </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-auto w-full rounded-full border border-[#e4d0d0] px-4 py-2.5 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 transition"
            >
              Logout
            </button>
          </div>

          <div className="pt-4">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-full rounded-full border border-[#d7e6e1] bg-white px-3 py-2 flex items-center gap-3"
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (resolvedProfilePhoto) setShowPhotoPreview(true);
                  }}
                  className="shrink-0"
                  title={resolvedProfilePhoto ? "View profile photo" : "No profile photo"}
                >
                  {resolvedProfilePhoto ? (
                    <img
                      src={highQualityPhoto || resolvedProfilePhoto}
                      alt={user?.username || "Profile"}
                      className="w-8 h-8 rounded-full object-cover border border-sky-100"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </span>
                <span className="truncate text-slate-800 font-medium text-sm">{user?.username}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-[#d7e6e1] rounded-2xl shadow-md py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
        <nav className="bg-white border-b border-[#d7e6e1] px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-sky-700 cursor-pointer" onClick={() => navigate("/dashboard")}>FDBS</h1>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="mt-3 space-y-2 border-t border-[#d7e6e1] pt-3">
              <button onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Today</button>
              {isSupervisor && !isTransportDepartment && (
                <button onClick={() => { navigate("/my-defaults"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-left text-rose-700">My Defaulters</button>
              )}
              {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
                <button onClick={() => { navigate("/attendance-update"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Update</button>
              )}
              {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
                <button onClick={() => { goToAttendanceSnapshot(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Snapshot</button>
              )}
              {canUploadAttendanceOverride && (
                <button onClick={() => { navigate("/attendance-override-upload"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-left text-cyan-700">Attendance Override</button>
              )}
              {isSupervisor && (
                <button onClick={() => { navigate("/employee-login-status"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Team Login Status</button>
              )}
              {isEmployee && (
                <button onClick={() => { navigate("/my-profile"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">My Profile</button>
              )}
              {isEmployee && (
                <button onClick={() => { navigate("/chat"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Chat</button>
              )}
              <button onClick={() => { navigate("/leave-management"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Leave</button>
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-white px-4 py-2 text-left text-rose-700">
                Logout ({user?.username})
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className="pt-[78px] md:pt-0" />

      {showPhotoPreview && resolvedProfilePhoto && (
        <div
          className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setShowPhotoPreview(false)}
        >
          <div
            className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={highQualityPhoto || resolvedProfilePhoto}
              alt={user?.username || "Profile"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {chatNotification && !location.pathname.startsWith("/chat") && (
        <div className="fixed right-4 top-16 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-[26rem] rounded-2xl overflow-hidden border border-cyan-100 shadow-[0_14px_38px_rgba(14,116,144,0.22)] bg-gradient-to-br from-white via-cyan-50 to-blue-50">
          <button
            onClick={() => {
              const targetChatId = chatNotification.chatId;
              setChatNotification(null);
              navigate("/chat", {
                state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
              });
            }}
            className="w-full text-left p-4 hover:bg-white/70 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white grid place-content-center font-semibold">
                {chatNotification.senderName?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-700 font-semibold">New Chat Message</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{chatNotification.senderName}</p>
                <p className="text-sm text-slate-600 truncate">{chatNotification.messageText}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/80 border border-cyan-100 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
            </div>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;

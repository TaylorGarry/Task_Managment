// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";
// import { 
//   Menu, 
//   X, 
//   AlertCircle, 
//   Clock, 
//   Camera,
//   Home, 
//   Users, 
//   Upload, 
//   Calendar, 
//   FileText, 
//   Megaphone, 
//   Shield, 
//   User, 
//   MessageSquare, 
//   LogOut, 
//   LayoutDashboard, 
//   Share2, 
//   ClipboardList,
//   ChevronDown
// } from "lucide-react";
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
//   const [chatNotification, setChatNotification] = useState(null);
//   const processedMessageIdsRef = useRef(new Set());
//   const knownBreakUsersRef = useRef(new Set());
//   const breakWatcherInitializedRef = useRef(false);
//   const chatNotificationTimerRef = useRef(null);

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
//   const canAccessEmployeeExit =
//     !isTransportDepartment && (normalizedDepartment === "IT" || isAccountsDepartment(user));

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
//     if (location.pathname.startsWith("/chat")) {
//       setChatNotification(null);
//     }
//   }, [location.pathname]);

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
//       const targetChatId = payload.chatId || message.chatId || null;
//       const isChatRoute = location.pathname.startsWith("/chat");

//       if (!isChatRoute) {
//         setChatNotification({
//           id: messageId,
//           chatId: targetChatId,
//           senderName,
//           messageText,
//         });

//         if (chatNotificationTimerRef.current) {
//           clearTimeout(chatNotificationTimerRef.current);
//         }

//         chatNotificationTimerRef.current = setTimeout(() => {
//           setChatNotification(null);
//         }, 5500);
//       }

//       const shouldNotify = document.hidden || !document.hasFocus();
//       if (!shouldNotify) return;

//       if (!("Notification" in window)) return;

//       const showBrowserNotification = () => {
//         const notification = new Notification(`Message from ${senderName}`, {
//           body: messageText,
//           icon: "/favicon.ico",
//           tag: `chat-${payload.chatId || message.chatId || "general"}-${messageId}`,
//         });
//         notification.onclick = () => {
//           window.focus();
//           navigate("/chat", {
//             state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
//           });
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
//       if (chatNotificationTimerRef.current) {
//         clearTimeout(chatNotificationTimerRef.current);
//       }
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

//   // Refactored to map with styling choices inside ChatGPT Image Jun 20, 2026, 12_37_21 AM.png
//   const renderSideItem = (label, path, IconComponent, exact = true) => {
//     const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    
//     return (
//       <button
//         onClick={() => navigate(path)}
//         className={`w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium transition-all duration-150 border-l-[3px] ${
//           isActive 
//             ? "bg-blue-50/70 text-blue-600 border-blue-600 rounded-r-xl font-semibold" 
//             : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
//         }`}
//       >
//         <IconComponent size={20} className={isActive ? "text-blue-600" : "text-slate-400"} />
//         <span className="truncate">{label}</span>
//       </button>
//     );
//   };

//   return (
//     <>
//       <Toaster position="top-right" />

//       {/* Desktop Sidebar Visual Redesign */}
//       <aside className="hidden md:flex fixed left-0 inset-y-0 h-screen min-h-screen w-[250px] border-r border-slate-100 bg-white z-50 overflow-hidden">
//         <div className="h-full w-full px-4 py-6 flex flex-col min-h-0 justify-between">
          
//           <div className="flex flex-col min-h-0 flex-1">
//             <div className="px-3 mb-6">
//               <h1
//                 className="text-[28px] font-bold text-blue-600 tracking-tight cursor-pointer flex items-center gap-1"
//                 onClick={() => navigate("/dashboard")}
//               >
//                 FDBS
//               </h1>
//             </div>

//             <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
//               <div className="flex flex-col">
//                 <p className="px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 mt-2">Menu</p>
                
//                 {!isTransportDepartment && renderSideItem("Today", "/dashboard", Home)}

//                 {isSupervisor && !isTransportDepartment && renderSideItem("My Defaulters", "/my-defaults", Users)}

//                 {canUploadExcel && renderSideItem("Upload Roster", "/upload-roster", Upload)}
                
//                 {canUploadAttendanceOverride && renderSideItem("Attendance Override", "/attendance-override-upload", Shield)}

//                 {isAllowedRosterDepartmentEmployee && renderSideItem("Ops-Meta Roster", "/ops-meta-roster", LayoutDashboard)}

//                 {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && renderSideItem("Attendance Update", "/attendance-update", Calendar, false)}

//                 {!isTransportDepartment && renderSideItem("KRA", "/kra", FileText)}

//                 {!isTransportDepartment && renderSideItem("Announcements", "/announcements", Megaphone)}

//                 {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
//                   <button
//                     onClick={goToAttendanceSnapshot}
//                     className={`w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium transition-all duration-150 border-l-[3px] ${
//                       location.pathname === "/attendance-snapshot"
//                         ? "bg-blue-50/70 text-blue-600 border-blue-600 rounded-r-xl font-semibold" 
//                         : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
//                     }`}
//                   >
//                     <Camera size={20} className={location.pathname === "/attendance-snapshot" ? "text-blue-600" : "text-slate-400"} />
//                     <span className="truncate">Attendance Snapshot</span>
//                   </button>
//                 )}
                
//                 {!isTransportDepartment && isSupervisor && renderSideItem("Team Login Status", "/employee-login-status", Shield)}

//                 {!isTransportDepartment && isEmployee && hasActiveDelegationAsAssignee && renderSideItem("Delegation", "/delegated-actions", Share2)}

//                 {!isTransportDepartment && canCreateDelegation && renderSideItem("Manage Delegation", "/delegations", ClipboardList)}

//                 {!isTransportDepartment && isEmployee && renderSideItem("My Profile", "/my-profile", User)}

//                 {!isTransportDepartment && isEmployee && renderSideItem("Chat", "/chat", MessageSquare)}

//                 {!isTransportDepartment && renderSideItem("Leave", "/leave-management", Clock)}
                
//                 {canAccessEmployeeExit && renderSideItem("Employee Exits", "/employee-exits", LogOut, false)}
//               </div>
//             </div>
//           </div>

//           {/* Bottom Controls / Profile Setup Elements */}
//           <div className="pt-4 flex flex-col gap-3 border-t border-slate-50 mt-auto shrink-0">
            
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/40 text-[15px] font-semibold text-rose-600 hover:bg-rose-50 transition duration-150"
//             >
//               <LogOut size={20} className="text-rose-500" />
//               <span>Logout</span>
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowProfileMenu((prev) => !prev)}
//                 className="w-full rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-2 transition"
//               >
//                 <div className="flex items-center gap-3 min-w-0">
//                   <span
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       if (resolvedProfilePhoto) setShowPhotoPreview(true);
//                     }}
//                     className="shrink-0"
//                     title={resolvedProfilePhoto ? "View profile photo" : "No profile photo"}
//                   >
//                     {resolvedProfilePhoto ? (
//                       <img
//                         src={highQualityPhoto || resolvedProfilePhoto}
//                         alt={user?.username || "Profile"}
//                         className="w-9 h-9 rounded-full object-cover border border-slate-200"
//                       />
//                     ) : (
//                       <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
//                         {user?.username?.charAt(0)?.toUpperCase() || "U"}
//                       </span>
//                     )}
//                   </span>
//                   <div className="flex flex-col text-left min-w-0">
//                     <span className="truncate text-slate-800 font-semibold text-sm leading-snug">{user?.username}</span>
//                     <span className="text-[11px] text-slate-400 font-medium">View Profile</span>
//                   </div>
//                 </div>
//                 <ChevronDown size={16} className="text-slate-400 shrink-0 pr-0.5" />
//               </button>

//               {showProfileMenu && (
//                 <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50">
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2"
//                   >
//                     <LogOut size={16} />
//                     Logout Account
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//         </div>
//       </aside>

//       {/* Mobile Top Navigation Styles */}
//       <div className="md:hidden fixed top-0 left-0 right-0 z-50">
//         <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
//         <nav className="bg-white border-b border-slate-100 px-4 py-3 shadow-sm">
//           <div className="flex items-center justify-between">
//             <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/dashboard")}>FDBS</h1>
//             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
//               {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>

//           {isMenuOpen && (
//             <div className="mt-3 space-y-1 max-h-[75vh] overflow-y-auto border-t border-slate-100 pt-3 pb-2">
//               {!isTransportDepartment && (
//                 <button onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Home size={18} className="text-slate-400" /> Today
//                 </button>
//               )}
//               {isSupervisor && !isTransportDepartment && (
//                 <button onClick={() => { navigate("/my-defaults"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-rose-600 bg-rose-50/50 text-sm font-medium">
//                   <Users size={18} className="text-rose-500" /> My Defaulters
//                 </button>
//               )}
//               {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
//                 <button onClick={() => { navigate("/attendance-update"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-blue-600 bg-blue-50/50 text-sm font-medium">
//                   <Calendar size={18} className="text-blue-500" /> Attendance Update
//                 </button>
//               )}
//               {!isTransportDepartment && (
//                 <button onClick={() => { navigate("/kra"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <FileText size={18} className="text-slate-400" /> KRA
//                 </button>
//               )}
//               {!isTransportDepartment && (
//                 <button onClick={() => { navigate("/announcements"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Megaphone size={18} className="text-slate-400" /> Announcements
//                 </button>
//               )}
//               {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
//                 <button onClick={() => { goToAttendanceSnapshot(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Camera size={18} className="text-slate-400" /> Attendance Snapshot
//                 </button>
//               )}
//               {canUploadAttendanceOverride && (
//                 <button onClick={() => { navigate("/attendance-override-upload"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Shield size={18} className="text-slate-400" /> Attendance Override
//                 </button>
//               )}
//               {!isTransportDepartment && isSupervisor && (
//                 <button onClick={() => { navigate("/employee-login-status"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Shield size={18} className="text-slate-400" /> Team Login Status
//                 </button>
//               )}
//               {!isTransportDepartment && isEmployee && (
//                 <button onClick={() => { navigate("/my-profile"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <User size={18} className="text-slate-400" /> My Profile
//                 </button>
//               )}
//               {!isTransportDepartment && isEmployee && (
//                 <button onClick={() => { navigate("/chat"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <MessageSquare size={18} className="text-slate-400" /> Chat
//                 </button>
//               )}
//               {!isTransportDepartment && (
//                 <button onClick={() => { navigate("/leave-management"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <Clock size={18} className="text-slate-400" /> Leave
//                 </button>
//               )}
//               {canAccessEmployeeExit && (
//                 <button onClick={() => { navigate("/employee-exits"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 text-sm font-medium">
//                   <LogOut size={18} className="text-slate-400" /> Employee Exits
//                 </button>
//               )}
//               <div className="pt-2 mt-2 border-t border-slate-100">
//                 <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-rose-600 bg-rose-50 text-sm font-semibold">
//                   <LogOut size={18} className="text-rose-500" /> Logout ({user?.username})
//                 </button>
//               </div>
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

//       {chatNotification && !location.pathname.startsWith("/chat") && (
//         <div className="fixed right-4 top-16 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-[26rem] rounded-2xl overflow-hidden border border-cyan-100 shadow-[0_14px_38px_rgba(14,116,144,0.22)] bg-gradient-to-br from-white via-cyan-50 to-blue-50">
//           <button
//             onClick={() => {
//               const targetChatId = chatNotification.chatId;
//               setChatNotification(null);
//               navigate("/chat", {
//                 state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
//               });
//             }}
//             className="w-full text-left p-4 hover:bg-white/70 transition-colors"
//           >
//             <div className="flex items-start gap-3">
//               <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white grid place-content-center font-semibold">
//                 {chatNotification.senderName?.charAt(0)?.toUpperCase() || "M"}
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[11px] uppercase tracking-[0.15em] text-blue-600 font-semibold">New Chat Message</p>
//                 <p className="text-sm font-semibold text-slate-900 truncate">{chatNotification.senderName}</p>
//                 <p className="text-sm text-slate-600 truncate">{chatNotification.messageText}</p>
//               </div>
//             </div>
//             <div className="mt-3 h-1.5 rounded-full bg-white/80 border border-blue-100 overflow-hidden">
//               <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse" />
//             </div>
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default Navbar;




import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, 
  X, 
  AlertCircle, 
  Clock, 
  Camera,
  Home, 
  Users, 
  Upload, 
  Calendar, 
  FileText,
  FileSpreadsheet,
  Megaphone,
  Shield, 
  User, 
  MessageSquare, 
  LogOut, 
  LayoutDashboard, 
  Share2, 
  ClipboardList,
  TicketCheck,
  ChevronDown
} from "lucide-react";
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
  const canAccessEmployeeExit =
    !isTransportDepartment && (normalizedDepartment === "IT" || isAccountsDepartment(user));

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

  const renderSideItem = (label, path, IconComponent, exact = true) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 group ${
          isActive 
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/40" 
            : "text-slate-600 hover:bg-blue-100/60 hover:text-blue-700"
        }`}
      >
        <IconComponent size={16} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"} />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* Desktop Sidebar - Light Blue & White Mix */}
      <aside className="hidden md:flex fixed left-0 inset-y-0 h-screen min-h-screen w-[250px] border-r border-blue-200/50 bg-[#F0F9FF] z-50 overflow-hidden">
        <div className="h-full w-full px-4 py-6 flex flex-col min-h-0 justify-between">
          
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-3 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                  <span className="text-white text-xs font-bold font-serif">FD</span>
                </div>
                <h1
                  className="text-2xl font-bold text-blue-700 tracking-tight cursor-pointer"
                  onClick={() => navigate("/dashboard")}
                >
                  FDBS
                </h1>
              </div>
            </div>

            <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col space-y-1 ">
                <p className="px-3 text-[10px] font-bold tracking-wider text-blue-500/70 uppercase mb-1 mt-2">Menu</p>
                
                {!isTransportDepartment && renderSideItem("Today", "/dashboard", Home)}

                {isSupervisor && !isTransportDepartment && renderSideItem("My Defaulters", "/my-defaults", Users)}

                {canUploadExcel && renderSideItem("Upload Roster", "/upload-roster", Upload)}
                
                {canUploadAttendanceOverride && renderSideItem("Attendance Override", "/attendance-override-upload", Shield)}

                {isAllowedRosterDepartmentEmployee && renderSideItem("Ops-Meta Roster", "/ops-meta-roster", LayoutDashboard)}

                {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && renderSideItem("Attendance Update", "/attendance-update", Calendar, false)}

                {!isTransportDepartment && renderSideItem("KRA", "/kra", FileText)}

                {renderSideItem("Salary Slips", "/salary-slips", FileSpreadsheet)}

                {!isTransportDepartment && renderSideItem("Announcement", "/announcements", Megaphone)}

                {!isTransportDepartment && renderSideItem("Ticket Raise", "/tickets", TicketCheck)}

                {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
                  <button
                    onClick={goToAttendanceSnapshot}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 group ${
                      location.pathname === "/attendance-snapshot"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/40" 
                        : "text-slate-600 hover:bg-blue-100/60 hover:text-blue-700"
                    }`}
                  >
                    <Camera size={16} className={location.pathname === "/attendance-snapshot" ? "text-white" : "text-slate-400 group-hover:text-blue-400"} />
                    <span className="truncate">Attendance Snapshot</span>
                  </button>
                )}
                
                {!isTransportDepartment && isSupervisor && renderSideItem("Team Login Status", "/employee-login-status", Shield)}

                {!isTransportDepartment && isEmployee && hasActiveDelegationAsAssignee && renderSideItem("Delegation", "/delegated-actions", Share2)}

                {!isTransportDepartment && canCreateDelegation && renderSideItem("Manage Delegation", "/delegations", ClipboardList)}

                {!isTransportDepartment && isEmployee && renderSideItem("My Profile", "/my-profile", User)}

                {!isTransportDepartment && isEmployee && renderSideItem("Chat", "/chat", MessageSquare)}

                {!isTransportDepartment && renderSideItem("Leave", "/leave-management", Clock)}
                
                {canAccessEmployeeExit && renderSideItem("Employee Exits", "/employee-exits", LogOut, false)}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3 border-t border-blue-200/40 mt-auto shrink-0">
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer text-xs font-semibold rounded-lg border border-rose-200/60 bg-rose-50/40 text-rose-600 hover:bg-rose-50/80 transition duration-150"
            >
              <LogOut size={16} className="text-rose-500" />
              <span>Logout</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-full rounded-lg border border-blue-200/50 bg-blue-100/50 hover:bg-blue-100/70 px-3 py-2 flex items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                        className="w-8 h-8 rounded-full object-cover border border-blue-200/50"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-200/40">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="truncate text-slate-700 font-semibold text-xs leading-snug">{user?.username}</span>
                    <span className="text-[10px] text-blue-500 font-medium">View Profile</span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-blue-400 shrink-0 pr-0.5" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500" />
        <nav className="bg-blue-50/95 backdrop-blur-sm border-b border-blue-200/50 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <span className="text-white text-xs font-bold font-serif">FD</span>
              </div>
              <h1 className="text-xl font-bold text-blue-700 cursor-pointer" onClick={() => navigate("/dashboard")}>FDBS</h1>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-blue-500">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="mt-3 space-y-1 max-h-[75vh] overflow-y-auto border-t border-blue-200/30 pt-3 pb-2">
              {!isTransportDepartment && (
                <button onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Home size={18} className="text-blue-400" /> Today
                </button>
              )}
              {isSupervisor && !isTransportDepartment && (
                <button onClick={() => { navigate("/my-defaults"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-rose-600 bg-rose-50/50 text-sm font-medium">
                  <Users size={18} className="text-rose-500" /> My Defaulters
                </button>
              )}
              {canShowAttendanceSidebarLinks && canAccessAttendanceUpdate && (
                <button onClick={() => { navigate("/attendance-update"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-blue-600 bg-blue-100/60 text-sm font-medium">
                  <Calendar size={18} className="text-blue-500" /> Attendance Update
                </button>
              )}
              {!isTransportDepartment && (
                <button onClick={() => { navigate("/kra"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <FileText size={18} className="text-blue-400" /> KRA
                </button>
              )}
              <button onClick={() => { navigate("/salary-slips"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                <FileSpreadsheet size={18} className="text-blue-400" /> Salary Slips
              </button>
              {!isTransportDepartment && (
                <button onClick={() => { navigate("/announcements"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Megaphone size={18} className="text-blue-400" /> Announcements
                </button>
              )}
              {!isTransportDepartment && (
                <button onClick={() => { navigate("/tickets"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <TicketCheck size={18} className="text-blue-400" /> Tickets
                </button>
              )}
              {canShowAttendanceSidebarLinks && canAccessAttendanceSnapshot && (
                <button onClick={() => { goToAttendanceSnapshot(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Camera size={18} className="text-blue-400" /> Attendance Snapshot
                </button>
              )}
              {canUploadAttendanceOverride && (
                <button onClick={() => { navigate("/attendance-override-upload"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Shield size={18} className="text-blue-400" /> Attendance Override
                </button>
              )}
              {!isTransportDepartment && isSupervisor && (
                <button onClick={() => { navigate("/employee-login-status"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Shield size={18} className="text-blue-400" /> Team Login Status
                </button>
              )}
              {!isTransportDepartment && isEmployee && (
                <button onClick={() => { navigate("/my-profile"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <User size={18} className="text-blue-400" /> My Profile
                </button>
              )}
              {!isTransportDepartment && isEmployee && (
                <button onClick={() => { navigate("/chat"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <MessageSquare size={18} className="text-blue-400" /> Chat
                </button>
              )}
              {!isTransportDepartment && (
                <button onClick={() => { navigate("/leave-management"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <Clock size={18} className="text-blue-400" /> Leave
                </button>
              )}
              {canAccessEmployeeExit && (
                <button onClick={() => { navigate("/employee-exits"); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-700 hover:bg-blue-100/60 text-sm font-medium">
                  <LogOut size={18} className="text-blue-400" /> Employee Exits
                </button>
              )}
              <div className="pt-2 mt-2 border-t border-blue-200/30">
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-rose-600 bg-rose-50 text-sm font-semibold">
                  <LogOut size={18} className="text-rose-500" /> Logout ({user?.username})
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="pt-[78px] md:pt-0" />

      {showPhotoPreview && resolvedProfilePhoto && (
        <div
          className="fixed inset-0 z-[70] bg-blue-900/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPhotoPreview(false)}
        >
          <div
            className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-blue-200/30 bg-white"
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
        <div className="fixed right-4 top-16 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-[26rem] rounded-2xl overflow-hidden border border-blue-200/60 shadow-[0_14px_38px_rgba(59,130,246,0.12)] bg-gradient-to-br from-blue-50/90 via-blue-100/60 to-blue-50/90">
          <button
            onClick={() => {
              const targetChatId = chatNotification.chatId;
              setChatNotification(null);
              navigate("/chat", {
                state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
              });
            }}
            className="w-full text-left p-4 hover:bg-blue-100/70 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white grid place-content-center font-semibold">
                {chatNotification.senderName?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.15em] text-blue-600 font-semibold">New Chat Message</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{chatNotification.senderName}</p>
                <p className="text-sm text-slate-600 truncate">{chatNotification.messageText}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-blue-100/60 border border-blue-200/40 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-blue-300 to-blue-500 animate-pulse" />
            </div>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;

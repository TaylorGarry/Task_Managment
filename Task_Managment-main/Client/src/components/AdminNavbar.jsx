// import React, { useState, useRef, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";
// import { logoutUser } from "../features/slices/authSlice.js";
// import { exportTaskStatusExcel } from "../features/slices/taskSlice.js";
// import { FiLogOut, FiMenu, FiX, FiDownload, FiUsers, FiUserPlus, FiUser, FiCalendar } from "react-icons/fi";
// import { Clock } from "lucide-react"; // Add this import
// import toast from "react-hot-toast";
// import { socket } from "../socket.js";

// // const API_URL = "http://localhost:4000/api/v1";
// // const API_URL = "https://crm-taskmanagement-api-7e5os.ondigitalocean.app/api/v1";
// const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

// const AdminNavbar = () => {
//   const { user } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [showProfilePopup, setShowProfilePopup] = useState(false);
//   const [username, setUsername] = useState(user?.username || "");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [chatNotification, setChatNotification] = useState(null);
//   const [unreadChatCount, setUnreadChatCount] = useState(0);

//   const dropdownRef = useRef();
//   const titleResetTimerRef = useRef(null);
//   const defaultTitleRef = useRef(document.title);
//   const processedMessageIdsRef = useRef(new Set());

//   // 🔥 NEW: Attendance Update Permission
//   const allowedAttendanceDepartments = ["Ops - Meta", "Transport"];
  
//   const canAccessAttendanceUpdate =
//     (user?.accountType === "employee" &&
//       allowedAttendanceDepartments.includes(user?.department)) ||
//     ["admin", "superAdmin", "HR"].includes(user?.accountType);

//   // Check if user is Ops-Meta employee
//   const isOpsMeta = user?.accountType === "employee" && user?.department === "Ops - Meta";
  
//   // Check if user can upload Excel (Ops-Meta employees + Admin/HR/superAdmin)
//   const canUploadExcel = 
//     (user?.accountType === "employee" && user?.department === "Ops - Meta") ||
//     ["admin", "superAdmin", "HR"].includes(user?.accountType);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (showMobileMenu) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }

//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [showMobileMenu]);

//   useEffect(() => {
//     setShowMobileMenu(false);
//     document.body.style.overflow = "";
//   }, [location.pathname]);

//   useEffect(() => {
//     const isChatRoute = location.pathname.startsWith("/admin/chat");
//     if (isChatRoute) {
//       setUnreadChatCount(0);
//       document.title = defaultTitleRef.current;
//       setChatNotification(null);
//     }
//   }, [location.pathname]);

//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (!document.hidden && location.pathname.startsWith("/admin/chat")) {
//         setUnreadChatCount(0);
//         document.title = defaultTitleRef.current;
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
//   }, [location.pathname]);

//   useEffect(() => {
//     const currentUserId = user?.id || user?._id;
//     if (!currentUserId) return;

//     const handleNewMessageNotification = (payload) => {
//       if (!payload?.message) return;

//       const messageId =
//         payload.message._id ||
//         `${payload.chatId || payload.message.chatId}-${payload.message.createdAt || ""}-${payload.message.sender?._id || payload.message.sender?.id || payload.message.sender || ""}-${payload.message.content?.text || ""}`;

//       if (processedMessageIdsRef.current.has(messageId)) {
//         return;
//       }
//       processedMessageIdsRef.current.add(messageId);
//       setTimeout(() => {
//         processedMessageIdsRef.current.delete(messageId);
//       }, 15000);

//       const senderId =
//         payload.message.sender?._id ||
//         payload.message.sender?.id ||
//         payload.message.sender;

//       if (!senderId || String(senderId) === String(currentUserId)) return;

//       const isChatRoute = location.pathname.startsWith("/admin/chat");
//       const senderName =
//         payload.message.sender?.username ||
//         payload.message.sender?.name ||
//         "New message";
//       const messageText =
//         payload.message.content?.text?.trim() ||
//         (payload.message.content?.media?.length ? "Sent an attachment" : "You received a new message");

//       if (!isChatRoute) {
//         setChatNotification({
//           id: payload.message._id || `${Date.now()}`,
//           chatId: payload.chatId || payload.message.chatId,
//           senderName,
//           messageText,
//         });

//         setUnreadChatCount((prev) => {
//           const next = prev + 1;
//           document.title = `(${next}) New Message${next > 1 ? "s" : ""} | Task Management`;
//           return next;
//         });

//         if (titleResetTimerRef.current) {
//           clearTimeout(titleResetTimerRef.current);
//         }

//         titleResetTimerRef.current = setTimeout(() => {
//           setChatNotification(null);
//         }, 5500);
//       }

//       if (document.hidden && "Notification" in window) {
//         const showBrowserNotification = () => {
//           new Notification(`Message from ${senderName}`, {
//             body: messageText,
//             icon: "/favicon.ico",
//             tag: `chat-${payload.chatId || payload.message.chatId || "general"}`,
//           });
//         };

//         if (Notification.permission === "granted") {
//           showBrowserNotification();
//         } else if (Notification.permission === "default") {
//           Notification.requestPermission().then((permission) => {
//             if (permission === "granted") {
//               showBrowserNotification();
//             }
//           });
//         }
//       }
//     };

//     socket.on("new_message", handleNewMessageNotification);
//     return () => {
//       socket.off("new_message", handleNewMessageNotification);
//       if (titleResetTimerRef.current) {
//         clearTimeout(titleResetTimerRef.current);
//       }
//       processedMessageIdsRef.current.clear();
//     };
//   }, [location.pathname, user?.id, user?._id]);

//   const getInitials = (name) => {
//     if (!name) return "U";
//     const parts = name.split(" ");
//     return parts.length > 1
//       ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
//       : name[0].toUpperCase();
//   };
//   const handleLogout = () => {
//     dispatch(logoutUser());
//     setShowDropdown(false);
//     setShowMobileMenu(false);
//     navigate("/login");
//   };

//   const handleUpdateProfile = async () => {
//     try {
//       setLoading(true);
//       const token = user?.token;
//       const res = await axios.post(
//         `${API_URL}/update-profile`,
//         { username, password },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.user) {
//         const updatedUser = { ...user, ...res.data.user };
//         localStorage.setItem("user", JSON.stringify(updatedUser));
//         toast.success("Profile updated successfully!");
//         setShowProfilePopup(false);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to update profile");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleExport = async () => {
//     try {
//       setExporting(true);
//       const result = await dispatch(exportTaskStatusExcel()).unwrap();

//       if (!result || !result.blob) throw new Error("No file returned from server");

//       const url = window.URL.createObjectURL(result.blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = result.filename || `Task_Status_${new Date().toISOString().slice(0, 10)}.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);

//       toast.success("Excel exported successfully!");
//     } catch (err) {
//       toast.error(err?.message || "Failed to export tasks!");
//     } finally {
//       setExporting(false);
//     }
//   };

//   const isActive = (path) => location.pathname === path;
//   const isCreateUserActive =
//     location.pathname === "/signup" || location.pathname === "/admin/signup";
//   const canManageAdmin = ["admin", "superAdmin"].includes(user?.accountType);
//   const navLinkClass = (path) =>
//     `rounded-full px-2.5 lg:px-3 py-1.5 transition-colors font-medium text-sm whitespace-nowrap ${
//       isActive(path)
//         ? "bg-blue-100 text-blue-800 border border-blue-200"
//         : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
//     }`;

//   return (
//     <>
//       <nav className="fixed top-0 left-0 w-full z-50">
//         <style>{`
//           @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
//         `}</style>
//         <div className="border-b border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur">
//           <div className="max-w-[1400px] mx-auto px-3 lg:px-5 py-2 flex justify-between items-center gap-3">
//             <h1
//               className="text-base lg:text-lg font-semibold text-slate-900 cursor-pointer whitespace-nowrap"
//               style={{ fontFamily: "'Playfair Display', serif" }}
//               onClick={() => navigate("/admin/tasks")}
//             >
//               Task Management
//             </h1>
//             <div className="hidden md:flex items-center gap-2 lg:gap-3 min-w-0" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
//               <Link 
//                 to="/admin/roster" 
//                 className={`flex items-center gap-2 ${navLinkClass("/admin/roster")}`}
//               >
//                 <FiCalendar className="text-lg text-blue-600" />
//                 Roster
//               </Link>
              
//               {/* 🔥 NEW: Attendance Update Button */}
//               {canAccessAttendanceUpdate && (
//                 <button
//                   onClick={() => navigate("/attendance-update")}
//                   className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-2.5 lg:px-3 py-1.5 rounded-full text-indigo-700 font-medium text-sm whitespace-nowrap hover:bg-indigo-100 transition-all cursor-pointer"
//                 >
//                   <Clock className="w-4 h-4" />
//                   Attendance Update
//                 </button>
//               )}

//               {isOpsMeta && (
//                 <button
//                   onClick={() => navigate("/ops-meta-roster")}
//                   className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-2.5 lg:px-3 py-1.5 rounded-full text-amber-700 font-medium text-sm whitespace-nowrap hover:bg-amber-100 transition-all cursor-pointer"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   Ops-Meta Roster
//                 </button>
//               )}
//               {canUploadExcel && (
//                 <button
//                   onClick={() => navigate("/upload-roster")}
//                   className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 lg:px-3 py-1.5 rounded-full text-emerald-700 font-medium text-sm whitespace-nowrap hover:bg-emerald-100 transition-all cursor-pointer"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                       d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                   </svg>
//                   Upload Roster (Excel)
//                 </button>
//               )}
// {/*               
//               <Link to="/admin/adminDashboard" className={navLinkClass("/admin/adminDashboard")}>
//                 Admin
//               </Link> */}
//               <Link to="/admin/admintask" className={navLinkClass("/admin/admintask")}>
//                 Your Task
//               </Link>
//               <Link to="/admin/chat" className={`relative ${navLinkClass("/admin/chat")}`}>
//                 Chat
//                 {unreadChatCount > 0 && (
//                   <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
//                     {unreadChatCount > 99 ? "99+" : unreadChatCount}
//                   </span>
//                 )}
//               </Link>
//               {canManageAdmin && (
//                 <>
//                   <Link to="/admin/assign-task" className={navLinkClass("/admin/assign-task")}>
//                     Assign Task
//                   </Link>
//                   <Link to="/admin/tasks" className={navLinkClass("/admin/tasks")}>
//                     Task Status
//                   </Link>
//                   <Link to="/admin/defaulter" className={navLinkClass("/admin/defaulter")}>
//                     Defaulter  
//                   </Link>
//                   <button
//                     onClick={handleExport}
//                     disabled={exporting}
//                     className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 lg:px-3 py-1.5 rounded-full text-sm whitespace-nowrap shadow-sm transition-all cursor-pointer"
//                   >
//                     <FiDownload />
//                     {exporting ? "Exporting..." : "Export Excel"}
//                   </button>
//                   <button
//                     onClick={() => navigate("/signup")}
//                     className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all cursor-pointer border ${
//                       isCreateUserActive
//                         ? "bg-blue-100 text-blue-800 border-blue-200"
//                         : "border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
//                     }`}
//                   >
//                     Create User
//                   </button>
//                 </>
//               )}
//               <div className="relative ml-2 lg:ml-3 shrink-0" ref={dropdownRef}>
//                 <button
//                   className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200 cursor-pointer"
//                   onClick={() => setShowDropdown(!showDropdown)}
//                 >
//                   {getInitials(user?.username)}
//                 </button>

//                 {showDropdown && (
//                   <div className="absolute right-0 mt-2 w-44 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 py-2">
//                     <button
//                       onClick={() => setShowProfilePopup(true)}
//                       className="w-full px-3 py-2 hover:bg-slate-100 text-left cursor-pointer"
//                     >
//                       My Profile
//                     </button>
//                     <button
//                       onClick={() => {
//                         navigate("/admin/manage-employee");
//                         setShowDropdown(false);
//                       }}
//                       className="w-full px-3 py-2 hover:bg-slate-100 text-left cursor-pointer"
//                     >
//                       Team
//                     </button>
//                     <button
//                       onClick={handleLogout}
//                       className="w-full px-3 py-2 hover:bg-rose-50 text-left cursor-pointer text-rose-700"
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//             <div className="md:hidden">
//               <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-slate-700">
//                 <FiMenu />
//               </button>
//             </div>
//           </div>
//         </div>

//         {showMobileMenu && (
//           <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex md:hidden">
//             <div className="bg-white w-72 h-screen overflow-y-auto p-6 flex flex-col gap-4 relative text-slate-800 border-r border-slate-200 shadow-xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-lg font-semibold text-slate-900">Task Management</h2>
//                 <button
//                   onClick={() => setShowMobileMenu(false)}
//                   className="text-2xl text-slate-500 hover:text-slate-800"
//                 >
//                   <FiX />
//                 </button>
//               </div>

//               <Link
//                 to="/admin/roster"
//                 className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 <FiCalendar className="text-lg text-blue-600" />
//                 Roster
//               </Link>

//               {/* 🔥 NEW: Attendance Update Button in Mobile Menu */}
//               {canAccessAttendanceUpdate && (
//                 <button
//                   onClick={() => {
//                     navigate("/attendance-update");
//                     setShowMobileMenu(false);
//                   }}
//                   className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl text-indigo-700 font-medium hover:bg-indigo-100 transition-all w-full text-left"
//                 >
//                   <Clock className="w-4 h-4" />
//                   Attendance Update
//                 </button>
//               )}

//               {isOpsMeta && (
//                 <button
//                   onClick={() => {
//                     navigate("/ops-meta-roster");
//                     setShowMobileMenu(false);
//                   }}
//                   className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-amber-700 font-medium hover:bg-amber-100 transition-all w-full text-left"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   Ops-Meta Roster
//                 </button>
//               )}

//               {canUploadExcel && (
//                 <button
//                   onClick={() => {
//                     navigate("/upload-roster");
//                     setShowMobileMenu(false);
//                   }}
//                   className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-700 font-medium hover:bg-emerald-100 transition-all w-full text-left"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                       d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                   </svg>
//                   Upload Roster (Excel)
//                 </button>
//               )}

//               {/* <Link
//                 to="/admin/adminDashboard"
//                 className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 Admin Dashboard
//               </Link> */}
//               <Link to="/admin/admintask" className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
//                 Your Task
//               </Link>

//               <Link
//                 to="/admin/assign-task"
//                 className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 Assign Task
//               </Link>
//               <Link
//                 to="/admin/chat"
//                 className="relative text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 Chat
//                 {unreadChatCount > 0 && (
//                   <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
//                     {unreadChatCount > 99 ? "99+" : unreadChatCount}
//                   </span>
//                 )}
//               </Link>
//               <Link
//                 to="/admin/tasks"
//                 className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 Task Status
//               </Link>

//               <Link
//                 to="/admin/defaulter"
//                 className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
//                 onClick={() => setShowMobileMenu(false)}
//               >
//                 Defaulter
//               </Link>

//               {canManageAdmin && (
//                 <>
//                   <div className="mt-2 pt-4 border-t border-slate-200">
//                     <button
//                       onClick={() => {
//                         navigate("/admin/manage-employee");
//                         setShowMobileMenu(false);
//                       }}
//                       className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
//                     >
//                       <FiUsers className="text-lg text-blue-600" />
//                       Team Management
//                     </button>

//                     <button
//                       onClick={handleExport}
//                       disabled={exporting}
//                       className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full text-sm shadow-sm transition-all w-full justify-center mt-2"
//                     >
//                       <FiDownload size={18} />
//                       {exporting ? "Exporting..." : "Export Excel"}
//                     </button>

//                     <button
//                       onClick={() => {
//                         navigate("/signup");
//                         setShowMobileMenu(false);
//                       }}
//                       className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm transition-all w-full justify-center mt-2 border ${
//                         isCreateUserActive
//                           ? "bg-blue-100 text-blue-800 border-blue-200"
//                           : "border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
//                       }`}
//                     >
//                       <FiUserPlus size={18} />
//                       Create User
//                     </button>
//                   </div>
//                 </>
//               )}

//               <div className="mt-4 pt-4 border-t border-slate-200">
//                 <button
//                   onClick={() => setShowProfilePopup(true)}
//                   className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
//                 >
//                   <FiUser className="text-lg text-blue-600" />
//                   My Profile
//                 </button>
                
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center gap-2 text-rose-700 hover:text-rose-800 font-semibold py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors w-full text-left mt-2"
//                 >
//                   <FiLogOut className="text-lg" />
//                   Logout
//                 </button>
//               </div>
//               <div className="mt-auto pt-4 border-t border-slate-200">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200">
//                     {getInitials(user?.username)}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-slate-900">{user?.username}</p>
//                     <p className="text-xs text-slate-500">{user?.accountType}</p>
//                     {user?.department && (
//                       <p className="text-xs text-slate-500">{user?.department}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div 
//               className="flex-1" 
//               onClick={() => setShowMobileMenu(false)}
//             ></div>
//           </div>
//         )}

//         {showProfilePopup && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
//             <div className="bg-white p-6 rounded-3xl shadow-2xl w-80 relative text-slate-900 border border-slate-200">
//               <button
//                 onClick={() => setShowProfilePopup(false)}
//                 className="absolute top-2 right-2 text-slate-500 hover:text-slate-800"
//               >
//                 <FiX size={20} />
//               </button>

//               <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
//                 Update Profile
//               </h2>

//               <div className="flex flex-col gap-3">
//                 <input
//                   type="text"
//                   placeholder="New Username"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
//                 />
//                 <input
//                   type="password"
//                   placeholder="New Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
//                 />
//                 <button
//                   onClick={handleUpdateProfile}
//                   disabled={loading}
//                   className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full mt-2 cursor-pointer"
//                 >
//                   {loading ? "Updating..." : "Update"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </nav>
//       {chatNotification && !location.pathname.startsWith("/admin/chat") && (
//         <div className="fixed right-4 top-16 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-[26rem] rounded-2xl overflow-hidden border border-cyan-100 shadow-[0_14px_38px_rgba(14,116,144,0.22)] bg-gradient-to-br from-white via-cyan-50 to-blue-50">
//           <button
//             onClick={() => {
//               const targetChatId = chatNotification.chatId;
//               setChatNotification(null);
//               setUnreadChatCount(0);
//               document.title = defaultTitleRef.current;
//               navigate("/admin/chat", {
//                 state: targetChatId ? { openChatId: targetChatId, openFromNotification: true } : undefined,
//               });
//             }}
//             className="w-full text-left p-4 hover:bg-white/70 transition-colors"
//           >
//             <div className="flex items-start gap-3">
//               <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white grid place-content-center font-semibold">
//                 {chatNotification.senderName?.charAt(0)?.toUpperCase() || "M"}
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-700 font-semibold">New Chat Message</p>
//                 <p className="text-sm font-semibold text-slate-900 truncate">{chatNotification.senderName}</p>
//                 <p className="text-sm text-slate-600 truncate">{chatNotification.messageText}</p>
//               </div>
//             </div>
//             <div className="mt-3 h-1.5 rounded-full bg-white/80 border border-cyan-100 overflow-hidden">
//               <div className="h-full w-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
//             </div>
//           </button>
//         </div>
//       )}
//       <Outlet />
//     </>
//   );
// };

// export default AdminNavbar;


import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { logoutUser } from "../features/slices/authSlice.js";
import { exportTaskStatusExcel } from "../features/slices/taskSlice.js";
import { FiLogOut, FiMenu, FiX, FiDownload, FiUsers, FiUserPlus, FiUser, FiCalendar, FiBell } from "react-icons/fi";
import { Clock } from "lucide-react";  
import { Camera } from "lucide-react";  
import { ChevronDown } from "lucide-react";  
import toast from "react-hot-toast";
import { socket } from "../socket.js";

 const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://crm-taskmanagement-api-7e5os.ondigitalocean.app/api/v1";
//const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const AdminNavbar = ({ showOutlet = true }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAttendanceDropdown, setShowAttendanceDropdown] = useState(false); 
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [chatNotification, setChatNotification] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [unreadSystemCount, setUnreadSystemCount] = useState(0);
  const [showSystemNotifications, setShowSystemNotifications] = useState(false);

  const dropdownRef = useRef();
  const attendanceDropdownRef = useRef(); 
  const systemNotificationRef = useRef();
  const titleResetTimerRef = useRef(null);
  const defaultTitleRef = useRef(document.title);
  const processedMessageIdsRef = useRef(new Set());

  const allowedAttendanceDepartments = ["Ops - Meta", "Transport"];
  
  const canAccessAttendanceUpdate =
    (user?.accountType === "employee" &&
      allowedAttendanceDepartments.includes(user?.department)) ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);

  // 🔥 NEW: Attendance Snapshots Permission - Available to all employees
  const canAccessAttendanceSnapshots = 
    user?.accountType === "employee" || 
    ["admin", "superAdmin", "HR"].includes(user?.accountType);
  const canAccessDelegation =
    ["superAdmin", "HR"].includes(user?.accountType) ||
    (user?.accountType === "employee" && String(user?.department || "").toLowerCase() === "ops - meta");

  // Check if user is Ops-Meta employee
  const isOpsMeta = user?.accountType === "employee" && user?.department === "Ops - Meta";
  
  // Check if user can upload Excel (Ops-Meta employees + Admin/HR/superAdmin)
  const canUploadExcel = 
    (user?.accountType === "employee" && user?.department === "Ops - Meta") ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (attendanceDropdownRef.current && !attendanceDropdownRef.current.contains(e.target)) {
        setShowAttendanceDropdown(false);
      }
      if (systemNotificationRef.current && !systemNotificationRef.current.contains(e.target)) {
        setShowSystemNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  useLayoutEffect(() => {
    document.body.classList.add("admin-sidebar-layout");
    return () => {
      document.body.classList.remove("admin-sidebar-layout");
    };
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
    document.body.style.overflow = "";
  }, [location.pathname]);

  useEffect(() => {
    const isChatRoute = location.pathname.startsWith("/admin/chat");
    if (isChatRoute) {
      setUnreadChatCount(0);
      document.title = defaultTitleRef.current;
      setChatNotification(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname.startsWith("/admin/chat")) {
        setUnreadChatCount(0);
        document.title = defaultTitleRef.current;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [location.pathname]);

  useEffect(() => {
    if (user?.accountType !== "superAdmin") return;
    const token = user?.token;
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_URL}/notifications/my?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSystemNotifications(res.data?.data || []);
        setUnreadSystemCount(Number(res.data?.unreadCount || 0));
      } catch (error) {
        console.error("Failed to fetch notifications:", error?.response?.data || error?.message);
      }
    };

    fetchNotifications();
  }, [user?.accountType, user?.token]);

  useEffect(() => {
    if (user?.accountType !== "superAdmin") return;

    const handleSystemNotification = (notification) => {
      if (!notification) return;
      setSystemNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadSystemCount((prev) => prev + 1);

      if (document.hidden && "Notification" in window) {
        const showBrowserNotification = () => {
          new Notification(notification.title || "New Notification", {
            body: notification.message || "",
            icon: "/favicon.ico",
            tag: `sys-${notification._id || Date.now()}`,
          });
        };

        if (Notification.permission === "granted") {
          showBrowserNotification();
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") showBrowserNotification();
          });
        }
      }
    };

    socket.on("system_notification", handleSystemNotification);
    return () => {
      socket.off("system_notification", handleSystemNotification);
    };
  }, [user?.accountType]);

  const markSystemNotificationRead = async (id) => {
    if (!id || !user?.token) return;
    try {
      await axios.patch(
        `${API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSystemNotifications((prev) =>
        prev.map((n) => (String(n._id) === String(id) ? { ...n, read: true } : n))
      );
      setUnreadSystemCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error?.response?.data || error?.message);
    }
  };

  const markAllSystemNotificationsRead = async () => {
    if (!user?.token) return;
    try {
      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSystemNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadSystemCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error?.response?.data || error?.message);
    }
  };

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (!currentUserId) return;

    const handleNewMessageNotification = (payload) => {
      if (!payload?.message) return;

      const messageId =
        payload.message._id ||
        `${payload.chatId || payload.message.chatId}-${payload.message.createdAt || ""}-${payload.message.sender?._id || payload.message.sender?.id || payload.message.sender || ""}-${payload.message.content?.text || ""}`;

      if (processedMessageIdsRef.current.has(messageId)) {
        return;
      }
      processedMessageIdsRef.current.add(messageId);
      setTimeout(() => {
        processedMessageIdsRef.current.delete(messageId);
      }, 15000);

      const senderId =
        payload.message.sender?._id ||
        payload.message.sender?.id ||
        payload.message.sender;

      if (!senderId || String(senderId) === String(currentUserId)) return;

      const isChatRoute = location.pathname.startsWith("/admin/chat");
      const senderName =
        payload.message.sender?.username ||
        payload.message.sender?.name ||
        "New message";
      const messageText =
        payload.message.content?.text?.trim() ||
        (payload.message.content?.media?.length ? "Sent an attachment" : "You received a new message");

      if (!isChatRoute) {
        setChatNotification({
          id: payload.message._id || `${Date.now()}`,
          chatId: payload.chatId || payload.message.chatId,
          senderName,
          messageText,
        });

        setUnreadChatCount((prev) => {
          const next = prev + 1;
          document.title = `(${next}) New Message${next > 1 ? "s" : ""} | Task Management`;
          return next;
        });

        if (titleResetTimerRef.current) {
          clearTimeout(titleResetTimerRef.current);
        }

        titleResetTimerRef.current = setTimeout(() => {
          setChatNotification(null);
        }, 5500);
      }

      if (document.hidden && "Notification" in window) {
        const showBrowserNotification = () => {
          new Notification(`Message from ${senderName}`, {
            body: messageText,
            icon: "/favicon.ico",
            tag: `chat-${payload.chatId || payload.message.chatId || "general"}`,
          });
        };

        if (Notification.permission === "granted") {
          showBrowserNotification();
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              showBrowserNotification();
            }
          });
        }
      }
    };

    socket.on("new_message", handleNewMessageNotification);
    return () => {
      socket.off("new_message", handleNewMessageNotification);
      if (titleResetTimerRef.current) {
        clearTimeout(titleResetTimerRef.current);
      }
      processedMessageIdsRef.current.clear();
    };
  }, [location.pathname, user?.id, user?._id]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : name[0].toUpperCase();
  };
  const handleLogout = () => {
    dispatch(logoutUser());
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate("/login");
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = user?.token;
      const res = await axios.post(
        `${API_URL}/update-profile`,
        { username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.user) {
        const updatedUser = { ...user, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully!");
        setShowProfilePopup(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await dispatch(exportTaskStatusExcel()).unwrap();

      if (!result || !result.blob) throw new Error("No file returned from server");

      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `Task_Status_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel exported successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to export tasks!");
    } finally {
      setExporting(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isCreateUserActive =
    location.pathname === "/signup" || location.pathname === "/admin/signup";
  const canManageAdmin = ["admin", "superAdmin"].includes(user?.accountType);
  const navLinkClass = (path) =>
    `nav-pill w-full justify-start px-3 lg:px-3.5 py-2 transition-colors font-medium text-sm whitespace-nowrap ${
      isActive(path)
        ? "nav-pill-blue"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <>
      <nav className="fixed top-0 left-0 md:inset-y-0 z-50 w-full md:w-[280px] md:h-screen">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
          @media (min-width: 768px) {
            .admin-sidebar-menu {
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: transparent !important;
              padding: 0 !important;
            }
            .admin-sidebar-menu .nav-pill {
              width: 100% !important;
              justify-content: flex-start !important;
              border-radius: 8px !important;
            }
          }
        `}</style>
        <div className="app-shell-nav text-slate-900 shadow-sm md:h-full md:pl-6 md:pr-4 md:py-5">
          <div className="app-shell-inner md:max-w-none px-3 lg:px-5 py-2 md:p-0 flex justify-between items-center gap-4 md:h-full md:flex-col md:items-stretch md:justify-start">
            <h1
              className="app-brand text-xl lg:text-2xl font-semibold cursor-pointer whitespace-nowrap"
              style={{ fontFamily: "'Playfair Display', serif" }}
              onClick={() => navigate("/admin/tasks")}
            >
              FDBS
            </h1>
            <div className="hidden md:flex flex-col gap-3 min-w-0 min-h-0 flex-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <div className="app-nav-scroller admin-sidebar-menu md:flex-1 md:min-h-0 md:flex-col md:items-stretch md:rounded-none md:!border-0 md:!shadow-none md:!bg-transparent md:p-0 md:gap-2 md:overflow-y-auto">
              <Link 
                to="/admin/roster" 
                className={`flex items-center gap-2 ${navLinkClass("/admin/roster")}`}
              >
                <FiCalendar className="text-lg text-blue-600" />
                Roster
              </Link>
              
              {/* 🔥 FIXED: Attendance Update Dropdown with clickable main button */}
              {canAccessAttendanceUpdate && (
                <div className="relative" ref={attendanceDropdownRef}>
                  <div className="flex items-center">
                    {/* Main Attendance Update Button - Navigates to attendance update page */}
                    <button
                      onClick={() => {
                        navigate("/attendance-update");
                        setShowAttendanceDropdown(false);
                      }}
                      className="nav-pill nav-pill-indigo flex items-center gap-2 px-3.5 py-2 font-medium text-sm whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <Clock className="w-4 h-4" />
                      Attendance Update
                    </button>
                    
                    {/* Dropdown Toggle Button */}
                    <button
                      onClick={() => setShowAttendanceDropdown(!showAttendanceDropdown)}
                      className="nav-pill nav-pill-indigo ml-1 px-2 py-2 text-indigo-700 cursor-pointer shrink-0"
                      aria-label="Toggle dropdown"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAttendanceDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showAttendanceDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-indigo-100 py-2 z-50">
                      {/* Attendance Snapshots Option */}
                      {canAccessAttendanceSnapshots && (
                        <button
                          onClick={() => {
                            navigate("/attendance-snapshot");
                            setShowAttendanceDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left transition-colors"
                        >
                          <Camera className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Attendance Snapshots</p>
                            <p className="text-xs text-slate-500">View attendance photos</p>
                          </div>
                        </button>
                      )}

                      {/* Upload Roster Option - Only for Ops-Meta and Admin/HR */}
                      {canUploadExcel && (
                        <button
                          onClick={() => {
                            navigate("/upload-roster");
                            setShowAttendanceDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left transition-colors border-t border-indigo-50"
                        >
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Upload Roster (Excel)</p>
                            <p className="text-xs text-slate-500">Bulk upload roster data</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canAccessAttendanceSnapshots && (
                <button
                  onClick={() => navigate("/attendance-snapshot")}
                  className="nav-pill nav-pill-indigo flex items-center gap-2 px-3.5 py-2 font-medium text-sm whitespace-nowrap cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  Attendance Snapshot
                </button>
              )}

              {canUploadExcel && (
                <button
                  onClick={() => navigate("/upload-roster")}
                  className="nav-pill nav-pill-green flex items-center gap-2 px-3.5 py-2 font-medium text-sm whitespace-nowrap cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Roster
                </button>
              )}

			             {canAccessDelegation && (
				  <Link
				    to="/admin/delegations"
			    className={`nav-pill nav-pill-blue flex items-center gap-2 px-3.5 py-2 text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
			      location.pathname === "/delegations" || location.pathname === "/admin/delegations"
			        ? "ring-2 ring-cyan-200"
			        : ""
		    }`}
	  >
    <FiUsers className="w-4 h-4" />
    Delegation
	  </Link>
	)}
		              <Link
		                to="/admin/leave-management"
		                className={`nav-pill nav-pill-blue flex items-center gap-2 px-3.5 py-2 text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
		                  location.pathname === "/admin/leave-management"
		                    ? "ring-2 ring-sky-200"
		                    : ""
		                }`}
		              >
		                Leave
	              </Link>

              {/* 🔥 REMOVED: Individual Attendance Snapshots and Upload Roster buttons from here */}

              {isOpsMeta && (
	                <button
	                  onClick={() => navigate("/ops-meta-roster")}
	                  className="nav-pill nav-pill-amber flex items-center gap-2 px-3.5 py-2 font-medium text-sm whitespace-nowrap cursor-pointer shrink-0"
	                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ops-Meta Roster
                </button>
              )}
{/*               
              <Link to="/admin/adminDashboard" className={navLinkClass("/admin/adminDashboard")}>
                Admin
              </Link> */}
              <Link to="/admin/admintask" className={navLinkClass("/admin/admintask")}>
                Your Task
              </Link>
              <Link to="/admin/chat" className={`relative ${navLinkClass("/admin/chat")}`}>
                Chat
                {unreadChatCount > 0 && (
                  <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                )}
              </Link>
              {canManageAdmin && (
                <>
                  <Link to="/admin/assign-task" className={navLinkClass("/admin/assign-task")}>
                    Assign Task
                  </Link>
                  <Link to="/admin/tasks" className={navLinkClass("/admin/tasks")}>
                    Task Status
                  </Link>
                  <Link to="/admin/defaulter" className={navLinkClass("/admin/defaulter")}>
                    Defaulter  
                  </Link>
	                  <button
	                    onClick={handleExport}
	                    disabled={exporting}
	                    className="nav-pill nav-pill-green flex items-center gap-2 px-3.5 py-2 text-sm whitespace-nowrap shadow-sm transition-all cursor-pointer shrink-0"
	                  >
                    <FiDownload />
                    {exporting ? "Exporting..." : "Export Excel"}
                  </button>
	                  <button
	                    onClick={() => navigate("/signup")}
	                    className={`nav-pill nav-pill-blue flex items-center gap-2 px-3.5 py-2 text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
	                      isCreateUserActive
	                        ? "ring-2 ring-blue-200"
	                        : ""
	                    }`}
	                  >
	                    Create User
	                  </button>
	                </>
	              )}
              </div>
			              <div className="mt-auto shrink-0 flex items-center gap-2">
                      {user?.accountType === "superAdmin" && (
                        <div className="relative" ref={systemNotificationRef}>
	                          <button
	                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 cursor-pointer hover:bg-slate-200"
	                            onClick={() => {
                                  setShowSystemNotifications((prev) => !prev);
                                  setShowDropdown(false);
                                }}
	                            title="System Notifications"
	                          >
                            <FiBell />
                            {unreadSystemCount > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                                {unreadSystemCount > 99 ? "99+" : unreadSystemCount}
                              </span>
                            )}
                          </button>

	                          {showSystemNotifications && (
	                            <div className="absolute left-0 bottom-full mb-2 w-[min(680px,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 py-2 z-[120]">
	                              <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10">
	                                <p className="text-sm font-semibold">Notifications</p>
	                                <button
	                                  className="text-xs text-blue-600 hover:text-blue-700"
	                                  onClick={markAllSystemNotificationsRead}
	                                >
	                                  Mark all read
	                                </button>
	                              </div>
	                              {systemNotifications.length === 0 ? (
	                                <p className="px-3 py-6 text-sm text-slate-500 text-center">No notifications</p>
	                              ) : (
	                                systemNotifications.map((n) => (
	                                  <button
	                                    key={n._id}
	                                    onClick={() => !n.read && markSystemNotificationRead(n._id)}
	                                    className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-slate-50 ${
	                                      n.read ? "bg-white" : "bg-blue-50/60"
	                                    }`}
	                                  >
                                      <div className="flex items-start justify-between gap-3">
	                                      <p className="text-xs font-semibold text-slate-700 truncate">
                                          {n.title || "Notification"}
                                        </p>
	                                      <p className="text-[11px] text-slate-500 shrink-0">
	                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
	                                      </p>
                                      </div>
	                                    <p className="text-sm text-slate-800 truncate">{n.message || ""}</p>
	                                  </button>
	                                ))
	                              )}
	                            </div>
	                          )}
                        </div>
                      )}

			              <div className="relative" ref={dropdownRef}>
		                  <button
		                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200 cursor-pointer"
		                    onClick={() => {
                              setShowDropdown((prev) => !prev);
                              setShowSystemNotifications(false);
                            }}
		                  >
		                    {user?.profilePhotoUrl ? (
		                      <img
		                        src={user.profilePhotoUrl}
		                        alt={user?.username || "Profile"}
		                        className="h-full w-full rounded-full object-cover"
		                      />
		                    ) : (
		                      getInitials(user?.username)
		                    )}
		                  </button>

		                  {showDropdown && (
		                    <div className="absolute left-0 bottom-full mb-2 w-52 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 py-2 z-[120]">
		                      <button
		                        onClick={() => setShowProfilePopup(true)}
		                        className="w-full px-3 py-2 hover:bg-slate-100 text-left cursor-pointer"
	                      >
	                        My Profile
	                      </button>
	                      <button
	                        onClick={() => {
	                          navigate("/admin/manage-employee");
	                          setShowDropdown(false);
	                        }}
	                        className="w-full px-3 py-2 hover:bg-slate-100 text-left cursor-pointer"
	                      >
	                        Team
	                      </button>
	                      <button
	                        onClick={handleLogout}
	                        className="w-full px-3 py-2 hover:bg-rose-50 text-left cursor-pointer text-rose-700"
	                      >
	                        Logout
	                      </button>
	                    </div>
	                  )}
	                </div>
	              </div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-slate-700">
                <FiMenu />
              </button>
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex md:hidden">
            <div className="bg-white w-72 h-screen overflow-y-auto p-6 flex flex-col gap-4 relative text-slate-800 border-r border-slate-200 shadow-xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
	              <div className="flex justify-between items-center mb-4">
	                <h2 className="text-lg font-semibold text-slate-900">Task Management</h2>
	                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl text-slate-500 hover:text-slate-800"
                >
	                  <FiX />
	                </button>
	              </div>

                {user?.accountType === "superAdmin" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      <button
                        className="text-xs text-blue-600"
                        onClick={markAllSystemNotificationsRead}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2 max-h-36 overflow-y-auto space-y-2">
                      {systemNotifications.length === 0 ? (
                        <p className="text-xs text-slate-500">No notifications</p>
                      ) : (
                        systemNotifications.slice(0, 5).map((n) => (
                          <button
                            key={n._id}
                            onClick={() => !n.read && markSystemNotificationRead(n._id)}
                            className={`w-full text-left rounded-lg border px-2 py-1.5 ${
                              n.read ? "bg-white border-slate-200" : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <p className="text-[11px] font-semibold text-slate-700">{n.title}</p>
                            <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

	              <Link
	                to="/admin/roster"
                className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiCalendar className="text-lg text-blue-600" />
                Roster
              </Link>

              {/* 🔥 FIXED: Attendance Update Section in Mobile Menu */}
              {canAccessAttendanceUpdate && (
                <div className="flex flex-col gap-1">
                  {/* Main Attendance Update Button - Navigates to attendance update page */}
                  <button
                    onClick={() => {
                      navigate("/attendance-update");
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl text-indigo-700 font-medium hover:bg-indigo-100 transition-all w-full text-left"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Attendance Update</span>
                  </button>
                  
                  {/* Attendance Snapshots Option in Mobile */}
                  {canAccessAttendanceSnapshots && (
                    <button
                      onClick={() => {
                        navigate("/attendance-snapshot");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-3 ml-6 pl-3 py-2 text-sm text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors w-full text-left"
                    >
                      <Camera className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-medium">Attendance Snapshots</p>
                        <p className="text-xs text-slate-500">View attendance photos</p>
                      </div>
                    </button>
                  )}

                  {/* Upload Roster Option in Mobile */}
                  {canUploadExcel && (
                    <button
                      onClick={() => {
                        navigate("/upload-roster");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-3 ml-6 pl-3 py-2 text-sm text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors w-full text-left"
                    >
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div>
                        <p className="font-medium">Upload Roster (Excel)</p>
                        <p className="text-xs text-slate-500">Bulk upload roster data</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

		             {canAccessDelegation && (
		  <Link
		    to="/admin/delegations"
	    className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 px-3 py-2 rounded-xl text-cyan-700 font-medium hover:bg-cyan-100 transition-all w-full text-left"
	    onClick={() => setShowMobileMenu(false)}
	  >
    <FiUsers className="w-4 h-4" />
    Delegation
	  </Link>
	)}
	              <button
	                onClick={() => {
	                  navigate("/admin/leave-management");
	                  setShowMobileMenu(false);
	                }}
	                className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl text-sky-700 font-medium hover:bg-sky-100 transition-all w-full text-left"
	              >
	                Leave Management
	              </button>

              {/* 🔥 REMOVED: Individual Attendance Snapshots and Upload Roster buttons from mobile menu */}

              {isOpsMeta && (
                <button
                  onClick={() => {
                    navigate("/ops-meta-roster");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-amber-700 font-medium hover:bg-amber-100 transition-all w-full text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ops-Meta Roster
                </button>
              )}

              {/* <Link
                to="/admin/adminDashboard"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Dashboard
              </Link> */}
              <Link to="/admin/admintask" className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                Your Task
              </Link>

              <Link
                to="/admin/assign-task"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Assign Task
              </Link>
              <Link
                to="/admin/chat"
                className="relative text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Chat
                {unreadChatCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                )}
              </Link>
              <Link
                to="/admin/tasks"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Task Status
              </Link>

              <Link
                to="/admin/defaulter"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Defaulter
              </Link>

              {canManageAdmin && (
                <>
                  <div className="mt-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        navigate("/admin/manage-employee");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
                    >
                      <FiUsers className="text-lg text-blue-600" />
                      Team Management
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full text-sm shadow-sm transition-all w-full justify-center mt-2"
                    >
                      <FiDownload size={18} />
                      {exporting ? "Exporting..." : "Export Excel"}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setShowMobileMenu(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm transition-all w-full justify-center mt-2 border ${
                        isCreateUserActive
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                      }`}
                    >
                      <FiUserPlus size={18} />
                      Create User
                    </button>
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
                >
                  <FiUser className="text-lg text-blue-600" />
                  My Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-rose-700 hover:text-rose-800 font-semibold py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors w-full text-left mt-2"
                >
                  <FiLogOut className="text-lg" />
                  Logout
                </button>
              </div>
	              <div className="mt-auto pt-4 border-t border-slate-200">
	                <div className="flex items-center gap-3">
	                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200 overflow-hidden">
	                    {user?.profilePhotoUrl ? (
	                      <img
	                        src={user.profilePhotoUrl}
	                        alt={user?.username || "Profile"}
	                        className="h-full w-full object-cover"
	                      />
	                    ) : (
	                      getInitials(user?.username)
	                    )}
	                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                    <p className="text-xs text-slate-500">{user?.accountType}</p>
                    {user?.department && (
                      <p className="text-xs text-slate-500">{user?.department}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div 
              className="flex-1" 
              onClick={() => setShowMobileMenu(false)}
            ></div>
          </div>
        )}

        {showProfilePopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-80 relative text-slate-900 border border-slate-200">
              <button
                onClick={() => setShowProfilePopup(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-slate-800"
              >
                <FiX size={20} />
              </button>

              <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
                Update Profile
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="New Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full mt-2 cursor-pointer"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      {chatNotification && !location.pathname.startsWith("/admin/chat") && (
        <div className="fixed right-4 top-16 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-[26rem] rounded-2xl overflow-hidden border border-cyan-100 shadow-[0_14px_38px_rgba(14,116,144,0.22)] bg-gradient-to-br from-white via-cyan-50 to-blue-50">
          <button
            onClick={() => {
              const targetChatId = chatNotification.chatId;
              setChatNotification(null);
              setUnreadChatCount(0);
              document.title = defaultTitleRef.current;
              navigate("/admin/chat", {
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
      {showOutlet ? <Outlet /> : null}
    </>
  );
};

export default AdminNavbar;

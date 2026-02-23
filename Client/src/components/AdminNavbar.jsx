import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
<<<<<<< HEAD
import { Link, Outlet, useNavigate } from "react-router-dom";
=======
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
import axios from "axios";
import { logoutUser } from "../features/slices/authSlice.js";
import { exportTaskStatusExcel } from "../features/slices/taskSlice.js";
import { FiLogOut, FiMenu, FiX, FiDownload, FiUsers, FiUserPlus, FiUser, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";
<<<<<<< HEAD

// const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://crm-taskmanagement-api-7eos5.ondigitalocean.app/api/v1";
const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";


=======
import { socket } from "../socket.js";

// const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://crm-taskmanagement-api-7e5os.ondigitalocean.app/api/v1";
const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
const AdminNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
<<<<<<< HEAD
=======
  const location = useLocation();
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
<<<<<<< HEAD

  const dropdownRef = useRef();
=======
  const [chatNotification, setChatNotification] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const dropdownRef = useRef();
  const titleResetTimerRef = useRef(null);
  const defaultTitleRef = useRef(document.title);
  const processedMessageIdsRef = useRef(new Set());

  // Check if user is Ops-Meta employee
  const isOpsMeta = user?.accountType === "employee" && user?.department === "Ops - Meta";
  
  // Check if user can upload Excel (Ops-Meta employees + Admin/HR/superAdmin)
  const canUploadExcel = 
    (user?.accountType === "employee" && user?.department === "Ops - Meta") ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

<<<<<<< HEAD
=======
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

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
    navigate("/login");
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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

<<<<<<< HEAD
  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-[#EEEEEE] text-white z-50 shadow-lg">
        <div className="flex justify-between items-center p-2">
          <h1 className="text-lg font-bold text-[#155DFC]">Task Management</h1>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/admin/roster" 
              className="flex items-center gap-2 hover:underline text-[#155DFC] font-semibold"
            >
              <FiCalendar className="text-lg" />
              Roster
            </Link>
            
            <Link to="/admin/adminDashboard" className="hover:underline text-[#155DFC] font-semibold">
              Admin
            </Link>
            <Link to="/admin/admintask" className="hover:underline text-[#155DFC] font-semibold">
              Your Task
            </Link>
           
           
            <Link to="/admin/chat" className="hover:underline text-[#155DFC] font-semibold">
              Chat
            </Link>
           
           
            {["admin", "superAdmin"].includes(user?.accountType) && (
              <>
               <Link to="/admin/assign-task" className="hover:underline text-[#155DFC] font-semibold">
              Assign Task
            </Link>
               <Link to="/admin/tasks" className="hover:underline text-[#155DFC] font-semibold">
              Task Status
            </Link>
             <Link to="/admin/defaulter" className="hover:underline text-[#155DFC] font-semibold">
              Defaulter  
            </Link>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-[#00B579] hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm shadow transition-all cursor-pointer"
                >
                  <FiDownload />
                  {exporting ? "Exporting..." : "Export Excel"}
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm shadow transition-all cursor-pointer"
                >
                  Create User
                </button>
              </>
            )}

            <div className="relative ml-4" ref={dropdownRef}>
              <button
                className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white border-2 border-white cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {getInitials(user?.username)}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-white text-[#155DFC] rounded shadow-lg py-2">
                  <button
                    onClick={() => setShowProfilePopup(true)}
                    className="w-full px-2 py-2 hover:bg-gray-200 text-left cursor-pointer"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate("/admin/manage-employee");
                      setShowDropdown(false);
                    }}
                    className="w-full px-2 py-2 hover:bg-gray-200 text-left cursor-pointer"
                  >
                    Team
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-2 py-2 hover:bg-gray-200 text-left cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-[#155DFC]">
              <FiMenu />
            </button>
=======
  const isActive = (path) => location.pathname === path;
  const isCreateUserActive =
    location.pathname === "/signup" || location.pathname === "/admin/signup";
  const canManageAdmin = ["admin", "superAdmin"].includes(user?.accountType);
  const navLinkClass = (path) =>
    `rounded-full px-2.5 lg:px-3 py-1.5 transition-colors font-medium text-sm whitespace-nowrap ${
      isActive(path)
        ? "bg-blue-100 text-blue-800 border border-blue-200"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        `}</style>
        <div className="border-b border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur">
          <div className="max-w-[1400px] mx-auto px-3 lg:px-5 py-2 flex justify-between items-center gap-3">
            <h1
              className="text-base lg:text-lg font-semibold text-slate-900 cursor-pointer whitespace-nowrap"
              style={{ fontFamily: "'Playfair Display', serif" }}
              onClick={() => navigate("/admin/adminDashboard")}
            >
              Task Management
            </h1>

            <div className="hidden md:flex items-center gap-2 lg:gap-3 min-w-0" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <Link 
                to="/admin/roster" 
                className={`flex items-center gap-2 ${navLinkClass("/admin/roster")}`}
              >
                <FiCalendar className="text-lg text-blue-600" />
                Roster
              </Link>
              
              {/* Ops-Meta Roster Button - Only for Ops-Meta employees */}
              {isOpsMeta && (
                <button
                  onClick={() => navigate("/ops-meta-roster")}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-2.5 lg:px-3 py-1.5 rounded-full text-amber-700 font-medium text-sm whitespace-nowrap hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ops-Meta Roster
                </button>
              )}
              
              {canUploadExcel && (
                <button
                  onClick={() => navigate("/upload-roster")}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 lg:px-3 py-1.5 rounded-full text-emerald-700 font-medium text-sm whitespace-nowrap hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Roster (Excel)
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
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 lg:px-3 py-1.5 rounded-full text-sm whitespace-nowrap shadow-sm transition-all cursor-pointer"
                  >
                    <FiDownload />
                    {exporting ? "Exporting..." : "Export Excel"}
                  </button>

                  <button
                    onClick={() => navigate("/signup")}
                    className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all cursor-pointer border ${
                      isCreateUserActive
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    Create User
                  </button>
                </>
              )}

              <div className="relative ml-2 lg:ml-3 shrink-0" ref={dropdownRef}>
                <button
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {getInitials(user?.username)}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 py-2">
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

            <div className="md:hidden">
              <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-slate-700">
                <FiMenu />
              </button>
            </div>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
          </div>
        </div>

        {showMobileMenu && (
<<<<<<< HEAD
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex md:hidden">
            <div className="bg-[#EEEEEE] w-64 p-6 flex flex-col gap-4 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#155DFC]">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl text-[#155DFC] hover:text-blue-700"
=======
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex md:hidden">
            <div className="bg-white w-72 h-screen overflow-y-auto p-6 flex flex-col gap-4 relative text-slate-800 border-r border-slate-200 shadow-xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Task Management</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl text-slate-500 hover:text-slate-800"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                >
                  <FiX />
                </button>
              </div>

              <Link
                to="/admin/roster"
<<<<<<< HEAD
                className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiCalendar className="text-lg" />
                Roster
              </Link>

              <Link
                to="/admin/adminDashboard"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
=======
                className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiCalendar className="text-lg text-blue-600" />
                Roster
              </Link>

              {/* Mobile Ops-Meta Roster Button */}
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

              {/* Mobile Excel Upload Button */}
              {canUploadExcel && (
                <button
                  onClick={() => {
                    navigate("/upload-roster");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-700 font-medium hover:bg-emerald-100 transition-all w-full text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Roster (Excel)
                </button>
              )}

              <Link
                to="/admin/adminDashboard"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Dashboard
              </Link>
<<<<<<< HEAD
                 <Link to="/admin/admintask" className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors">
              Your Task
            </Link>

              <Link
                to="/admin/assign-task"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
=======
              <Link to="/admin/admintask" className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                Your Task
              </Link>

              <Link
                to="/admin/assign-task"
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                onClick={() => setShowMobileMenu(false)}
              >
                Assign Task
              </Link>
              <Link
                to="/admin/chat"
<<<<<<< HEAD
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Chat
              </Link>
              <Link
                to="/admin/tasks"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                onClick={() => setShowMobileMenu(false)}
              >
                Task Status
              </Link>

              <Link
                to="/admin/defaulter"
<<<<<<< HEAD
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
=======
                className="text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                onClick={() => setShowMobileMenu(false)}
              >
                Defaulter
              </Link>

<<<<<<< HEAD
              {user?.accountType === "admin" && (
                <>
                  <div className="mt-2 pt-4 border-t border-gray-300">
=======
              {canManageAdmin && (
                <>
                  <div className="mt-2 pt-4 border-t border-slate-200">
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                    <button
                      onClick={() => {
                        navigate("/admin/manage-employee");
                        setShowMobileMenu(false);
                      }}
<<<<<<< HEAD
                      className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors w-full text-left"
                    >
                      <FiUsers className="text-lg" />
=======
                      className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
                    >
                      <FiUsers className="text-lg text-blue-600" />
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                      Team Management
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={exporting}
<<<<<<< HEAD
                      className="flex items-center gap-2 bg-[#00B579] hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm shadow transition-all w-full justify-center mt-2"
=======
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full text-sm shadow-sm transition-all w-full justify-center mt-2"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                    >
                      <FiDownload size={18} />
                      {exporting ? "Exporting..." : "Export Excel"}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setShowMobileMenu(false);
                      }}
<<<<<<< HEAD
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm shadow transition-all w-full justify-center mt-2"
=======
                      className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm transition-all w-full justify-center mt-2 border ${
                        isCreateUserActive
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                      }`}
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                    >
                      <FiUserPlus size={18} />
                      Create User
                    </button>
                  </div>
                </>
              )}

<<<<<<< HEAD
              <div className="mt-4 pt-4 border-t border-gray-300">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors w-full text-left"
                >
                  <FiUser className="text-lg" />
=======
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
                >
                  <FiUser className="text-lg text-blue-600" />
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                  My Profile
                </button>
                
                <button
                  onClick={handleLogout}
<<<<<<< HEAD
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold py-2 px-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left mt-2"
=======
                  className="flex items-center gap-2 text-rose-700 hover:text-rose-800 font-semibold py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors w-full text-left mt-2"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                >
                  <FiLogOut className="text-lg" />
                  Logout
                </button>
              </div>
<<<<<<< HEAD
              
              
              <div className="mt-auto pt-4 border-t border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white">
                    {getInitials(user?.username)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                    <p className="text-xs text-gray-600">{user?.accountType}</p>
=======
              <div className="mt-auto pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-800 border border-slate-200">
                    {getInitials(user?.username)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                    <p className="text-xs text-slate-500">{user?.accountType}</p>
                    {user?.department && (
                      <p className="text-xs text-slate-500">{user?.department}</p>
                    )}
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                  </div>
                </div>
              </div>
            </div>
<<<<<<< HEAD
            
=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
            <div 
              className="flex-1" 
              onClick={() => setShowMobileMenu(false)}
            ></div>
          </div>
        )}

        {showProfilePopup && (
<<<<<<< HEAD
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative text-black">
              <button
                onClick={() => setShowProfilePopup(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
=======
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-80 relative text-slate-900 border border-slate-200">
              <button
                onClick={() => setShowProfilePopup(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-slate-800"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
              >
                <FiX size={20} />
              </button>

<<<<<<< HEAD
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
=======
              <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                Update Profile
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="New Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
<<<<<<< HEAD
                  className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
=======
                  className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
                  className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
=======
                  className="border border-slate-300 text-slate-800 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-300/50 placeholder:text-slate-400"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
<<<<<<< HEAD
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-2 cursor-pointer"
=======
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full mt-2 cursor-pointer"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
<<<<<<< HEAD
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      <Outlet />
    </>
  );
};

<<<<<<< HEAD
export default AdminNavbar;
=======
export default AdminNavbar;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { logoutUser } from "../features/slices/authSlice.js";
import { exportTaskStatusExcel } from "../features/slices/taskSlice.js";
import { FiLogOut, FiMenu, FiX, FiDownload, FiUsers, FiUserPlus, FiUser, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";

// const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://crm-taskmanagement-api-7eos5.ondigitalocean.app/api/v1";
const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";


const AdminNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const navLinkClass = (path) =>
    `rounded-full px-3 py-1.5 transition-colors font-semibold ${
      isActive(path)
        ? "bg-cyan-400 text-slate-900"
        : "text-white/80 hover:text-white"
    }`;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        `}</style>
        <div className="border-b border-white/10 bg-slate-950/80 text-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
          <div className="flex justify-between items-center p-2">
            <h1
              className="text-lg font-semibold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Task Management
            </h1>

          <div className="hidden md:flex items-center gap-4" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            <Link 
              to="/admin/roster" 
              className={`flex items-center gap-2 ${navLinkClass("/admin/roster")}`}
            >
              <FiCalendar className="text-lg text-cyan-300" />
              Roster
            </Link>
            
            <Link to="/admin/adminDashboard" className={navLinkClass("/admin/adminDashboard")}>
              Admin
            </Link>
            <Link to="/admin/admintask" className={navLinkClass("/admin/admintask")}>
              Your Task
            </Link>
            <Link to="/admin/chat" className={navLinkClass("/admin/chat")}>
              Chat
            </Link>
           
           
            {["admin", "superAdmin"].includes(user?.accountType) && (
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
                  className="flex items-center gap-2 bg-emerald-400/90 hover:bg-emerald-300 text-slate-900 px-3 py-1.5 rounded-full text-sm shadow transition-all cursor-pointer"
                >
                  <FiDownload />
                  {exporting ? "Exporting..." : "Export Excel"}
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-3 py-1.5 rounded-full text-sm shadow transition-all cursor-pointer"
                >
                  Create User
                </button>
              </>
            )}

            <div className="relative ml-4" ref={dropdownRef}>
              <button
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-semibold text-white border border-white/20 cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {getInitials(user?.username)}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10 py-2">
                  <button
                    onClick={() => setShowProfilePopup(true)}
                    className="w-full px-3 py-2 hover:bg-white/10 text-left cursor-pointer"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate("/admin/manage-employee");
                      setShowDropdown(false);
                    }}
                    className="w-full px-3 py-2 hover:bg-white/10 text-left cursor-pointer"
                  >
                    Team
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 hover:bg-white/10 text-left cursor-pointer text-rose-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-white/80">
              <FiMenu />
            </button>
          </div>
        </div>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex md:hidden">
            <div className="bg-slate-900 w-72 p-6 flex flex-col gap-4 relative text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl text-white/70 hover:text-white"
                >
                  <FiX />
                </button>
              </div>

              <Link
                to="/admin/roster"
                className="flex items-center gap-2 text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiCalendar className="text-lg text-cyan-300" />
                Roster
              </Link>

              <Link
                to="/admin/adminDashboard"
                className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Dashboard
              </Link>
                 <Link to="/admin/admintask" className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
              Your Task
            </Link>

              <Link
                to="/admin/assign-task"
                className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Assign Task
              </Link>
              <Link
                to="/admin/chat"
                className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Chat
              </Link>
              <Link
                to="/admin/tasks"
                className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Task Status
              </Link>

              <Link
                to="/admin/defaulter"
                className="text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Defaulter
              </Link>

              {user?.accountType === "admin"  && (
                <>
                  <div className="mt-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        navigate("/admin/manage-employee");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors w-full text-left"
                    >
                      <FiUsers className="text-lg text-cyan-300" />
                      Team Management
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="flex items-center gap-2 bg-emerald-400/90 hover:bg-emerald-300 text-slate-900 px-4 py-3 rounded-full text-sm shadow transition-all w-full justify-center mt-2"
                    >
                      <FiDownload size={18} />
                      {exporting ? "Exporting..." : "Export Excel"}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-4 py-3 rounded-full text-sm shadow transition-all w-full justify-center mt-2"
                    >
                      <FiUserPlus size={18} />
                      Create User
                    </button>
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2 text-white/80 font-semibold hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors w-full text-left"
                >
                  <FiUser className="text-lg text-cyan-300" />
                  My Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-rose-200 hover:text-rose-100 font-semibold py-2 px-3 rounded-xl hover:bg-white/10 transition-colors w-full text-left mt-2"
                >
                  <FiLogOut className="text-lg" />
                  Logout
                </button>
              </div>
              <div className="mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-semibold text-white border border-white/20">
                    {getInitials(user?.username)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-white/60">{user?.accountType}</p>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl w-80 relative text-white border border-white/10">
              <button
                onClick={() => setShowProfilePopup(false)}
                className="absolute top-2 right-2 text-white/60 hover:text-white"
              >
                <FiX size={20} />
              </button>

              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Update Profile
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="New Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-white/10 text-white rounded-xl px-3 py-2 bg-white/5 focus:outline-none focus:ring focus:ring-cyan-300/40 placeholder:text-white/50"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-white/10 text-white rounded-xl px-3 py-2 bg-white/5 focus:outline-none focus:ring focus:ring-cyan-300/40 placeholder:text-white/50"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 py-2 rounded-full mt-2 cursor-pointer"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <Outlet />
    </>
  );
};

export default AdminNavbar;

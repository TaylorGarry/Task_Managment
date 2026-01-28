import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
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
          </div>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex md:hidden">
            <div className="bg-[#EEEEEE] w-64 p-6 flex flex-col gap-4 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#155DFC]">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl text-[#155DFC] hover:text-blue-700"
                >
                  <FiX />
                </button>
              </div>

              <Link
                to="/admin/roster"
                className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiCalendar className="text-lg" />
                Roster
              </Link>

              <Link
                to="/admin/adminDashboard"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Dashboard
              </Link>
                 <Link to="/admin/admintask" className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors">
              Your Task
            </Link>

              <Link
                to="/admin/assign-task"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Assign Task
              </Link>
              <Link
                to="/admin/chat"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Chat
              </Link>
              <Link
                to="/admin/tasks"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Task Status
              </Link>

              <Link
                to="/admin/defaulter"
                className="text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Defaulter
              </Link>

              {user?.accountType === "admin"  && (
                <>
                  <div className="mt-2 pt-4 border-t border-gray-300">
                    <button
                      onClick={() => {
                        navigate("/admin/manage-employee");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors w-full text-left"
                    >
                      <FiUsers className="text-lg" />
                      Team Management
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="flex items-center gap-2 bg-[#00B579] hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm shadow transition-all w-full justify-center mt-2"
                    >
                      <FiDownload size={18} />
                      {exporting ? "Exporting..." : "Export Excel"}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm shadow transition-all w-full justify-center mt-2"
                    >
                      <FiUserPlus size={18} />
                      Create User
                    </button>
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-300">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2 text-[#155DFC] font-semibold hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors w-full text-left"
                >
                  <FiUser className="text-lg" />
                  My Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold py-2 px-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left mt-2"
                >
                  <FiLogOut className="text-lg" />
                  Logout
                </button>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white">
                    {getInitials(user?.username)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                    <p className="text-xs text-gray-600">{user?.accountType}</p>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative text-black">
              <button
                onClick={() => setShowProfilePopup(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              >
                <FiX size={20} />
              </button>

              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Update Profile
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="New Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-2 cursor-pointer"
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
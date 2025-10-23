import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { logoutUser } from "../features/slices/authSlice.js";
import { exportTaskStatusExcel } from "../features/slices/taskSlice.js";
import { FiLogOut, FiMenu, FiX, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";

const API_URL = "http://localhost:4000/api/v1";

const AdminNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

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
      console.error("Profile update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Export to Excel
 // inside AdminNavbar component
const handleExport = async () => {
  try {
    setExporting(true);
    // dispatch thunk and unwrap to get the blob + filename
    const result = await dispatch(exportTaskStatusExcel()).unwrap(); // { blob, filename }

    if (!result || !result.blob) {
      throw new Error("No file returned from server");
    }

    const url = window.URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename || `Task_Status_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Excel exported successfully!");
  } catch (err) {
    console.error("Export failed:", err);
    toast.error(err?.message || "Failed to export tasks!");
  } finally {
    setExporting(false);
  }
};


  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white z-50 shadow-lg">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-lg font-bold text-white">Task Management</h1>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/admin/assign-task" className="hover:underline text-white">
            Assign Task
          </Link>
          <Link to="/admin/tasks" className="hover:underline text-white">
            Task Status
          </Link>

          {/* ✅ Export Button (Only for Admins) */}
          {user?.accountType === "admin" && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm shadow transition-all"
            >
              <FiDownload />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white border-2 border-white cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {getInitials(user?.username)}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white text-black rounded shadow-lg py-2">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="w-full px-2 py-2 hover:bg-gray-200 text-left"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-2 py-2 hover:bg-gray-200 text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <button onClick={() => setShowMobileMenu(true)} className="text-2xl text-white">
            <FiMenu />
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="bg-gray-800 w-64 p-4 flex flex-col gap-4 relative text-white">
            <button
              onClick={() => setShowMobileMenu(false)}
              className="absolute top-2 right-2 text-2xl text-white"
            >
              <FiX />
            </button>
            <Link
              to="/admin/assign-task"
              className="hover:underline"
              onClick={() => setShowMobileMenu(false)}
            >
              Assign Task
            </Link>
            <Link
              to="/admin/tasks"
              className="hover:underline"
              onClick={() => setShowMobileMenu(false)}
            >
              Task Status
            </Link>

            {/* ✅ Export option on mobile */}
            {user?.accountType === "admin" && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 hover:underline mt-2"
              >
                <FiDownload size={18} />
                {exporting ? "Exporting..." : "Export Excel"}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 hover:underline text-white mt-4"
            >
              <FiLogOut size={18} className="text-white cursor-pointer" />
              Logout
            </button>
          </div>
          <div className="flex-1" onClick={() => setShowMobileMenu(false)}></div>
        </div>
      )}

      {/* Profile Popup */}
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
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-2"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;

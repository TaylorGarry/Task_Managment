import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { Menu, X, X as CloseIcon } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "http://localhost:4000/api/v1";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully!");
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
      console.error("Profile update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
   <>
  <Toaster position="top-right" />
  <div className="fixed top-0 left-0 right-0 z-50">
    <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
    <nav className="bg-white border-b border-[#EAEAEA] px-4 sm:px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1
          className="text-xl font-bold text-sky-600 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Work Queue
        </h1>

        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => navigate("/AllTasks")}
            className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all cursor-pointer"
          >
            All Days
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full hover:bg-sky-50 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-gray-800 font-medium">{user?.username}</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-[#EAEAEA] rounded-lg shadow-md z-20">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50 rounded-lg"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden flex flex-col mt-3 space-y-2 bg-white border-t border-[#EAEAEA] py-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => navigate("/AllTasks")}
            className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all"
          >
            All Days
          </button>
          <div className="border-t border-[#EAEAEA] mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50"
            >
              Logout ({user?.username})
            </button>
          </div>
        </div>
      )}
    </nav>
  </div>

  <div className="pt-[88px]"></div>

  {showProfilePopup && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative text-black">
        <button
          onClick={() => setShowProfilePopup(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          <CloseIcon size={20} />
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
</>


  );
};

export default Navbar;

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/slices/authSlice.js";
import { useNavigate, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-[#EAEAEA] px-4 sm:px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1
          className="text-xl font-bold text-sky-600 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Work Queue
        </h1>

        <div className="hidden md:flex items-center gap-6">
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
        <div className="md:hidden mt-3 space-y-2 bg-white border-t border-[#EAEAEA] py-3">
          {/* {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-sky-50"
            >
              {link.name}
            </NavLink>
          ))} */}
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
  );
};

export default Navbar;

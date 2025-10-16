import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { logoutUser } from "../features/slices/authSlice.js";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";

const AdminNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white z-50 shadow-lg">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-lg font-bold">Task Management</h1>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/admin/assign-task" className="hover:underline">
            Assign Task
          </Link>
          <Link to="/admin/tasks" className="hover:underline">
            Task Status
          </Link>
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
                  onClick={handleLogout}
                  className="w-full px-2 py-2 hover:bg-gray-200 text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="text-2xl"
          >
            <FiMenu />
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="bg-gray-800 w-64 p-4 flex flex-col gap-4 relative text-white">
            <button
              onClick={() => setShowMobileMenu(false)}
              className="absolute top-2 right-2 text-2xl"
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
            <div className="mt-4 flex items-center gap-2 cursor-pointer">
              {/* <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white">
                {getInitials(user?.username)}
              </div> */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 hover:underline text-white cursor-pointer"
              >
                <FiLogOut size={18} className="text-black cursor-pointer" />
                Logout
              </button>
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setShowMobileMenu(false)}
          ></div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;

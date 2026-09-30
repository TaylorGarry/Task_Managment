import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../features/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const Sidebar = () => {
  

  return (
    <>
      <Toaster position="top-right" />

      <div className="flex h-screen bg-[#F1F2F7] mt-20">
        {/* SIDEBAR */}
        <aside
          className={`h-full bg-[#F1F2F7] border-r border-[#C8CBD9]
          transition-all duration-300
          ${isMenuOpen ? "w-[240px]" : "w-[70px]"}`}
        >
          {/* LOGO */}
          <div className="flex items-center justify-between p-5 border-b border-[#C8CBD9]">
            {isMenuOpen && (
              <h1 className="text-2xl font-bold text-[#be1d08]">
                LOGO
              </h1>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* MENU */}
          <nav className="p-4">
            {isMenuOpen && (
              <h3 className="mx-3 mt-6 mb-2 text-xs text-[#777da3]">
                MENU
              </h3>
            )}

            <SidebarItem
              label="Dashboard"
              onClick={() => navigate("/dashboard")}
              isOpen={isMenuOpen}
            />

            <SidebarItem
              label="Today"
              onClick={() => navigate("/dashboard")}
              isOpen={isMenuOpen}
            />

            {isMenuOpen && (
              <h3 className="mx-3 mt-8 mb-2 text-xs text-[#777da3]">
                OTHERS
              </h3>
            )}

            <SidebarItem
              label="Logout"
              onClick={handleLogout}
              isOpen={isMenuOpen}
            />
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Sidebar Working 
          </h2>
        </main>
      </div>
    </>
  );
};


export default Sidebar;

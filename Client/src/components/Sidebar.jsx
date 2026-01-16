import React, { useState } from 'react';
import { FiCalendar, FiDownload, FiMenu, FiX, FiUsers, FiUser, FiLogOut, FiUserPlus, FiMessageSquare } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : name[0].toUpperCase();
  };

  const menuItems = [
    { icon: <FiCalendar />, label: 'Roster' },
    { label: 'Admin Dashboard' },
    { label: 'Your Task' },
    { label: 'Assign Task' },
    { icon: <FiMessageSquare />, label: 'Chat' },
    { label: 'Task Status' },
    { label: 'Defaulter' },
  ];

  const handleUpdateProfile = () => {
    // Static function - would need backend integration to actually update
    console.log("Profile update attempted:", { username, password });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowProfilePopup(false);
      alert("Profile updated successfully (static demo)");
    }, 1000);
  };

  const handleExport = () => {
    console.log("Exporting Excel...");
    alert("Export functionality would trigger here (static demo)");
  };

  const handleCreateUser = () => {
    alert("Create user page would open here (static demo)");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div 
        className={`bg-[#EEEEEE] transition-all duration-300 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h1 className="text-lg font-bold text-[#155DFC]">Task Management</h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#155DFC] hover:text-blue-700"
            >
              {collapsed ? <FiMenu size={24} /> : <FiX size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`flex items-center w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              {item.icon && <span className="text-[#155DFC]">{item.icon}</span>}
              {!collapsed && (
                <span className={`ml-2 text-[#155DFC] font-semibold ${!item.icon ? 'ml-0' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          ))}

          {/* Admin Only Section */}
          {user?.accountType && ["admin", "superAdmin"].includes(user.accountType) && (
            <>
              <div className="mt-4 pt-4 border-t border-gray-300">
                {!collapsed && (
                  <p className="px-4 text-sm text-gray-600 mb-2">Admin Tools</p>
                )}
                
                <button
                  onClick={handleExport}
                  className={`flex items-center w-full px-4 py-3 text-white bg-[#00B579] hover:bg-green-700 transition-colors ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiDownload />
                  {!collapsed && <span className="ml-2">Export Excel</span>}
                </button>

                <button
                  onClick={handleCreateUser}
                  className={`flex items-center w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 transition-colors mt-2 ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiUserPlus />
                  {!collapsed && <span className="ml-2">Create User</span>}
                </button>

                <button
                  onClick={() => console.log("Navigate to team management")}
                  className={`flex items-center w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 transition-colors mt-2 ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiUsers className="text-[#155DFC]" />
                  {!collapsed && <span className="ml-2 text-[#155DFC] font-semibold">Team</span>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-300 p-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
            <button
              onClick={() => setShowProfilePopup(true)}
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white cursor-pointer"
            >
              {getInitials(user?.username)}
            </button>
            
            {!collapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-600">{user?.accountType}</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowProfilePopup(true)}
                className="flex items-center w-full text-left text-[#155DFC] font-semibold hover:text-blue-700"
              >
                <FiUser className="mr-2" />
                My Profile
              </button>
              <button
                onClick={() => console.log("Logout clicked")}
                className="flex items-center w-full text-left text-red-600 hover:text-red-700 font-semibold"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area (Static) */}
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Task Management</h1>
        <p className="text-gray-600 mb-8">
          This is a static sidebar demo. Click on sidebar items to see console logs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Roster</h2>
            <p className="text-gray-600">Manage schedules and work assignments</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Task Status</h2>
            <p className="text-gray-600">Monitor progress of all tasks</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Chat</h2>
            <p className="text-gray-600">Communicate with your team members</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Defaulter</h2>
            <p className="text-gray-600">Track overdue tasks and assignments</p>
          </div>
        </div>
      </div>

      {/* Profile Popup Modal */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative">
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
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
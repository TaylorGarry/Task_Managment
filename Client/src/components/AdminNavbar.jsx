import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminNavbar = () => {
  const { user } = useSelector((state) => state.auth);

  // Function to get initials if no image
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white p-2 flex justify-between items-center z-50 shadow-lg">
      <h1 className="text-lg font-bold">Task Management</h1>
      
      <div className="flex items-center gap-4">
        <Link to="/admin/assign-task" className="hover:underline">
          Assign Task
        </Link>
        <Link to="/admin/tasks" className="hover:underline">
          Task Status
        </Link>
        <select className="bg-gray-700 p-1 rounded">
          <option>Filter by Organization</option>
        </select>

        {/* User profile */}
        <div className="ml-4 flex items-center">
          {user?.image ? (
            <img
              src={user.image}
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white border-2 border-white">
              {getInitials(user?.username)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { logoutUser } from "../features/slices/authSlice.js";
// import { useNavigate } from "react-router-dom";
// import { Menu, X, X as CloseIcon } from "lucide-react";
// import axios from "axios";
// import toast, { Toaster } from "react-hot-toast";

// const API_URL = "http://localhost:4000/api/v1";

// const Navbar = () => {
//   const { user } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [showProfilePopup, setShowProfilePopup] = useState(false);
//   const [username, setUsername] = useState(user?.username || "");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogout = async () => {
//     await dispatch(logoutUser());
//     toast.success("Logged out successfully!");
//     navigate("/login");
//   };

//   // ADD THIS LINE: Check if user is Ops-Meta employee
//   const allowedRosterDepartments = ["Ops - Meta", "Marketing", "CS"];

//   return (
//    <>
//   <Toaster position="top-right" />
//   <div className="fixed top-0 left-0 right-0 z-50">
//     <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
//     <nav className="bg-white border-b border-[#EAEAEA] px-4 sm:px-6 py-3 shadow-sm">
//       <div className="max-w-7xl mx-auto flex items-center justify-between">
//         <h1
//           className="text-xl font-bold text-sky-600 cursor-pointer"
//           onClick={() => navigate("/dashboard")}
//         >
//           Work Queue
//         </h1>

//         <div className="hidden md:flex items-center gap-6">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all cursor-pointer"
//           >
//             Today
//           </button>
          
//           {/* Ops-Meta Roster Button - Only for Ops-Meta employees */}
//           {isAllowedRosterDepartmentEmployee && (
//             <button
//               onClick={() => navigate("/ops-meta-roster")}
//               className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 font-medium hover:bg-amber-100 transition-all cursor-pointer"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               Ops-Meta Roster
//             </button>
//           )}
         

//           <div className="relative">
//             <button
//               onClick={() => setShowProfileMenu((prev) => !prev)}
//               className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full hover:bg-sky-50 transition-all cursor-pointer"
//             >
//               <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
//                 {user?.username?.charAt(0)?.toUpperCase() || "U"}
//               </div>
//               <span className="text-gray-800 font-medium">{user?.username}</span>
//               <svg
//                 className={`w-4 h-4 transform transition-transform ${
//                   showProfileMenu ? "rotate-180" : ""
//                 }`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M19 9l-7 7-7-7"
//                 />
//               </svg>
//             </button>

//             {showProfileMenu && (
//               <div className="absolute right-0 mt-2 w-40 bg-white border border-[#EAEAEA] rounded-lg shadow-md z-20">
//                 <button
//                   onClick={handleLogout}
//                   className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50 rounded-lg"
//                 >
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <button
//           className="md:hidden text-gray-700"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//         >
//           {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//         </button>
//       </div>

//       {isMenuOpen && (
//         <div className="md:hidden flex flex-col mt-3 space-y-2 bg-white border-t border-[#EAEAEA] py-3">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all"
//           >
//             Today
//           </button>
//           <div className="border-t border-[#EAEAEA] mt-2 pt-2">
//             <button
//               onClick={handleLogout}
//               className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50"
//             >
//               Logout ({user?.username})
//             </button>
//           </div>
//         </div>
//       )}
//     </nav>
//   </div>

//   <div className="pt-[88px]"></div>

//   {showProfilePopup && (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
//       <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative text-black">
//         <button
//           onClick={() => setShowProfilePopup(false)}
//           className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
//         >
//           <CloseIcon size={20} />
//         </button>

//         <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
//           Update Profile
//         </h2>

//         <div className="flex flex-col gap-3">
//           <input
//             type="text"
//             placeholder="New Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
//           />
//           <input
//             type="password"
//             placeholder="New Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
//           />
//           <button
//             onClick={handleUpdateProfile}
//             disabled={loading}
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-2"
//           >
//             {loading ? "Updating..." : "Update"}
//           </button>
//         </div>
//       </div>
//     </div>
//   )}
// </>


//   );
// };

// export default Navbar;





// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { logoutUser } from "../features/slices/authSlice.js";
// import { useNavigate } from "react-router-dom";
// import { Menu, X, X as CloseIcon } from "lucide-react";
// import axios from "axios";
// import toast, { Toaster } from "react-hot-toast";

// // const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

// const Navbar = () => {
//   const { user } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [showProfilePopup, setShowProfilePopup] = useState(false);
//   const [username, setUsername] = useState(user?.username || "");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogout = async () => {
//     await dispatch(logoutUser());
//     toast.success("Logged out successfully!");
//     navigate("/login");
//   };

//   // Check if user is Ops-Meta employee
//   const allowedRosterDepartments = ["Ops - Meta", "Marketing", "CS"];
  // const isAllowedRosterDepartmentEmployee = user?.accountType === "employee" && allowedRosterDepartments.includes(user?.department);
  
//   // Check if user can upload Excel (Ops-Meta employees + Admin/HR/superAdmin)
//   const canUploadExcel = 
//     (user?.accountType === "employee" && allowedRosterDepartments.includes(user?.department)) ||
//     ["admin", "superAdmin", "HR"].includes(user?.accountType);

//   return (
//    <>
//   <Toaster position="top-right" />
//   <div className="fixed top-0 left-0 right-0 z-50">
//     <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
//     <nav className="bg-white border-b border-[#EAEAEA] px-4 sm:px-6 py-3 shadow-sm">
//       <div className="max-w-7xl mx-auto flex items-center justify-between">
//         <h1
//           className="text-xl font-bold text-sky-600 cursor-pointer"
//           onClick={() => navigate("/dashboard")}
//         >
//           Work Queue
//         </h1>

//         <div className="hidden md:flex items-center gap-6">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all cursor-pointer"
//           >
//             Today
//           </button>
          
//           {/* Excel Upload Button - For Ops-Meta + Admin/HR/superAdmin */}
//           {canUploadExcel && (
//             <button
//               onClick={() => navigate("/upload-roster")}
//               className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-700 font-medium hover:bg-emerald-100 transition-all cursor-pointer"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//               </svg>
//               Upload Roster (Excel)
//             </button>
//           )}
          
//           {/* Ops-Meta Roster Button - Only for Ops-Meta employees */}
//           {isAllowedRosterDepartmentEmployee && (
//             <button
//               onClick={() => navigate("/ops-meta-roster")}
//               className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 font-medium hover:bg-amber-100 transition-all cursor-pointer"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               Ops-Meta Roster
//             </button>
//           )}
         

//           <div className="relative">
//             <button
//               onClick={() => setShowProfileMenu((prev) => !prev)}
//               className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full hover:bg-sky-50 transition-all cursor-pointer"
//             >
//               <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
//                 {user?.username?.charAt(0)?.toUpperCase() || "U"}
//               </div>
//               <span className="text-gray-800 font-medium">{user?.username}</span>
//               <svg
//                 className={`w-4 h-4 transform transition-transform ${
//                   showProfileMenu ? "rotate-180" : ""
//                 }`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M19 9l-7 7-7-7"
//                 />
//               </svg>
//             </button>

//             {showProfileMenu && (
//               <div className="absolute right-0 mt-2 w-40 bg-white border border-[#EAEAEA] rounded-lg shadow-md z-20">
//                 <button
//                   onClick={handleLogout}
//                   className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50 rounded-lg"
//                 >
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <button
//           className="md:hidden text-gray-700"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//         >
//           {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//         </button>
//       </div>

//       {isMenuOpen && (
//         <div className="md:hidden flex flex-col mt-3 space-y-2 bg-white border-t border-[#EAEAEA] py-3">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all"
//           >
//             Today
//           </button>
          
//           {/* Mobile Excel Upload Button */}
//           {canUploadExcel && (
//             <button
//               onClick={() => navigate("/upload-roster")}
//               className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-700 font-medium hover:bg-emerald-100 transition-all"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//               </svg>
//               Upload Roster (Excel)
//             </button>
//           )}
          
//           {/* Mobile Ops-Meta Roster Button */}
//           {isAllowedRosterDepartmentEmployee && (
//             <button
//               onClick={() => navigate("/ops-meta-roster")}
//               className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 font-medium hover:bg-amber-100 transition-all"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               Ops-Meta Roster
//             </button>
//           )}
          
//           <div className="border-t border-[#EAEAEA] mt-2 pt-2">
//             <button
//               onClick={handleLogout}
//               className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50"
//             >
//               Logout ({user?.username})
//             </button>
//           </div>
//         </div>
//       )}
//     </nav>
//   </div>

//   <div className="pt-[88px]"></div>

//   {showProfilePopup && (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
//       <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative text-black">
//         <button
//           onClick={() => setShowProfilePopup(false)}
//           className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
//         >
//           <CloseIcon size={20} />
//         </button>

//         <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
//           Update Profile
//         </h2>

//         <div className="flex flex-col gap-3">
//           <input
//             type="text"
//             placeholder="New Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
//           />
//           <input
//             type="password"
//             placeholder="New Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="border border-gray-300 text-black rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
//           />
//           <button
//             onClick={handleUpdateProfile}
//             disabled={loading}
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-2"
//           >
//             {loading ? "Updating..." : "Update"}
//           </button>
//         </div>
//       </div>
//     </div>
//   )}
// </>
//   );
// };

// export default Navbar;





import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { Menu, X, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  // Check if user is Ops-Meta employee
  const allowedRosterDepartments = ["Ops - Meta", "Marketing", "CS"];
  const isAllowedRosterDepartmentEmployee =
    user?.accountType === "employee" &&
    allowedRosterDepartments.includes(user?.department);
  
  // Check if user can upload Excel (Ops-Meta employees + Admin/HR/superAdmin)
  const canUploadExcel = 
    (user?.accountType === "employee" && allowedRosterDepartments.includes(user?.department)) ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);
  
  // Check if user is employee (for showing Defaulter link)
  const isEmployee = user?.accountType === "employee";

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
          
          {isEmployee && (
            <button
              onClick={() => navigate("/my-defaults")}
              className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-all cursor-pointer shadow-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">My Defaulters</span>
            </button>
          )}
          
          {/* Excel Upload Button - For Ops-Meta + Admin/HR/superAdmin */}
          {canUploadExcel && (
            <button
              onClick={() => navigate("/upload-roster")}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-700 font-medium hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Roster (Excel)
            </button>
          )}
          
          {/* Ops-Meta Roster Button - Only for Ops-Meta employees */}
          {isAllowedRosterDepartmentEmployee && (
            <button
              onClick={() => navigate("/ops-meta-roster")}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 font-medium hover:bg-amber-100 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ops-Meta Roster
            </button>
          )}
         

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
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EAEAEA] rounded-lg shadow-md z-20 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col mt-3 space-y-2 bg-white border-t border-[#EAEAEA] py-3">
          <button
            onClick={() => {
              navigate("/dashboard");
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 bg-gray-50 border border-[#EAEAEA] px-3 py-1.5 rounded-full text-gray-800 font-medium hover:bg-sky-50 transition-all mx-3"
          >
            Today
          </button>
          
          {/* Mobile Defaulter Link - Only for employees */}
          {isEmployee && (
            <button
              onClick={() => {
                navigate("/my-defaults");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 mx-3 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-all"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">My Defaulters</span>
            </button>
          )}
          
          {/* Mobile Excel Upload Button */}
          {canUploadExcel && (
            <button
              onClick={() => {
                navigate("/upload-roster");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-700 font-medium hover:bg-emerald-100 transition-all mx-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Roster (Excel)
            </button>
          )}
          
          {/* Mobile Ops-Meta Roster Button */}
          {isAllowedRosterDepartmentEmployee && (
            <button
              onClick={() => {
                navigate("/ops-meta-roster");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 font-medium hover:bg-amber-100 transition-all mx-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ops-Meta Roster
            </button>
          )}
          
          <div className="border-t border-[#EAEAEA] mt-2 pt-2 px-3 space-y-2">
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg font-medium"
            >
              Logout ({user?.username})
            </button>
          </div>
        </div>
      )}
    </nav>
  </div>

  <div className="pt-[88px]"></div>
</>
  );
};

export default Navbar;

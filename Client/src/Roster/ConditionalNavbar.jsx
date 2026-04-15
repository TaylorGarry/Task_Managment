import React from "react";
import { useSelector } from "react-redux";
import Navbar from "../pages/Navbar.jsx"
import AdminNavbar from "../components/AdminNavbar.jsx";
import { canManageAdminPanels } from "../utils/roleAccess.js";

const ConditionalNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  
  const isAdminUser = canManageAdminPanels(user);
  
  if (!isAdminUser) {
    return <Navbar />;
  }
  
  return <AdminNavbar />;
};

export default ConditionalNavbar;

import React from "react";
import { useSelector } from "react-redux";
import Navbar from "../pages/Navbar.jsx"
import AdminNavbar from "../components/AdminNavbar.jsx";

const ConditionalNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  
  const isAdminUser = ["admin", "superAdmin", "HR", "Operations", "AM"].includes(user?.accountType);
  
  const isOpsMeta = user?.accountType === "employee" && user?.department === "Ops - Meta";
  
  if (!isAdminUser) {
    return <Navbar />;
  }
  
  return <AdminNavbar />;
};

export default ConditionalNavbar;
import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom"; // Add this import
import ArrivalAttendanceUpdate from "../components/ArrivalAttendanceUpdate";

const ArrivalAttendancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { rosterId } = useParams(); // Get rosterId from URL params

  const allowedDepartments = ["Ops - Meta", "Transport"];

  const isAllowed =
    user?.accountType === "employee" &&
    allowedDepartments.includes(user?.department);

  if (!isAllowed) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        You are not authorized to access this page.
      </div>
    );
  }

  // If no rosterId is provided, show a message
  if (!rosterId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Arrival & Attendance Update</h2>
        <p className="text-gray-600">Please select a roster from the list.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Arrival & Attendance Update
      </h2>
      <ArrivalAttendanceUpdate rosterId={rosterId} />
    </div>
  );
};

export default ArrivalAttendancePage;
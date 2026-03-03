import React from "react";
import { useSelector } from "react-redux";
import ArrivalAttendanceUpdate from "../components/ArrivalAttendanceUpdate";

const ArrivalAttendancePage = () => {
  const { user } = useSelector((state) => state.auth);

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

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Arrival & Attendance Update
      </h2>

      <ArrivalAttendanceUpdate
        rosterId="YOUR_ROSTER_ID"
        weekNumber={1}
        employee={{ _id: "EMPLOYEE_ID", username: "Employee Name" }}
        date={new Date().toISOString()}
      />
    </div>
  );
};

export default ArrivalAttendancePage;
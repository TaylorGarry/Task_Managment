import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDefaulters } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx";

const Defaulter = () => {
  const dispatch = useDispatch();
  const { defaulters, loading } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.auth);
  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    department: "",
    shift: "",
    employee: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeDefaults, setEmployeeDefaults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchDefaulters(filters));
    dispatch(fetchEmployees());
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if ((name === "startDate" || name === "endDate") && value > today) return;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };

  const handleViewAll = async (employeeId, employeeName) => {
    try {
      setModalLoading(true);
      setModalOpen(true);

      const token = localStorage.getItem("token");
      const res = await fetch(
        ` http://localhost:4000/api/v1/tasks/employee-defaulters/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // const res = await fetch(
      //   ` https://task-managment-7.onrender.com/api/v1/tasks/employee-defaulters/${employeeId}`,
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   }
      // );
      // const res = await fetch(
      //   ` https://fdbs-server-a9gqg.ondigitalocean.app/v1/tasks/employee-defaulters/${employeeId}`,
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   }
      // );
      const data = await res.json();
      if (data.success) {
        setSelectedEmployee(data.employeeName);
        setEmployeeDefaults(data.data || []);
      } else {
        setSelectedEmployee(employeeName);
        setEmployeeDefaults([]);
      }
    } catch (error) {
      console.error("Error fetching employee defaults:", error);
      setSelectedEmployee(employeeName);
      setEmployeeDefaults([]);
    } finally {
      setModalLoading(false);
    }
  };


  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

  const grandTotals = defaulters?.reduce(
    (acc, d) => ({
      notDoneToday: acc.notDoneToday + (d.notDoneTasksToday || 0),
      totalTillDate: acc.totalTillDate + (d.totalDefaultsTillDate || 0),
    }),
    { notDoneToday: 0, totalTillDate: 0 }
  );

  return (
    <>
      <AdminNavbar />
      <div className="p-6 mt-16 relative min-h-[70vh] bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6 text-gray-800">Defaulter Report</h2>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} max={today} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]" />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} max={today} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]" />
          <select name="department" value={filters.department} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select name="shift" value={filters.shift} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Shifts</option>
            <option value="Start">Start</option>
            <option value="Mid">Mid</option>
            <option value="End">End</option>
          </select>
          <select name="employee" value={filters.employee} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Employees</option>
            {filteredEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.username}
              </option>
            ))}
          </select>
        </div>

        {!loading && (
          <>
            {defaulters?.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border p-3 text-left">Date</th>
                      <th className="border p-3 text-left">Employee Name</th>
                      <th className="border p-3 text-center">Default Day</th>
                      <th className="border p-3 text-center">Total Defaults Till Today</th>
                      <th className="border p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaulters.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="border p-3">{d.date ? new Date(d.date).toLocaleDateString("en-GB") : "—"}</td>
                        <td className="border p-3 font-semibold text-gray-800">{d.employeeName || "—"}</td>
                        <td className="border p-3 text-center text-red-600 font-medium">{d.notDoneTasksToday ?? "—"}</td>
                        <td className="border p-3 text-center">{d.totalDefaultsTillDate ?? "—"}</td>
                        <td className="border p-3 text-center">
                          <button
                            onClick={() => handleViewAll(d.employeeId, d.employeeName)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                          >
                            View All
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border p-3 text-center" colSpan={2}>Total</td>
                      <td className="border p-3 text-center text-red-600">{grandTotals.notDoneToday}</td>
                      <td className="border p-3 text-center">—</td>
                      <td className="border p-3 text-center">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <h1 className="text-center text-gray-500 mt-10 text-2xl font-semibold">No defaulters found</h1>
            )}
          </>
        )}


        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] sm:w-[70%] max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedEmployee} - All Defaults
                </h3>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (employeeDefaults.length === 0)
                        return alert("No data to export");

                      const XLSX = await import("xlsx-js-style");

                      const groupedByMonth = employeeDefaults.reduce((acc, item) => {
                        const date = new Date(item.date);
                        const monthYear = date.toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        });

                        if (!acc[monthYear]) acc[monthYear] = [];
                        acc[monthYear].push(item);
                        return acc;
                      }, {});

                      const wb = XLSX.utils.book_new();

                      Object.entries(groupedByMonth).forEach(([month, records]) => {
                        const formattedData = records.map((d, i) => ({
                          "S.No": i + 1,
                          "Date": new Date(d.date).toLocaleDateString("en-GB"),
                          "Task": d.title,
                          "Department": d.department,
                          "Shift": d.shift,
                          "Priority": d.priority,
                        }));

                        const ws = XLSX.utils.json_to_sheet(formattedData);

                        const headerStyle = {
                          font: { bold: true, color: { rgb: "FFFFFF" } },
                          fill: { fgColor: { rgb: "4F81BD" } },
                          alignment: { horizontal: "center", vertical: "center" },
                          border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } },
                          },
                        };
                        const cellStyle = {
                          alignment: { horizontal: "left", vertical: "center" },
                          border: {
                            top: { style: "thin", color: { rgb: "DDDDDD" } },
                            bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                            left: { style: "thin", color: { rgb: "DDDDDD" } },
                            right: { style: "thin", color: { rgb: "DDDDDD" } },
                          },
                        };

                        const range = XLSX.utils.decode_range(ws["!ref"]);
                        for (let R = range.s.r; R <= range.e.r; R++) {
                          for (let C = range.s.c; C <= range.e.c; C++) {
                            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                            if (!ws[cellRef]) continue;
                            ws[cellRef].s = R === 0 ? headerStyle : cellStyle;
                          }
                        }

                        ws["!cols"] = [
                          { wch: 6 },
                          { wch: 12 },
                          { wch: 40 },
                          { wch: 20 },
                          { wch: 10 },
                          { wch: 12 },
                        ];

                        XLSX.utils.book_append_sheet(wb, ws, month);
                      });

                      XLSX.writeFile(wb, `${selectedEmployee}_Defaults_ByMonth.xlsx`);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-500 hover:text-gray-800 text-xl font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {modalLoading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : employeeDefaults.length > 0 ? (
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Task</th>
                      <th className="border p-2 text-left">Department</th>
                      <th className="border p-2 text-left">Shift</th>
                      <th className="border p-2 text-left">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeDefaults.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border p-2">{new Date(d.date).toLocaleDateString("en-GB")}</td>
                        <td className="border p-2">{d.title}</td>
                        <td className="border p-2">{d.department}</td>
                        <td className="border p-2">{d.shift}</td>
                        <td className="border p-2">{d.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500">No defaults found!!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Defaulter;
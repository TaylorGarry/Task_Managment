import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Eye, Trash2, X } from "lucide-react";
import api from "../../api.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import { DEPARTMENT_OPTIONS, getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const emptyForm = {
  title: "",
  description: "",
  department: "",
  assignmentScope: "department",
  assignedTo: [],
};

const KraManagement = () => {
  const dispatch = useDispatch();
  const { user, employees = [] } = useSelector((state) => state.auth);
  const roleType = getRoleType(user || {});
  const isSuperAdmin = roleType === "superAdmin";

  const [kras, setKras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(
    isSuperAdmin ? "" : normalizeDepartment(user?.department)
  );
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingKra, setViewingKra] = useState(null);  
  const [form, setForm] = useState(emptyForm);

  const loadKras = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (departmentFilter) params.department = departmentFilter;

      const res = await api.get("/api/v1/kras", { params });
      setKras(Array.isArray(res.data?.kras) ? res.data.kras : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load KRA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFilter]);

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchEmployees({ force: true }));
    }
  }, [dispatch, isSuperAdmin]);

  const availableDepartments = useMemo(() => {
    if (!isSuperAdmin) {
      const normalized = normalizeDepartment(user?.department);
      return normalized ? [normalized] : [];
    }
    return DEPARTMENT_OPTIONS;
  }, [isSuperAdmin, user?.department]);

  const filteredEmployees = useMemo(() => {
    if (!isSuperAdmin) return [];
    const selectedDepartment = normalizeDepartment(form.department);
    return (Array.isArray(employees) ? employees : [])
      .filter((employee) => employee?.accountType !== "superAdmin")
      .filter((employee) => {
        if (!selectedDepartment) return true;
        return normalizeDepartment(employee?.department) === selectedDepartment;
      })
      .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
  }, [employees, form.department, isSuperAdmin]);

  const filteredKras = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (Array.isArray(kras) ? kras : []).filter((kra) => {
      if (!text) return true;
      const haystack = [
        kra.title,
        kra.description,
        kra.department,
        kra.assignmentScope,
        ...(Array.isArray(kra.assignedTo)
          ? kra.assignedTo.map((user) => user?.username || "")
          : []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(text);
    });
  }, [kras, query]);

  const formatDescriptionSegments = (description = "") => {
    const raw = String(description || "").trim();
    if (!raw) return [];

    const normalized = raw.replace(/\r\n/g, "\n");
    const byNewLine = normalized
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);

    if (byNewLine.length > 1) return byNewLine;

    const numberedParts = normalized
      .split(/(?=\d+\s*\.)/)
      .map((part) => part.trim())
      .filter(Boolean);

    return numberedParts.length > 1 ? numberedParts : [raw];
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      department: isSuperAdmin ? (availableDepartments[0] || "") : normalizeDepartment(user?.department),
    });
    setShowModal(true);
  };

  const openEditModal = (kra) => {
    setEditingId(kra._id);
    setForm({
      title: kra.title || "",
      description: kra.description || "",
      department: normalizeDepartment(kra.department || ""),
      assignmentScope: kra.assignmentScope === "users" ? "users" : "department",
      assignedTo: Array.isArray(kra.assignedTo)
        ? kra.assignedTo.map((user) => String(user?._id || user)).filter(Boolean)
        : [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openViewModal = (kra) => {
    setViewingKra(kra);
  };

  const closeViewModal = () => {
    setViewingKra(null);
  };

  const handleDeleteKra = async (kra) => {
    if (!kra?._id) return;
    const confirmed = window.confirm(`Delete KRA "${kra.title || "Untitled"}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/v1/kras/${kra._id}`);
      toast.success("KRA deleted successfully");
      await loadKras();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete KRA");
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "department") {
        const nextDepartment = normalizeDepartment(value);
        next.assignedTo = prev.assignedTo.filter((id) => {
          const employee = employees.find((item) => String(item._id) === String(id));
          return normalizeDepartment(employee?.department) === nextDepartment;
        });
        if (!nextDepartment) {
          next.assignmentScope = "department";
        }
      }
      return next;
    });
  };

  const toggleAssignee = (employeeId) => {
    setForm((prev) => {
      const current = new Set(prev.assignedTo.map(String));
      if (current.has(String(employeeId))) current.delete(String(employeeId));
      else current.add(String(employeeId));
      return { ...prev, assignedTo: Array.from(current) };
    });
  };

  const handleSave = async () => {
    const title = String(form.title || "").trim();
    const department = normalizeDepartment(form.department || "");
    const description = String(form.description || "").trim();
    const assignedTo = form.assignmentScope === "users" ? form.assignedTo : [];

    if (!title || !department) {
      toast.error("Title and department are required");
      return;
    }

    if (form.assignmentScope === "users" && assignedTo.length === 0) {
      toast.error("Please select at least one employee for user-wise KRA");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        description,
        department,
        assignedTo,
      };

      if (editingId) {
        await api.put(`/api/v1/kras/${editingId}`, payload);
        toast.success("KRA updated successfully");
      } else {
        await api.post("/api/v1/kras", payload);
        toast.success("KRA created successfully");
      }

      await loadKras();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save KRA");
    } finally {
      setSaving(false);
    }
  };

  const departmentWiseCount = filteredKras.filter((kra) => kra.assignmentScope === "department").length;
  const userWiseCount = filteredKras.filter((kra) => kra.assignmentScope === "users").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_10%_10%,rgba(59,130,246,0.14),rgba(248,250,252,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_90%_0%,rgba(14,165,233,0.12),rgba(248,250,252,0))]" />

      <div className="relative mx-auto max-w-7xl">
        {isSuperAdmin ? (
          <div className="mb-6 flex flex-col gap-4 rounded-[30px] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_50px_-34px_rgba(37,99,235,0.35)] backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Performance Center</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">KRA Management</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700">
                {filteredKras.length} visible
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                {departmentWiseCount} department-wide
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                {userWiseCount} user-wise
              </div>
              <button
                onClick={openCreateModal}
                className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700"
              >
                Create KRA
              </button>
            </div>
          </div>
        ) : null}

        {isSuperAdmin ? (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search KRA, department, employee..."
              className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">All Departments</option>
              {availableDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <button
              onClick={loadKras}
              className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Refresh
            </button>
          </div>
        ) : null}

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-sky-100 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading KRA...
          </div>
        ) : filteredKras.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-sky-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            No KRA found for the current filter.
          </div>
        ) : isSuperAdmin ? (
          <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_20px_50px_-40px_rgba(37,99,235,0.35)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sky-100">
                <thead className="bg-gradient-to-r from-sky-50 to-white">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Title
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Description
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Department
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Assignments
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Visible To
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50 bg-white">
                  {filteredKras.map((kra) => {
                    const assignedUsers = Array.isArray(kra.assignedTo) ? kra.assignedTo : [];
                    const visibleNames = assignedUsers.slice(0, 4).map((user) => user?.username || "User");

                    return (
                      <tr key={kra._id} className="align-top transition hover:bg-sky-50/60">
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{kra.title}</span>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {kra.assignmentScope === "users" ? "User-wise" : "Department-wide"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm leading-6 text-slate-600">
                          <span
                            className="block max-w-[420px] overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {kra.description || "No description provided."}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-sky-900">
                          {kra.department}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {assignedUsers.length > 0 ? `${assignedUsers.length} user(s)` : "All users in department"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {assignedUsers.length > 0 ? (
                              visibleNames.map((name) => (
                                <span
                                  key={name}
                                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                All users in {kra.department}
                              </span>
                            )}
                            {assignedUsers.length > 4 && (
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                +{assignedUsers.length - 4} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(kra)}
                              className="inline-flex items-center justify-center rounded-2xl border border-sky-100 bg-white p-2 text-sky-700 transition hover:bg-sky-50"
                              aria-label="View KRA"
                              title="View KRA"
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(kra)}
                              className="rounded-2xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteKra(kra)}
                              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                              title="Delete KRA"
                              aria-label="Delete KRA"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredKras.map((kra) => (
              <article
                key={kra._id}
                className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(37,99,235,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Title</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{kra.title}</h2>
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-500">Description</p>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      {(formatDescriptionSegments(kra.description).length > 0
                        ? formatDescriptionSegments(kra.description)
                        : ["No description provided."]
                      ).map((segment, index) => (
                        <p key={`${index}-${segment}`} className={index === 0 ? "" : "mt-2"}>
                          {segment}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_100px_-35px_rgba(37,99,235,0.55)]">
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-sky-100 via-blue-100 to-sky-200 px-6 py-6 text-slate-900">
              <div className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-300/25 blur-2xl" />
              <p className="text-[11px] uppercase tracking-[0.45em] text-sky-600">
                {editingId ? "Edit KRA" : "Create KRA"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {editingId ? "Update KRA" : "New KRA"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Set the scope, assign users and define the performance goal.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-sky-50/40 p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 shadow-sm">
                  KRA Builder
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
                  disabled={saving}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)]">
                  <input
                    value={form.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="KRA title"
                    className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    placeholder="KRA description"
                    rows={6}
                    className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                  <select
                    value={form.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                    className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Select department</option>
                    {availableDepartments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>

                  <div className="rounded-[26px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-sky-500">Assignment Mode</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleFormChange("assignmentScope", "department")}
                        className={`rounded-[18px] border px-4 py-4 text-left text-sm font-semibold transition ${
                          form.assignmentScope === "department"
                            ? "border-sky-600 bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-200"
                            : "border-sky-100 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                        }`}
                      >
                        Department wide
                        <span className="block text-xs font-normal opacity-80">
                          Visible to all users in the selected department
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormChange("assignmentScope", "users")}
                        className={`rounded-[18px] border px-4 py-4 text-left text-sm font-semibold transition ${
                          form.assignmentScope === "users"
                            ? "border-blue-600 bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-200"
                            : "border-sky-100 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                        }`}
                      >
                        Specific employees
                        <span className="block text-xs font-normal opacity-80">
                          Assign only to selected users
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.3)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-sky-900">Employees</p>
                    <span className="text-xs text-slate-500">
                      {form.assignmentScope === "users" ? `${form.assignedTo.length} selected` : "Not required"}
                    </span>
                  </div>

                  {form.assignmentScope === "department" ? (
                    <div className="mt-4 rounded-[22px] border border-dashed border-sky-200 bg-sky-50/70 p-4 text-sm leading-6 text-slate-600">
                      Department-wide mode is active. All users in <span className="font-semibold text-sky-900">{form.department || "selected department"}</span> can see this KRA.
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="mt-4 rounded-[22px] border border-dashed border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-500">
                      No employees found for the selected department.
                    </div>
                  ) : (
                    <div className="mt-4 max-h-[44vh] space-y-2 overflow-y-auto pr-1">
                      {filteredEmployees.map((employee) => {
                        const checked = form.assignedTo.includes(String(employee._id));
                        return (
                          <label
                            key={employee._id}
                            className={`flex cursor-pointer items-center justify-between rounded-[18px] border px-4 py-3 transition ${
                              checked
                                ? "border-sky-300 bg-sky-50 shadow-sm"
                                : "border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{employee.username}</p>
                              <p className="text-xs text-slate-500">
                                {employee.department || "No department"}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAssignee(employee._id)}
                              className="h-4 w-4 accent-sky-600"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-sky-100 bg-white/95 pt-5 backdrop-blur-sm">
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update KRA" : "Create KRA"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingKra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_24px_80px_-40px_rgba(37,99,235,0.45)]">
            <div className="bg-gradient-to-r from-sky-100 via-blue-100 to-sky-200 px-6 py-5 text-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-sky-600">KRA Details</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {viewingKra.title || "Untitled KRA"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Full title, description and timestamps at a glance.
                  </p>
                </div>
                <button
                  onClick={closeViewModal}
                  className="rounded-full border border-sky-100 bg-white p-2 text-sky-700 transition hover:bg-sky-50"
                  aria-label="Close details"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  KRA
                </span>
                <span className="rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {viewingKra.assignmentScope === "users" ? "User-wise" : "Department-wide"}
                </span>
                {viewingKra.department ? (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {viewingKra.department}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid gap-5">
                <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-sky-500">Title</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {viewingKra.title || "No title provided."}
                  </p>
                </div>

                <div className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_16px_40px_-30px_rgba(37,99,235,0.28)]">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-sky-500">Description</p>
                  <div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-7 text-slate-700">
                    {(formatDescriptionSegments(viewingKra.description).length > 0
                      ? formatDescriptionSegments(viewingKra.description)
                      : ["No description provided."]
                    ).map((segment, index) => (
                      <p key={`${index}-${segment}`} className={index === 0 ? "" : "mt-2"}>
                        {segment}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-sky-100 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(37,99,235,0.24)]">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-sky-500">Created</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {viewingKra.createdAt ? new Date(viewingKra.createdAt).toLocaleString() : "-"}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-sky-100 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(37,99,235,0.24)]">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-sky-500">Updated</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {viewingKra.updatedAt ? new Date(viewingKra.updatedAt).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KraManagement;

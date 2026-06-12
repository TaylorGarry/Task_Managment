import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { CalendarClock, PencilLine, Plus, Trash2, X } from "lucide-react";
import api from "../../api.js";
import { canManageAdminPanels } from "../utils/roleAccess.js";

const emptyForm = {
  title: "",
  description: "",
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const AnnouncementManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = canManageAdminPanels(user || {});

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/v1/announcements?view=history");
      setAnnouncements(Array.isArray(res.data?.announcements) ? res.data.announcements : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = useMemo(
    () => announcements.filter((item) => item.status === "active").length,
    [announcements]
  );

  const expiredCount = useMemo(
    () => announcements.filter((item) => item.status === "expired").length,
    [announcements]
  );

  const visibleAnnouncements = useMemo(() => {
    if (activeTab === "active") {
      return announcements.filter((item) => item.status === "active");
    }

    if (activeTab === "expired") {
      return announcements.filter((item) => item.status === "expired");
    }

    return announcements;
  }, [activeTab, announcements, isSuperAdmin]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title || "",
      description: announcement.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const title = String(form.title || "").trim();
    const description = String(form.description || "").trim();

    if (!title || !description) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setSaving(true);
      const payload = { title, description };
      if (editingId) {
        await api.put(`/api/v1/announcements/${editingId}`, payload);
        toast.success("Announcement updated successfully");
      } else {
        await api.post("/api/v1/announcements", payload);
        toast.success("Announcement created successfully");
      }
      await loadAnnouncements();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (announcement) => {
    if (!announcement?._id) return;

    const confirmed = window.confirm(
      `Delete announcement "${announcement.title || "Untitled"}"? This will remove it for all users.`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      await api.delete(`/api/v1/announcements/${announcement._id}`);
      toast.success("Announcement deleted successfully");
      await loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete announcement");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) =>
    status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_10%_10%,rgba(59,130,246,0.12),rgba(248,250,252,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_90%_0%,rgba(14,165,233,0.10),rgba(248,250,252,0))]" />

      <div className="relative mx-auto max-w-7xl">
        {isSuperAdmin ? (
          <div className="mb-6 flex flex-col gap-4 rounded-[30px] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_50px_-34px_rgba(37,99,235,0.35)] backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Performance Center</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Announcement Management</h1>
              {/* <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Super admin can create, update, and review active or expired announcements.
              </p> */}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700">
                {announcements.length} total
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                {activeCount} active
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                {expiredCount} expired
              </div>
              <button
                onClick={openCreateModal}
                className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Announcement
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {isSuperAdmin ? (
          <div className="mb-6 flex flex-wrap gap-3">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "expired", label: "Expired" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-200"
                    : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-sky-100 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading announcements...
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-sky-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            No announcements found.
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
                      Created At
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50 bg-white">
                  {visibleAnnouncements.map((announcement) => (
                    <tr key={announcement._id} className="align-top transition hover:bg-sky-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{announcement.title}</p>
                      </td>
                      <td className="px-5 py-4 text-sm leading-6 text-slate-600">
                        <span
                          className="block max-w-[520px] truncate whitespace-nowrap"
                          title={announcement.description || ""}
                        >
                          {announcement.description}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDateTime(announcement.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusBadge(
                            announcement.status
                          )}`}
                        >
                          {announcement.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(announcement)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                          >
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(announcement)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                            disabled={saving}
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visibleAnnouncements.map((announcement) => (
              <article
                key={announcement._id}
                className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(37,99,235,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-sky-50 p-2 text-sky-700">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Title</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">{announcement.title}</h2>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-500">Description</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {announcement.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_24px_80px_-40px_rgba(37,99,235,0.45)]">
            <div className="bg-gradient-to-r from-sky-100 via-blue-100 to-sky-200 px-6 py-5 text-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-sky-600">
                    {editingId ? "Edit Announcement" : "Create Announcement"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {editingId ? "Update Announcement" : "New Announcement"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full border border-sky-100 bg-white p-2 text-sky-700 transition hover:bg-sky-50"
                  aria-label="Close"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-sky-500">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-sky-500">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Announcement description"
                    rows={7}
                    className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-sky-100 pt-5">
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Announcement" : "Create Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;

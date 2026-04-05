import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, AlertCircle, Clock, Camera } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { logoutUser } from "../features/slices/authSlice.js";
import { fetchMyDelegations, selectMyDelegations } from "../features/slices/delegationSlice.js";

const ROSTER_ALLOWED_DEPARTMENTS = ["Ops - Meta", "Marketing", "CS", "Developer", "Ticketing", "Seo"];

const Navbar = () => {
  const { user, employeeDashboardSummary } = useSelector((state) => state.auth);
  const myDelegations = useSelector(selectMyDelegations);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const isEmployee = user?.accountType === "employee";
  const isTransportDepartment = user?.department === "Transport";

  const canAccessAttendanceUpdate =
    user?.accountType === "employee" ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);

  const canAccessAttendanceSnapshot = true;

  const isAllowedRosterDepartmentEmployee =
    user?.accountType === "employee" &&
    ROSTER_ALLOWED_DEPARTMENTS.includes(user?.department);
  const canCreateDelegation =
    user?.accountType === "employee" &&
    String(user?.department || "").toLowerCase() === "ops - meta";

  const canUploadExcel =
    (user?.accountType === "employee" &&
      ROSTER_ALLOWED_DEPARTMENTS.includes(user?.department)) ||
    ["admin", "superAdmin", "HR"].includes(user?.accountType);

  useEffect(() => {
    if (isEmployee) {
      dispatch(fetchMyDelegations());
    }
  }, [dispatch, isEmployee]);

  useEffect(() => {
    document.body.classList.add("employee-sidebar-layout");
    return () => {
      document.body.classList.remove("employee-sidebar-layout");
    };
  }, []);

  const hasActiveDelegationAsAssignee = useMemo(() => {
    const list = Array.isArray(myDelegations) ? myDelegations : [];
    return list.some((delegation) => delegation?.status === "active");
  }, [myDelegations]);
  const delegatedFromInUrl = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("delegatedFrom") || "").trim();
  }, [location.search]);
  const goToAttendanceSnapshot = () => {
    if (delegatedFromInUrl) {
      navigate(`/attendance-snapshot?delegatedFrom=${encodeURIComponent(delegatedFromInUrl)}`);
      return;
    }
    navigate("/attendance-snapshot");
  };

  const resolvedProfilePhoto = useMemo(() => {
    const fromUser = String(user?.profilePhotoUrl || "").trim();
    if (fromUser) return fromUser;

    const fromSummary = String(employeeDashboardSummary?.profile?.profilePhotoUrl || "").trim();
    if (fromSummary) return fromSummary;

    return "";
  }, [user?.profilePhotoUrl, employeeDashboardSummary?.profile?.profilePhotoUrl]);

  const highQualityPhoto = useMemo(() => {
    const raw = String(resolvedProfilePhoto || "").trim();
    if (!raw) return "";
    if (!raw.includes("res.cloudinary.com") || !raw.includes("/upload/")) return raw;
    return raw.replace(
      "/upload/",
      "/upload/f_auto,q_auto:best,dpr_2.0,c_fill,g_face,w_900,h_900/"
    );
  }, [resolvedProfilePhoto]);

  const sideBtn = (active, tone = "default") => {
    const toneClass =
      tone === "indigo"
        ? "text-indigo-700 border-indigo-200 bg-indigo-50"
        : tone === "green"
        ? "text-emerald-700 border-emerald-200 bg-emerald-50"
        : tone === "amber"
        ? "text-amber-700 border-amber-200 bg-amber-50"
        : tone === "rose"
        ? "text-rose-700 border-rose-200 bg-rose-50"
        : "text-slate-700 border-[#d7e6e1] bg-white";

    return `w-full rounded-full border px-4 py-2.5 text-[15px] leading-5 font-medium text-left whitespace-nowrap transition ${
      active ? toneClass : "text-slate-700 border-[#d7e6e1] bg-white hover:bg-[#f6fbf9]"
    }`;
  };

  return (
    <>
      <Toaster position="top-right" />

      <aside className="hidden md:flex fixed left-0 inset-y-0 h-screen min-h-screen h-dvh w-[252px] border-r border-[#d4e2dd] bg-white/96 z-50">
        <div className="h-full w-full px-5 py-6 flex flex-col">
          <h1
            className="text-[34px] leading-none font-bold text-sky-700 tracking-tight cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            FDBS
          </h1>

          <div className="mt-6 flex-1 min-h-0 rounded-[42px] border border-[#cfe3db] bg-[#f9fcfb] p-2.5 flex flex-col">
            <div className="flex flex-col gap-2">
              {!isTransportDepartment && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className={sideBtn(location.pathname === "/dashboard")}
                >
                  Today
                </button>
              )}

              {isEmployee && !isTransportDepartment && (
                <button
                  onClick={() => navigate("/my-defaults")}
                  className={sideBtn(location.pathname === "/my-defaults", "rose")}
                >
                  My Defaulters
                </button>
              )}

              {canUploadExcel && (
                <button
                  onClick={() => navigate("/upload-roster")}
                  className={sideBtn(location.pathname === "/upload-roster", "green")}
                >
                  Upload Roster
                </button>
              )}

              {isAllowedRosterDepartmentEmployee && (
                <button
                  onClick={() => navigate("/ops-meta-roster")}
                  className={sideBtn(location.pathname === "/ops-meta-roster", "amber")}
                >
                  Ops-Meta Roster
                </button>
              )}

              {canAccessAttendanceUpdate && (
                <button
                  onClick={() => navigate("/attendance-update")}
                  className={sideBtn(location.pathname.startsWith("/attendance-update"), "indigo")}
                >
                  Attendance Update
                </button>
              )}

              {canAccessAttendanceSnapshot && (
                <button
                  onClick={goToAttendanceSnapshot}
                  className={sideBtn(location.pathname === "/attendance-snapshot", "indigo")}
                >
                  Attendance Snapshot
                </button>
              )}

              {isEmployee && hasActiveDelegationAsAssignee && (
                <button
                  onClick={() => navigate("/delegated-actions")}
                  className={sideBtn(location.pathname === "/delegated-actions")}
                >
                  Delegation
                </button>
              )}

              {canCreateDelegation && (
                <button
                  onClick={() => navigate("/delegations")}
                  className={sideBtn(location.pathname === "/delegations", "indigo")}
                >
                  Manage Delegation
                </button>
              )}

              <button
                onClick={() => navigate("/leave-management")}
                className={sideBtn(location.pathname === "/leave-management")}
              >
                Leave
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="mt-auto w-full rounded-full border border-[#e4d0d0] px-4 py-2.5 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 transition"
            >
              Logout
            </button>
          </div>

          <div className="pt-4">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-full rounded-full border border-[#d7e6e1] bg-white px-3 py-2 flex items-center gap-3"
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (resolvedProfilePhoto) setShowPhotoPreview(true);
                  }}
                  className="shrink-0"
                  title={resolvedProfilePhoto ? "View profile photo" : "No profile photo"}
                >
                  {resolvedProfilePhoto ? (
                    <img
                      src={highQualityPhoto || resolvedProfilePhoto}
                      alt={user?.username || "Profile"}
                      className="w-8 h-8 rounded-full object-cover border border-sky-100"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </span>
                <span className="truncate text-slate-800 font-medium text-sm">{user?.username}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-[#d7e6e1] rounded-2xl shadow-md py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
        <nav className="bg-white border-b border-[#d7e6e1] px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-sky-700 cursor-pointer" onClick={() => navigate("/dashboard")}>FDBS</h1>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="mt-3 space-y-2 border-t border-[#d7e6e1] pt-3">
              <button onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Today</button>
              {isEmployee && !isTransportDepartment && (
                <button onClick={() => { navigate("/my-defaults"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-left text-rose-700">My Defaulters</button>
              )}
              {canAccessAttendanceUpdate && (
                <button onClick={() => { navigate("/attendance-update"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Update</button>
              )}
              {canAccessAttendanceSnapshot && (
                <button onClick={() => { goToAttendanceSnapshot(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-left text-indigo-700">Attendance Snapshot</button>
              )}
              <button onClick={() => { navigate("/leave-management"); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-[#d7e6e1] bg-white px-4 py-2 text-left">Leave</button>
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mx-1 w-[calc(100%-0.5rem)] rounded-full border border-rose-200 bg-white px-4 py-2 text-left text-rose-700">
                Logout ({user?.username})
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className="pt-[78px] md:pt-0" />

      {showPhotoPreview && resolvedProfilePhoto && (
        <div
          className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setShowPhotoPreview(false)}
        >
          <div
            className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={highQualityPhoto || resolvedProfilePhoto}
              alt={user?.username || "Profile"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

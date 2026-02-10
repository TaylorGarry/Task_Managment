import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import {
  signupUser,
  createCoreTeamUser,
} from "../features/slices/authSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { Toaster } from "react-hot-toast";

const Signup = () => {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      accountType: "employee",
      isCoreTeam: false,
    },
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const accountType = watch("accountType");
  const isCoreTeam = watch("isCoreTeam");
  useEffect(() => {
    const allowed =
      user?.accountType === "admin" ||
      user?.accountType === "superAdmin" 
      user?.accountType === "HR";

    if (!user || !allowed) {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [user, navigate]);
  const shiftOptions = [
    { label: "1 AM - 10 AM", shiftLabel: "1am-10am" },
    { label: "4 PM - 1 AM", shiftLabel: "4pm-1am" },
    { label: "5 PM - 2 AM", shiftLabel: "5pm-2am" },
    { label: "6 PM - 3 AM", shiftLabel: "6pm-3am" },
    { label: "8 PM - 5 AM", shiftLabel: "8pm-5am" },
    { label: "11 PM - 8 AM", shiftLabel: "11pm-8am" },
  ];
  const onSubmit = async (data) => {
    if (creatingUser) return;
    setCreatingUser(true);
    try {
      const payload = {
        username: data.username,
        password: data.password,
        accountType: data.accountType,
        department: data.department,
        isCoreTeam: data.isCoreTeam || false,
      };
      if (
        data.accountType === "employee" &&
        !data.isCoreTeam
      ) {
        payload.shiftLabel = data.shiftLabel;
      }
      const resultAction = data.isCoreTeam
        ? await dispatch(createCoreTeamUser(payload))
        : await dispatch(signupUser(payload));
      const success =
        signupUser.fulfilled.match(resultAction) ||
        createCoreTeamUser.fulfilled.match(resultAction);
      if (success) {
        toast.success("User created successfully");
        reset();
      } else {
        toast.error(resultAction.payload || "Creation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCreatingUser(false);
    }
  };
  return (
    <>
      <Toaster />
      <AdminNavbar />
      <div className="relative min-h-screen bg-[#f5f3ff]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Playfair+Display:wght@600&display=swap');
        `}</style>

        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_20%,rgba(109,40,217,0.15),rgba(245,243,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_85%_15%,rgba(14,116,144,0.18),rgba(245,243,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_70%_85%,rgba(34,197,94,0.12),rgba(245,243,255,0))]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12">
          <div className="w-full overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_-45px_rgba(30,27,75,0.7)]">
            <div className="grid lg:grid-cols-[1.1fr_1.3fr]">
              <div className="relative flex flex-col justify-between bg-[#111827] p-10 text-white lg:p-12">
                <div>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    Admin Console
                  </span>
                  <h2
                    className="mt-6 text-3xl font-semibold leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Create new access
                  </h2>
                  <p className="mt-3 text-sm text-white/70">
                    Provision accounts with role-based permissions in minutes.
                  </p>
                </div>
                <div className="mt-10 grid gap-6 text-sm text-white/80 sm:grid-cols-2">
                  <div>
                    <p className="text-2xl font-semibold">Secure</p>
                    <p className="mt-1">Role-based access</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">Fast</p>
                    <p className="mt-1">One form setup</p>
                  </div>
                </div>
              </div>

              <div
                className="bg-white p-10 lg:p-12"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              >
                <h3 className="text-2xl font-semibold text-slate-900">
                  Create User
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Fill out the details below to provision a new account.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. jdoe"
                      {...register("username", { required: true })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                      disabled={creatingUser}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Set a temporary password"
                        {...register("password", { required: true })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                        disabled={creatingUser}
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Account Type
                      </label>
                      <select
                        {...register("accountType")}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                        disabled={creatingUser}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                        <option value="Operations">Operations</option>
                        <option value="AM">AM</option>
                        <option value="HR">HR</option>
                        <option value="superAdmin">Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Operations"
                        {...register("department", { required: true })}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                        disabled={creatingUser}
                      />
                    </div>
                  </div>
                  {accountType === "employee" && !isCoreTeam && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Shift
                      </label>
                      <select
                        {...register("shiftLabel", { required: true })}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                        disabled={creatingUser}
                      >
                        {shiftOptions.map((option) => (
                          <option key={option.shiftLabel} value={option.shiftLabel}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {accountType === "employee" && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <label className="text-sm text-slate-700 font-medium">
                        Core Team Member
                      </label>
                      <button
                        type="button"
                        onClick={() => setValue("isCoreTeam", !isCoreTeam)}
                        className={`relative inline-flex cursor-pointer h-6 w-11 items-center rounded-full ${
                          isCoreTeam ? "bg-indigo-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            isCoreTeam ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className={`w-full rounded-xl px-4 py-3 cursor-pointer text-base font-semibold text-white transition ${
                      creatingUser
                        ? "cursor-not-allowed bg-indigo-300"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {creatingUser ? "Creating..." : "Create User"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;


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

      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl mt-10 shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Create User
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              {...register("username", { required: true })}
              className="w-full p-2 border rounded"
              disabled={creatingUser}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", { required: true })}
                className="w-full p-2 border rounded pr-10"
                disabled={creatingUser}
              />
              <span
                className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <select
              {...register("accountType")}
              className="w-full p-2 border rounded cursor-pointer"
              disabled={creatingUser}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="Operations">Operations</option>
              <option value="AM">AM</option>
              
              

              <option value="HR">HR</option>

              <option value="superAdmin">Super Admin</option>
            </select>

            <input
              type="text"
              placeholder="Department"
              {...register("department", { required: true })}
              className="w-full p-2 border rounded"
              disabled={creatingUser}
            />

            {accountType === "employee" && !isCoreTeam && (
              <select
                {...register("shiftLabel", { required: true })}
                className="w-full p-2 border rounded cursor-pointer"
                disabled={creatingUser}
              >
                {shiftOptions.map((option) => (
                  <option key={option.shiftLabel} value={option.shiftLabel}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {accountType === "employee" && (
              <div className="flex items-center justify-between py-2">
                <label className="text-sm text-gray-700 font-medium">
                  Is Core Team Member?
                </label>
                <button
                  type="button"
                  onClick={() => setValue("isCoreTeam", !isCoreTeam)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    isCoreTeam ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                      isCoreTeam ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={creatingUser}
              className={`w-full p-2 rounded text-white ${
                creatingUser
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {creatingUser ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;


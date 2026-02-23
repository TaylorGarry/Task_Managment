import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
<<<<<<< HEAD
import { useNavigate, Link } from "react-router-dom";
=======
import { useNavigate } from "react-router-dom";
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
import toast from "react-hot-toast";
import { loginUser } from "../features/slices/authSlice.js";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    if (loading) return;
    try {
      const resultAction = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Login successful!");
        const user = resultAction.payload;
        if (user.accountType === "admin") navigate("/admin");
        else navigate("/dashboard");
      } else {
        toast.error(resultAction.payload || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
<<<<<<< HEAD
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: "url('/travel-insurance.jpeg')",
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="mb-6 text-center bg-transparent">
          
          <h1 className="text-2xl font-bold">
             <span className="text-[#ffcc00]">FD</span>
            <span className="text-[#0066cc] ml-1">BUSINESS</span>
            <span className="text-[#ffcc00] ml-1">Service</span>
          </h1>
        </div>


        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            {...register("username", { required: true })}
            className="w-full p-2 border rounded"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password", { required: true })}
              className="w-full p-2 border rounded pr-10"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded text-white cursor-pointer ${loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
=======
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-8 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_-35px_rgba(15,23,42,0.35)] md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white md:p-10">
            <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Welcome Back</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">FD BUSINESS Service</h1>
            <p className="mt-4 text-sm text-blue-50/95">
              Sign in to continue managing roster, tasks, and team operations from one workspace.
            </p>
            <div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium">Secure Access</p>
              <p className="mt-1 text-xs text-blue-100">
                Use your assigned credentials to access your dashboard.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Login</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Sign In</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter username and password to continue.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  {...register("username", { required: true })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password", { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white transition ${
                  loading
                    ? "cursor-not-allowed bg-blue-300"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      </div>
    </div>

  );
};

export default Login;

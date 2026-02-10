import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="relative min-h-screen bg-[#0b1020]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Fraunces:opsz,wght@9..144,600;700&display=swap');
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_10%,rgba(255,178,102,0.35),rgba(11,16,32,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_15%_80%,rgba(34,197,94,0.25),rgba(11,16,32,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,32,0)_0%,rgba(11,16,32,0.55)_70%,rgba(11,16,32,0.9)_100%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-4xl overflow-hidden rounded-3xl shadow-[0_40px_90px_-45px_rgba(15,23,42,0.9)]"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          <div className="grid md:grid-cols-2">
            <div className="relative p-10 text-white md:p-12 bg-gradient-to-br from-[#0f766e] via-[#0ea5a4] to-[#fbbf24]">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/20 blur-2xl" />

              <h1
                className="text-3xl font-semibold leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                FD BUSINESS Service
              </h1>
              <p className="mt-4 text-white/90">
                Welcome back. Sign in to keep your operations moving and your team synced.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-6 text-sm text-white/90">
                <div>
                  {/* <p className="text-2xl font-semibold">24/7</p>
                  <p className="mt-1">Live support</p> */}
                </div>
                <div>
                  {/* <p className="text-2xl font-semibold">1.2k+</p>
                  <p className="mt-1">Active teams</p> */}
                </div>
              </div>
            </div>

            <div className="bg-white p-10 md:p-12">
              <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your work credentials to access your dashboard.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    {...register("username", { required: true })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password", { required: true })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl px-4 py-3 text-base font-semibold cursor-pointer text-white transition ${
                    loading
                      ? "cursor-not-allowed bg-teal-300"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Login;

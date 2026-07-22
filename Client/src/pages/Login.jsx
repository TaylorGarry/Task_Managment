// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import { loginUser } from "../features/slices/authSlice.js";
// import { Eye, EyeOff } from "lucide-react";
// import { useEffect, useState } from "react";
// import { canManageAdminPanels } from "../utils/roleAccess.js";

// const Login = () => {
//   const { register, handleSubmit } = useForm();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading } = useSelector((state) => state.auth);
//   const [showPassword, setShowPassword] = useState(false);

//   useEffect(() => {
//     toast.dismiss("auth-login-success");
//   }, []);

//   const onSubmit = async (data) => {
//     if (loading) return;
//     try {
//       const payload = {
//         identifier: data.identifier,
//         password: data.password,
//       };
//       const user = await dispatch(loginUser(payload)).unwrap();
//       toast.success("Login successful!", { id: "auth-login-success", duration: 2000 });
//       navigate(canManageAdminPanels(user) ? "/admin" : "/dashboard");
//     } catch (err) {
//       const message = String(err || "Login failed");
//       const normalizedMessage = message.toLowerCase();
//       if (
//         normalizedMessage.includes("inactive") ||
//         normalizedMessage.includes("cannot login")
//       ) {
//         toast.error(
//           "Your account is inactive. You cannot login. Ask superAdmin or HR to activate your account."
//         );
//         return;
//       }
//       if (
//         normalizedMessage.includes("invalid") ||
//         normalizedMessage.includes("credential") ||
//         normalizedMessage.includes("password") ||
//         normalizedMessage.includes("not found")
//       ) {
//         toast.error("Invalid credentials");
//         return;
//       }
//       toast.error(message);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-8 md:py-10">
//       <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
//         <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_-35px_rgba(15,23,42,0.35)] md:grid-cols-2">
//           <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white md:p-10">
//             <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
//             <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />
//             <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Welcome Back</p>
//             <h1 className="mt-3 text-3xl font-bold leading-tight">FD BUSINESS Service</h1>
//             <p className="mt-4 text-sm text-blue-50/95">
//               Sign in to continue managing roster, tasks, and team operations from one workspace.
//             </p>
//             <div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
//               <p className="text-sm font-medium">Secure Access</p>
//               <p className="mt-1 text-xs text-blue-100">
//                 Use your assigned credentials to access your dashboard.
//               </p>
//             </div>
//           </div>

//           <div className="bg-white p-8 md:p-10">
//             <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Login</p>
//             <h2 className="mt-2 text-2xl font-bold text-slate-900">Sign In</h2>
//               <p className="mt-2 text-sm text-slate-500">
//               Enter login ID and password to continue.
//               </p>

//             <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
//               <div>
//                 <label className="text-sm font-medium text-slate-700">Login ID</label>
//                 <input
//                   type="text"
//                   placeholder="Username / Emp ID / Real Name / Pseudo Name"
//                   {...register("identifier", { required: true })}
//                   className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-medium text-slate-700">Password</label>
//                 <div className="relative mt-2">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     {...register("password", { required: true })}
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
//                   />
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
//                     onClick={() => setShowPassword(!showPassword)}
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white transition ${
//                   loading
//                     ? "cursor-not-allowed bg-blue-300"
//                     : "bg-blue-600 hover:bg-blue-700"
//                 }`}
//               >
//                 {loading ? "Logging in..." : "Login"}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>

//   );
// };

// export default Login;





// Login.jsx
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../features/slices/authSlice.js";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { canManageAdminPanels, isFloorStatus } from "../utils/roleAccess.js";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    toast.dismiss("auth-login-success");
  }, []);

  const onSubmit = async (data) => {
    if (loading) return;
    try {
      const payload = {
        identifier: data.identifier,
        password: data.password,
      };
      const user = await dispatch(loginUser(payload)).unwrap();
      toast.success("Login successful!", { id: "auth-login-success", duration: 2000 });
      navigate(isFloorStatus(user) ? "/floor-status" : canManageAdminPanels(user) ? "/admin" : "/dashboard");
    } catch (err) {
      const message = String(err || "Login failed");
      const normalizedMessage = message.toLowerCase();
      if (
        normalizedMessage.includes("inactive") ||
        normalizedMessage.includes("cannot login")
      ) {
        toast.error(
          "Your account is inactive. You cannot login. Ask superAdmin or HR to activate your account."
        );
        return;
      }
      if (
        normalizedMessage.includes("invalid") ||
        normalizedMessage.includes("credential") ||
        normalizedMessage.includes("password") ||
        normalizedMessage.includes("not found")
      ) {
        toast.error("Invalid credentials");
        return;
      }
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-8 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_-35px_rgba(15,23,42,0.35)] md:grid-cols-2">
          
          {/* Left Panel - Branding Side with Blue Gradient Background */}
          <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white md:p-10">
            {/* Decorative blur elements */}
            <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />
            
            {/* PUNCHX Logo - Directly on blue bg, no white background */}
            <div className="relative z-10">
              <div className="flex items-baseline">
                <span className="text-4xl font-black text-white tracking-tight">P</span>
                <span className="text-2xl font-semibold text-white/80 lowercase">unch</span>
                <span className="text-4xl font-black text-yellow-400 tracking-tight">X</span>
              </div>
            </div>
            
            <div className="relative z-10 mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">WELCOME BACK</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight">FD BUSINESS Service</h1>
              <p className="mt-4 text-sm text-blue-50/95">
                Sign in to continue managing roster, tasks, and team operations from one workspace.
              </p>
            </div>
            
            <div className="relative z-10 mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium">Secure Access</p>
              <p className="mt-1 text-xs text-blue-100">
                Use your assigned credentials to access your dashboard.
              </p>
            </div>
          </div>

          {/* Right Panel - Login Form Side */}
          <div className="bg-white p-8 md:p-10">
            {/* PUNCHX Logo on Right Side (Mobile Only) */}
            <div className="mb-6 block md:hidden">
              <div className="flex items-baseline">
                <span className="text-3xl font-black text-slate-800 tracking-tight">P</span>
                <span className="text-xl font-semibold text-slate-600 lowercase">unch</span>
                <span className="text-3xl font-black text-yellow-500 tracking-tight">X</span>
              </div>
            </div>
            
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">LOGIN</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Sign In</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter login ID and password to continue.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">Login ID</label>
                <input
                  type="text"
                  placeholder="Username / Emp ID / Real Name / Pseudo Name"
                  {...register("identifier", { required: true })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password", { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
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
                className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white transition-all ${
                  loading
                    ? "cursor-not-allowed bg-blue-300"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

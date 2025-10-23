import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signupUser } from "../features/slices/authSlice.js";
import { Eye, EyeOff } from "lucide-react";
import AdminNavbar from "../components/AdminNavbar.jsx";

const Signup = () => {
  const { register, handleSubmit, watch, reset } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const accountType = watch("accountType");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Redirect non-admins away
  useEffect(() => {
    if (!user || user.accountType !== "admin") {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    if (creatingUser) return; // Prevent multiple clicks

    setCreatingUser(true);

    try {
      const payload = {
        username: data.username,
        password: data.password,
        accountType: data.accountType,
        department: data.department,
      };

      const resultAction = await dispatch(signupUser(payload));

      if (signupUser.fulfilled.match(resultAction)) {
        toast.success("User created successfully!");
        reset(); // Reset form fields
      } else {
        if (resultAction.payload === "User already exists") {
          toast.error("User already exists!");
        } else {
          toast.error(resultAction.payload || "Signup failed");
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Create User</h2>
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
              defaultValue="employee"
              className="w-full p-2 border rounded"
              disabled={creatingUser}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>

            <input
              type="text"
              placeholder="Department"
              {...register("department")}
              className="w-full p-2 border rounded"
              disabled={creatingUser}
            />

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


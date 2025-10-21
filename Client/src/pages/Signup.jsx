import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { signupUser } from "../features/slices/authSlice.js";
import { Eye, EyeOff } from "lucide-react"; 

const Signup = () => {
  const { register, handleSubmit, watch } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const accountType = watch("accountType"); 
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const payload = {
        username: data.username,
        password: data.password,
        accountType: data.accountType,
        department: data.department, 
      };

      const resultAction = await dispatch(signupUser(payload));
      if (signupUser.fulfilled.match(resultAction)) {
        toast.success("Signup successful! Please login.");
        navigate("/login");
      } else {
        toast.error(resultAction.payload || "Signup failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            {...register("username", { required: true })}
            className="w-full p-2 border rounded"
          />

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password", { required: true })}
              className="w-full p-2 border rounded"
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
          >
            <option value="employee">Employee</option>
            {/* <option value="admin">Admin</option> */}
          </select>

          {accountType === "employee" && (
            <input
              type="text"
              placeholder="Department"
              {...register("department", { required: true })}
              className="w-full p-2 border rounded"
            />
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;



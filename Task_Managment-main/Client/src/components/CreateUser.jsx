import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUser, resetState } from "../features/slices/authSlice";

const CreateUser = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    username: "",
    password: "",
    accountType: "employee",
    department: "",
  });

  useEffect(() => {
    if (success) {
      setForm({
        username: "",
        password: "",
        accountType: "employee",
        department: "",
      });

      const timer = setTimeout(() => {
        dispatch(resetState());
      }, 3000);  

      return () => clearTimeout(timer);
    }

    return () => {
      dispatch(resetState());
    };
  }, [success, dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createUser(form));
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <select
          name="accountType"
          value={form.accountType}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">User created successfully!</p>}
      </form>
    </div>
  );
};

export default CreateUser;

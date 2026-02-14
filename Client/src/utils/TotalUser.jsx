import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchEmployees } from "../features/slices/authSlice.js";

const TotalUser = () => {
  const dispatch = useDispatch();
  const { employees, loading, error } = useSelector((state) => state.auth);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalEmployees = Array.isArray(employees) ? employees.length : 0;

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (loading || error) return;

    if (totalEmployees === 0) {
      setDisplayCount(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setDisplayCount(0);

    const duration = 1500;
    const steps = 50;
    const increment = totalEmployees / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalEmployees) {
        setDisplayCount(totalEmployees);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalEmployees, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 text-slate-900 shadow-sm">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-600/80">
            Total Employees
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">People</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-slate-200"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-600 text-sm">Error loading employees</p>
          ) : (
            <div className="mt-3 flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-blue-700">
                {displayCount.toLocaleString()}
              </h3>
              {isAnimating && (
                <span className="text-emerald-300 animate-bounce">^</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-2xl border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-700 transition-all duration-300 ${
            isAnimating ? "scale-110" : "scale-100"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-1a4 4 0 00-5.9-3.5M17 20H7m10 0v-1c0-2.2-1.8-4-4-4s-4 1.8-4 4v1m-2 0H2v-1a4 4 0 015.9-3.5m0 0a5 5 0 1010 0 5 5 0 00-10 0z"
            />
          </svg>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <span>Live</span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
          Updated
        </span>
      </div>
    </div>
  );
};

export default TotalUser;

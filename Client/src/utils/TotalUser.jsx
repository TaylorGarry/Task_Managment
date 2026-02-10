import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchEmployees } from "../features/slices/authSlice.js";

const TotalUser = () => {
  const dispatch = useDispatch();
  const { employees, loading, error } = useSelector((state) => state.auth);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const totalEmployees = employees?.length || 0;

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchEmployees());
      setHasFetched(true);
    }
  }, [dispatch, hasFetched]);

  useEffect(() => {
    if (!loading && !error && totalEmployees > 0) {
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
    }
  }, [totalEmployees, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
            Total Users
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">People</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-white/20"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-300 text-sm">Error loading users</p>
          ) : (
            <div className="mt-3 flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-white">
                {displayCount.toLocaleString()}
              </h3>
              {isAnimating && (
                <span className="text-emerald-300 animate-bounce">↑</span>
              )}
            </div>
          )}
        </div>

        <div
          className={`h-12 w-12 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-amber-200 transition-all duration-300 ${
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TotalUser;

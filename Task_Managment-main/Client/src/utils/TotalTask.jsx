import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

const TotalTask = () => {
  const dispatch = useDispatch();
  const { allTasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalTasks = Array.isArray(allTasks) ? allTasks.length : 0;

  useEffect(() => {
    dispatch(fetchAllTasks({}));
  }, [dispatch]);

  useEffect(() => {
    if (loading || error) return;

    if (totalTasks === 0) {
      setDisplayCount(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setDisplayCount(0);

    const duration = 1500;
    const steps = 50;
    const increment = totalTasks / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalTasks) {
        setDisplayCount(totalTasks);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalTasks, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 text-slate-900 shadow-sm">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-600/80">
            Total Tasks
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Overview</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-slate-200"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-600 text-sm">Error loading tasks</p>
          ) : (
            <div className="mt-3 flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-blue-700">
                {displayCount.toLocaleString()}
              </h3>
              {isAnimating && (
                <span className="text-emerald-300 animate-bounce">↑</span>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <span>All Tasks</span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
          Live
        </span>
      </div>
    </div>
  );
};

export default TotalTask;

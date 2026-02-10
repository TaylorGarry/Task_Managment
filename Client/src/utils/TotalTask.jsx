import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

const TotalTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const totalTasks = tasks?.length || 0;

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const todayDate = getTodayDate();
  const displayDate = formatDisplayDate(todayDate);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchAllTasks({ date: todayDate }));
      setHasFetched(true);
    }
  }, [dispatch, hasFetched, todayDate]);

  useEffect(() => {
    if (!loading && !error && totalTasks > 0) {
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
    }
  }, [totalTasks, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-400/20 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-200/80">
            Total Tasks
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">Overview</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-white/20"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-300 text-sm">Error loading tasks</p>
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
          className={`h-12 w-12 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-violet-200 transition-all duration-300 ${
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

      <div className="mt-6 flex items-center justify-between text-xs text-slate-300">
        {loading ? (
          <div className="h-4 w-20 rounded bg-white/10 animate-pulse"></div>
        ) : error ? (
          <span className="text-rose-300">Error</span>
        ) : (
          <span>{displayDate}</span>
        )}
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px]">
          Live
        </span>
      </div>
    </div>
  );
};

export default TotalTask;

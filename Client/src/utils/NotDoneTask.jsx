import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

const NotDoneTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  const notDoneTasksCount =
    tasks?.filter((task) => !task.doneEmployees || task.doneEmployees?.length === 0)
      ?.length || 0;

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchAllTasks({ date: todayDate }));
      setHasFetched(true);
    }
  }, [dispatch, hasFetched, todayDate]);

  useEffect(() => {
    if (!loading && !error) {
      setIsAnimating(true);
      setDisplayCount(0);

      const duration = 1500;
      const steps = 50;
      const increment = notDoneTasksCount / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= notDoneTasksCount) {
          setDisplayCount(notDoneTasksCount);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [notDoneTasksCount, loading, error]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-400/20 blur-2xl"></div>
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">
            Not Done
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">Pending</p>

          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-9 w-16 rounded-lg bg-white/20"></div>
            </div>
          ) : error ? (
            <p className="mt-3 text-rose-300 text-sm">Error loading tasks</p>
          ) : (
            <div className="mt-3 flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-white">{displayCount}</h3>
              {isAnimating && (
                <span className="text-rose-300 animate-bounce">↑</span>
              )}
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-rose-200">
          !
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-slate-300">
        <span>Today</span>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px]">
          Live
        </span>
      </div>
    </div>
  );
};

export default NotDoneTask;

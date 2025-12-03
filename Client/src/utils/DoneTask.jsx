import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTasks } from '../features/slices/taskSlice.js'; 

const DoneTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  const doneTasksCount = tasks?.filter(task => 
    task.status === 'Done' || 
    task.doneEmployees?.length > 0
  )?.length || 0;

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchAllTasks({ date: todayDate }));
      setHasFetched(true);
    }
  }, [dispatch, hasFetched, todayDate]);

  useEffect(() => {
    if (!loading && !error && doneTasksCount > 0) {
      setIsAnimating(true);
      setDisplayCount(0);
      
      const duration = 1500;
      const steps = 50;
      const increment = doneTasksCount / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= doneTasksCount) {
          setDisplayCount(doneTasksCount);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [doneTasksCount, loading, error]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-stretch-50% font-semibold text-blue-500 mb-2">Done Task</p>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading tasks</p>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-gray-600">
                {displayCount}
              </h3>
              {isAnimating && (
                <span className="text-green-500 animate-bounce">↑</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-600">Today</p>
      </div>
    </div>
  );
};

export default DoneTask;
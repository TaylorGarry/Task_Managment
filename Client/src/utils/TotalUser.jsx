import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-stretch-50% font-semibold text-blue-500 mb-2">
            Total Users
          </p>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading users</p>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-gray-600">
                {displayCount.toLocaleString()}
              </h3>
              {isAnimating && (
                <span className="text-green-500 animate-bounce">↑</span>
              )}
            </div>
          )}
        </div>
        
        <div className={`bg-blue-100 p-2 rounded-lg transition-all duration-300 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}>
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TotalUser;
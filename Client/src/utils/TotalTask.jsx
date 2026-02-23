<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTasks } from '../features/slices/taskSlice.js'; 

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
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-stretch-50% font-semibold text-blue-500 mb-2">
            Total task 
          </p>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading tasks</p>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-gray-600">
                {displayCount.toLocaleString()}
              </h3>
              {isAnimating && (
                <span className="text-green-500 animate-bounce">↑</span>
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
              )}
            </div>
          )}
        </div>
<<<<<<< HEAD
        
        <div className={`bg-blue-100 p-2 rounded-lg transition-all duration-300 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}>
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>
      
      <div className="mt-1 text-sm text-gray-600">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-xs">Error</p>
        ) : (
          <p>{displayDate}</p>
        )}
=======

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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default TotalTask;
=======
export default TotalTask;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

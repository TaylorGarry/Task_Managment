import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
  fetchMyDelegations,
  selectMyDelegations,
  selectDelegationLoading,
} from "../features/slices/delegationSlice.js";

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  const asString = String(dateValue).trim();
  const ymdMatch = asString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const DelegatedActionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const myDelegations = useSelector(selectMyDelegations);
  const loading = useSelector(selectDelegationLoading);

  useEffect(() => {
    dispatch(fetchMyDelegations());
  }, [dispatch]);

  const activeDelegations = useMemo(() => {
    const safeList = Array.isArray(myDelegations) ? myDelegations : [];
    return safeList.filter((delegation) => delegation?.status === "active");
  }, [myDelegations]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Delegated Team Actions</h1>
            <p className="text-gray-600 mt-2">
              Use this page to update tasks and attendance for team leaders who delegated authority to you.
            </p>
          </div>

          {loading ? (
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8 text-center text-gray-600">
              Loading delegated teams...
            </div>
          ) : activeDelegations.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-800">No active delegated teams</h2>
              <p className="text-gray-500 mt-2">
                When someone delegates their team to you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDelegations.map((delegation) => (
                <div
                  key={delegation._id}
                  className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Delegated By</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {delegation?.delegator?.username || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Period: {formatDate(delegation?.startDate)} - {formatDate(delegation?.endDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Team Members: {delegation?.affectedEmployees?.length || 0}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          navigate(`/dashboard?delegatedFrom=${delegation?.delegator?._id || ""}`)
                        }
                        className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                      >
                        Update Tasks
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/delegated-attendance?delegatedFrom=${delegation?.delegator?._id || ""}`)
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Update Attendance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DelegatedActionsPage;

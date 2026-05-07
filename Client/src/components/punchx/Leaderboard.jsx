import React from "react";

const Leaderboard = ({ score = 0 }) => {
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A]">Team Leaderboard</h3>
      <p className="mt-2 text-xs text-[#64748B]">Today rank updates after each status event.</p>
      <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3">
        <p className="text-xs text-[#64748B]">Your score</p>
        <p className="text-lg font-bold text-[#2563EB]">{score}</p>
      </div>
    </div>
  );
};

export default Leaderboard;

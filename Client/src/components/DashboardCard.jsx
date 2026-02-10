import React, { useMemo } from "react";
import TotalTask from "../utils/TotalTask";
import DoneTask from "../utils/DoneTask";
import NotDoneTask from "../utils/NotDoneTask";
import TotalUser from "../utils/TotalUser";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useSelector } from "react-redux";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DashboardCard = () => {
  const { tasks } = useSelector((state) => state.tasks);

  const { totalTasks, doneTasks, notDoneTasks } = useMemo(() => {
    const total = tasks?.length || 0;
    const done = tasks?.filter((task) => task.doneEmployees?.length > 0)?.length || 0;
    const notDone =
      tasks?.filter((task) => !task.doneEmployees || task.doneEmployees?.length === 0)
        ?.length || 0;

    return { totalTasks: total, doneTasks: done, notDoneTasks: notDone };
  }, [tasks]);

  const chartData = useMemo(
    () => ({
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [doneTasks, notDoneTasks],
          backgroundColor: ["#22d3ee", "#1f2937"],
          borderColor: "#0f172a",
          borderWidth: 4,
        },
      ],
    }),
    [doneTasks, notDoneTasks]
  );

  const centerTextPlugin = useMemo(
    () => ({
      id: "centerText",
      afterDraw: (chart) => {
        const {
          ctx,
          chartArea: { left, top, right, bottom },
        } = chart;
        const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage =
          total > 0 ? ((chart.data.datasets[0].data[0] / total) * 100).toFixed(0) : 0;

        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        ctx.save();

        ctx.font = "600 32px Outfit";
        ctx.fillStyle = "#22d3ee";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`${percentage}%`, centerX, centerY);

        ctx.font = "500 13px Outfit";
        ctx.fillStyle = "#94a3b8";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Completed", centerX, centerY + 25);

        ctx.restore();
      },
    }),
    []
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            color: "#cbd5f5",
          },
        },
        title: {
          display: true,
          text: "Task Completion Rate",
          font: {
            size: 16,
          },
          color: "#e2e8f0",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "62%",
    }),
    []
  );

  return (
    <div className="relative min-h-screen bg-[#0b1020] p-6 mt-15">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(56,189,248,0.18),rgba(11,16,32,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_85%_10%,rgba(251,191,36,0.18),rgba(11,16,32,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,32,0.2),rgba(11,16,32,0.9))]" />

      <div className="relative" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Overview</p>
          <h2
            className="mt-2 text-3xl font-semibold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Dashboard Snapshot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <TotalTask />
          <DoneTask />
          <NotDoneTask />
          <TotalUser />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/10 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] p-6 backdrop-blur">
            <div className="h-72">
              <Doughnut data={chartData} options={chartOptions} plugins={[centerTextPlugin]} />
            </div>
            <div className="mt-4 text-center text-sm text-slate-300">
              <p>{doneTasks} completed - {notDoneTasks} remaining</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] p-6 backdrop-blur">
            <h3 className="text-lg font-semibold mb-4 text-slate-100">Remarks</h3>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
                In progress...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;

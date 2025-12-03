import React, { useMemo } from 'react';
import TotalTask from '../utils/TotalTask';
import DoneTask from '../utils/DoneTask';
import NotDoneTask from '../utils/NotDoneTask';
import TotalUser from '../utils/TotalUser';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { useSelector } from 'react-redux';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DashboardCard = () => {
  // Single useSelector call to get all needed data
  const { tasks } = useSelector((state) => state.tasks);
  
  // Use useMemo to calculate derived values only when tasks change
  const { totalTasks, doneTasks, notDoneTasks } = useMemo(() => {
    const total = tasks?.length || 0;
    const done = tasks?.filter(task => task.doneEmployees?.length > 0)?.length || 0;
    const notDone = tasks?.filter(task => !task.doneEmployees || task.doneEmployees?.length === 0)?.length || 0;
    
    return { totalTasks: total, doneTasks: done, notDoneTasks: notDone };
  }, [tasks]);

  const chartData = useMemo(() => ({
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [doneTasks, notDoneTasks],
        backgroundColor: [
          '#10b981', 
          '#e5e7eb'  
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  }), [doneTasks, notDoneTasks]);

  const centerTextPlugin = useMemo(() => ({
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, chartArea: { left, top, right, bottom } } = chart;
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      const percentage = total > 0 ? ((chart.data.datasets[0].data[0] / total) * 100).toFixed(0) : 0;
      
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      
      ctx.save();
      
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${percentage}%`, centerX, centerY);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Completed', centerX, centerY + 25);
      
      ctx.restore();
    }
  }), []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: 'Task Completion Rate',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  }), []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-15">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <TotalTask />
        <DoneTask />
        <NotDoneTask />
        <TotalUser />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-70">
            <Doughnut 
              data={chartData} 
              options={chartOptions}
              plugins={[centerTextPlugin]}
            />
          </div>
          <div className="mt-4 text-center text-sm font-mono text-gray-600">
            <p> {doneTasks} completed • {notDoneTasks} remaining</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#666666]">Remarks</h3>
          <div className="space-y-4">
            {/* <h2 className='text-[#666666] font-mono text-2xl'>All remark as chat UI will display here</h2> */}
            <h1 className='text-blue-300 font-mono'>In Progress...</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
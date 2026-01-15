"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentsProps {
  type: 'bar' | 'line' | 'doughnut';
  data: any;
  options: any;
}

export function ChartComponents({ type, data, options }: ChartComponentsProps) {
  const heightClass = 'h-[250px] md:h-[300px]';

  switch (type) {
    case 'bar':
      return (
        <div className={heightClass}>
          <Bar data={data} options={options} />
        </div>
      );
    case 'line':
      return (
        <div className={heightClass}>
          <Line data={data} options={options} />
        </div>
      );
    case 'doughnut':
      return (
        <div className={`${heightClass} flex justify-center items-center`}>
          <Doughnut data={data} options={options} />
        </div>
      );
    default:
      return null;
  }
}

import React from 'react';

interface StatsCardProps {
  years: number;
  months: number;
  weeks: number;
  lifeExpectancy: number;
  percentage: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ years, months, weeks, lifeExpectancy, percentage }) => {
  const circumference = 2 * Math.PI * 50; // 2 * pi * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="60"
            cy="60"
          />
          <circle
            className="text-cyan-500 dark:text-cyan-400"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
            style={{
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900 dark:text-white">
          {percentage.toFixed(1)}%
        </div>
      </div>
      <div>
        <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300">
          You are <span className="font-bold text-cyan-600 dark:text-cyan-400">{years}</span> years, <span className="font-bold text-cyan-600 dark:text-cyan-400">{months}</span> months, and <span className="font-bold text-cyan-600 dark:text-cyan-400">{weeks}</span> weeks old.
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Based on a life expectancy of {lifeExpectancy.toFixed(1)} years.
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
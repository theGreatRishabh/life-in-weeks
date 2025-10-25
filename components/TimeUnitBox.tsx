import React from 'react';
import { WeekStatus } from '../types';

interface TimeUnitBoxProps {
  status: WeekStatus;
  isBeyondLifeExpectancy: boolean;
  tooltip: string;
}

const TimeUnitBox: React.FC<TimeUnitBoxProps> = ({ status, isBeyondLifeExpectancy, tooltip }) => {
  const getStatusClass = () => {
    if (status === WeekStatus.Past) return 'bg-cyan-500';
    if (status === WeekStatus.Present) return 'bg-teal-400 animate-pulse';
    if (isBeyondLifeExpectancy) return 'bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-700';
    return 'bg-slate-200 dark:bg-slate-700/50';
  };

  return (
    <div className="group relative w-full aspect-square">
      <div className={`w-full h-full rounded-sm ${getStatusClass()}`} />
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip}
      </div>
    </div>
  );
};

export default React.memo(TimeUnitBox);
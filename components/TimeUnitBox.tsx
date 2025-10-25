import React from 'react';
import { WeekStatus } from '../types';

interface TimeUnitBoxProps {
  status: WeekStatus;
  isBeyondLifeExpectancy: boolean;
  tooltip: string;
}

const TimeUnitBox: React.FC<TimeUnitBoxProps> = ({ status, isBeyondLifeExpectancy, tooltip }) => {
  const getStatusClass = () => {
    if (status === WeekStatus.Past) return 'bg-accent';
    if (status === WeekStatus.Present) return 'bg-accent-present animate-pulse';
    return 'bg-muted';
  };

  return (
    <div className="group relative w-full aspect-square">
      <div className={`w-full h-full rounded-sm border border-border ${getStatusClass()}`} />
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-card border border-border text-card-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip}
      </div>
    </div>
  );
};

export default React.memo(TimeUnitBox);
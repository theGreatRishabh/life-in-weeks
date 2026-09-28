import React from 'react';
import { WeekStatus } from '../types';

interface TimeUnitBoxProps {
  status: WeekStatus;
  isBeyondLifeExpectancy: boolean;
  tooltip: string;
  isPrintVersion?: boolean;
}

const TimeUnitBox: React.FC<TimeUnitBoxProps> = ({
  status,
  isBeyondLifeExpectancy,
  tooltip,
  isPrintVersion = false,
}) => {
  const getStatusStyles = () => {
    if (isPrintVersion) {
      if (status === WeekStatus.Past) {
        return 'bg-blue-600 border-blue-700';
      }
      if (status === WeekStatus.Present) {
        return 'bg-emerald-500 border-emerald-700 ring-1 ring-emerald-600';
      }
      if (isBeyondLifeExpectancy) {
        return 'bg-gray-100 border-gray-300 border-dashed opacity-40';
      }
      return 'bg-white border-gray-300';
    }

    if (status === WeekStatus.Past) {
      return 'bg-accent border-accent/60 hover:brightness-110';
    }
    if (status === WeekStatus.Present) {
      return 'bg-accent-present border-accent-present animate-pulse ring-2 ring-accent-present/50 z-10';
    }
    if (isBeyondLifeExpectancy) {
      return 'bg-muted/30 border-border/40 border-dashed opacity-50';
    }
    return 'bg-muted/40 border-border hover:bg-muted/80';
  };

  return (
    <div
      className="group relative w-full aspect-square"
      title={tooltip}
      aria-label={tooltip}
    >
      <div
        className={`w-full h-full rounded-[2px] border transition-transform duration-100 ${
          isPrintVersion ? '' : 'group-hover:scale-125 group-hover:z-20 group-hover:shadow-sm'
        } ${getStatusStyles()}`}
      />
      {!isPrintVersion && (
        <div className="hidden sm:block absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-card/95 backdrop-blur-sm border border-border text-card-foreground text-[11px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default React.memo(TimeUnitBox);

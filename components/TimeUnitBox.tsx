import React from 'react';
import { WeekStatus } from '../types';

interface TimeUnitBoxProps {
  status: WeekStatus;
  isBeyondLifeExpectancy: boolean;
  tooltip: string;
  isPrintVersion?: boolean;
}

// Static lookup tables — computed once, not on every render
const SCREEN_STATUS_CLASSES: Record<WeekStatus, string> = {
  [WeekStatus.Past]: 'bg-accent border-accent/60 hover:brightness-110',
  [WeekStatus.Present]: 'bg-accent-present border-accent-present animate-pulse ring-2 ring-accent-present/50 z-10',
  [WeekStatus.Future]: 'bg-muted/40 border-border hover:bg-muted/80',
};

const PRINT_STATUS_CLASSES: Record<WeekStatus, string> = {
  [WeekStatus.Past]: 'bg-blue-600 border-blue-700',
  [WeekStatus.Present]: 'bg-emerald-500 border-emerald-700 ring-1 ring-emerald-600',
  [WeekStatus.Future]: 'bg-white border-gray-300',
};

const TimeUnitBox: React.FC<TimeUnitBoxProps> = ({
  status,
  isBeyondLifeExpectancy,
  tooltip,
  isPrintVersion = false,
}) => {
  const getStatusStyles = () => {
    if (isPrintVersion) {
      if (isBeyondLifeExpectancy && status === WeekStatus.Future) {
        return 'bg-gray-100 border-gray-300 border-dashed opacity-40';
      }
      return PRINT_STATUS_CLASSES[status];
    }
    if (isBeyondLifeExpectancy && status === WeekStatus.Future) {
      return 'bg-muted/30 border-border/40 border-dashed opacity-50';
    }
    return SCREEN_STATUS_CLASSES[status];
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

import React from 'react';
import TimeUnitBox from './TimeUnitBox';
import { WeekStatus, TimeUnit } from '../types';

interface CalendarGridProps {
  totalElapsed: number;
  lifeExpectancy: number;
  timeUnit: TimeUnit;
}

const getGridConfig = (timeUnit: TimeUnit, lifeExpectancy: number) => {
  switch (timeUnit) {
    case 'Months':
      return { total: Math.ceil(lifeExpectancy * 12), cols: 12, unitName: 'Month' };
    case 'Years':
      return { total: Math.ceil(lifeExpectancy), cols: 10, unitName: 'Year' };
    case 'Weeks':
    default:
      return { total: Math.ceil(lifeExpectancy * 52.1775), cols: 52, unitName: 'Week' };
  }
};

const CalendarGrid: React.FC<CalendarGridProps> = ({ totalElapsed, lifeExpectancy, timeUnit }) => {
  const { total, cols, unitName } = getGridConfig(timeUnit, lifeExpectancy);
  const totalRows = Math.ceil(total / cols);

  const shouldShowYAxis = timeUnit === 'Weeks';
  const gridStartColumn = shouldShowYAxis ? 3 : 1;

  const renderYAxisLabels = () => {
    const labels = [];
    for (let i = 0; i < totalRows; i++) {
      const age = i;
      if (age === 0 || age % 5 === 0) {
        labels.push(
          <div key={`y-${i}`} style={{ gridRow: i + 3, gridColumn: 2 }} className="text-right text-xs text-slate-400 dark:text-slate-500 pr-2 pt-0.5">
            {age}
          </div>
        );
      }
    }
    return labels;
  };

  const renderXAxisLabels = () => {
    const labels = [];
    const interval = cols <= 12 ? 1 : 5;
    for (let i = 1; i <= cols; i++) {
        if (i === 1 || i % interval === 0) {
            labels.push(
                <div key={`x-${i}`} style={{ gridColumn: i + gridStartColumn -1, gridRow: 2 }} className="text-center text-xs text-slate-400 dark:text-slate-500 pb-2">
                    {i}
                </div>
            );
        }
    }
    return labels;
  };
  
  const renderGrid = () => {
    const grid = [];
    for (let i = 0; i < total; i++) {
      let status: WeekStatus;
      if (i < totalElapsed) {
        status = WeekStatus.Past;
      } else if (i === totalElapsed) {
        status = WeekStatus.Present;
      } else {
        status = WeekStatus.Future;
      }
      
      const row = Math.floor(i / cols) + 3;
      const col = (i % cols) + gridStartColumn;

      grid.push(
        <div key={i} style={{gridRow: row, gridColumn: col}}>
            <TimeUnitBox
              status={status}
              isBeyondLifeExpectancy={i >= Math.floor(lifeExpectancy * (timeUnit === 'Weeks' ? 52.1775 : timeUnit === 'Months' ? 12 : 1))}
              tooltip={`${unitName} ${i + 1}`}
            />
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-800">
      <div 
        className="grid gap-1 items-start"
        style={{ 
            gridTemplateColumns: `${shouldShowYAxis ? 'auto auto ' : ''}repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `auto auto repeat(${totalRows}, minmax(0, 1fr))`
        }}
      >
          {/* Y Axis Title */}
          {shouldShowYAxis && (
            <div 
              style={{ gridColumn: 1, gridRow: `3 / span ${totalRows}` }} 
              className="sticky left-0 flex items-center justify-center [writing-mode:vertical-rl] rotate-180 self-center"
            >
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-wider">Age</span>
            </div>
          )}

          {/* X Axis Title */}
          <div 
            style={{ gridColumn: `${gridStartColumn} / span ${cols}`, gridRow: 1 }}
            className="text-center py-2"
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-wider">{timeUnit}</span>
          </div>

          {/* X-axis labels */}
          {renderXAxisLabels()}

          {/* Y-axis labels */}
          {shouldShowYAxis && renderYAxisLabels()}

          {/* Grid Boxes */}
          {renderGrid()}
      </div>
    </div>
  );
};

export default CalendarGrid;
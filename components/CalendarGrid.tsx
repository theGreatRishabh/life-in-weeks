import React, { useState } from 'react';
import TimeUnitBox from './TimeUnitBox';
import { WeekStatus, TimeUnit } from '../types';

interface CalendarGridProps {
  totalElapsed: number;
  lifeExpectancy: number;
  timeUnit: TimeUnit;
  isPrintVersion?: boolean;
}

const getGridConfig = (timeUnit: TimeUnit, lifeExpectancy: number) => {
  switch (timeUnit) {
    case 'Months':
      return { total: Math.ceil(lifeExpectancy * 12), cols: 12, unitName: 'Month', xInterval: 1 };
    case 'Years':
      return { total: Math.ceil(lifeExpectancy), cols: 10, unitName: 'Year', xInterval: 1 };
    case 'Weeks':
    default:
      return { total: Math.ceil(lifeExpectancy * 52.1775), cols: 52, unitName: 'Week', xInterval: 5 };
  }
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  totalElapsed,
  lifeExpectancy,
  timeUnit,
  isPrintVersion = false,
}) => {
  const [zoom, setZoom] = useState<'compact' | 'normal' | 'large'>('normal');
  const { total, cols, unitName, xInterval } = getGridConfig(timeUnit, lifeExpectancy);
  const totalRows = Math.ceil(total / cols);

  // Show Y-Axis age labels for all views
  const gridStartColumn = 3;

  const renderYAxisLabels = () => {
    const labels = [];
    const step = timeUnit === 'Years' ? 1 : 5;
    for (let i = 0; i < totalRows; i++) {
      const ageLabel = timeUnit === 'Years' ? `${i * 10}` : `${i}`;
      if (i === 0 || i % step === 0) {
        labels.push(
          <div
            key={`y-${i}`}
            style={{ gridRow: i + 3, gridColumn: 2 }}
            className={`text-right text-[10px] sm:text-xs text-muted-foreground font-mono pr-2 pt-0.5 select-none ${
              !isPrintVersion ? 'sticky left-5 sm:left-6 bg-card z-10' : ''
            }`}
          >
            {ageLabel}
          </div>
        );
      }
    }
    return labels;
  };

  const renderXAxisLabels = () => {
    const labels = [];
    for (let i = 1; i <= cols; i++) {
      if (i === 1 || i % xInterval === 0 || i === cols) {
        labels.push(
          <div
            key={`x-${i}`}
            style={{ gridColumn: i + gridStartColumn - 1, gridRow: 2 }}
            className="text-center text-[10px] sm:text-xs text-muted-foreground font-mono pb-1 select-none"
          >
            {i}
          </div>
        );
      }
    }
    return labels;
  };

  const renderGrid = () => {
    const grid = [];
    const expectancyTotal = Math.floor(
      lifeExpectancy * (timeUnit === 'Weeks' ? 52.1775 : timeUnit === 'Months' ? 12 : 1)
    );

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
      const currentAge = timeUnit === 'Weeks' ? Math.floor(i / 52) : timeUnit === 'Months' ? Math.floor(i / 12) : i;

      grid.push(
        <div key={i} style={{ gridRow: row, gridColumn: col }} className="flex items-center justify-center">
          <TimeUnitBox
            status={status}
            isBeyondLifeExpectancy={i >= expectancyTotal}
            tooltip={`${unitName} ${i + 1} (Age ${currentAge})`}
            isPrintVersion={isPrintVersion}
          />
        </div>
      );
    }
    return grid;
  };

  // Min-width for the grid container based on time unit and zoom
  const getMinWidthClass = () => {
    if (isPrintVersion) return 'w-full';
    if (timeUnit === 'Weeks') {
      if (zoom === 'compact') return 'min-w-[620px]';
      if (zoom === 'large') return 'min-w-[960px]';
      return 'min-w-[740px]';
    }
    return 'w-full min-w-0';
  };

  const getGapClass = () => {
    if (isPrintVersion) {
      return timeUnit === 'Weeks' ? 'gap-[1.5px]' : 'gap-1';
    }
    if (timeUnit === 'Weeks') {
      if (zoom === 'compact') return 'gap-[1px] sm:gap-[1.5px]';
      if (zoom === 'large') return 'gap-[3px] sm:gap-1';
      return 'gap-[2px] sm:gap-[2.5px]';
    }
    return 'gap-1.5 sm:gap-2';
  };

  return (
    <div className={`w-full ${isPrintVersion ? 'p-1' : 'p-3 sm:p-5'}`}>
      {/* Header controls & Legend for on-screen view */}
      {!isPrintVersion && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px] bg-accent border border-accent/60 inline-block" />
              <span>Past ({totalElapsed.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px] bg-accent-present border border-accent-present animate-pulse inline-block" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px] bg-muted/40 border border-border inline-block" />
              <span>Remaining ({Math.max(0, total - totalElapsed).toLocaleString()})</span>
            </div>
          </div>

          {/* Zoom controls for Weeks view */}
          {timeUnit === 'Weeks' && (
            <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg p-0.5 text-xs">
              <span className="text-muted-foreground px-2 py-0.5 text-[11px] hidden sm:inline">Density:</span>
              <button
                type="button"
                onClick={() => setZoom('compact')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  zoom === 'compact'
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Fit more squares on screen"
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setZoom('normal')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  zoom === 'normal'
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Standard grid spacing"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setZoom('large')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  zoom === 'large'
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Larger squares for easy viewing"
              >
                Comfortable
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile scroll hint for Weeks view */}
      {!isPrintVersion && timeUnit === 'Weeks' && (
        <div className="sm:hidden text-center text-[11px] text-muted-foreground/80 mb-2 flex items-center justify-center gap-1">
          <span>⇄ Swipe horizontally to see all 52 weeks</span>
        </div>
      )}

      {/* Grid container with horizontal scroll handling */}
      <div className={`w-full ${isPrintVersion ? 'overflow-visible' : 'overflow-x-auto scrollbar-thin overscroll-contain'}`}>
        <div
          className={`${getMinWidthClass()} grid ${getGapClass()} items-start transition-all`}
          style={{
            gridTemplateColumns: `auto auto repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `auto auto repeat(${totalRows}, minmax(0, 1fr))`,
          }}
        >
          {/* Y Axis Title */}
          <div
            style={{ gridColumn: 1, gridRow: `3 / span ${totalRows}` }}
            className={`flex items-center justify-center [writing-mode:vertical-rl] rotate-180 self-center select-none ${
              !isPrintVersion ? 'sticky left-0 bg-card z-10 py-2' : ''
            }`}
          >
            <span className="text-[11px] sm:text-xs font-bold text-foreground/80 tracking-wider">
              {timeUnit === 'Years' ? 'Decade' : 'Age'}
            </span>
          </div>

          {/* X Axis Title */}
          <div
            style={{ gridColumn: `${gridStartColumn} / span ${cols}`, gridRow: 1 }}
            className="text-center py-1 sm:py-2 select-none"
          >
            <span className="text-xs sm:text-sm font-bold text-foreground/90 tracking-wider">
              {unitName} of Year
            </span>
          </div>

          {/* X-axis labels */}
          {renderXAxisLabels()}

          {/* Y-axis labels */}
          {renderYAxisLabels()}

          {/* Grid Boxes */}
          {renderGrid()}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

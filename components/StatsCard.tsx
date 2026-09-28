import React from 'react';
import { TimeUnit } from '../types';

interface StatsCardProps {
  years: number;
  months: number;
  weeks: number;
  totalElapsed: number;
  totalUnits: number;
  timeUnit: TimeUnit;
  lifeExpectancy: number;
  percentage: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  years,
  months,
  weeks,
  totalElapsed,
  totalUnits,
  timeUnit,
  lifeExpectancy,
  percentage,
}) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;
  const remainingUnits = Math.max(0, totalUnits - totalElapsed);

  return (
    <div className="bg-card border border-border rounded-xl shadow-md p-4 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Progress Circular Gauge */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
            {/* Background Track */}
            <circle
              className="text-muted/60"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="55"
              cy="55"
            />
            {/* Progress Arc */}
            <circle
              className="text-primary transition-all duration-700 ease-out"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="55"
              cy="55"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground leading-none">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
              Elapsed
            </span>
          </div>
        </div>

        {/* Text Breakdown */}
        <div className="text-center sm:text-left flex-1 space-y-2">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-card-foreground leading-snug">
            You are <span className="text-primary font-extrabold">{years}</span> years,{' '}
            <span className="text-primary font-extrabold">{months}</span> months, and{' '}
            <span className="text-primary font-extrabold">{weeks}</span> weeks old.
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Based on an expected lifespan of{' '}
            <span className="font-semibold text-foreground">{lifeExpectancy.toFixed(1)}</span> years.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-muted/40 rounded-lg p-2 text-center sm:text-left border border-border/50">
              <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Lived</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {totalElapsed.toLocaleString()} {timeUnit.toLowerCase()}
              </span>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 text-center sm:text-left border border-border/50">
              <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Remaining</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {remainingUnits.toLocaleString()} {timeUnit.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

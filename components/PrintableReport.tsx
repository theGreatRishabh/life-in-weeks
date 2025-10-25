import React from 'react';
import CalendarGrid from './CalendarGrid';
import { TimeUnit } from '../types';

interface PrintableReportProps {
  timeUnit: TimeUnit;
  years: number;
  months: number;
  weeks: number;
  totalElapsed: number;
  lifeExpectancy: number;
  percentage: number;
}

const PrintableReport: React.FC<PrintableReportProps> = ({
  timeUnit,
  years,
  months,
  weeks,
  totalElapsed,
  lifeExpectancy,
  percentage,
}) => {
  const circumference = 2 * Math.PI * 50; // 2 * pi * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    // Fixed width for consistent, high-quality canvas rendering
    <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden w-[1200px]">
      <div className="p-8 border-b border-border">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">
            Your Life in {timeUnit}
          </h1>
          <p className="text-muted-foreground mt-2">
            Each square represents one {timeUnit.slice(0, -1).toLowerCase()} of your life.
          </p>
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle
                className="text-muted"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
              />
              <circle
                className="text-primary"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
              {percentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xl md:text-2xl text-card-foreground">
              You are <span className="font-bold text-primary">{years}</span> years,{' '}
              <span className="font-bold text-primary">{months}</span> months, and{' '}
              <span className="font-bold text-primary">{weeks}</span> weeks old.
            </p>
          </div>
        </div>
      </div>

      <CalendarGrid
        totalElapsed={totalElapsed}
        lifeExpectancy={lifeExpectancy}
        timeUnit={timeUnit}
      />
      <div className="p-4 text-center text-sm text-muted-foreground border-t border-border bg-muted/50">
        Based on a life expectancy of {lifeExpectancy.toFixed(1)} years.
      </div>
    </div>
  );
};

export default PrintableReport;

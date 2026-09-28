import React from 'react';
import CalendarGrid from './CalendarGrid';
import { TimeUnit } from '../types';

interface PrintableReportProps {
  timeUnit: TimeUnit;
  birthDate: Date;
  years: number;
  months: number;
  weeks: number;
  totalElapsed: number;
  totalUnits: number;
  lifeExpectancy: number;
  percentage: number;
  includeStats?: boolean;
  isForExportCanvas?: boolean;
}

const PrintableReport: React.FC<PrintableReportProps> = ({
  timeUnit,
  birthDate,
  years,
  months,
  weeks,
  totalElapsed,
  totalUnits,
  lifeExpectancy,
  percentage,
  includeStats = true,
  isForExportCanvas = false,
}) => {
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const formattedBirthDate = birthDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const remainingUnits = Math.max(0, totalUnits - totalElapsed);

  return (
    <div
      className={`bg-white text-gray-900 border border-gray-200 rounded-xl overflow-hidden print:border-none print:shadow-none print:rounded-none ${
        isForExportCanvas ? 'w-[1200px] shadow-2xl p-8' : 'w-full max-w-full p-4 sm:p-6 print:p-2'
      }`}
    >
      {/* Header */}
      <header className="text-center pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Your Life in {timeUnit}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
          Born {formattedBirthDate} &bull; Life Expectancy: {lifeExpectancy.toFixed(1)} Years ({totalUnits.toLocaleString()} {timeUnit.toLowerCase()})
        </p>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 text-xs text-gray-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-600 border border-blue-700 inline-block" />
            <span className="font-medium">Lived ({totalElapsed.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-emerald-500 border border-emerald-600 inline-block" />
            <span className="font-medium">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-white border border-gray-300 inline-block" />
            <span className="font-medium">Remaining ({remainingUnits.toLocaleString()})</span>
          </div>
        </div>
      </header>

      {/* Conditional Stats Section */}
      {includeStats && (
        <section className="py-4 px-2 border-b border-gray-200 flex flex-row items-center justify-center gap-6 print:py-3">
          {/* Progress Ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl font-bold text-gray-900 leading-none">
                {percentage.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                Lived
              </span>
            </div>
          </div>

          {/* Age Summary & Stat Pills */}
          <div className="text-left space-y-1.5">
            <p className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
              You are <span className="text-blue-600 font-bold">{years}</span> years,{' '}
              <span className="text-blue-600 font-bold">{months}</span> months, and{' '}
              <span className="text-blue-600 font-bold">{weeks}</span> weeks old.
            </p>
            <p className="text-xs text-gray-600 font-medium">
              {totalElapsed.toLocaleString()} {timeUnit.toLowerCase()} lived &bull;{' '}
              {remainingUnits.toLocaleString()} {timeUnit.toLowerCase()} remaining
            </p>
          </div>
        </section>
      )}

      {/* Calendar Grid */}
      <main className="py-2">
        <CalendarGrid
          totalElapsed={totalElapsed}
          lifeExpectancy={lifeExpectancy}
          timeUnit={timeUnit}
          isPrintVersion={true}
        />
      </main>

      {/* Footer */}
      <footer className="pt-2 pb-1 text-center text-[11px] text-gray-500 border-t border-gray-200 mt-2">
        <span>
          Each square represents one {timeUnit.slice(0, -1).toLowerCase()} of your life &bull; Memento Mori
        </span>
      </footer>
    </div>
  );
};

export default PrintableReport;

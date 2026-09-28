import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DateInput from './components/DateInput';
import CalendarGrid from './components/CalendarGrid';
import StatsCard from './components/StatsCard';
import ThemeToggle from './components/ThemeToggle';
import { TimeUnit } from './types';
import PrintableReport from './components/PrintableReport';
import Logo from './components/Logo';

declare const html2canvas: any;

const App: React.FC = () => {
  const [birthDate, setBirthDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const dob = params.get('dob');
    if (dob) {
      const parsed = new Date(dob);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    try {
      const savedDate = localStorage.getItem('birthDate');
      if (savedDate) {
        const parsedDate = new Date(savedDate);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return new Date(1996, 4, 3);
  });

  const [lifeExpectancy, setLifeExpectancy] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseFloat(params.get('le') || '80');
  });

  const [timeUnit, setTimeUnit] = useState<TimeUnit>(() => {
    const params = new URLSearchParams(window.location.search);
    const unit = params.get('unit');
    if (unit === 'Weeks' || unit === 'Months' || unit === 'Years') {
      return unit;
    }
    return 'Weeks';
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('country') || 'custom';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // Ignore localStorage errors
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // User preference for export: whether to include stats summary or just calendar
  const [includeStatsInExport, setIncludeStatsInExport] = useState<boolean>(true);
  const [activePrintIncludeStats, setActivePrintIncludeStats] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('birthDate', birthDate.toISOString());
    } catch {
      // Ignore localStorage errors
    }
  }, [birthDate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  const { years, months, weeks, totalElapsed, totalUnits } = useMemo(() => {
    const now = new Date();
    const birth = new Date(birthDate);

    let ageYears = now.getFullYear() - birth.getFullYear();
    let ageMonths = now.getMonth() - birth.getMonth();
    let ageDays = now.getDate() - birth.getDate();

    if (ageDays < 0) {
      ageMonths--;
      const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      ageDays += daysInPrevMonth;
    }

    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    const ageWeeks = Math.floor(ageDays / 7);
    const diffTime = now.getTime() - birth.getTime();
    const totalElapsedWeeks = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)));

    let totalElapsedMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) {
      totalElapsedMonths--;
    }
    totalElapsedMonths = Math.max(0, totalElapsedMonths);

    const totalElapsedYears = Math.max(0, ageYears);
    const totalWeeks = Math.ceil(lifeExpectancy * 52.1775);
    const totalMonths = Math.ceil(lifeExpectancy * 12);
    const totalYears = Math.ceil(lifeExpectancy);

    switch (timeUnit) {
      case 'Months':
        return {
          years: ageYears,
          months: ageMonths,
          weeks: ageWeeks,
          totalElapsed: totalElapsedMonths,
          totalUnits: totalMonths,
        };
      case 'Years':
        return {
          years: ageYears,
          months: ageMonths,
          weeks: ageWeeks,
          totalElapsed: totalElapsedYears,
          totalUnits: totalYears,
        };
      case 'Weeks':
      default:
        return {
          years: ageYears,
          months: ageMonths,
          weeks: ageWeeks,
          totalElapsed: totalElapsedWeeks,
          totalUnits: totalWeeks,
        };
    }
  }, [birthDate, lifeExpectancy, timeUnit]);

  const percentage = totalUnits > 0 ? (totalElapsed / totalUnits) * 100 : 0;

  // Handle Download with option to include or exclude stats
  const handleDownload = useCallback(
    (withStats: boolean = includeStatsInExport) => {
      setIsDownloading(true);
      const targetId = withStats ? 'export-content-with-stats' : 'export-content-calendar-only';
      const element = document.getElementById(targetId);

      if (element && typeof html2canvas !== 'undefined') {
        html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2, // High resolution retina capture
          useCORS: true,
          logging: false,
        })
          .then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            const suffix = withStats ? 'report' : 'calendar-only';
            link.download = `your-life-in-${timeUnit.toLowerCase()}-${suffix}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          })
          .catch((err: any) => {
            console.error('Error rendering image', err);
          })
          .finally(() => {
            setIsDownloading(false);
          });
      } else {
        setIsDownloading(false);
      }
    },
    [includeStatsInExport, timeUnit]
  );

  // Handle Print with option to include or exclude stats
  const handlePrint = useCallback(
    (withStats: boolean = includeStatsInExport) => {
      setActivePrintIncludeStats(withStats);
      // Allow state to propagate before opening native print dialog
      setTimeout(() => {
        window.print();
      }, 50);
    },
    [includeStatsInExport]
  );

  return (
    <>
      {/* ============================================================== */}
      {/* 1. NATIVE PRINT CONTAINER (Hidden on-screen, active in @media print) */}
      {/* ============================================================== */}
      <div className="print-only" id="print-root">
        <PrintableReport
          timeUnit={timeUnit}
          birthDate={birthDate}
          years={years}
          months={months}
          weeks={weeks}
          totalElapsed={totalElapsed}
          totalUnits={totalUnits}
          lifeExpectancy={lifeExpectancy}
          percentage={percentage}
          includeStats={activePrintIncludeStats}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. OFF-SCREEN CAPTURE CONTAINERS (For html2canvas image downloads) */}
      {/* ============================================================== */}
      <div
        id="export-canvas-container"
        className="fixed -left-[99999px] top-0 pointer-events-none select-none"
        aria-hidden="true"
      >
        <div id="export-content-with-stats">
          <PrintableReport
            timeUnit={timeUnit}
            birthDate={birthDate}
            years={years}
            months={months}
            weeks={weeks}
            totalElapsed={totalElapsed}
            totalUnits={totalUnits}
            lifeExpectancy={lifeExpectancy}
            percentage={percentage}
            includeStats={true}
            isForExportCanvas={true}
          />
        </div>
        <div id="export-content-calendar-only">
          <PrintableReport
            timeUnit={timeUnit}
            birthDate={birthDate}
            years={years}
            months={months}
            weeks={weeks}
            totalElapsed={totalElapsed}
            totalUnits={totalUnits}
            lifeExpectancy={lifeExpectancy}
            percentage={percentage}
            includeStats={false}
            isForExportCanvas={true}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. ON-SCREEN RESPONSIVE APPLICATION UI                         */}
      {/* ============================================================== */}
      <div className="no-print min-h-screen flex flex-col p-3 sm:p-5 md:p-8 bg-background text-foreground transition-colors">
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
          {/* Header */}
          <header className="mb-6 sm:mb-8 pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1.5">
                  <span>Interactive Life Calendar</span>
                  <span className="text-muted-foreground/60">&bull;</span>
                  <span className="text-muted-foreground font-normal">Bryan Braun Inspired</span>
                </div>
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <Logo className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md shrink-0" />
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-blue-500 to-secondary bg-clip-text text-transparent">
                    Your Life in {timeUnit}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Each square represents one {timeUnit.slice(0, -1).toLowerCase()} of your life journey.
                </p>
              </div>

              {/* Theme toggle and quick stats badge */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right hidden md:block">
                  <span className="block text-xs font-bold text-foreground">
                    {years}y {months}m lived
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {percentage.toFixed(1)}% of {lifeExpectancy} yrs
                  </span>
                </div>
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
            </div>
          </header>

          {/* Main Grid Layout */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start flex-grow">
            {/* Left Column: Stats & Controls */}
            <section className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
              <StatsCard
                years={years}
                months={months}
                weeks={weeks}
                totalElapsed={totalElapsed}
                totalUnits={totalUnits}
                timeUnit={timeUnit}
                lifeExpectancy={lifeExpectancy}
                percentage={percentage}
              />

              <DateInput
                birthDate={birthDate}
                setBirthDate={setBirthDate}
                lifeExpectancy={lifeExpectancy}
                setLifeExpectancy={setLifeExpectancy}
                timeUnit={timeUnit}
                setTimeUnit={setTimeUnit}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                onDownload={handleDownload}
                onPrint={handlePrint}
                includeStats={includeStatsInExport}
                setIncludeStats={setIncludeStatsInExport}
                isDownloading={isDownloading}
                shareData={{
                  dob: birthDate.toISOString().split('T')[0],
                  le: lifeExpectancy,
                  unit: timeUnit,
                  country: selectedCountry,
                }}
              />
            </section>

            {/* Right Column: Interactive Calendar Grid */}
            <section className="lg:col-span-7 xl:col-span-8 bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-card-foreground">Life Grid</h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({totalElapsed.toLocaleString()} / {totalUnits.toLocaleString()} {timeUnit.toLowerCase()})
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {lifeExpectancy} Year Horizon
                </span>
              </div>

              <CalendarGrid
                totalElapsed={totalElapsed}
                lifeExpectancy={lifeExpectancy}
                timeUnit={timeUnit}
              />
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import DateInput from './components/DateInput';
import CalendarGrid from './components/CalendarGrid';
import StatsCard from './components/StatsCard';
import ThemeToggle from './components/ThemeToggle';
import { TimeUnit } from './types';
import PrintableReport from './components/PrintableReport';

const App: React.FC = () => {
  const [birthDate, setBirthDate] = useState(() => {
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
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
    return new Date(1996, 4, 3);
  });

  const [lifeExpectancy, setLifeExpectancy] = useState(() => {
     const params = new URLSearchParams(window.location.search);
     return parseFloat(params.get('le') || '90');
  });

  const [timeUnit, setTimeUnit] = useState<TimeUnit>(() => {
    const params = new URLSearchParams(window.location.search);
    const unit = params.get('unit');
    if (unit === 'Weeks' || unit === 'Months' || unit === 'Years') {
        return unit;
    }
    return 'Weeks';
  });

  const [selectedCountry, setSelectedCountry] = useState(() => {
    return new URLSearchParams(window.location.search).get('country') || 'custom';
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
    } catch (error) {
        console.error("Error reading theme from localStorage", error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('birthDate', birthDate.toISOString());
    } catch (error) {
      console.error("Error writing to localStorage", error);
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
      } catch (error) {
          console.error("Error saving theme to localStorage", error);
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
    const totalElapsedWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    let totalElapsedMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) {
        totalElapsedMonths--;
    }

    const totalElapsedYears = ageYears;
    const totalWeeks = Math.ceil(lifeExpectancy * 52.1775);
    const totalMonths = Math.ceil(lifeExpectancy * 12);
    const totalYears = Math.ceil(lifeExpectancy);

    switch (timeUnit) {
      case 'Months':
        return { years: ageYears, months: ageMonths, weeks: ageWeeks, totalElapsed: totalElapsedMonths, totalUnits: totalMonths };
      case 'Years':
        return { years: ageYears, months: ageMonths, weeks: ageWeeks, totalElapsed: totalElapsedYears, totalUnits: totalYears };
      case 'Weeks':
      default:
        return { years: ageYears, months: ageMonths, weeks: ageWeeks, totalElapsed: totalElapsedWeeks, totalUnits: totalWeeks };
    }
  }, [birthDate, lifeExpectancy, timeUnit]);
  
  const percentage = totalUnits > 0 ? (totalElapsed / totalUnits) * 100 : 0;

  const handleDownload = () => {
    const element = document.getElementById('printable-content-area');
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (element) {
        // @ts-ignore
        html2canvas(element, { 
          backgroundColor: isDarkMode ? 'hsl(240, 10%, 3.9%)' : 'hsl(240, 5.2%, 96.1%)',
          useCORS: true, 
          allowTaint: true 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `your-life-in-${timeUnit.toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  return (
    <>
      {/* Off-screen container for high-quality printing and downloading */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <div id="print-area" className="p-8">
          <div id="printable-content-area">
            <PrintableReport
              timeUnit={timeUnit}
              years={years}
              months={months}
              weeks={weeks}
              totalElapsed={totalElapsed}
              lifeExpectancy={lifeExpectancy}
              percentage={percentage}
            />
          </div>
        </div>
      </div>

      {/* On-screen UI */}
      <div className="w-full p-4 md:p-8 flex-grow flex">
        <div className="max-w-screen-2xl mx-auto w-full">
          <header className="text-center relative mb-8 no-print">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Your Life in {timeUnit}
            </h1>
            <p className="text-muted-foreground mt-2">
              Each square represents one {timeUnit.slice(0, -1).toLowerCase()} of your life.
            </p>
            <div className="absolute top-0 right-0">
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8 no-print">
              <StatsCard
                years={years}
                months={months}
                weeks={weeks}
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
                shareData={{
                  dob: birthDate.toISOString().split('T')[0],
                  le: lifeExpectancy,
                  unit: timeUnit,
                  country: selectedCountry
                }}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <CalendarGrid
                totalElapsed={totalElapsed}
                lifeExpectancy={lifeExpectancy}
                timeUnit={timeUnit}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
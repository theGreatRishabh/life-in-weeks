import React, { useState, useEffect, useMemo } from 'react';
import DateInput from './components/DateInput';
import CalendarGrid from './components/CalendarGrid';
import StatsCard from './components/StatsCard';
import ActionBar from './components/ActionBar';
import ThemeToggle from './components/ThemeToggle';
import { TimeUnit } from './types';

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

    // --- Accurate age calculation for display ---
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

    // --- Accurate total elapsed units for grid ---
    const diffTime = now.getTime() - birth.getTime();
    const totalElapsedWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    let totalElapsedMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) {
        totalElapsedMonths--;
    }

    const totalElapsedYears = ageYears; // This is by definition the number of full years passed.

    // --- Total units based on life expectancy ---
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
  
  const handleDownload = () => {
    const element = document.getElementById('print-area');
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (element) {
        // @ts-ignore
        html2canvas(element, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'your-life-in-weeks.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };


  return (
    <div className="min-h-full p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 relative">
        <aside className="md:col-span-1 lg:col-span-1">
          <DateInput
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            lifeExpectancy={lifeExpectancy}
            setLifeExpectancy={setLifeExpectancy}
            timeUnit={timeUnit}
            setTimeUnit={setTimeUnit}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />
        </aside>

        <main id="print-area" className="md:col-span-2 lg:col-span-3 space-y-8">
            <div className="absolute top-0 right-0">
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500">
                    Your Life in {timeUnit}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Each square represents one {timeUnit.slice(0, -1).toLowerCase()} of your life.
                </p>
            </header>

            <StatsCard
                years={years}
                months={months}
                weeks={weeks}
                lifeExpectancy={lifeExpectancy}
                percentage={totalUnits > 0 ? (totalElapsed / totalUnits) * 100 : 0}
            />
            
            <ActionBar
                onDownload={handleDownload}
                shareData={{
                    dob: birthDate.toISOString().split('T')[0],
                    le: lifeExpectancy,
                    unit: timeUnit,
                    country: selectedCountry
                }}
            />

            <CalendarGrid
                totalElapsed={totalElapsed}
                lifeExpectancy={lifeExpectancy}
                timeUnit={timeUnit}
            />
        </main>
      </div>
    </div>
  );
};

export default App;
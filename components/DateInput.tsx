import React, { useState, useEffect, useCallback } from 'react';
import { TimeUnit } from '../types';
import ActionBar from './ActionBar';
import { POPULAR_COUNTRIES, CountryInfo } from '../data/countries';

interface DateInputProps {
  birthDate: Date;
  setBirthDate: (date: Date) => void;
  lifeExpectancy: number;
  setLifeExpectancy: (value: number) => void;
  timeUnit: TimeUnit;
  setTimeUnit: (unit: TimeUnit) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  onDownload: (includeStats: boolean) => void;
  onPrint: (includeStats: boolean) => void;
  shareData: { [key: string]: any };
  includeStats: boolean;
  setIncludeStats: (value: boolean) => void;
  isDownloading?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ChevronDown = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const DateInput: React.FC<DateInputProps> = ({
  birthDate,
  setBirthDate,
  lifeExpectancy,
  setLifeExpectancy,
  timeUnit,
  setTimeUnit,
  selectedCountry,
  setSelectedCountry,
  onDownload,
  onPrint,
  shareData,
  includeStats,
  setIncludeStats,
  isDownloading = false,
}) => {
  const [month, setMonth] = useState(birthDate.getMonth());
  const [day, setDay] = useState(birthDate.getDate());
  const [year, setYear] = useState(birthDate.getFullYear());

  const [countries, setCountries] = useState<CountryInfo[]>(POPULAR_COUNTRIES);
  const [isLoadingExpectancy, setIsLoadingExpectancy] = useState(false);
  const [sourceYear, setSourceYear] = useState<string | null>(null);
  const [customLifeExpectancy, setCustomLifeExpectancy] = useState(lifeExpectancy);

  // Sync state if birthDate prop changes externally (e.g. URL query params)
  useEffect(() => {
    setMonth(birthDate.getMonth());
    setDay(birthDate.getDate());
    setYear(birthDate.getFullYear());
  }, [birthDate]);

  useEffect(() => {
    setCustomLifeExpectancy(lifeExpectancy);
  }, [lifeExpectancy]);

  useEffect(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(day, daysInMonth);
    const newDate = new Date(year, month, clampedDay);
    if (
      !isNaN(newDate.getTime()) &&
      newDate.getFullYear() === year &&
      newDate.getMonth() === month
    ) {
      if (newDate <= new Date()) {
        setBirthDate(newDate);
      }
    }
  }, [month, day, year, setBirthDate]);

  // Optionally fetch expanded countries from World Bank
  useEffect(() => {
    fetch('https://api.worldbank.org/v2/country?format=json&per_page=300')
      .then(res => res.json())
      .then(data => {
        if (data && data[1]) {
          const apiCountries: CountryInfo[] = data[1]
            .filter((c: any) => c.region && c.region.value !== 'Aggregates')
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              expectancy: 75.0,
            }));

          const seen = new Set<string>();
          const merged: CountryInfo[] = [];

          POPULAR_COUNTRIES.forEach(c => { seen.add(c.id); merged.push(c); });
          apiCountries.forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); } });

          setCountries(merged);
        }
      })
      .catch(() => {
        // Fallback already in place with POPULAR_COUNTRIES
      });
  }, []);

  const fetchLifeExpectancy = useCallback(
    (countryCode: string) => {
      if (countryCode === 'custom') {
        setSelectedCountry('custom');
        setLifeExpectancy(customLifeExpectancy);
        setSourceYear(null);
        return;
      }

      const found = POPULAR_COUNTRIES.find(c => c.id === countryCode);
      if (found && found.expectancy) {
        setLifeExpectancy(found.expectancy);
        setCustomLifeExpectancy(found.expectancy);
      }

      setIsLoadingExpectancy(true);
      fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.DYN.LE00.IN?format=json&per_page=1&date=2000:2024`
      )
        .then(res => res.json())
        .then(data => {
          if (data && data[1] && data[1][0] && data[1][0].value) {
            const val = parseFloat(data[1][0].value.toFixed(1));
            setLifeExpectancy(val);
            setCustomLifeExpectancy(val);
            setSourceYear(`World Bank (${data[1][0].date})`);
          } else if (found) {
            setSourceYear('Standard benchmark');
          } else {
            setSourceYear('Estimated average');
          }
        })
        .catch(() => {
          setSourceYear(found ? 'Benchmark data' : null);
        })
        .finally(() => setIsLoadingExpectancy(false));
    },
    [setLifeExpectancy, customLifeExpectancy, setSelectedCountry]
  );

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountry(code);
    if (code !== 'custom') fetchLifeExpectancy(code);
  };

  const handleCustomLEChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setCustomLifeExpectancy(value);
      if (selectedCountry === 'custom') setLifeExpectancy(value);
    }
  };

  const sel =
    'w-full bg-background border border-border rounded-lg p-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground text-xs sm:text-sm';

  return (
    <div className="bg-card border border-border rounded-xl shadow-md p-4 sm:p-5 space-y-4">

      {/* ── Row 1: Two columns ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left — Your Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Your Details</h2>
          </div>

          {/* Row A label */}
          <label className="block text-xs font-semibold text-foreground/80">
            Date of Birth
          </label>
          {/* Row A input */}
          <div className="relative">
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value, 10))}
              className={`${sel} appearance-none pr-6 font-medium`}
              aria-label="Birth Month"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted-foreground">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Row B label */}
          <label className="block text-xs font-semibold text-foreground/80">
            Day &amp; Year
          </label>
          {/* Row B inputs */}
          <div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={day}
                onChange={e => setDay(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                min="1" max="31"
                placeholder="Day"
                aria-label="Birth Day"
                className={`${sel} text-center font-medium`}
              />
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                min="1900"
                max={new Date().getFullYear()}
                placeholder="Year"
                aria-label="Birth Year"
                className={`${sel} text-center font-medium`}
              />
            </div>
            {/* Spacer matches the subtext line in the right column */}
            <p className="text-[11px] text-transparent mt-1 min-h-[16px] select-none">&nbsp;</p>
          </div>
        </div>

        {/* Right — Life Expectancy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded-md bg-secondary/10 text-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Life Expectancy</h2>
          </div>

          {/* Row A label */}
          <label htmlFor="based-on" className="block text-xs font-semibold text-foreground/80">
            Country Average
          </label>
          {/* Row A input */}
          <div className="relative">
            <select
              id="based-on"
              value={selectedCountry}
              onChange={handleCountryChange}
              className={`${sel} appearance-none pr-7 font-medium`}
            >
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown />
            </div>
          </div>

          {/* Row B label */}
          <label htmlFor="expected-age" className="block text-xs font-semibold text-foreground/80">
            Target Age (yrs)
          </label>
          {/* Row B input */}
          <div>
            <div className="relative">
              <input
                id="expected-age"
                type="number"
                value={customLifeExpectancy}
                onChange={handleCustomLEChange}
                onBlur={() => setLifeExpectancy(customLifeExpectancy)}
                step="0.5" min="10" max="125"
                disabled={selectedCountry !== 'custom'}
                className={`${sel} font-bold text-center ${
                  selectedCountry !== 'custom' ? 'bg-muted/40 cursor-not-allowed text-muted-foreground' : ''
                }`}
              />
              {selectedCountry !== 'custom' && (
                <button
                  type="button"
                  onClick={() => setSelectedCountry('custom')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 min-h-[16px]">
              {isLoadingExpectancy ? 'Fetching latest data...' : sourceYear || 'Calculated benchmark'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Row 2: View Calendar As — full width ── */}
      <div>
        <label htmlFor="view-as" className="block text-xs font-semibold text-foreground/80 mb-1.5">
          View Calendar As
        </label>
        <div className="relative">
          <select
            id="view-as"
            value={timeUnit}
            onChange={e => setTimeUnit(e.target.value as TimeUnit)}
            className={`${sel} appearance-none pr-7 font-medium`}
          >
            <option value="Weeks">Weeks (52 per year)</option>
            <option value="Months">Months (12 per year)</option>
            <option value="Years">Years (1 per year)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* ── Row 3: Actions ── */}
      <div className="pt-2 border-t border-border">
        <ActionBar
          onDownload={onDownload}
          onPrint={onPrint}
          shareData={shareData}
          includeStats={includeStats}
          setIncludeStats={setIncludeStats}
          isDownloading={isDownloading}
        />
      </div>
    </div>
  );
};

export default DateInput;

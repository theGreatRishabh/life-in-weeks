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
  isSmoker: boolean;
  setIsSmoker: (val: boolean) => void;
  aqi: number | '';
  setAqi: (val: number | '') => void;
  dailySitting: number | '';
  setDailySitting: (val: number | '') => void;
  exercise: number | '';
  setExercise: (val: number | '') => void;
  city: string;
  setCity: (val: string) => void;
  lifestyleModifier: number;
  adjustedLifeExpectancy: number;
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
  isSmoker,
  setIsSmoker,
  aqi,
  setAqi,
  dailySitting,
  setDailySitting,
  exercise,
  setExercise,
  city,
  setCity,
  lifestyleModifier,
  adjustedLifeExpectancy,
}) => {
  const [month, setMonth] = useState(birthDate.getMonth());
  const [day, setDay] = useState(birthDate.getDate());
  const [year, setYear] = useState(birthDate.getFullYear());

  const [countries, setCountries] = useState<CountryInfo[]>(POPULAR_COUNTRIES);
  const [isLoadingExpectancy, setIsLoadingExpectancy] = useState(false);
  const [sourceYear, setSourceYear] = useState<string | null>(null);
  const [customLifeExpectancy, setCustomLifeExpectancy] = useState(lifeExpectancy);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);

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

  useEffect(() => {
    if (!selectedCountry || selectedCountry === 'custom' || selectedCountry === 'WLD') {
      setAvailableStates([]);
      return;
    }
    const countryObj = countries.find(c => c.id === selectedCountry);
    if (!countryObj) {
      setAvailableStates([]);
      return;
    }
    
    setIsLoadingStates(true);
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryObj.name })
    })
    .then(res => res.json())
    .then(data => {
      if (data && !data.error && data.data && data.data.states) {
        setAvailableStates(data.data.states.map((s: any) => s.name));
      } else {
        setAvailableStates([]);
      }
    })
    .catch(() => {
      setAvailableStates([]);
    })
    .finally(() => setIsLoadingStates(false));
  }, [selectedCountry, countries]);

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

  const fetchAqiForLocation = async (loc: string) => {
    if (!loc.trim()) return;
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`);
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude } = geoData.results[0];
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`);
        const aqiData = await aqiRes.json();
        if (aqiData.current && aqiData.current.us_aqi !== undefined) {
          setAqi(aqiData.current.us_aqi);
        }
      }
    } catch (e) {
      console.error('Failed to fetch AQI:', e);
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
            {lifestyleModifier !== 0 && (
              <p className={`text-[11px] font-bold mt-1 ${lifestyleModifier > 0 ? 'text-green-500' : 'text-red-500'}`}>
                Adjusted: {adjustedLifeExpectancy} yrs
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Lifestyle Factors ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1 rounded-md bg-green-500/10 text-green-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          <h2 className="text-sm font-bold text-foreground tracking-tight">Lifestyle Factors</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-foreground/80 mb-1">Do you smoke?</label>
            <div className="relative">
              <select
                value={isSmoker ? 'yes' : 'no'}
                onChange={e => setIsSmoker(e.target.value === 'yes')}
                className={`${sel} appearance-none pr-7 font-medium`}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-foreground/80 mb-1">State / AQI</label>
            <div className="flex gap-2">
              {availableStates.length > 0 ? (
                <div className="relative flex-1">
                  <select
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                      fetchAqiForLocation(e.target.value);
                    }}
                    className={`${sel} appearance-none pr-6 font-medium h-full w-full`}
                  >
                    <option value="">City</option>
                    {availableStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted-foreground">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onBlur={() => fetchAqiForLocation(city)}
                  placeholder={isLoadingStates ? "Loading..." : "City"}
                  disabled={isLoadingStates}
                  className={`${sel} font-medium flex-1`}
                />
              )}
              <input
                type="number"
                value={aqi}
                onChange={e => setAqi(e.target.value === '' ? '' : parseInt(e.target.value))}
                min="0" max="500"
                placeholder="AQI"
                className={`${sel.replace('w-full', 'w-16')} font-medium text-center`}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-foreground/80 mb-1">Daily Sitting (hrs)</label>
            <input
              type="number"
              value={dailySitting}
              onChange={e => setDailySitting(e.target.value === '' ? '' : parseInt(e.target.value))}
              min="0" max="24"
              className={`${sel} font-medium`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-foreground/80 mb-1">Weekly Exercise (hrs)</label>
            <input
              type="number"
              value={exercise}
              onChange={e => setExercise(e.target.value === '' ? '' : parseInt(e.target.value))}
              min="0" max="100"
              className={`${sel} font-medium`}
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic border-t border-border/50 pt-2">
          Disclaimer: Lifestyle impact values are estimates based on representative data from the World Health Organization (WHO) and CDC. They are generalized heuristics and not medical advice. AQI fetching uses Open-Meteo for proxy yearly averages.
        </p>
      </div>

      {/* ── Row 3: View Calendar As — full width ── */}
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

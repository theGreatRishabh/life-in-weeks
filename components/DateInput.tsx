import React, { useState, useEffect, useCallback } from 'react';
import { TimeUnit } from '../types';

interface DateInputProps {
  birthDate: Date;
  setBirthDate: (date: Date) => void;
  lifeExpectancy: number;
  setLifeExpectancy: (value: number) => void;
  timeUnit: TimeUnit;
  setTimeUnit: (unit: TimeUnit) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface Country {
  id: string;
  name: string;
}

const DateInput: React.FC<DateInputProps> = ({
  birthDate, setBirthDate, lifeExpectancy, setLifeExpectancy, timeUnit, setTimeUnit, selectedCountry, setSelectedCountry
}) => {
  const [month, setMonth] = useState(birthDate.getMonth());
  const [day, setDay] = useState(birthDate.getDate());
  const [year, setYear] = useState(birthDate.getFullYear());

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingExpectancy, setIsLoadingExpectancy] = useState(false);
  const [sourceYear, setSourceYear] = useState<string | null>(null);
  const [customLifeExpectancy, setCustomLifeExpectancy] = useState(lifeExpectancy);

  useEffect(() => {
    const newDate = new Date(year, month, day);
    if (!isNaN(newDate.getTime()) && newDate.getFullYear() === year && newDate.getMonth() === month && newDate.getDate() === day) {
      if (newDate <= new Date()) {
        setBirthDate(newDate);
      }
    }
  }, [month, day, year, setBirthDate]);
  
  useEffect(() => {
    fetch('https://api.worldbank.org/v2/country?format=json&per_page=300')
      .then(res => res.json())
      .then(data => {
        if (data && data[1]) {
          const validCountries = data[1]
            .filter((c: any) => c.region.value !== 'Aggregates')
            .map((c: any) => ({ id: c.id, name: c.name }));
          setCountries(validCountries);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingCountries(false));
  }, []);

  const fetchLifeExpectancy = useCallback((countryCode: string) => {
    if (countryCode === 'custom') {
      setSelectedCountry('custom');
      setLifeExpectancy(customLifeExpectancy);
      setSourceYear(null);
      return;
    }
    
    setIsLoadingExpectancy(true);
    setSourceYear(null);
    fetch(`https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.DYN.LE00.IN?format=json&per_page=1&date=2000:2023`)
      .then(res => res.json())
      .then(data => {
        if (data && data[1] && data[1][0] && data[1][0].value) {
          const value = parseFloat(data[1][0].value.toFixed(1));
          setLifeExpectancy(value);
          setCustomLifeExpectancy(value);
          setSourceYear(`Source year: ${data[1][0].date}`);
        } else {
           setSourceYear('No data available for this country.');
        }
      })
      .catch(() => setSourceYear('Could not fetch data.'))
      .finally(() => setIsLoadingExpectancy(false));
  }, [setLifeExpectancy, customLifeExpectancy, setSelectedCountry]);

  useEffect(() => {
      if (selectedCountry && selectedCountry !== 'custom') {
          fetchLifeExpectancy(selectedCountry);
      }
  }, [selectedCountry, fetchLifeExpectancy]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountry(code);
    if (code !== 'custom') {
      fetchLifeExpectancy(code);
    }
  };

  const handleCustomLEChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setCustomLifeExpectancy(value);
      if (selectedCountry === 'custom') {
          setLifeExpectancy(value);
      }
  }

  const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-1">{children}</label>
  );

  const baseInputStyles = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors";

  const CustomSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
      <select {...props} className={`${baseInputStyles} appearance-none pr-8 ${props.className}`} />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
      </div>
    </div>
  );
  
  const CustomInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
      <input {...props} className={`${baseInputStyles} ${props.className} disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-700`} />
  );

  return (
    <div className="space-y-6 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg h-full">
      <div>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500 border-b border-slate-300 dark:border-slate-700 pb-2 mb-4">Your Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <CustomSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </CustomSelect>
              <CustomInput type="number" value={day} onChange={(e) => setDay(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))} min="1" max="31" />
              <CustomInput type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())} min="1900" max={new Date().getFullYear()} />
            </div>
          </div>
          <div>
            <Label htmlFor="view-as">View As</Label>
            <CustomSelect id="view-as" value={timeUnit} onChange={e => setTimeUnit(e.target.value as TimeUnit)}>
              <option>Weeks</option>
              <option>Months</option>
              <option>Years</option>
            </CustomSelect>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500 border-b border-slate-300 dark:border-slate-700 pb-2 mb-4">Life Expectancy</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="based-on">Based On</Label>
            <CustomSelect id="based-on" value={selectedCountry} onChange={handleCountryChange} disabled={isLoadingCountries}>
              <option value="custom">Custom</option>
              {isLoadingCountries ? <option>Loading countries...</option> : countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </CustomSelect>
          </div>
          <div>
            <Label htmlFor="expected-age">Expected Age</Label>
            <div className="min-h-[60px]">
              <CustomInput 
                id="expected-age" 
                type="number" 
                value={customLifeExpectancy.toFixed(1)} 
                onChange={handleCustomLEChange}
                onBlur={() => setLifeExpectancy(customLifeExpectancy)}
                step="0.1"
                disabled={selectedCountry !== 'custom'}
                className="text-center"
              />
              {(isLoadingExpectancy || sourceYear) && 
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 h-4">
                  {isLoadingExpectancy ? 'Fetching data...' : sourceYear}
                </p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateInput;
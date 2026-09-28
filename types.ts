export enum WeekStatus {
  Past,
  Present,
  Future,
}

export type TimeUnit = 'Weeks' | 'Months' | 'Years';

export interface ExportOptions {
  includeStats: boolean;
  theme?: 'light' | 'dark';
}

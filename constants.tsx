
import { EisenhowerQuadrant } from './types';

export const QUADRANT_COLORS: Record<string, string> = {
  [EisenhowerQuadrant.DO_FIRST]: 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100',
  [EisenhowerQuadrant.SCHEDULE]: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100',
  [EisenhowerQuadrant.DELEGATE]: 'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100',
  [EisenhowerQuadrant.ELIMINATE]: 'bg-slate-50 border-slate-200 text-slate-600 shadow-slate-100',
};

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


import { EisenhowerQuadrant } from './types';
import { AlertCircle, Calendar, Users, Trash2 } from 'lucide-react';

export const QUADRANT_CONFIG = {
  [EisenhowerQuadrant.DO_FIRST]: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    icon: AlertCircle,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    className: 'bg-[#fff1f2] border-[#fecdd3] text-[#9f1239] shadow-sm'
  },
  [EisenhowerQuadrant.SCHEDULE]: {
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    icon: Calendar,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    className: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af] shadow-sm'
  },
  [EisenhowerQuadrant.DELEGATE]: {
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    icon: Users,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    className: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e] shadow-sm'
  },
  [EisenhowerQuadrant.ELIMINATE]: {
    title: 'Eliminate',
    subtitle: 'Neither Urgent Nor Important',
    icon: Trash2,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    className: 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155] shadow-sm'
  },
};

export const QUADRANT_COLORS: Record<string, string> = {
  [EisenhowerQuadrant.DO_FIRST]: QUADRANT_CONFIG[EisenhowerQuadrant.DO_FIRST].className,
  [EisenhowerQuadrant.SCHEDULE]: QUADRANT_CONFIG[EisenhowerQuadrant.SCHEDULE].className,
  [EisenhowerQuadrant.DELEGATE]: QUADRANT_CONFIG[EisenhowerQuadrant.DELEGATE].className,
  [EisenhowerQuadrant.ELIMINATE]: QUADRANT_CONFIG[EisenhowerQuadrant.ELIMINATE].className,
};

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

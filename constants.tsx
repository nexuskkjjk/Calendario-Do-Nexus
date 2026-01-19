
import { EventColor } from './types';

export const COLOR_MAP: Record<EventColor, string> = {
  red: 'bg-rose-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  blue: 'bg-sky-500',
  yellow: 'bg-amber-500',
};

export const COLOR_BORDER_MAP: Record<EventColor, string> = {
  red: 'border-rose-500',
  green: 'border-emerald-500',
  purple: 'border-violet-500',
  blue: 'border-sky-500',
  yellow: 'border-amber-500',
};

export const MOCK_USER = {
  name: 'Victor',
  email: 'victorhuaang@gmail.com'
};

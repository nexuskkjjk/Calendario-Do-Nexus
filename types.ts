
export type EventColor = 'red' | 'green' | 'purple' | 'blue' | 'yellow';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format
  time: string;
  description: string;
  location: string;
  value: number;
  color: EventColor;
  googleEventId?: string; // Campo para integração futura
  isSynced?: boolean;
}

export type ViewType = 'calendar' | 'add' | 'share' | 'recent' | 'settings';

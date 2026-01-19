
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../types';
import { COLOR_MAP, COLOR_BORDER_MAP } from '../constants';

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

  const totalDays = daysInMonth(year, month);
  const startOffset = startDayOfMonth(year, month);
  const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  // Calcula o total de células para preencher a grade (sempre 5 ou 6 linhas de 7 dias)
  const totalCells = startOffset + totalDays > 35 ? 42 : 35;
  const nextMonthCells = totalCells - (startOffset + totalDays);

  return (
    <div className="flex flex-col bg-[#0b0e14]">
      <div className="px-5 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight capitalize">
          {monthName} <span className="text-[#1a1c23] ml-1">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 stroke-[3]" />
          </button>
          <button 
            onClick={nextMonth} 
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-1 pb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[8px] font-bold text-gray-800 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {Array.from({ length: Math.max(0, startOffset) }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell bg-[#0b0e14]/50 opacity-20"></div>
        ))}
        
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          
          return (
            <div 
              key={day} 
              onClick={() => onDateClick(new Date(year, month, day))}
              className={`calendar-cell group transition-all active:bg-[#1a1c23]/30 cursor-pointer`}
            >
              <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-center">
                   <span className={`text-[12px] font-black tracking-tighter ${isToday ? 'text-sky-400' : 'text-gray-500'}`}>
                     {day}
                   </span>
                </div>
                
                <div className="flex-1 mt-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.map((e, idx) => (
                    <div key={e.id} className="w-full">
                      {idx === 0 ? (
                        <div className={`px-1 py-0.5 rounded-[2px] border ${COLOR_BORDER_MAP[e.color] || 'border-gray-500'} ${(COLOR_MAP[e.color] || 'bg-gray-500')}/10 overflow-hidden`}>
                          <p className="text-[6px] font-black text-white leading-tight truncate uppercase tracking-tighter">
                            {e.title}
                          </p>
                        </div>
                      ) : (
                        <div className={`h-0.5 w-full rounded-full ${COLOR_MAP[e.color] || 'bg-gray-500'} opacity-40`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isToday && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-sky-500" />
              )}
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, nextMonthCells) }).map((_, i) => (
           <div key={`next-${i}`} className="calendar-cell bg-[#0b0e14]/50 opacity-20"></div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;

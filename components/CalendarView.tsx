
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
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all border border-white/5"
          >
            <ChevronLeft className="w-5 h-5 stroke-[3]" />
          </button>
          <button 
            onClick={nextMonth} 
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all border border-white/5"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-1 pb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[8px] font-bold text-gray-600 uppercase tracking-widest opacity-70">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid bg-[#1a1c23] border-y border-white/5">
        {Array.from({ length: Math.max(0, startOffset) }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell bg-[#0b0e14]/40"></div>
        ))}
        
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          
          return (
            <div 
              key={day} 
              onClick={() => onDateClick(new Date(year, month, day))}
              className={`calendar-cell group transition-all active:bg-[#1a1c23] cursor-pointer border-r border-b border-white/[0.02] ${isToday ? 'bg-[#16181f]' : ''}`}
            >
              <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-center pt-1">
                   <span className={`text-[12px] font-black tracking-tighter w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : 'text-gray-400'}`}>
                     {day}
                   </span>
                </div>
                
                <div className="flex-1 mt-1.5 flex flex-col gap-0.5 px-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <div key={e.id} className="w-full">
                      {idx === 0 || dayEvents.length <= 2 ? (
                        <div className={`px-1 py-[2px] rounded-[2px] border-l-2 ${COLOR_BORDER_MAP[e.color] || 'border-gray-500'} bg-white/[0.02] overflow-hidden`}>
                          <p className={`text-[6px] font-bold leading-none truncate uppercase tracking-tighter ${isToday ? 'text-gray-200' : 'text-gray-400'}`}>
                            {e.title}
                          </p>
                        </div>
                      ) : (
                         // Se tiver muitos eventos, mostra bolinhas nos seguintes
                         <div className={`h-1 w-1 rounded-full ${COLOR_MAP[e.color] || 'bg-gray-500'} mx-auto mt-0.5`} />
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                     <div className="text-[5px] text-center text-gray-600 font-black">+ {dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, nextMonthCells) }).map((_, i) => (
           <div key={`next-${i}`} className="calendar-cell bg-[#0b0e14]/40"></div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;

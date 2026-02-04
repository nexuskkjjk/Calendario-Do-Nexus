
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../types';
import { COLOR_MAP, COLOR_BORDER_MAP } from '../constants';

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));

  // Sync internal calendar month with selected date if it changes externally
  useEffect(() => {
    setCurrentDate(new Date(selectedDate));
  }, [selectedDate]);

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

  const totalCells = startOffset + totalDays > 35 ? 42 : 35;
  const nextMonthCells = totalCells - (startOffset + totalDays);

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const today = new Date();

  return (
    <div className="flex flex-col bg-[#0b0e14]">
      <div className="px-5 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight capitalize">
          {monthName} <span className="text-[#1a1c23] ml-1">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all border border-white/5 hover:border-white/20"
          >
            <ChevronLeft className="w-5 h-5 stroke-[3]" />
          </button>
          <button 
            onClick={nextMonth} 
            className="w-10 h-10 flex items-center justify-center bg-[#11141b] rounded-xl text-gray-500 active:scale-90 transition-all border border-white/5 hover:border-white/20"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-1 pb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-70">
            {day}
          </div>
        ))}
      </div>

      {/* Grid container fixed - replaced global CSS class with Tailwind utility for reliability */}
      <div className="grid grid-cols-7 gap-[1px] bg-[#1a1c23] border-y border-white/5">
        {Array.from({ length: Math.max(0, startOffset) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-[#0b0e14]/40 min-h-[90px]"></div>
        ))}
        
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const currentDayDate = new Date(year, month, day);
          const dayEvents = getEventsForDay(day);
          
          const isSelected = isSameDate(currentDayDate, selectedDate);
          const isTodayDate = isSameDate(currentDayDate, today);
          
          return (
            <div 
              key={day} 
              onClick={() => onDateSelect(currentDayDate)}
              className={`min-h-[90px] group transition-all active:bg-[#1a1c23] cursor-pointer border-r border-b border-white/[0.02] relative p-1 ${isSelected ? 'bg-[#1a1c23]' : 'bg-[#0b0e14]'}`}
            >
              <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-center pt-1 mb-1">
                   <span className={`text-[12px] font-black tracking-tighter w-6 h-6 flex items-center justify-center rounded-full transition-all 
                     ${isSelected ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : 
                       isTodayDate ? 'bg-[#1a1c23] text-sky-500 border border-sky-500/30' : 'text-gray-400'}`}>
                     {day}
                   </span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <div key={e.id} className="w-full px-0.5">
                      {idx === 0 || dayEvents.length <= 2 ? (
                        <div className={`px-1 py-[3px] rounded-[3px] border-l-2 ${COLOR_BORDER_MAP[e.color] || 'border-gray-500'} bg-white/[0.03] overflow-hidden w-full`}>
                          <p className={`text-[7px] font-bold leading-none truncate uppercase tracking-tighter ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>
                            {e.title}
                          </p>
                        </div>
                      ) : (
                         <div className={`h-1.5 w-1.5 rounded-full ${COLOR_MAP[e.color] || 'bg-gray-500'} mx-auto mt-0.5`} />
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                     <div className="text-[6px] text-center text-gray-600 font-black mt-auto pb-1">+ {dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, nextMonthCells) }).map((_, i) => (
           <div key={`next-${i}`} className="bg-[#0b0e14]/40 min-h-[90px]"></div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;

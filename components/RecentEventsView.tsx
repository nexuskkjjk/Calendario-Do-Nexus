import React from 'react';
import { ChevronLeft, Trash2, MapPin, DollarSign, Clock, Calendar } from 'lucide-react';
import { CalendarEvent } from '../types';
import { COLOR_MAP } from '../constants';

interface RecentEventsViewProps {
  events: CalendarEvent[];
  onDelete: (id: string) => void;
  onBack: () => void;
}

const RecentEventsView: React.FC<RecentEventsViewProps> = ({ events, onDelete, onBack }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  return (
    <div className="bg-[#0b0e14] h-full flex flex-col p-6 animate-in slide-in-from-left duration-300">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Minha Agenda</h2>
        <button onClick={onBack} className="p-3 bg-[#1a1c23] rounded-2xl text-gray-500 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto no-scrollbar pb-32">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-24 opacity-20">
            <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nada agendado</p>
          </div>
        ) : (
          sortedEvents.map(event => (
            <div key={event.id} className="bg-[#1a1c23] p-7 rounded-[2.8rem] flex flex-col gap-6 border border-white/5 relative shadow-2xl shadow-black/40">
              {/* Botão Deletar */}
              <button 
                onClick={() => onDelete(event.id)}
                className="absolute top-7 right-7 p-2 text-gray-700 hover:text-rose-500 active:scale-90 transition-all"
              >
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </button>
              
              {/* Cabeçalho: Indicador + Título + Info */}
              <div className="flex items-center gap-6 pr-10">
                <div className={`w-3 h-12 rounded-full ${COLOR_MAP[event.color]} shadow-lg shadow-black/50 shrink-0`} />
                <div className="overflow-hidden">
                  <h3 className="font-black text-xl text-white leading-tight truncate tracking-tight mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 font-black uppercase tracking-widest">
                    <span>{event.date.split('-').reverse().join('/')}</span>
                    <span className="opacity-30">•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                  </div>
                </div>
              </div>

              {/* Seção de Tags com Espaçamento Melhorado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-black/40 px-5 py-4 rounded-2xl border border-white/5 overflow-hidden">
                  <MapPin className="w-4 h-4 text-rose-500 stroke-[3] shrink-0" />
                  <span className="text-[11px] font-black text-gray-300 truncate uppercase tracking-tighter">
                    {event.location || 'Sem local'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 bg-black/40 px-5 py-4 rounded-2xl border border-white/5">
                  <DollarSign className="w-4 h-4 text-emerald-500 stroke-[3] shrink-0" />
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tighter">
                    R$ {Number(event.value).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Descrição opcional */}
              {event.description && (
                <div className="px-1 border-t border-white/5 pt-4">
                   <p className="text-[10px] font-bold text-gray-600 leading-relaxed italic line-clamp-2">
                    "{event.description}"
                   </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Indicador de Quantidade fixo no fundo */}
      <div className="fixed bottom-28 left-0 right-0 pointer-events-none flex justify-center">
        <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">
            {events.length} compromissos na lista
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecentEventsView;
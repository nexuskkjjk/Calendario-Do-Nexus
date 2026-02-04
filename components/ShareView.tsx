import React, { useState } from 'react';
import { ChevronLeft, Zap, Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { CalendarEvent } from '../types';

interface ShareViewProps {
  events: CalendarEvent[];
  onBack: () => void;
}

const ShareView: React.FC<ShareViewProps> = ({ events, onBack }) => {
  const [range, setRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [copied, setCopied] = useState(false);

  const filteredEvents = events.filter(e => e.date >= range.start && e.date <= range.end);

  const generateShareText = () => {
    if (filteredEvents.length === 0) return "Nenhum evento agendado para este período.";
    
    // Ordenar cronologicamente para garantir que a lista faça sentido
    const sorted = [...filteredEvents].sort((a, b) => 
      new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
    );

    const list = sorted.map(e => {
      const parts = e.date.split('-'); // YYYY-MM-DD
      const day = parts[2];
      const month = parts[1];
      
      // Usar Localização prioritariamente. Se não houver, usa o Título como fallback.
      const displayContent = e.location ? e.location : e.title;
      
      // Formato: "22/03 / Local Horário"
      return `${day}/${month} / ${displayContent} ${e.time}`;
    }).join('\n');

    return `Agenda\n${list}`;
  };

  const handleCopy = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#0b0e14] h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar pb-32">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Exportar</h2>
        <button onClick={onBack} className="p-2 bg-[#1a1c23] rounded-full text-gray-400 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      <div className="bg-[#1a1c23] p-8 rounded-[3rem] border border-gray-800/50 flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center relative">
          <Zap className="w-10 h-10 text-sky-400 fill-sky-400/20" />
          <div className="absolute -top-2 -right-2 bg-sky-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">NOVO</div>
        </div>
        
        <div className="text-center space-y-2">
           <h3 className="text-lg font-black uppercase tracking-tight">Compartilhar Lista</h3>
           <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-4">Defina as datas para gerar a lista simplificada</p>
        </div>

        <div className="w-full space-y-4 pt-2">
          <div className="bg-black/40 p-5 rounded-2xl border border-gray-800/30 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Início</span>
            <input type="date" value={range.start} onChange={e => setRange({...range, start: e.target.value})} className="bg-transparent text-sm font-black text-sky-400 focus:outline-none" />
          </div>
          <div className="bg-black/40 p-5 rounded-2xl border border-gray-800/30 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Fim</span>
            <input type="date" value={range.end} onChange={e => setRange({...range, end: e.target.value})} className="bg-transparent text-sm font-black text-sky-400 focus:outline-none" />
          </div>
        </div>

        <div className="w-full pt-4 space-y-3">
           <p className="text-center text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">
             {filteredEvents.length} anotações encontradas
           </p>
           
           {/* Botão WhatsApp */}
           <button 
             onClick={handleWhatsApp}
             className="w-full py-5 bg-[#25D366] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             <MessageCircle className="w-5 h-5 stroke-[3]" />
             Enviar no WhatsApp
           </button>

           {/* Botão Copiar */}
           <button 
             onClick={handleCopy}
             className="w-full py-5 bg-white/5 text-gray-400 font-black text-sm uppercase tracking-widest rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
             {copied ? 'Copiado!' : 'Copiar Texto'}
           </button>
        </div>
      </div>

      <div className="mt-8 px-4 opacity-30 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">Formato compacto: Data / Local Horário</p>
      </div>
    </div>
  );
};

export default ShareView;
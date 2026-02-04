import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, AlignLeft, Check, Mic, Loader2, MicOff } from 'lucide-react';
import { CalendarEvent, EventColor } from '../types';
import { COLOR_MAP } from '../constants';

interface AddEventViewProps {
  onSave: (event: CalendarEvent) => void;
  onCancel: () => void;
  initialDate?: Date;
  initialEvent?: CalendarEvent | null;
}

const AddEventView: React.FC<AddEventViewProps> = ({ onSave, onCancel, initialDate, initialEvent }) => {
  const [isRecording, setIsRecording] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    description: '',
    location: '',
    value: '',
    color: 'blue' as EventColor
  });

  useEffect(() => {
    if (initialEvent) {
      setFormData({
        title: initialEvent.title,
        date: initialEvent.date,
        time: initialEvent.time,
        description: initialEvent.description || '',
        location: initialEvent.location || '',
        value: initialEvent.value ? initialEvent.value.toString() : '',
        color: initialEvent.color
      });
    }
  }, [initialEvent]);

  const colors: EventColor[] = ['red', 'green', 'purple', 'blue', 'yellow'];

  // --- Lógica Nativa de Voz (Web Speech API) ---
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // O stop é manipulado automaticamente pelo onend ou se a API suportar abort
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Seu navegador não suporta reconhecimento de voz nativo.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Lógica simples de preenchimento baseada no texto falado
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: transcript.charAt(0).toUpperCase() + transcript.slice(1) }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          description: prev.description ? `${prev.description}\n${transcript}` : transcript 
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      setIsRecording(false);
      alert("Erro ao reconhecer voz. Verifique o microfone.");
    };

    recognition.start();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Se estiver editando (initialEvent existe), mantém o ID, senão cria novo
    const eventId = initialEvent ? initialEvent.id : Math.random().toString(36).substr(2, 9);
    
    onSave({
      id: eventId,
      ...formData,
      value: Number(formData.value) || 0,
      isSynced: false
    });
  };

  return (
    <div className="bg-[#0b0e14] h-full flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar pb-32">
      <div className="flex items-center mb-8">
        <button onClick={onCancel} className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] pr-4 py-1">
          Cancelar
        </button>
        <div className="flex-1 flex justify-center pr-12">
          <h2 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">
            {initialEvent ? "Editar Anotação" : "Nova Anotação"}
          </h2>
        </div>
      </div>

      {/* Voice Button Section */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${
            isRecording ? 'bg-rose-500 scale-110 animate-pulse' : 'bg-[#1a1c23] border border-white/5 active:scale-90'
          }`}
        >
          {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-gray-400" />}
        </button>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
          {isRecording ? "Ouvindo... (Toque para parar)" : "Toque para falar (Offline)"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#1a1c23] p-7 rounded-[2.8rem] space-y-5 border border-white/5 shadow-2xl">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">O que você quer anotar?</label>
            <input
              type="text"
              required
              placeholder="Título da anotação"
              className="w-full bg-transparent border-b border-gray-800 py-2 text-xl font-black text-white placeholder:text-gray-800 focus:outline-none focus:border-sky-500 transition-colors"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Data</label>
              <input type="date" className="w-full bg-transparent border-b border-gray-800 py-2 text-sm font-bold text-sky-400 focus:outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Horário</label>
              <input type="time" className="w-full bg-transparent border-b border-gray-800 py-2 text-sm font-bold text-sky-400 focus:outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1c23] p-7 rounded-[2.8rem] space-y-6 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-rose-500" />
            </div>
            <input type="text" placeholder="Local do evento" className="bg-transparent w-full text-[13px] font-bold text-gray-300 focus:outline-none placeholder:text-gray-700" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <input type="number" placeholder="Valor (ex: 50.00)" className="bg-transparent w-full text-[13px] font-bold text-gray-300 focus:outline-none placeholder:text-gray-700" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
          </div>
          <div className="flex items-start gap-5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0 mt-1">
              <AlignLeft className="w-5 h-5 text-sky-500" />
            </div>
            <textarea rows={2} placeholder="Descrição detalhada..." className="bg-transparent w-full text-[13px] font-bold text-gray-300 focus:outline-none resize-none placeholder:text-gray-700" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        <div className="bg-[#1a1c23] p-7 rounded-[2.8rem] border border-white/5 shadow-2xl">
          <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-6 text-center">Cor de destaque</p>
          <div className="flex justify-between px-2">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, color: c })}
                className={`w-12 h-12 rounded-[1.2rem] transition-all ${COLOR_MAP[c]} ${formData.color === c ? 'scale-110 ring-4 ring-white/10' : 'opacity-20'}`}
              >
                {formData.color === c && <Check className="w-6 h-6 text-white mx-auto stroke-[4]" />}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-6 bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 shadow-2xl shadow-white/5"
        >
          <Check className="w-6 h-6 stroke-[4]" />
          {initialEvent ? "Salvar Alterações" : "Concluir Anotação"}
        </button>
      </form>
    </div>
  );
};

export default AddEventView;
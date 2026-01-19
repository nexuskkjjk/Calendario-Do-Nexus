
import React, { useState, useRef } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, AlignLeft, Check, Mic, Loader2, Globe } from 'lucide-react';
import { CalendarEvent, EventColor } from '../types';
import { COLOR_MAP } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

interface AddEventViewProps {
  onSave: (event: CalendarEvent) => void;
  onCancel: () => void;
}

const AddEventView: React.FC<AddEventViewProps> = ({ onSave, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldSync, setShouldSync] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    description: '',
    location: '',
    value: '',
    color: 'blue' as EventColor
  });

  const colors: EventColor[] = ['red', 'green', 'purple', 'blue', 'yellow'];

  // Gemini AI Logic
  const processAudioWithGemini = async (base64Audio: string) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const today = new Date().toISOString().split('T')[0];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "audio/webm", data: base64Audio } },
              { text: `Extraia os detalhes deste evento de calendário. Hoje é dia ${today}. 
                       Retorne um JSON com os campos: title, date (YYYY-MM-DD), time (HH:mm), location, value (número), description, color (red, green, purple, blue ou yellow). 
                       Se não houver valor, use 0. Se não houver cor, escolha uma que combine.` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              time: { type: Type.STRING },
              location: { type: Type.STRING },
              value: { type: Type.NUMBER },
              description: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["title", "date", "time"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        date: result.date || prev.date,
        time: result.time || prev.time,
        location: result.location || prev.location,
        value: result.value?.toString() || prev.value,
        description: result.description || prev.description,
        color: (result.color as EventColor) || prev.color
      }));
    } catch (error) {
      console.error("Erro na IA:", error);
      alert("Não consegui entender o áudio. Tente novamente ou digite manualmente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          processAudioWithGemini(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Acesso ao microfone negado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      value: Number(formData.value) || 0,
      isSynced: shouldSync
    });
  };

  return (
    <div className="bg-[#0b0e14] h-full flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar pb-32">
      <div className="flex items-center mb-8">
        <button onClick={onCancel} className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] pr-4 py-1">
          Cancelar
        </button>
        <div className="flex-1 flex justify-center pr-12">
          <h2 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">Nova Anotação</h2>
        </div>
      </div>

      {/* IA Voice Button Section */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${
            isRecording ? 'bg-rose-500 scale-110 animate-pulse' : 'bg-[#1a1c23] border border-white/5 active:scale-90'
          }`}
        >
          {isProcessing ? <Loader2 className="w-8 h-8 animate-spin text-sky-400" /> : <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-gray-400'}`} />}
        </button>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
          {isProcessing ? "IA Processando..." : isRecording ? "Solte para analisar" : "Segure para falar (IA)"}
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

        <div className="bg-[#1a1c23] p-6 rounded-[2.8rem] border border-white/5 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-sky-400" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sincronizar Google</span>
          </div>
          <button 
            type="button"
            onClick={() => setShouldSync(!shouldSync)}
            className={`w-12 h-6 rounded-full transition-all relative ${shouldSync ? 'bg-sky-500' : 'bg-gray-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${shouldSync ? 'left-7' : 'left-1'}`} />
          </button>
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
          Concluir Anotação
        </button>
      </form>
    </div>
  );
};

export default AddEventView;

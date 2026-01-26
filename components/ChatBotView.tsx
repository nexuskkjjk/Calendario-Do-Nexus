import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ChevronLeft, 
  Sparkles, 
  Volume2, 
  Loader2, 
  Calendar,
  User,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatMessage, CalendarEvent, EventColor } from '../types';

interface ChatBotViewProps {
  onAddEvent: (event: CalendarEvent) => void;
  onBack: () => void;
}

const ChatBotView: React.FC<ChatBotViewProps> = ({ onAddEvent, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Olá! Sou seu assistente Elite. Posso agendar compromissos ou tirar suas dúvidas. O que manda hoje?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const speakMessage = async (text: string, messageId: string) => {
    if (isSpeaking) return;
    setIsSpeaking(messageId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Diga com tom prestativo e natural: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(null);
        source.start();
      } else {
        setIsSpeaking(null);
      }
    } catch (error) {
      setIsSpeaking(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const createEventTool = {
        name: 'create_calendar_event',
        parameters: {
          type: Type.OBJECT,
          description: 'Cria um novo evento ou anotação no calendário.',
          properties: {
            title: { type: Type.STRING, description: 'Título do evento.' },
            date: { type: Type.STRING, description: 'Data YYYY-MM-DD.' },
            time: { type: Type.STRING, description: 'Horário HH:mm.' },
            location: { type: Type.STRING },
            value: { type: Type.NUMBER },
            description: { type: Type.STRING },
            color: { type: Type.STRING, enum: ['red', 'green', 'purple', 'blue', 'yellow'] }
          },
          required: ['title', 'date', 'time']
        }
      };

      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `Você é o Elite Assistant. Hoje é ${new Date().toLocaleDateString()}.
          
          Seus objetivos:
          1. Tirar dúvidas do usuário e conversar de forma educada e prestativa.
          2. Agendar eventos quando solicitado usando a ferramenta 'create_calendar_event'.

          IMPORTANTE:
          - Se você usar a ferramenta para agendar, GERE TAMBÉM UMA RESPOSTA DE TEXTO confirmando o agendamento de forma simpática (ex: "Pronto! Agendei [evento] para [data]. Posso ajudar em algo mais?").
          - Se o usuário só fizer uma pergunta, responda a pergunta claramente.
          - Não seja robótico. Tenha personalidade.`,
          tools: [{ functionDeclarations: [createEventTool] }]
        }
      });

      const result = await chat.sendMessage({ message: inputText });
      
      // Usa a resposta de texto da IA. Se a IA chamou a função mas não retornou texto (raro, mas possível), usamos um fallback.
      let finalResponseText = result.text;
      let functionCalled = false;

      if (result.functionCalls) {
        for (const fc of result.functionCalls) {
          if (fc.name === 'create_calendar_event') {
            functionCalled = true;
            const args = fc.args as any;
            const newEvent: CalendarEvent = {
              id: Math.random().toString(36).substr(2, 9),
              title: args.title,
              date: args.date,
              time: args.time,
              location: args.location || '',
              value: args.value || 0,
              description: args.description || '',
              color: (args.color as EventColor) || 'blue',
              isSynced: true
            };
            onAddEvent(newEvent);
          }
        }
        
        // Se a IA chamou a função mas veio sem texto, adicionamos confirmação padrão.
        if (!finalResponseText) {
          finalResponseText = "Agendamento realizado com sucesso! Precisa de mais alguma coisa?";
        }
      }

      // Fallback final se nada vier
      if (!finalResponseText) {
        finalResponseText = "Entendido.";
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalResponseText,
        timestamp: new Date(),
        isFunctionCall: functionCalled
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Fala a resposta automaticamente
      speakMessage(finalResponseText, aiMsg.id);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'model',
        text: "Desculpe, tive um problema de conexão. Pode repetir?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14]">
      <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400">
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Elite Assistant</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">IA Inteligente</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-1 border border-white/5 ${msg.role === 'user' ? 'bg-white/10' : 'bg-sky-500/10'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Sparkles className="w-4 h-4 text-sky-400" />}
              </div>
              
              <div className={`relative px-5 py-4 rounded-[1.8rem] text-[13px] leading-relaxed font-medium shadow-2xl ${
                msg.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : 'bg-[#1a1c23] text-gray-200 border border-white/5 rounded-tl-none'
              }`}>
                {msg.text}
                
                {msg.role === 'model' && (
                  <button 
                    onClick={() => speakMessage(msg.text, msg.id)}
                    className={`absolute -right-10 bottom-2 p-2 rounded-full transition-all ${isSpeaking === msg.id ? 'text-sky-400 scale-125' : 'text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100'}`}
                  >
                    {isSpeaking === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                
                {msg.isFunctionCall && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Agenda Atualizada
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-gray-600 px-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processando...</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-6 pb-4">
        <form 
          onSubmit={handleSendMessage}
          className="bg-[#1a1c23]/80 p-2 rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center gap-2 focus-within:border-sky-500/50 transition-all backdrop-blur-xl"
        >
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mande um comando de voz ou texto..."
            className="flex-1 bg-transparent px-5 py-3 text-sm font-bold text-white focus:outline-none placeholder:text-gray-700"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-lg"
          >
            <Send className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBotView;
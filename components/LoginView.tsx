
import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, Globe, Loader2, Sparkles, ArrowRight, Info, Settings2, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Atualizado com o novo Client ID fornecido: 296569463763-jphc8f4i8b8tip0k1e3jb7s9lnbrgdc6.apps.googleusercontent.com
  const [clientId, setClientId] = useState(() => 
    localStorage.getItem('google_client_id') || '296569463763-jphc8f4i8b8tip0k1e3jb7s9lnbrgdc6.apps.googleusercontent.com'
  );

  const handleGoogleLogin = () => {
    setLoading(true);
    localStorage.setItem('google_client_id', clientId);
    
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error !== undefined) {
            setLoading(false);
            console.error("Erro Google Auth:", response);
            alert("A Google bloqueou o acesso. Certifique-se de que a URL deste site está autorizada no seu Console Google.");
            return;
          }
          onLoginSuccess(response.access_token);
        },
      });
      client.requestAccessToken();
    } catch (err) {
      setLoading(false);
      alert("Erro técnico ao conectar com Google. Tente o modo local.");
    }
  };

  const handleLocalLogin = () => {
    localStorage.setItem('calendar_auth', 'true');
    window.location.reload();
  };

  return (
    <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-between p-8 max-w-md mx-auto relative overflow-hidden">
      {/* Elementos Visuais de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/30 mb-8 animate-float">
            <Calendar className="w-12 h-12 text-white stroke-[2.5]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-[#0b0e14]">
             <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
            Calendar<span className="text-sky-500">.</span>Elite
          </h1>
          <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inteligência Artificial Ativa</p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 z-10 pb-12">
        {/* ACESSO LOCAL: Sempre garantido */}
        <button
          onClick={handleLocalLogin}
          className="w-full py-6 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          Acessar App Agora (Local)
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        {/* SINCRONIZAÇÃO GOOGLE: Opcional com a nova chave */}
        <div className="space-y-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white/5 text-gray-400 border border-white/5 font-black text-[10px] uppercase tracking-widest rounded-[1.8rem] active:scale-95 transition-all flex items-center justify-center gap-3 hover:text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Sincronizar Google Cloud
            </button>
            
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-center text-[8px] font-black text-gray-700 uppercase tracking-widest hover:text-gray-400 transition-colors py-2"
            >
              {showAdvanced ? "Ocultar Configurações" : "Configurações da Chave API"}
            </button>
        </div>

        {showAdvanced && (
          <div className="bg-[#161920] p-6 rounded-[2.5rem] border border-white/10 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 text-sky-400">
               <Settings2 className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Client ID Atual</span>
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-4 pr-10 rounded-xl text-[10px] font-bold text-sky-400 focus:outline-none focus:border-sky-500"
              />
              <CheckCircle2 className="absolute right-4 top-4 w-4 h-4 text-emerald-500 opacity-50" />
            </div>
            
            <div className="flex items-start gap-2 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
               <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
               <p className="text-[9px] text-amber-500/80 leading-relaxed font-medium">
                 Se aparecer "Acesso bloqueado: erro de autorização", adicione esta URL no Google Cloud: <br/>
                 <code className="text-white block mt-1 font-mono text-[8px]">{window.location.origin}</code>
               </p>
            </div>
          </div>
        )}

        <div className="text-center opacity-20 mt-4">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Elite Productivity System v3.4</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginView;

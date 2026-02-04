import React from 'react';
import { Calendar, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, userEmail?: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const handleLocalLogin = () => {
    onLoginSuccess('offline_token', 'Usuário Local');
  };

  return (
    <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto relative overflow-hidden overflow-y-auto no-scrollbar">
      {/* Background FX */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />

      {/* Header Logo */}
      <div className="flex flex-col items-center justify-center w-full z-10 mb-12">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/30 mb-8 animate-float">
            <Calendar className="w-12 h-12 text-white stroke-[2.5]" />
          </div>
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter uppercase text-white mb-3">
          Nexus<span className="text-sky-500">.</span>
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Personal Organizer</p>
        </div>
      </div>

      {/* Auth Actions */}
      <div className="w-full z-10 space-y-4 max-w-xs">
          <button
            type="button"
            onClick={handleLocalLogin}
            className="w-full py-5 bg-[#1a1c23] hover:bg-[#252830] text-white border border-white/10 font-black text-sm uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Acessar Agenda
          </button>
      </div>

      <div className="absolute bottom-8 text-center opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Nexus System Local</p>
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

import React, { useState } from 'react';
import { Calendar, ShieldCheck, Globe, Loader2, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulação de delay de autenticação OAuth2
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1800);
  };

  return (
    <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-between p-10 max-w-md mx-auto relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-sky-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/20 mb-10 animate-bounce-slow">
          <Calendar className="w-10 h-10 text-white stroke-[2.5]" />
        </div>
        
        <div className="text-center space-y-4 px-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Calendar<span className="text-sky-500">.</span>Elite
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 leading-relaxed">
            A nova era da organização <br/>pessoal guiada por IA.
          </p>
        </div>
      </div>

      <div className="w-full space-y-4 z-10">
        <div className="bg-[#1a1c23]/50 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-center">Bem-vindo de volta</h2>
            <p className="text-[9px] font-bold text-gray-600 text-center uppercase tracking-widest">Faça login para sincronizar sua vibe</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <div className="w-5 h-5 flex items-center justify-center">
                   <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957a8.997 8.997 0 0 0 0 8.084l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                   </svg>
                </div>
                Entrar com Google
              </>
            )}
          </button>
        </div>

        <div className="flex justify-center items-center gap-6 py-4 opacity-30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[7px] font-black uppercase tracking-widest">Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span className="text-[7px] font-black uppercase tracking-widest">Nuvem</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginView;

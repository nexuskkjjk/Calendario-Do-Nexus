
import React, { useState } from 'react';
import { Calendar, ShieldCheck, Globe, Loader2, Sparkles, ArrowRight, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LoginViewProps {
  onLoginSuccess: (token: string, userEmail?: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Estado Google Legacy
  const [clientId] = useState(() => 
    localStorage.getItem('google_client_id') || '296569463763-jphc8f4i8b8tip0k1e3jb7s9lnbrgdc6.apps.googleusercontent.com'
  );

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Remove espaços em branco acidentais que causam o erro "Email address is invalid"
    const cleanEmail = email.trim();

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onLoginSuccess(data.session.access_token, data.user?.email);
        }
      } else {
        // Enviar metadados extras pode prevenir erros em Triggers mal configurados no Supabase
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanEmail.split('@')[0],
              name: cleanEmail.split('@')[0],
              username: cleanEmail.split('@')[0],
            }
          }
        });

        if (error) throw error;
        
        if (data.user) {
          // Auto login após cadastro ou aviso de confirmação
          if (data.session) {
             onLoginSuccess(data.session.access_token, data.user.email);
          } else {
             // Se não retornou sessão, provavelmente requer confirmação de email
             alert("Cadastro realizado! Verifique seu email para confirmar antes de entrar.");
             setMode('login');
          }
        }
      }
    } catch (error: any) {
      console.error("Erro Auth:", error);
      let msg = "Erro ao processar solicitação.";
      
      // Tratamento de erros comuns do Supabase
      if (error.message?.includes("Invalid login credentials")) msg = "Credenciais inválidas. Verifique sua senha ou se confirmou o email.";
      else if (error.message?.includes("Invalid login")) msg = "Email ou senha incorretos.";
      else if (error.message?.includes("already registered")) msg = "Este email já está cadastrado.";
      else if (error.message?.includes("password")) msg = "A senha deve ter no mínimo 6 caracteres.";
      else if (error.message?.includes("Database error")) msg = "Erro interno do banco de dados (Trigger falhou). Tente o modo Offline.";
      else if (error.message?.includes("is invalid") || error.message?.includes("valid email")) msg = "O formato do email é inválido. Verifique se há espaços ou erros de digitação.";
      else if (error.status === 400 || error.code === '400') msg = "Dados inválidos. Verifique email e senha.";
      else if (error.status === 422) msg = "Email inválido ou formato incorreto.";
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error !== undefined) {
            setLoading(false);
            alert("A Google bloqueou o acesso. Tente o login por email/senha.");
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
    // Definir auth local sem recarregar a página para evitar tela branca/crash
    onLoginSuccess('offline_token', undefined);
  };

  return (
    <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-between px-6 py-8 max-w-md mx-auto relative overflow-hidden overflow-y-auto no-scrollbar">
      {/* Background FX */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />

      {/* Header Logo */}
      <div className="flex flex-col items-center justify-center w-full z-10 mt-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-sky-500/30 mb-6 animate-float">
            <Calendar className="w-10 h-10 text-white stroke-[2.5]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white mb-2">
          Calendar<span className="text-sky-500">.</span>Elite
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Secure Cloud Access</p>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="w-full z-10 space-y-6 flex-1">
        
        {/* Toggle Tabs */}
        <div className="flex p-1 bg-[#1a1c23] rounded-2xl border border-white/5">
          <button 
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-[#0b0e14] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-[#0b0e14] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Criar Conta
          </button>
        </div>

        {/* Email/Pass Form */}
        <form onSubmit={handleSupabaseAuth} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-sky-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                required
                placeholder="Seu Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1a1c23] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500/50 focus:bg-sky-500/5 transition-all"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-sky-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                required
                placeholder="Sua Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#1a1c23] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500/50 focus:bg-sky-500/5 transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-[10px] text-rose-400 font-bold leading-tight">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 ${mode === 'login' ? 'bg-sky-500' : 'bg-indigo-500'} text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? <LogIn className="w-4 h-4 stroke-[3]" /> : <UserPlus className="w-4 h-4 stroke-[3]" />)}
            {mode === 'login' ? 'Acessar Conta' : 'Cadastrar Grátis'}
          </button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-widest"><span className="bg-[#0b0e14] px-4 text-gray-600 font-black">Ou continue com</span></div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 font-black text-[9px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Google
          </button>

          <button
            type="button"
            onClick={handleLocalLogin}
            className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 font-black text-[9px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Offline
          </button>
        </div>
      </div>

      <div className="text-center opacity-20 mt-6 pb-2">
         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Elite Productivity System v3.5</p>
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

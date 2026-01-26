import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu,
  Zap,
  Plus,
  Calendar as CalendarIcon,
  Search,
  DollarSign,
  Target,
  Clock,
  MapPin,
  Settings,
  Globe,
  User,
  LogOut,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Database,
  WifiOff,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { ViewType, CalendarEvent } from './types';
import CalendarView from './components/CalendarView';
import AddEventView from './components/AddEventView';
import ShareView from './components/ShareView';
import RecentEventsView from './components/RecentEventsView';
import LoginView from './components/LoginView';
import ChatBotView from './components/ChatBotView';
import { COLOR_MAP, MOCK_USER } from './constants';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>(MOCK_USER.email);
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [currentTab, setCurrentTab] = useState('Mês');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Inicialização de Autenticação (Local ou Supabase)
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Verifica sessão Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || MOCK_USER.email);
        setUserId(session.user.id);
        return;
      }

      // 2. Verifica Auth Local/Legacy
      const localAuth = localStorage.getItem('calendar_auth') === 'true';
      if (localAuth) {
        setIsAuthenticated(true);
        // Mantém ID antigo ou gera novo para local
        let uid = localStorage.getItem('elite_user_id');
        if (!uid) {
          uid = 'user_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('elite_user_id', uid);
        }
        setUserId(uid);
      }
    };
    
    checkAuth();

    // Listener para mudanças de auth no Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || MOCK_USER.email);
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Carregar eventos do Supabase ao iniciar
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchEventsFromSupabase();
    }
  }, [isAuthenticated, userId]);

  const fetchEventsFromSupabase = async () => {
    setIsLoadingSupabase(true);
    setSupabaseError(null);
    try {
      if (!supabase) throw new Error("Cliente Supabase não inicializado");

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (data) {
        setEvents(data as CalendarEvent[]);
      }
    } catch (error: any) {
      console.error('Erro ao buscar do Supabase (Fallback para Local):', error);
      
      let errorMsg = "Erro de conexão";
      if (error.code === 'PGRST301') errorMsg = "Tabela 'events' não encontrada (RLS)";
      if (error.message?.includes('fetch')) errorMsg = "Sem internet ou bloqueado";
      if (error.code === '401' || error.message?.includes('JWT')) errorMsg = "Chave API Inválida";
      // Tratamento específico para o erro 42703 (Coluna inexistente)
      if (error.code === '42703') errorMsg = "Banco desatualizado (Falta coluna user_id). Modo Offline.";

      setSupabaseError(errorMsg);
      
      // Fallback: tentar carregar do localStorage se Supabase falhar
      const saved = localStorage.getItem('calendar_events_v3');
      if (saved) setEvents(JSON.parse(saved));
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const syncWithGoogle = useCallback(async () => {
    const token = localStorage.getItem('google_access_token');
    if (!token) return;

    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        localStorage.removeItem('google_access_token');
        return;
      }

      const data = await response.json();
      
      if (data.items) {
        const googleEvents: CalendarEvent[] = data.items.map((item: any) => ({
          id: item.id,
          googleEventId: item.id,
          title: item.summary || 'Sem título',
          date: item.start?.date || item.start?.dateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
          time: item.start?.dateTime ? item.start.dateTime.split('T')[1].substring(0, 5) : '00:00',
          description: item.description || '',
          location: item.location || '',
          value: 0,
          color: 'blue',
          isSynced: true,
          user_id: userId
        }));

        // Tentar salvar no Supabase apenas se não houver erro prévio
        if (!supabaseError && userId) {
          for (const gEvent of googleEvents) {
            try {
              const { data: existing } = await supabase
                .from('events')
                .select('id')
                .eq('google_event_id', gEvent.googleEventId)
                .single();

              if (!existing) {
                 await supabase.from('events').insert({
                   ...gEvent,
                   id: 'evt_' + Math.random().toString(36).substr(2, 9),
                   user_id: userId
                 });
              }
            } catch (e) {
              console.warn("Ignorando erro de sync google-supabase:", e);
            }
          }
          fetchEventsFromSupabase();
        } else {
          // Se Supabase estiver offline, apenas mergeia na memória
          setEvents(prev => {
             const newEvents = [...prev];
             googleEvents.forEach(ge => {
               if(!newEvents.find(e => e.googleEventId === ge.googleEventId)) {
                 newEvents.push(ge);
               }
             });
             return newEvents;
          });
        }
      }
    } catch (err) {
      console.error("Falha ao sincronizar:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, userId, supabaseError]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithGoogle();
    }
  }, [isAuthenticated, syncWithGoogle]);

  // Fallback para salvar no localStorage sempre que events mudar, para garantir modo offline
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendar_events_v3', JSON.stringify(events));
    }
  }, [events]);

  const handleLoginSuccess = (token: string, email?: string) => {
    localStorage.setItem('google_access_token', token);
    localStorage.setItem('calendar_auth', 'true');
    setIsAuthenticated(true);
    if (email) setUserEmail(email);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('calendar_auth');
    localStorage.removeItem('google_access_token');
    setIsAuthenticated(false);
    setUserEmail(MOCK_USER.email);
  };

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    setActiveView('calendar');
    setCurrentTab('Mês');

    const eventToSave = { ...newEvent, user_id: userId };

    // 1. Tentar salvar no Supabase (somente se não houver erro de schema conhecido)
    if (!supabaseError && userId) {
      try {
        const { error } = await supabase.from('events').insert(eventToSave);
        if (error) throw error;
      } catch (e) {
        console.error("Erro Supabase (salvando localmente):", e);
        // Não sobrescreve erro se já for um erro de schema
        if (!supabaseError) setSupabaseError("Falha de Sync");
      }
    }

    // 2. Sincronizar com Google
    if (newEvent.isSynced) {
      const token = localStorage.getItem('google_access_token');
      if (token) {
        try {
          const startTime = `${newEvent.date}T${newEvent.time}:00Z`;
          const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
          
          const gEvent = {
            summary: newEvent.title,
            location: newEvent.location,
            description: `${newEvent.description}\n\nValor: R$ ${newEvent.value}`,
            start: { dateTime: startTime },
            end: { dateTime: endTime }
          };

          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(gEvent)
            }
          );
          
          if (response.ok) {
             const created = await response.json();
             // Atualiza ID Google
             if (!supabaseError && userId) {
               await supabase
                  .from('events')
                  .update({ google_event_id: created.id })
                  .eq('id', newEvent.id);
             }
             setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, googleEventId: created.id } : e));
          }
        } catch (e) {
          console.error("Erro ao enviar para Google:", e);
        }
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));

    if (!supabaseError && userId) {
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error("Erro Supabase delete:", error);
      }
    }
  };

  const tabs = ['Lista', 'Dia', 'Semana', 'Mês', 'Planejamento'];
  const today = new Date().toISOString().split('T')[0];
  
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const planningStats = useMemo(() => {
    const totalSpent = events.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return { totalSpent, totalEvents: events.length };
  }, [events]);

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderTabContent = () => {
    if (isLoadingSupabase && events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-pulse">
           <Database className="w-8 h-8 mb-2 opacity-50" />
           <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</p>
        </div>
      );
    }

    switch (currentTab) {
      case 'Lista':
        return (
          <div className="px-5 space-y-4 animate-in slide-in-from-left duration-300 pb-32">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-4">Lista Geral</h3>
            {sortedEvents.map(event => <EventCard key={event.id} event={event} />)}
            {sortedEvents.length === 0 && <EmptyState text="Sua lista está limpa." />}
          </div>
        );
      case 'Dia':
        const dayEvents = events.filter(e => e.date === today);
        return (
          <div className="px-5 space-y-4 animate-in zoom-in-95 duration-300 pb-32">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-4">Hoje</h3>
            {dayEvents.map(event => <EventCard key={event.id} event={event} />)}
            {dayEvents.length === 0 && <EmptyState text="Nada para hoje." />}
          </div>
        );
      case 'Semana':
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        const weekEvents = events.filter(e => e.date >= today && e.date <= nextWeekStr);
        return (
          <div className="px-5 space-y-4 animate-in slide-in-from-right duration-300 pb-32">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-4">Próximos 7 Dias</h3>
            {weekEvents.map(event => <EventCard key={event.id} event={event} />)}
            {weekEvents.length === 0 && <EmptyState text="Semana sem eventos." />}
          </div>
        );
      case 'Planejamento':
        return (
          <div className="px-6 space-y-6 animate-in slide-in-from-bottom duration-300 pb-32">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-4">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-400" />} label="Total" value={`R$ ${planningStats.totalSpent.toFixed(2)}`} bg="bg-emerald-500/10" />
              <StatCard icon={<Target className="w-5 h-5 text-sky-400" />} label="Anotações" value={planningStats.totalEvents.toString()} bg="bg-sky-500/10" />
            </div>
          </div>
        );
      default: // Mês
        const hasGoogleToken = !!localStorage.getItem('google_access_token');
        return (
          <div className="animate-in fade-in duration-300 pb-32">
            <CalendarView events={events} onDateClick={() => setActiveView('add')} />
            <div className="px-6 mt-10">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Recentes</h3>
                 <div className="flex gap-3">
                   {hasGoogleToken && (
                     <button 
                      onClick={syncWithGoogle}
                      disabled={isSyncing}
                      className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${isSyncing ? 'text-sky-500 animate-pulse' : 'text-gray-600 hover:text-white transition-colors'}`}
                     >
                       <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                       Google Sync
                     </button>
                   )}
                   <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${supabaseError ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {supabaseError ? <WifiOff className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                      {supabaseError ? 'Offline' : 'Supabase'}
                   </div>
                 </div>
              </div>

              {supabaseError && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3">
                   <AlertTriangle className="w-4 h-4 text-rose-500" />
                   <p className="text-[9px] text-rose-400 font-bold leading-tight uppercase">
                     {supabaseError}
                   </p>
                </div>
              )}

              <div className="space-y-4">
                {events.slice(0, 5).map(event => <EventCard key={event.id} event={event} compact />)}
                {events.length === 0 && <EmptyState text="Nada anotado recentemente." />}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0e14] text-white max-w-md mx-auto relative overflow-hidden border-x border-gray-800 shadow-2xl">
      <header className={`pt-6 bg-[#0b0e14] z-50 px-5 space-y-6 ${activeView === 'chat' ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center border-2 border-white/10">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Conta Elite</p>
              <h1 className="text-sm font-black tracking-tight">{userEmail}</h1>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 active:scale-90 transition-all hover:bg-rose-500/10 hover:text-rose-500"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 text-gray-400" />
          <div className="flex-1 flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setCurrentTab(tab); setActiveView('calendar'); }}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentTab === tab ? 'tab-active text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-[#0b0e14] relative">
        {activeView === 'calendar' && renderTabContent()}
        {activeView === 'add' && <AddEventView onSave={handleAddEvent} onCancel={() => setActiveView('calendar')} />}
        {activeView === 'recent' && <RecentEventsView events={events} onDelete={handleDeleteEvent} onBack={() => setActiveView('calendar')} />}
        {activeView === 'share' && <ShareView events={events} onBack={() => setActiveView('calendar')} />}
        {activeView === 'chat' && <ChatBotView onAddEvent={handleAddEvent} onBack={() => setActiveView('calendar')} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav-blur border-t border-gray-800/50 flex justify-around items-center px-4 py-4 z-50">
        <NavButton icon={<CalendarIcon />} active={activeView === 'calendar'} onClick={() => { setActiveView('calendar'); setCurrentTab('Mês'); }} />
        <NavButton icon={<Search />} active={activeView === 'recent'} onClick={() => setActiveView('recent')} />
        <NavButton icon={<MessageSquareText />} active={activeView === 'chat'} onClick={() => setActiveView('chat')} />
        <NavButton icon={<Zap />} active={activeView === 'share'} onClick={() => setActiveView('share')} />
        <button onClick={() => setActiveView('add')} className="bg-white text-black p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-90 transition-all ml-2">
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </nav>
    </div>
  );
};

// Fix: cast icon to React.ReactElement<any> to allow any props including className
const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'text-white scale-110' : 'text-gray-500'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 stroke-[3]' })}
  </button>
);

const EventCard: React.FC<{ event: CalendarEvent; compact?: boolean }> = ({ event, compact }) => (
  <div className={`bg-[#1a1c23] ${compact ? 'p-4' : 'p-5'} rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden group`}>
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${COLOR_MAP[event.color]}`} />
    
    <div className="flex-1 min-w-0 ml-2">
      <h4 className={`font-black text-white truncate ${compact ? 'text-xs' : 'text-sm'} mb-1`}>{event.title}</h4>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          {event.time}
        </div>
        {!compact && event.location && (
          <div className="flex items-center gap-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest truncate">
            <MapPin className="w-3 h-3" />
            {event.location}
          </div>
        )}
      </div>
    </div>
    
    {Number(event.value) > 0 && (
      <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5">
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
          R$ {Number(event.value).toFixed(0)}
        </span>
      </div>
    )}
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 opacity-40">
    <FileX className="w-8 h-8 text-gray-500 mb-3" />
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">{text}</p>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, bg: string }> = ({ icon, label, value, bg }) => (
  <div className={`p-5 rounded-3xl border border-white/5 ${bg} flex flex-col justify-between h-28`}>
    <div className="flex justify-between items-start">
      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-black text-white tracking-tight">{value}</p>
    </div>
  </div>
);

export default App;

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
  RefreshCw
} from 'lucide-react';
import { ViewType, CalendarEvent } from './types';
import CalendarView from './components/CalendarView';
import AddEventView from './components/AddEventView';
import ShareView from './components/ShareView';
import RecentEventsView from './components/RecentEventsView';
import LoginView from './components/LoginView';
import ChatBotView from './components/ChatBotView';
import { COLOR_MAP, MOCK_USER } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('calendar_auth') === 'true';
    } catch {
      return false;
    }
  });
  
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [currentTab, setCurrentTab] = useState('Mês');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_events_v3');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Erro ao carregar eventos:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calendar_events_v3', JSON.stringify(events));
    } catch (e) {
      console.error("Erro ao salvar eventos:", e);
    }
  }, [events]);

  const syncWithGoogle = useCallback(async () => {
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      console.log("Modo local ativo - ignorando sync Google");
      return;
    }

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
          isSynced: true
        }));

        setEvents(prev => {
          const merged = [...prev];
          googleEvents.forEach(ge => {
            const exists = merged.findIndex(e => e.googleEventId === ge.googleEventId);
            if (exists === -1) {
              merged.push(ge);
            } else {
              merged[exists] = { ...merged[exists], ...ge, value: merged[exists].value };
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error("Falha ao sincronizar:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithGoogle();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('google_access_token', token);
    localStorage.setItem('calendar_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('calendar_auth');
    localStorage.removeItem('google_access_token');
    setIsAuthenticated(false);
  };

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    setActiveView('calendar');
    setCurrentTab('Mês');

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
             setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, googleEventId: created.id } : e));
          }
        } catch (e) {
          console.error("Erro ao enviar para Google:", e);
        }
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
                 {hasGoogleToken && (
                   <button 
                    onClick={syncWithGoogle}
                    disabled={isSyncing}
                    className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${isSyncing ? 'text-sky-500 animate-pulse' : 'text-gray-600 hover:text-white transition-colors'}`}
                   >
                     {isSyncing ? 'Sincronizando...' : 'Sincronizar Google'}
                     <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                   </button>
                 )}
              </div>
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
              <h1 className="text-sm font-black tracking-tight">{MOCK_USER.name}</h1>
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
        {activeView === 'recent' && <RecentEventsView events={events} onDelete={(id) => setEvents(prev => prev.filter(e => e.id !== id))} onBack={() => setActiveView('calendar')} />}
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

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'text-white scale-110' : 'text-gray-600'}`}>
    {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
  </button>
);

const EventCard: React.FC<{ event: CalendarEvent, compact?: boolean }> = ({ event, compact }) => (
  <div className="bg-[#1a1c23] p-5 rounded-[2rem] flex items-center gap-5 border border-gray-800/50 hover:border-sky-500/20 transition-all">
    <div className={`w-12 h-12 rounded-2xl ${COLOR_MAP[event.color] || 'bg-gray-500'} flex items-center justify-center text-white shadow-lg`}>
      <CalendarIcon className="w-6 h-6" />
    </div>
    <div className="flex-1 overflow-hidden">
      <h4 className="font-bold text-sm truncate uppercase tracking-tight text-white">{event.title}</h4>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
        {!compact && event.location && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.location}</span>}
      </div>
    </div>
    <div className="text-right flex flex-col items-end gap-1">
      <p className="text-xs font-black text-gray-400">R$ {Number(event.value).toFixed(2)}</p>
      {event.googleEventId && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[6px] font-black text-emerald-500 uppercase">Google</span>
        </div>
      )}
    </div>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, bg: string }> = ({ icon, label, value, bg }) => (
  <div className={`p-6 rounded-[2.5rem] ${bg} border border-white/5`}>
    <div className="mb-4">{icon}</div>
    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <p className="text-xl font-black text-white">{value}</p>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-20 text-center text-gray-600 text-sm font-medium italic">{text}</div>
);

export default App;

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
  User,
  LogOut,
  MessageSquareText,
  Database,
  FileX,
  Pencil
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>(MOCK_USER.email);
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [currentTab, setCurrentTab] = useState('Mês');
  
  // New state for selected date in calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Inicialização de Autenticação (Apenas Local)
  useEffect(() => {
    const checkAuth = async () => {
      const localAuth = localStorage.getItem('calendar_auth') === 'true';
      if (localAuth) {
        setIsAuthenticated(true);
        const storedEmail = localStorage.getItem('user_email');
        if (storedEmail) setUserEmail(storedEmail);
      }
      
      // Carregar eventos locais
      const saved = localStorage.getItem('calendar_events_v3');
      if (saved) {
        setEvents(JSON.parse(saved));
      }
    };
    
    checkAuth();
  }, []);

  // Fallback para salvar no localStorage sempre que events mudar
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendar_events_v3', JSON.stringify(events));
    }
  }, [events]);

  const handleLoginSuccess = (token: string, email?: string) => {
    localStorage.setItem('calendar_auth', 'true');
    setIsAuthenticated(true);
    if (email) {
      setUserEmail(email);
      localStorage.setItem('user_email', email);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('calendar_auth');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserEmail(MOCK_USER.email);
  };

  const handleAddEvent = async (newEvent: CalendarEvent, redirect: boolean = true) => {
    setEvents(prev => [newEvent, ...prev]);
    if (redirect) {
      setActiveView('calendar');
      setCurrentTab('Mês');
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setActiveView('edit');
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    // Correção: Apenas atualiza o estado, sem lógica de criação duplicada
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setActiveView('calendar');
    setEventToEdit(null);
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
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
            {sortedEvents.map(event => <EventCard key={event.id} event={event} onEdit={handleEditEvent} />)}
            {sortedEvents.length === 0 && <EmptyState text="Sua lista está limpa." />}
          </div>
        );
      case 'Dia':
        const dayEvents = events.filter(e => e.date === today);
        return (
          <div className="px-5 space-y-4 animate-in zoom-in-95 duration-300 pb-32">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-4">Hoje</h3>
            {dayEvents.map(event => <EventCard key={event.id} event={event} onEdit={handleEditEvent} />)}
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
            {weekEvents.map(event => <EventCard key={event.id} event={event} onEdit={handleEditEvent} />)}
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
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        const selectedDateEvents = events.filter(e => e.date === selectedDateStr);
        const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        return (
          <div className="animate-in fade-in duration-300 pb-32">
            <CalendarView 
              events={events} 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate} 
            />
            
            <div className="px-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                 <div>
                   <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-1">Selecionado</h3>
                   <p className="text-sm font-bold capitalize text-white">{selectedDateLabel}</p>
                 </div>
                 <button 
                  onClick={() => {
                    setEventToEdit(null);
                    setActiveView('add');
                  }}
                  className="bg-[#1a1c23] border border-white/5 hover:bg-white/5 text-white p-2.5 rounded-xl active:scale-95 transition-all"
                 >
                   <Plus className="w-4 h-4 stroke-[3]" />
                 </button>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => <EventCard key={event.id} event={event} onEdit={handleEditEvent} compact />)}
                </div>
              ) : (
                <div className="py-6 border-t border-white/5 flex flex-col items-center opacity-40">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sem eventos</p>
                </div>
              )}

              <div className="mt-8 border-t border-white/5 pt-6 flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</h3>
                 <div className="flex gap-3">
                   <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                      <Database className="w-3 h-3" />
                      Local
                   </div>
                 </div>
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
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Conta Local</p>
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
        {(activeView === 'add' || activeView === 'edit') && (
          <AddEventView 
            onSave={activeView === 'edit' ? handleUpdateEvent : (e) => handleAddEvent(e, true)} 
            onCancel={() => {
              setActiveView('calendar');
              setEventToEdit(null);
            }} 
            initialDate={selectedDate} 
            initialEvent={eventToEdit}
          />
        )}
        {activeView === 'recent' && <RecentEventsView events={events} onDelete={handleDeleteEvent} onEdit={handleEditEvent} onBack={() => setActiveView('calendar')} />}
        {activeView === 'share' && <ShareView events={events} onBack={() => setActiveView('calendar')} />}
        {activeView === 'chat' && <ChatBotView onAddEvent={handleAddEvent} onBack={() => setActiveView('calendar')} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav-blur border-t border-gray-800/50 flex justify-around items-center px-4 py-4 z-50">
        <NavButton icon={<CalendarIcon />} active={activeView === 'calendar'} onClick={() => { setActiveView('calendar'); setCurrentTab('Mês'); }} />
        <NavButton icon={<Search />} active={activeView === 'recent'} onClick={() => setActiveView('recent')} />
        <NavButton icon={<MessageSquareText />} active={activeView === 'chat'} onClick={() => setActiveView('chat')} />
        <NavButton icon={<Zap />} active={activeView === 'share'} onClick={() => setActiveView('share')} />
        <button 
          onClick={() => {
            setEventToEdit(null);
            setActiveView('add');
          }} 
          className="bg-white text-black p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-90 transition-all ml-2"
        >
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

const EventCard: React.FC<{ event: CalendarEvent; compact?: boolean; onEdit?: (event: CalendarEvent) => void }> = ({ event, compact, onEdit }) => (
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
    
    <div className="flex items-center gap-2">
      {Number(event.value) > 0 && (
        <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            R$ {Number(event.value).toFixed(0)}
          </span>
        </div>
      )}
      {onEdit && (
        <button 
          onClick={() => onEdit(event)}
          className="p-2 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
        >
          <Pencil className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
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
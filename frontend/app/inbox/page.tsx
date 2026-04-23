'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import ChatPanel from '../components/inbox/ChatPanel';
import SettingsModal from '../components/SettingsModal';
import LabelBadge from '../components/inbox/LabelBadge';
import { useNotifications } from '../lib/useNotifications';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', in_progress: 'En progreso', waiting: 'Esperando', sold: 'Vendido', lost: 'Perdido',
};
const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', in_progress: '#f59e0b', waiting: '#8b5cf6', sold: '#10b981', lost: '#ef4444',
};
const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '📱', instagram: '📸', messenger: '💬', email: '📧', widget: '🌐',
};

function InboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [labels, setLabels] = useState<any[]>([]);

  useNotifications(activeChatId);
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
    loadChats();
    api.get('/labels').then((r) => setLabels(r.data)).catch(() => {});

    const chatParam = searchParams.get('chat');
    if (chatParam) setActiveChatId(chatParam);

    const token = localStorage.getItem('access_token');
    if (token) {
      const socket = connectSocket(token);
      socket.on('chat:new-message', (data: any) => {
        const { chatId, message, contact } = data;
        setChats((prev) => {
          const exists = prev.find((c) => c.id === chatId);
          if (exists) {
            const isActive = chatId === activeChatIdRef.current;
            if (isActive && message.direction === 'inbound') {
              api.post(`/chats/${chatId}/read`).catch(() => {});
            }
            const updated = {
              ...exists,
              lastMessagePreview: message.content ?? '[Media]',
              lastMessageAt: message.sentAt,
              isLastMessagePrivate: message.isPrivate ?? false,
              unreadCount: (message.direction === 'inbound' && !isActive) ? (exists.unreadCount || 0) + 1 : 0,
            };
            return [updated, ...prev.filter((c) => c.id !== chatId)];
          } else { loadChats(); return prev; }
        });
        if (Notification.permission === 'granted') {
          new Notification(`Nuevo mensaje de ${contact?.fullName ?? 'Contacto'}`, {
            body: message.content?.substring(0, 80),
          });
        }
      });
      socket.on('chat:unassigned-message', (data: any) => {
        const { chatId, message } = data;
        setChats((prev) => {
          const exists = prev.find((c) => c.id === chatId);
          if (exists) {
            const updated = { ...exists, lastMessagePreview: message.content ?? '[Media]', lastMessageAt: message.sentAt, unreadCount: (exists.unreadCount || 0) + 1 };
            return [updated, ...prev.filter((c) => c.id !== chatId)];
          } else { loadChats(); return prev; }
        });
      });
    }
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    return () => { disconnectSocket(); };
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (searchQ.trim().length >= 2) {
      setSearching(true);
      searchTimer.current = setTimeout(async () => {
        try {
          const r = await api.get(`/search?q=${encodeURIComponent(searchQ.trim())}`);
          setSearchResults(r.data);
        } finally { setSearching(false); }
      }, 350);
    } else {
      setSearchResults(null);
      setSearching(false);
    }
  }, [searchQ]);

  async function loadChats() {
    try {
      let url = '/chats';
      const params: string[] = [];
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (filterChannel) params.push(`channel=${filterChannel}`);
      if (filterLabel) params.push(`labelId=${filterLabel}`);
      if (params.length) url = `/search/chats?${params.join('&')}`;
      const r = await api.get(url);
      setChats(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadChats(); }, [filterStatus, filterChannel, filterLabel]);

  function handleLogout() {
    disconnectSocket();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function formatTime(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  const activeFilters = [filterStatus, filterChannel, filterLabel].filter(Boolean).length;
  const displayChats = searchResults ? searchResults.chats ?? [] : chats;

  if (!user) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
      }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#4f46e5', marginRight: '4px' }}>CRM</span>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="🔍 Buscar contactos, mensajes..."
            style={{
              width: '100%', padding: '7px 12px', borderRadius: '8px',
              border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box',
              background: '#f9fafb',
            }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '11px', color: '#9ca3af' }}>...</span>
          )}
        </div>

        {/* Nav buttons */}
        <button onClick={() => router.push('/contacts')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
          👥 Contactos
        </button>
        <button onClick={() => router.push('/reports')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
          📊 Reportes
        </button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            ⚙️ Ajustes
          </button>
        </div>

        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{user.fullName}</span>
        <button onClick={handleLogout} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>Salir</button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar: chat list */}
        <div style={{ width: '300px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#f9fafb', flexShrink: 0 }}>
          {/* Filter bar */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFilters ? '10px' : 0 }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                Bandeja
                <span style={{ marginLeft: '6px', background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px' }}>
                  {displayChats.length}
                </span>
              </span>
              <button onClick={() => setShowFilters(!showFilters)} style={{
                border: 'none', background: activeFilters > 0 ? '#ede9fe' : 'transparent',
                borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px',
                color: activeFilters > 0 ? '#6366f1' : '#6b7280',
              }}>
                🔽 Filtros{activeFilters > 0 ? ` (${activeFilters})` : ''}
              </button>
            </div>
            {showFilters && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <option value="">Todos los estados</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <option value="">Todos los canales</option>
                  {['whatsapp', 'instagram', 'messenger', 'email', 'widget'].map((c) => (
                    <option key={c} value={c}>{CHANNEL_ICONS[c]} {c}</option>
                  ))}
                </select>
                <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <option value="">Todas las etiquetas</option>
                  {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                {activeFilters > 0 && (
                  <button onClick={() => { setFilterStatus(''); setFilterChannel(''); setFilterLabel(''); }}
                    style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search results header */}
          {searchResults && (
            <div style={{ padding: '8px 12px', background: '#ede9fe', fontSize: '12px', color: '#6366f1', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              Resultados de búsqueda — <button onClick={() => setSearchQ('')} style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Limpiar</button>
            </div>
          )}

          {/* Contact search results */}
          {searchResults?.contacts?.length > 0 && (
            <div style={{ borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <div style={{ padding: '6px 12px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f9fafb' }}>Contactos</div>
              {searchResults.contacts.map((c: any) => (
                <div key={c.id} onClick={() => router.push('/contacts')} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f9fafb' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                    {getInitials(c.fullName)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.fullName ?? 'Sin nombre'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{c.email ?? c.phone ?? ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Cargando...</div>}

            {!loading && displayChats.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '14px' }}>{searchResults ? 'Sin resultados' : 'No hay chats'}</div>
              </div>
            )}

            {displayChats.map((chat: any) => (
              <div key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                  api.post(`/chats/${chat.id}/read`).catch(() => {});
                }}
                style={{
                  padding: '10px 12px', borderBottom: '1px solid #eee',
                  background: activeChatId === chat.id ? '#ede9fe' : '#fff',
                  cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
                  borderLeft: activeChatId === chat.id ? '3px solid #4f46e5' : '3px solid transparent',
                }}
                onMouseEnter={(e) => { if (activeChatId !== chat.id) (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6'; }}
                onMouseLeave={(e) => { if (activeChatId !== chat.id) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: '#dcfce7', color: '#166634',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600, flexShrink: 0, position: 'relative',
                }}>
                  {getInitials(chat.contact?.fullName)}
                  <span style={{ position: 'absolute', bottom: -1, right: -1, fontSize: '10px' }}>{CHANNEL_ICONS[chat.channel] ?? '💬'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {chat.contact?.fullName ?? chat.contact?.whatsappPhone ?? 'Sin nombre'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>{formatTime(chat.lastMessageAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {chat.isLastMessagePrivate && <span>🔒</span>}
                      {chat.lastMessagePreview ?? 'Sin mensajes'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLORS[chat.status] ?? '#9ca3af', flexShrink: 0 }} title={STATUS_LABELS[chat.status]} />
                      {chat.unreadCount > 0 && (
                        <span style={{ background: '#16a34a', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Labels */}
                  {chat.labels?.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {chat.labels.slice(0, 3).map((l: any) => (
                        <LabelBadge key={l.id} label={l} small />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{ borderTop: '1px solid #e5e7eb', background: '#fff', padding: '8px', display: 'flex', gap: '4px', flexShrink: 0 }}>
            {[
              { label: '🏷️', title: 'Etiquetas', href: '/settings/labels' },
              { label: '⚡', title: 'Respuestas rápidas', href: '/settings/canned-responses' },
              { label: '👥', title: 'Equipos', href: '/settings/teams' },
              { label: '🌐', title: 'Widget', href: '/settings/widget' },
            ].map(({ label, title, href }) => (
              <button key={href} onClick={() => router.push(href)} title={title} style={{
                flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {activeChatId ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatPanel
              chatId={activeChatId}
              onClose={() => setActiveChatId(null)}
              onLabelsChange={(chatId, newLabels) => {
                setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, labels: newLabels } : c));
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '40px' }}>💬</div>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>Seleccioná un chat para ver la conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9ca3af' }}>Cargando...</div>}>
      <InboxContent />
    </Suspense>
  );
}

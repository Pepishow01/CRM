'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import ChatPanel from '../components/inbox/ChatPanel';
import SettingsModal from '../components/SettingsModal';

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
    loadChats();

    const token = localStorage.getItem('access_token');
    if (token) {
      const socket = connectSocket(token);

      socket.on('chat:new-message', (data: any) => {
        const { chatId, message, contact } = data;
        setChats((prev) => {
          const exists = prev.find((c) => c.id === chatId);
          if (exists) {
            const updated = {
              ...exists,
              lastMessagePreview: message.content ?? '[Media]',
              lastMessageAt: message.sentAt,
              unreadCount: (exists.unreadCount || 0) + 1,
            };
            return [updated, ...prev.filter((c) => c.id !== chatId)];
          } else {
            loadChats();
            return prev;
          }
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
            const updated = {
              ...exists,
              lastMessagePreview: message.content ?? '[Media]',
              lastMessageAt: message.sentAt,
              unreadCount: (exists.unreadCount || 0) + 1,
            };
            return [updated, ...prev.filter((c) => c.id !== chatId)];
          } else {
            loadChats();
            return prev;
          }
        });
      });
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  async function loadChats() {
    try {
      const r = await api.get('/chats');
      setChats(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  const STATUS_LABELS: Record<string, string> = {
    new: 'Nuevo',
    in_progress: 'En progreso',
    waiting: 'Esperando',
    sold: 'Vendido',
    lost: 'Perdido',
  };

  const STATUS_COLORS: Record<string, string> = {
    new: '#3b82f6',
    in_progress: '#f59e0b',
    waiting: '#8b5cf6',
    sold: '#10b981',
    lost: '#ef4444',
  };

  if (!user) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>CRM Ventas</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>{user.fullName}</span>
          <button onClick={() => setIsSettingsOpen(true)} style={{
            padding: '5px 12px', borderRadius: '6px',
            border: '1px solid #e5e7eb', background: '#fff',
            fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>⚙️ Ajustes</button>
          <button onClick={handleLogout} style={{
            padding: '5px 12px', borderRadius: '6px',
            border: '1px solid #e5e7eb', background: '#fff',
            fontSize: '13px', cursor: 'pointer',
          }}>Salir</button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: '320px', borderRight: '1px solid #e5e7eb',
          overflowY: 'auto', background: '#f9fafb', flexShrink: 0,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
              Bandeja
              <span style={{
                marginLeft: '8px', background: '#6366f1', color: '#fff',
                borderRadius: '20px', padding: '1px 8px', fontSize: '11px',
              }}>{chats.length}</span>
            </div>
          </div>

          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              Cargando...
            </div>
          )}

          {!loading && chats.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <div style={{ fontSize: '14px' }}>No hay mensajes todavía</div>
            </div>
          )}

          {chats.map((chat) => (
            <div key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              style={{
                padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                background: activeChatId === chat.id ? '#ede9fe' : '#fff',
                cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center',
                borderLeft: activeChatId === chat.id ? '3px solid #4f46e5' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (activeChatId !== chat.id)
                  (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                if (activeChatId !== chat.id)
                  (e.currentTarget as HTMLDivElement).style.background = '#fff';
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: '#dcfce7', color: '#166634',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 600, flexShrink: 0,
              }}>
                {getInitials(chat.contact?.fullName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                    {chat.contact?.fullName ?? chat.contact?.whatsappPhone ?? 'Sin nombre'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {formatTime(chat.lastMessageAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px', color: '#6b7280',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '160px',
                  }}>
                    {chat.lastMessagePreview ?? 'Sin mensajes'}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span style={{
                      background: '#16a34a', color: '#fff',
                      borderRadius: '50%', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeChatId ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatPanel
              chatId={activeChatId}
              onClose={() => setActiveChatId(null)}
            />
          </div>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#9ca3af',
            flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '40px' }}>💬</div>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>
              Seleccioná un chat para ver la conversación
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
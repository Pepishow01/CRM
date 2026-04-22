'use client';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import AiPanel from './AiPanel';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  sentAt: string;
  contentType: string;
  mediaUrl?: string;
}

function MediaMessage({ msg }: { msg: Message }) {
  const [mediaBlob, setMediaBlob] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (msg.mediaUrl && !mediaBlob) {
      setLoading(true);
      api.get(msg.mediaUrl, { responseType: 'blob' })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          setMediaBlob(url);
        })
        .catch((err) => console.error('Error cargando media:', err))
        .finally(() => setLoading(false));
    }
  }, [msg.mediaUrl]);

  if (msg.contentType === 'image' || msg.contentType === 'sticker') {
    return (
      <div style={{ marginTop: '4px' }}>
        {loading ? <div style={{ fontSize: '12px', padding: '10px' }}>Cargando imagen...</div> : 
          mediaBlob ? (
            <img src={mediaBlob} alt="Media" style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              borderRadius: '8px',
              display: 'block' 
            }} />
          ) : <div style={{ fontSize: '11px', opacity: 0.5 }}>[Imagen]</div>}
        {msg.content && <div style={{ marginTop: '6px' }}>{msg.content}</div>}
      </div>
    );
  }

  if (msg.contentType === 'audio') {
    return (
      <div style={{ marginTop: '4px' }}>
        {loading ? <div style={{ fontSize: '12px' }}>Cargando audio...</div> : 
          mediaBlob ? (
            <audio controls src={mediaBlob} style={{ maxWidth: '100%', height: '35px' }} />
          ) : <div style={{ fontSize: '11px', opacity: 0.5 }}>[Audio]</div>}
      </div>
    );
  }

  return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>;
}

interface Chat {
  id: string;
  channel: string;
  status: string;
  contact: {
    id: string;
    fullName?: string;
    whatsappPhone?: string;
  };
}

interface Props {
  chatId: string;
  onClose: () => void;
}

export default function ChatPanel({ chatId, onClose }: Props) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
    loadMessages();

    const socket = getSocket();

    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:unassigned-message', handleNewMessage);

    return () => {
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:unassigned-message', handleNewMessage);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChat() {
    try {
      const r = await api.get(`/chats/${chatId}`);
      setChat(r.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMessages() {
    try {
      const r = await api.get(`/chats/${chatId}/messages`);
      setMessages(r.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    const temp: Message = {
      id: `temp-${Date.now()}`,
      direction: 'outbound',
      content,
      sentAt: new Date().toISOString(),
      contentType: 'text',
    };
    setMessages((prev) => [...prev, temp]);

    try {
      const r = await api.post(`/chats/${chatId}/messages`, { text: content });
      setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? r.data : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(content);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  const STATUS_LABELS: Record<string, string> = {
    new: 'Nuevo',
    in_progress: 'En progreso',
    waiting: 'Esperando',
    sold: 'Vendido',
    lost: 'Perdido',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff', flexShrink: 0,
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: '#dcfce7', color: '#166534',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 600, flexShrink: 0,
        }}>
          {getInitials(chat?.contact?.fullName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: '15px' }}>
            {chat?.contact?.fullName ?? chat?.contact?.whatsappPhone ?? 'Sin nombre'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {chat?.channel} · {STATUS_LABELS[chat?.status ?? ''] ?? chat?.status}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            fontSize: '20px', cursor: 'pointer', color: '#9ca3af',
          }}
        >x</button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        background: '#f9fafb',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '20px' }}>
            No hay mensajes todavía
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
            marginBottom: '4px',
          }}>
            <div style={{
              maxWidth: '70%', padding: '8px 12px',
              borderRadius: msg.direction === 'outbound'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              background: msg.direction === 'outbound' ? '#4f46e5' : '#fff',
              color: msg.direction === 'outbound' ? '#fff' : '#111827',
              fontSize: '14px', lineHeight: '1.5',
              border: msg.direction === 'inbound' ? '1px solid #e5e7eb' : 'none',
              opacity: msg.id.startsWith('temp-') ? 0.7 : 1,
            }}>
              <MediaMessage msg={msg} />
              <div style={{
                fontSize: '11px', marginTop: '4px', textAlign: 'right',
                opacity: 0.6,
              }}>
                {formatTime(msg.sentAt)}
                {msg.direction === 'outbound' && ' vv'}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <AiPanel
        chatId={chatId}
        onUseSuggestion={(suggText) => {
          setText(suggText);
        }}
      />

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        background: '#fff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribir mensaje... (Enter para enviar)"
            rows={1}
            style={{
              flex: 1, padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px', fontSize: '14px',
              resize: 'none', outline: 'none',
              fontFamily: 'sans-serif',
              lineHeight: '1.5',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              border: 'none',
              background: text.trim() && !sending ? '#16a34a' : '#d1d5db',
              color: '#fff', cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontSize: '18px', flexShrink: 0,
            }}
          >
            up
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          Enter para enviar · Shift+Enter para nueva linea
        </div>
      </div>
    </div>
  );
}
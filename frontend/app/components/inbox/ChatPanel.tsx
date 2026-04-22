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
  isPrivate?: boolean;
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
  isBotActive: boolean;
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
  const [isPrivateMode, setIsPrivateMode] = useState(false);
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
          const newMessages = [...prev, data.message];
          return newMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
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

  async function handleSend(isPrivate: boolean = false) {
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
      isPrivate
    };
    setMessages((prev) => [...prev, temp]);

    try {
      const r = await api.post(`/chats/${chatId}/messages`, { text: content, isPrivate });
      setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? r.data : m))
      );
      if (isPrivate) setIsPrivateMode(false); // Volver a modo normal tras nota
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
      handleSend(isPrivateMode);
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

  const toggleBot = async () => {
    if (!chat) return;
    try {
      const newState = !chat.isBotActive;
      await api.patch(`/chats/${chat.id}/bot`, { active: newState });
      setChat({ ...chat, isBotActive: newState });
    } catch (err) {
      console.error('Error al cambiar estado del bot:', err);
    }
  };

  const insertSignature = () => {
    const signature = `\n\nSaludos Pedro - TDH Villa Cabrera`;
    setText(prev => prev + signature);
  };

  const STATUS_LABELS: Record<string, string> = {
    new: 'Nuevo',
    in_progress: 'En progreso',
    waiting: 'Esperando',
    sold: 'Vendido',
    lost: 'Perdido',
  };

  const toolButtonStyle = {
    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', border: 'none', background: '#f9fafb', cursor: 'pointer',
    fontSize: '18px', color: '#6b7280', transition: 'background 0.2s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleBot} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '20px', border: '1px solid',
            borderColor: chat?.isBotActive ? '#10b981' : '#d1d5db',
            background: chat?.isBotActive ? '#ecfdf5' : '#fff',
            color: chat?.isBotActive ? '#059669' : '#374151',
            fontSize: '11px', fontWeight: '600', cursor: 'pointer',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: chat?.isBotActive ? '#10b981' : '#9ca3af' }} />
            {chat?.isBotActive ? 'BOT ACTIVO' : 'BOT DESACTIVADO'}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>x</button>
        </div>
      </div>

      {/* ÁREA DE MENSAJES */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        background: '#f9fafb',
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
            marginBottom: '8px',
          }}>
            <div style={{
              maxWidth: '75%', padding: '10px 14px',
              borderRadius: msg.direction === 'outbound' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.isPrivate ? '#fef9c3' : (msg.direction === 'outbound' ? '#4f46e5' : '#fff'),
              color: msg.isPrivate ? '#854d0e' : (msg.direction === 'outbound' ? '#fff' : '#111827'),
              fontSize: '14px', lineHeight: '1.5',
              border: msg.isPrivate ? '1px solid #fde047' : (msg.direction === 'inbound' ? '1px solid #e5e7eb' : 'none'),
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              {msg.isPrivate && <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', color: '#a16207' }}>📌 Nota Privada</div>}
              <MediaMessage msg={msg} />
              <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right', opacity: 0.6 }}>
                {formatTime(msg.sentAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <AiPanel chatId={chatId} onUseSuggestion={(s) => setText(s)} />

      {/* ÁREA DE ENTRADA PRO (Basada en la foto) */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button 
            onClick={() => setIsPrivateMode(false)}
            style={{ 
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: !isPrivateMode ? '#f3f4f6' : 'transparent',
              fontWeight: !isPrivateMode ? 600 : 500,
              fontSize: '14px', cursor: 'pointer', color: !isPrivateMode ? '#111827' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >Responder</button>
          <button 
            onClick={() => setIsPrivateMode(true)}
            style={{ 
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: isPrivateMode ? '#fef9c3' : 'transparent',
              fontWeight: isPrivateMode ? 600 : 500,
              fontSize: '14px', cursor: 'pointer', color: isPrivateMode ? '#854d0e' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >Nota privada</button>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px',
          background: isPrivateMode ? '#fffbeb' : '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s'
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isPrivateMode ? "Escribe una nota interna para el equipo..." : "Shift + enter for new line. Comience con '/' para seleccionar una respuesta predefinida."}
            style={{
              width: '100%', minHeight: '80px', border: 'none', outline: 'none',
              background: 'transparent', fontSize: '15px', resize: 'none', padding: '4px',
              color: '#1f2937'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={toolButtonStyle} title="Emojis">😊</button>
              <button style={toolButtonStyle} title="Adjuntar archivo">📎</button>
              <button style={toolButtonStyle} title="Grabar audio">🎤</button>
              <button onClick={insertSignature} style={toolButtonStyle} title="Insertar firma">✍️</button>
              <button style={toolButtonStyle} title="Plantillas de WhatsApp">💬</button>
            </div>

            <button
              onClick={() => handleSend(isPrivateMode)}
              disabled={!text.trim() || sending}
              style={{
                padding: '10px 24px', borderRadius: '12px', border: 'none',
                background: isPrivateMode ? '#f59e0b' : '#3b82f6',
                color: '#fff', fontWeight: 600, fontSize: '14px',
                cursor: 'pointer', transition: 'all 0.2s',
                opacity: (!text.trim() || sending) ? 0.6 : 1,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {isPrivateMode ? 'Guardar nota' : 'Enviar (↩)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
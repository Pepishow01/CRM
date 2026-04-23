'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import AiPanel from './AiPanel';
import TemplatesModal from './TemplatesModal';
import LabelPicker from './LabelPicker';
import LabelBadge from './LabelBadge';
import CannedResponsePicker from './CannedResponsePicker';
import ContactInfoPanel from './ContactInfoPanel';

// Importación dinámica para evitar errores de SSR con el selector de emojis
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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
            <img src={mediaBlob} alt="Media" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', display: 'block' }} />
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

interface ChatPanelProps {
  chatId: string;
  onClose: () => void;
  onLabelsChange?: (chatId: string, labels: any[]) => void;
}

export default function ChatPanel({ chatId, onClose, onLabelsChange }: ChatPanelProps) {
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [chatLabels, setChatLabels] = useState<any[]>([]);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string | null } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
    loadMessages();
    const socket = getSocket();
    
    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        setMessages((prev) => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          const newList = [...prev, data.message];
          return newList.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        });
      }
    };

    socket.on('chat:new-message', handleNewMessage);
    
    return () => {
      socket.off('chat:new-message', handleNewMessage);
    };
  }, [chatId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages]);

  async function loadChat() {
    try {
      const r = await api.get(`/chats/${chatId}`);
      setChat(r.data);
      api.get(`/labels/chat/${chatId}`).then((lr) => setChatLabels(lr.data)).catch(() => {});
    } catch (err) { console.error(err); }
  }

  function handleLabelsChange(newLabels: any[]) {
    setChatLabels(newLabels);
    onLabelsChange?.(chatId, newLabels);
  }
  
  async function loadMessages() { 
    try {
      const r = await api.get(`/chats/${chatId}/messages`); 
      setMessages(r.data); 
    } catch (err) { console.error(err); }
  }

  async function handleSend(isPrivate: boolean = false) {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const r = await api.post(`/chats/${chatId}/messages`, { text: content, isPrivate });
      setMessages((prev) => {
        if (prev.find((m) => m.id === r.data.id)) return prev;
        return [...prev, r.data];
      });
      if (r.data.whatsappError) {
        alert(`Mensaje guardado pero no enviado por WhatsApp:\n${r.data.whatsappError}`);
      }
    } catch (err: any) {
      setText(content);
      const msg = err?.response?.data?.message || 'Error al enviar mensaje';
      alert(msg);
    } finally { setSending(false); }
  }

  const stageFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl });
  };

  const cancelPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const sendPendingFile = async () => {
    if (!pendingFile || sending) return;
    const { file } = pendingFile;
    cancelPendingFile();
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const r = await api.post(`/chats/${chatId}/messages/media`, {
        mediaId: uploadRes.data.mediaId,
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      });
      setMessages(prev => {
        if (prev.find((m) => m.id === r.data.id)) return prev;
        return [...prev, r.data];
      });
      if (r.data.whatsappError) {
        alert(`Archivo guardado pero no enviado por WhatsApp:\n${r.data.whatsappError}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error subiendo archivo';
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    stageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    stageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
        setAudioBlob(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) { alert('Permiso de micrófono denegado'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.ogg');
      const uploadRes = await api.post('/media/upload', formData);
      const r = await api.post(`/chats/${chatId}/messages/media`, {
        mediaId: uploadRes.data.mediaId,
        contentType: 'audio/ogg',
        filename: 'Nota de voz'
      });
      setMessages(prev => [...prev, r.data]);
      setAudioBlob(null);
    } catch (err) { alert('Error enviando audio'); }
    finally { setSending(false); }
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(isPrivateMode); 
    }
  }

  const insertSignature = () => setText(prev => prev + `\n\nSaludos Pedro - TDH Villa Cabrera`);

  const toolButtonStyle = {
    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', border: 'none', background: '#f9fafb', cursor: 'pointer',
    fontSize: '18px', color: '#6b7280', transition: 'background 0.2s'
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
    {/* LEFT: messages column */}
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>
            {chat?.contact?.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '15px' }}>{chat?.contact?.fullName || 'Chat'}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {chat?.channel} · {chat?.status}
              {chat?.assignedTo && ` · ${chat.assignedTo.fullName}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          flex: 1, overflowY: 'auto', padding: '16px', background: isDragging ? '#eff6ff' : '#f9fafb',
          display: 'flex', flexDirection: 'column', gap: '8px',
          border: isDragging ? '2px dashed #3b82f6' : '2px dashed transparent',
          transition: 'background 0.15s, border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(239,246,255,0.85)', zIndex: 10, fontSize: '16px', color: '#2563eb', fontWeight: 600, pointerEvents: 'none',
          }}>
            Soltá el archivo aquí para enviarlo
          </div>
        )}
        {messages.map((msg) => {
          // Activity messages: centered gray pill
          if (msg.contentType === 'activity') {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <div style={{ background: '#e5e7eb', color: '#6b7280', fontSize: '11px', borderRadius: '999px', padding: '3px 12px', maxWidth: '80%', textAlign: 'center' }}>
                  {msg.content}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: '12px',
                background: msg.isPrivate ? '#fef9c3' : (msg.direction === 'outbound' ? '#4f46e5' : '#fff'),
                color: msg.isPrivate ? '#854d0e' : (msg.direction === 'outbound' ? '#fff' : '#111827'),
                fontSize: '14px', border: msg.isPrivate ? '1px solid #fde047' : 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {msg.isPrivate && <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#a16207' }}>📌 NOTA PRIVADA</div>}
                <MediaMessage msg={msg} />
                <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right', opacity: 0.6 }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <AiPanel chatId={chatId} onUseSuggestion={(s) => setText(s)} />

      {/* EMOJI PICKER POPUP */}
      {showEmoji && (
        <div style={{ position: 'absolute', bottom: '150px', left: '16px', zIndex: 100 }}>
          <EmojiPicker onEmojiClick={(e) => { setText(prev => prev + e.emoji); setShowEmoji(false); }} />
        </div>
      )}

      {/* INPUT AREA */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button onClick={() => setIsPrivateMode(false)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: !isPrivateMode ? '#f3f4f6' : 'transparent', fontWeight: !isPrivateMode ? 600 : 400, cursor: 'pointer' }}>Responder</button>
          <button onClick={() => setIsPrivateMode(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: isPrivateMode ? '#fef9c3' : 'transparent', fontWeight: isPrivateMode ? 600 : 400, cursor: 'pointer', color: isPrivateMode ? '#854d0e' : '#6b7280' }}>Nota privada</button>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px', background: isPrivateMode ? '#fffbeb' : '#fff', position: 'relative' }}>
          <CannedResponsePicker trigger={text} onSelect={(content) => setText(content)} />
          {pendingFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#f3f4f6', borderRadius: '10px' }}>
              {pendingFile.previewUrl ? (
                <img src={pendingFile.previewUrl} alt="preview" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '48px', height: '48px', background: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {pendingFile.file.type.startsWith('audio/') ? '🎵' : pendingFile.file.type === 'application/pdf' ? '📄' : '📎'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.file.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{(pendingFile.file.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={cancelPendingFile} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>✕</button>
            </div>
          ) : audioBlob ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
              <audio src={URL.createObjectURL(audioBlob)} controls style={{ height: '30px' }} />
              <button onClick={() => setAudioBlob(null)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>🗑️</button>
              <button onClick={sendAudio} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>Enviar audio</button>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isPrivateMode ? "Escribe una nota interna..." : "Shift + enter for new line. Comience con '/' para seleccionar una respuesta..."}
              style={{ width: '100%', minHeight: '60px', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', resize: 'none' }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowEmoji(!showEmoji)} style={toolButtonStyle}>😊</button>
              <button onClick={() => fileInputRef.current?.click()} style={toolButtonStyle}>📎</button>
              <button 
                onMouseDown={startRecording} 
                onMouseUp={stopRecording}
                style={{ ...toolButtonStyle, background: isRecording ? '#fee2e2' : '#f9fafb', color: isRecording ? '#ef4444' : '#6b7280' }}
              >
                🎤
              </button>
              <button onClick={insertSignature} style={toolButtonStyle}>✍️</button>
              <button onClick={() => setShowTemplates(true)} style={toolButtonStyle}>💬</button>
            </div>
            <button
              onClick={() => pendingFile ? sendPendingFile() : handleSend(isPrivateMode)}
              disabled={(!text.trim() && !audioBlob && !pendingFile) || sending}
              style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: isPrivateMode ? '#f59e0b' : '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: ((!text.trim() && !pendingFile) || sending) ? 0.6 : 1 }}
            >
              {sending ? 'Enviando...' : pendingFile ? 'Enviar archivo' : isPrivateMode ? 'Guardar nota' : 'Enviar (↩)'}
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
      {showTemplates && <TemplatesModal chatId={chatId} onClose={() => setShowTemplates(false)} onSend={loadMessages} />}
    </div>{/* end left column */}

    {/* RIGHT: contact info panel */}
    {chat && (
      <ContactInfoPanel
        chatId={chatId}
        chat={chat}
        chatLabels={chatLabels}
        onLabelsChange={handleLabelsChange}
        onChatUpdate={loadChat}
      />
    )}
    </div>
  );
}
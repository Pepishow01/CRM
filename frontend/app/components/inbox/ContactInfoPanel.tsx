'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import LabelPicker from './LabelPicker';
import LabelBadge from './LabelBadge';
import MacrosPanel from './MacrosPanel';

interface ContactInfoPanelProps {
  chatId: string;
  chat: any;
  chatLabels: any[];
  onLabelsChange: (labels: any[]) => void;
  onChatUpdate: () => void;
}

const PRIORITIES = [
  { value: 'none',   label: 'Ninguna',  color: '#9ca3af' },
  { value: 'low',    label: 'Baja',     color: '#22c55e' },
  { value: 'medium', label: 'Media',    color: '#f59e0b' },
  { value: 'high',   label: 'Alta',     color: '#ef4444' },
  { value: 'urgent', label: 'Urgente',  color: '#7c3aed' },
];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#374151' }}
      >
        {title}
        <span style={{ fontSize: '16px', color: '#9ca3af' }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '0 16px 12px' }}>{children}</div>}
    </div>
  );
}

export default function ContactInfoPanel({ chatId, chat, chatLabels, onLabelsChange, onChatUpdate }: ContactInfoPanelProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentStatus, setAgentStatus] = useState<Record<string, boolean>>({});
  const [teams, setTeams] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [sendingTranscript, setSendingTranscript] = useState(false);
  const [previousChats, setPreviousChats] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [attrDefs, setAttrDefs] = useState<any[]>([]);
  const [attrValues, setAttrValues] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  const contact = chat?.contact;
  const initials = contact?.fullName?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  useEffect(() => {
    api.get('/users').then((r) => {
      setAgents(r.data);
      const statusMap: Record<string, boolean> = {};
      r.data.forEach((a: any) => { statusMap[a.id] = a.isOnline || false; });
      setAgentStatus(statusMap);
    }).catch(() => {});

    // Listen for real-time agent status updates
    import('../../lib/socket').then(({ getSocket }) => {
      const socket = getSocket();
      const handler = (data: any) => {
        setAgentStatus((prev) => ({ ...prev, [data.userId]: data.isOnline }));
      };
      socket.on('agent:status', handler);
      return () => { socket.off('agent:status', handler); };
    });
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
    api.get('/companies').then((r) => setCompanies(r.data)).catch(() => {});
    api.get('/custom-attributes/definitions?entityType=contact').then((r) => setAttrDefs(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatId) {
      api.get(`/chats/${chatId}/contact-chats`)
        .then((r) => setPreviousChats(r.data.filter((c: any) => c.id !== chatId)))
        .catch(() => {});
    }
    if (chat?.contact?.id) {
      api.get(`/custom-attributes/values/${chat.contact.id}`).then((r) => setAttrValues(r.data)).catch(() => {});
      api.get(`/contacts/${chat.contact.id}/notes`).then((r) => setContactNotes(r.data)).catch(() => {});
    }
    api.get(`/chats/${chatId}/participants`).then((r) => setParticipants(r.data)).catch(() => {});
  }, [chatId, chat?.contact?.id]);

  async function updateAgent(userId: string) {
    setUpdatingAgent(true);
    try {
      await api.patch(`/chats/${chatId}`, { assignedTo: userId === 'none' ? null : userId });
      onChatUpdate();
    } finally { setUpdatingAgent(false); }
  }

  async function updateTeam(teamId: string) {
    setUpdatingTeam(true);
    try {
      await api.patch(`/chats/${chatId}`, { teamId: teamId === 'none' ? null : teamId });
      onChatUpdate();
    } finally { setUpdatingTeam(false); }
  }

  async function updateCompany(companyId: string) {
    await api.patch(`/contacts/${contact?.id}`, { companyId: companyId === 'none' ? null : companyId });
    onChatUpdate();
  }

  async function sendTranscript() {
    setSendingTranscript(true);
    try {
      await api.post(`/email/transcript/${chatId}`, { email: contact?.email });
      alert('Transcripción enviada al email del contacto');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error enviando transcripción');
    } finally { setSendingTranscript(false); }
  }

  async function updatePriority(priority: string) {
    setUpdatingPriority(true);
    try {
      await api.patch(`/chats/${chatId}`, { priority });
      onChatUpdate();
    } finally { setUpdatingPriority(false); }
  }

  async function addNote() {
    if (!note.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const r = await api.post(`/contacts/${contact?.id}/notes`, { content: note.trim() });
      setContactNotes((prev) => [r.data, ...prev]);
      setNote('');
    } finally { setSavingNote(false); }
  }

  async function deleteNote(noteId: string) {
    await api.delete(`/contacts/${contact?.id}/notes/${noteId}`);
    setContactNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  const dropdownStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb',
    background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block',
  };

  const currentPriority = PRIORITIES.find((p) => p.value === (chat?.priority || 'none')) || PRIORITIES[0];

  return (
    <div style={{ width: '300px', minWidth: '300px', borderLeft: '1px solid #e5e7eb', background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontSize: '13px' }}>

      {/* Contact Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, margin: '0 auto 10px' }}>
          {initials}
        </div>
        <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>{contact?.fullName || 'Contacto'}</div>

        {contact?.email && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
            <span>✉️</span><span>{contact.email}</span>
          </div>
        )}
        {!contact?.email && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px', color: '#9ca3af', fontSize: '12px' }}>
            <span>✉️</span><span>No disponible</span>
          </div>
        )}

        {contact?.whatsappPhone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
            <span>📞</span>
            <span>{contact.whatsappPhone}</span>
            <button
              onClick={() => navigator.clipboard.writeText(contact.whatsappPhone)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#9ca3af', padding: '0 2px' }}
              title="Copiar"
            >📋</button>
          </div>
        )}

        {contact?.company && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
            <span>🏢</span><span>{contact.company}</span>
          </div>
        )}
        {!contact?.company && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>
            <span>🏢</span><span>No disponible</span>
          </div>
        )}
      </div>

      {/* Conversation Actions */}
      <Section title="Acciones de conversación">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <div>
            <span style={labelStyle}>Agente asignado</span>
            <select
              value={chat?.assignedTo?.id || 'none'}
              onChange={(e) => updateAgent(e.target.value)}
              disabled={updatingAgent}
              style={dropdownStyle}
            >
              <option value="none">Sin asignar</option>
              {agents.map((a: any) => (
                <option key={a.id} value={a.id}>{agentStatus[a.id] ? '🟢 ' : '⚪ '}{a.fullName || a.email}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={labelStyle}>Equipo asignado</span>
            <select
              value={chat?.team?.id || 'none'}
              onChange={(e) => updateTeam(e.target.value)}
              disabled={updatingTeam}
              style={dropdownStyle}
            >
              <option value="none">Ninguno</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={labelStyle}>Prioridad</span>
            <select
              value={chat?.priority || 'none'}
              onChange={(e) => updatePriority(e.target.value)}
              disabled={updatingPriority}
              style={{ ...dropdownStyle, color: currentPriority.color }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} style={{ color: p.color }}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={labelStyle}>Empresa</span>
            <select
              value={contact?.company?.id || 'none'}
              onChange={(e) => updateCompany(e.target.value)}
              style={dropdownStyle}
            >
              <option value="none">Sin empresa</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={labelStyle}>Etiquetas de conversación</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              <LabelPicker chatId={chatId} currentLabels={chatLabels} onChanged={onLabelsChange} />
              {chatLabels.map((l) => (
                <LabelBadge key={l.id} label={l} small onRemove={() => onLabelsChange(chatLabels.filter((x) => x.id !== l.id))} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Macros */}
      <MacrosPanel chatId={chatId} onExecuted={onChatUpdate} />

      {/* Contact Notes */}
      <Section title="Notas de contacto" defaultOpen={false}>
        <div>
          {contactNotes.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '4px 0 8px' }}>
              Sin notas. Agregá una abajo.
            </p>
          )}
          {contactNotes.map((n: any) => (
            <div key={n.id} style={{ background: '#fef9c3', borderRadius: '6px', padding: '8px', marginBottom: '6px', border: '1px solid #fde68a', position: 'relative' }}>
              <div style={{ fontSize: '12px', color: '#78350f', paddingRight: '20px', whiteSpace: 'pre-wrap' }}>{n.content}</div>
              <div style={{ fontSize: '10px', color: '#a16207', marginTop: '4px' }}>
                {n.author?.fullName || 'Agente'} · {new Date(n.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
              <button
                onClick={() => deleteNote(n.id)}
                style={{ position: 'absolute', top: '6px', right: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#a16207', fontSize: '12px', opacity: 0.6, padding: '0 2px' }}
                title="Eliminar nota"
              >✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              placeholder="Agregar nota... (Enter para guardar)"
              rows={2}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none', resize: 'none' }}
            />
            <button onClick={addNote} disabled={savingNote} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '12px', alignSelf: 'flex-end' }}>
              {savingNote ? '...' : '+'}
            </button>
          </div>
        </div>
      </Section>

      {/* Previous Conversations */}
      <Section title="Conversaciones anteriores" defaultOpen={false}>
        {previousChats.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '4px 0' }}>
            No hay conversaciones previas asociadas a este contacto.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {previousChats.map((c: any) => (
              <div key={c.id} style={{ padding: '8px', borderRadius: '6px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#374151' }}>#{c.id.slice(0, 8)}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{c.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessagePreview || 'Sin mensajes'}
                </div>
                {c.lastMessageAt && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {new Date(c.lastMessageAt).toLocaleDateString('es-AR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Transcript */}
      {contact?.email && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <button
            onClick={sendTranscript}
            disabled={sendingTranscript}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            📧 {sendingTranscript ? 'Enviando...' : 'Enviar transcripción por email'}
          </button>
        </div>
      )}

      {/* Conversation Info */}
      <Section title="Información de la conversación" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Canal</span>
            <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{chat?.channel || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Etapa</span>
            <span style={{ fontWeight: 500 }}>{chat?.status || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Conversación</span>
            <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{chat?.convStatus || 'open'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Creado</span>
            <span style={{ fontWeight: 500 }}>{chat?.createdAt ? new Date(chat.createdAt).toLocaleDateString('es-AR') : '—'}</span>
          </div>
        </div>
      </Section>

      {/* Participants */}
      <Section title="Participantes de la conversación" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {participants.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {p.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>{p.fullName || p.email}</span>
              </div>
              <button
                onClick={() => api.delete(`/chats/${chatId}/participants/${p.id}`).then(() => setParticipants((prev) => prev.filter((x) => x.id !== p.id)))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}
              >✕</button>
            </div>
          ))}
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              const userId = e.target.value;
              api.post(`/chats/${chatId}/participants/${userId}`).then(() => {
                const agent = agents.find((a) => a.id === userId);
                if (agent) setParticipants((prev) => [...prev, agent]);
              });
              e.target.value = '';
            }}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f9fafb', fontSize: '12px', color: '#6b7280', cursor: 'pointer', marginTop: '4px' }}
          >
            <option value="">+ Agregar participante</option>
            {agents.filter((a) => !participants.find((p) => p.id === a.id)).map((a) => (
              <option key={a.id} value={a.id}>{a.fullName || a.email}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* Contact Attributes */}
      <Section title="Atributos de contacto" defaultOpen={false}>
        {attrDefs.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '4px 0' }}>No se encontraron atributos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {attrDefs.map((def) => {
              const val = attrValues.find((v: any) => v.definition?.id === def.id);
              return (
                <div key={def.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>{def.displayName}</span>
                  <span style={{ fontWeight: 500, fontSize: '12px' }}>{val?.value || '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

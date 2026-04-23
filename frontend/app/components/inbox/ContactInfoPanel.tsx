'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import LabelPicker from './LabelPicker';
import LabelBadge from './LabelBadge';

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
  const [teams, setTeams] = useState<any[]>([]);
  const [previousChats, setPreviousChats] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [contactNotes, setContactNotes] = useState<string[]>([]);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const contact = chat?.contact;
  const initials = contact?.fullName?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  useEffect(() => {
    api.get('/users').then((r) => setAgents(r.data)).catch(() => {});
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatId) {
      api.get(`/chats/${chatId}/contact-chats`)
        .then((r) => setPreviousChats(r.data.filter((c: any) => c.id !== chatId)))
        .catch(() => {});
    }
  }, [chatId]);

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

  async function updatePriority(priority: string) {
    setUpdatingPriority(true);
    try {
      await api.patch(`/chats/${chatId}`, { priority });
      onChatUpdate();
    } finally { setUpdatingPriority(false); }
  }

  function addNote() {
    if (!note.trim()) return;
    setContactNotes((prev) => [...prev, note.trim()]);
    setNote('');
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
                <option key={a.id} value={a.id}>{a.fullName || a.email}</option>
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

      {/* Contact Notes */}
      <Section title="Notas de contacto" defaultOpen={false}>
        <div>
          {contactNotes.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '4px 0 8px' }}>
              There are no notes yet. Use the Add note button to create one.
            </p>
          )}
          {contactNotes.map((n, i) => (
            <div key={i} style={{ background: '#fef9c3', borderRadius: '6px', padding: '8px', marginBottom: '6px', fontSize: '12px', color: '#78350f' }}>{n}</div>
          ))}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Agregar nota..."
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }}
            />
            <button onClick={addNote} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+</button>
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

      {/* Conversation Info */}
      <Section title="Información de la conversación" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Canal</span>
            <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{chat?.channel || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Estado</span>
            <span style={{ fontWeight: 500 }}>{chat?.status || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Creado</span>
            <span style={{ fontWeight: 500 }}>{chat?.createdAt ? new Date(chat.createdAt).toLocaleDateString('es-AR') : '—'}</span>
          </div>
        </div>
      </Section>

      {/* Contact Attributes */}
      <Section title="Atributos de contacto" defaultOpen={false}>
        <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '4px 0' }}>
          No se encontraron atributos
        </p>
      </Section>
    </div>
  );
}

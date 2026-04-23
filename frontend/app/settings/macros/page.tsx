'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';

const ACTION_TYPES = [
  { value: 'assign_agent',   label: 'Asignar agente' },
  { value: 'assign_team',    label: 'Asignar equipo' },
  { value: 'change_status',  label: 'Cambiar estado' },
  { value: 'set_priority',   label: 'Cambiar prioridad' },
  { value: 'add_label',      label: 'Agregar etiqueta' },
  { value: 'remove_label',   label: 'Quitar etiqueta' },
  { value: 'send_message',   label: 'Enviar mensaje' },
];

const STATUS_OPTIONS = ['new', 'in_progress', 'waiting', 'sold', 'lost'];
const PRIORITY_OPTIONS = ['none', 'low', 'medium', 'high', 'urgent'];

interface MacroAction { type: string; value: string; }
interface Macro { id: string; name: string; description?: string; actions: MacroAction[]; }

export default function MacrosPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [editing, setEditing] = useState<Macro | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actions, setActions] = useState<MacroAction[]>([{ type: 'change_status', value: 'in_progress' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    api.get('/users').then((r) => setAgents(r.data)).catch(() => {});
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
    api.get('/labels').then((r) => setLabels(r.data)).catch(() => {});
  }, []);

  async function load() {
    const r = await api.get('/macros');
    setMacros(r.data);
  }

  function openNew() {
    setEditing(null);
    setName('');
    setDescription('');
    setActions([{ type: 'change_status', value: 'in_progress' }]);
    setShowForm(true);
  }

  function openEdit(m: Macro) {
    setEditing(m);
    setName(m.name);
    setDescription(m.description || '');
    setActions(m.actions.length ? m.actions : [{ type: 'change_status', value: 'in_progress' }]);
    setShowForm(true);
  }

  function addAction() {
    setActions((prev) => [...prev, { type: 'change_status', value: 'in_progress' }]);
  }

  function updateAction(i: number, field: 'type' | 'value', val: string) {
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  }

  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function getValueOptions(type: string) {
    if (type === 'assign_agent') return agents.map((a) => ({ value: a.id, label: a.fullName || a.email }));
    if (type === 'assign_team') return teams.map((t) => ({ value: t.id, label: t.name }));
    if (type === 'change_status') return STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
    if (type === 'set_priority') return PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }));
    if (type === 'add_label' || type === 'remove_label') return labels.map((l) => ({ value: l.id, label: l.name }));
    return [];
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/macros/${editing.id}`, { name, description, actions });
      } else {
        await api.post('/macros', { name, description, actions });
      }
      await load();
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta macro?')) return;
    await api.delete(`/macros/${id}`);
    await load();
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Macros</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Secuencias de acciones para aplicar de un solo click</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          + Nueva macro
        </button>
      </div>

      {macros.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
          <div>No hay macros. Creá una para automatizar acciones repetitivas.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {macros.map((m) => (
          <div key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{m.name}</div>
                {m.description && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{m.description}</div>}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {m.actions.map((a, i) => (
                    <span key={i} style={{ background: '#f3f4f6', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#374151' }}>
                      {ACTION_TYPES.find((t) => t.value === a.type)?.label || a.type}: <strong>{a.value.slice(0, 20)}</strong>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(m)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Editar</button>
                <button onClick={() => remove(m.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>{editing ? 'Editar macro' : 'Nueva macro'}</h2>

            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }} />

            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Descripción (opcional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' }} />

            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Acciones</div>
            {actions.map((a, i) => {
              const opts = getValueOptions(a.type);
              return (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                  <select value={a.type} onChange={(e) => updateAction(i, 'type', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                    {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {a.type === 'send_message' ? (
                    <input value={a.value} onChange={(e) => updateAction(i, 'value', e.target.value)} placeholder="Texto del mensaje" style={{ flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                  ) : (
                    <select value={a.value} onChange={(e) => updateAction(i, 'value', e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                  <button onClick={() => removeAction(i)} style={{ padding: '8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
              );
            })}
            <button onClick={addAction} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px dashed #d1d5db', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              + Agregar acción
            </button>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

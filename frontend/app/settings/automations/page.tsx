'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const TRIGGERS: Record<string, string> = {
  conversation_created: 'Conversación creada',
  message_received:     'Mensaje recibido',
  status_changed:       'Estado cambiado',
};
const FIELDS: Record<string, string> = {
  channel:         'Canal',
  status:          'Etapa',
  conv_status:     'Estado de conversación',
  priority:        'Prioridad',
  assigned_to:     'Asignado a',
  message_content: 'Contenido del mensaje',
};
const OPERATORS: Record<string, string> = {
  equals:     'es igual a',
  not_equals: 'no es igual a',
  contains:   'contiene',
};
const ACTION_TYPES: Record<string, string> = {
  assign_agent:  'Asignar agente',
  assign_team:   'Asignar equipo',
  send_message:  'Enviar mensaje',
  resolve:       'Resolver conversación',
  add_label:     'Agregar etiqueta',
};

function RuleModal({ rule, agents, teams, labels, onSave, onClose }: any) {
  const [name, setName] = useState(rule?.name || '');
  const [trigger, setTrigger] = useState(rule?.trigger || 'conversation_created');
  const [conditions, setConditions] = useState<any[]>(rule?.conditions || []);
  const [actions, setActions] = useState<any[]>(rule?.actions || []);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);

  function addCondition() {
    setConditions((prev) => [...prev, { field: 'channel', operator: 'equals', value: '' }]);
  }
  function removeCondition(i: number) { setConditions((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateCondition(i: number, key: string, value: string) {
    setConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  }
  function addAction() { setActions((prev) => [...prev, { type: 'send_message', value: '' }]); }
  function removeAction(i: number) { setActions((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateAction(i: number, key: string, value: string) {
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, [key]: value } : a));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '560px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{rule ? 'Editar automatización' : 'Nueva automatización'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Disparador</label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
            {Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Condiciones</span>
            <button onClick={addCondition} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #4f46e5', color: '#4f46e5', background: 'none', cursor: 'pointer' }}>+ Agregar</button>
          </div>
          {conditions.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
              <select value={c.field} onChange={(e) => updateCondition(i, 'field', e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                {Object.entries(FIELDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={c.operator} onChange={(e) => updateCondition(i, 'operator', e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                {Object.entries(OPERATORS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} placeholder="valor" style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <button onClick={() => removeCondition(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>✕</button>
            </div>
          ))}
          {conditions.length === 0 && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Sin condiciones — se ejecuta siempre</p>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Acciones</span>
            <button onClick={addAction} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #4f46e5', color: '#4f46e5', background: 'none', cursor: 'pointer' }}>+ Agregar</button>
          </div>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
              <select value={a.type} onChange={(e) => updateAction(i, 'type', e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                {Object.entries(ACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {a.type === 'assign_agent' ? (
                <select value={a.value} onChange={(e) => updateAction(i, 'value', e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <option value="">Sin asignar</option>
                  {agents.map((ag: any) => <option key={ag.id} value={ag.id}>{ag.fullName || ag.email}</option>)}
                </select>
              ) : a.type === 'assign_team' ? (
                <select value={a.value} onChange={(e) => updateAction(i, 'value', e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <option value="">Sin equipo</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : a.type !== 'resolve' ? (
                <input value={a.value} onChange={(e) => updateAction(i, 'value', e.target.value)} placeholder="valor" style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              ) : <div style={{ flex: 1 }} />}
              <button onClick={() => removeAction(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={() => onSave({ name, trigger, conditions, actions, enabled })}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    load();
    api.get('/users').then((r) => setAgents(r.data)).catch(() => {});
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
    api.get('/labels').then((r) => setLabels(r.data)).catch(() => {});
  }, []);

  async function load() {
    const r = await api.get('/automations');
    setAutomations(r.data);
  }

  async function handleSave(data: any) {
    if (editing) {
      await api.patch(`/automations/${editing.id}`, data);
    } else {
      await api.post('/automations', data);
    }
    setShowModal(false);
    setEditing(null);
    load();
  }

  async function toggleEnabled(a: any) {
    await api.patch(`/automations/${a.id}`, { enabled: !a.enabled });
    load();
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta automatización?')) return;
    await api.delete(`/automations/${id}`);
    load();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Automatizaciones</h1>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            + Nueva regla
          </button>
        </div>

        {automations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Sin automatizaciones</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Creá reglas para asignar, responder o resolver conversaciones automáticamente</div>
          </div>
        )}

        {automations.map((a: any) => (
          <div key={a.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => toggleEnabled(a)}
              style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', background: a.enabled ? '#4f46e5' : '#d1d5db', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '1px', left: a.enabled ? '19px' : '1px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{a.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {TRIGGERS[a.trigger]} · {a.conditions?.length || 0} condiciones · {a.actions?.length || 0} acciones
              </div>
            </div>
            <button onClick={() => { setEditing(a); setShowModal(true); }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
            <button onClick={() => remove(a.id)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
          </div>
        ))}
      </div>

      {showModal && (
        <RuleModal
          rule={editing}
          agents={agents}
          teams={teams}
          labels={labels}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

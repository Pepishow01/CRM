'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';

const VALUE_TYPES = [
  { value: 'text',    label: 'Texto' },
  { value: 'number',  label: 'Número' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'date',    label: 'Fecha' },
  { value: 'list',    label: 'Lista de opciones' },
];

interface AttributeDef { id: string; name: string; displayName: string; entityType: string; valueType: string; required: boolean; listOptions?: string[]; }

export default function CustomAttributesPage() {
  const [defs, setDefs] = useState<AttributeDef[]>([]);
  const [tab, setTab] = useState<'contact' | 'chat'>('contact');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AttributeDef | null>(null);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [valueType, setValueType] = useState('text');
  const [required, setRequired] = useState(false);
  const [listOptions, setListOptions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await api.get('/custom-attributes/definitions');
    setDefs(r.data);
  }

  function openNew() {
    setEditing(null); setName(''); setDisplayName(''); setValueType('text'); setRequired(false); setListOptions('');
    setShowForm(true);
  }

  function openEdit(d: AttributeDef) {
    setEditing(d); setName(d.name); setDisplayName(d.displayName); setValueType(d.valueType); setRequired(d.required);
    setListOptions(d.listOptions?.join(', ') || '');
    setShowForm(true);
  }

  async function save() {
    if (!name.trim() || !displayName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name, displayName, entityType: tab, valueType, required,
        listOptions: valueType === 'list' ? listOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      };
      if (editing) await api.patch(`/custom-attributes/definitions/${editing.id}`, payload);
      else await api.post('/custom-attributes/definitions', payload);
      await load();
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este atributo?')) return;
    await api.delete(`/custom-attributes/definitions/${id}`);
    await load();
  }

  const filtered = defs.filter((d) => d.entityType === tab);

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Atributos personalizados</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Campos extra para contactos y conversaciones</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo atributo
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {(['contact', 'chat'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: tab === t ? '#fff' : 'transparent', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: '13px', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t === 'contact' ? '👤 Contacto' : '💬 Conversación'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div>No hay atributos para {tab === 'contact' ? 'contactos' : 'conversaciones'} todavía.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', background: '#fff' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{d.displayName}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Clave: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>{d.name}</code>
                {' · '}{VALUE_TYPES.find((v) => v.value === d.valueType)?.label}
                {d.required && <span style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 600 }}>Requerido</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openEdit(d)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
              <button onClick={() => remove(d.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>{editing ? 'Editar atributo' : 'Nuevo atributo'}</h2>

            {[{ label: 'Nombre interno (sin espacios)', val: name, set: setName, ph: 'ej: dni_cliente' },
              { label: 'Nombre visible', val: displayName, set: setDisplayName, ph: 'ej: DNI del cliente' }
            ].map(({ label, val, set, ph }) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{label}</label>
                <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de valor</label>
              <select value={valueType} onChange={(e) => setValueType(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
                {VALUE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            {valueType === 'list' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Opciones (separadas por coma)</label>
                <input value={listOptions} onChange={(e) => setListOptions(e.target.value)} placeholder="Opción 1, Opción 2, Opción 3" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Campo requerido
            </label>

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

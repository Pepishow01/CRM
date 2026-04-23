'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280'];

export default function LabelsSettingsPage() {
  const router = useRouter();
  const [labels, setLabels] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await api.get('/labels');
    setLabels(r.data);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/labels/${editing.id}`, { name, color, description });
      } else {
        await api.post('/labels', { name, color, description });
      }
      setName(''); setColor('#6366f1'); setDescription(''); setEditing(null);
      load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    await api.delete(`/labels/${id}`);
    load();
  }

  function startEdit(label: any) {
    setEditing(label);
    setName(label.name);
    setColor(label.color);
    setDescription(label.description ?? '');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/inbox')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Etiquetas</h1>
      </div>
      <div style={{ maxWidth: '640px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>{editing ? 'Editar etiqueta' : 'Nueva etiqueta'}</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la etiqueta"
              style={{ flex: 2, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)"
              style={{ flex: 2, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {PRESET_COLORS.map((c) => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                outline: color === c ? '3px solid #111' : '2px solid transparent',
                outlineOffset: '2px', transition: 'outline 0.1s',
              }} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving || !name.trim()} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px',
              opacity: saving || !name.trim() ? 0.6 : 1,
            }}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear etiqueta'}</button>
            {editing && (
              <button onClick={() => { setEditing(null); setName(''); setColor('#6366f1'); setDescription(''); }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {labels.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              No hay etiquetas creadas todavía
            </div>
          )}
          {labels.map((label, i) => (
            <div key={label.id} style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
              borderBottom: i < labels.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: label.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{label.name}</div>
                {label.description && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label.description}</div>}
              </div>
              <button onClick={() => startEdit(label)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
              <button onClick={() => remove(label.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

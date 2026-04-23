'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function CannedResponsesPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [search]);

  async function load() {
    const r = await api.get(`/canned-responses${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    setList(r.data);
  }

  async function save() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/canned-responses/${editing.id}`, { title, content, shortCode: shortCode || undefined });
      } else {
        await api.post('/canned-responses', { title, content, shortCode: shortCode || undefined });
      }
      reset(); load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta respuesta rápida?')) return;
    await api.delete(`/canned-responses/${id}`);
    load();
  }

  function startEdit(cr: any) {
    setEditing(cr); setTitle(cr.title); setContent(cr.content); setShortCode(cr.shortCode ?? '');
  }

  function reset() {
    setEditing(null); setTitle(''); setContent(''); setShortCode('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/inbox')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Respuestas Rápidas</h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>{editing ? 'Editar respuesta' : 'Nueva respuesta rápida'}</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título *"
              style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
            <input value={shortCode} onChange={(e) => setShortCode(e.target.value.replace(/\s/g, ''))} placeholder="Código (ej: saludo)"
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenido de la respuesta *" rows={4}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 12px' }}>
            Tip: en el chat, escribe <strong>/</strong> seguido del código o título para buscar esta respuesta
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving || !title.trim() || !content.trim()} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px',
              opacity: saving || !title.trim() || !content.trim() ? 0.6 : 1,
            }}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear'}</button>
            {editing && (
              <button onClick={reset} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar respuestas..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {list.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              {search ? 'Sin resultados' : 'No hay respuestas rápidas creadas todavía'}
            </div>
          )}
          {list.map((cr, i) => (
            <div key={cr.id} style={{
              padding: '14px 20px', borderBottom: i < list.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                    {cr.title}
                    {cr.shortCode && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6366f1', background: '#ede9fe', padding: '1px 6px', borderRadius: '4px' }}>/{cr.shortCode}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>{cr.content}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(cr)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                  <button onClick={() => remove(cr.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

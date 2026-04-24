'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function AutoAssignPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/users').then((r) => setAgents(r.data)).catch(() => {});
    api.get('/settings').then((r) => {
      const raw = r.data.auto_assign;
      if (raw) {
        const cfg = JSON.parse(raw);
        setEnabled(cfg.enabled ?? false);
        setSelectedIds(cfg.agentIds ?? []);
      }
    }).catch(() => {});
  }, []);

  function toggleAgent(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/settings', { key: 'auto_assign', value: JSON.stringify({ enabled, agentIds: selectedIds }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Auto-asignación</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Activar auto-asignación</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Los chats nuevos se asignan automáticamente en rotación (round-robin)</div>
            </div>
            <button onClick={() => setEnabled(!enabled)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: enabled ? '#4f46e5' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '2px', left: enabled ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Agentes en la rotación:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agents.map((a: any) => (
              <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '8px', border: `1px solid ${selectedIds.includes(a.id) ? '#4f46e5' : '#e5e7eb'}`, background: selectedIds.includes(a.id) ? '#ede9fe' : '#fff' }}>
                <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleAgent(a.id)} />
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {a.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.fullName || a.email}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{a.role}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

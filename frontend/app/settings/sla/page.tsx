'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const PRESETS = [
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
  { label: '4 horas', value: 240 },
  { label: '8 horas', value: 480 },
  { label: '24 horas', value: 1440 },
];

export default function SlaPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [minutes, setMinutes] = useState(240);
  const [customMinutes, setCustomMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const raw = r.data.sla;
      if (raw) {
        const cfg = JSON.parse(raw);
        setEnabled(cfg.enabled ?? false);
        setMinutes(cfg.minutes ?? 240);
      }
    }).catch(() => {});
  }, []);

  async function save() {
    const finalMinutes = customMinutes ? parseInt(customMinutes, 10) : minutes;
    setSaving(true);
    try {
      await api.post('/settings', { key: 'sla', value: JSON.stringify({ enabled, minutes: finalMinutes }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function formatTime(mins: number) {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>SLA — Tiempo de respuesta</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Activar alertas de SLA</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Muestra una advertencia cuando una conversación espera más del tiempo definido</div>
            </div>
            <button onClick={() => setEnabled(!enabled)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: enabled ? '#4f46e5' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '2px', left: enabled ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
          </div>

          {enabled && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Tiempo máximo de primera respuesta:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {PRESETS.map((p) => (
                  <button key={p.value} onClick={() => { setMinutes(p.value); setCustomMinutes(''); }}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${minutes === p.value && !customMinutes ? '#4f46e5' : '#e5e7eb'}`,
                      background: minutes === p.value && !customMinutes ? '#ede9fe' : '#f9fafb', color: minutes === p.value && !customMinutes ? '#4f46e5' : '#374151',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>O ingresar valor personalizado (en minutos):</label>
                <input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Ej: 90"
                  style={{ width: '160px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '13px', color: '#166534' }}>
                  Las conversaciones que estén esperando respuesta por más de <strong>{formatTime(customMinutes ? parseInt(customMinutes, 10) || 0 : minutes)}</strong> aparecerán marcadas en rojo en el inbox.
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={save} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

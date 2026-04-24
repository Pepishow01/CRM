'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_HOURS = {
  mon: { open: true,  from: '09:00', to: '18:00' },
  tue: { open: true,  from: '09:00', to: '18:00' },
  wed: { open: true,  from: '09:00', to: '18:00' },
  thu: { open: true,  from: '09:00', to: '18:00' },
  fri: { open: true,  from: '09:00', to: '18:00' },
  sat: { open: false, from: '09:00', to: '13:00' },
  sun: { open: false, from: '09:00', to: '13:00' },
};

export default function BusinessHoursPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires');
  const [autoReplyMessage, setAutoReplyMessage] = useState('Gracias por escribirnos. Estamos fuera de horario. Te responderemos a la brevedad.');
  const [hours, setHours] = useState<any>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const bh = r.data.business_hours;
      if (bh) {
        const parsed = JSON.parse(bh);
        setEnabled(parsed.enabled ?? false);
        setTimezone(parsed.timezone ?? 'America/Argentina/Buenos_Aires');
        setAutoReplyMessage(parsed.autoReplyMessage ?? '');
        setHours(parsed.hours ?? DEFAULT_HOURS);
      }
    }).catch(() => {});
  }, []);

  function updateDay(key: string, field: string, value: any) {
    setHours((prev: any) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/settings', { key: 'business_hours', value: JSON.stringify({ enabled, timezone, autoReplyMessage, hours }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Horario de atención</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Activar horario de atención</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Enviar respuesta automática fuera de horario</div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: enabled ? '#4f46e5' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
            >
              <span style={{ position: 'absolute', top: '2px', left: enabled ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
          </div>

          {enabled && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mensaje automático fuera de horario</label>
                <textarea
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Zona horaria</label>
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DAYS.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '90px', fontSize: '13px', fontWeight: 500 }}>{label}</div>
                    <input type="checkbox" checked={hours[key]?.open ?? false}
                      onChange={(e) => updateDay(key, 'open', e.target.checked)} />
                    {hours[key]?.open && (
                      <>
                        <input type="time" value={hours[key]?.from} onChange={(e) => updateDay(key, 'from', e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                        <span style={{ color: '#9ca3af' }}>a</span>
                        <input type="time" value={hours[key]?.to} onChange={(e) => updateDay(key, 'to', e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                      </>
                    )}
                    {!hours[key]?.open && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Cerrado</span>}
                  </div>
                ))}
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

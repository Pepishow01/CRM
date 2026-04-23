'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function WidgetSettingsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('¡Hola! ¿En qué te puedo ayudar?');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await api.get('/widget/configs');
    setConfigs(r.data);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/widget/configs', { name, welcomeMessage, color });
      setName(''); setWelcomeMessage('¡Hola! ¿En qué te puedo ayudar?'); setColor('#6366f1');
      load();
    } finally { setSaving(false); }
  }

  function getSnippet(token: string) {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `<script>
  window.CRMWidgetToken = '${token}';
  (function(d,s){
    var js=d.createElement(s); js.async=true;
    js.src='${base}/widget.js';
    d.head.appendChild(js);
  })(document,'script');
</script>`;
  }

  function copySnippet(token: string) {
    navigator.clipboard.writeText(getSnippet(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/inbox')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Live Chat Widget</h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Nuevo widget</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Crea un widget de chat para embeber en tu sitio web</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del widget (ej: Soporte Web)"
              style={{ flex: 2, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              style={{ width: '44px', height: '38px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '2px 4px' }} />
          </div>
          <input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Mensaje de bienvenida"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} />
          <button onClick={save} disabled={saving || !name.trim()} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px',
            opacity: saving || !name.trim() ? 0.6 : 1,
          }}>{saving ? 'Creando...' : 'Crear widget'}</button>
        </div>

        {configs.map((c) => (
          <div key={c.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color }} />
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>Token: {c.token.slice(0, 8)}...</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6b7280' }}>"{c.welcomeMessage}"</p>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Código para embeber en tu web:</div>
              <div style={{ background: '#1f2937', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                <pre style={{ margin: 0, fontSize: '11px', color: '#d1fae5', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {getSnippet(c.token)}
                </pre>
                <button onClick={() => copySnippet(c.token)} style={{
                  position: 'absolute', top: '8px', right: '8px',
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  background: copied === c.token ? '#10b981' : '#374151',
                  color: '#fff', cursor: 'pointer', fontSize: '11px',
                }}>{copied === c.token ? '¡Copiado!' : 'Copiar'}</button>
              </div>
            </div>
          </div>
        ))}
        {configs.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            No hay widgets creados todavía
          </div>
        )}
      </div>
    </div>
  );
}

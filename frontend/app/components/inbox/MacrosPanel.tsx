'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface MacrosPanelProps {
  chatId: string;
  onExecuted?: () => void;
}

export default function MacrosPanel({ chatId, onExecuted }: MacrosPanelProps) {
  const [macros, setMacros] = useState<any[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    api.get('/macros').then((r) => setMacros(r.data)).catch(() => {});
  }, []);

  async function execute(macroId: string, macroName: string) {
    setRunning(macroId);
    setResult(null);
    try {
      const r = await api.post(`/macros/${macroId}/execute/${chatId}`);
      setResult(`✓ ${macroName}: ${r.data.applied.join(', ')}`);
      onExecuted?.();
      setTimeout(() => setResult(null), 4000);
    } catch {
      setResult('Error al ejecutar la macro');
    } finally { setRunning(null); }
  }

  if (macros.length === 0) return null;

  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Macros</div>
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {result && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#166534' }}>{result}</div>
        )}
        {macros.map((m) => (
          <button
            key={m.id}
            onClick={() => execute(m.id, m.name)}
            disabled={running === m.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: running === m.id ? '#f9fafb' : '#fff', cursor: 'pointer', textAlign: 'left', opacity: running === m.id ? 0.7 : 1 }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{m.name}</div>
              {m.description && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.description}</div>}
            </div>
            <span style={{ fontSize: '18px', color: '#4f46e5' }}>▶</span>
          </button>
        ))}
      </div>
    </div>
  );
}

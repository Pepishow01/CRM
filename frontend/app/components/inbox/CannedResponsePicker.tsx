'use client';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';

interface CannedResponse { id: string; title: string; content: string; shortCode?: string; }

interface Props {
  onSelect: (content: string) => void;
  trigger: string;
}

export default function CannedResponsePicker({ onSelect, trigger }: Props) {
  const [results, setResults] = useState<CannedResponse[]>([]);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger.startsWith('/') && trigger.length > 1) {
      const search = trigger.slice(1);
      api.get(`/canned-responses?search=${encodeURIComponent(search)}`)
        .then((r) => {
          setResults(r.data.slice(0, 6));
          setVisible(r.data.length > 0);
          setSelected(0);
        });
    } else {
      setVisible(false);
    }
  }, [trigger]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!visible) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) { e.preventDefault(); onSelect(results[selected].content); setVisible(false); }
      if (e.key === 'Escape') setVisible(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible, selected, results]);

  if (!visible || results.length === 0) return null;

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100,
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)', marginBottom: '4px', overflow: 'hidden',
    }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '11px', color: '#9ca3af' }}>
        Respuestas rápidas — ↑↓ para navegar, Enter para seleccionar
      </div>
      {results.map((cr, i) => (
        <div
          key={cr.id}
          onClick={() => { onSelect(cr.content); setVisible(false); }}
          style={{
            padding: '8px 12px', cursor: 'pointer',
            background: i === selected ? '#ede9fe' : 'transparent',
            borderBottom: i < results.length - 1 ? '1px solid #f9fafb' : 'none',
          }}
          onMouseEnter={() => setSelected(i)}
        >
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
            {cr.shortCode && <span style={{ color: '#6366f1', marginRight: '6px' }}>/{cr.shortCode}</span>}
            {cr.title}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cr.content}
          </div>
        </div>
      ))}
    </div>
  );
}

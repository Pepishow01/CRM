'use client';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import LabelBadge from './LabelBadge';

interface Label { id: string; name: string; color: string; }

interface Props {
  chatId: string;
  currentLabels: Label[];
  onChanged: (labels: Label[]) => void;
}

export default function LabelPicker({ chatId, currentLabels, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/labels').then((r) => setAllLabels(r.data));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function toggle(label: Label) {
    const has = currentLabels.find((l) => l.id === label.id);
    if (has) {
      await api.delete(`/labels/chat/${chatId}/${label.id}`);
      onChanged(currentLabels.filter((l) => l.id !== label.id));
    } else {
      await api.post(`/labels/chat/${chatId}/${label.id}`);
      onChanged([...currentLabels, label]);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
          background: '#f9fafb', fontSize: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}
      >
        🏷️ Etiquetas
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '32px', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px', padding: '8px 0',
        }}>
          {allLabels.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#9ca3af' }}>
              No hay etiquetas creadas
            </div>
          )}
          {allLabels.map((label) => {
            const selected = !!currentLabels.find((l) => l.id === label.id);
            return (
              <div
                key={label.id}
                onClick={() => toggle(label)}
                style={{
                  padding: '6px 12px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '8px',
                  background: selected ? '#f3f4f6' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = selected ? '#f3f4f6' : 'transparent')}
              >
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: label.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', flex: 1 }}>{label.name}</span>
                {selected && <span style={{ fontSize: '12px', color: '#6366f1' }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

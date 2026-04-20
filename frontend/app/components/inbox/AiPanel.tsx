'use client';
import { useState } from 'react';
import api from '../../lib/api';

interface Suggestion {
  id: string;
  approach: string;
  label: string;
  message: string;
  why: string;
}

interface Props {
  chatId: string;
  onUseSuggestion: (text: string) => void;
}

const CLASSIFICATION_CONFIG: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  hot:  { label: 'Caliente', emoji: '🔥', bg: '#fef2f2', color: '#991b1b' },
  warm: { label: 'Tibio',    emoji: '🟡', bg: '#fffbeb', color: '#92400e' },
  cold: { label: 'Frío',     emoji: '❄️', bg: '#eff6ff', color: '#1e40af' },
};

export default function AiPanel({ chatId, onUseSuggestion }: Props) {
  const [classification, setClassification] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingClassify, setLoadingClassify] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'classify'>('suggestions');

  async function handleClassify() {
    setLoadingClassify(true);
    try {
      const r = await api.post(`/chats/${chatId}/ai/classify`);
      setClassification(r.data);
      setActiveTab('classify');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClassify(false);
    }
  }

  async function handleSuggest() {
    setLoadingSuggest(true);
    try {
      const r = await api.post(`/chats/${chatId}/ai/suggest`);
      setSuggestions(r.data?.suggestions ?? []);
      setActiveTab('suggestions');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggest(false);
    }
  }

  const cfg = classification ? CLASSIFICATION_CONFIG[classification.classification] : null;

  return (
    <div style={{
      borderTop: '1px solid #e5e7eb',
      background: '#fafafa',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>
          ✨ Asistente IA
        </span>

        {cfg && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '20px', fontSize: '11px',
            fontWeight: 600, background: cfg.bg, color: cfg.color,
          }}>
            {cfg.emoji} {cfg.label}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button
            onClick={handleSuggest}
            disabled={loadingSuggest}
            style={{
              padding: '3px 10px', borderRadius: '6px', fontSize: '12px',
              cursor: 'pointer', border: 'none',
              background: '#4f46e5', color: '#fff',
              opacity: loadingSuggest ? 0.6 : 1,
            }}
          >
            {loadingSuggest ? 'Generando...' : 'Sugerir respuestas'}
          </button>
          <button
            onClick={handleClassify}
            disabled={loadingClassify}
            style={{
              padding: '3px 10px', borderRadius: '6px', fontSize: '12px',
              cursor: 'pointer', border: '1px solid #e5e7eb',
              background: '#fff', color: '#374151',
              opacity: loadingClassify ? 0.6 : 1,
            }}
          >
            {loadingClassify ? 'Analizando...' : 'Clasificar lead'}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '10px 16px', maxHeight: '200px', overflowY: 'auto' }}>

        {/* Tab sugerencias */}
        {activeTab === 'suggestions' && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((s) => (
              <div key={s.id} style={{
                borderRadius: '8px', border: '1px solid #e5e7eb',
                overflow: 'hidden', background: '#fff',
              }}>
                <div
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                    borderRadius: '4px', background: '#ede9fe', color: '#4c1d95',
                    textTransform: 'uppercase', flexShrink: 0,
                  }}>
                    {s.label}
                  </span>
                  <span style={{
                    flex: 1, fontSize: '12px', color: '#6b7280',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {s.message}
                  </span>
                  <span style={{ fontSize: '12px', opacity: 0.4 }}>
                    {expanded === s.id ? '▲' : '▼'}
                  </span>
                </div>

                {expanded === s.id && (
                  <div style={{
                    padding: '10px', borderTop: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#111827', marginBottom: '6px' }}>
                      {s.message}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '8px' }}>
                      {s.why}
                    </p>
                    <button
                      onClick={() => {
                        onUseSuggestion(s.message);
                        setExpanded(null);
                      }}
                      style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                        background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Usar este mensaje
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab clasificación */}
        {activeTab === 'classify' && classification && (
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            <p style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>Intención:</strong> {classification.detected_intent}
            </p>
            <p style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>Razonamiento:</strong> {classification.reasoning}
            </p>
            <div style={{
              padding: '8px 10px', borderRadius: '8px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              fontSize: '12px', color: '#166534',
            }}>
              <strong>Acción recomendada:</strong> {classification.recommended_action}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && suggestions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', color: '#9ca3af' }}>
            Hacé clic en "Sugerir respuestas" para que la IA analice la conversación
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [prompts, setPrompts] = useState({
    AI_SUGGEST_REPLIES_PROMPT: '',
    AI_AUTO_REPLY_PROMPT: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    setLoading(true);
    try {
      const r = await api.get('/settings');
      setPrompts({
        AI_SUGGEST_REPLIES_PROMPT: r.data.AI_SUGGEST_REPLIES_PROMPT || '',
        AI_AUTO_REPLY_PROMPT: r.data.AI_AUTO_REPLY_PROMPT || '',
      });
    } catch (err) {
      console.error('Error cargando ajustes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/settings', { 
        key: 'AI_SUGGEST_REPLIES_PROMPT', 
        value: prompts.AI_SUGGEST_REPLIES_PROMPT 
      });
      await api.post('/settings', { 
        key: 'AI_AUTO_REPLY_PROMPT', 
        value: prompts.AI_AUTO_REPLY_PROMPT 
      });
      alert('Configuración guardada correctamente');
      onClose();
    } catch (err) {
      console.error('Error guardando:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', padding: '24px', borderRadius: '12px',
        width: '90%', maxWidth: '800px', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Configuración de IA</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando ajustes...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Prompt para Sugerencias de Respuesta
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Define cómo Claude debe sugerirte respuestas cuando el vendedor humano está chateando.
              </p>
              <textarea
                value={prompts.AI_SUGGEST_REPLIES_PROMPT}
                onChange={(e) => setPrompts({ ...prompts, AI_SUGGEST_REPLIES_PROMPT: e.target.value })}
                placeholder="Pega aquí el prompt para sugerencias..."
                style={{
                  width: '100%', height: '200px', padding: '12px',
                  borderRadius: '8px', border: '1px solid #d1d5db',
                  fontSize: '13px', fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Prompt para Bot de Respuesta Automática
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Define las reglas que seguirá el Bot cuando responda solo a los clientes.
              </p>
              <textarea
                value={prompts.AI_AUTO_REPLY_PROMPT}
                onChange={(e) => setPrompts({ ...prompts, AI_AUTO_REPLY_PROMPT: e.target.value })}
                placeholder="Pega aquí el prompt para el Bot autónomo..."
                style={{
                  width: '100%', height: '200px', padding: '12px',
                  borderRadius: '8px', border: '1px solid #d1d5db',
                  fontSize: '13px', fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px', borderRadius: '8px',
                  border: '1px solid #d1d5db', background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  border: 'none', background: '#4f46e5', color: '#fff',
                  fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

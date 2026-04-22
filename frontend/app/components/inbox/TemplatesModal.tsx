'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Template {
  name: string;
  language: string;
  category: string;
  components: any[];
}

interface Props {
  chatId: string;
  onClose: () => void;
  onSend: () => void;
}

export default function TemplatesModal({ chatId, onClose, onSend }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const r = await api.get(`/chats/${chatId}/messages/templates`);
      setTemplates(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(name: string, lang: string) {
    try {
      await api.post(`/chats/${chatId}/messages/template`, {
        templateName: name,
        languageCode: lang,
      });
      onSend();
      onClose();
    } catch (err) {
      alert('Error enviando plantilla');
    }
  }

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Plantillas de Whatsapp</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Seleccione la plantilla de Whatsapp que desea enviar</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar plantillas" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', paddingLeft: '36px',
                borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none',
                fontSize: '14px', background: '#f9fafb'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}>🔍</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '20px' }}>Cargando...</div> : 
           filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No hay plantillas</div> :
           filtered.map((t) => (
            <div key={t.name} style={{
              border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onClick={() => handleSend(t.name, t.language)}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f3f4f6', color: '#6b7280' }}>Idioma: {t.language}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', textTransform: 'uppercase' }}>Body</div>
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {t.components.find(c => c.type === 'BODY')?.text || 'Sin texto'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', textTransform: 'uppercase' }}>Categoría</div>
              <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{t.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

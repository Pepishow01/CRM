'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

function ArticleModal({ article, onSave, onClose }: any) {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [category, setCategory] = useState(article?.category || '');
  const [published, setPublished] = useState(article?.published ?? true);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '640px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{article ? 'Editar artículo' : 'Nuevo artículo'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categoría</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Facturación, Envíos..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Contenido</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12}
            placeholder="Escribí el contenido del artículo aquí..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <input type="checkbox" id="pub" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <label htmlFor="pub" style={{ fontSize: '13px' }}>Publicado (visible para agentes)</label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={() => onSave({ title, content, category, published })}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { load(); loadCategories(); }, []);

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCategory) params.set('category', filterCategory);
    const r = await api.get(`/articles?${params}`);
    setArticles(r.data);
  }

  async function loadCategories() {
    const r = await api.get('/articles/categories');
    setCategories(r.data);
  }

  async function handleSave(data: any) {
    if (editing) {
      await api.patch(`/articles/${editing.id}`, data);
    } else {
      await api.post('/articles', data);
    }
    setShowModal(false);
    setEditing(null);
    load();
    loadCategories();
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este artículo?')) return;
    await api.delete(`/articles/${id}`);
    load();
  }

  useEffect(() => { load(); }, [search, filterCategory]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Base de conocimiento</h1>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            + Nuevo artículo
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar artículos..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Sin artículos</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Creá artículos para que los agentes puedan consultarlos rápidamente</div>
          </div>
        )}

        {articles.map((a: any) => (
          <div key={a.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{a.title}</span>
                  {!a.published && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>Borrador</span>}
                  {a.category && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#ede9fe', color: '#4f46e5', borderRadius: '4px' }}>{a.category}</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {a.content?.substring(0, 120)}{a.content?.length > 120 ? '...' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                <button onClick={() => { setEditing(a); setShowModal(true); }}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                <button onClick={() => remove(a.id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ArticleModal article={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
}

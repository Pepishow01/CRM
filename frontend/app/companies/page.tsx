'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

function CompanyModal({ company, onSave, onClose }: any) {
  const [name, setName] = useState(company?.name || '');
  const [domain, setDomain] = useState(company?.domain || '');
  const [phone, setPhone] = useState(company?.phone || '');
  const [email, setEmail] = useState(company?.email || '');
  const [industry, setIndustry] = useState(company?.industry || '');
  const [description, setDescription] = useState(company?.description || '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{company ? 'Editar empresa' : 'Nueva empresa'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>
        {[
          { label: 'Nombre *', value: name, set: setName, placeholder: 'Nombre de la empresa' },
          { label: 'Dominio', value: domain, set: setDomain, placeholder: 'empresa.com' },
          { label: 'Teléfono', value: phone, set: setPhone, placeholder: '+54 11 1234-5678' },
          { label: 'Email', value: email, set: setEmail, placeholder: 'contacto@empresa.com' },
          { label: 'Industria', value: industry, set: setIndustry, placeholder: 'Tecnología, Retail, Salud...' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>{label}</label>
            <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={() => onSave({ name, domain, phone, email, industry, description })}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const r = await api.get(`/companies${params}`);
    setCompanies(r.data);
  }

  useEffect(() => { load(); }, [search]);

  async function handleSave(data: any) {
    if (editing) {
      await api.patch(`/companies/${editing.id}`, data);
    } else {
      await api.post('/companies', data);
    }
    setShowModal(false);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta empresa?')) return;
    await api.delete(`/companies/${id}`);
    load();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>←</button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Empresas</h1>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            + Nueva empresa
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresas..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        {companies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Sin empresas</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Creá empresas para asociar a tus contactos</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {companies.map((c: any) => (
            <div key={c.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ede9fe', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                    {c.name?.[0]?.toUpperCase() || '🏢'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{c.name}</div>
                    {c.industry && <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.industry}</div>}
                  </div>
                </div>
              </div>
              {c.domain && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>🌐 {c.domain}</div>}
              {c.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>📞 {c.phone}</div>}
              {c.email && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>✉️ {c.email}</div>}
              {c.description && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', lineHeight: 1.4 }}>{c.description?.substring(0, 80)}{c.description?.length > 80 ? '...' : ''}</div>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                <button onClick={() => { setEditing(c); setShowModal(true); }}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                <button onClick={() => remove(c.id)}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <CompanyModal company={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
}

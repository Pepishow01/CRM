'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/search' + (search ? `?q=${encodeURIComponent(search)}` : ''));
      if (search) {
        setContacts(r.data.contacts ?? []);
      } else {
        const cr = await api.get('/contacts');
        setContacts(cr.data ?? []);
      }
    } catch {
      const r = await api.get('/search?q=');
      setContacts([]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function selectContact(contact: any) {
    setSelected(contact);
    setEditMode(false);
    setForm({ fullName: contact.fullName ?? '', email: contact.email ?? '', phone: contact.phone ?? '' });
    try {
      const r = await api.get(`/search/chats?assignedTo=`);
      // Filter chats for this contact
      const allChats = await api.get('/chats');
      setChats(allChats.data.filter((c: any) => c.contact?.id === contact.id));
    } catch { setChats([]); }
  }

  async function saveContact() {
    try {
      await api.patch(`/contacts/${selected.id}`, form);
      setSelected({ ...selected, ...form });
      setEditMode(false);
      load();
    } catch (err) { console.error(err); }
  }

  function getInitials(name?: string) {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  const CHANNEL_ICONS: Record<string, string> = {
    whatsapp: '📱', instagram: '📸', messenger: '💬', email: '📧', widget: '🌐',
  };
  const STATUS_COLORS: Record<string, string> = {
    new: '#3b82f6', in_progress: '#f59e0b', waiting: '#8b5cf6', sold: '#10b981', lost: '#ef4444',
  };
  const STATUS_LABELS: Record<string, string> = {
    new: 'Nuevo', in_progress: 'En progreso', waiting: 'Esperando', sold: 'Vendido', lost: 'Perdido',
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <button onClick={() => router.push('/inbox')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Contactos</h1>
        <div style={{ flex: 1, maxWidth: '360px' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email, teléfono..."
            style={{ width: '100%', padding: '7px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{contacts.length} contactos</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: '320px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#f9fafb', flexShrink: 0 }}>
          {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Cargando...</div>}
          {!loading && contacts.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px' }}>👤</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>Sin contactos</div>
            </div>
          )}
          {contacts.map((c) => (
            <div key={c.id} onClick={() => selectContact(c)} style={{
              padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
              background: selected?.id === c.id ? '#ede9fe' : '#fff',
              cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center',
              borderLeft: selected?.id === c.id ? '3px solid #4f46e5' : '3px solid transparent',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#dbeafe', color: '#1e40af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 600, flexShrink: 0,
              }}>{getInitials(c.fullName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  {c.fullName ?? 'Sin nombre'}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.email ?? c.phone ?? c.whatsappPhone ?? 'Sin datos'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: '#dbeafe', color: '#1e40af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 700,
                  }}>{getInitials(selected.fullName)}</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>{selected.fullName ?? 'Sin nombre'}</h2>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>ID: {selected.id.slice(0, 8)}...</div>
                  </div>
                  <button onClick={() => setEditMode(!editMode)} style={{
                    marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
                    border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px',
                  }}>{editMode ? 'Cancelar' : 'Editar'}</button>
                </div>

                {editMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre completo"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    <button onClick={saveContact} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start' }}>Guardar</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Email', value: selected.email },
                      { label: 'Teléfono', value: selected.phone },
                      { label: 'WhatsApp', value: selected.whatsappPhone },
                      { label: 'Instagram', value: selected.instagramId },
                      { label: 'Messenger', value: selected.messengerId },
                    ].map(({ label, value }) => value ? (
                      <div key={label}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: '14px', color: '#111827', marginTop: '2px' }}>{value}</div>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Conversaciones ({chats.length})</h3>
                {chats.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin conversaciones</div>}
                {chats.map((chat) => (
                  <div key={chat.id} onClick={() => router.push(`/inbox?chat=${chat.id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    borderRadius: '8px', border: '1px solid #f3f4f6', marginBottom: '8px', cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '18px' }}>{CHANNEL_ICONS[chat.channel] ?? '💬'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{chat.channel}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{chat.lastMessagePreview ?? 'Sin mensajes'}</div>
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '12px', color: '#fff',
                      background: STATUS_COLORS[chat.status] ?? '#9ca3af',
                    }}>{STATUS_LABELS[chat.status] ?? chat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af', gap: '8px' }}>
            <div style={{ fontSize: '40px' }}>👤</div>
            <p style={{ fontSize: '16px' }}>Seleccioná un contacto para ver sus detalles</p>
          </div>
        )}
      </div>
    </div>
  );
}

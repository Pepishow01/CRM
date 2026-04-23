'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeams();
    api.get('/users').then((r) => setUsers(r.data));
  }, []);

  async function loadTeams() {
    const r = await api.get('/teams');
    setTeams(r.data);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/teams/${editing.id}`, { name, description, memberIds });
      } else {
        await api.post('/teams', { name, description, memberIds });
      }
      reset(); loadTeams();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este equipo?')) return;
    await api.delete(`/teams/${id}`);
    loadTeams();
  }

  function startEdit(team: any) {
    setEditing(team);
    setName(team.name);
    setDescription(team.description ?? '');
    setMemberIds((team.members ?? []).map((m: any) => m.id));
  }

  function reset() {
    setEditing(null); setName(''); setDescription(''); setMemberIds([]);
  }

  function toggleMember(userId: string) {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function getInitials(name?: string) {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/inbox')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Equipos</h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>{editing ? 'Editar equipo' : 'Nuevo equipo'}</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del equipo *"
              style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción"
              style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '8px' }}>Miembros</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {users.map((u) => {
                const selected = memberIds.includes(u.id);
                return (
                  <div key={u.id} onClick={() => toggleMember(u.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                    border: `1px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
                    background: selected ? '#ede9fe' : '#f9fafb',
                    fontSize: '13px', transition: 'all 0.1s',
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#dcfce7', color: '#166534',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 600,
                    }}>{getInitials(u.fullName)}</div>
                    {u.fullName}
                    {selected && <span style={{ color: '#6366f1', fontSize: '12px' }}>✓</span>}
                  </div>
                );
              })}
              {users.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin usuarios disponibles</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving || !name.trim()} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px',
              opacity: saving || !name.trim() ? 0.6 : 1,
            }}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear equipo'}</button>
            {editing && (
              <button onClick={reset} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {teams.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No hay equipos creados</div>
          )}
          {teams.map((team, i) => (
            <div key={team.id} style={{ padding: '16px 20px', borderBottom: i < teams.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>{team.name}</div>
                  {team.description && <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{team.description}</div>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(team.members ?? []).map((m: any) => (
                      <span key={m.id} style={{
                        fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                        background: '#f3f4f6', color: '#374151',
                      }}>{m.fullName}</span>
                    ))}
                    {(team.members ?? []).length === 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sin miembros</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(team)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                  <button onClick={() => remove(team.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb', paddingBottom: '16px',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>
          CRM Ventas — Bandeja de mensajes
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {user.fullName} ({user.role})
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: '#fff',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '400px', color: '#9ca3af', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ fontSize: '40px' }}>💬</div>
        <p style={{ fontSize: '16px', fontWeight: 500 }}>
          Bandeja lista
        </p>
        <p style={{ fontSize: '14px' }}>
          Los mensajes aparecerán aquí cuando conectes WhatsApp
        </p>
      </div>
    </div>
  );
}
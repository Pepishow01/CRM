'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Credenciales inválidas');
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/inbox');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        background: '#fff', padding: '40px',
        borderRadius: '12px', border: '1px solid #e5e7eb',
        width: '100%', maxWidth: '400px',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
          CRM Ventas
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '14px' }}>
          Iniciá sesión para continuar
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500,
              display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #d1d5db', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500,
              display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #d1d5db', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', color: '#991b1b',
              padding: '10px 12px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? '#9ca3af' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
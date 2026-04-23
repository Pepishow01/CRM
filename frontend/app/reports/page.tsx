'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', in_progress: 'En progreso', waiting: 'Esperando', sold: 'Vendido', lost: 'Perdido',
};
const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', in_progress: '#f59e0b', waiting: '#8b5cf6', sold: '#10b981', lost: '#ef4444',
};
const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '📱', instagram: '📸', messenger: '💬', email: '📧', widget: '🌐',
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '20px 24px',
      border: '1px solid #e5e7eb', flex: '1 1 180px',
    }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: color ?? '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '8px' }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: '4px', height: '8px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [byStatus, setByStatus] = useState<any[]>([]);
  const [byChannel, setByChannel] = useState<any[]>([]);
  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [msgByDay, setMsgByDay] = useState<any[]>([]);
  const [responseTime, setResponseTime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    loadData();
  }, [from, to]);

  async function loadData() {
    setLoading(true);
    try {
      const params = `from=${from}&to=${to}`;
      const [ov, bs, bc, as_, rt, mbd] = await Promise.all([
        api.get(`/reports/overview?${params}`),
        api.get('/reports/chats-by-status'),
        api.get('/reports/chats-by-channel'),
        api.get(`/reports/agent-stats?${params}`),
        api.get(`/reports/response-times?${params}`),
        api.get(`/reports/messages-by-day?${params}`),
      ]);
      setOverview(ov.data);
      setByStatus(bs.data);
      setByChannel(bc.data);
      setAgentStats(as_.data);
      setResponseTime(rt.data);
      setMsgByDay(mbd.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function formatSeconds(s: number) {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}min`;
    return `${(s / 3600).toFixed(1)}h`;
  }

  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1);
  const maxChannel = Math.max(...byChannel.map((c) => c.count), 1);
  const maxAgent = Math.max(...agentStats.map((a) => a.messagesSent), 1);
  const maxMsg = Math.max(...msgByDay.map((d) => d.total), 1);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => router.push('/inbox')} style={{
          border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px',
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Reportes</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#6b7280' }}>Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <label style={{ fontSize: '13px', color: '#6b7280' }}>Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Cargando reportes...</div>
        ) : (
          <>
            {/* Overview cards */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <StatCard label="Total chats" value={overview?.totalChats ?? 0} />
              <StatCard label="Chats nuevos" value={overview?.newChats ?? 0} color="#3b82f6" sub="en el período" />
              <StatCard label="Resueltos" value={overview?.resolvedChats ?? 0} color="#10b981" />
              <StatCard label="Mensajes totales" value={overview?.totalMessages ?? 0} sub="en el período" />
              <StatCard label="Recibidos" value={overview?.inboundMessages ?? 0} color="#6366f1" />
              <StatCard label="Enviados" value={overview?.outboundMessages ?? 0} color="#f59e0b" />
              <StatCard
                label="Tiempo medio respuesta"
                value={responseTime ? formatSeconds(responseTime.averageResponseTimeSeconds) : '-'}
                sub={`${responseTime?.samplesCount ?? 0} muestras`}
                color="#8b5cf6"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {/* By status */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Chats por estado</h3>
                {byStatus.map((s) => (
                  <SimpleBar key={s.status} label={STATUS_LABELS[s.status] ?? s.status}
                    value={s.count} max={maxStatus} color={STATUS_COLORS[s.status] ?? '#6b7280'} />
                ))}
                {byStatus.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin datos</div>}
              </div>

              {/* By channel */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Chats por canal</h3>
                {byChannel.map((c) => (
                  <SimpleBar key={c.channel} label={`${CHANNEL_ICONS[c.channel] ?? '📡'} ${c.channel}`}
                    value={c.count} max={maxChannel} color="#6366f1" />
                ))}
                {byChannel.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin datos</div>}
              </div>

              {/* Agent stats */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Mensajes por agente</h3>
                {agentStats.map((a) => (
                  <SimpleBar key={a.userId} label={a.fullName ?? 'Agente'}
                    value={a.messagesSent} max={maxAgent} color="#10b981" />
                ))}
                {agentStats.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin datos</div>}
              </div>

              {/* Messages by day */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Mensajes por día</h3>
                <div style={{ overflowX: 'auto' }}>
                  {msgByDay.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin datos</div>}
                  {msgByDay.map((d) => {
                    const pct = maxMsg > 0 ? Math.round((d.total / maxMsg) * 100) : 0;
                    const date = new Date(d.day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                    return (
                      <div key={d.day} style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                          <span style={{ color: '#6b7280' }}>{date}</span>
                          <span style={{ fontWeight: 600 }}>{d.total} <span style={{ color: '#6b7280', fontWeight: 400 }}>({d.inbound}↓ {d.outbound}↑)</span></span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: '3px', height: '6px' }}>
                          <div style={{ width: `${pct}%`, background: '#6366f1', borderRadius: '3px', height: '6px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

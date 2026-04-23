'use client';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelBadgeProps {
  label: Label;
  onRemove?: () => void;
  small?: boolean;
}

export default function LabelBadge({ label, onRemove, small }: LabelBadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: '12px',
      fontSize: small ? '10px' : '11px',
      fontWeight: 500,
      color: '#fff',
      background: label.color,
      whiteSpace: 'nowrap',
    }}>
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', padding: 0, lineHeight: 1, fontSize: '12px',
          }}
        >×</button>
      )}
    </span>
  );
}

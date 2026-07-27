import React from 'react';

/**
 * AtlasNodeCheck - componente de teste/demonstração.
 * - Não realiza chamadas externas nem muta estado global.
 * - Conteúdo apenas demonstrativo.
 * Uso: <AtlasNodeCheck message="..." />
 */

type AtlasNodeCheckProps = {
  message?: string;
  version?: string;
  color?: string;
};

const boxStyle: React.CSSProperties = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
  border: '1px dashed #6b7280',
  borderRadius: 8,
  padding: '12px 16px',
  background: '#f9fafb',
  color: '#111827',
  maxWidth: 560,
};

export const AtlasNodeCheck: React.FC<AtlasNodeCheckProps> = ({
  message = 'ATLAS Node Check ativo (demonstrativo)',
  version = 'v0.1-demo',
  color = '#16a34a',
}) => {
  const timestamp = new Date().toISOString();

  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 8,
    background: color,
  };

  return (
    <div style={boxStyle} aria-label="atlas-node-check">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={dotStyle} />
        <strong>AtlasNodeCheck</strong>
        <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>{version}</span>
      </div>
      <div style={{ fontSize: 14, marginBottom: 4 }}>status: ok</div>
      <div style={{ fontSize: 14, marginBottom: 4 }}>message: {message}</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>time: {timestamp}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        Componente de teste. Sem efeitos colaterais. Conteúdo apenas demonstrativo.
      </div>
    </div>
  );
};

export default AtlasNodeCheck;

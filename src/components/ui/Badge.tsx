import React from 'react';
import type { AlertSeverity } from '../../types';

interface BadgeProps {
  variant: AlertSeverity | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'critical':
        return {
          backgroundColor: 'var(--alert-critical-bg)',
          color: 'var(--alert-critical)',
          border: '1px solid var(--alert-critical-border)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--alert-warning-bg)',
          color: 'var(--alert-warning)',
          border: '1px solid var(--alert-warning-border)',
        };
      case 'watch':
        return {
          backgroundColor: 'var(--alert-watch-bg)',
          color: 'var(--alert-watch)',
          border: '1px solid var(--alert-watch-border)',
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--alert-info-bg)',
          color: 'var(--alert-info)',
          border: '1px solid var(--alert-info-border)',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`ews-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: 'var(--radius-round)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style,
      }}
    >
      {children}
    </span>
  );
};
export default Badge;

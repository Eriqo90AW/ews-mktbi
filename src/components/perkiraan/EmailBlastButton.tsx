import React from 'react';
import type { DisasterAlert } from '../../types';
import type { KpwbiOffice } from '../../constants/kpwbiOffices';

interface EmailBlastButtonProps {
  office: KpwbiOffice;
  alerts: DisasterAlert[];
  className?: string;
  compact?: boolean;
}

// Placeholder emails — replace with real addresses when available
const DMR_EMAIL = 'satker.dmr@bi.go.id';

function getOfficeEmail(officeId: string): string {
  // Placeholder pattern; real addresses would come from a config/constant
  return `kpwbi.${officeId.replace('kpwbi-', '')}@bi.go.id`;
}

function buildMailtoUrl(office: KpwbiOffice, alerts: DisasterAlert[]): string {
  const to = [getOfficeEmail(office.id), DMR_EMAIL].join(',');
  const forecastAlerts = alerts.filter((a) => a.isForecast && a.provinceId === office.provinceId);
  const criticalAlerts = forecastAlerts.filter((a) => a.severity === 3);

  const subject = encodeURIComponent(
    `[EWS ALERT] Peringatan Kesiapsiagaan — ${office.name} — ${new Date().toLocaleDateString('id-ID')}`
  );

  const criticalLines = criticalAlerts.length > 0
    ? criticalAlerts.map((a) => `  • ${a.title}`).join('\n')
    : '  (Tidak ada peringatan kritis saat ini)';

  const body = encodeURIComponent(
    `Yth. ${office.name} dan Satker DMR,\n\n` +
    `Sistem EWS MKTBI mendeteksi potensi ancaman di wilayah ${office.city} untuk periode ke depan:\n\n` +
    criticalLines + '\n\n' +
    `Mohon segera lakukan pemeriksaan kesiapsiagaan sesuai SOP yang berlaku dan koordinasikan ` +
    `dengan BPBD setempat jika diperlukan.\n\n` +
    `Hormat kami,\nSistem Peringatan Dini EWS-MKTBI\n` +
    `(Dikirim otomatis — ${new Date().toLocaleString('id-ID')} WIB)`
  );

  return `mailto:${to}?subject=${subject}&body=${body}`;
}

const EmailBlastButton: React.FC<EmailBlastButtonProps> = ({ office, alerts, className = '', compact = false }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildMailtoUrl(office, alerts);
    window.location.href = url;
  };

  if (compact) {
    return (
      <button
        className={`email-blast-btn-compact ${className}`}
        onClick={handleClick}
        title={`Email Blast ke ${office.name} & Satker DMR`}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Blast
      </button>
    );
  }

  return (
    <button
      className={`email-blast-btn ${className}`}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
      Email Blast
    </button>
  );
};

export default EmailBlastButton;

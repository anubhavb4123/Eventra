import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, CheckCheck } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import '@/styles/eventra-shared.css';

interface QRCodeDisplayProps {
  value: string;
  teamId: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  teamId,
  size = 200,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  
  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create high-resolution branded pass with standard high-contrast QR
    const passCanvas = document.createElement('canvas');
    const padding = 28;
    const headerHeight = 44;
    const footerHeight = 48;
    
    passCanvas.width = canvas.width + padding * 2;
    passCanvas.height = canvas.height + padding * 2 + headerHeight + footerHeight;

    const ctx = passCanvas.getContext('2d');
    if (!ctx) return;

    // Clean white card background (standard ISO/IEC 18004 high contrast)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, passCanvas.width, passCanvas.height);

    // Subtle outer border
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, passCanvas.width - 2, passCanvas.height - 2);

    // Top gold accent line
    ctx.fillStyle = '#C6A969';
    ctx.fillRect(0, 0, passCanvas.width, 5);

    // Top Header text
    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '1px';
    ctx.fillText('EVENTRA · ATTENDANCE PASS', passCanvas.width / 2, padding + 18);

    // Draw the QR Code
    ctx.drawImage(canvas, padding, padding + headerHeight);

    // Footer - Team ID
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(teamId, passCanvas.width / 2, passCanvas.height - padding - 18);

    // Footer - subtext
    ctx.fillStyle = '#64748B';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('SCAN FOR EVENT CHECK-IN', passCanvas.width / 2, passCanvas.height - padding - 4);

    const pngUrl = passCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${teamId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    await copyToClipboard(teamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      {/* Modern ticket-badge QR container */}
      <div
        ref={qrRef}
        style={{
          padding: 16,
          borderRadius: 18,
          background: '#FFFFFF',
          border: '1px solid rgba(198,169,105,0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(198,169,105,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <QRCodeCanvas
          value={value}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#000000"
          level="M"
          marginSize={1}
        />
      </div>

      {/* Team ID badge */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem', color: '#666',
          WebkitTextFillColor: '#666',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          margin: '0 0 6px',
        }}>
          Team ID
        </p>
        <div style={{
          display: 'inline-block',
          padding: '8px 20px',
          borderRadius: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em',
          color: '#C6A969',
          WebkitTextFillColor: '#C6A969',
          background: 'rgba(198,169,105,0.08)',
          border: '1px solid rgba(198,169,105,0.25)',
        }}>
          {teamId}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
        <button onClick={handleDownload} className="ev-btn ev-btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
          <Download size={14} /> Download QR
        </button>
        <button onClick={handleCopy} className="ev-btn ev-btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
      </div>
    </div>
  );
};

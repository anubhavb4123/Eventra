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
    const padded = document.createElement('canvas');
    const padding = 24;
    padded.width = canvas.width + padding * 2;
    padded.height = canvas.height + padding * 2;
    const ctx = padded.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(canvas, padding, padding);
    const pngUrl = padded.toDataURL('image/png').replace('image/png', 'image/octet-stream');
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      {/* QR Code */}
      <div
        ref={qrRef}
        style={{
          padding: 20,
          borderRadius: 16,
          background: 'rgba(26,26,26,0.7)',
          border: '1px solid rgba(198,169,105,0.3)',
          boxShadow: '0 0 40px rgba(198,169,105,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <QRCodeCanvas
          value={value}
          size={size}
          bgColor="#1A1A1A"
          fgColor="#C6A969"
          level="H"
          marginSize={0}
        />
      </div>

      {/* Team ID — use explicit color, NOT gold-text class (that sets transparent fill) */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem', color: '#666',
          WebkitTextFillColor: '#666',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          margin: '0 0 6px',
        }}>
          Team ID
        </p>
        <div style={{
          padding: '8px 16px',
          borderRadius: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em',
          /* Solid gold color — NO background-clip gradient (that was causing invisible text) */
          color: '#C6A969',
          WebkitTextFillColor: '#C6A969',
          background: 'rgba(198,169,105,0.08)',
          border: '1px solid rgba(198,169,105,0.2)',
        }}>
          {teamId}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
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

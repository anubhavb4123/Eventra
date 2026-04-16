import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, CheckCheck } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

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

    // Create a padded copy
    const padded = document.createElement('canvas');
    const padding = 24;
    padded.width = canvas.width + padding * 2;
    padded.height = canvas.height + padding * 2;
    const ctx = padded.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1A1A1A';
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
    <div className="flex flex-col items-center gap-5">
      {/* QR Code container */}
      <div
        ref={qrRef}
        className="glass-card p-5 flex items-center justify-center"
        style={{
          boxShadow: '0 0 40px rgba(198, 169, 105, 0.15)',
          border: '1px solid rgba(198, 169, 105, 0.3)',
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

      {/* Team ID display */}
      <div className="w-full text-center">
        <p className="text-xs text-[#6a6a6a] tracking-widest uppercase mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Team ID
        </p>
        <div
          className="px-4 py-2 rounded-lg text-sm font-bold tracking-widest gold-text"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(198, 169, 105, 0.08)',
            border: '1px solid rgba(198, 169, 105, 0.2)',
          }}
        >
          {teamId}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button onClick={handleDownload} className="btn-primary flex-1 justify-center text-sm">
          <Download size={15} />
          Download QR
        </button>
        <button onClick={handleCopy} className="btn-secondary flex-1 justify-center text-sm">
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import '@/styles/eventra-shared.css';

/* ── primitive box ───────────────────────────────────────────── */
interface SkBoxProps {
  w?: string | number;
  h?: string | number;
  r?: string | number;
  className?: string;
  style?: React.CSSProperties;
}
export const SkBox: React.FC<SkBoxProps> = ({ w = '100%', h = 14, r = 6, className = '', style }) => (
  <div
    className={`ev-sk ${className}`}
    style={{
      width: typeof w === 'number' ? w : w,
      height: typeof h === 'number' ? h : h,
      borderRadius: typeof r === 'number' ? r : r,
      ...style,
    }}
  />
);

/* ── text lines ──────────────────────────────────────────────── */
interface SkTextProps {
  /** Each entry is the line's width, e.g. ['80%', '60%', '40%'] */
  lines?: (string | number)[];
  height?: number;
  gap?: number;
}
export const SkText: React.FC<SkTextProps> = ({ lines = ['100%', '75%'], height = 12, gap = 8 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>
    {lines.map((w, i) => (
      <SkBox key={i} w={w} h={height} r={4} />
    ))}
  </div>
);

/* ── glass card wrapper ──────────────────────────────────────── */
interface SkCardProps {
  children: React.ReactNode;
  padding?: string | number;
  style?: React.CSSProperties;
}
export const SkCard: React.FC<SkCardProps> = ({ children, padding = 24, style }) => (
  <div
    className="ev-card"
    style={{ padding: typeof padding === 'number' ? padding : padding, ...style }}
  >
    {children}
  </div>
);

/* ── stat box ────────────────────────────────────────────────── */
export const SkStatBox: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    className="ev-card"
    style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, ...style }}
  >
    {/* label + icon row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkBox w={80} h={10} r={4} />
      <SkBox w={34} h={34} r={9} />
    </div>
    {/* big number */}
    <SkBox w={60} h={40} r={8} />
  </div>
);

/* ── team / list row ─────────────────────────────────────────── */
interface SkRowProps {
  style?: React.CSSProperties;
  showSubtext?: boolean;
  showBadge?: boolean;
  showDots?: number;
}
export const SkRow: React.FC<SkRowProps> = ({
  style,
  showSubtext = true,
  showBadge = true,
  showDots = 0,
}) => (
  <div
    className="ev-card ev-sk-row"
    style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, ...style }}
  >
    {/* rank / avatar */}
    <SkBox w={32} h={32} r={8} style={{ flexShrink: 0 }} />
    {/* text block */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkBox w="55%" h={16} r={5} />
      {showSubtext && <SkBox w="35%" h={10} r={4} />}
    </div>
    {/* right side: badge + dots */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {showBadge && <SkBox w={70} h={22} r={9999} />}
      {showDots > 0 &&
        Array.from({ length: showDots }).map((_, i) => (
          <SkBox key={i} w={24} h={24} r={6} />
        ))}
    </div>
  </div>
);

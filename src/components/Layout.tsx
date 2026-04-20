import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import '@/styles/eventra-shared.css';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', position: 'relative', overflowX: 'hidden' }}>
      <Navbar />

      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: -300, left: -200,
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198,169,105,0.04) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: -200,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }} />
        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(198,169,105,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198,169,105,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
        }} />
      </div>

      {/* Page content */}
      <main
        key={location.pathname}
        style={{
          position: 'relative', zIndex: 1,
          paddingTop: 64,
          animation: mounted ? 'ev-fade-up 0.35s ease forwards' : 'none',
          opacity: mounted ? 1 : 0,
        }}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px',
        marginTop: '40px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center',
          gap: 12,
        }}>
          <span style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #C6A969, #D4AF37)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Eventra
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.68rem', color: '#333',
            letterSpacing: '0.06em',
          }}>
            © 2026 · Built by ANUBHAV BAJPAI
          </span>
        </div>
      </footer>
    </div>
  );
};

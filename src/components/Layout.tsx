import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', position: 'relative' }}>
      <Navbar />
      {/* Global background effects */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div className="glow-orb" style={{ width: 600, height: 600, background: 'rgba(198,169,105,0.04)', top: -200, left: -200 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(212,175,55,0.03)', bottom: 0, right: -100 }} />
        <div className="bg-grid" style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Page content */}
      <main key={location.pathname} className="page-enter" style={{ position: 'relative', zIndex: 1, paddingTop: 64 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(198,169,105,0.1)',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          color: '#4a4a4a',
          letterSpacing: '0.05em',
        }}>
          Eventra © 2026 — Built for event organizers who mean business
        </p>
      </footer>
    </div>
  );
};

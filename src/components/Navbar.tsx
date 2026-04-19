import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, eventId, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = () => { logout(); navigate('/organizer-login'); };

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/create-event', label: 'Create Event' },
  ];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(198,169,105,0.12)' : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #C6A969, #D4AF37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(198,169,105,0.35)',
            flexShrink: 0,
          }}>
            <Zap size={18} color="#0a0a0f" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #C6A969, #D4AF37)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Eventra
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
          {publicLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link key={link.to} to={link.to} style={{
                textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.04em',
                padding: '6px 14px', borderRadius: 8, transition: 'all 0.2s',
                color: active ? '#C6A969' : '#666',
                background: active ? 'rgba(198,169,105,0.1)' : 'transparent',
                border: active ? '1px solid rgba(198,169,105,0.2)' : '1px solid transparent',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#eaeaea'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: 'rgba(198,169,105,0.15)', margin: '0 4px' }} />

          {isAuthenticated && eventId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link
                to={`/dashboard/${eventId}`}
                style={{
                  textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.04em',
                  padding: '6px 14px', borderRadius: 8, transition: 'all 0.2s',
                  color: location.pathname.startsWith('/dashboard') ? '#C6A969' : '#666',
                  background: location.pathname.startsWith('/dashboard') ? 'rgba(198,169,105,0.1)' : 'transparent',
                  border: location.pathname.startsWith('/dashboard') ? '1px solid rgba(198,169,105,0.2)' : '1px solid transparent',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <LayoutDashboard size={13} /> Dashboard
              </Link>

              <div style={{
                padding: '3px 12px', borderRadius: 9999,
                background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.18)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#C6A969',
                letterSpacing: '0.05em',
              }}>
                {eventId}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: '#444', padding: '6px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/organizer-login"
              style={{
                textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.04em',
                padding: '6px 14px', borderRadius: 8, transition: 'all 0.2s',
                color: location.pathname === '/organizer-login' ? '#C6A969' : '#666',
                background: location.pathname === '/organizer-login' ? 'rgba(198,169,105,0.1)' : 'transparent',
                border: location.pathname === '/organizer-login' ? '1px solid rgba(198,169,105,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (location.pathname !== '/organizer-login') { e.currentTarget.style.color = '#eaeaea'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
              onMouseLeave={e => { if (location.pathname !== '/organizer-login') { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; } }}
            >
              Organizer Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', color: '#888',
            padding: '6px', borderRadius: 8, display: 'flex',
            transition: 'all 0.2s',
          }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10,10,15,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(198,169,105,0.12)',
          padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }} className="md:hidden">
          {publicLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link key={link.to} to={link.to} style={{
                textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.82rem', fontWeight: 600, padding: '10px 14px',
                borderRadius: 10, letterSpacing: '0.04em',
                color: active ? '#C6A969' : '#eaeaea',
                background: active ? 'rgba(198,169,105,0.1)' : 'rgba(255,255,255,0.02)',
                border: active ? '1px solid rgba(198,169,105,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                {link.label}
              </Link>
            );
          })}

          <div style={{ height: 1, background: 'rgba(198,169,105,0.1)', margin: '4px 0' }} />

          {isAuthenticated && eventId ? (
            <>
              <Link to={`/dashboard/${eventId}`} style={{
                textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.82rem', fontWeight: 600, padding: '10px 14px',
                borderRadius: 10, letterSpacing: '0.04em', color: '#C6A969',
                background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.18)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <LayoutDashboard size={15} /> Dashboard ({eventId})
              </Link>
              <button onClick={handleLogout} style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                cursor: 'pointer', color: '#F87171',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                fontWeight: 600, padding: '10px 14px', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link to="/organizer-login" style={{
              textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.82rem', fontWeight: 600, padding: '10px 14px',
              borderRadius: 10, color: '#eaeaea',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              Organizer Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

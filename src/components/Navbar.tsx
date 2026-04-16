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

  const handleLogout = () => {
    logout();
    navigate('/organizer-login');
  };

  // Public nav links — no Team Lookup, no registration link
  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/create-event', label: 'Create Event' },
  ];

  const linkStyle = (active: boolean): React.CSSProperties => ({
    textDecoration: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    padding: '0.4rem 0.9rem',
    borderRadius: '0.5rem',
    color: active ? '#C6A969' : '#9A9A9A',
    background: active ? 'rgba(198,169,105,0.1)' : 'transparent',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  });

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(26,26,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(198,169,105,0.15)' : '1px solid transparent',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #C6A969, #D4AF37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(198,169,105,0.4)',
          }}>
            <Zap size={18} color="#1A1A1A" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #C6A969, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Eventra
          </span>
        </Link>

        {/* Desktop: Public links + Auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
          {publicLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={linkStyle(active)}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#EAEAEA';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#9A9A9A';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: 'rgba(198,169,105,0.2)', margin: '0 0.25rem' }} />

          {isAuthenticated && eventId ? (
            /* Logged-in controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Link
                to={`/dashboard/${eventId}`}
                style={linkStyle(location.pathname.startsWith('/dashboard'))}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith('/dashboard')) {
                    e.currentTarget.style.color = '#EAEAEA';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith('/dashboard')) {
                    e.currentTarget.style.color = '#9A9A9A';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <LayoutDashboard size={13} />
                Dashboard
              </Link>

              {/* Event ID pill */}
              <div style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(198,169,105,0.08)',
                border: '1px solid rgba(198,169,105,0.2)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                color: '#C6A969',
                letterSpacing: '0.04em',
              }}>
                {eventId}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6a6a6a',
                  padding: '0.4rem',
                  borderRadius: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6a6a6a')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            /* Logged-out: show login link */
            <Link
              to="/organizer-login"
              style={linkStyle(location.pathname === '/organizer-login')}
              onMouseEnter={(e) => {
                if (location.pathname !== '/organizer-login') {
                  e.currentTarget.style.color = '#EAEAEA';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/organizer-login') {
                  e.currentTarget.style.color = '#9A9A9A';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Organizer Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9A9A', display: 'flex', padding: '0.25rem' }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: 'rgba(26,26,26,0.98)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(198,169,105,0.15)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="md:hidden"
        >
          {publicLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  color: active ? '#C6A969' : '#EAEAEA',
                  background: active ? 'rgba(198,169,105,0.1)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ height: 1, background: 'rgba(198,169,105,0.1)', margin: '0.25rem 0' }} />

          {isAuthenticated && eventId ? (
            <>
              <Link
                to={`/dashboard/${eventId}`}
                style={{
                  textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  color: '#C6A969',
                  background: 'rgba(198,169,105,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <LayoutDashboard size={14} />
                Dashboard ({eventId})
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  cursor: 'pointer',
                  color: '#F87171',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'left',
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/organizer-login"
              style={{
                textDecoration: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                color: '#EAEAEA',
                background: 'transparent',
              }}
            >
              Organizer Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

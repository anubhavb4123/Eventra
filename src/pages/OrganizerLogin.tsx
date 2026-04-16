import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { verifyPassword } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Hash, Lock, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

export const OrganizerLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, eventId: loggedEventId } = useAuth();
  const [eventId, setEventId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // `from` is set by ProtectedRoute when redirecting unauthenticated users
  const from: string = (location.state as { from?: string })?.from ?? `/dashboard/${eventId}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!eventId.trim()) errs.eventId = 'Event ID is required.';
    if (!password.trim()) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const cleanId = eventId.trim().toLowerCase();
      const eventRef = ref(db, `events/${cleanId}`);
      
      const snap = await withRetry(() => get(eventRef));
      
      if (!snap.exists()) {
        setErrors({ eventId: 'Event not found. Check the Event ID.' });
        return;
      }
      
      const { passwordHash } = snap.val();
      const valid = await verifyPassword(password, passwordHash);
      if (!valid) {
        setErrors({ password: 'Incorrect password.' });
        return;
      }

      // Persist session
      login(cleanId);

      // Navigate to dashboard (or originally requested page)
      const destination = from.includes('event-details') || from.includes('dashboard') || from.includes('scan')
        ? from
        : `/dashboard/${cleanId}`;
      navigate(destination, { replace: true });
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Login failed. Please check your Firebase configuration.' });
    } finally {
      setLoading(false);
    }
  };

  // Auth functions are available from the outer useAuth() call above
  const handleSwitchEvent = () => {
    logout();
    // Don't navigate — stay on login page to enter new credentials
  };

  // If already logged in, show session info instead of the form
  if (isAuthenticated && loggedEventId) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <GlassCard className="animate-scale-in">
            <div style={{ padding: '1rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 25px rgba(74,222,128,0.15)',
              }}>
                <ShieldCheck size={32} color="#4ADE80" />
              </div>
              <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
                Already Signed In
              </h2>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A', marginBottom: '1.5rem' }}>
                You are currently managing event:
              </p>
              <div style={{
                padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem',
                color: '#C6A969', fontWeight: 700, letterSpacing: '0.05em',
                marginBottom: '2rem',
              }}>
                {loggedEventId}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => navigate(`/dashboard/${loggedEventId}`)}
                >
                  <LogIn size={15} /> Go to Dashboard
                </button>
                <button
                  className="btn-danger"
                  style={{ flex: '0 0 auto' }}
                  onClick={handleSwitchEvent}
                >
                  Switch Event
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        {/* Redirect notice */}
        {location.state && (location.state as { from?: string }).from && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(198,169,105,0.06)', border: '1px solid rgba(198,169,105,0.2)',
            marginBottom: '1.5rem',
          }}>
            <ShieldCheck size={14} color="#C6A969" />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#9A9A9A', margin: 0 }}>
              Organizer login required to access that page.
            </p>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '1rem', margin: '0 auto 1.25rem',
            background: 'linear-gradient(135deg, rgba(198,169,105,0.1), rgba(212,175,55,0.15))',
            border: '1px solid rgba(198,169,105,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 25px rgba(198,169,105,0.1)',
          }}>
            <LogIn size={28} color="#C6A969" />
          </div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Organizer Portal
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A' }}>
            Access your event dashboard, attendance tools, and registration links.
          </p>
        </div>

        <GlassCard>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              id="login-eventId"
              label="Event ID"
              type="text"
              placeholder="e.g. hackathon2026"
              value={eventId}
              onChange={(e) => setEventId(e.target.value.toLowerCase().trim())}
              error={errors.eventId}
              icon={<Hash size={15} />}
            />
            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="Enter event password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock size={15} />}
            />

            {errors.submit && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '0.5rem',
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              }}>
                <AlertCircle size={15} color="#F87171" />
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#F87171', margin: 0 }}>
                  {errors.submit}
                </p>
              </div>
            )}

            <Button type="submit" loading={loading} icon={<LogIn size={16} />} fullWidth>
              Access Dashboard
            </Button>
          </form>
        </GlassCard>

        {/* Security note */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: '0.75rem',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <ShieldCheck size={13} color="#4a4a4a" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4a4a4a', margin: 0, lineHeight: 1.6 }}>
            This portal is for event organizers only. Registration links, team data, and attendance controls
            are only accessible after successful login.
          </p>
        </div>
      </div>
    </div>
  );
};

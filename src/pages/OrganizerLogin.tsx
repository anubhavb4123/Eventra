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
import '@/styles/eventra-shared.css';

export const OrganizerLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, eventId: loggedEventId } = useAuth();
  const [eventId, setEventId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
      const snap = await withRetry(() => get(ref(db, `events/${cleanId}`)));
      if (!snap.exists()) { setErrors({ eventId: 'Event not found. Check the Event ID.' }); return; }
      const { passwordHash } = snap.val();
      const valid = await verifyPassword(password, passwordHash);
      if (!valid) { setErrors({ password: 'Incorrect password.' }); return; }
      login(cleanId);
      const dest = from.includes('event-details') || from.includes('dashboard') || from.includes('scan') ? from : `/dashboard/${cleanId}`;
      navigate(dest, { replace: true });
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Login failed. Check your Firebase configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchEvent = () => { logout(); };

  /* Already logged in */
  if (isAuthenticated && loggedEventId) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div className="ev-scale-in" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.15)', animation: 'ev-ring-expand 2.5s ease-out infinite' }} />
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'rgba(74,222,128,0.08)', border: '2px solid rgba(74,222,128,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(74,222,128,0.15)',
            }}>
              <ShieldCheck size={30} color="#4ADE80" />
            </div>
          </div>

          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.2rem', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem' }}>
            Already Signed In
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', marginBottom: '1.5rem' }}>
            You are managing event:
          </p>

          <span className="ev-pill ev-pill-gold" style={{ fontSize: '0.9rem', padding: '6px 20px', marginBottom: '2rem', display: 'inline-flex' }}>
            {loggedEventId}
          </span>

          <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
            <Button fullWidth icon={<LogIn size={15} />} onClick={() => navigate(`/dashboard/${loggedEventId}`)}>
              Go to Dashboard
            </Button>
            <Button variant="danger" onClick={handleSwitchEvent} style={{ flexShrink: 0 }}>
              Switch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Login form ──────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        {/* Redirect notice */}
        {location.state && (location.state as { from?: string }).from && (
          <div className="ev-alert ev-alert-info" style={{ marginBottom: 24 }}>
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Organizer login required to access that page.</span>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, rgba(198,169,105,0.1), rgba(212,175,55,0.15))',
            border: '1px solid rgba(198,169,105,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(198,169,105,0.12)',
          }}>
            <LogIn size={26} color="#C6A969" />
          </div>
          <div className="ev-section-label" style={{ marginBottom: 10 }}>ORGANIZER PORTAL</div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Welcome Back
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#555', lineHeight: 1.7 }}>
            Access your dashboard, attendance tools, and team management.
          </p>
        </div>

        <GlassCard accent>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              id="login-eventId"
              label="Event ID"
              type="text"
              placeholder="e.g. hackathon2026"
              value={eventId}
              onChange={(e) => setEventId(e.target.value.toLowerCase().trim())}
              error={errors.eventId}
              icon={<Hash size={14} />}
            />
            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="Enter event password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock size={14} />}
            />

            {errors.submit && (
              <div className="ev-alert ev-alert-error">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errors.submit}</span>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" fullWidth icon={<LogIn size={16} />}>
              Access Dashboard
            </Button>
          </form>
        </GlassCard>

        {/* Security note */}
        <div className="ev-alert ev-alert-info" style={{ marginTop: 16 }}>
          <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ color: '#555' }}>
            This portal is for event organizers only. Registration links, team data, and attendance are protected.
          </span>
        </div>
      </div>
    </div>
  );
};

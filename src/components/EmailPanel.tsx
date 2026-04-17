import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Mail, AlertCircle, CheckCheck } from 'lucide-react';
import { sendBroadcastEmail } from '@/lib/email';
import type { TeamWithId } from '@/types';

interface EmailPanelProps {
  teams: TeamWithId[];
}

export const EmailPanel: React.FC<EmailPanelProps> = ({ teams }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailedTeams = teams.filter(t => t.email);
  const totalWithEmail = emailedTeams.length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Subject and message are required.' });
      return;
    }
    if (totalWithEmail === 0) {
      setStatus({ type: 'error', text: 'No teams have registered with an email.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    let successCount = 0;
    let failCount = 0;

    for (const team of emailedTeams) {
      if (!team.email) continue;
      try {
        await sendBroadcastEmail({
          subject,
          message,
          to_email: team.email
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setLoading(false);
    if (successCount > 0) {
      setStatus({ type: 'success', text: `Sent successfully to ${successCount} team(s)! ${failCount > 0 ? `(${failCount} failed)` : ''}` });
      setSubject('');
      setMessage('');
    } else {
      setStatus({ type: 'error', text: 'Failed to send broadcast. Check EmailJS configuration via .env.' });
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Mail size={20} color="#C6A969" />
          <div>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>
              Email Broadcast
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', margin: '0.2rem 0 0' }}>
              Send an announcement to all team leaders who provided an email address.
            </p>
          </div>
        </div>

        <div style={{
          padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(198,169,105,0.08)',
          border: '1px solid rgba(198,169,105,0.2)', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#EAEAEA' }}>
            Recipients Available
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#C6A969', fontWeight: 700 }}>
            {totalWithEmail} / {teams.length} Teams
          </span>
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            id="subject"
            label="Subject"
            placeholder="e.g. Schedule Update for Tomorrow"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            id="message"
            label="Message"
            placeholder="Type your broadcast message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {status && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              background: status.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
              border: status.type === 'error' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(74,222,128,0.3)',
            }}>
              {status.type === 'error' ? <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0 }} /> : <CheckCheck size={16} color="#4ADE80" style={{ flexShrink: 0 }} />}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: status.type === 'error' ? '#F87171' : '#4ADE80' }}>
                {status.text}
              </span>
            </div>
          )}

          <Button type="submit" loading={loading} icon={<Mail size={15} />} fullWidth disabled={totalWithEmail === 0}>
            Send Broadcast
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};

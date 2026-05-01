const API_URL = import.meta.env.VITE_API_URL;

export interface RegistrationEmailParams {
  team_name: string;
  team_id: string;
  event_name: string;
  ticket_link: string;
  to_email: string;
}

export interface BroadcastEmailParams {
  subject: string;
  message: string;
  to_email: string;
  event_name?: string;
  team_name?: string;
  team_id?: string;
}

export const sendRegistrationEmail = async (params: RegistrationEmailParams) => {
  if (!API_URL) {
    console.warn('API_URL not configured, skipping registration email to:', params.to_email);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: params.to_email,
        team_name: params.team_name,
        team_id: params.team_id,
        event_name: params.event_name,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Email send failed');
    return data;
  } catch (error) {
    console.error('Failed to send registration email:', error);
    throw error;
  }
};

export const sendBroadcastEmail = async (params: BroadcastEmailParams) => {
  if (!API_URL) {
    console.warn('API_URL not configured, skipping broadcast email to:', params.to_email);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: params.to_email,
        team_name: params.team_name || 'Team',
        team_id: params.team_id || '-',
        event_name: params.event_name || 'Eventra Event',
        message: params.message,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Broadcast email failed');
    return data;
  } catch (error) {
    console.error('Failed to send broadcast email:', error);
    throw error; // Will be caught by caller to handle graceful UI
  }
};

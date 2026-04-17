import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

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
}

// Ensure init is called only if variables exist
if (PUBLIC_KEY && PUBLIC_KEY !== 'your_emailjs_public_key') {
  emailjs.init(PUBLIC_KEY);
}

export const sendRegistrationEmail = async (params: RegistrationEmailParams) => {
  if (!PUBLIC_KEY || PUBLIC_KEY === 'your_emailjs_public_key') {
    console.warn('EmailJS not configured, skipping registration email to:', params.to_email);
    return;
  }
  
  try {
    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params as unknown as Record<string, unknown>, PUBLIC_KEY);
    return res;
  } catch (error) {
    console.error('Failed to send registration email:', error);
    throw error;
  }
};

export const sendBroadcastEmail = async (params: BroadcastEmailParams) => {
  if (!PUBLIC_KEY || PUBLIC_KEY === 'your_emailjs_public_key') {
    console.warn('EmailJS not configured, skipping broadcast email to:', params.to_email);
    return;
  }
  
  try {
    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params as unknown as Record<string, unknown>, PUBLIC_KEY);
    return res;
  } catch (error) {
    console.error('Failed to send broadcast email:', error);
    throw error; // Will be caught by caller to handle graceful UI
  }
};

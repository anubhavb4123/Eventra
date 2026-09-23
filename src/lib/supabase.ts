// ==============================================================================
// Eventra — Supabase Client & Database Service Layer
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import type { EventDetails, EventSettings, TeamWithId, TeamMember } from '@/types';

// Read Supabase credentials from Vite environment variables
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Strip /rest/v1 or trailing slashes if user pasted the REST endpoint instead of the project root URL
export const supabaseUrl = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables. ' +
    'Please set these in your .env file to enable Supabase database operations.'
  );
}

// Initialize Supabase Client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

// ==============================================================================
// Data Mappers (PostgreSQL snake_case <-> TypeScript camelCase)
// ==============================================================================

export function mapEventRowToDetails(row: any): EventDetails {
  return {
    eventName: row?.event_name ?? '',
    description: row?.description ?? '',
    dateTime: row?.date_time ?? '',
    teamSizeMin: row?.team_size_min ?? 1,
    teamSizeMax: row?.team_size_max ?? 5,
    venue: row?.venue ?? '',
    paymentLink: row?.payment_link || undefined,
  };
}

export function mapEventRowToSettings(row: any): EventSettings {
  return {
    registrationOpen: row?.registration_open ?? true,
    registrationDeadline: row?.registration_deadline || undefined,
    maxTeams: row?.max_teams ? Number(row.max_teams) : undefined,
    currentTeams: row?.current_teams ?? 0,
    numberOfDays: row?.number_of_days ?? 1,
    currentDay: row?.current_day ?? 1,
    numberOfRounds: row?.number_of_rounds ?? 1,
    currentRound: row?.current_round ?? 1,
  };
}

export function mapTeamRowToTeam(row: any): TeamWithId {
  const members: TeamMember[] = Array.isArray(row?.members)
    ? row.members
    : typeof row?.members === 'string'
      ? JSON.parse(row.members)
      : [];

  return {
    id: row.id,
    teamName: row.team_name ?? '',
    leader: row.leader ?? '',
    email: row.email || undefined,
    members,
    attendanceMarked: !!row.attendance_marked,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    qualifications: typeof row.qualifications === 'object' && row.qualifications !== null ? row.qualifications : {},
    dayAttendance: typeof row.day_attendance === 'object' && row.day_attendance !== null ? row.day_attendance : {},
    position: row.position ? Number(row.position) : undefined,
    fcmToken: row.fcm_token || undefined,
    fcmTokenUpdatedAt: row.fcm_token_updated_at ? new Date(row.fcm_token_updated_at).getTime() : undefined,
  };
}

// ==============================================================================
// Event Operations
// ==============================================================================

/** Fetch an event by ID */
export async function getEvent(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[Supabase] getEvent error:', error);
    throw error;
  }
  return data;
}

/** Create a new event with initial credentials */
export async function createEvent(eventId: string, passwordHash: string) {
  const cleanId = eventId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        id: cleanId,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        team_count: 0,
        current_teams: 0,
        registration_open: true,
        number_of_days: 1,
        current_day: 1,
        number_of_rounds: 1,
        current_round: 1,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] createEvent error:', error);
    throw error;
  }
  return data;
}

/** Update event details and settings */
export async function updateEventDetailsAndSettings(
  eventId: string,
  details: Partial<EventDetails>,
  settings: Partial<EventSettings>
) {
  const cleanId = eventId.trim().toLowerCase();
  const updatePayload: Record<string, any> = {};

  if (details.eventName !== undefined) updatePayload.event_name = details.eventName;
  if (details.description !== undefined) updatePayload.description = details.description;
  if (details.dateTime !== undefined) updatePayload.date_time = details.dateTime;
  if (details.teamSizeMin !== undefined) updatePayload.team_size_min = Number(details.teamSizeMin);
  if (details.teamSizeMax !== undefined) updatePayload.team_size_max = Number(details.teamSizeMax);
  if (details.venue !== undefined) updatePayload.venue = details.venue;
  if (details.paymentLink !== undefined) updatePayload.payment_link = details.paymentLink || null;

  if (settings.registrationOpen !== undefined) updatePayload.registration_open = settings.registrationOpen;
  if (settings.registrationDeadline !== undefined) {
    updatePayload.registration_deadline = settings.registrationDeadline ? new Date(settings.registrationDeadline).toISOString() : null;
  }
  if (settings.maxTeams !== undefined) {
    updatePayload.max_teams = settings.maxTeams ? Number(settings.maxTeams) : null;
  }
  if (settings.numberOfDays !== undefined) updatePayload.number_of_days = Number(settings.numberOfDays);
  if (settings.currentDay !== undefined) updatePayload.current_day = Number(settings.currentDay);
  if (settings.numberOfRounds !== undefined) updatePayload.number_of_rounds = Number(settings.numberOfRounds);
  if (settings.currentRound !== undefined) updatePayload.current_round = Number(settings.currentRound);

  const { data, error } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] updateEventDetailsAndSettings error:', error);
    throw error;
  }
  return data;
}

// ==============================================================================
// Team Operations
// ==============================================================================

/** Fetch all teams registered for an event */
export async function getTeams(eventId: string): Promise<TeamWithId[]> {
  const cleanId = eventId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', cleanId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] getTeams error:', error);
    throw error;
  }
  return (data || []).map(mapTeamRowToTeam);
}

/** Fetch a specific team by event ID and team code or full ID */
export async function getTeam(eventId: string, teamIdentifier: string): Promise<TeamWithId | null> {
  const cleanId = eventId.trim().toLowerCase();
  const teamCode = teamIdentifier.split('-').pop() || teamIdentifier;

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', cleanId)
    .eq('team_code', teamCode)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] getTeam error:', error);
    throw error;
  }
  return data ? mapTeamRowToTeam(data) : null;
}

/** Register a team atomically using PostgreSQL stored procedure (register_team RPC) */
export async function registerTeam(payload: {
  eventId: string;
  teamName: string;
  leader: string;
  email?: string;
  members: TeamMember[];
  fcmToken?: string | null;
}): Promise<TeamWithId> {
  const cleanId = payload.eventId.trim().toLowerCase();

  const { data, error } = await supabase.rpc('register_team', {
    p_event_id: cleanId,
    p_team_name: payload.teamName,
    p_leader: payload.leader,
    p_email: payload.email || null,
    p_members: payload.members,
    p_fcm_token: payload.fcmToken || null,
  });

  if (error) {
    console.error('[Supabase] registerTeam RPC error:', error);
    throw error;
  }

  return mapTeamRowToTeam(data);
}

/** Update day attendance for a team */
export async function updateDayAttendance(
  eventId: string,
  teamCode: string,
  day: number,
  marked: boolean,
  members: TeamMember[]
) {
  const cleanId = eventId.trim().toLowerCase();
  const dayKey = String(day);

  // Fetch current day_attendance first to merge safely
  const { data: teamData, error: fetchErr } = await supabase
    .from('teams')
    .select('day_attendance, members')
    .eq('event_id', cleanId)
    .eq('team_code', teamCode)
    .single();

  if (fetchErr) throw fetchErr;

  const existingDayAtt = teamData?.day_attendance || {};
  const updatedDayAtt = {
    ...existingDayAtt,
    [dayKey]: {
      marked,
      members,
      markedAt: Date.now(),
    },
  };

  const updateFields: Record<string, any> = {
    day_attendance: updatedDayAtt,
  };

  // If Day 1, update legacy attendanceMarked and members for backward compatibility
  if (day === 1) {
    updateFields.attendance_marked = marked;
    updateFields.members = members;
  }

  const { error } = await supabase
    .from('teams')
    .update(updateFields)
    .eq('event_id', cleanId)
    .eq('team_code', teamCode);

  if (error) {
    console.error('[Supabase] updateDayAttendance error:', error);
    throw error;
  }
}

/** Toggle round qualification */
export async function toggleRoundQualification(
  eventId: string,
  teamCode: string,
  round: number,
  qualified: boolean
) {
  const cleanId = eventId.trim().toLowerCase();
  const roundKey = String(round);

  const { data: teamData, error: fetchErr } = await supabase
    .from('teams')
    .select('qualifications')
    .eq('event_id', cleanId)
    .eq('team_code', teamCode)
    .single();

  if (fetchErr) throw fetchErr;

  const existingQual = teamData?.qualifications || {};
  const updatedQual = {
    ...existingQual,
    [roundKey]: qualified,
  };

  const { error } = await supabase
    .from('teams')
    .update({ qualifications: updatedQual })
    .eq('event_id', cleanId)
    .eq('team_code', teamCode);

  if (error) {
    console.error('[Supabase] toggleRoundQualification error:', error);
    throw error;
  }
}

/** Assign podium position (1, 2, 3) to a team, clearing previous holder if needed */
export async function setTeamPosition(
  eventId: string,
  teamCode: string,
  position: number | null,
  previousHolderCode?: string | null
) {
  const cleanId = eventId.trim().toLowerCase();

  // Clear previous holder if needed
  if (previousHolderCode && previousHolderCode !== teamCode) {
    await supabase
      .from('teams')
      .update({ position: null })
      .eq('event_id', cleanId)
      .eq('team_code', previousHolderCode);
  }

  const { error } = await supabase
    .from('teams')
    .update({ position })
    .eq('event_id', cleanId)
    .eq('team_code', teamCode);

  if (error) {
    console.error('[Supabase] setTeamPosition error:', error);
    throw error;
  }
}

// ==============================================================================
// FCM Tokens Operations
// ==============================================================================

/** Save general visitor FCM token */
export async function storeVisitorTokenInSupabase(
  token: string,
  metadata?: { userAgent?: string; platform?: string; language?: string }
) {
  if (!token) return;
  const { error } = await supabase
    .from('fcm_visitor_tokens')
    .upsert({
      token,
      user_agent: metadata?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      platform: metadata?.platform || (typeof navigator !== 'undefined' ? navigator.platform : ''),
      language: metadata?.language || (typeof navigator !== 'undefined' ? navigator.language : 'en'),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.warn('[Supabase] storeVisitorToken error:', error.message);
  }
}

/** Associate FCM token with a team */
export async function associateTokenWithTeamInSupabase(
  eventId: string,
  teamCode: string,
  token: string,
  meta: { teamId: string; teamName: string; leader: string; email?: string }
) {
  if (!eventId || !teamCode || !token) return;
  const cleanId = eventId.trim().toLowerCase();

  // 1. Upsert fcm_team_tokens table
  const { error: tokenErr } = await supabase
    .from('fcm_team_tokens')
    .upsert({
      token,
      event_id: cleanId,
      team_code: teamCode,
      team_id: meta.teamId,
      team_name: meta.teamName,
      leader: meta.leader,
      email: meta.email || null,
      updated_at: new Date().toISOString(),
    });

  if (tokenErr) console.warn('[Supabase] associateTokenWithTeam fcm_team_tokens error:', tokenErr.message);

  // 2. Attach token to team record
  const { error: teamErr } = await supabase
    .from('teams')
    .update({
      fcm_token: token,
      fcm_token_updated_at: new Date().toISOString(),
    })
    .eq('event_id', cleanId)
    .eq('team_code', teamCode);

  if (teamErr) console.warn('[Supabase] associateTokenWithTeam teams update error:', teamErr.message);
}

// ==============================================================================
// Notification Queue Operations
// ==============================================================================

/** Queue a broadcast push notification */
export async function queueNotification(
  eventId: string,
  payload: {
    title: string;
    body: string;
    target: string;
    targetRound?: number;
    teamCodes?: string[];
    url?: string;
  }
) {
  const cleanId = eventId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('notification_queue')
    .insert([
      {
        event_id: cleanId,
        title: payload.title.trim(),
        body: payload.body.trim(),
        target: payload.target,
        target_round: payload.targetRound || null,
        team_codes: payload.teamCodes || null,
        url: payload.url?.trim() || `/register/${cleanId}`,
        source: 'organizer_dashboard',
        processed: false,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] queueNotification error:', error);
    throw error;
  }
  return data;
}

/** Fetch recent queued items */
export async function getRecentQueuedNotifications(eventId: string, limit = 5) {
  const cleanId = eventId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('event_id', cleanId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] getRecentQueuedNotifications error:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    target: row.target,
    targetRound: row.target_round,
    teamCodes: row.team_codes,
    url: row.url,
    processed: !!row.processed,
    processedAt: row.processed_at ? new Date(row.processed_at).getTime() : undefined,
    result: row.result,
    error: row.error,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

/** Subscribe to realtime changes on notification_queue for an event */
export function subscribeToNotificationQueue(
  eventId: string,
  onUpdate: () => void
) {
  const cleanId = eventId.trim().toLowerCase();
  const channel = supabase
    .channel(`public:notification_queue:${cleanId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_queue',
        filter: `event_id=eq.${cleanId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

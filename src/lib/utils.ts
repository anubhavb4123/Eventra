import type { Team } from '@/types';

// ============================================================
// Password Hashing (Web Crypto API — SHA-256)
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// ============================================================
// Team ID Generation
// ============================================================

/**
 * Generates a Team ID in the format: {eventId}-T{XX}
 * Example: hackathon2026-T01
 */
export function generateTeamId(eventId: string, teamCount: number): string {
  const paddedCount = String(teamCount).padStart(2, '0');
  return `${eventId}-T${paddedCount}`;
}

// ============================================================
// Clipboard
// ============================================================

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Format email to be safe as a Firebase Realtime Database key.
// Firebase keys cannot contain '.', '#', '$', '[', or ']'.
export const formatEmailForDb = (email: string): string => {
  return email.toLowerCase().replace(/\./g, ',');
};

// ============================================================
// CSV Export Helpers
// ============================================================

/** Internal: triggers browser download of a CSV string */
function triggerCSVDownload(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Internal: converts a 2D string array to a CSV string with proper quoting */
function rowsToCSV(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// ── 1. All Details ─────────────────────────────────────────────

export function exportAllDetailsCSV(
  teams: Array<{ id: string } & Team>,
  eventId: string,
  totalRounds: number,
  totalDays: number,
): void {
  // Build header
  const header = [
    'Team ID', 'Team Name', 'Leader', 'Email',
    'Members Count', 'Members', 'Member Roll Numbers', 'Member Colleges', 'Member Branches',
    'Registered At',
  ];
  // Add round qualification columns
  for (let r = 1; r <= totalRounds; r++) header.push(`Round ${r} Qualified`);
  // Add day attendance columns
  for (let d = 1; d <= totalDays; d++) header.push(`Day ${d} Present`);
  // Position column
  header.push('Final Position');

  const rows: string[][] = [header];

  for (const team of teams) {
    const memberNames = team.members.map((m) => m.name).join(' | ');
    const memberRolls = team.members.map((m) => m.rollNumber || '—').join(' | ');
    const memberColleges = team.members.map((m) => m.college || '—').join(' | ');
    const memberBranches = team.members.map((m) => m.branch || '—').join(' | ');
    const registeredAt = team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A';

    const row = [
      team.id, team.teamName, team.leader, team.email ?? '',
      String(team.members.length), memberNames, memberRolls, memberColleges, memberBranches,
      registeredAt,
    ];

    // Round qualifications
    for (let r = 1; r <= totalRounds; r++) {
      const q = team.qualifications?.[String(r)];
      row.push(q === true ? 'Yes' : q === false ? 'No' : '—');
    }

    // Day attendance
    for (let d = 1; d <= totalDays; d++) {
      const da = team.dayAttendance?.[String(d)];
      row.push(da?.marked ? 'Yes' : 'No');
    }

    // Position
    const posLabels: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' };
    row.push(team.position ? posLabels[team.position] ?? String(team.position) : '—');

    rows.push(row);
  }

  triggerCSVDownload(rowsToCSV(rows), `${eventId}_all-details_${new Date().toISOString().split('T')[0]}.csv`);
}

// ── 2. Round Qualified Teams ───────────────────────────────────

export function exportRoundQualifiedCSV(
  teams: Array<{ id: string } & Team>,
  eventId: string,
  round: number,
): void {
  const qualified = teams.filter(t => t.qualifications?.[String(round)] === true);

  const header = [
    'Team ID', 'Team Name', 'Leader', 'Email',
    'Members Count', 'Members', 'Registered At',
  ];
  const rows: string[][] = [header];

  for (const team of qualified) {
    const memberNames = team.members.map((m) => m.name).join(' | ');
    const registeredAt = team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A';

    rows.push([
      team.id, team.teamName, team.leader, team.email ?? '',
      String(team.members.length), memberNames, registeredAt,
    ]);
  }

  triggerCSVDownload(rowsToCSV(rows), `${eventId}_round-${round}-qualified_${new Date().toISOString().split('T')[0]}.csv`);
}

// ── 3. Day Attendance ──────────────────────────────────────────

export function exportDayAttendanceCSV(
  teams: Array<{ id: string } & Team>,
  eventId: string,
  day: number,
): void {
  const dayKey = String(day);
  const present = teams.filter(t => t.dayAttendance?.[dayKey]?.marked);

  const header = [
    'Team ID', 'Team Name', 'Leader', 'Email',
    'Members Count', 'Present Members', 'Absent Members', 'Marked At',
  ];
  const rows: string[][] = [header];

  for (const team of present) {
    const da = team.dayAttendance?.[dayKey];
    const members = da?.members ?? team.members;
    const presentMembers = members.filter(m => m.present).map(m => m.name).join(' | ') || '—';
    const absentMembers = members.filter(m => !m.present).map(m => m.name).join(' | ') || '—';
    const markedAt = da?.markedAt ? new Date(da.markedAt).toLocaleString() : 'N/A';

    rows.push([
      team.id, team.teamName, team.leader, team.email ?? '',
      String(team.members.length), presentMembers, absentMembers, markedAt,
    ]);
  }

  triggerCSVDownload(rowsToCSV(rows), `${eventId}_day-${day}-attendance_${new Date().toISOString().split('T')[0]}.csv`);
}

// Legacy wrapper — kept for backward compat
export function exportTeamsToCSV(teams: Array<{ id: string } & Team>, eventId: string): void {
  exportAllDetailsCSV(teams, eventId, 1, 1);
}

// ============================================================
// Validation
// ============================================================

export function isValidEventId(id: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) && id.length >= 3 && id.length <= 40;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

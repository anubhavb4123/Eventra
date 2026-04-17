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
// CSV Export
// ============================================================

export function exportTeamsToCSV(teams: Array<{ id: string } & Team>, eventId: string): void {
  const rows: string[][] = [
    ['Team ID', 'Team Name', 'Leader', 'Email', 'Attendance', 'Members Count', 'Members', 'Registered At'],
  ];

  for (const team of teams) {
    const memberNames = team.members.map((m) => m.name).join(' | ');
    const attendanceStatus = team.attendanceMarked ? 'Present' : 'Absent';
    const registeredAt = team.createdAt
      ? new Date(team.createdAt).toLocaleString()
      : 'N/A';

    rows.push([
      team.id,
      team.teamName,
      team.leader,
      team.email ?? '',
      attendanceStatus,
      String(team.members.length),
      memberNames,
      registeredAt,
    ]);
  }

  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventId}_teams_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

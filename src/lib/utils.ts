import type { Team } from '@/types';

// ============================================================
// Password Hashing (Web Crypto API — SHA-256)
// ============================================================

// Pure JS SHA-256 fallback for non-secure contexts (e.g. mobile access over HTTP LAN IP like 192.168.x.x where window.crypto.subtle is unavailable)
function sha256Fallback(str: string): string {
  const bytes = typeof TextEncoder !== 'undefined'
    ? Array.from(new TextEncoder().encode(str))
    : Array.from(str).map(c => c.charCodeAt(0) & 0xff);

  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  const bitLength = bytes.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << ((3 - (i % 4)) * 8);
  }

  const w = new Array(64);

  for (let i = 0; i < words.length; i += 16) {
    const oldHash = hash.slice(0);

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback if subtle digest fails unexpectedly
    }
  }
  return sha256Fallback(password);
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

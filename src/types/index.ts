// Database timestamps in RTDB are stored as numbers (ms since epoch)

// ============================================================
// Event Types
// ============================================================

export interface EventData {
  passwordHash: string;
  createdAt: number;
  teamCount: number;
}

export interface EventSettings {
  registrationOpen: boolean;
  registrationDeadline?: string;
  maxTeams?: number;
  currentTeams: number;

  // ── Attendance (by Day) ─────────────────────────────────────
  /** Total event days for attendance tracking */
  numberOfDays?: number;
  /** Current active day (1-based). Organizer advances this to unlock next-day scanning. */
  currentDay?: number;

  // ── Rounds (for Qualification) ──────────────────────────────
  /** Total competition rounds used for qualifying teams */
  numberOfRounds?: number;
  /** Current active round for qualification management */
  currentRound?: number;
}

export interface EventDetails {
  eventName: string;
  description: string;
  dateTime: string;
  teamSizeMin: number;
  teamSizeMax: number;
  venue: string;
  paymentLink?: string;
}

// ============================================================
// Team Types
// ============================================================

export interface TeamMember {
  name: string;
  rollNumber: string;
  college: string;
  branch: string;
  present?: boolean;
}

/** Per-day attendance snapshot stored under teams/{code}/dayAttendance/{day} */
export interface DayAttendance {
  marked: boolean;
  members?: TeamMember[];
  markedAt?: number;
}

export interface Team {
  teamName: string;
  leader: string;
  email?: string;
  members: TeamMember[];
  /** Legacy Day-1 flag kept for backward compat */
  attendanceMarked: boolean;
  createdAt: number;
  /**
   * Per-round qualification: { '1': true, '2': false, '3': true }
   * Organiser toggles these from the Dashboard → Qualified tab.
   */
  qualifications?: Record<string, boolean>;
  /** Per-day attendance records keyed by day number (as string) */
  dayAttendance?: Record<string, DayAttendance>;
  /**
   * Final position assigned in the last round: 1 = 1st place, 2 = 2nd, 3 = 3rd.
   * Only set during the last round view on the Qualified tab.
   */
  position?: number;
}

export interface TeamWithId extends Team {
  id: string;
}

// ============================================================
// Form Types
// ============================================================

export interface CreateEventForm {
  approvalKey: string;
  eventId: string;
  password: string;
}

export interface MemberForm {
  name: string;
  rollNumber: string;
  college: string;
  branch: string;
}

export interface RegistrationForm {
  teamName: string;
  leader: string;
  email: string;
  members: MemberForm[];
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  totalTeams: number;
  presentTeams: number;
  totalMembers: number;
  presentMembers: number;
}

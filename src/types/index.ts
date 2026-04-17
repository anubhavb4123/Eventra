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

export interface Team {
  teamName: string;
  leader: string;
  email?: string;
  members: TeamMember[];
  attendanceMarked: boolean;
  createdAt: number;
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

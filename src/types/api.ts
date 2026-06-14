
export type UUID = string;

// ----- Auth ----------------------------------------------------------
export interface AuthResponse {
  userId: UUID;
  email: string;
  role: 'USER' | 'ADMIN';
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ----- Profile -------------------------------------------------------
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';

export interface ProfileResponse {
  userId: UUID;
  displayName: string;
  bio: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  photoUrl: string | null;
  city: string | null;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  photoUrl?: string;
  city?: string;
}

// ----- Sports & skills ----------------------------------------------
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type MetricType =
  | 'NONE'
  | 'STRENGTH'
  | 'ENDURANCE_REPS'
  | 'ENDURANCE_DISTANCE'
  | 'SPEED';

export interface SportResponse {
  id: UUID;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export interface SkillResponse {
  id: UUID;
  sportId: UUID;
  name: string;
  description: string | null;
  metricType: MetricType;
}

export interface UserSkillResponse {
  skillId: UUID;
  name: string;
  metricType: MetricType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  speedKmh: number | null;
  starred: boolean;
}

export interface UserSportResponse {
  sportId: UUID;
  sportName: string;
  proficiencyLevel: ProficiencyLevel;
  priority: boolean;
  skills: UserSkillResponse[];
}

export interface SkillSelection {
  skillId: UUID;
  weightKg?: number;
  reps?: number;
  distanceKm?: number;
  durationSeconds?: number;
  speedKmh?: number;
  starred: boolean;
}

export interface SetUserSportRequest {
  sportId: UUID;
  proficiencyLevel: ProficiencyLevel;
  priority: boolean;
  skills: SkillSelection[];
}

export type SuggestionType = 'SPORT' | 'SKILL';
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateSuggestionRequest {
  type: SuggestionType;
  parentSportId?: UUID;
  name: string;
  description?: string;
  metricType?: MetricType;
}

export interface SuggestionResponse {
  id: UUID;
  type: SuggestionType;
  parentSportId: UUID | null;
  name: string;
  description: string | null;
  metricType: MetricType | null;
  status: SuggestionStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

// ----- Matching ------------------------------------------------------
export interface DiscoveryCandidate {
  userId: UUID;
  displayName: string;
  bio: string | null;
  city: string | null;
  photoUrl: string | null;
  sharedSports: number;
  sharedSkills: number;
  sharedSportNames: string[];
  score: number;
}

export type SwipeDirection = 'LIKE' | 'PASS';

export interface SwipeRequest {
  targetUserId: UUID;
  direction: SwipeDirection;
}

export interface SwipeResult {
  matched: boolean;
  matchId: UUID | null;
  conversationId: UUID | null;
}

export interface MatchResponse {
  matchId: UUID;
  otherUserId: UUID;
  otherDisplayName: string;
  otherPhotoUrl: string | null;
  conversationId: UUID;
  matchedAt: string;
}

// ----- Chat ----------------------------------------------------------
export interface ConversationResponse {
  id: UUID;
  matchId: UUID;
  otherUserId: UUID;
  otherDisplayName: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageResponse {
  id: UUID;
  conversationId: UUID;
  senderId: UUID;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}

// Spring Data Page wrapper (for /messages endpoint)
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ----- Errors --------------------------------------------------------
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

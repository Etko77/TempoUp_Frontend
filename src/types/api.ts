
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
  latitude: number | null;
  longitude: number | null;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  photoUrl?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// ----- Sports & skills ----------------------------------------------
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

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
}

export interface UserSportResponse {
  sportId: UUID;
  sportName: string;
  proficiencyLevel: ProficiencyLevel;
  priority: boolean;
  skills: SkillResponse[];
}

export interface SetUserSportRequest {
  sportId: UUID;
  proficiencyLevel: ProficiencyLevel;
  priority: boolean;
  skillIds: UUID[];
}

export type SuggestionType = 'SPORT' | 'SKILL';
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateSuggestionRequest {
  type: SuggestionType;
  parentSportId?: UUID;
  name: string;
  description?: string;
}

export interface SuggestionResponse {
  id: UUID;
  type: SuggestionType;
  parentSportId: UUID | null;
  name: string;
  description: string | null;
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
  distanceKm: number | null;
  sharedSports: number;
  sharedSkills: number;
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

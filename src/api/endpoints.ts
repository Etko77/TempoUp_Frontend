import { request } from './client';
import type {
  AuthResponse,
  ConversationResponse,
  CreateSuggestionRequest,
  DiscoveryCandidate,
  LoginRequest,
  MatchResponse,
  MessageResponse,
  Page,
  ProfileResponse,
  RegisterRequest,
  SendMessageRequest,
  SetUserSportRequest,
  SkillResponse,
  SportResponse,
  SuggestionResponse,
  SwipeRequest,
  SwipeResult,
  UpdateProfileRequest,
  UserSportResponse,
  UUID,
} from '@/types/api';

// Auth
export const api = {
  auth: {
    register: (body: RegisterRequest) =>
      request<AuthResponse>('/api/auth/register', { method: 'POST', body, anonymous: true }),
    login: (body: LoginRequest) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body, anonymous: true }),
    logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  },

  // Profile
  profile: {
    me: () => request<ProfileResponse>('/api/profiles/me'),
    update: (body: UpdateProfileRequest) =>
      request<ProfileResponse>('/api/profiles/me', { method: 'PUT', body }),
    byUser: (userId: UUID) => request<ProfileResponse>(`/api/profiles/${userId}`),
  },

  // Sports catalog (public)
  sports: {
    list: () => request<SportResponse[]>('/api/sports', { anonymous: true }),
    skills: (sportId: UUID) =>
      request<SkillResponse[]>(`/api/sports/${sportId}/skills`, { anonymous: true }),
  },

  // Current user's selected sports
  mySports: {
    list: () => request<UserSportResponse[]>('/api/sports/mine'),
    set: (body: SetUserSportRequest) =>
      request<UserSportResponse>('/api/sports/mine', { method: 'PUT', body }),
    remove: (sportId: UUID) =>
      request<void>(`/api/sports/mine/${sportId}`, { method: 'DELETE' }),
  },

  // Community suggestions
  suggestions: {
    create: (body: CreateSuggestionRequest) =>
      request<SuggestionResponse>('/api/sports/suggestions', { method: 'POST', body }),
    mine: () => request<SuggestionResponse[]>('/api/sports/suggestions/mine'),
  },

  // Discovery + swipes
  discovery: {
    feed: (radiusKm?: number, limit?: number) =>
      request<DiscoveryCandidate[]>('/api/discovery', { query: { radiusKm, limit } }),
  },
  swipes: {
    swipe: (body: SwipeRequest) => request<SwipeResult>('/api/swipes', { method: 'POST', body }),
  },
  matches: {
    list: () => request<MatchResponse[]>('/api/matches'),
  },

  // Chat (REST fallback; real-time goes over STOMP)
  conversations: {
    list: () => request<ConversationResponse[]>('/api/conversations'),
    messages: (conversationId: UUID, page = 0, size = 30) =>
      request<Page<MessageResponse>>(`/api/conversations/${conversationId}/messages`, {
        query: { page, size },
      }),
    send: (conversationId: UUID, body: SendMessageRequest) =>
      request<MessageResponse>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body,
      }),
    read: (conversationId: UUID) =>
      request<void>(`/api/conversations/${conversationId}/read`, { method: 'POST' }),
  },
};

import type { UUID } from '@/types/api';

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Discover: undefined;
  Browse: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Conversation: { conversationId: UUID; otherName: string; otherUserId?: UUID; otherPhotoUrl?: string | null };
  MySports: undefined;
  SportPicker: { sportId?: UUID } | undefined;
  ProfileDetail: { userId: UUID; displayName?: string };
  SportDiscovery: { sportId: UUID; sportName: string };
};

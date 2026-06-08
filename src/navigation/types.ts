import type { UUID } from '@/types/api';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Discover: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Conversation: { conversationId: UUID; otherName: string };
  MySports: undefined;
  SportPicker: { sportId?: UUID } | undefined;
};

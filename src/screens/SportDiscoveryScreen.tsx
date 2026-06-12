import React from 'react';
import { SwipeDeck } from '@/components/SwipeDeck';
import { api } from '@/api/endpoints';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SportDiscovery'>;

export function SportDiscoveryScreen({ route }: Props) {
  const { sportId, sportName } = route.params;
  return (
    <SwipeDeck
      title={sportName}
      subtitle=""
      showHeader={false}
      fetchFeed={() => api.discovery.feedBySport(sportId)}
    />
  );
}

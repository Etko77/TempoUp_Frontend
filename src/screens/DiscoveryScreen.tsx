import React from 'react';
import { SwipeDeck } from '@/components/SwipeDeck';
import { api } from '@/api/endpoints';

export function DiscoveryScreen() {
  return (
    <SwipeDeck
      title="Discover"
      subtitle="Swipe right to match, left to pass."
      fetchFeed={() => api.discovery.feed()}
    />
  );
}

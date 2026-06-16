import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '@/api/endpoints';

export function useLocationSync(enabled: boolean) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!enabled || didRun.current) return;
    didRun.current = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await api.profile.update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        // Permission denied, GPS off, or network hiccup — leave location unset.
      }
    })();
  }, [enabled]);
}

import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '@/api/endpoints';

export type LocationSyncResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'permission' | 'unavailable' | 'network'; message: string };

/**
 * Ask permission, read the device coordinates and push them to the profile so
 * the backend can rank nearby partners higher and compute discovery distances.
 *
 * Returns a discriminated result instead of throwing so callers can decide
 * whether to stay silent (background sync) or surface the failure (manual tap).
 */
export async function captureAndSyncLocation(): Promise<LocationSyncResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { ok: false, reason: 'permission', message: 'Location permission was not granted.' };
  }

  // A fresh GPS fix is best, but it can be slow or unavailable indoors. Fall
  // back to the last known position so we still capture *something* usable.
  let pos: Location.LocationObject | null = null;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    pos = await Location.getLastKnownPositionAsync();
  }
  if (!pos) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Could not get a location fix. Make sure location services are on.',
    };
  }

  try {
    await api.profile.update({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
  } catch {
    return { ok: false, reason: 'network', message: 'Could not save your location. Please try again.' };
  }

  return { ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

/**
 * Best-effort background sync once the user is signed in. Retries on the next
 * render if a run fails (e.g. permission prompt dismissed, no fix yet) — only a
 * successful save marks it done, so a denied/again-granted flow still lands.
 */
export function useLocationSync(enabled: boolean) {
  const didSync = useRef(false);

  useEffect(() => {
    if (!enabled || didSync.current) return;

    (async () => {
      const result = await captureAndSyncLocation();
      if (result.ok) didSync.current = true;
    })();
  }, [enabled]);
}

// Geo helpers for showing how far away another user is.

export interface LatLng {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle (haversine) distance between two points in kilometres, or null
 * if either side is missing coordinates. Mirrors the backend's ST_Distance
 * closely enough for display.
 */
export function haversineKm(a: LatLng, b: LatLng): number | null {
  if (
    a.latitude == null || a.longitude == null ||
    b.latitude == null || b.longitude == null
  ) {
    return null;
  }
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Human label for a distance: whole kilometres only, with a floor of 1 km — we
 * never advertise anything closer than "1 km away". Returns null when unknown.
 */
export function formatKmAway(km: number | null | undefined): string | null {
  if (km == null) return null;
  return `${Math.max(1, Math.round(km))} km away`;
}

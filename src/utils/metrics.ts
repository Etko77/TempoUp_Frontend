import type { MetricType, UserSkillResponse } from '@/types/api';

export type MetricFieldKey = 'weightKg' | 'reps' | 'distanceKm' | 'durationMin' | 'speedKmh';

export const METRIC_FIELDS: Record<MetricType, { key: MetricFieldKey; label: string }[]> = {
  NONE: [],
  STRENGTH: [
    { key: 'weightKg', label: 'Weight (kg)' },
    { key: 'reps', label: 'Reps' },
  ],
  ENDURANCE_REPS: [{ key: 'reps', label: 'Reps' }],
  ENDURANCE_DISTANCE: [
    { key: 'distanceKm', label: 'Distance (km)' },
    { key: 'durationMin', label: 'Time (min)' },
  ],
  SPEED: [{ key: 'speedKmh', label: 'Speed (km/h)' }],
};

export const METRIC_LABELS: Record<MetricType, string> = {
  NONE: 'No data',
  STRENGTH: 'Strength',
  ENDURANCE_REPS: 'Endurance (reps)',
  ENDURANCE_DISTANCE: 'Endurance (distance)',
  SPEED: 'Speed',
};

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** A short human label of a user's recorded data for one skill, or null if none. */
export function formatSkillData(sk: UserSkillResponse): string | null {
  switch (sk.metricType) {
    case 'STRENGTH': {
      const parts: string[] = [];
      if (sk.weightKg != null) parts.push(`${sk.weightKg} kg`);
      if (sk.reps != null) parts.push(`× ${sk.reps}`);
      return parts.length ? parts.join(' ') : null;
    }
    case 'ENDURANCE_REPS':
      return sk.reps != null ? `${sk.reps} reps` : null;
    case 'ENDURANCE_DISTANCE': {
      const parts: string[] = [];
      if (sk.distanceKm != null) parts.push(`${sk.distanceKm} km`);
      if (sk.durationSeconds != null) parts.push(formatDuration(sk.durationSeconds));
      return parts.length ? parts.join(' · ') : null;
    }
    case 'SPEED':
      return sk.speedKmh != null ? `${sk.speedKmh} km/h` : null;
    default:
      return null;
  }
}

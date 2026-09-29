/**
 * Reference Track / Open Track.
 *
 * The dashboard API derives the track from who owns a model: everything implemented in
 * ts-arena-models is registered under the TS-Arena admin account and is Reference Track;
 * every other model is Open Track. This module only names and describes the two tracks —
 * it never decides membership itself.
 *
 * ELO is fitted once over both tracks together. A single-track view therefore shows the
 * combined ranking restricted to that track, never a separate fit.
 */

export type Track = 'reference' | 'open';

/** What a board shows: both tracks in one table, or one track only. */
export type TrackView = 'all' | Track;

export const TRACK_LABEL: Record<Track, string> = {
  reference: 'Reference',
  open: 'Open',
};

export const TRACK_VIEW_LABEL: Record<TrackView, string> = {
  all: 'All tracks',
  reference: 'Reference Track',
  open: 'Open Track',
};

export const REFERENCE_MODELS_REPO_URL = 'https://github.com/DAG-UPB/ts-arena-models';

/** Tailwind classes per track, shared by badges, row accents and the switch. */
export const TRACK_STYLE: Record<Track, { badge: string; accent: string; dot: string }> = {
  reference: {
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    accent: 'border-l-indigo-500',
    dot: 'bg-indigo-500',
  },
  open: {
    badge: 'bg-teal-50 text-teal-700 ring-teal-200',
    accent: 'border-l-teal-500',
    dot: 'bg-teal-500',
  },
};

export function isTrack(value: unknown): value is Track {
  return value === 'reference' || value === 'open';
}

/** Rows belonging to the view. 'all' returns the input unchanged (same reference). */
export function filterByTrack<T extends { track?: Track | null }>(rows: T[], view: TrackView): T[] {
  if (view === 'all') return rows;
  return rows.filter((row) => row.track === view);
}

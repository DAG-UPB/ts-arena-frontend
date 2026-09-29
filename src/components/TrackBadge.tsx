import { Track, TRACK_LABEL, TRACK_STYLE, isTrack } from '@/src/lib/tracks';

interface TrackBadgeProps {
  track: Track | null | undefined;
  /** Spell out "Track" after the name, for places where the badge stands alone. */
  long?: boolean;
}

const TRACK_TITLE: Record<Track, string> = {
  reference: 'Reference Track: implemented in ts-arena-models and run by TS-Arena on exactly the context given at registration.',
  open: 'Open Track: submitted by a participant, with any method and any additional data.',
};

/** Coloured pill naming a model's track. Renders nothing when the track is unknown. */
export default function TrackBadge({ track, long = false }: TrackBadgeProps) {
  if (!isTrack(track)) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${TRACK_STYLE[track].badge}`}
      title={TRACK_TITLE[track]}
    >
      {TRACK_LABEL[track]}
      {long && ' Track'}
    </span>
  );
}

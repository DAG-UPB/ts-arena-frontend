import { MoveHorizontal } from 'lucide-react';
import WithReason from '@/src/components/WithReason';
import { formatRankRange, type RankBounds } from '@/src/lib/arenaScore';

interface RankFigureProps {
  bounds: RankBounds;
  reason: string;
  className?: string;
}

/** The place in large type, centred over the rank range; a single place has no range line. */
export default function RankFigure({ bounds, reason, className = 'font-semibold text-gray-900' }: RankFigureProps) {
  const spread = bounds.best !== bounds.worst;
  const place = bounds.place ?? formatRankRange(bounds.best, bounds.worst);
  return (
    <WithReason reason={reason} className="inline-flex flex-col items-center">
      <span className={className}>{place}</span>
      {bounds.place !== null && spread && (
        <span className="flex items-center gap-1 text-xs font-normal text-gray-500">
          {bounds.best}
          <MoveHorizontal className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">to</span>
          {bounds.worst}
        </span>
      )}
    </WithReason>
  );
}

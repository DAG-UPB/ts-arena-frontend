import { AlertTriangle } from 'lucide-react';

/**
 * Definitions whose rounds were cancelled because the forecast window opened inside the
 * already-published day-ahead period. Their boards therefore show pre-28-April rounds only.
 *
 * Remove a definition from this list once enough post-fix rounds have accumulated for its
 * board to stand on its own again; the notice disappears with it.
 */
const AFFECTED_DEFINITION_IDS = [1, 4];

/** First and last affected round, and the last round the board still counts. */
const FIRST_CANCELLED = '28 April 2026';
const LAST_CANCELLED = '10 September 2026';
const BOARD_COUNTS_THROUGH = '27 April 2026';

interface CancelledRoundsNoticeProps {
  definitionId: number | null | undefined;
}

/**
 * Explains, in place, why an affected challenge board is a historical snapshot.
 * Renders nothing for unaffected definitions.
 */
export default function CancelledRoundsNotice({ definitionId }: CancelledRoundsNoticeProps) {
  if (definitionId == null || !AFFECTED_DEFINITION_IDS.includes(definitionId)) {
    return null;
  }

  return (
    <div
      role="note"
      className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 sm:px-6 py-4"
    >
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" aria-hidden="true" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">
            Rounds from {FIRST_CANCELLED} to {LAST_CANCELLED} have been cancelled.
          </p>
          <p className="mt-1">
            Their forecast window opened inside the day-ahead period, whose prices are published
            before the round began. Those rounds measured lookup rather than forecasting, so they
            are excluded from this ranking.
          </p>
          <p className="mt-1">
            What you see below is calculated from rounds up to {BOARD_COUNTS_THROUGH}. Models that
            first competed on this challenge after that date do not appear yet. The scheduling is
            fixed and new rounds are being scored.
          </p>
        </div>
      </div>
    </div>
  );
}

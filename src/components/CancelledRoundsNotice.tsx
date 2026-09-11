import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

/** The news post explaining the cancellation. Remove this banner when the post is old news. */
const NEWS_POST_HREF = '/news/day-ahead-price-rounds-cancelled';

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

/**
 * Site-wide banner for the landing page. The per-definition notice above only appears once a
 * reader selects an affected challenge, but the overall ranking changed too, so the front page
 * needs to say so on its own.
 *
 * Delete this along with the notice once the cancellation is no longer news.
 */
export function CancelledRoundsBanner() {
  return (
    <Link
      href={NEWS_POST_HREF}
      className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
    >
      <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm text-yellow-800">
        <span className="font-medium">
          Rounds on the SMARD day-ahead price challenges from {FIRST_CANCELLED} to {LAST_CANCELLED}{' '}
          have been cancelled.
        </span>{' '}
        Their forecast window overlapped prices that were already public. All rankings are being
        recalculated, including the overall ranking below.
      </p>
      <ChevronRight className="h-5 w-5 text-yellow-600 ml-auto flex-shrink-0" aria-hidden="true" />
    </Link>
  );
}

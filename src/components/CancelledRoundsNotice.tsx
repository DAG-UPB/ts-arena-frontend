'use client';

import { useSyncExternalStore } from 'react';
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

/** How many rounds were cancelled, across both affected challenges. */
const ROUNDS_CANCELLED = 262;

/** The news section, not the post itself, so the banner never outlives the link. */
const NEWS_HREF = '/news';

/**
 * The front page banner retires itself on this date (UTC), roughly four days after the
 * cancellation, by which point the affected models have new evaluations and are back on the
 * boards. Nobody has to remember to take it down. Push the date out if the boards recover
 * more slowly than expected.
 */
const BANNER_HIDE_FROM = Date.parse('2026-09-15T00:00:00Z');

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
  // The expiry has to be evaluated in the browser: this page can be prerendered, and a check
  // done at build time would freeze the banner's state into the HTML. Subscribing to nothing
  // yields false on the server and true once hydrated, so the reader's own clock decides.
  const visible = useSyncExternalStore(
    () => () => {},
    () => Date.now() < BANNER_HIDE_FROM,
    () => false
  );

  if (!visible) {
    return null;
  }

  return (
    <Link
      href={NEWS_HREF}
      className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
    >
      <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm text-yellow-800">
        <span className="font-medium">
          {ROUNDS_CANCELLED} rounds on the two SMARD day-ahead challenges have been cancelled
        </span>{' '}
        and all rankings are being recalculated. See the news section for details.
      </p>
      <ChevronRight className="h-5 w-5 text-yellow-600 ml-auto flex-shrink-0" aria-hidden="true" />
    </Link>
  );
}

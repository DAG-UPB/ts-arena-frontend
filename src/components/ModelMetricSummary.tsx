'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Info } from 'lucide-react';
import type { ArenaScoreRow } from '@/src/services/modelService';
import {
  MaseExplanation,
  RankExplanation,
  ScoreExplanation,
  SqlExplanation,
} from '@/src/components/ColumnExplanations';
import {
  ThirtyDayValue,
  describeRank,
  formatInterval,
  formatScore,
  maseThirtyDays,
  sqlThirtyDays,
} from '@/src/lib/arenaScore';
import { TRACK_LABEL, isTrack } from '@/src/lib/tracks';

interface ModelMetricSummaryProps {
  /** This model's row on the global (point) board, or null if it has none yet. */
  ranking: ArenaScoreRow | null;
}

/** Tile label with an info popover. */
function TileLabel({
  label,
  ariaLabel,
  children,
}: {
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
      <span>{label}</span>
      <Popover className="relative group">
        {({ open }) => (
          <>
            <PopoverButton
              className="flex items-center justify-center w-11 h-11 -m-[14px] rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label={ariaLabel}
            >
              <Info className="w-4 h-4" aria-hidden="true" />
            </PopoverButton>
            <PopoverPanel
              static
              className={`absolute left-0 top-6 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-all duration-200 z-10 normal-case font-normal tracking-normal ${
                open ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}
            >
              {children}
            </PopoverPanel>
          </>
        )}
      </Popover>
    </dt>
  );
}

/** A 30-day value, or a dash with the reason there is none. */
function ThirtyDayTile({ value }: { value: ThirtyDayValue }) {
  if (value.text !== null) return <>{value.text}</>;
  return (
    <>
      <span className="text-gray-400">–</span>
      <span className="block text-xs font-normal text-gray-500">{value.hint}</span>
    </>
  );
}

/**
 * The model's current global standing: its Arena Score with interval and rank
 * range, and the 30-day MASE and SQL behind it.
 *
 * The rest of this page plots the Arena Score over time; this is the one place a
 * reader can see the accuracy numbers it rests on. SQL exists only for models that
 * submit quantile forecasts.
 */
export default function ModelMetricSummary({ ranking }: ModelMetricSummaryProps) {
  if (!ranking) return null;

  const rank = describeRank(ranking);
  const trackRank = isTrack(ranking.track) ? describeRank(ranking, ranking.track) : null;
  const interval = formatInterval(ranking.ci_lower, ranking.ci_upper);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Current Standing</h2>
        <span className="text-sm text-gray-500">(all challenges)</span>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-md bg-gray-50 px-4 py-3">
          <TileLabel label="Arena Score" ariaLabel="About the Arena Score and the rank">
            <div className="space-y-1.5">
              <p>
                <ScoreExplanation />
              </p>
              <p>
                <RankExplanation />
              </p>
            </div>
          </TileLabel>
          <dd className="mt-1 text-xl font-semibold text-gray-900">
            {ranking.score === null ? '–' : formatScore(ranking.score)}
            {interval && (
              <span className="ml-2 text-xs font-normal text-gray-500" title="95 % confidence interval">
                {interval}
              </span>
            )}
            <span className="block text-xs font-normal text-gray-500" title={rank.title}>
              {rank.ranked ? (
                <>
                  rank {rank.text}
                  {trackRank?.ranked && (
                    <> · {trackRank.text} in {TRACK_LABEL[ranking.track]} Track</>
                  )}
                </>
              ) : (
                rank.text
              )}
            </span>
          </dd>
        </div>

        <div className="rounded-md bg-gray-50 px-4 py-3">
          <TileLabel label="MASE (30 days)" ariaLabel="About MASE (30 days)">
            <MaseExplanation />
          </TileLabel>
          <dd className="mt-1 text-xl font-semibold text-gray-900">
            <ThirtyDayTile value={maseThirtyDays(ranking)} />
          </dd>
        </div>

        <div className="rounded-md bg-gray-50 px-4 py-3">
          <TileLabel label="SQL (30 days)" ariaLabel="About SQL (30 days)">
            <SqlExplanation />
          </TileLabel>
          <dd className="mt-1 text-xl font-semibold text-gray-900">
            <ThirtyDayTile value={sqlThirtyDays(ranking)} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

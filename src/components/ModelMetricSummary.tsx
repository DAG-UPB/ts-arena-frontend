'use client';

import type { ArenaScoreRow } from '@/src/services/modelService';
import {
  MaseExplanation,
  RankExplanation,
  ScoreExplanation,
  SqlExplanation,
} from '@/src/components/ColumnExplanations';
import LabelWithInfo from '@/src/components/LabelWithInfo';
import WithReason from '@/src/components/WithReason';
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

function Tile({
  label,
  ariaLabel,
  info,
  children,
}: {
  label: string;
  ariaLabel: string;
  info: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-gray-50 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
        <LabelWithInfo label={label} ariaLabel={ariaLabel} width="w-72" align="left">
          {info}
        </LabelWithInfo>
      </dt>
      <dd className="mt-1 text-xl font-semibold text-gray-900">{children}</dd>
    </div>
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
 * The model's current global standing: its point Arena Score with interval and rank
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
        <Tile
          label="Arena Score (all challenges, point)"
          ariaLabel="About the Arena Score and the rank"
          info={
            <div className="space-y-1.5">
              <p>
                <ScoreExplanation />
              </p>
              <p>
                <RankExplanation />
              </p>
            </div>
          }
        >
          {ranking.score === null ? '–' : formatScore(ranking.score)}
          {interval && (
            <WithReason reason="95 % confidence interval" className="ml-2 text-xs font-normal text-gray-500">
              {interval}
            </WithReason>
          )}
          <WithReason reason={rank.title} className="block text-xs font-normal text-gray-500">
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
          </WithReason>
        </Tile>

        <Tile label="MASE (30 days)" ariaLabel="About MASE (30 days)" info={<MaseExplanation />}>
          <ThirtyDayTile value={maseThirtyDays(ranking)} />
        </Tile>

        <Tile label="SQL (30 days)" ariaLabel="About SQL (30 days)" info={<SqlExplanation />}>
          <ThirtyDayTile value={sqlThirtyDays(ranking)} />
        </Tile>
      </dl>
    </div>
  );
}

import {
  DEFAULT_COVERAGE_TAU,
  DEFAULT_PROVISIONAL_WEEKS,
  MIN_PARTICIPATION_30D,
  formatPercent,
} from '@/src/lib/arenaScore';

/** Info-popover bodies for the ranking columns, shared by the boards and the model page. */

export function ScoreExplanation() {
  return (
    <>
      <span className="font-semibold">Arena Score</span>: compares models series by series on the
      ratio of their errors. 1000 is the mean of the compared models and higher is better. The
      interval below the score is its 95 % confidence interval.
    </>
  );
}

export function RankExplanation() {
  return (
    <>
      The range of places the confidence intervals allow. A model&apos;s place cannot be pinned
      down more closely than that on the data so far. Models with fewer than{' '}
      {DEFAULT_PROVISIONAL_WEEKS} weeks of results, or that forecast fewer than{' '}
      {formatPercent(DEFAULT_COVERAGE_TAU)} of a challenge&apos;s tasks since joining, are listed
      without a rank.
    </>
  );
}

export function MaseExplanation() {
  return (
    <>
      <span className="font-semibold">MASE (30 days)</span>: the geometric mean of the
      model&apos;s MASE over the last 30 days. Lower is better. Shown for models that took part
      in at least {formatPercent(MIN_PARTICIPATION_30D)} of that period&apos;s tasks. A task is
      one series in one round.
    </>
  );
}

export function SqlExplanation() {
  return (
    <>
      <span className="font-semibold">Scaled Quantile Loss</span>: the mean pinball loss over the
      nine deciles (0.1 … 0.9), divided by the same naive-forecast MAE that scales MASE. Shown as
      the geometric mean over the last 30 days. Lower is better, and the two metrics are on one
      scale, so they can be read side by side. Only models that submit quantile forecasts have it,
      from {formatPercent(MIN_PARTICIPATION_30D)} participation.
    </>
  );
}

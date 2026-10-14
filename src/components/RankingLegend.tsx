import { DEFAULT_PROVISIONAL_WEEKS } from '@/src/lib/arenaScore';

/** How to read the ranking tables, in words that work on a phone, where the column popovers do not. */
export default function RankingLegend() {
  return (
    <>
      Arena Score: higher is better, with its 95 % confidence interval. Point rates the error of
      the point forecasts; Probabilistic rates the error of the quantile forecasts and lists only
      models that submit quantiles. The rank is a range: a model&apos;s place cannot be pinned down
      more closely than that on the data so far. Models with fewer than{' '}
      {DEFAULT_PROVISIONAL_WEEKS} weeks of results show no rank yet. MASE and SQL cover the last
      30 days: lower is better. SQL is shown only for models that submit quantile forecasts.
    </>
  );
}

import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'statistical',
  name: 'Statistical Baselines',
  vendor: 'Classical forecasting',
  category: 'statistical',
  summary:
    'Reference rule-based baselines that every foundation model should beat. They have no learned parameters; they exist on the leaderboard so that absolute scores have an interpretable floor — if a TSFM cannot outperform Seasonal Naive, something is wrong.',
  links: {},
  versions: [
    {
      readableId: 'naive',
      displayName: 'Naive',
      sizeM: 0,
      note: 'Repeats the last observed value for the full horizon.',
    },
    {
      readableId: 'seasonal-naive',
      displayName: 'Seasonal Naive',
      sizeM: 0,
      note:
        'Repeats the value from the most recent corresponding seasonal period. Surprisingly hard to beat.',
    },
    {
      readableId: 'simple-moving-average',
      displayName: 'Simple Moving Average',
      sizeM: 0,
      note: 'Mean of the last N observations, projected forward.',
    },
    {
      readableId: 'seasonal-average',
      displayName: 'Seasonal Average',
      sizeM: 0,
      note: 'Mean across past seasonal periods, projected forward.',
    },
  ],
};

export default function StatisticalBody() {
  return (
    <>
      <p>
        Classical baselines sit on the leaderboard as honest reference points.
        They have no learned parameters — every forecast is a closed-form
        function of the most recent observations — so they impose a hard
        floor for absolute scores. A foundation model that loses to Seasonal
        Naive on a given challenge is almost certainly mis-configured for
        that series&apos; frequency or horizon, or is suffering from a data
        issue rather than a modelling one.
      </p>
      <p>
        Four baselines are evaluated here: <strong>Naive</strong> (carry the
        last value), <strong>Seasonal Naive</strong> (carry the value from the
        previous corresponding season), <strong>Simple Moving Average</strong>
        {' '}(mean of the last N observations), and <strong>Seasonal
        Average</strong> (mean of past seasonal periods). Seasonal Naive in
        particular is famously hard to beat on strongly periodic series like
        electricity load.
      </p>
    </>
  );
}

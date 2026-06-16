import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'chronos',
  name: 'Chronos',
  vendor: 'Amazon Science',
  category: 'foundation-model',
  summary:
    'Tokenises time-series values into a fixed vocabulary and trains transformer language models on them with cross-entropy loss. Two generations on the leaderboard: Chronos-Bolt (patch-based encoder-decoder, ~250× faster than the original Chronos) and Chronos-2 (encoder-only, supports univariate, multivariate, and covariate-informed forecasting in one model).',
  links: {
    paper: 'https://arxiv.org/abs/2403.07815',
    repo: 'https://github.com/amazon-science/chronos-forecasting',
    website:
      'https://www.amazon.science/blog/introducing-chronos-2-from-univariate-to-universal-forecasting',
  },
  versions: [
    {
      readableId: 'chronos-bolt-tiny',
      displayName: 'Chronos-Bolt Tiny',
      sizeM: 9,
      note: 'Smallest Bolt variant. Encoder-decoder, patch-based.',
      date: '2024-11-26',
    },
    {
      readableId: 'chronos-bolt-mini',
      displayName: 'Chronos-Bolt Mini',
      sizeM: 21,
      date: '2024-11-26',
    },
    {
      readableId: 'chronos-bolt-small',
      displayName: 'Chronos-Bolt Small',
      sizeM: 48,
      date: '2024-11-26',
    },
    {
      readableId: 'chronos-bolt-base',
      displayName: 'Chronos-Bolt Base',
      sizeM: 205,
      note: 'Largest Bolt variant; strong zero-shot at modest cost.',
      date: '2024-11-26',
    },
    {
      readableId: 'chronos-2',
      displayName: 'Chronos-2',
      sizeM: 120,
      note:
        'Next-generation encoder-only model. Adds in-context covariates and multivariate forecasting.',
      date: '2025-10-17',
    },
  ],
};

export default function ChronosBody() {
  return (
    <>
      <p>
        Chronos reframes probabilistic time-series forecasting as language
        modelling: continuous values are scaled and quantised into a fixed
        vocabulary of tokens, after which an off-the-shelf transformer
        (originally based on T5) is trained with cross-entropy loss over
        next-token prediction. The original Chronos family was pretrained on
        a large open corpus complemented by Gaussian-process synthetic data
        and ranged from 20M to 710M parameters.
      </p>
      <p>
        <strong>Chronos-Bolt</strong> is the second-generation patch-based
        variant: instead of one token per timestep, contiguous patches of
        observations are encoded together, yielding ~250× faster inference at
        comparable accuracy. The four Bolt sizes (Tiny → Base) trade speed
        for capacity along a fairly clean Pareto curve.
      </p>
      <p>
        <strong>Chronos-2</strong> (Oct 2025) drops the encoder-decoder
        structure for an encoder-only design and unifies univariate,
        multivariate, and covariate-informed forecasting in a single
        120M-parameter checkpoint.
      </p>
    </>
  );
}

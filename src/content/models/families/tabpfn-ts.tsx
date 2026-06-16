import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'tabpfn-ts',
  name: 'TabPFN-TS',
  vendor: 'Prior Labs (Frank Hutter)',
  category: 'foundation-model',
  summary:
    'Treats forecasting as tabular regression: lightweight temporal features (lags, calendar) are fed into the pretrained tabular foundation model TabPFN-v2. No time-series-specific pretraining, yet SOTA on covariate-informed forecasting in GIFT-Eval at only 11M parameters.',
  links: {
    paper: 'https://arxiv.org/abs/2501.02945',
    repo: 'https://github.com/PriorLabs/tabpfn-time-series',
    website: 'https://priorlabs.ai/',
  },
  versions: [
    {
      readableId: 'tabpfn-ts',
      displayName: 'TabPFN-TS',
      sizeM: 11,
      note:
        'Built on the TabPFN-v2 tabular foundation model; ultra-compact.',
    },
  ],
};

export default function TabPfnTsBody() {
  return (
    <>
      <p>
        TabPFN-TS is an unusual entry in this list: it isn&apos;t a
        time-series foundation model in the strict sense. Instead, it
        repurposes <em>TabPFN-v2</em>, a Prior-Fitted Network pretrained on
        purely tabular regression tasks, by adding a thin temporal featuriser
        (lags, calendar features, simple statistics) and feeding the result to
        TabPFN as a standard tabular row.
      </p>
      <p>
        Despite skipping time-series-specific pretraining entirely, the
        11M-parameter pipeline achieves state-of-the-art covariate-informed
        forecasting on GIFT-Eval and competitive univariate performance on
        fev-bench. It is also the smallest model in the lineup by an order of
        magnitude, which makes it cheap to deploy as a strong covariate
        baseline.
      </p>
    </>
  );
}

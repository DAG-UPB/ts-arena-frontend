import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'moirai',
  name: 'Moirai',
  vendor: 'Salesforce AI Research',
  category: 'foundation-model',
  summary:
    'Masked-encoder universal forecasting transformer trained on LOTSA (~27B observations across nine domains). Multiple patch-size projection layers handle frequency diversity; an any-variate attention mechanism handles arbitrary numbers of covariates; a mixture-distribution head models flexible predictive distributions.',
  links: {
    paper: 'https://arxiv.org/abs/2402.02592',
    repo: 'https://github.com/SalesforceAIResearch/uni2ts',
    website: 'https://www.salesforce.com/blog/moirai/',
  },
  versions: [
    {
      readableId: 'moirai-small',
      displayName: 'Moirai 1.1-R Small',
      sizeM: 14,
      note: 'Encoder-only. Smallest 1.1-R checkpoint.',
      date: '2024-02-04',
    },
    {
      readableId: 'moirai-base-model',
      displayName: 'Moirai 1.1-R Base',
      sizeM: 91,
      note: 'Encoder-only.',
      date: '2024-02-04',
    },
    {
      readableId: 'moirai-large',
      displayName: 'Moirai 1.1-R Large',
      sizeM: 311,
      note: 'Encoder-only. Largest 1.1-R checkpoint.',
      date: '2024-02-04',
    },
    {
      readableId: 'moirai-2-small',
      displayName: 'Moirai 2.0-R Small',
      sizeM: 14,
      note:
        'Second-generation Moirai. Decoder-only; pretrained on the GIFT-Eval Pretrain subset plus additional data.',
      date: '2025-11-12',
    },
  ],
};

export default function MoiraiBody() {
  return (
    <>
      <p>
        Moirai is Salesforce&apos;s &ldquo;universal&rdquo; forecasting
        transformer. The 1.x line is a masked-encoder model: history patches
        are encoded jointly, masked target patches are reconstructed, and the
        same model handles univariate and multivariate inputs through an
        any-variate attention mechanism that ignores variate ordering.
      </p>
      <p>
        It addresses three classic time-series challenges directly:
        cross-frequency learning (multiple patch-size projection heads
        chosen per frequency), arbitrary covariate count (any-variate
        attention), and varying distributional shapes (a mixture-distribution
        output head). Pretraining uses the LOTSA archive — ~27B observations
        spanning nine domains.
      </p>
      <p>
        Moirai-2.0-R (Nov 2025) revisits the architecture as a decoder-only
        model and re-trains on the GIFT-Eval Pretrain subset with additional
        data, currently available in a Small (14M) variant.
      </p>
    </>
  );
}

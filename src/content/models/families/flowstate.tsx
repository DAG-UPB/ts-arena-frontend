import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'flowstate',
  name: 'FlowState',
  vendor: 'IBM Research',
  category: 'foundation-model',
  summary:
    'Tiny TSFM (~2M params) combining a state-space-model encoder with a functional-basis decoder. Inhabits a timescale-invariant coefficient space, so a single training run helps inference at every sampling rate. SOTA on GIFT-ZS and Chronos-ZS at minuscule cost. NeurIPS 2025.',
  links: {
    paper: 'https://arxiv.org/abs/2508.05287',
    repo: 'https://huggingface.co/ibm-research/flowstate',
    website:
      'https://research.ibm.com/publications/flowstate-sampling-rate-invariant-time-series-foundation-model-with-dynamic-forecasting-horizons',
  },
  versions: [
    {
      readableId: 'flowstate',
      displayName: 'FlowState',
      sizeM: 2,
      note: 'Single released checkpoint; SSM encoder + functional-basis decoder.',
    },
  ],
};

export default function FlowStateBody() {
  return (
    <>
      <p>
        FlowState is IBM Research&apos;s argument that sampling rate
        invariance is the missing piece in TSFM design. The encoder is a
        state-space model (SSM); the decoder projects onto a functional basis
        rather than emitting samples directly. Together they let the model
        operate in a <em>continuous</em>, timescale-invariant coefficient
        space — training on hourly data helps inference on 15-minute data and
        vice versa, all from the same checkpoint.
      </p>
      <p>
        At roughly 2 million parameters FlowState is the smallest model in the
        line-up by a wide margin, yet it reports SOTA on the GIFT-ZS and
        Chronos-ZS benchmarks and is the only TSFM here designed from the
        ground up to handle arbitrary, even unseen, sampling rates without
        retraining. Accepted at NeurIPS 2025.
      </p>
    </>
  );
}

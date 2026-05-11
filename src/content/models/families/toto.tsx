import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'toto',
  name: 'Toto',
  vendor: 'Datadog',
  category: 'foundation-model',
  summary:
    'Decoder-only multivariate transformer optimised for observability metrics. Pre-trained on a mix of Datadog telemetry, open datasets, and synthetic data — 4–10× larger than the pretraining corpora of competing TSFMs. Ships with the BOOM observability benchmark.',
  links: {
    paper: 'https://arxiv.org/abs/2505.14766',
    repo: 'https://github.com/DataDog/toto',
    website: 'https://huggingface.co/Datadog/Toto-Open-Base-1.0',
  },
  versions: [
    {
      readableId: 'toto',
      displayName: 'Toto Open Base 1.0',
      sizeM: 151,
      note:
        '151M-parameter decoder-only transformer; the openly released base size.',
    },
  ],
};

export default function TotoBody() {
  return (
    <>
      <p>
        Toto is Datadog&apos;s time-series foundation model, specifically aimed
        at the observability domain — high-frequency, multivariate signals
        from metrics infrastructure rather than the macroeconomic or
        energy-load series that dominate most TSFM benchmarks.
      </p>
      <p>
        The model is a 151M-parameter decoder-only transformer with several
        architectural tweaks for multivariate observability data. Pretraining
        mixes Datadog&apos;s own telemetry with open and synthetic series and
        is reported to be 4–10× larger than the pretraining corpora of leading
        competitors. The release ships with <strong>BOOM</strong>, a 350M-point
        benchmark of real-world Datadog observability signals.
      </p>
    </>
  );
}

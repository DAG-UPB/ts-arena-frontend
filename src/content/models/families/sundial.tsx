import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'sundial',
  name: 'Sundial',
  vendor: 'THUML, Tsinghua University',
  category: 'foundation-model',
  summary:
    'Generative TSFM pretrained on TimeBench (~1 trillion time points). Introduces TimeFlow Loss to predict next-patch distributions directly, removing the need for discrete tokenisation and enabling non-deterministic, probabilistic forecasts. ICML 2025 Oral.',
  links: {
    paper: 'https://arxiv.org/abs/2502.00816',
    repo: 'https://github.com/thuml/Sundial',
    website: 'https://huggingface.co/thuml/sundial-base-128m',
  },
  versions: [
    {
      readableId: 'sundial-128m',
      displayName: 'Sundial Base 128M',
      sizeM: 128,
      note:
        'Single released checkpoint at the time of writing; pretrained on TimeBench.',
      date: '2025-02-02',
    },
  ],
};

export default function SundialBody() {
  return (
    <>
      <p>
        Sundial is a generative time-series foundation model from Tsinghua&apos;s
        THUML group. Where Chronos quantises values into a discrete vocabulary,
        Sundial keeps continuous outputs and trains with a novel
        &ldquo;TimeFlow Loss&rdquo; that directly predicts the distribution
        over the next patch. This lets the transformer emit non-deterministic,
        probabilistic forecasts without ever tokenising.
      </p>
      <p>
        Pretraining uses TimeBench — about one trillion time points,
        predominantly real-world data with a synthetic component. Sundial
        reports SOTA results on the Time-Series-Library benchmark, GIFT-Eval,
        and FEV, and the released 128M checkpoint runs zero-shot inference on
        CPU within seconds.
      </p>
    </>
  );
}

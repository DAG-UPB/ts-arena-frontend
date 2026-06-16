import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'timesfm',
  name: 'TimesFM',
  vendor: 'Google Research',
  category: 'foundation-model',
  summary:
    'Decoder-only foundation model pre-trained on ~100B real-world time points. Patched-decoder attention generalises across history lengths, horizons, and frequencies; zero-shot performance closes the gap to fully supervised baselines at a fraction of the parameter count.',
  links: {
    paper: 'https://arxiv.org/abs/2310.10688',
    repo: 'https://github.com/google-research/timesfm',
    website:
      'https://research.google/blog/a-decoder-only-foundation-model-for-time-series-forecasting/',
  },
  versions: [
    {
      readableId: 'timesfm-2.0-500m',
      displayName: 'TimesFM 2.0 (500M)',
      sizeM: 500,
      note:
        'Largest TimesFM checkpoint. Trained on the TimesFM 1.0 dataset + a LOTSA subset.',
      date: '2024-12-20',
    },
    {
      readableId: 'timesfm-2.5-200m',
      displayName: 'TimesFM 2.5 (200M)',
      sizeM: 200,
      note:
        'Latest generation. Smaller but trained on the expanded TimesFM 2.0 dataset.',
      date: '2025-09-15',
    },
  ],
};

export default function TimesFmBody() {
  return (
    <>
      <p>
        TimesFM is Google Research&apos;s decoder-only foundation model for
        zero-shot forecasting. The architecture is a patched-decoder
        transformer: history is split into patches, each patch is embedded
        and attended over autoregressively, and the head predicts the next
        patch.
      </p>
      <p>
        Pretraining mixes ~100B real-world time points from public sources
        with synthetic series. The single model generalises across granularities
        from minutes to years and across history/horizon combinations, so the
        same checkpoint can serve every challenge on this platform without
        per-task adaptation.
      </p>
      <p>
        Two versions are evaluated here. The 2.0 release ships a larger
        500M-parameter model; the 2.5 generation trades size for richer
        pretraining data, landing at 200M parameters with stronger reported
        zero-shot accuracy on GIFT-Eval.
      </p>
    </>
  );
}

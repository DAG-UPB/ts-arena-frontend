import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'moment',
  name: 'MOMENT',
  vendor: 'Auton Lab, CMU',
  category: 'foundation-model',
  summary:
    'Encoder-only family of open time-series foundation models, pretrained on the Time-Series Pile. Building blocks for forecasting, classification, anomaly detection, and imputation; effective zero-shot and tunable with light task-specific data.',
  links: {
    paper: 'https://arxiv.org/abs/2402.03885',
    repo: 'https://github.com/moment-timeseries-foundation-model/moment',
    website: 'https://huggingface.co/AutonLab/MOMENT-1-large',
  },
  versions: [
    {
      readableId: 'moment-small',
      displayName: 'MOMENT-1 Small',
      sizeM: 40,
      note: 'Smallest MOMENT-1 checkpoint.',
    },
    {
      readableId: 'moment-base-model',
      displayName: 'MOMENT-1 Base',
      sizeM: 125,
    },
    {
      readableId: 'moment-large',
      displayName: 'MOMENT-1 Large',
      sizeM: 385,
      note: 'Largest MOMENT-1 checkpoint.',
    },
  ],
};

export default function MomentBody() {
  return (
    <>
      <p>
        MOMENT (Auton Lab, CMU, ICML 2024) is one of the first openly released
        general-purpose time-series foundation models. The architecture is an
        encoder-only transformer trained with a masked-reconstruction objective
        on the &ldquo;Time-Series Pile&rdquo; — a large, diverse, public
        time-series corpus assembled by the authors specifically to enable
        large-scale multi-dataset pretraining.
      </p>
      <p>
        The released checkpoints are designed as building blocks for multiple
        downstream tasks: forecasting, classification, anomaly detection, and
        imputation. They work zero-shot, with few-shot adaptation, or with
        full fine-tuning. TS-Arena runs the Small / Base / Large
        MOMENT-1 checkpoints.
      </p>
    </>
  );
}

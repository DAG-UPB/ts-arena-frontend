import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'time-moe',
  name: 'Time-MoE',
  vendor: 'Time-MoE collaboration',
  category: 'foundation-model',
  summary:
    'Decoder-only foundation model with a sparse mixture-of-experts FFN. Only a subset of experts is activated per token, enabling billion-scale capacity at modest inference cost. Pretrained on Time-300B (>300B time points across nine domains).',
  links: {
    paper: 'https://arxiv.org/abs/2409.16040',
    repo: 'https://github.com/Time-MoE/Time-MoE',
    website: 'https://huggingface.co/Maple728/TimeMoE-200M',
  },
  versions: [
    {
      readableId: 'time-moe-50m',
      displayName: 'Time-MoE 50M',
      sizeM: 50,
      note: 'Smallest active variant; trained on Time-300B.',
      date: '2024-09-24',
    },
    {
      readableId: 'time-moe-200m',
      displayName: 'Time-MoE 200M',
      sizeM: 200,
      note: 'Larger active variant of the same architecture and data.',
      date: '2024-09-24',
    },
  ],
};

export default function TimeMoeBody() {
  return (
    <>
      <p>
        Time-MoE is a family of decoder-only foundation models published as an
        ICLR 2025 Spotlight. Each transformer block replaces the dense
        feed-forward layer with a mixture-of-experts router: only a few
        experts are active per token, so the parameter count grows independently
        of the per-token compute. This is the same idea that powers
        Switch Transformer / Mixtral in language modelling, applied to
        autoregressive time-series forecasting with context up to 4096 steps.
      </p>
      <p>
        Pretraining uses Time-300B — over 300 billion time points across nine
        domains — and the released model line scales to 2.4B parameters in the
        paper. The TS-Arena leaderboard runs the 50M and 200M active-parameter
        checkpoints.
      </p>
    </>
  );
}

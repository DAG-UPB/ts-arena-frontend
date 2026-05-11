import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'tirex',
  name: 'TiRex',
  vendor: 'NX-AI (Hochreiter group)',
  category: 'foundation-model',
  summary:
    '35M-parameter xLSTM-based zero-shot forecaster. Uses Contiguous Patch Masking during training to stabilise long-horizon autoregressive generation. Reports SOTA on GIFT-Eval and Chronos-ZS, outperforming much larger transformer models.',
  links: {
    paper: 'https://arxiv.org/abs/2505.23719',
    repo: 'https://github.com/NX-AI/tirex',
    website: 'https://nx-ai.github.io/tirex/',
  },
  versions: [
    {
      readableId: 'tirex',
      displayName: 'TiRex',
      sizeM: 35,
      note: 'Single released checkpoint; xLSTM-based.',
    },
  ],
};

export default function TiRexBody() {
  return (
    <>
      <p>
        TiRex is NX-AI&apos;s argument that recurrence isn&apos;t dead. Where
        most TSFMs are transformers (or, more recently, state-space models),
        TiRex uses <strong>xLSTM</strong>, an enhanced LSTM variant from the
        Hochreiter group. The claim: xLSTM retains genuine state-tracking,
        which transformers, SSMs, and parallelisable RNNs like RWKV all
        struggle with — and state-tracking matters most for long-horizon
        forecasting.
      </p>
      <p>
        The training recipe contributes <em>Contiguous Patch Masking</em>
        (CPM), a masking strategy that improves coherence in multi-step
        autoregressive generation by mitigating the usual error
        accumulation pattern. At 35M parameters, TiRex reports SOTA results
        on GIFT-Eval and Chronos-ZS, beating Chronos-Bolt, TimesFM, and
        Moirai head-to-head at much smaller cost.
      </p>
    </>
  );
}

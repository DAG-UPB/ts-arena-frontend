import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'tinytimemixer',
  name: 'TinyTimeMixer (TTM)',
  vendor: 'IBM Research / IBM Granite',
  category: 'foundation-model',
  summary:
    'Compact pretrained model (~1M parameters) built on the TSMixer MLP-mixer architecture. Uses adaptive patching, diverse resolution sampling, and resolution prefix tuning to handle multi-frequency pretraining. Runs on CPU, beats much larger models in zero/few-shot forecasting. NeurIPS 2024.',
  links: {
    paper: 'https://arxiv.org/abs/2401.03955',
    repo: 'https://github.com/ibm-granite/granite-tsfm',
    website: 'https://huggingface.co/ibm-granite/granite-timeseries-ttm-r2',
  },
  versions: [
    {
      readableId: 'tinytimemixer-r1-512-96',
      displayName: 'TTM R1 (ctx 512 / horizon 96)',
      sizeM: 1,
      note: 'First-generation checkpoint, 512-step context, 96-step horizon.',
    },
    {
      readableId: 'tinytimemixer-r1-1024-96',
      displayName: 'TTM R1 (ctx 1024 / horizon 96)',
      sizeM: 1,
      note: 'First-generation checkpoint, longer 1024-step context.',
    },
    {
      readableId: 'tinytimemixer-r2-512-96',
      displayName: 'TTM R2 (ctx 512 / horizon 96)',
      sizeM: 1,
      note: 'Refreshed pretraining (R2), 512-step context.',
    },
    {
      readableId: 'tinytimemixer-r2-1024-96',
      displayName: 'TTM R2 (ctx 1024 / horizon 96)',
      sizeM: 1,
      note: 'Refreshed pretraining (R2), 1024-step context.',
    },
  ],
};

export default function TinyTimeMixerBody() {
  return (
    <>
      <p>
        TinyTimeMixer (TTM) is IBM&apos;s answer to the &ldquo;do we really
        need a billion parameters?&rdquo; question. The backbone is the
        all-MLP <em>TSMixer</em> design — interleaved feature- and patch-mixing
        blocks with gated attention — and the released checkpoints sit at
        roughly one million parameters each.
      </p>
      <p>
        Three pretraining tricks let a single TTM checkpoint handle many
        frequencies and horizons: <strong>adaptive patching</strong> (patch
        size scales with input resolution), <strong>diverse resolution
        sampling</strong>, and <strong>resolution prefix tuning</strong>. The
        result is a CPU-friendly model that reports 4–40% improvements over
        much larger zero/few-shot baselines.
      </p>
      <p>
        The four versions on the leaderboard differ in pretraining generation
        (R1 vs R2) and in their fixed context/horizon size (512/1024 input
        steps, 96 output steps).
      </p>
    </>
  );
}

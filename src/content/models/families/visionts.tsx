import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'visionts',
  name: 'VisionTS / VisionTS++',
  vendor: 'VisionTS authors',
  category: 'foundation-model',
  summary:
    'Reframes forecasting as image reconstruction: render the time series as an image and let a visual masked autoencoder (MAE) pre-trained on ImageNet fill in the future. VisionTS++ continues pretraining the vision backbone on large-scale time-series data and adds probabilistic and multi-channel forecasting.',
  links: {
    // TS-Arena runs the VisionTS++ checkpoints. Link the VisionTS++ paper
    // and its official repo as the canonical references; the parent VisionTS
    // work is cited inline in the description body.
    paper: 'https://arxiv.org/abs/2508.04379',
    repo: 'https://github.com/HALF111/VisionTSpp',
    website: 'https://huggingface.co/Lefei/VisionTSpp',
  },
  versions: [
    {
      readableId: 'visiontspp-base',
      displayName: 'VisionTS++ Base',
      sizeM: 86,
      note: 'Continually-pretrained ViT-B vision backbone.',
    },
    {
      readableId: 'visiontspp-large',
      displayName: 'VisionTS++ Large',
      sizeM: 307,
      note: 'Continually-pretrained ViT-L vision backbone.',
    },
  ],
};

export default function VisionTsBody() {
  return (
    <>
      <p>
        The original{' '}
        <a
          href="https://arxiv.org/abs/2408.17253"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          VisionTS
        </a>{' '}
        is the most architecturally surprising entry on the leaderboard:
        it doesn&apos;t train a time-series model at all. The history is
        rendered as a 2-D image, the model is a plain visual masked
        autoencoder (MAE) pretrained on ImageNet, and forecasting is performed
        by asking the MAE to reconstruct the masked future region of the
        image. No time-series-specific pretraining, no fine-tuning — yet it
        delivers competitive zero-shot accuracy.
      </p>
      <p>
        <strong>VisionTS++</strong> is the natural follow-up and the
        version actually evaluated here: take the ImageNet-pretrained vision
        backbone and <em>continually</em> pretrain it on large-scale
        time-series data to close the distribution gap, while adding
        probabilistic outputs and native multi-channel forecasting. TS-Arena
        runs the Base (86M) and Large (307M) VisionTS++ checkpoints.
      </p>
    </>
  );
}

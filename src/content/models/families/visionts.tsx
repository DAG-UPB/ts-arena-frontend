import type { ModelFamilyMetadata } from '../types';

export const metadata: ModelFamilyMetadata = {
  slug: 'visionts',
  name: 'VisionTS / VisionTS++',
  vendor: 'VisionTS authors',
  category: 'foundation-model',
  summary:
    'Reframes forecasting as image reconstruction: render the time series as an image and let a visual masked autoencoder (MAE) pre-trained on ImageNet fill in the future. VisionTS++ continues pretraining the vision backbone on large-scale time-series data and adds probabilistic and multi-channel forecasting.',
  links: {
    paper: 'https://arxiv.org/abs/2408.17253',
    repo: 'https://github.com/Keytoyze/VisionTS',
    website: 'https://arxiv.org/abs/2508.04379',
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
        VisionTS is the most architecturally surprising entry on the
        leaderboard: it doesn&apos;t train a time-series model at all. The
        history is rendered as a 2-D image, the model is a plain visual masked
        autoencoder (MAE) pretrained on ImageNet, and forecasting is performed
        by asking the MAE to reconstruct the masked future region of the
        image. No time-series-specific pretraining, no fine-tuning — yet it
        delivers competitive zero-shot accuracy.
      </p>
      <p>
        <strong>VisionTS++</strong> is the natural follow-up: take the
        ImageNet-pretrained vision backbone and continue pretraining on
        large-scale time-series data to close the distribution gap, while
        adding probabilistic outputs and native multi-channel forecasting.
        TS-Arena runs the Base (86M) and Large (307M) VisionTS++ checkpoints.
      </p>
    </>
  );
}

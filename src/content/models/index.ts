import ChronosBody, { metadata as chronosMeta } from './families/chronos';
import FlowStateBody, { metadata as flowstateMeta } from './families/flowstate';
import MoiraiBody, { metadata as moiraiMeta } from './families/moirai';
import MomentBody, { metadata as momentMeta } from './families/moment';
import StatisticalBody, { metadata as statisticalMeta } from './families/statistical';
import SundialBody, { metadata as sundialMeta } from './families/sundial';
import TabPfnTsBody, { metadata as tabpfnTsMeta } from './families/tabpfn-ts';
import TimeMoeBody, { metadata as timeMoeMeta } from './families/time-moe';
import TimesFmBody, { metadata as timesfmMeta } from './families/timesfm';
import TinyTimeMixerBody, {
  metadata as tinyTimeMixerMeta,
} from './families/tinytimemixer';
import TiRexBody, { metadata as tirexMeta } from './families/tirex';
import TotoBody, { metadata as totoMeta } from './families/toto';
import VisionTsBody, { metadata as visionTsMeta } from './families/visionts';
import type { ModelFamilyEntry } from './types';

/**
 * Adding a new model family:
 *   1. Create `src/content/models/families/<slug>.tsx`.
 *      Export a `metadata: ModelFamilyMetadata` and a default React component
 *      for the longer-form description body.
 *   2. Import both here and add an entry to `all` below.
 *   3. The listing page and the dynamic family route auto-pick up the new
 *      family — no other wiring needed.
 */
const all: ModelFamilyEntry[] = [
  { ...chronosMeta, Component: ChronosBody },
  { ...flowstateMeta, Component: FlowStateBody },
  { ...moiraiMeta, Component: MoiraiBody },
  { ...momentMeta, Component: MomentBody },
  { ...sundialMeta, Component: SundialBody },
  { ...tabpfnTsMeta, Component: TabPfnTsBody },
  { ...timeMoeMeta, Component: TimeMoeBody },
  { ...timesfmMeta, Component: TimesFmBody },
  { ...tinyTimeMixerMeta, Component: TinyTimeMixerBody },
  { ...tirexMeta, Component: TiRexBody },
  { ...totoMeta, Component: TotoBody },
  { ...visionTsMeta, Component: VisionTsBody },
  { ...statisticalMeta, Component: StatisticalBody },
];

/**
 * Public listing order: foundation models first (alphabetical), statistical
 * baselines at the bottom (alphabetical).
 */
export const families: ModelFamilyEntry[] = [...all].sort((a, b) => {
  if (a.category !== b.category) {
    return a.category === 'foundation-model' ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
});

export function findFamily(slug: string): ModelFamilyEntry | null {
  return families.find((f) => f.slug === slug) ?? null;
}

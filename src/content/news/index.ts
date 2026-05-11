import WelcomeBody, { metadata as welcomeMeta } from './posts/2026-05-11-welcome';
import CancelledRoundsBody, {
  metadata as cancelledRoundsMeta,
} from './posts/2026-05-04-cancelled-rounds-elo-fix';
import RawDataInterpolationBody, {
  metadata as rawDataInterpolationMeta,
} from './posts/2026-04-29-raw-data-interpolation';
import type { PostEntry } from './types';

/**
 * Adding a new post:
 *   1. Create `src/content/news/posts/<YYYY-MM-DD>-<slug>.tsx`.
 *      Export a `metadata: PostMetadata` and a default React component for the body.
 *   2. Import both here and add an entry to `all` below.
 *   3. The listing and the dynamic route auto-pick up the new post; no other wiring needed.
 */
const all: PostEntry[] = [
  { ...welcomeMeta, Component: WelcomeBody },
  { ...cancelledRoundsMeta, Component: CancelledRoundsBody },
  { ...rawDataInterpolationMeta, Component: RawDataInterpolationBody },
];

// Sort newest first. ISO YYYY-MM-DD sorts lexically.
export const posts: PostEntry[] = [...all].sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostEntry | null {
  return posts.find((p) => p.slug === slug) ?? null;
}

import { Prose } from '../Prose';
import type { PostMetadata } from '../types';

export const metadata: PostMetadata = {
  slug: '2026-04-29-raw-data-interpolation',
  title: 'Why we stopped interpolating missing values in raw time series',
  date: '2026-04-29',
  summary:
    'Forward-fill and linear interpolation hid provider outages behind plausible-looking numbers, and models were being scored against synthetic ground truth. Here is what we found in the data-portal and what changed.',
  category: 'investigation',
};

export default function Post() {
  return (
    <Prose>
      <h2>The symptom</h2>
      <p>
        A model that had been near the top of one of the consumption challenges
        suddenly dropped several places over a single week, without any change to the
        model itself or its inputs. Spot-checking the affected rounds, the ground-truth
        series for those rounds had visible discontinuities — flat segments followed by
        sharp recoveries — that did not match the upstream provider&apos;s public
        dashboards.
      </p>

      <h2>What we found</h2>
      <p>
        Several data-portal plugins were applying forward-fill or short-window linear
        interpolation to fill gaps before persisting samples. The intent was good — a
        contiguous series is easier to forecast against, and short gaps from API hiccups
        are usually safe to fill — but the side-effects bit us in two ways:
      </p>
      <ul>
        <li>
          <strong>Outage hidden as normal data.</strong> When a provider was offline for
          several hours, the forward-fill produced a flat plateau that <em>looked</em>{' '}
          like the demand had stalled. Models that correctly predicted a continuation
          of the prior trend were penalised against ground truth that was, in fact,
          synthetic.
        </li>
        <li>
          <strong>Recovery looked like a shock.</strong> When the provider came back
          and the next real sample landed, the step from the flat-filled value to the
          true value showed up as a sharp jump — a &ldquo;shock&rdquo; no model could
          have predicted, because it wasn&apos;t one.
        </li>
      </ul>

      <h2>What changed</h2>
      <p>
        Raw time-series data in the data-portal is no longer interpolated. Missing
        samples are stored as gaps. Downstream consumers that need a continuous series
        for visualisation can choose their own fill strategy and label it as such;
        scoring jobs already tolerate gaps.
      </p>
      <p>
        Tankerkönig was the worst offender and is the first plugin to be migrated. The
        broader cleanup is tracked in backend{' '}
        <a
          href="https://git.uni-paderborn.de/ts-arena/ts-arena-backend/-/work_items/34"
          target="_blank"
          rel="noopener noreferrer"
        >
          #34
        </a>{' '}
        (&ldquo;stop interpolating missing values&rdquo;) and{' '}
        <a
          href="https://git.uni-paderborn.de/ts-arena/ts-arena-backend/-/work_items/37"
          target="_blank"
          rel="noopener noreferrer"
        >
          #37
        </a>{' '}
        (the specific Tankerkönig case).
      </p>

      <h2>What this means for past leaderboard results</h2>
      <p>
        Rounds whose ground truth came from the affected windows were re-evaluated
        where the original raw data was still recoverable, and cancelled where it was
        not. ELO snapshots are not rewritten retroactively (see the cancelled-rounds
        post for why), but any new scoring runs use the corrected series.
      </p>

      <h2>Open question — outage detection</h2>
      <p>
        Removing interpolation does not solve the harder problem: distinguishing a true
        zero (e.g. a bike-share network really at zero free bikes during a peak) from a
        provider outage that <em>also</em> reports zero. The CityBikes plugin in
        particular needs explicit outage detection rather than blind trust in the
        upstream payload; that work is tracked separately on the backend repo.
      </p>
    </Prose>
  );
}

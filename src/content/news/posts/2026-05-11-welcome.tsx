import { Prose } from '../Prose';
import type { PostMetadata } from '../types';

export const metadata: PostMetadata = {
  slug: '2026-05-11-welcome',
  title: 'Introducing the TS-Arena Blog',
  date: '2026-05-11',
  summary:
    'A new place where we share platform updates, post-mortems on incidents that affected the leaderboard, and deep-dives into past challenge rounds.',
  category: 'feature',
};

export default function Post() {
  return (
    <Prose>
      <p>
        Until today, TS-Arena had no in-platform channel for explaining what we changed,
        what broke, or what we learned from a particular round. The leaderboard tells you{' '}
        <em>where</em> things ended up; it does not tell you <em>why</em>. This blog fills
        that gap.
      </p>

      <h2>What you&apos;ll read here</h2>
      <p>Posts fall into one of three categories, signalled by a badge at the top:</p>
      <ul>
        <li>
          <strong>Feature</strong> — new models, new challenges, dashboard changes, scoring
          tweaks, anything we want users to notice.
        </li>
        <li>
          <strong>Incident</strong> — when a round, a deployment, or a score was affected
          by a bug we shipped, we write up what happened, what we changed, and what
          remains open. No reputational reason to hide these; pre-registration only works
          when the audit trail is public.
        </li>
        <li>
          <strong>Investigation</strong> — analyses of past rounds where a model behaved
          unexpectedly, where the data source looked suspicious, or where the methodology
          itself deserves a closer look.
        </li>
      </ul>

      <h2>Why a blog over a changelog</h2>
      <p>
        Changelogs work when changes are small and atomic. Most of what affects
        leaderboard outcomes here is <em>not</em> small — a data-quality patch can
        invalidate a week of scores, a new model can shift ELO across the board, and a
        scoring fix can rewrite the ranking retroactively. Each of those deserves a few
        paragraphs, not a one-line bullet.
      </p>

      <h2>Suggesting a topic</h2>
      <p>
        If you noticed something on the leaderboard that doesn&apos;t add up — a model
        ranked higher than its track record suggests, a round that looks like a data
        glitch, anything — open an issue on the{' '}
        <a
          href="https://github.com/DAG-UPB/ts-arena"
          target="_blank"
          rel="noopener noreferrer"
        >
          ts-arena meta-repo
        </a>{' '}
        and we&apos;ll look into it.
      </p>
    </Prose>
  );
}

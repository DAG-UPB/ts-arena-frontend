import { Prose } from '../Prose';
import type { PostMetadata } from '../types';

export const metadata: PostMetadata = {
  slug: '2026-05-04-cancelled-rounds-elo-fix',
  title: 'Cancelled rounds were leaking into the ELO leaderboard',
  date: '2026-05-04',
  summary:
    "Rounds marked is_cancelled still influenced MASE and ELO scores. We patched the ranking views, refreshed the materialised view, and rebuilt today's leaderboard snapshot.",
  category: 'incident',
};

export default function Post() {
  return (
    <Prose>
      <h2>What happened</h2>
      <p>
        When a challenge round is cancelled — typically because the ground truth turned
        out to be wrong, or a data source had a known outage during the registration
        window — we set <code>is_cancelled = TRUE</code> on the round. Cancelled rounds
        are filtered out of the round-list views, so they stop showing up in the UI.
      </p>
      <p>
        They were <strong>not</strong> filtered out of{' '}
        <code>forecasts.v_ranking_base</code>, which is the view every leaderboard query
        ultimately reads from. As a result, MASE scores from a cancelled-but-already-evaluated
        round continued to influence both the per-round model stats and the daily ELO
        update.
      </p>

      <h2>What changed</h2>
      <p>
        We added <code>AND cr.is_cancelled = FALSE</code> to the <code>WHERE</code>{' '}
        clause of the affected views in <code>init_db.sql</code>:
      </p>
      <ul>
        <li>
          <code>forecasts.v_ranking_base</code> — the primary leak path.
        </li>
        <li>
          <code>forecasts.round_model_scores</code> (materialised view) — all three
          UNION branches (<code>global</code>, <code>definition</code>,{' '}
          <code>frequency_horizon</code>). The dashboard reads from this matview, so
          fixing only <code>v_ranking_base</code> would not have been enough.
        </li>
      </ul>
      <p>
        The same SQL was applied to the live DB via{' '}
        <code>DROP MATERIALIZED VIEW … + CREATE … + REFRESH</code> (matviews cannot be{' '}
        <code>CREATE OR REPLACE</code>d).
      </p>

      <h2>The snapshot table caught us out</h2>
      <p>
        After the view fix, the dashboard still showed the cancelled round&apos;s high
        MASE values. Root cause:{' '}
        <code>forecasts.daily_rankings</code> is a snapshot table — columns like{' '}
        <code>avg_mase</code> and <code>mase_std</code> are pre-computed at ELO
        calculation time and persisted. The leaderboard reads those columns directly,
        so a fix to the upstream view does <em>not</em> retroactively rewrite snapshot
        rows.
      </p>
      <p>
        We deleted the current-day snapshot and let{' '}
        <code>startup_elo_check_job</code> recompute it on the next api-portal restart:
      </p>
      <pre>
        <code>{`DELETE FROM forecasts.daily_rankings
  WHERE calculation_date = CURRENT_DATE;
-- then restart api-portal`}</code>
      </pre>

      <h2>What&apos;s still open</h2>
      <p>
        <code>dashboard-api/app/repositories/model_repository.py</code>{' '}
        (<code>get_model_stats</code>) queries <code>forecasts.scores</code> directly
        and filters only on <code>cs.mase IS NOT NULL</code> — no{' '}
        <code>is_cancelled</code> guard, no <code>final_evaluation</code> guard. The
        per-range model-stats endpoints (last 7 days / 30 days / all-time) will keep
        including cancelled rounds until that&apos;s patched. Tracking issue: backend{' '}
        <a
          href="https://git.uni-paderborn.de/ts-arena/ts-arena-backend/-/work_items/40"
          target="_blank"
          rel="noopener noreferrer"
        >
          #40
        </a>
        .
      </p>

      <h2>Impact on past results</h2>
      <p>
        If you noticed a model&apos;s ELO move unexpectedly in early May, this is
        likely why. Today&apos;s snapshot is correct; rankings prior to{' '}
        <code>2026-05-04</code> were not retroactively rewritten — that would have
        meant rebuilding ELO history from scratch, which carries its own risks.
      </p>
    </Prose>
  );
}

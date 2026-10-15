import type { ArenaScoreRow } from '@/src/services/modelService';
import { TRACK_VIEW_LABEL, type TrackView } from '@/src/lib/tracks';

// Fallbacks for responses that do not carry the thresholds (the per-model history).
export const DEFAULT_PROVISIONAL_WEEKS = 4;
export const DEFAULT_COVERAGE_TAU = 0.5;

/** Share of the last 30 days' tasks a model needs for a MASE or SQL (30 days) value. */
export const MIN_PARTICIPATION_30D = 0.8;

/** Rounds down, so a share just below a threshold never reads as the threshold. */
export function formatPercent(share: number): string {
  return `${Math.floor(share * 100 + 1e-9)} %`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatInterval(lower: number | null, upper: number | null): string | null {
  if (lower === null || upper === null) return null;
  return `[${formatScore(lower)}, ${formatScore(upper)}]`;
}

export function formatRankRange(best: number, worst: number): string {
  return best === worst ? String(best) : `${best}–${worst}`;
}

/** Place with its range in one line, e.g. "2 (1–6)"; just the number when the range is a single place. */
export function formatRank(bounds: RankBounds): string {
  const range = formatRankRange(bounds.best, bounds.worst);
  if (bounds.place === null || bounds.best === bounds.worst) return range;
  return `${bounds.place} (${range})`;
}

/** Rows a table shows: scored models, and outside a single challenge only those with enough coverage. */
export function isListed(row: ArenaScoreRow): boolean {
  if (row.score === null) return false;
  return row.scope_type === 'definition' || !row.low_coverage;
}

interface RankInput {
  provisional: boolean;
  low_coverage: boolean;
  unranked_disconnected: boolean;
  coverage: number | null;
  weeks_played: number;
  rank?: number | null;
  rank_best: number | null;
  rank_worst: number | null;
  track_rank?: number | null;
  track_rank_best?: number | null;
  track_rank_worst?: number | null;
  provisional_weeks?: number | null;
  coverage_tau?: number | null;
}

export interface RankBounds {
  /** Place by score; null when the response does not carry it. */
  place: number | null;
  best: number;
  worst: number;
}

/** The place and rank range to show, or null while the model has none. A track view uses the in-track ones. */
export function rankBounds(entry: RankInput, trackView: TrackView = 'all'): RankBounds | null {
  if (entry.provisional || entry.low_coverage || entry.unranked_disconnected) return null;
  // Entries without track ranges (the per-model history) fall back to the combined range.
  const inTrack = trackView !== 'all' && entry.track_rank_best !== undefined;
  const place = inTrack ? entry.track_rank : entry.rank;
  const best = inTrack ? entry.track_rank_best : entry.rank_best;
  const worst = inTrack ? entry.track_rank_worst : entry.rank_worst;
  return best == null || worst == null ? null : { place: place ?? null, best, worst };
}

export interface RankDisplay {
  text: string;
  title: string;
  /** True when `text` is a rank rather than a status. */
  ranked: boolean;
  /** Place and range of a ranked model. */
  bounds: RankBounds | null;
}

function rankMeaning(bounds: RankBounds): string {
  const place = bounds.place === null ? '' : `Place ${bounds.place} by Arena Score. `;
  if (bounds.best === bounds.worst) {
    return `${place}The 95 % confidence intervals separate this model from the models above and below it.`;
  }
  return `${place}The 95 % confidence intervals allow places ${bounds.best} to ${bounds.worst}: models whose intervals overlap cannot be separated yet.`;
}

/** What the rank cell shows: the range, or the reason there is none. */
export function describeRank(entry: RankInput, trackView: TrackView = 'all'): RankDisplay {
  if (entry.unranked_disconnected) {
    return {
      text: 'not comparable yet',
      title:
        'This model has no comparison with the main group of models in this ranking yet, so it has no score and no rank.',
      ranked: false,
      bounds: null,
    };
  }

  if (entry.provisional) {
    const weeks = entry.provisional_weeks ?? DEFAULT_PROVISIONAL_WEEKS;
    return {
      text: `provisional · ${entry.weeks_played} of ${weeks} weeks`,
      title: `Fewer than ${weeks} weeks of results so far. Score and interval are shown; the rank follows once ${weeks} weeks are in.`,
      ranked: false,
      bounds: null,
    };
  }

  if (entry.low_coverage) {
    const tau = entry.coverage_tau ?? DEFAULT_COVERAGE_TAU;
    if (entry.coverage !== null && entry.coverage < tau) {
      return {
        text: `coverage ${formatPercent(entry.coverage)} (needs ${formatPercent(tau)})`,
        title: `Since it joined, this model has forecast ${formatPercent(entry.coverage)} of the tasks in its least covered challenge. A rank needs ${formatPercent(tau)} in every challenge.`,
        ranked: false,
        bounds: null,
      };
    }
    return {
      text: 'not ranked yet',
      title:
        'Since this model joined, not every challenge of this ranking has had a round yet. It gets a rank once they all have.',
      ranked: false,
      bounds: null,
    };
  }

  const bounds = rankBounds(entry, trackView);
  if (!bounds) return { text: '–', title: 'No rank.', ranked: false, bounds: null };
  return {
    text: formatRank(bounds),
    title:
      trackView === 'all'
        ? rankMeaning(bounds)
        : `Rank among ${TRACK_VIEW_LABEL[trackView]} models. ${rankMeaning(bounds)}`,
    ranked: true,
    bounds,
  };
}

/** A 30-day column value: `text` is null when it is not shown, and `hint` says why. */
export interface ThirtyDayValue {
  text: string | null;
  hint: string;
  /** Short form of the hint, for places without hover. */
  short: string;
}

const NO_SCORED_FORECASTS: ThirtyDayValue = {
  text: null,
  hint: 'No scored forecasts in the last 30 days.',
  short: '',
};

function participationHint(prefix: string, share: number): string {
  return `${prefix} ${formatPercent(share)} of the last 30 days' tasks; shown from ${formatPercent(MIN_PARTICIPATION_30D)}.`;
}

export function maseThirtyDays(row: ArenaScoreRow): ThirtyDayValue {
  if (row.mase_30d !== null) return { text: row.mase_30d.toFixed(3), hint: '', short: '' };
  if (row.participation_30d === null) return NO_SCORED_FORECASTS;
  return {
    text: null,
    hint: participationHint('Participated in', row.participation_30d),
    short: `${formatPercent(row.participation_30d)} of tasks`,
  };
}

export function sqlThirtyDays(row: ArenaScoreRow): ThirtyDayValue {
  if (row.sql_30d !== null) return { text: row.sql_30d.toFixed(3), hint: '', short: '' };
  if (row.participation_30d === null) return NO_SCORED_FORECASTS;
  if (row.sql_participation_30d === null) {
    return { text: null, hint: 'No quantile forecasts in the last 30 days.', short: 'no quantiles' };
  }
  return {
    text: null,
    hint: participationHint('Sent quantile forecasts for', row.sql_participation_30d),
    short: `${formatPercent(row.sql_participation_30d)} of tasks`,
  };
}

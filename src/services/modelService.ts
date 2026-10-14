import type { Track } from '@/src/lib/tracks';

export type ScoreMetric = 'point' | 'probabilistic';

export type ScopeType = 'global' | 'definition' | 'frequency_horizon';

export interface ArenaScoreFilters {
  definition_id?: number;
  frequency_horizon?: string;
  calculation_date?: string;
  /** Rows per scope. Defaults to the maximum: hidden rows count towards the limit. */
  limit?: number;
  /**
   * Fetch every scope of this type in a single request instead of one request
   * per scope. `limit` then applies per scope. Mutually exclusive with
   * definition_id / frequency_horizon.
   */
  scope_type?: 'definition' | 'frequency_horizon';
  /** 'point' by default; 'probabilistic' lists only models that send quantiles. */
  metric?: ScoreMetric;
}

export interface ArenaScoreRow {
  model_id: number;
  model_name: string;
  readable_id: string | null;
  architecture: string | null;
  model_size: number | null;
  organization_name: string | null;
  /** Reference Track (implemented in ts-arena-models) or Open Track (everyone else). */
  track: Track;
  scope_type: ScopeType;
  /** Null for global, the definition id for a definition, `frequency::horizon` otherwise. */
  scope_id: string | null;
  definition_id: number | null;
  calculation_date: string;
  /** Null for a model that is not comparable with the rest of the scope. */
  score: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  /** Rank range the confidence intervals allow. Null unless the model is ranked. */
  rank_best: number | null;
  rank_worst: number | null;
  /** The same range among the models of the row's own track. */
  track_rank_best: number | null;
  track_rank_worst: number | null;
  provisional: boolean;
  low_coverage: boolean;
  unranked_disconnected: boolean;
  coverage: number | null;
  weeks_played: number;
  tasks_played: number;
  rounds_played: number;
  mase_30d: number | null;
  participation_30d: number | null;
  sql_30d: number | null;
  sql_participation_30d: number | null;
  tasks_30d: number | null;
  provisional_weeks: number | null;
  coverage_tau: number | null;
}

export interface ArenaScoresResponse {
  rankings: ArenaScoreRow[];
  scope: { type: ScopeType; id: string | null };
  metric: ScoreMetric;
  track: Track | null;
  calculation_date: string | null;
}

export interface ChallengeDefinition {
  id: number;
  name: string;
}

export interface FilterOptions {
  definitions: ChallengeDefinition[];
  frequency_horizons: string[];
  calculation_dates: Array<{
    calculation_date: string;
    is_month_end: boolean;
  }>;
}

export interface ArenaScoreDaily {
  calculation_date: string;
  score: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  rank_best: number | null;
  rank_worst: number | null;
  provisional: boolean;
  low_coverage: boolean;
  unranked_disconnected: boolean;
  coverage: number | null;
  weeks_played: number;
}

export interface ArenaScoreScopeHistory {
  scope_type: ScopeType;
  scope_id: string | null;
  definition_id: number | null;
  definition_name: string | null;
  daily_scores: ArenaScoreDaily[];
}

export interface ModelArenaScores {
  model_id: number;
  model_name: string;
  track: Track;
  metric: ScoreMetric;
  /** Empty when the model has no scores for the metric. */
  scopes: ArenaScoreScopeHistory[];
}

export interface ModelDetails {
  readable_id: string;
  name: string;
  // Registration requires only a name and a readable id; every descriptive field
  // below is optional and comes back null for models that never filled it in —
  // externally hosted models in particular register with almost nothing.
  model_family: string | null;
  model_size: number | null;
  hosting: string | null;
  architecture: string | null;
  pretraining_data: string | null;
  publishing_date: string | null;
  // Optional discovery / provenance metadata (see backend ticket #43).
  paper_url?: string | null;
  repo_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  arxiv_id?: string | null;
  track?: Track;
}

/**
 * Single row in `GET /api/v1/models` — the flat list of every registered model.
 * No page consumes it since the hard-coded Models tab was removed; the endpoint
 * stays as the service-layer mirror of the dashboard-api.
 */
export interface ModelListItem {
  id: number;
  readable_id: string | null;
  name: string;
  model_family: string | null;
  model_size: number | null;
  architecture: string | null;
  paper_url?: string | null;
  repo_url?: string | null;
  website_url?: string | null;
  arxiv_id?: string | null;
  track?: Track;
}

export interface SeriesInfo {
  series_id: number;
  series_name: string;
  series_unique_id: string;
  rounds_participated: number;
}

export interface DefinitionWithSeries {
  definition_id: number;
  definition_name: string;
  series: SeriesInfo[];
}

export interface ModelSeriesByDefinition {
  model_id: number;
  model_readable_id: string;
  model_name: string;
  definitions: DefinitionWithSeries[];
}

const MAX_ARENA_SCORE_LIMIT = 1000;

export async function getArenaScores(filters: ArenaScoreFilters = {}): Promise<ArenaScoresResponse> {
  const params = new URLSearchParams();

  if (filters.scope_type) params.append('scope_type', filters.scope_type);
  if (filters.definition_id) params.append('definition_id', filters.definition_id.toString());
  if (filters.frequency_horizon) params.append('frequency_horizon', filters.frequency_horizon);
  if (filters.calculation_date) params.append('calculation_date', filters.calculation_date);
  if (filters.metric) params.append('metric', filters.metric);
  params.append('limit', (filters.limit ?? MAX_ARENA_SCORE_LIMIT).toString());

  const response = await fetch(`/api/v1/models/arena-scores?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch arena scores: ${response.status}`);
  }
  const data = await response.json();
  // Callers group and sort these rows straight from render, so reject a payload
  // without them here instead of failing later.
  if (!Array.isArray(data?.rankings)) {
    throw new Error('Unexpected arena-scores payload');
  }
  return data;
}

export async function getArenaScoreFilters(): Promise<FilterOptions> {
  const url = '/api/v1/models/arena-score-filters';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch arena score filters: ${response.status}`);
  }
  const data = await response.json();
  // Callers read these three arrays straight from render, so a payload that is
  // missing them takes the whole page down with the error boundary rather than
  // failing in the fetch handler. Reject it here instead.
  if (
    !Array.isArray(data?.calculation_dates) ||
    !Array.isArray(data?.definitions) ||
    !Array.isArray(data?.frequency_horizons)
  ) {
    throw new Error('Unexpected arena-score-filters payload');
  }
  return data;
}

export async function getModelDetails(modelId: string): Promise<ModelDetails> {
  const url = `/api/v1/models/${modelId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch model details: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function getModelArenaScores(
  modelId: string,
  metric: ScoreMetric = 'point'
): Promise<ModelArenaScores> {
  const url = `/api/v1/models/${modelId}/arena-scores?metric=${metric}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch model arena scores: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data?.scopes)) {
    throw new Error('Unexpected model arena-scores payload');
  }
  return data;
}

export interface ModelActiveRound {
  round_id: number;
  round_name: string;
  description: string | null;
  definition_id: number | null;
  definition_name: string | null;
  status: string;
  registration_start: string | null;
  registration_end: string | null;
  start_time: string | null;
  end_time: string | null;
  frequency: string | null;
  horizon: string | null;
}

export interface ModelActiveRoundsResponse {
  model_id: number;
  model_readable_id: string;
  model_name: string;
  rounds: ModelActiveRound[];
}

export async function getModelActiveRounds(modelId: string): Promise<ModelActiveRoundsResponse | null> {
  const url = `/api/v1/models/${modelId}/active-rounds`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // 404 (endpoint not deployed yet, or unknown model) → treat as "no active rounds"
      return null;
    }
    return response.json();
  } catch (err) {
    console.error('Error fetching active rounds:', err);
    return null;
  }
}

export async function getModelSeriesByDefinition(modelId: string): Promise<ModelSeriesByDefinition> {
  const url = `/api/v1/models/${modelId}/series-by-definition`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch series by definition: ${response.status}`);
  }
  return response.json();
}

export async function getAllModels(): Promise<ModelListItem[]> {
  const response = await fetch('/api/v1/models');
  if (!response.ok) {
    throw new Error(`Failed to fetch models list: ${response.status}`);
  }
  return response.json();
}

export async function getModelSeriesForecasts(
  modelId: string,
  definitionId: number,
  seriesId: number,
  startDate?: string,
  endDate?: string
): Promise<import('@/src/types/challenge').ModelSeriesForecastsResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const queryString = params.toString();
  const url = `/api/v1/models/${modelId}/definitions/${definitionId}/series/${seriesId}/forecasts${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch series forecasts: ${response.status}`);
  }
  return response.json();
}

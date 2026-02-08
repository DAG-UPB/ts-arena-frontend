export interface RankingFilters {
  definition_id?: number;
  frequency_horizon?: string;
  calculation_date?: string;
  limit?: number;
}

export interface ModelRanking {
  model_id: number;
  model_name: string;
  readable_id: string;
  username: string;
  organization_name: string;
  architecture?: string;
  model_size?: number;
  elo_score: number;
  elo_ci_lower: number;
  elo_ci_upper: number;
  elo_ci_lower_diff: number;
  elo_ci_upper_diff: number;
  n_matches: number;
  n_bootstraps: number;
  rank_position: number;
  mase_avg: number;
  mase_std: number;
  n_evaluations: number;
  calculated_at: string;
  calculation_date: string;
}

export interface RankingsResponse {
  rankings: ModelRanking[];
  filters_applied: Record<string, any>;
}

export interface ChallengeDefinition {
  id: number;
  name: string;
}

export interface FilterOptions {
  definitions: ChallengeDefinition[];
  frequency_horizons: string[];
}

export interface TimeRangeRanking {
  rank: number;
  total_models: number;
  rounds_participated: number;
  avg_mase: number | null;
  stddev_mase: number | null;
  min_mase: number | null;
  max_mase: number | null;
  elo_score: number | null;
}

export interface DefinitionRanking {
  definition_id: number;
  definition_name: string;
  rankings_7d?: TimeRangeRanking;
  rankings_30d?: TimeRangeRanking;
  rankings_90d?: TimeRangeRanking;
  rankings_365d?: TimeRangeRanking;
}

export interface DailyRanking {
  calculation_date: string;
  elo_score: number;
  elo_ci_lower: number;
  elo_ci_upper: number;
  rank_position: number;
}

export interface DefinitionRankingWithHistory {
  definition_id: number;
  definition_name: string;
  daily_rankings: DailyRanking[];
}

export interface ModelDetails {
  readable_id: string;
  name: string;
  model_family: string;
  model_size: number;
  hosting: string;
  architecture: string;
  pretraining_data: string;
  publishing_date: string;
}

export interface ModelDetailRankings {
  model_id: number;
  model_name: string;
  definition_rankings: DefinitionRankingWithHistory[];
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

export async function getFilteredRankings(filters: RankingFilters = {}): Promise<RankingsResponse> {
  const params = new URLSearchParams();
  
  if (filters.definition_id) params.append('definition_id', filters.definition_id.toString());
  if (filters.frequency_horizon) params.append('frequency_horizon', filters.frequency_horizon);
  if (filters.calculation_date) params.append('calculation_date', filters.calculation_date);
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const url = `/api/v1/models/rankings${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url);
  return response.json();
}

export async function getRankingFilters(): Promise<FilterOptions> {
  const url = '/api/v1/models/ranking-filters';
  
  const response = await fetch(url);
  return response.json();
}

export async function getModelDetails(modelId: string): Promise<ModelDetails> {
  const url = `/api/v1/models/${modelId}`;

  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function getModelRankings(modelId: string): Promise<ModelDetailRankings> {
  const url = `/api/v1/models/${modelId}/rankings`;

  const response = await fetch(url);
  return response.json();
}

export async function getModelSeriesByDefinition(modelId: string): Promise<ModelSeriesByDefinition> {
  const url = `/api/v1/models/${modelId}/series-by-definition`;

  const response = await fetch(url);
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
  return response.json();
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import ModelPerformanceCharts from '@/src/components/ModelPerformanceCharts';
import ModelSeriesList from '@/src/components/ModelSeriesList';
import DetailsCard from '@/src/components/DetailsCard';
import ModelActiveRounds from '@/src/components/ModelActiveRounds';
import ModelMetricSummary from '@/src/components/ModelMetricSummary';
import { getModelRankings, ModelDetailRankings, getModelSeriesByDefinition, ModelSeriesByDefinition, getModelDetails, ModelDetails, getModelActiveRounds, ModelActiveRoundsResponse, getFilteredRankings, ModelRanking } from '@/src/services/modelService';

/** Enough to cover the global board; it holds well under a hundred models. */
const GLOBAL_BOARD_LIMIT = 500;

/** Shown in place of a metadata field the model never supplied. */
const UNSPECIFIED = 'Not specified';

function formatModelSize(sizeInMillions: number | null): string {
  if (sizeInMillions === null || sizeInMillions === undefined) return UNSPECIFIED;
  return `${sizeInMillions.toLocaleString()}M parameters`;
}

function formatPublishingDate(publishingDate: string | null): string {
  // `new Date(null)` is the epoch, not an invalid date, so a missing value would
  // otherwise render as "January 1, 1970".
  if (!publishingDate) return UNSPECIFIED;
  const date = new Date(publishingDate);
  if (Number.isNaN(date.getTime())) return UNSPECIFIED;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Unwraps one settled request, discarding a rejection so the panels that did load
 * still render. Each panel below has its own "failed to load" state.
 */
function valueOf<T>(result: PromiseSettledResult<T>, what: string): T | null {
  if (result.status === 'fulfilled') return result.value;
  console.error(`Error fetching ${what}:`, result.reason);
  return null;
}

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  
  const [modelDetails, setModelDetails] = useState<ModelDetails | null>(null);
  const [rankingsData, setRankingsData] = useState<ModelDetailRankings | null>(null);
  const [seriesData, setSeriesData] = useState<ModelSeriesByDefinition | null>(null);
  const [activeRoundsData, setActiveRoundsData] = useState<ModelActiveRoundsResponse | null>(null);
  // This model's row on the global board, plus whether it is scored on the SQL one.
  const [globalRanking, setGlobalRanking] = useState<ModelRanking | null>(null);
  const [sqlEligible, setSqlEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!modelId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      // Settled, not all: a model that has not been ranked yet 404s on the rankings
      // endpoints, and that must not take the rest of the page down with it.
      const [details, rankings, series, activeRounds, globalBoard, globalSqlBoard] =
        await Promise.allSettled([
          getModelDetails(modelId),
          getModelRankings(modelId),
          getModelSeriesByDefinition(modelId),
          getModelActiveRounds(modelId),
          // The per-model rankings endpoint returns ELO only, so the accuracy
          // figures come from this model's row on the global boards.
          getFilteredRankings({ limit: GLOBAL_BOARD_LIMIT }),
          getFilteredRankings({ limit: GLOBAL_BOARD_LIMIT, metric: 'sql' }),
        ]);

      setModelDetails(valueOf(details, 'model details'));
      setRankingsData(valueOf(rankings, 'model rankings'));
      setSeriesData(valueOf(series, 'series by definition'));
      setActiveRoundsData(valueOf(activeRounds, 'active rounds'));

      const numericId = Number(modelId);
      const board = valueOf(globalBoard, 'global rankings');
      const sqlBoard = valueOf(globalSqlBoard, 'global SQL rankings');
      setGlobalRanking(
        board?.rankings.find((r) => r.model_id === numericId) ?? null
      );
      setSqlEligible(
        sqlBoard?.rankings.some((r) => r.model_id === numericId) ?? false
      );
      setLoading(false);
    };

    fetchData();
  }, [modelId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Rankings', href: '/' },
            { label: `Model #${modelId}`, href: `/models/${modelId}` }
          ]} 
        />

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
            <div className="text-lg text-gray-600">Loading model details...</div>
          </div>
        ) : modelDetails ? (
          <>
            <DetailsCard
              title={modelDetails.name}
              id={`Model ID: ${modelDetails.readable_id}`}
              description={modelDetails.description ?? undefined}
              fields={[
                {
                  label: 'Model Family',
                  value: modelDetails.model_family ?? UNSPECIFIED
                },
                {
                  label: 'Architecture',
                  value: modelDetails.architecture ?? UNSPECIFIED
                },
                {
                  label: 'Model Size',
                  value: formatModelSize(modelDetails.model_size)
                },
                {
                  label: 'Pretraining Data',
                  value: modelDetails.pretraining_data ?? UNSPECIFIED
                },
                {
                  label: 'Hosting',
                  value: modelDetails.hosting ?? UNSPECIFIED
                },
                {
                  label: 'Publishing Date',
                  value: formatPublishingDate(modelDetails.publishing_date)
                }
              ]}
            />
            {(modelDetails.paper_url ||
              modelDetails.repo_url ||
              modelDetails.website_url ||
              modelDetails.arxiv_id) && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Resources</h2>
                <div className="flex flex-wrap gap-2">
                  {modelDetails.paper_url && (
                    <a
                      href={modelDetails.paper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Paper ↗
                    </a>
                  )}
                  {modelDetails.repo_url && (
                    <a
                      href={modelDetails.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Repository ↗
                    </a>
                  )}
                  {modelDetails.website_url && (
                    <a
                      href={modelDetails.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Website ↗
                    </a>
                  )}
                  {modelDetails.arxiv_id && !modelDetails.paper_url && (
                    <a
                      href={`https://arxiv.org/abs/${modelDetails.arxiv_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      arXiv:{modelDetails.arxiv_id} ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
            <div className="text-lg text-gray-600">Failed to load model details.</div>
          </div>
        )}

        {!loading && (
          <ModelMetricSummary ranking={globalRanking} sqlEligible={sqlEligible} />
        )}

        {!loading && activeRoundsData && activeRoundsData.rounds.length > 0 && (
          <ModelActiveRounds rounds={activeRoundsData.rounds} />
        )}

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ranking Performance Over Time</h2>
          <p className="text-sm text-gray-600 mb-6">
            ELO score evolution across all challenges, individual challenge definitions, and frequency/horizon combinations. Forecasts are evaluated hourly; standings shown here are aggregated and reported monthly.
          </p>
          {loading ? (
            <div className="text-center">
              <div className="text-lg text-gray-600">Loading rankings...</div>
            </div>
          ) : rankingsData ? (
            <ModelPerformanceCharts definitionRankings={rankingsData.definition_rankings} />
          ) : (
            <div className="text-center">
              <div className="text-lg text-gray-600">Failed to load rankings data.</div>
            </div>
          )}
        </div>

        <div>
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
              <div className="text-lg text-gray-600">Loading series data...</div>
            </div>
          ) : seriesData ? (
            <ModelSeriesList definitions={seriesData.definitions} modelId={modelId} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
              <div className="text-lg text-gray-600">Failed to load series data.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

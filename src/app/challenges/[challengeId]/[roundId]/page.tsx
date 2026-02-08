'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import TimeSeriesChart from '@/src/components/TimeSeriesChart';
import Link from 'next/link';
import { Clock, ChevronRight, Info } from 'lucide-react';

interface RoundMetadata {
  round_id: number;
  name: string;
  description: string;
  status: string;
  context_length: number;
  horizon: string;
  start_time: string;
  end_time: string;
  registration_start: string;
  registration_end: string;
  frequency?: string;
}

interface LeaderboardEntry {
  model_id: number;
  readable_id: string;
  model_name: string;
  series_id: number;
  series_name: string;
  forecast_count: number;
  mase: number | null;
  rmse: number | null;
  is_final: boolean;
  rank: number;
}

interface ModelRow {
  model_id: number;
  readable_id: string;
  model_name: string;
  seriesRanks: Record<number, { rank: number; mase: number | null }>;
  avgRank: number;
}

export default function RoundDetail() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId;
  const [round, setRound] = useState<RoundMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const MODELS_PER_PAGE = 10;

  useEffect(() => {
    const fetchRound = async () => {
      // Handle params.roundId which can be string | string[] | undefined
      const roundIdParam = params.roundId;
      if (!roundIdParam) {
        setError('Invalid round ID: undefined');
        setLoading(false);
        return;
      }

      const roundId = Array.isArray(roundIdParam) ? roundIdParam[0] : roundIdParam;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch the round data using the rounds endpoint
        const response = await fetch(`/api/v1/rounds/${roundId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch round data');
        }
        
        const data: RoundMetadata = await response.json();
        setRound(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching round:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRound();
  }, [params.roundId]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const roundIdParam = params.roundId;
      if (!roundIdParam) return;

      const roundId = Array.isArray(roundIdParam) ? roundIdParam[0] : roundIdParam;
      
      try {
        setLeaderboardLoading(true);
        const response = await fetch(`/api/v1/rounds/${roundId}/leaderboard`);
        
        if (!response.ok) {
          console.error('Failed to fetch leaderboard');
          return;
        }
        
        const data: LeaderboardEntry[] = await response.json();
        setLeaderboard(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [params.roundId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error || 'Round not found'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Challenges', href: '/challenges' },
            { label: `Challenge #${challengeId}`, href: `/challenges/${challengeId}` },
            { label: `Round #${params.roundId || ''}`, href: `/challenges/${challengeId}/${params.roundId}` }
          ]} 
        />
        
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {round.name || `Round ${params.roundId}`}
              </h1>
              {round.description && (
                <p className="text-gray-600 mt-2">{round.description}</p>
              )}
            </div>
            {round.status && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                round.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : round.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : round.status === 'registration'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
              </span>
            )}
          </div>
        </header>

        {/* Registration Banner */}
        {round.status === 'registration' && (
          <Link 
            href="/add-model"
            className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4 block hover:bg-yellow-100 hover:border-yellow-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Registration is open — submit your forecasts by{' '}
                  <span className="font-semibold">
                    {round.registration_end 
                      ? new Date(round.registration_end).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'the registration deadline'}
                  </span>
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-yellow-600 ml-auto flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Leaderboard Section */}
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Round Leaderboard</h2>
            <p className="text-sm text-gray-500 mt-1">Model rankings per series based on MASE score</p>
          </div>
          
          {round.status === 'registration' ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" strokeWidth={1.5} />
              <p className="text-lg font-medium text-gray-600">No leaderboard data available yet</p>
              <p className="text-sm text-gray-400 mt-1">The leaderboard will be available once the round begins.</p>
            </div>
          ) : leaderboardLoading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading leaderboard...
            </div>
          ) : leaderboard.length > 0 ? (
            (() => {
              // Get unique series IDs and build a map of series_id to series_name
              const seriesIds = [...new Set(leaderboard.map(entry => entry.series_id))].sort((a, b) => a - b);
              const seriesNameMap = new Map<number, string>();
              leaderboard.forEach(entry => {
                if (!seriesNameMap.has(entry.series_id)) {
                  seriesNameMap.set(entry.series_id, entry.series_name);
                }
              });
              
              // Group data by model
              const modelMap = new Map<number, ModelRow>();
              leaderboard.forEach(entry => {
                if (!modelMap.has(entry.model_id)) {
                  modelMap.set(entry.model_id, {
                    model_id: entry.model_id,
                    readable_id: entry.readable_id,
                    model_name: entry.model_name,
                    seriesRanks: {},
                    avgRank: 0
                  });
                }
                const model = modelMap.get(entry.model_id)!;
                model.seriesRanks[entry.series_id] = { rank: entry.rank, mase: entry.mase };
              });
              
              // Calculate average rank and sort
              const modelRows = Array.from(modelMap.values()).map(model => {
                const ranks = Object.values(model.seriesRanks).map(r => r.rank);
                model.avgRank = ranks.length > 0 ? ranks.reduce((sum, r) => sum + r, 0) / ranks.length : Infinity;
                return model;
              }).sort((a, b) => a.avgRank - b.avgRank);

              // Pagination
              const totalModels = modelRows.length;
              const totalPages = Math.ceil(totalModels / MODELS_PER_PAGE);
              const startIndex = (leaderboardPage - 1) * MODELS_PER_PAGE;
              const paginatedModels = modelRows.slice(startIndex, startIndex + MODELS_PER_PAGE);

              return (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Model
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                            Avg Rank
                          </th>
                          {seriesIds.map(seriesId => (
                            <th key={seriesId} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 tracking-wider align-bottom min-w-[60px] max-w-[100px]">
                              <div className="text-xs leading-tight">
                                {(seriesNameMap.get(seriesId) || `Series ${seriesId}`).replace(/[_-]/g, ' ')}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedModels.map((model) => (
                          <tr key={model.model_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                              <Link 
                                href={`/models/${model.model_id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {model.model_name}
                            </Link>
                            <p className="text-xs text-gray-500">{model.readable_id}</p>
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                            {model.avgRank.toFixed(2)}
                          </td>
                          {seriesIds.map(seriesId => {
                            const rankData = model.seriesRanks[seriesId];
                            if (!rankData) {
                              return (
                                <td key={seriesId} className="px-3 py-3 text-center text-sm text-gray-400">
                                  -
                                </td>
                              );
                            }
                            return (
                              <td key={seriesId} className="px-3 py-3 text-center">
                                <span 
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    rankData.rank === 1 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : rankData.rank === 2
                                      ? 'bg-gray-200 text-gray-800'
                                      : rankData.rank === 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                  title={rankData.mase !== null ? `MASE: ${rankData.mase.toFixed(4)}` : 'MASE: N/A'}
                                >
                                  {rankData.rank}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(startIndex + MODELS_PER_PAGE, totalModels)} of {totalModels} models
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setLeaderboardPage(leaderboardPage - 1)}
                          disabled={leaderboardPage === 1}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            leaderboardPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage = 
                              page === 1 || 
                              page === totalPages || 
                              (page >= leaderboardPage - 1 && page <= leaderboardPage + 1);
                            
                            const showEllipsis = 
                              (page === 2 && leaderboardPage > 3) || 
                              (page === totalPages - 1 && leaderboardPage < totalPages - 2);

                            if (!showPage && !showEllipsis) return null;
                            
                            if (showEllipsis) {
                              return (
                                <span key={page} className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }

                            return (
                              <button
                                key={page}
                                onClick={() => setLeaderboardPage(page)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  leaderboardPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setLeaderboardPage(leaderboardPage + 1)}
                          disabled={leaderboardPage === totalPages}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            leaderboardPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No leaderboard data available for this round
            </div>
          )}
        </div>

        {/* Time Series Chart Section */}
        {round.status === 'registration' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Time Series Data</h2>
            </div>
            <div className="px-6 py-12 text-center text-gray-500">
              <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" strokeWidth={1.5} />
              <p className="text-lg font-medium text-gray-600">Series data not yet available</p>
              <p className="text-sm text-gray-400 mt-1">The time series will be revealed once the round starts.</p>
            </div>
          </div>
        ) : (
          <TimeSeriesChart
            challengeId={round.round_id}
            challengeName={round.name || `Round ${params.roundId}`}
            challengeDescription={round.description || undefined}
            startDate={round.start_time || undefined}
            endDate={round.end_time || undefined}
            frequency={round.frequency || undefined}
            horizon={round.horizon}
            status={round.status}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DefinitionRanking, TimeRangeRanking } from '@/src/services/modelService';

interface ModelRankingsTableProps {
  definitionRankings: DefinitionRanking[];
}

const timeRanges = [
  { key: 'rankings_7d', label: '7 Days' },
  { key: 'rankings_30d', label: '30 Days' },
  { key: 'rankings_90d', label: '90 Days' },
  { key: 'rankings_365d', label: '365 Days' },
] as const;

function RankingCell({ ranking }: { ranking?: TimeRangeRanking }) {
  if (!ranking) {
    return (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        N/A
      </td>
    );
  }

  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="space-y-1">
        <div className="font-medium">
          Rank {ranking.rank} / {ranking.total_models}
        </div>
        <div className="text-xs text-gray-600">
          Rounds: {ranking.rounds_participated}
        </div>
        <div className="text-xs text-gray-600">
          Avg MASE: {ranking.avg_mase !== null ? ranking.avg_mase.toFixed(3) : 'N/A'}
        </div>
        {ranking.stddev_mase !== null && (
          <div className="text-xs text-gray-500">
            StdDev: {ranking.stddev_mase.toFixed(3)}
          </div>
        )}
        <div className="text-xs text-gray-600 font-medium">
          ELO: {ranking.elo_score !== null && ranking.elo_score !== undefined ? ranking.elo_score.toFixed(0) : 'NaN'}
        </div>
      </div>
    </td>
  );
}

export default function ModelRankingsTable({ definitionRankings }: ModelRankingsTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  console.log('ModelRankingsTable - definitionRankings:', definitionRankings);
  console.log('ModelRankingsTable - type:', typeof definitionRankings);
  console.log('ModelRankingsTable - is array:', Array.isArray(definitionRankings));
  
  if (!definitionRankings || definitionRankings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No ranking data available for this model.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Performance by Challenge ({definitionRankings.length} challenges)
        </h3>
        <span className="text-gray-600 text-xl">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challenge Definition
                </th>
                {timeRanges.map((timeRange) => (
                  <th
                    key={timeRange.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {timeRange.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {definitionRankings.map((definition) => (
                <tr key={definition.definition_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
                    <div className="break-words">{definition.definition_name}</div>
                  </td>
                  {timeRanges.map((timeRange) => (
                    <RankingCell
                      key={timeRange.key}
                      ranking={definition[timeRange.key]}
                    />
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      href={`/challenges/${definition.definition_id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Go to Challenge
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

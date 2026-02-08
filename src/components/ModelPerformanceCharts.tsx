'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DefinitionRankingWithHistory } from '@/src/services/modelService';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ModelPerformanceChartsProps {
  definitionRankings: DefinitionRankingWithHistory[];
}

export default function ModelPerformanceCharts({ definitionRankings }: ModelPerformanceChartsProps) {
  const [expandedDefinitions, setExpandedDefinitions] = useState<Record<number, boolean>>({});

  const toggleDefinition = (definitionId: number) => {
    setExpandedDefinitions(prev => ({
      ...prev,
      [definitionId]: !prev[definitionId]
    }));
  };

  if (!definitionRankings || definitionRankings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No ranking data available for this model.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {definitionRankings.map((definition) => {
        const isExpanded = expandedDefinitions[definition.definition_id];
        const dailyRankings = definition.daily_rankings || [];
        
        // Sort rankings by date
        const sortedRankings = [...dailyRankings].sort((a, b) => 
          new Date(a.calculation_date).getTime() - new Date(b.calculation_date).getTime()
        );

        // Prepare data for Plotly
        const dates = sortedRankings.map(r => r.calculation_date);
        const eloScores = sortedRankings.map(r => r.elo_score);
        const eloUpper = sortedRankings.map(r => r.elo_ci_upper);
        const eloLower = sortedRankings.map(r => r.elo_ci_lower);
        const ranks = sortedRankings.map(r => r.rank_position);

        return (
          <div key={definition.definition_id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <button
              onClick={() => toggleDefinition(definition.definition_id)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {definition.definition_name}
                </h3>
              </div>
              <div className="flex items-center space-x-4">
                {sortedRankings.length > 0 && (
                  <>
                    <span className="text-blue-600 text-base font-semibold">ELO: {sortedRankings[sortedRankings.length - 1].elo_score.toFixed(1)}</span>
                    <span className="text-gray-700 text-base font-semibold">Rank: #{sortedRankings[sortedRankings.length - 1].rank_position}</span>
                  </>
                )}
                <Link
                  href={`/challenges/${definition.definition_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Challenge →
                </Link>
              </div>
            </button>

            {isExpanded && sortedRankings.length > 0 && (
              <div className="p-6">
                <Plot
                  data={[
                    {
                      x: dates,
                      y: eloLower,
                      fill: 'none',
                      line: { color: 'transparent' },
                      name: '95% CI Lower',
                      type: 'scatter',
                      mode: 'lines',
                      showlegend: false,
                      hoverinfo: 'skip',
                    },
                    {
                      x: dates,
                      y: eloUpper,
                      fill: 'tonexty',
                      fillcolor: 'rgba(59, 130, 246, 0.2)',
                      line: { color: 'transparent' },
                      name: '95% CI Upper',
                      type: 'scatter',
                      mode: 'lines',
                      showlegend: false,
                      hoverinfo: 'skip',
                    },
                    {
                      x: dates,
                      y: eloScores,
                      name: 'ELO Score',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: 'rgb(59, 130, 246)', width: 2 },
                      marker: { color: 'rgb(59, 130, 246)', size: 6 },
                      customdata: ranks,
                      hovertemplate: 
                        '<b>Date:</b> %{x}<br>' +
                        '<b>ELO Score:</b> %{y:.1f}<br>' +
                        '<b>Rank:</b> #%{customdata}<br>' +
                        '<extra></extra>',
                    },
                  ] as any}
                  layout={{
                    title: 'ELO Score Over Time',
                    xaxis: {
                      title: 'Date',
                      gridcolor: '#e5e7eb',
                      showgrid: true,
                    },
                    yaxis: {
                      title: 'ELO Score',
                      gridcolor: '#e5e7eb',
                      showgrid: true,
                      range: [0, Math.max(...eloUpper, ...eloScores, ...eloLower) * 1.05],
                    },
                    hovermode: 'closest',
                    showlegend: true,
                    legend: {
                      x: 0,
                      y: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                    },
                    margin: { l: 60, r: 40, t: 50, b: 60 },
                    paper_bgcolor: 'white',
                    plot_bgcolor: 'white',
                  } as any}
                  config={{
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  }}
                  style={{ width: '100%', height: '400px' }}
                />

                {/* Current stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">Current Rank</div>
                    <div className="text-lg font-semibold text-gray-900">
                      #{sortedRankings[sortedRankings.length - 1].rank_position}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">Current ELO</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {sortedRankings[sortedRankings.length - 1].elo_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">95% CI</div>
                    <div className="text-lg font-semibold text-gray-900">
                      [{sortedRankings[sortedRankings.length - 1].elo_ci_lower.toFixed(0)}, {sortedRankings[sortedRankings.length - 1].elo_ci_upper.toFixed(0)}]
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isExpanded && sortedRankings.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No ranking history available for this challenge.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


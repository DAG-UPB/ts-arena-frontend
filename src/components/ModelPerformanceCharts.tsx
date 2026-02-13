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
  const [expandedDefinitions, setExpandedDefinitions] = useState<Record<string, boolean>>({});

  const toggleDefinition = (uniqueKey: string) => {
    setExpandedDefinitions(prev => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey]
    }));
  };

  const formatFrequencyHorizon = (scopeId: string) => {
    // Remove everything after comma
    const cleanedScopeId = scopeId.split(',')[0].trim();
    
    // Split by ::
    const [frequencyPart, horizonPart] = cleanedScopeId.split('::');
    
    // Parse frequency (format: H:MM:SS)
    const [hours, minutes, seconds] = frequencyPart.split(':').map(v => parseInt(v, 10));
    let frequencyDisplay = '';
    
    if (hours > 0) {
      frequencyDisplay = `${hours}h`;
    } else if (minutes > 0) {
      frequencyDisplay = `${minutes}min`;
    } else if (seconds > 0) {
      frequencyDisplay = `${seconds}s`;
    } else {
      frequencyDisplay = 'instant';
    }
    
    return { frequency: frequencyDisplay, horizon: horizonPart?.trim() || 'N/A' };
  };

  const getChartTitle = (definition: DefinitionRankingWithHistory) => {
    if (definition.scope_type === 'global') {
      return 'Overall Ranking';
    } else if (definition.scope_type === 'definition') {
      return definition.definition_name;
    } else if (definition.scope_type === 'frequency_horizon') {
      const { frequency, horizon } = formatFrequencyHorizon(definition.scope_id);
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-900 text-lg font-semibold">Horizon: {horizon}, </span>
          <span className="text-gray-900 text-lg font-semibold">Frequency: {frequency}</span>
          <span className="text-gray-500 text-sm ml-2">({definition.scope_id})</span>
        </div>
      );
    }
    return definition.scope_type; // fallback
  };

  if (!definitionRankings || definitionRankings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No ranking data available for this model.
      </div>
    );
  }

  // Sort rankings to show global first, then definitions (alphabetically), then frequency_horizon
  const sortedRankings = [...definitionRankings].sort((a, b) => {
    // Global always comes first
    if (a.scope_type === 'global') return -1;
    if (b.scope_type === 'global') return 1;
    
    // Frequency_horizon always comes last
    if (a.scope_type === 'frequency_horizon') return 1;
    if (b.scope_type === 'frequency_horizon') return -1;
    
    // Both are definitions, sort alphabetically by name
    if (a.scope_type === 'definition' && b.scope_type === 'definition') {
      return a.definition_name.localeCompare(b.definition_name);
    }
    
    return 0;
  });

  // Group rankings by scope_type
  const groupedRankings = sortedRankings.reduce((acc, ranking) => {
    if (!acc[ranking.scope_type]) {
      acc[ranking.scope_type] = [];
    }
    acc[ranking.scope_type].push(ranking);
    return acc;
  }, {} as Record<string, DefinitionRankingWithHistory[]>);

  const renderSectionHeader = (scopeType: string) => {
    if (scopeType === 'global') return null;
    
    if (scopeType === 'definition') {
      return (
        <div className="mb-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Challenge Definitions</h3>
          <p className="text-sm text-gray-600">Rankings evaluated for each individual challenge definition.</p>
        </div>
      );
    }
    
    if (scopeType === 'frequency_horizon') {
      return (
        <div className="mb-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Frequency & Horizon Combinations</h3>
          <p className="text-sm text-gray-600">Rankings evaluated across different forecast frequency and horizon configurations.</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      {['global', 'definition', 'frequency_horizon'].map((scopeType) => {
        const rankings = groupedRankings[scopeType];
        if (!rankings || rankings.length === 0) return null;

        return (
          <div key={scopeType}>
            {renderSectionHeader(scopeType)}
            {rankings.map((definition) => {
        const uniqueKey = `${definition.scope_type}-${definition.scope_id}`;
        const isExpanded = expandedDefinitions[uniqueKey];
        const dailyRankings = definition.daily_rankings || [];
        const chartTitle = getChartTitle(definition);
        
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
          <div key={uniqueKey} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <button
              onClick={() => toggleDefinition(uniqueKey)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {chartTitle}
                </h3>
              </div>
              <div className="flex items-center space-x-4">
                {definition.scope_type === 'definition' && (
                  <Link
                    href={`/challenges/${definition.definition_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline w-32 text-right"
                  >
                    View Challenge →
                  </Link>
                )}
                {definition.scope_type !== 'definition' && (
                  <div className="w-32"></div>
                )}
                {sortedRankings.length > 0 && (
                  <>
                    <span className="text-gray-900 text-base font-semibold w-24 text-right">ELO: {sortedRankings[sortedRankings.length - 1].elo_score.toFixed(1)}</span>
                    <span className="text-blue-600 text-base font-semibold w-20 text-right">Rank: #{sortedRankings[sortedRankings.length - 1].rank_position}</span>
                  </>
                )}
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
      })}
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import type { ArenaScoreScopeHistory } from '@/src/services/modelService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { MOBILE_PLOT_CONFIG, MOBILE_PLOT_HEIGHT, MOBILE_PLOT_MARGIN } from '@/src/components/plotMobile';
import WithReason from '@/src/components/WithReason';
import { describeRank, formatInterval, formatScore } from '@/src/lib/arenaScore';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Dynamically import Plotly to avoid SSR issues. `PlotlyPlot` is the app's
// single Plotly entry point — see the note there on why it is not
// `react-plotly.js` directly.
const Plot = dynamic(() => import('@/src/components/PlotlyPlot'), { ssr: false });

interface ModelPerformanceChartsProps {
  scopes: ArenaScoreScopeHistory[];
}

export default function ModelPerformanceCharts({ scopes }: ModelPerformanceChartsProps) {
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});

  const isMobile = useIsMobile();

  const toggleScope = (uniqueKey: string) => {
    setExpandedScopes(prev => ({
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

  const getChartTitle = (scope: ArenaScoreScopeHistory) => {
    if (scope.scope_type === 'global') {
      return 'Overall Ranking';
    } else if (scope.scope_type === 'definition') {
      return scope.definition_name ?? `Challenge ${scope.definition_id ?? scope.scope_id}`;
    } else if (scope.scope_type === 'frequency_horizon' && scope.scope_id) {
      const { frequency, horizon } = formatFrequencyHorizon(scope.scope_id);
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-900 text-lg font-semibold">Horizon: {horizon}, </span>
          <span className="text-gray-900 text-lg font-semibold">Frequency: {frequency}</span>
          <span className="text-gray-500 text-sm ml-2">({scope.scope_id})</span>
        </div>
      );
    }
    return scope.scope_type; // fallback
  };

  if (!scopes || scopes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No ranking data available for this model.
      </div>
    );
  }

  // Sort scopes to show global first, then definitions (alphabetically), then frequency_horizon
  const sortedScopes = [...scopes].sort((a, b) => {
    // Global always comes first
    if (a.scope_type === 'global') return -1;
    if (b.scope_type === 'global') return 1;

    // Frequency_horizon always comes last
    if (a.scope_type === 'frequency_horizon') return 1;
    if (b.scope_type === 'frequency_horizon') return -1;

    // Both are definitions, sort alphabetically by name
    return (a.definition_name ?? '').localeCompare(b.definition_name ?? '');
  });

  // Group scopes by scope_type
  const groupedScopes = sortedScopes.reduce((acc, scope) => {
    if (!acc[scope.scope_type]) {
      acc[scope.scope_type] = [];
    }
    acc[scope.scope_type].push(scope);
    return acc;
  }, {} as Record<string, ArenaScoreScopeHistory[]>);

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
        const scopesOfType = groupedScopes[scopeType];
        if (!scopesOfType || scopesOfType.length === 0) return null;

        return (
          <div key={scopeType}>
            {renderSectionHeader(scopeType)}
            {scopesOfType.map((scope) => {
        const uniqueKey = `${scope.scope_type}-${scope.scope_id ?? ''}`;
        const isExpanded = expandedScopes[uniqueKey];
        const chartTitle = getChartTitle(scope);

        // Sort the days by date
        const days = [...scope.daily_scores].sort((a, b) =>
          new Date(a.calculation_date).getTime() - new Date(b.calculation_date).getTime()
        );
        const latest = days.length > 0 ? days[days.length - 1] : null;
        const latestRank = latest ? describeRank(latest) : null;
        const hasScores = days.some(d => d.score !== null);

        // Prepare data for Plotly
        const dates = days.map(d => d.calculation_date);
        const scores = days.map(d => d.score);
        const upper = days.map(d => d.ci_upper);
        const lower = days.map(d => d.ci_lower);
        const rankTexts = days.map(d => describeRank(d).text);

        const plotData: PlotParams['data'] = [
          {
            x: dates,
            y: lower,
            fill: 'none',
            line: { color: 'transparent' },
            name: '95 % CI lower',
            type: 'scatter',
            mode: 'lines',
            showlegend: false,
            hoverinfo: 'skip',
          },
          {
            x: dates,
            y: upper,
            fill: 'tonexty',
            fillcolor: 'rgba(59, 130, 246, 0.2)',
            line: { color: 'transparent' },
            name: '95 % CI upper',
            type: 'scatter',
            mode: 'lines',
            showlegend: false,
            hoverinfo: 'skip',
          },
          {
            x: dates,
            y: scores,
            name: 'Arena Score',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: 'rgb(59, 130, 246)', width: 2 },
            marker: { color: 'rgb(59, 130, 246)', size: 6 },
            customdata: rankTexts,
            hovertemplate:
              '<b>Date:</b> %{x}<br>' +
              '<b>Arena Score:</b> %{y:.1f}<br>' +
              '<b>Rank:</b> %{customdata}<br>' +
              '<extra></extra>',
          },
        ];

        const layout: PlotParams['layout'] = isMobile
          ? {
              // No plot title on a phone: the accordion header above already
              // names the scope, and the y-axis title names the metric, so the
              // title would only cost 50px of a 360px-tall chart.
              xaxis: {
                gridcolor: '#e5e7eb',
                showgrid: true,
                automargin: true,
                nticks: 4,
                tickangle: 0,
                tickfont: { size: 10 },
              },
              yaxis: {
                title: { text: 'Arena Score' },
                gridcolor: '#e5e7eb',
                showgrid: true,
                automargin: true,
                tickfont: { size: 10 },
              },
              hovermode: 'closest',
              // The only legend entry duplicates the y-axis title, and it sits
              // on top of the plot at (0, 1) — drop it rather than replace it.
              showlegend: false,
              dragmode: false,
              autosize: true,
              margin: MOBILE_PLOT_MARGIN,
              paper_bgcolor: 'white',
              plot_bgcolor: 'white',
            }
          : {
              title: { text: 'Arena Score Over Time' },
              xaxis: {
                title: { text: 'Date' },
                gridcolor: '#e5e7eb',
                showgrid: true,
              },
              yaxis: {
                title: { text: 'Arena Score' },
                gridcolor: '#e5e7eb',
                showgrid: true,
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
            };

        return (
          <div key={uniqueKey} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <button
              onClick={() => toggleScope(uniqueKey)}
              className="w-full px-6 py-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {chartTitle}
                </h3>
              </div>
              <div className="flex items-center space-x-4 w-full justify-between sm:w-auto sm:justify-end">
                {scope.scope_type === 'definition' && (
                  <Link
                    href={`/challenges/${scope.definition_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline sm:w-32 sm:text-right"
                  >
                    View Challenge →
                  </Link>
                )}
                {scope.scope_type !== 'definition' && (
                  <div className="hidden sm:block sm:w-32"></div>
                )}
                {latest && latestRank && (
                  <>
                    <span className="text-gray-900 text-base font-semibold sm:w-44 sm:text-right">
                      Arena Score: {latest.score === null ? '–' : formatScore(latest.score)}
                    </span>
                    {latestRank.ranked ? (
                      <span className="text-blue-600 text-base font-semibold sm:w-52 sm:text-right" title={latestRank.title}>
                        Rank: {latestRank.text}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm sm:w-52 sm:text-right" title={latestRank.title}>
                        {latestRank.text}
                      </span>
                    )}
                  </>
                )}
              </div>
            </button>

            {isExpanded && latest && latestRank && hasScores && (
              <div className="p-6">
                <Plot
                  data={plotData}
                  layout={layout}
                  config={isMobile ? MOBILE_PLOT_CONFIG : {
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  }}
                  style={{ width: '100%', height: isMobile ? MOBILE_PLOT_HEIGHT : '400px' }}
                />

                {/* Current stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">Current Rank</div>
                    <WithReason
                      reason={latestRank.title}
                      className={latestRank.ranked ? 'block text-lg font-semibold text-gray-900' : 'block text-sm text-gray-700'}
                    >
                      {latestRank.text}
                    </WithReason>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">Current Arena Score</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {latest.score === null ? '–' : formatScore(latest.score)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs">95 % CI</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatInterval(latest.ci_lower, latest.ci_upper) ?? '–'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isExpanded && !(latest && hasScores) && (
              <div className="p-6 text-center text-gray-500">
                No score history available for this ranking.
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

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import { DefinitionWithSeries, getModelSeriesForecasts } from '@/src/services/modelService';
import { ModelSeriesForecastsResponse } from '../types/challenge';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ModelSeriesListProps {
  definitions: DefinitionWithSeries[];
  modelId: string;
}

interface ExpandedSeriesData {
  loading: boolean;
  error?: string;
  data?: ModelSeriesForecastsResponse;
}

export default function ModelSeriesList({ definitions, modelId }: ModelSeriesListProps) {
  const [expandedDefinitions, setExpandedDefinitions] = useState<Set<number>>(() => {
    // Initialize with the first definition expanded
    if (definitions && definitions.length > 0) {
      return new Set([definitions[0].definition_id]);
    }
    return new Set();
  });

  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set());
  const [seriesData, setSeriesData] = useState<Map<number, ExpandedSeriesData>>(new Map());
  const [dateFilters, setDateFilters] = useState<Map<number, { startDate?: string; endDate?: string }>>(new Map());
  const [pendingDateFilters, setPendingDateFilters] = useState<Map<number, { startDate?: string; endDate?: string }>>(new Map());

  const toggleDefinition = (definitionId: number) => {
    setExpandedDefinitions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(definitionId)) {
        newSet.delete(definitionId);
      } else {
        newSet.add(definitionId);
      }
      return newSet;
    });
  };

  const fetchSeriesData = async (seriesId: number, definitionId: number, startDate?: string, endDate?: string) => {
    setSeriesData(prev => new Map(prev).set(seriesId, { loading: true }));
    
    try {
      const data = await getModelSeriesForecasts(modelId, definitionId, seriesId, startDate, endDate);
      const roundsWithForecasts = data.rounds.filter(r => r.forecast_exists && r.forecasts && r.forecasts.length > 0);
      console.log(`Series ${seriesId} (${data.series_name}):`, {
        totalRounds: data.rounds.length,
        roundsWithForecasts: roundsWithForecasts.length,
        rounds: roundsWithForecasts.map(r => ({ 
          id: r.round_id, 
          name: r.round_name, 
          points: r.forecasts?.length || 0,
          forecasts: r.forecasts
        }))
      });
      setSeriesData(prev => new Map(prev).set(seriesId, { loading: false, data }));
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      setSeriesData(prev => new Map(prev).set(seriesId, { 
        loading: false, 
        error: 'Failed to load forecast data' 
      }));
    }
  };

  const toggleSeries = async (seriesId: number, definitionId: number) => {
    const isExpanding = !expandedSeries.has(seriesId);
    
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });

    // If expanding and we don't have data yet, fetch it
    if (isExpanding && !seriesData.has(seriesId)) {
      let filters = dateFilters.get(seriesId);
      
      // Set default start date to 30 days ago if not already set
      if (!filters?.startDate) {
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        const startDateStr = defaultStartDate.toISOString().split('T')[0];
        
        filters = { ...filters, startDate: startDateStr };
        setDateFilters(prev => new Map(prev).set(seriesId, filters!));
      }
      
      await fetchSeriesData(seriesId, definitionId, filters?.startDate, filters?.endDate);
    }
  };

  const handleDateChange = (seriesId: number, type: 'start' | 'end', value: string) => {
    const currentFilters = pendingDateFilters.get(seriesId) || dateFilters.get(seriesId) || {};
    const newFilters = {
      ...currentFilters,
      [type === 'start' ? 'startDate' : 'endDate']: value
    };
    
    setPendingDateFilters(prev => new Map(prev).set(seriesId, newFilters));
  };

  const applyDateFilters = async (seriesId: number, definitionId: number) => {
    const pending = pendingDateFilters.get(seriesId);
    if (pending) {
      setDateFilters(prev => new Map(prev).set(seriesId, pending));
      setPendingDateFilters(prev => {
        const newMap = new Map(prev);
        newMap.delete(seriesId);
        return newMap;
      });
      await fetchSeriesData(seriesId, definitionId, pending.startDate, pending.endDate);
    }
  };

  const renderPlot = (seriesId: number) => {
    const data = seriesData.get(seriesId);
    const filters = dateFilters.get(seriesId);
    
    if (!data) return null;
    
    if (data.loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (data.error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="text-sm">{data.error}</p>
        </div>
      );
    }
    
    if (!data.data) return null;

    // Prepare plot data from rounds - keep colors per round but display as continuous timeline
    const traces: any[] = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    
    // Filter and sort rounds by their start time to display chronologically
    const roundsWithForecasts = data.data.rounds
      .filter(round => round.forecast_exists && round.forecasts && round.forecasts.length > 0)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    // Add ground truth trace if available
    if (data.data.ground_truth && data.data.ground_truth.length > 0) {
      traces.push({
        x: data.data.ground_truth.map(p => p.ts),
        y: data.data.ground_truth.map(p => p.value),
        type: 'scatter',
        mode: 'lines',
        name: 'Ground Truth',
        line: { width: 2, color: '#000000', dash: 'solid' },
        marker: { size: 4 },
      });
    }

    roundsWithForecasts.forEach((round, idx) => {
      const forecastPoints = round.forecasts!;
      const color = colors[idx % colors.length];
      
      // Main forecast line for this round
      traces.push({
        x: forecastPoints.map(p => p.ts),
        y: forecastPoints.map(p => p.y),
        type: 'scatter',
        mode: 'lines',
        name: round.round_name,
        line: { width: 2, color: color },
        marker: { size: 3 },
      });
    });

    if (traces.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No forecast data available for this series.
        </div>
      );
    }

    // Calculate the maximum date from all forecast data
    let maxDate: Date | undefined = undefined;
    for (const round of roundsWithForecasts) {
      if (round.forecasts) {
        for (const point of round.forecasts) {
          const pointDate = new Date(point.ts);
          if (!maxDate || pointDate > maxDate) {
            maxDate = pointDate;
          }
        }
      }
    }

    // Use calculated maxDate if endDate filter is not set
    const effectiveEndDate = filters?.endDate || (maxDate ? maxDate.toISOString().split('T')[0] : undefined);
    
    const xAxisRange = (filters?.startDate || effectiveEndDate) ? [
      filters?.startDate,
      effectiveEndDate
    ] : undefined;
    
    console.log(`X-axis range for series ${seriesId}:`, {
      from: filters?.startDate,
      to: filters?.endDate,
      effectiveEndDate,
      maxDateFromData: maxDate ? maxDate.toISOString() : null,
      range: xAxisRange
    });

    const layout: Partial<PlotParams['layout']> = {
      title: { text: data.data.series_name },
      xaxis: { 
        title: { text: 'Time' },
        type: 'date',
        range: xAxisRange,
      },
      yaxis: { 
        title: { text: 'Value' },
      },
      hovermode: 'closest',
      showlegend: true,
      legend: {
        x: 1.02,
        y: 1,
        xanchor: 'left',
        yanchor: 'top',
      },
      margin: { l: 60, r: 200, t: 60, b: 60 },
      autosize: true,
    };

    const config: PlotParams['config'] = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    };

    return (
      <div className="w-full" style={{ minHeight: '400px' }}>
        <Plot
          data={traces}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    );
  };

  if (!definitions || definitions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No series data available for this model.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => {
          if (expandedDefinitions.size === definitions.length) {
            setExpandedDefinitions(new Set());
          } else {
            setExpandedDefinitions(new Set(definitions.map(d => d.definition_id)));
          }
        }}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Series by Challenge Definition ({definitions.length} definitions)
        </h3>
        <span className="text-gray-600 text-xl">
          {expandedDefinitions.size === definitions.length ? '−' : '+'}
        </span>
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Challenge Definition
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Series Count
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Rounds
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {definitions.map((definition) => {
              const isExpanded = expandedDefinitions.has(definition.definition_id);
              const totalRounds = definition.series.reduce((sum, s) => sum + s.rounds_participated, 0);

              return (
                <React.Fragment key={definition.definition_id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
                      <div className="break-words">{definition.definition_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {definition.series.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {totalRounds}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleDefinition(definition.definition_id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {isExpanded ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  
                  {isExpanded && definition.series.map((series) => {
                    const isSeriesExpanded = expandedSeries.has(series.series_id);
                    
                    return (
                      <React.Fragment key={series.series_id}>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900 pl-12">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">└─</span>
                              <button
                                onClick={() => toggleSeries(series.series_id, definition.definition_id)}
                                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                              >
                                {isSeriesExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                                <div className="text-left">
                                  <div className="font-medium">{series.series_name}</div>
                                </div>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            —
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            {series.rounds_participated}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleSeries(series.series_id, definition.definition_id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {isSeriesExpanded ? 'Hide Plot' : 'Show Plot'}
                            </button>
                          </td>
                        </tr>
                        
                        {isSeriesExpanded && (
                          <tr className="bg-white">
                            <td colSpan={5} className="px-6 py-6">
                              <div className="flex flex-col w-full">
                                <div className="flex justify-end mb-3 gap-3">
                                  <label className="flex items-center text-xs text-gray-500 gap-1.5">
                                    <span className="font-medium">From:</span>
                                    <input 
                                      type="date" 
                                      value={(pendingDateFilters.get(series.series_id) || dateFilters.get(series.series_id))?.startDate || ''}
                                      onChange={(e) => handleDateChange(series.series_id, 'start', e.target.value)}
                                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-600 hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" 
                                    />
                                  </label>
                                  <label className="flex items-center text-xs text-gray-500 gap-1.5">
                                    <span className="font-medium">To:</span>
                                    <input 
                                      type="date" 
                                      value={(pendingDateFilters.get(series.series_id) || dateFilters.get(series.series_id))?.endDate || ''}
                                      onChange={(e) => handleDateChange(series.series_id, 'end', e.target.value)}
                                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-600 hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" 
                                    />
                                  </label>
                                  <button
                                    onClick={() => applyDateFilters(series.series_id, definition.definition_id)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={!pendingDateFilters.has(series.series_id)}
                                  >
                                    Filter
                                  </button>
                                </div>
                                {renderPlot(series.series_id)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

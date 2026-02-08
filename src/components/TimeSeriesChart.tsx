'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PlotParams } from 'react-plotly.js';
import type { ForecastsResponse, ForecastData, Model } from '@/src/types/challenge';
import { getChallengeSeries, getSeriesData, getSeriesForecasts, getRoundModels } from '@/src/services/roundService';
import humanizeDuration from 'humanize-duration';
import { parse, toSeconds } from 'iso8601-duration';


// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Convert ISO 8601 duration to human-readable format
function formatFrequency(freq: string | undefined): string {
  if (!freq) return 'N/A';
  
  try {
    // Parse ISO 8601 duration string (e.g., "PT3M" for 3 minutes)
    const duration = parse(freq);
    
    // Convert to seconds, then to milliseconds
    const seconds = toSeconds(duration);
    const milliseconds = seconds * 1000;
    
    // Use humanize-duration to format
    return humanizeDuration(milliseconds, { 
      largest: 2, 
      round: true,
      conjunction: ' and ',
      serialComma: false
    });
  } catch (error) {
    // If parsing fails, return the original string
    console.warn(`Failed to parse frequency "${freq}":`, error);
    return freq;
  }
}

interface SeriesDataItem {
  contextData: any[];
  testData: any[];
  series_id: number;
  series_name: string;
  forecasts?: ForecastsResponse;
  forecastsLoading?: boolean;
  forecastsError?: string;
}

interface TimeSeriesChartProps {
  challengeId: number;
  challengeName: string;
  challengeDescription?: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  horizon?: string;
  seriesId?: number;
  on_title_page?: boolean;
  definitionId?: number;
  status?: string;
}

export default function TimeSeriesChart({ challengeId, challengeName, challengeDescription, startDate, endDate, frequency, horizon, seriesId, on_title_page = false, definitionId, status }: TimeSeriesChartProps) {
  const [seriesData, setSeriesData] = useState<SeriesDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set());
  
  // Forecast filter state
  const [maxSizeFilter, setMaxSizeFilter] = useState<string>('');
  const [architectureFilter, setArchitectureFilter] = useState<string>('');
  const [modelSearchFilter, setModelSearchFilter] = useState<string>('');
  
  // Models data
  const [models, setModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Function to load data and forecasts for a specific series
  const loadForecastsForSeries = useCallback(async (seriesId: number) => {
    // Check if data is already loaded or loading
    setSeriesData(prev => {
      const series = prev.find(s => s.series_id === seriesId);
      if (!series || (series.forecasts && series.contextData?.length > 0)) {
        return prev;
      }
      
      // Mark as loading
      return prev.map(s => 
        s.series_id === seriesId 
          ? { ...s, forecastsLoading: true, forecastsError: undefined }
          : s
      );
    });

    try {
      // Get the series metadata to fetch context and test data
      const series = await getChallengeSeries(challengeId);
      const currentSeries = series.find(s => s.series_id === seriesId);
      
      if (!currentSeries) {
        throw new Error(`Series ${seriesId} not found`);
      }

      const startTime = currentSeries.context_start_time;
      const endTimeContext = currentSeries.context_end_time;
      const endTimeTest = currentSeries.end_time;

      if (!startTime || !endTimeContext || !endTimeTest) {
        throw new Error(`Missing time range for series ${seriesId}`);
      }

      // Load context data, test data, and forecasts in parallel
      const [dataContext, dataTest, forecasts] = await Promise.all([
        getSeriesData(challengeId, seriesId, startTime, endTimeContext),
        getSeriesData(challengeId, seriesId, endTimeContext, endTimeTest),
        getSeriesForecasts(challengeId, seriesId)
      ]);

      const modelCount = forecasts?.forecasts ? Object.keys(forecasts.forecasts).length : 0;
      console.log(`✓ Loaded ${dataContext.data?.length || 0} context data points for series ${seriesId}`);
      console.log(`✓ Loaded ${dataTest.data?.length || 0} test data points for series ${seriesId}`);
      console.log(`✓ Loaded ${modelCount} forecast models for series ${seriesId}`);
      
      // Update with loaded data and forecasts
      setSeriesData(prev => prev.map(s => 
        s.series_id === seriesId 
          ? { 
              ...s, 
              contextData: dataContext.data,
              testData: dataTest.data,
              forecasts, 
              forecastsLoading: false 
            }
          : s
      ));
    } catch (err) {
      console.error(`Failed to fetch data for series ${seriesId}:`, err);
      setSeriesData(prev => prev.map(s => 
        s.series_id === seriesId 
          ? { ...s, forecastsLoading: false, forecastsError: 'Failed to load data' }
          : s
      ));
    }
  }, [challengeId]);

  const toggleSeries = (seriesId: number) => {
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
        // Load forecasts when expanding
        loadForecastsForSeries(seriesId);
      }
      return newSet;
    });
  };

  // Fetch models for the challenge
  useEffect(() => {
    async function fetchModels() {
      try {
        setModelsLoading(true);
        const modelsData = await getRoundModels(challengeId);
        
        // API returns models as a direct array
        const modelsList = Array.isArray(modelsData) ? modelsData : [];
        setModels(modelsList);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModels([]);
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, [challengeId]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all series for this challenge
        const series = await getChallengeSeries(challengeId);
        console.log(`Fetched ${series.length} series for challenge ${challengeId}`);
        
        // Filter by seriesId if provided
        const filteredSeries = seriesId 
          ? series.filter(s => s.series_id === seriesId)
          : series;
        
        if (seriesId && filteredSeries.length === 0) {
          console.warn(`Series ${seriesId} not found in challenge ${challengeId}`);
        }
        
        // Create series items with metadata only (data will be loaded on demand)
        const validData = filteredSeries.map((s) => ({
          contextData: [],
          testData: [],
          series_id: s.series_id,
          series_name: s.name,
          forecasts: undefined,
          forecastsLoading: false,
          forecastsError: undefined
        } as SeriesDataItem));
        
        setSeriesData(validData);
        
        // Expand the first series by default and load its data
        if (validData.length > 0) {
          const firstSeriesId = validData[0].series_id;
          setExpandedSeries(new Set([firstSeriesId]));
          // Load data and forecasts for the first series
          loadForecastsForSeries(firstSeriesId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load time series data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [challengeId, loadForecastsForSeries, seriesId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-semibold">Error loading time series data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (seriesData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No time series data available for this challenge.
      </div>
    );
  }

  // Filter forecasts based on user input by matching with models
  const filterForecasts = (forecasts: Record<string, ForecastData>) => {
    
    const filtered = Object.entries(forecasts).filter(([modelName, forecastData]) => {
      // Find the matching model from the models list
      const model = models.find(m => {
        const match1 = m.name === modelName;
        const match2 = m.readable_id === forecastData.model_id;
        const match3 = m.readable_id === modelName;
        return match1 || match2 || match3;
      });
      
      if (!model) {
        console.log('  ❌ NO MODEL FOUND');
        return false;
      }
      
      // Filter by max_size - use model data if available
      if (maxSizeFilter) {
        const filterValue = parseFloat(maxSizeFilter);
        if (!isNaN(filterValue)) {
          if (model.model_size !== undefined && model.model_size > filterValue) {
            return false;
          }
        }
      }
      
      // Filter by architecture - use model data if available
      if (architectureFilter) {
        if (model.architecture) {
          if (!model.architecture.toLowerCase().includes(architectureFilter.toLowerCase())) {
            return false;
          }
        } else {
          return false;
        }
      }
      
      // Filter by model name/ID search
      if (modelSearchFilter) {
        const searchLower = modelSearchFilter.toLowerCase();
        const modelIdMatch = model.readable_id?.toLowerCase() === searchLower;
        const modelNameMatch = model.name?.toLowerCase().includes(searchLower);
        if (!modelIdMatch && !modelNameMatch) {
          return false;
        }
      }
      
      return true;
    }).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, ForecastData>);
    return filtered;
  };

  // Get unique architectures and max sizes for filter options from models data
  const getFilterOptions = () => {
    const architectures = new Set<string>();
    const maxSizes = new Set<number>();
    
    models.forEach(model => {
      if (model.architecture) architectures.add(model.architecture);
      if (model.model_size !== undefined) maxSizes.add(model.model_size);
    });
    
    return {
      architectures: Array.from(architectures).sort(),
      maxSizes: Array.from(maxSizes).sort((a, b) => a - b)
    };
  };

  const filterOptions = getFilterOptions();

  const config: PlotParams['config'] = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        {on_title_page && definitionId ? (
          <Link href={`/challenges/${definitionId}/${challengeId}`}>
            <h2 className="text-xl font-semibold mb-4 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
              {challengeName}
            </h2>
          </Link>
        ) : (
          <h2 className="text-xl font-semibold mb-4">{challengeName}</h2>
        )}
        {!on_title_page && (
          <>
            {challengeDescription && (
              <p className="text-sm text-gray-600 mb-4 italic">{challengeDescription}</p>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-auto">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <p className={`text-sm font-semibold uppercase ${
                status === 'active'
                  ? 'text-green-600'
                  : status === 'completed'
                  ? 'text-blue-600'
                  : status === 'registration'
                  ? 'text-yellow-600'
                  : 'text-gray-600'
              }`}>
                {status || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">ID</p>
              <p className="text-sm font-semibold text-gray-900">{challengeId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Series</p>
              <p className="text-sm font-semibold text-gray-900">{seriesData.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Models</p>
              <p className="text-sm font-semibold text-gray-900">
                {seriesData.length > 0 && seriesData[0].forecasts?.forecasts 
                  ? Object.keys(seriesData[0].forecasts.forecasts).length 
                  : 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Context</p>
              <p className="text-sm font-semibold text-gray-900">
                {seriesData.length > 0 && seriesData[0].contextData?.length 
                  ? seriesData[0].contextData.length 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatFrequency(frequency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Horizon</p>
              <p className="text-sm font-semibold text-gray-900">
                {horizon || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Start</p>
              <p className="text-sm font-semibold text-gray-900">
                {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">End</p>
              <p className="text-sm font-semibold text-gray-900">
                {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
          </>
        )}
        
        {/* Forecast Filters */}
        {!on_title_page && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Forecasts</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Model Search */}
              <div>
                <label htmlFor="model-search" className="block text-xs font-medium text-gray-700 mb-1">
                  Model Name/ID Search
                </label>
                <input
                  id="model-search"
                  type="text"
                  placeholder="Search by name or ID..."
                  value={modelSearchFilter}
                  onChange={(e) => setModelSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Max Size Filter */}
              <div>
                <label htmlFor="max-size" className="block text-xs font-medium text-gray-700 mb-1">
                  Max Size (parameters)
                </label>
                <input
                  id="max-size"
                  type="number"
                  placeholder="Max parameters..."
                  value={maxSizeFilter}
                  onChange={(e) => setMaxSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filterOptions.maxSizes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {filterOptions.maxSizes.join(', ')}
                  </p>
                )}
              </div>
              
              {/* Architecture Filter */}
              <div>
                <label htmlFor="architecture" className="block text-xs font-medium text-gray-700 mb-1">
                  Architecture
                </label>
                <select
                  id="architecture"
                  value={architectureFilter}
                  onChange={(e) => setArchitectureFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All architectures</option>
                  {filterOptions.architectures.map((arch) => (
                    <option key={arch} value={arch}>{arch}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {(maxSizeFilter || architectureFilter || modelSearchFilter) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setMaxSizeFilter('');
                    setArchitectureFilter('');
                    setModelSearchFilter('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      <div className="space-y-6">{seriesData.map((series: any) => {
          // Prepare traces for context and test data
          const traces: any[] = [];
          
          // Context data trace (solid colored line)
          if (series.contextData && series.contextData.length > 0) {
            traces.push({
              x: series.contextData.map((d: any) => d.ts),
              y: series.contextData.map((d: any) => d.value),
              type: 'scatter',
              mode: 'lines',
              name: 'Historical Data',
              line: { width: 2, color: '#2563eb' },
              marker: { size: 4 },
              legendgroup: 'actual',
              legendgrouptitle: { text: 'Actual Data' },
            });
          }
          
          // Test data trace (grey dotted line)
          if (series.testData && series.testData.length > 0) {
            traces.push({
              x: series.testData.map((d: any) => d.ts),
              y: series.testData.map((d: any) => d.value),
              type: 'scatter',
              mode: 'lines',
              name: `Actual ${series.series_name || series.series_id}`,
              line: { width: 2, color: '#6b7280', dash: 'dot' },
              legendgroup: 'actual',
            });
          }

          // Add forecast traces for each model
          if (series.forecasts?.forecasts) {
            const colors = ['#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04'];
            
            // Get the last context data point to connect forecasts
            const lastActualPoint = series.contextData && series.contextData.length > 0 
              ? series.contextData[series.contextData.length - 1] 
              : null;
            
            // Apply filters to forecasts
            const filteredForecasts = filterForecasts(series.forecasts.forecasts);
            
            // Sort models by MASE (ascending - best first)
            const modelEntries = Object.entries(filteredForecasts)
              .map(([modelName, forecastData]: [string, ForecastData]) => ({
                modelName,
                forecastData,
                label: forecastData?.label,
                mase: forecastData?.current_mase
              }))
              .sort((a, b) => {
                // Handle undefined/null MASE values - put them at the end
                if (a.mase === undefined || a.mase === null) return 1;
                if (b.mase === undefined || b.mase === null) return -1;
                return a.mase - b.mase;
              });
            
            let visibleForecastCount = 0;
            
            modelEntries.forEach(({ modelName, forecastData, label, mase }, idx) => {
              const dataArray = forecastData?.data;
              if (Array.isArray(dataArray) && dataArray.length > 0 && lastActualPoint) {
                const displayName = mase !== undefined && mase !== null 
                  ? `${label} (MASE: ${typeof mase === 'number' ? mase.toFixed(3) : mase})`
                  : label;
                
                // Prepend the last actual point to connect the forecast line
                const connectedX = [lastActualPoint.ts, ...dataArray.map((d: any) => d.ts)];
                const connectedY = [lastActualPoint.value, ...dataArray.map((d: any) => d.y)];
                
                // Show only the best 5 forecasts by default
                const isVisible = visibleForecastCount < 3;
                visibleForecastCount++;
                
                traces.push({
                  x: connectedX,
                  y: connectedY,
                  type: 'scatter',
                  mode: 'lines',
                  name: displayName,
                  line: { width: 2, dash: 'dash', color: colors[idx % colors.length] },
                  visible: isVisible ? true : 'legendonly',
                });
              }
            });
          }

          const plotData: PlotParams['data'] = traces;

          const layout: PlotParams['layout'] = {
            title: {
              text: series.series_name || `Series ${series.series_id}`,
              font: { size: 16 },
            },
            xaxis: {
              title: { text: 'Time' },
              showgrid: true,
              type: 'date',
              domain: [0, 0.82],
            },
            yaxis: {
              title: { text: 'Value' },
              showgrid: true,
            },
            hovermode: 'closest',
            showlegend: true,
            legend: {
              orientation: 'v',
              yanchor: 'top',
              y: 1,
              xanchor: 'left',
              x: 0.85,
              font: { size: 10 },
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              bordercolor: '#E5E7EB',
              borderwidth: 1,
            },
            autosize: true,
            margin: { l: 60, r: 20, t: 60, b: 50 },
          };

          const isExpanded = expandedSeries.has(series.series_id);

          return (
            <div key={series.series_id} className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSeries(series.series_id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {series.series_name || `Series ${series.series_id}`}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {series.series_id}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {isExpanded ? 'Click to collapse' : 'Click to expand'}
                </span>
              </button>
              {isExpanded && (
                <div className="p-4 relative">
                  {series.forecastsLoading && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 mx-4 mt-4 z-10 flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <p className="text-sm text-blue-700">Loading forecasts...</p>
                    </div>
                  )}
                  {series.forecastsError && !series.forecastsLoading && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-4">
                      <p className="font-semibold">Warning</p>
                      <p className="text-sm">{series.forecastsError}</p>
                      <button
                        onClick={() => loadForecastsForSeries(series.series_id)}
                        className="mt-2 text-sm underline hover:no-underline"
                      >
                        Retry loading forecasts
                      </button>
                    </div>
                  )}
                  <Plot
                    data={plotData}
                    layout={layout}
                    config={config}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

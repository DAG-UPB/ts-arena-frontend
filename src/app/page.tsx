'use client';

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import RankingsTable from '@/src/components/RankingsTable';
import TimeSeriesChart from '@/src/components/TimeSeriesChart';
import { getFilteredRankings, getRankingFilters, ModelRanking, FilterOptions, ChallengeDefinition } from '@/src/services/modelService';
import { getDefinitionRounds } from '@/src/services/definitionService';

const DEFINITION_ID = 2;
const SERIES_ID = 62;

interface RankingsData {
  overall: ModelRanking[];
  byDefinition: Record<number, ModelRanking[]>;
  byFrequencyHorizon: Record<string, ModelRanking[]>;
}

export default function Home() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    definitions: [],
    frequency_horizons: [],
    calculation_dates: [],
  });
  const [rankingsData, setRankingsData] = useState<RankingsData>({
    overall: [],
    byDefinition: {},
    byFrequencyHorizon: {},
  });
  const [selectedCalculationDate, setSelectedCalculationDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [oldestActiveRound, setOldestActiveRound] = useState<any>(null);
  const [roundLoading, setRoundLoading] = useState(true);

  // Format calculation date for display
  const formatCalculationDateLabel = (dateStr: string, isMonthEnd: boolean) => {
    const date = new Date(dateStr);
    const monthYear = `${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
    return isMonthEnd ? monthYear : 'Recent';
  };

  // Generate dropdown options from API data
  const monthOptions = filterOptions.calculation_dates.map((item) => ({
    label: formatCalculationDateLabel(item.calculation_date, item.is_month_end),
    value: item.calculation_date,
  }));

  // Format frequency_horizon for display (e.g., "00:15:00::1 day" -> "15min / 1 day")
  const formatFrequencyHorizon = (fh: string) => {
    const parts = fh.split('::');
    if (parts.length !== 2) return fh;
    
    const [freq, horizon] = parts;
    const freqMatch = freq.match(/(\d+):(\d+):(\d+)/);
    let freqStr = freq;
    if (freqMatch) {
      const hours = parseInt(freqMatch[1]);
      const mins = parseInt(freqMatch[2]);
      if (hours > 0) {
        freqStr = `${hours}h`;
      } else if (mins > 0) {
        freqStr = `${mins}min`;
      }
    }
    
    return `${freqStr} / ${horizon}`;
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch oldest active round
  useEffect(() => {
    const fetchOldestActiveRound = async () => {
      try {
        setRoundLoading(true);
        const response = await getDefinitionRounds(DEFINITION_ID, { status: 'active' });
        
        if (response.items && response.items.length > 0) {
          // Sort by start_time to get the oldest
          const sorted = [...response.items].sort((a, b) => 
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
          setOldestActiveRound(sorted[0]);
        }
      } catch (error) {
        console.error('Error fetching active rounds:', error);
      } finally {
        setRoundLoading(false);
      }
    };

    fetchOldestActiveRound();
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // First fetch filter options
        const options = await getRankingFilters();
        setFilterOptions(options);
        
        // Set default calculation date to the first (most recent) one
        if (!selectedCalculationDate && options.calculation_dates.length > 0) {
          setSelectedCalculationDate(options.calculation_dates[0].calculation_date);
          return; // Will re-run when selectedCalculationDate is set
        }
        
        // Build base filters
        const baseFilters: any = { limit: 100 };
        // Only send calculation_date if it's a month-end date (not Recent)
        if (selectedCalculationDate) {
          const selectedDateInfo = options.calculation_dates.find(
            d => d.calculation_date === selectedCalculationDate
          );
          if (selectedDateInfo?.is_month_end) {
            baseFilters.calculation_date = selectedCalculationDate;
          }
        }
        
        // Fetch overall rankings (no definition/frequency filters)
        const overallResponse = await getFilteredRankings(baseFilters);
        
        // Fetch rankings for each definition (limit concurrency)
        const byDefinitionPromises = options.definitions.map(async (def: ChallengeDefinition) => {
          const response = await getFilteredRankings({ 
            ...baseFilters,
            definition_id: def.id,
          });
          return { id: def.id, rankings: response.rankings };
        });
        
        // Fetch rankings for each frequency/horizon (limit concurrency)
        const byFrequencyHorizonPromises = options.frequency_horizons.map(async (fh: string) => {
          const response = await getFilteredRankings({ 
            ...baseFilters,
            frequency_horizon: fh,
          });
          return { fh, rankings: response.rankings };
        });
        
        // Process in batches to avoid overwhelming the browser
        const definitionResults = await Promise.all(byDefinitionPromises);
        const frequencyHorizonResults = await Promise.all(byFrequencyHorizonPromises);
        
        const byDefinition: Record<number, ModelRanking[]> = {};
        definitionResults.forEach(({ id, rankings }) => {
          byDefinition[id] = rankings;
        });
        
        const byFrequencyHorizon: Record<string, ModelRanking[]> = {};
        frequencyHorizonResults.forEach(({ fh, rankings }) => {
          byFrequencyHorizon[fh] = rankings;
        });
        
        setRankingsData({
          overall: overallResponse.rankings,
          byDefinition,
          byFrequencyHorizon,
        });
      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedCalculationDate, isMounted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <main className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Rankings', href: '/' }]} />
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            TS-Arena Model Rankings
          </h1>
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading rankings...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Rankings', href: '/' }]} />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            TS-Arena Model Rankings
          </h1>
        </div>

        {/* Time Series Chart Section */}
        {roundLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading time series data...</span>
            </div>
          </div>
        ) : oldestActiveRound ? (
          <div className="mb-8">
            <TimeSeriesChart
              challengeId={oldestActiveRound.id}
              challengeName={oldestActiveRound.name || oldestActiveRound.round_name}
              challengeDescription={oldestActiveRound.description}
              startDate={oldestActiveRound.start_time}
              endDate={oldestActiveRound.end_time}
              frequency={oldestActiveRound.frequency}
              seriesId={SERIES_ID}
              on_title_page={true}
              definitionId={DEFINITION_ID}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500 mb-8">
            <p>No active rounds available at the moment.</p>
          </div>
        )}

        {/* Overall Rankings (Full Table) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Overall Rankings</h2>
            
            {/* Calculation Month Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Period</label>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="font-medium mb-1">Calculation Period</div>
                  <div className="text-gray-200">
                    Select a month to view rankings calculated at the end of that period. "Recent" shows the most current rankings.
                  </div>
                </div>
              </div>
              <select
                value={selectedCalculationDate}
                onChange={(e) => setSelectedCalculationDate(e.target.value)}
                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded text-gray-600 hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 cursor-pointer"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <RankingsTable rankings={rankingsData.overall} />
        </div>

        {/* Rankings by Challenge Definition */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rankings by Challenge</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterOptions.definitions.map((def) => (
              <RankingsTable
                key={def.id}
                rankings={rankingsData.byDefinition[def.id] || []}
                compact
                title={def.name}
                limit={10}
                definitionId={def.id}
              />
            ))}
          </div>
        </div>

        {/* Rankings by Frequency/Horizon */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rankings by Frequency / Horizon</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterOptions.frequency_horizons.map((fh) => (
              <RankingsTable
                key={fh}
                rankings={rankingsData.byFrequencyHorizon[fh] || []}
                compact
                title={formatFrequencyHorizon(fh)}
                limit={10}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

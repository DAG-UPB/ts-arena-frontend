'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import RankingsTable from '@/src/components/RankingsTable';
import type { ChallengeDefinition, DefinitionRound, PaginationInfo } from '@/src/types/challenge';
import { getFilteredRankings, getRankingFilters, type RankingsResponse, type FilterOptions } from '@/src/services/modelService';
import { getDefinitionRounds } from '@/src/services/definitionService';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ChallengeDefinitionDetail() {
  const params = useParams();
  const router = useRouter();
  const [definition, setDefinition] = useState<ChallengeDefinition | null>(null);
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [selectedCalculationDate, setSelectedCalculationDate] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsPage, setRankingsPage] = useState(1);
  const [roundsData, setRoundsData] = useState<Record<string, { rounds: DefinitionRound[]; pagination: PaginationInfo | null }>>({});
  const [roundsLoading, setRoundsLoading] = useState<Record<string, boolean>>({});
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({
    active: true,
    registration: true,
    completed: false,
    cancelled: false,
  });
  const [error, setError] = useState<string | null>(null);

  const ROUNDS_PER_PAGE = 10;
  const STATUSES = ['active', 'registration', 'completed', 'cancelled'];

  // Format calculation date for display
  const formatCalculationDateLabel = (dateStr: string, isMonthEnd: boolean) => {
    const date = new Date(dateStr);
    const monthYear = `${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
    return isMonthEnd ? monthYear : 'Recent';
  };

  // Generate dropdown options from API data
  const monthOptions = filterOptions?.calculation_dates.map((item) => ({
    label: formatCalculationDateLabel(item.calculation_date, item.is_month_end),
    value: item.calculation_date,
  })) || [];

  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/definitions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch challenge definitions');
        }
        
        const data: ChallengeDefinition[] = await response.json();
        const found = data.find(d => d.id === Number(params.challengeId));
        
        if (!found) {
          setError('Challenge definition not found');
        } else {
          setDefinition(found);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching challenge definition:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.challengeId) {
      fetchDefinition();
    }
  }, [params.challengeId]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const options = await getRankingFilters();
        setFilterOptions(options);
        // Set default calculation date to the first (most recent) one
        if (!selectedCalculationDate && options.calculation_dates.length > 0) {
          setSelectedCalculationDate(options.calculation_dates[0].calculation_date);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilters();
  }, []);

  // Fetch rankings for the definition
  useEffect(() => {
    const fetchRankings = async () => {
      if (!definition || !definition.id || !selectedCalculationDate) return;

      try {
        setRankingsLoading(true);
        const filters: any = { 
          definition_id: definition.id,
          limit: 100
        };
        // Only send calculation_date if it's a month-end date (not Recent)
        if (selectedCalculationDate && filterOptions) {
          const selectedDateInfo = filterOptions.calculation_dates.find(
            d => d.calculation_date === selectedCalculationDate
          );
          if (selectedDateInfo?.is_month_end) {
            filters.calculation_date = selectedCalculationDate;
          }
        }
        const rankingsData = await getFilteredRankings(filters);
        setRankings(rankingsData);
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setRankingsLoading(false);
      }
    };

    fetchRankings();
  }, [definition, selectedCalculationDate, filterOptions]);

  // Reset to page 1 when calculation date changes
  useEffect(() => {
    setRankingsPage(1);
  }, [selectedCalculationDate]);

  // Fetch rounds for the definition (per status with pagination)
  const fetchRoundsForStatus = useCallback(async (status: string, page: number = 1) => {
    if (!definition || !definition.id) return;

    const ROUNDS_PER_PAGE = 10;

    try {
      setRoundsLoading(prev => ({ ...prev, [status]: true }));
      const response = await getDefinitionRounds(definition.id, {
        page,
        pageSize: ROUNDS_PER_PAGE,
        status,
      });
      setRoundsData(prev => ({
        ...prev,
        [status]: {
          rounds: response.items,
          pagination: response.pagination,
        },
      }));
    } catch (err) {
      console.error(`Error fetching ${status} rounds:`, err);
    } finally {
      setRoundsLoading(prev => ({ ...prev, [status]: false }));
    }
  }, [definition]);

  // Initial fetch of rounds for all statuses
  useEffect(() => {
    if (!definition || !definition.id) return;
    
    STATUSES.forEach(status => {
      fetchRoundsForStatus(status, 1);
    });
  }, [definition, fetchRoundsForStatus]);

  const handlePageChange = (status: string, page: number) => {
    fetchRoundsForStatus(status, page);
  };

  // Rankings pagination calculations
  const RANKINGS_PER_PAGE = 10;
  const totalRankings = rankings?.rankings.length || 0;
  const totalRankingsPages = Math.ceil(totalRankings / RANKINGS_PER_PAGE);
  const startRankingIndex = (rankingsPage - 1) * RANKINGS_PER_PAGE;
  const endRankingIndex = startRankingIndex + RANKINGS_PER_PAGE;
  const paginatedRankings = rankings?.rankings.slice(startRankingIndex, endRankingIndex) || [];

  const toggleStatus = (status: string) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
      registration: {
        label: 'Registration',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      active: {
        label: 'Active',
        color: 'text-green-800',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      completed: {
        label: 'Completed',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-gray-800',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    };
    return configs[status] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'text-gray-800',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  // Get statuses that have data
  const statusesWithData = useMemo(() => {
    return STATUSES.filter(status => {
      const data = roundsData[status];
      return data && data.pagination && data.pagination.total_items > 0;
    });
  }, [roundsData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading challenge definition...</div>
        </div>
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error || 'Challenge definition not found'}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs 
        items={[
          { label: 'Challenges', href: '/challenges' },
          { label: `Challenge #${params.challengeId}`, href: `/challenges/${params.challengeId}` }
        ]} 
      />
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{definition.name}</h1>
              <p className="mt-1 text-sm text-gray-500">ID: {definition.id}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{definition.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Schedule ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                      {definition.schedule_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {definition.frequency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Horizon</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {definition.horizon}
                    </dd>
                  </div>
                  {(definition.next_registration_start || definition.next_registration_end) && (
                    <div className="pt-2 border-t border-gray-200">
                      <dt className="text-sm font-medium text-gray-700 mb-2">Next Registration Period</dt>
                      {definition.next_registration_start && (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="text-gray-500">Opens:</span>{' '}
                          <span className="font-medium">
                            {new Date(definition.next_registration_start).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </dd>
                      )}
                      {definition.next_registration_end && (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="text-gray-500">Closes:</span>{' '}
                          <span className="font-medium">
                            {new Date(definition.next_registration_end).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </dd>
                      )}
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Context Length</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {definition.context_length}
                    </dd>
                  </div>
                  {definition.domain && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Domain</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {definition.domain}
                      </dd>
                    </div>
                  )}
                  {definition.subdomain && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {definition.subdomain}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings Section */}
      {definition && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Model Rankings</h2>
            
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
          
          {rankingsLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              Loading rankings...
            </div>
          ) : rankings && rankings.rankings.length > 0 ? (
            <>
              <RankingsTable rankings={paginatedRankings} />
              
              {/* Rankings Pagination */}
              {totalRankingsPages > 1 && (
                <div className="mt-4 bg-white rounded-lg shadow-md px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startRankingIndex + 1} to {Math.min(endRankingIndex, totalRankings)} of {totalRankings} models
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setRankingsPage(p => Math.max(1, p - 1))}
                      disabled={rankingsPage === 1}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        rankingsPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalRankingsPages }, (_, i) => i + 1).map((page) => {
                        const showPage = 
                          page === 1 || 
                          page === totalRankingsPages || 
                          (page >= rankingsPage - 1 && page <= rankingsPage + 1);
                        
                        const showEllipsis = 
                          (page === 2 && rankingsPage > 3) || 
                          (page === totalRankingsPages - 1 && rankingsPage < totalRankingsPages - 2);

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
                            onClick={() => setRankingsPage(page)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              rankingsPage === page
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
                      onClick={() => setRankingsPage(p => Math.min(totalRankingsPages, p + 1))}
                      disabled={rankingsPage === totalRankingsPages}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        rankingsPage === totalRankingsPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No rankings available
            </div>
          )}
        </div>
      )}

      {/* Rounds Section */}
      {definition && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Challenge Rounds</h2>
            <p className="mt-1 text-sm text-gray-500">
              All rounds associated with this challenge definition, grouped by status
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {STATUSES.map((status) => {
              const statusData = roundsData[status];
              const config = getStatusConfig(status);
              const isExpanded = expandedStatuses[status];
              const isLoading = roundsLoading[status];
              const rounds = statusData?.rounds || [];
              const pagination = statusData?.pagination;
              const totalRounds = pagination?.total_items || 0;
              const currentPage = pagination?.page || 1;
              const totalPages = pagination?.total_pages || 1;

                return (
                  <div key={status} className="border-b border-gray-200 last:border-b-0">
                    {/* Status Header */}
                    <button
                      onClick={() => toggleStatus(status)}
                      className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${config.bgColor}`}
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <span className={`text-lg font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : status === 'registration'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : status === 'cancelled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}
                        </span>
                      </div>
                    </button>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        {isLoading ? (
                          <div className="px-6 py-8 flex items-center justify-center">
                            <div className="flex items-center gap-3 text-gray-500">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              <span>Loading rounds...</span>
                            </div>
                          </div>
                        ) : totalRounds === 0 ? (
                          <div className="px-6 py-8 text-center text-gray-500">
                            No rounds available for this status
                          </div>
                        ) : (
                          <>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Registration
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Start Time
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                End Time
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Context Length
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Frequency
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Horizon
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Domains
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categories
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subcategories
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {rounds.map((round, roundIndex) => {
                              return (
                              <tr key={`round-${round.id}-${roundIndex}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Link 
                                    href={`/challenges/${params.challengeId}/${round.id}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {round.name}
                                  </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                  {round.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>{new Date(round.registration_start).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}</div>
                                  <div className="text-xs text-gray-500">to</div>
                                  <div>{new Date(round.registration_end).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(round.start_time).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(round.end_time).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {round.context_length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {round.frequency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {round.horizon}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="flex flex-wrap gap-1">
                                    {round.domains && round.domains.length > 0 ? (
                                      round.domains.map((domain, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                          {domain}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="flex flex-wrap gap-1">
                                    {round.categories && round.categories.length > 0 ? (
                                      round.categories.map((category, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                          {category}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="flex flex-wrap gap-1">
                                    {round.subcategories && round.subcategories.length > 0 ? (
                                      round.subcategories.map((subcategory, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                          {subcategory}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Showing {((currentPage - 1) * ROUNDS_PER_PAGE) + 1} to {Math.min(currentPage * ROUNDS_PER_PAGE, totalRounds)} of {totalRounds} rounds
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePageChange(status, currentPage - 1)}
                                disabled={!pagination?.has_previous}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  !pagination?.has_previous
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
                                    (page >= currentPage - 1 && page <= currentPage + 1);
                                  
                                  const showEllipsis = 
                                    (page === 2 && currentPage > 3) || 
                                    (page === totalPages - 1 && currentPage < totalPages - 2);

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
                                      onClick={() => handlePageChange(status, page)}
                                      className={`px-3 py-1 rounded text-sm font-medium ${
                                        currentPage === page
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
                                onClick={() => handlePageChange(status, currentPage + 1)}
                                disabled={!pagination?.has_next}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  !pagination?.has_next
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                        </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  Column,
  ColumnDef,
  flexRender,
  SortDirection,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import type { ArenaScoreRow, ScoreMetric } from '@/src/services/modelService';
import {
  MaseExplanation,
  RankExplanation,
  ScoreExplanation,
  SqlExplanation,
} from '@/src/components/ColumnExplanations';
import LabelWithInfo from '@/src/components/LabelWithInfo';
import MetricSwitch from '@/src/components/MetricSwitch';
import TrackBadge from '@/src/components/TrackBadge';
import TrackSwitch from '@/src/components/TrackSwitch';
import WithReason from '@/src/components/WithReason';
import {
  ThirtyDayValue,
  describeRank,
  formatInterval,
  formatScore,
  isListed,
  maseThirtyDays,
  rankBounds,
  sqlThirtyDays,
} from '@/src/lib/arenaScore';
import { TRACK_STYLE, TRACK_VIEW_LABEL, TrackView, filterByTrack, isTrack } from '@/src/lib/tracks';

interface RankingTableArenaScoreProps {
  rankings: ArenaScoreRow[];
  title?: string;
  /**
   * How many rows to show while collapsed. The board still holds every model —
   * sorting and the column filters act on all of them, and a footer control
   * expands to the full list. Omit to always show everything.
   */
  limit?: number;
  definitionId?: number;
  /**
   * Which track(s) to show. 'all' (the default) is the combined board; a single
   * track keeps that track's rows and shows their rank range within the track.
   */
  trackView?: TrackView;
  /** When given, the board renders the track switch in its header. */
  onTrackViewChange?: (view: TrackView) => void;
  /** Which Arena Score `rankings` holds; only used for the switch and the empty message. */
  metric?: ScoreMetric;
  /** When given, the board renders the point / probabilistic switch in its header. */
  onMetricChange?: (metric: ScoreMetric) => void;
}

// Text search filter component
function TextSearchFilter({ column }: { column: Column<ArenaScoreRow, unknown> }) {
  const filterValue = (column.getFilterValue() as string) || '';

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-1">
      <input
        type="text"
        value={filterValue}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder="Search..."
        className="w-full px-2 py-1.5 text-base sm:text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

// Numeric max filter component
function NumberMaxFilter({ column }: { column: Column<ArenaScoreRow, unknown> }) {
  const filterValue = (column.getFilterValue() as number) || '';

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-1">
      <input
        type="number"
        value={filterValue}
        onChange={(e) => column.setFilterValue(e.target.value ? Number(e.target.value) : undefined)}
        placeholder="Max (M)..."
        className="w-full px-2 py-1.5 text-base sm:text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * Stand-in for an absent board. Callers routinely write `rankings={map[id] || []}`,
 * which mints a new empty array every render; funnelling those through one
 * constant keeps the `data` reference react-table sees stable. See the memo below.
 */
const NO_RANKINGS: ArenaScoreRow[] = [];

const RANK_PILL =
  'inline-flex items-center justify-center shrink-0 min-w-7 h-7 px-2 rounded-full bg-gray-100 text-xs font-bold';

/** Left-edge colour marking a row's track; transparent when the track is unknown. */
function trackAccent(row: ArenaScoreRow): string {
  return isTrack(row.track) ? TRACK_STYLE[row.track].accent : 'border-l-transparent';
}

/** Sort key of the rank column: best rank first, then worst. Unranked rows have none. */
function rankSortKey(row: ArenaScoreRow, trackView: TrackView): number | undefined {
  const bounds = rankBounds(row, trackView);
  return bounds ? bounds.best * 100_000 + bounds.worst : undefined;
}

function RankCell({ row, trackView }: { row: ArenaScoreRow; trackView: TrackView }) {
  const rank = describeRank(row, trackView);
  return (
    <div>
      <WithReason reason={rank.title} className={rank.ranked ? 'font-semibold text-gray-900' : 'text-gray-500'}>
        {rank.text}
      </WithReason>
      {rank.ranked && trackView !== 'all' && (
        <div className="text-xs text-gray-400" title="Rank range on the combined board of both tracks">
          {describeRank(row, 'all').text} overall
        </div>
      )}
    </div>
  );
}

function ScoreCell({ row }: { row: ArenaScoreRow }) {
  const interval = formatInterval(row.ci_lower, row.ci_upper);
  return (
    <div className="text-right">
      <span className="font-semibold">{row.score === null ? '–' : formatScore(row.score)}</span>
      {interval && (
        <div className="text-xs text-gray-500">
          <WithReason reason="95 % confidence interval">{interval}</WithReason>
        </div>
      )}
    </div>
  );
}

/** A 30-day value, or a dash whose tooltip says why there is none. */
function ThirtyDayCell({ value }: { value: ThirtyDayValue }) {
  if (value.text === null) {
    return (
      <WithReason reason={value.hint} className="text-gray-400 text-right block">
        –
      </WithReason>
    );
  }
  return <span className="text-right block">{value.text}</span>;
}

/** Label and value line of a mobile card. */
function CardLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      {children}
    </div>
  );
}

function ThirtyDayLine({ label, value }: { label: string; value: ThirtyDayValue }) {
  return (
    <CardLine label={label}>
      {value.text === null ? (
        <WithReason reason={value.hint} className="text-gray-400">
          –
          {value.short && (
            <span className="ml-1.5 text-xs text-gray-500" aria-hidden="true">
              {value.short}
            </span>
          )}
        </WithReason>
      ) : (
        <span className="text-gray-900">{value.text}</span>
      )}
    </CardLine>
  );
}

export default function RankingTableArenaScore({
  rankings,
  title,
  limit,
  definitionId,
  trackView = 'all',
  onTrackViewChange,
  metric = 'point',
  onMetricChange,
}: RankingTableArenaScoreProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = (modelId: string) => {
    router.push(`/models/${modelId}`);
  };

  // The whole board goes to react-table; `limit` cuts the *rendered* rows further
  // down, after sorting and filtering, so both act on every model rather than on
  // the first ten. Memoized so the `data` reference is stable across renders — an
  // unstable one makes react-table's auto-reset loop infinitely (freezing the page).
  // Unscored rows and the global table's low-coverage rows are dropped, and the
  // track filter runs here, before react-table, so sorting, the column filters
  // and the collapsed-row limit all act on the rows that are shown.
  const data = useMemo(() => {
    const rows = filterByTrack(rankings.filter(isListed), trackView);
    return rows.length ? rows : NO_RANKINGS;
  }, [rankings, trackView]);

  const columns = useMemo<ColumnDef<ArenaScoreRow>[]>(
    () => [
      {
        id: 'rank',
        accessorFn: (row) => rankSortKey(row, trackView),
        sortUndefined: 'last',
        sortDescFirst: false,
        header: () => (
          <LabelWithInfo label="Rank" ariaLabel="About the rank" width="w-72" align="left">
            <RankExplanation />
          </LabelWithInfo>
        ),
        cell: (info) => <RankCell row={info.row.original} trackView={trackView} />,
      },
      {
        accessorKey: 'model_name',
        header: 'Model Name',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'track',
        header: 'Track',
        cell: (info) => <TrackBadge track={info.row.original.track} />,
      },
      {
        id: 'score',
        accessorFn: (row) => row.score ?? undefined,
        sortUndefined: 'last',
        header: () => (
          <LabelWithInfo label="Arena Score" ariaLabel="About the Arena Score" width="w-72">
            <ScoreExplanation />
          </LabelWithInfo>
        ),
        cell: (info) => <ScoreCell row={info.row.original} />,
      },
      {
        id: 'mase_30d',
        accessorFn: (row) => row.mase_30d ?? undefined,
        sortUndefined: 'last',
        header: () => (
          <LabelWithInfo label="MASE (30 days)" ariaLabel="About MASE (30 days)" width="w-72">
            <MaseExplanation />
          </LabelWithInfo>
        ),
        cell: (info) => <ThirtyDayCell value={maseThirtyDays(info.row.original)} />,
      },
      {
        id: 'sql_30d',
        accessorFn: (row) => row.sql_30d ?? undefined,
        sortUndefined: 'last',
        header: () => (
          <LabelWithInfo label="SQL (30 days)" ariaLabel="About SQL (30 days)" width="w-72">
            <SqlExplanation />
          </LabelWithInfo>
        ),
        cell: (info) => <ThirtyDayCell value={sqlThirtyDays(info.row.original)} />,
      },
      {
        accessorKey: 'organization_name',
        header: 'Organization',
        cell: (info) => (info.getValue() as string | null) ?? 'N/A',
      },
      {
        accessorKey: 'architecture',
        header: 'Architecture',
        cell: (info) => (
          <span className="text-gray-700">{(info.getValue() as string) || 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'model_size',
        size: 150,
        minSize: 150,
        header: () => (
          <LabelWithInfo label="Model Size" ariaLabel="About model size">
            Model sizes are shown in million parameters
          </LabelWithInfo>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          if (!filterValue) return true;
          return value <= filterValue;
        },
        cell: (info) => {
          const size = info.getValue() as number;
          return (
            <span className="text-gray-700 text-right block">
              {size ? `${size.toLocaleString()}M` : 'N/A'}
            </span>
          );
        },
      },
    ],
    [trackView]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      sorting: [
        {
          id: 'score',
          desc: true,
        },
      ],
    },
  });

  const allRows = table.getRowModel().rows;
  const collapsible = limit !== undefined && allRows.length > limit;
  const rows = collapsible && !expanded ? allRows.slice(0, limit) : allRows;

  const getSortIcon = (isSorted: false | SortDirection) => {
    if (!isSorted) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return <span className="ml-1">{isSorted === 'asc' ? '↑' : '↓'}</span>;
  };

  const hasSwitches = Boolean(onTrackViewChange || onMetricChange);
  const hasHeader = Boolean(title || hasSwitches);

  let emptyMessage = 'No rankings found.';
  if (trackView !== 'all') {
    emptyMessage = `No ${TRACK_VIEW_LABEL[trackView]} models in this ranking.`;
  } else if (metric === 'probabilistic') {
    emptyMessage = 'No models submit quantile forecasts here yet.';
  }

  return (
    // No overflow-hidden here: the track switch's info panel has to be able to
    // extend past the card. The table scroller below clips on its own.
    <div className="bg-white rounded-lg shadow-md">
      {hasHeader && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-t-lg border-b border-gray-200 bg-gray-50 ${
            title ? 'px-6 py-4 justify-between' : 'px-4 py-2 justify-end'
          }`}
        >
          {title && (definitionId ? (
            <h3
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => router.push(`/challenges/${definitionId}`)}
            >
              {title}
            </h3>
          ) : (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          ))}
          {hasSwitches && (
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {onMetricChange && <MetricSwitch value={metric} onChange={onMetricChange} />}
              {onTrackViewChange && <TrackSwitch value={trackView} onChange={onTrackViewChange} />}
            </div>
          )}
        </div>
      )}
      {/* Card list: small screens only. The full table needs ~1200-1900px of
          horizontal room, which pushes the Arena Score (the point of the page)
          off-screen on a phone. */}
      <div className="md:hidden p-3 space-y-2">
        {rows.map((row) => {
          const model = row.original;
          const rank = describeRank(model, trackView);
          const interval = formatInterval(model.ci_lower, model.ci_upper);

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => handleRowClick(String(model.model_id))}
              className={`w-full text-left bg-white border border-gray-200 border-l-4 ${trackAccent(model)} rounded-lg shadow-sm hover:shadow-md transition-shadow p-3`}
            >
              <div className="flex items-start gap-3">
                {rank.ranked ? (
                  <WithReason reason={rank.title} className={`${RANK_PILL} text-gray-700`}>
                    {rank.text}
                  </WithReason>
                ) : (
                  <span className={`${RANK_PILL} text-gray-400`} title={rank.title} aria-hidden="true">
                    –
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-medium text-gray-900 break-words">
                  {model.model_name}
                  {!rank.ranked && (
                    <WithReason reason={rank.title} className="block text-xs font-normal text-gray-500">
                      {rank.text}
                    </WithReason>
                  )}
                  {rank.ranked && trackView !== 'all' && (
                    <span className="block text-xs font-normal text-gray-400">
                      {describeRank(model, 'all').text} overall
                    </span>
                  )}
                </span>
                <TrackBadge track={model.track} />
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <CardLine label="Arena Score">
                  <span className="text-gray-900 font-semibold">
                    {model.score === null ? '–' : formatScore(model.score)}
                    {interval && (
                      <WithReason reason="95 % confidence interval" className="ml-1.5 text-xs font-normal text-gray-500">
                        {interval}
                      </WithReason>
                    )}
                  </span>
                </CardLine>
                <ThirtyDayLine label="MASE (30 days)" value={maseThirtyDays(model)} />
                <ThirtyDayLine label="SQL (30 days)" value={sqlThirtyDays(model)} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Rounded itself, since the card no longer clips its children. */}
      <div className={`hidden md:block overflow-x-auto ${hasHeader ? 'rounded-b-lg' : 'rounded-lg'}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const showTextFilter = columnId === 'model_name';
                  const showNumberMaxFilter = columnId === 'model_size';

                  return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div
                        className={`flex items-center ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-gray-700' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() &&
                          getSortIcon(header.column.getIsSorted())}
                      </div>

                      {showTextFilter && <TextSearchFilter column={header.column} />}
                      {showNumberMaxFilter && <NumberMaxFilter column={header.column} />}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(String(row.original.model_id))}
              >
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                      cellIndex === 0 ? `border-l-4 ${trackAccent(row.original)}` : ''
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allRows.length === 0 && (
        <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
      )}

      {collapsible && (
        <div className="rounded-b-lg border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setExpanded((wasExpanded) => !wasExpanded)}
            aria-expanded={expanded}
            className="flex w-full min-h-[44px] items-center justify-center gap-1.5 px-6 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
          >
            <span>
              {expanded ? `Show top ${limit}` : `Show all ${allRows.length} models`}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}

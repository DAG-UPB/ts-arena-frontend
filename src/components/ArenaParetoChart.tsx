'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import InfoPopover from '@/src/components/InfoPopover';
import MetricSwitch from '@/src/components/MetricSwitch';
import TrackSwitch from '@/src/components/TrackSwitch';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { MOBILE_PLOT_CONFIG, MOBILE_PLOT_HEIGHT, MOBILE_PLOT_MARGIN } from '@/src/components/plotMobile';
import type { ArenaScoreRow, ScoreMetric } from '@/src/services/modelService';
import { TRACK_VIEW_LABEL, type Track, type TrackView } from '@/src/lib/tracks';

const Plot = dynamic(() => import('@/src/components/PlotlyPlot'), { ssr: false });

/** Smallest size on the axis; known sizes below it, including 0, are drawn here. */
const MIN_SIZE = 0.5;
/** The y axis stops this far below the lowest front point. */
const FLOOR_MARGIN = 8;
const TICKS = [0.5, 1, 3, 10, 30, 100, 300, 1000, 3000];

const TRACK_COLOR: Record<Track, string> = { reference: '#6366f1', open: '#14b8a6' };
const TRACK_NAME: Record<Track, string> = { reference: 'Reference Track', open: 'Open Track' };
const FRONT_COLOR = '#374151';

interface Point {
  row: ArenaScoreRow;
  size: number;
  score: number;
  onFront: boolean;
}

function formatSize(millions: number): string {
  if (millions <= MIN_SIZE) return '≤0.5M';
  return millions < 1000 ? `${millions}M` : `${millions / 1000}B`;
}

/** Points no other point beats with a size at most as large and a score at least as high. */
export function paretoFront(points: { size: number; score: number }[]): boolean[] {
  return points.map((p) =>
    !points.some(
      (q) => q.size <= p.size && q.score >= p.score && (q.size < p.size || q.score > p.score)
    )
  );
}

interface ArenaParetoChartProps {
  rows: ArenaScoreRow[];
  trackView: TrackView;
  onTrackViewChange: (view: TrackView) => void;
  metric: ScoreMetric;
  onMetricChange: (metric: ScoreMetric) => void;
}

export default function ArenaParetoChart({
  rows,
  trackView,
  onTrackViewChange,
  metric,
  onMetricChange,
}: ArenaParetoChartProps) {
  const isMobile = useIsMobile();

  const { points, front, floor } = useMemo(() => {
    const shown = rows.filter(
      (r) =>
        r.rank_best != null &&
        r.score != null &&
        r.model_size != null &&
        (trackView === 'all' || r.track === trackView)
    );
    const base = shown
      .map((row) => ({ row, size: Math.max(row.model_size as number, MIN_SIZE), score: row.score as number }))
      .sort((a, b) => a.size - b.size || b.score - a.score);
    const mask = paretoFront(base);
    const points: Point[] = base.map((p, i) => ({ ...p, onFront: mask[i] }));
    const front = points.filter((p) => p.onFront);
    const floor = front.length ? Math.min(...front.map((p) => p.score)) - FLOOR_MARGIN : 0;
    return { points, front, floor };
  }, [rows, trackView]);

  const calculationDate = rows[0]?.calculation_date;

  if (points.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No ranked models with a known size in this view.
      </div>
    );
  }

  // Labels above the front; a neighbour closer than 1.8x in size goes below-right instead.
  const labelPosition = new Map<number, string>();
  let prev: Point | null = null;
  let prevAbove = false;
  for (const p of front) {
    const above: boolean = !(prevAbove && prev && p.size / prev.size < 1.8);
    const first = prev === null;
    labelPosition.set(p.row.model_id, above ? (first ? 'top right' : 'top center') : 'bottom right');
    prev = p;
    prevAbove = above;
  }

  const visible = points.filter((p) => p.score >= floor);
  const tracks: Track[] = ['reference', 'open'];
  const pointTraces: PlotParams['data'] = tracks
    .map((track) => visible.filter((p) => p.row.track === track))
    .filter((group) => group.length > 0)
    .map((group) => {
      const track = group[0].row.track;
      return {
        type: 'scatter' as const,
        mode: isMobile ? ('markers' as const) : ('text+markers' as const),
        name: TRACK_NAME[track],
        x: group.map((p) => p.size),
        y: group.map((p) => p.score),
        text: group.map((p) => (p.onFront ? p.row.model_name : '')),
        // Plotly takes a per-point array here; its types only declare a single value.
        textposition: group.map(
          (p) => labelPosition.get(p.row.model_id) ?? 'top center'
        ) as unknown as 'top center',
        textfont: { size: 11, color: '#111827' },
        customdata: group.map((p) => [
          p.row.model_name,
          formatSize(p.size),
          p.row.ci_lower?.toFixed(1) ?? '–',
          p.row.ci_upper?.toFixed(1) ?? '–',
          p.row.rank_best === p.row.rank_worst
            ? `${p.row.rank_best}`
            : `${p.row.rank_best}–${p.row.rank_worst}`,
          p.onFront ? '<br>On the Pareto front' : '',
        ]),
        hovertemplate:
          '<b>%{customdata[0]}</b><br>' +
          'Parameters: %{customdata[1]}<br>' +
          'Arena Score: %{y:.1f} (%{customdata[2]} to %{customdata[3]})<br>' +
          'Place: %{customdata[4]}%{customdata[5]}<extra></extra>',
        marker: {
          symbol: track === 'reference' ? 'circle' : 'circle-open',
          color: TRACK_COLOR[track],
          size: group.map((p) => (p.onFront ? 12 : 9)),
          opacity: group.map((p) => (p.onFront ? 1 : 0.5)),
          line: { width: track === 'reference' ? 1 : 2, color: track === 'reference' ? 'white' : TRACK_COLOR[track] },
        },
        error_y: {
          type: 'data' as const,
          symmetric: false,
          array: group.map((p) => (p.row.ci_upper ?? p.score) - p.score),
          arrayminus: group.map((p) => p.score - (p.row.ci_lower ?? p.score)),
          color: TRACK_COLOR[track],
          thickness: 1,
          width: 0,
        },
        cliponaxis: false,
      };
    });

  const sizes = points.map((p) => p.size);
  const xMax = Math.max(...sizes) * 1.8;
  const ticks = TICKS.filter((t) => t <= xMax);
  const yMax = Math.max(...visible.map((p) => p.row.ci_upper ?? p.score)) + 2;

  const data: PlotParams['data'] = [
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Pareto front',
      x: [...front.map((p) => p.size), xMax],
      y: [...front.map((p) => p.score), front[front.length - 1].score],
      line: { shape: 'hv', color: FRONT_COLOR, width: 2 },
      hoverinfo: 'skip',
    },
    ...pointTraces,
  ];

  const xaxis = {
    type: 'log' as const,
    range: [Math.log10(MIN_SIZE * 0.7), Math.log10(xMax)],
    tickvals: ticks,
    ticktext: ticks.map(formatSize),
    gridcolor: '#e5e7eb',
    zeroline: false,
  };
  const yaxis = { range: [floor, yMax], gridcolor: '#e5e7eb', zeroline: false };

  const layout: PlotParams['layout'] = isMobile
    ? {
        xaxis: { ...xaxis, automargin: true, tickfont: { size: 10 } },
        yaxis: { ...yaxis, title: { text: 'Arena Score' }, automargin: true, tickfont: { size: 10 } },
        hovermode: 'closest',
        showlegend: true,
        legend: { orientation: 'h', x: 0, y: -0.2, font: { size: 10 } },
        dragmode: false,
        autosize: true,
        margin: { ...MOBILE_PLOT_MARGIN, b: 70 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
      }
    : {
        xaxis: { ...xaxis, title: { text: 'Parameters (log scale)' } },
        yaxis: { ...yaxis, title: { text: 'Arena Score' } },
        hovermode: 'closest',
        showlegend: true,
        legend: { x: 1, xanchor: 'right', y: 0, yanchor: 'bottom', bgcolor: 'rgba(255, 255, 255, 0.8)' },
        autosize: true,
        margin: { l: 60, r: 30, t: 20, b: 55 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
      };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="relative flex items-center gap-2">
          <p className="text-sm text-gray-600">
            {TRACK_VIEW_LABEL[trackView]}, overall ranking
            {calculationDate ? `, as of ${calculationDate}` : ''}.
          </p>
          <InfoPopover ariaLabel="How to read this chart">
            <p>On the line: no smaller model scores higher.</p>
            <p>0 is the naive forecast. 1 point is about 1 % lower error.</p>
            <p>Whiskers show the 95 % interval. Where they overlap, the order is not settled.</p>
            <p>Statistical methods and models under 0.5M parameters are drawn at 0.5M.</p>
          </InfoPopover>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MetricSwitch value={metric} onChange={onMetricChange} />
          <TrackSwitch value={trackView} onChange={onTrackViewChange} />
        </div>
      </div>

      {/* Remount on a view change: Plotly.react drops the per-point labels when it updates in place. */}
      <Plot
        key={`${trackView}-${metric}-${calculationDate}`}
        data={data}
        layout={layout}
        config={isMobile ? MOBILE_PLOT_CONFIG : { responsive: true, displaylogo: false }}
        style={{ width: '100%', height: isMobile ? MOBILE_PLOT_HEIGHT : '460px' }}
        useResizeHandler
      />
    </div>
  );
}

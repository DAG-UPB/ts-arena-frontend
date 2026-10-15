'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import TrackSwitch from '@/src/components/TrackSwitch';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { MOBILE_PLOT_CONFIG, MOBILE_PLOT_HEIGHT, MOBILE_PLOT_MARGIN } from '@/src/components/plotMobile';
import { getMase30dHistory, type MaseHistory, type MaseHistoryModel } from '@/src/services/modelService';
import { TRACK_VIEW_LABEL, type TrackView } from '@/src/lib/tracks';

const Plot = dynamic(() => import('@/src/components/PlotlyPlot'), { ssr: false });

type ValueView = 'absolute' | 'relative';

const VALUE_LABEL: Record<ValueView, string> = { absolute: 'MASE', relative: 'Relative to the field' };
const VALUE_TITLE: Record<ValueView, string> = {
  absolute: 'The 30-day MASE as on the leaderboard.',
  relative: 'MASE divided by the typical model on the same tasks. Removes the season and the series mix.',
};

const HIGHLIGHTED = 5;
const BASELINE = 'seasonal-naive';
const LINE_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'];
const OTHER_COLOR = '#d1d5db';
const BASELINE_COLOR = '#4b5563';

function valueOf(view: ValueView, p: { mase_30d: number | null; mase_rel_30d: number | null }): number | null {
  return view === 'absolute' ? p.mase_30d : p.mase_rel_30d;
}

function latestOf(view: ValueView, m: MaseHistoryModel): number | null {
  return view === 'absolute' ? m.latest_mase_30d : m.latest_mase_rel_30d;
}

function isBaseline(m: MaseHistoryModel): boolean {
  return m.readable_id === BASELINE || m.model_name === BASELINE;
}

interface MaseTrendChartProps {
  frequencyHorizons: string[];
  formatFrequencyHorizon: (fh: string) => string;
  trackView: TrackView;
  onTrackViewChange: (view: TrackView) => void;
}

export default function MaseTrendChart({
  frequencyHorizons,
  formatFrequencyHorizon,
  trackView,
  onTrackViewChange,
}: MaseTrendChartProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [valueView, setValueView] = useState<ValueView>('absolute');
  const [histories, setHistories] = useState<Record<string, MaseHistory>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const scope = selected && frequencyHorizons.includes(selected) ? selected : frequencyHorizons[0] ?? null;

  // Fetch only once the section is near the viewport, so the first paint of the page does not wait on it.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !scope || histories[scope] || failed[scope]) return;
    let cancelled = false;
    getMase30dHistory(scope)
      .then((history) => {
        if (!cancelled) setHistories((h) => ({ ...h, [scope]: history }));
      })
      .catch((error) => {
        console.error('Error fetching the MASE history:', error);
        if (!cancelled) setFailed((f) => ({ ...f, [scope]: true }));
      });
    return () => {
      cancelled = true;
    };
  }, [visible, scope, histories, failed]);

  const history = scope ? histories[scope] : undefined;

  const { highlighted, others, baseline } = useMemo(() => {
    const models = (history?.models ?? []).filter((m) => trackView === 'all' || m.track === trackView);
    const baseline = models.find(isBaseline) ?? null;
    const ranked = models
      .filter((m) => !isBaseline(m) && latestOf(valueView, m) != null)
      .sort((a, b) => (latestOf(valueView, a) as number) - (latestOf(valueView, b) as number));
    const highlighted = ranked.slice(0, HIGHLIGHTED);
    const top = new Set(highlighted.map((m) => m.model_id));
    const others = models.filter((m) => !top.has(m.model_id) && m !== baseline);
    return { highlighted, others, baseline };
  }, [history, trackView, valueView]);

  const trace = (
    m: MaseHistoryModel,
    style: { color: string; width: number; dash?: 'dash' },
    legend: { show: boolean; group?: string; name?: string }
  ) => {
    const byWeek = new Map(m.points.map((p) => [p.week, p]));
    const weeks = history?.weeks ?? [];
    return {
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: legend.name ?? m.model_name,
      legendgroup: legend.group,
      showlegend: legend.show,
      x: weeks,
      y: weeks.map((w) => {
        const p = byWeek.get(w);
        return p ? valueOf(valueView, p) : null;
      }),
      customdata: weeks.map((w) => {
        const p = byWeek.get(w);
        return [m.model_name, p ? `${Math.round(p.participation_30d * 100)} %` : '–'];
      }),
      hovertemplate:
        '<b>%{customdata[0]}</b><br>30 days to %{x|%d %b %Y}<br>' +
        `${VALUE_LABEL[valueView]}: %{y:.3f}<br>Participation: %{customdata[1]}<extra></extra>`,
      line: { color: style.color, width: style.width, dash: style.dash },
      connectgaps: false,
    };
  };

  const data: PlotParams['data'] = [
    ...others.map((m, i) =>
      trace(m, { color: OTHER_COLOR, width: 1 }, { show: i === 0, group: 'others', name: 'Other models' })
    ),
    ...(baseline ? [trace(baseline, { color: BASELINE_COLOR, width: 2, dash: 'dash' }, { show: true })] : []),
    ...highlighted.map((m, i) => trace(m, { color: LINE_COLORS[i % LINE_COLORS.length], width: 2.5 }, { show: true })),
  ];

  const yaxis = {
    type: 'log' as const,
    title: { text: valueView === 'absolute' ? 'MASE (30 days, log scale)' : 'MASE relative to the field (log scale)' },
    gridcolor: '#e5e7eb',
    zeroline: false,
  };
  const referenceLine = {
    type: 'line' as const,
    xref: 'paper' as const,
    x0: 0,
    x1: 1,
    y0: 1,
    y1: 1,
    line: { color: '#9ca3af', width: 1, dash: 'dot' as const },
  };

  const layout: PlotParams['layout'] = isMobile
    ? {
        xaxis: { type: 'date', automargin: true, tickfont: { size: 10 }, gridcolor: '#e5e7eb' },
        yaxis: { ...yaxis, title: undefined, automargin: true, tickfont: { size: 10 } },
        shapes: [referenceLine],
        hovermode: 'closest',
        showlegend: true,
        legend: { orientation: 'h', x: 0, y: -0.25, font: { size: 10 } },
        dragmode: false,
        autosize: true,
        margin: { ...MOBILE_PLOT_MARGIN, b: 90 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
      }
    : {
        xaxis: { type: 'date', gridcolor: '#e5e7eb' },
        yaxis,
        shapes: [referenceLine],
        hovermode: 'closest',
        showlegend: true,
        legend: { x: 1.02, xanchor: 'left', y: 1, font: { size: 11 } },
        autosize: true,
        margin: { l: 70, r: 20, t: 20, b: 45 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
      };

  let body: React.ReactNode;
  if (!scope) {
    body = <p className="p-8 text-center text-gray-500">No scores yet.</p>;
  } else if (failed[scope]) {
    body = <p className="p-8 text-center text-gray-500">The MASE history could not be loaded. Please try again later.</p>;
  } else if (!history) {
    body = <p className="p-8 text-center text-gray-500">Loading MASE history...</p>;
  } else if (highlighted.length === 0 && !baseline) {
    body = <p className="p-8 text-center text-gray-500">No model has enough participation in this view yet.</p>;
  } else {
    body = (
      <Plot
        key={`${scope}-${valueView}-${trackView}`}
        data={data}
        layout={layout}
        config={isMobile ? MOBILE_PLOT_CONFIG : { responsive: true, displaylogo: false }}
        style={{ width: '100%', height: isMobile ? MOBILE_PLOT_HEIGHT : '440px' }}
        useResizeHandler
      />
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="mase-trend-scope" className="text-sm text-gray-600">
            Frequency / horizon
          </label>
          <select
            id="mase-trend-scope"
            value={scope ?? ''}
            onChange={(e) => setSelected(e.target.value)}
            disabled={frequencyHorizons.length === 0}
            className="px-3 py-1.5 text-base sm:text-sm bg-white border border-gray-200 rounded-md text-gray-700 hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 cursor-pointer disabled:opacity-50"
          >
            {frequencyHorizons.map((fh) => (
              <option key={fh} value={fh}>
                {formatFrequencyHorizon(fh)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label="MASE view"
            className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
          >
            {(['absolute', 'relative'] as ValueView[]).map((view) => {
              const isSelected = view === valueView;
              return (
                <button
                  key={view}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  title={VALUE_TITLE[view]}
                  onClick={() => setValueView(view)}
                  className={`inline-flex min-h-[32px] items-center rounded px-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    isSelected ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {VALUE_LABEL[view]}
                </button>
              );
            })}
          </div>
          <TrackSwitch value={trackView} onChange={onTrackViewChange} />
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">{TRACK_VIEW_LABEL[trackView]}. The five best models of the newest week are in colour.</p>

      {body}

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>
          Each point covers the rounds that ended in the 30 days before that Monday. Points one week apart
          share 23 of those days. A model shows once it has forecast at least 80 % of the tasks.
        </p>
        {valueView === 'absolute' ? (
          <p>
            Below 1 beats a seasonal naive forecast, the value one day earlier, on the history the models
            were given. All models move up and down with the season.
          </p>
        ) : (
          <p>
            1 is the typical model on the same tasks. 0.9 is 10 % lower error. The field is all models, so
            its level shifts as models join or leave.
          </p>
        )}
      </div>
    </div>
  );
}

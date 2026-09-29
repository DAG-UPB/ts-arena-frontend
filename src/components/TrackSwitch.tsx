'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Info } from 'lucide-react';
import {
  REFERENCE_MODELS_REPO_URL,
  TRACK_STYLE,
  TRACK_VIEW_LABEL,
  TrackView,
} from '@/src/lib/tracks';

const VIEWS: TrackView[] = ['all', 'reference', 'open'];

/** Short labels for the segmented control; the full names are in TRACK_VIEW_LABEL. */
const SHORT_LABEL: Record<TrackView, string> = {
  all: 'All',
  reference: 'Reference',
  open: 'Open',
};

interface TrackSwitchProps {
  value: TrackView;
  onChange: (view: TrackView) => void;
}

/** What the two tracks are, and what a single-track view does and does not mean. */
export function TrackExplanation() {
  return (
    <div className="space-y-1.5 text-gray-200">
      <p>
        <span className="font-semibold text-white">Reference Track:</span> models implemented in{' '}
        <a
          href={REFERENCE_MODELS_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          ts-arena-models
        </a>
        , run by TS-Arena on exactly the context given at registration. A fair comparison of
        models.
      </p>
      <p>
        <span className="font-semibold text-white">Open Track:</span> every other submission,
        with any method and any additional data. Shows the best achievable forecast.
      </p>
      <p>
        ELO is computed over both tracks together. A single-track view shows the same ranking,
        restricted to that track.
      </p>
    </div>
  );
}

/**
 * Segmented control choosing between the combined board and a single-track board.
 * The default view is 'all': both tracks in one table, one rank.
 */
export default function TrackSwitch({ value, onChange }: TrackSwitchProps) {
  return (
    <div className="relative flex items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Track"
        className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
      >
        {VIEWS.map((view) => {
          const selected = view === value;
          return (
            <button
              key={view}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={TRACK_VIEW_LABEL[view]}
              onClick={() => onChange(view)}
              className={`inline-flex min-h-[32px] items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                selected ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view !== 'all' && (
                <span className={`h-2 w-2 rounded-full ${TRACK_STYLE[view].dot}`} aria-hidden="true" />
              )}
              {SHORT_LABEL[view]}
            </button>
          );
        })}
      </div>
      <Popover className="group">
        {({ open }) => (
          <>
            <PopoverButton
              className="flex items-center justify-center w-11 h-11 -m-[14px] rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="About the Reference and Open Tracks"
            >
              <Info className="w-4 h-4" aria-hidden="true" />
            </PopoverButton>
            <PopoverPanel
              static
              className={`absolute right-0 top-9 w-80 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-all duration-200 z-30 normal-case font-normal tracking-normal ${
                open ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}
            >
              <TrackExplanation />
            </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  );
}

'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Info } from 'lucide-react';

interface InfoPopoverProps {
  ariaLabel: string;
  children: React.ReactNode;
}

/**
 * Info icon whose panel opens below the nearest `relative` ancestor, from its left edge.
 * Hover on a pointer, tap/keyboard on touch.
 */
export default function InfoPopover({ ariaLabel, children }: InfoPopoverProps) {
  return (
    <Popover className="group">
      {({ open }) => (
        <>
          <PopoverButton
            className="flex items-center justify-center w-11 h-11 -m-[14px] rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={ariaLabel}
          >
            <Info className="w-4 h-4" aria-hidden="true" />
          </PopoverButton>
          <PopoverPanel
            static
            className={`absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-4rem)] p-3 bg-gray-900 text-gray-200 text-xs rounded-lg shadow-lg transition-all duration-200 z-30 space-y-1 ${
              open ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}
          >
            {children}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}

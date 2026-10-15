'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Info } from 'lucide-react';

interface LabelWithInfoProps {
  label: string;
  ariaLabel: string;
  width?: string;
  /** Which edge of the icon the panel lines up with; the first column of a table opens to the right. */
  align?: 'left' | 'right';
  children: React.ReactNode;
}

/**
 * Uppercase label with an info popover. Hover on a pointer, tap/keyboard on touch.
 */
export default function LabelWithInfo({
  label,
  ariaLabel,
  width = 'w-48',
  align = 'right',
  children,
}: LabelWithInfoProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="uppercase">{label}</span>
      <Popover className="relative group" onClick={(e) => e.stopPropagation()}>
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
              className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-6 ${width} p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-all duration-200 z-10 normal-case font-normal tracking-normal ${
                open ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}
            >
              {children}
            </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  );
}

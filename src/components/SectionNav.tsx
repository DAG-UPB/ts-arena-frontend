'use client';

import { useEffect, useState } from 'react';

export interface NavSection {
  /** `id` of the element on the page this entry jumps to. */
  id: string;
  label: string;
}

interface SectionNavProps {
  /**
   * The sections, in page order. Pass a value with a stable identity (a module
   * constant, or memoized) — a fresh array each render re-subscribes the
   * observer on every render.
   */
  sections: NavSection[];
}

/**
 * In-page jump menu.
 *
 * The rankings page stacks three boards below a full-height chart, far enough
 * down that readers were not finding the per-challenge and
 * per-frequency/horizon ones at all. This lists them all above the fold.
 *
 * One component, two layouts: a rail in the left gutter from `lg` up, and a
 * strip of chips across the top below it, where there is no gutter to put a
 * rail in. Both stick while the reader scrolls the sections past them.
 */
export default function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    // Ids currently in the band, kept across callbacks: an IntersectionObserver
    // reports only what *changed*, so the full picture has to be accumulated.
    const inBand = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        });

        // Later sections win: scrolling down, the one that just arrived at the
        // top of the screen is the one the reader has moved to.
        for (let i = sections.length - 1; i >= 0; i--) {
          if (inBand.has(sections[i].id)) {
            setActiveId(sections[i].id);
            return;
          }
        }
      },
      // Squeeze the root to a band across the top fifth of the viewport, so
      // "in view" means "at the top of the screen". Against the whole viewport
      // a board as tall as these would stay active long after the next one had
      // scrolled into place.
      { rootMargin: '0px 0px -80% 0px' }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Sections on this page"
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-gray-200 bg-gray-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-0 lg:mb-0 lg:self-start lg:top-8 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
    >
      <p className="hidden lg:block pl-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        On this page
      </p>
      <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex min-h-[44px] items-center whitespace-nowrap rounded-md px-3 text-sm transition-colors lg:min-h-0 lg:whitespace-normal lg:rounded-none lg:border-l-2 lg:py-2 ${
                  isActive
                    ? 'bg-blue-50 font-medium text-blue-700 lg:bg-transparent lg:border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:border-transparent lg:hover:bg-transparent lg:hover:border-gray-300'
                }`}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

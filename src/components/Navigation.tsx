'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siGithub } from 'simple-icons/icons';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Rankings' },
    { href: '/challenges', label: 'Challenges' },
    { href: '/add-model', label: 'Add Model' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                TS-Arena
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <a
              href="https://github.com/DAG-UPB/ts-arena"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="View on GitHub"
            >
              <svg role="img" viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d={siGithub.path} />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

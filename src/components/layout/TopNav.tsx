'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MODES = [
  { href: '/search', label: '検索' },
  { href: '/io', label: 'IO分析' },
  { href: '/dependency/system', label: '依存関係分析' },
  { href: '/screen', label: '画面関係分析' },
];

/** ヘッダーのナビゲーション。現在のパスに応じてアクティブ表示する。 */
export function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dependency/system') return pathname.startsWith('/dependency');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          ◧
        </span>
        IO Flow Visualizer
      </Link>
      <nav className="nav">
        {MODES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`nav-link${isActive(m.href) ? ' active' : ''}`}
          >
            {m.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

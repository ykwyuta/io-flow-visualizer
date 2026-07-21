import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'IO Flow Visualizer',
  description: 'プログラムの処理構造をIO・依存関係・画面関係の3視点で可視化する',
};

const MODES = [
  { href: '/search', label: '検索' },
  { href: '/io', label: 'IO分析' },
  { href: '/dependency/system', label: '依存関係分析' },
  { href: '/screen', label: '画面関係分析' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #ddd' }}>
          <strong>IO Flow Visualizer</strong>
          <nav style={{ display: 'flex', gap: 12 }}>
            {MODES.map((m) => (
              <Link key={m.href} href={m.href}>
                {m.label}
              </Link>
            ))}
          </nav>
        </header>
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}

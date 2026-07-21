import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'IO Flow Visualizer',
  description: 'プログラムの処理構造をIO・依存関係・画面関係の3視点で可視化する',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <TopNav />
        <main className="main">{children}</main>
      </body>
    </html>
  );
}

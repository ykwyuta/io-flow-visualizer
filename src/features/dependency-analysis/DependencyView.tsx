import Link from 'next/link';
import { GraphView } from '@/components/graph/GraphView';
import type { DependencyGranularity } from '@/server/neo4j/queries/dependency';
import { getDependencyGraph } from '@/server/neo4j/repositories/dependency-repository';
import { DEPENDENCY_SAMPLES } from './sample';

const TABS: { g: DependencyGranularity; href: string; label: string }[] = [
  { g: 'system', href: '/dependency/system', label: 'システム' },
  { g: 'file', href: '/dependency/file', label: 'ファイル' },
  { g: 'code', href: '/dependency/code', label: 'コード（関数/クラス/メソッド/セクション）' },
];

export async function DependencyView({ granularity }: { granularity: DependencyGranularity }) {
  let data = DEPENDENCY_SAMPLES[granularity];
  let fallback = true;
  try {
    const g = await getDependencyGraph(granularity);
    if (g) {
      data = g;
      fallback = false;
    }
  } catch {
    // Neo4j 未接続などはサンプルにフォールバック
  }

  const current = TABS.find((t) => t.g === granularity);

  return (
    <div>
      <h1>依存関係分析モード — {current?.label}</h1>
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0' }}>
        {TABS.map((t) => (
          <Link
            key={t.g}
            href={t.href}
            style={{ fontWeight: t.g === granularity ? 700 : 400 }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {fallback && (
        <p style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 8, borderRadius: 6 }}>
          Neo4j に接続できないか対象データが無いため、サンプル（neo4j/seed/sample.cypher）を表示しています。
        </p>
      )}

      <GraphView data={data} direction="LR" />
    </div>
  );
}

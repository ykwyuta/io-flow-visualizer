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
      <div className="eyebrow">依存関係分析</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        {current?.label}
      </h1>
      <p className="page-subtitle">
        粒度を切り替えて依存関係を可視化します。IO 実行計画を持つノードは ↗ からドリルダウンできます。
      </p>

      <nav className="pill-nav">
        {TABS.map((t) => (
          <Link key={t.g} href={t.href} className={`pill${t.g === granularity ? ' active' : ''}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {fallback && (
        <div className="banner banner-warn">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>
            Neo4j に接続できないか対象データが無いため、サンプル（neo4j/seed/sample.cypher）を表示しています。
          </span>
        </div>
      )}

      <GraphView data={data} direction="LR" />
    </div>
  );
}

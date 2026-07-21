import Link from 'next/link';
import { PlanTreeView } from '@/components/plan/PlanTree';
import { SAMPLE_PLAN_TREE } from '@/features/io-analysis/sample';
import type { PlanTree } from '@/features/io-analysis/types';
import {
  getHandlingScreens,
  getIoPlanTree,
  listIoRootUnits,
  type HandlingScreen,
  type IoRootUnit,
} from '@/server/neo4j/repositories/io-repository';

// Neo4j を毎リクエスト参照するため静的プリレンダリングしない
export const dynamic = 'force-dynamic';

interface LoadResult {
  tree: PlanTree | null;
  units: IoRootUnit[];
  screens: HandlingScreen[];
  fallback: boolean;
}

async function load(selectedUnitId?: string): Promise<LoadResult> {
  try {
    const units = await listIoRootUnits();
    if (units.length === 0) {
      return { tree: SAMPLE_PLAN_TREE, units: [], screens: [], fallback: true };
    }
    const target = units.find((u) => u.id === selectedUnitId) ?? units[0];
    const [tree, screens] = await Promise.all([
      getIoPlanTree(target),
      getHandlingScreens(target.id),
    ]);
    return { tree: tree ?? SAMPLE_PLAN_TREE, units, screens, fallback: tree === null };
  } catch {
    // Neo4j 未接続などはサンプルにフォールバック
    return { tree: SAMPLE_PLAN_TREE, units: [], screens: [], fallback: true };
  }
}

export default async function IoAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit } = await searchParams;
  const { tree, units, screens, fallback } = await load(unit);

  const selectedId = tree?.rootUnit.id;

  return (
    <div>
      <div className="eyebrow">IO 分析</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        IO 実行計画
      </h1>
      <p className="page-subtitle">
        EXECUTES を根に CHILD で連なる IOOperation と ACCESSES 対象を、SQL の実行計画のようなツリーで描画します。
      </p>

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

      {units.length > 0 && (
        <nav className="pill-nav">
          {units.map((u) => (
            <Link
              key={u.id}
              href={`/io?unit=${encodeURIComponent(u.id)}`}
              className={`pill${u.id === selectedId ? ' active' : ''}`}
            >
              {u.name}
            </Link>
          ))}
        </nav>
      )}

      {tree && (
        <>
          {/* モード横断リンク */}
          <div className="row" style={{ gap: 16, margin: '4px 0 12px', fontSize: 13 }}>
            <Link href="/dependency/code">→ このコードを依存関係グラフで見る</Link>
            {screens.length > 0 && (
              <span className="muted">
                担当画面:{' '}
                {screens.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && '、'}
                    <Link href="/screen">{s.name}</Link>
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <PlanTreeView tree={tree} />
          </div>
        </>
      )}
    </div>
  );
}

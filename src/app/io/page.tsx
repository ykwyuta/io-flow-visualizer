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

  return (
    <div>
      <h1>IO分析モード</h1>
      <p>
        IO処理構造を実行計画ツリー（EXECUTES を根に CHILD で連なる IOOperation ＋ ACCESSES 対象）として
        描画します。
      </p>

      {fallback && (
        <p style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 8, borderRadius: 6 }}>
          Neo4j に接続できないか対象データが無いため、サンプル（neo4j/seed/sample.cypher）を表示しています。
        </p>
      )}

      {units.length > 0 && (
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0' }}>
          {units.map((u) => (
            <Link key={u.id} href={`/io?unit=${encodeURIComponent(u.id)}`}>
              {u.name}
            </Link>
          ))}
        </nav>
      )}

      {tree && (
        <>
          {/* モード横断リンク */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0', fontSize: 13 }}>
            <Link href="/dependency/code">→ このコードを依存関係グラフで見る</Link>
            {screens.length > 0 && (
              <span>
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
          <PlanTreeView tree={tree} />
        </>
      )}
    </div>
  );
}

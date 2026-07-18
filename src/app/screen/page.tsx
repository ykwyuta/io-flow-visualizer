import { GraphView } from '@/components/graph/GraphView';
import { SCREEN_SAMPLE } from '@/features/screen-analysis/sample';
import { getScreenGraph } from '@/server/neo4j/repositories/screen-repository';

export default async function ScreenAnalysisPage() {
  let data = SCREEN_SAMPLE;
  let fallback = true;
  try {
    const g = await getScreenGraph();
    if (g) {
      data = g;
      fallback = false;
    }
  } catch {
    // Neo4j 未接続などはサンプルにフォールバック
  }

  return (
    <div>
      <h1>画面関係分析モード</h1>
      <p>Screen 間の TRANSITIONS_TO（遷移のきっかけを矢印ラベルに表示）を遷移図で描画します。</p>

      {fallback && (
        <p style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 8, borderRadius: 6 }}>
          Neo4j に接続できないか対象データが無いため、サンプル（neo4j/seed/sample.cypher）を表示しています。
        </p>
      )}

      <GraphView data={data} direction="TB" />
    </div>
  );
}

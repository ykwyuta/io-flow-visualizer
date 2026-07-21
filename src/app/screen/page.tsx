import { GraphView } from '@/components/graph/GraphView';
import { SCREEN_SAMPLE } from '@/features/screen-analysis/sample';
import { getScreenGraph } from '@/server/neo4j/repositories/screen-repository';

// Neo4j を毎リクエスト参照するため静的プリレンダリングしない
export const dynamic = 'force-dynamic';

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
      <div className="eyebrow">画面関係分析</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        画面遷移
      </h1>
      <p className="page-subtitle">
        Screen 間の TRANSITIONS_TO を有向グラフで描画します（遷移のきっかけを矢印ラベルに表示）。
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

      <GraphView data={data} direction="TB" />
    </div>
  );
}

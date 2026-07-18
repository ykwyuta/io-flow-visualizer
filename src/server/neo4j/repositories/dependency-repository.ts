import 'server-only';
import type { GraphData } from '@/components/graph/types';
import { readQuery } from '@/server/neo4j/driver';
import {
  DEPENDENCY_QUERIES,
  UNITS_WITH_IO_PLAN,
  type DependencyGranularity,
} from '@/server/neo4j/queries/dependency';

interface NodeRow {
  id: string;
  label: string;
  kind: string;
}
interface EdgeRow {
  source: string;
  target: string;
  label: string;
}

/**
 * 指定粒度の依存グラフを取得する。ノードが 1 つも無ければ null。
 * code 粒度では、IO 実行計画を持つ処理単位に IO 分析モードへの横断リンク（href）を付与する。
 */
export async function getDependencyGraph(
  granularity: DependencyGranularity,
): Promise<GraphData | null> {
  const q = DEPENDENCY_QUERIES[granularity];
  const [nodeRows, edgeRows] = await Promise.all([
    readQuery<NodeRow>(q.nodes),
    readQuery<EdgeRow>(q.edges),
  ]);

  if (nodeRows.length === 0) return null;

  // code 粒度のみ: IO 実行計画を持つ処理単位 id を集める
  let ioUnitIds = new Set<string>();
  if (granularity === 'code') {
    const rows = await readQuery<{ id: string }>(UNITS_WITH_IO_PLAN);
    ioUnitIds = new Set(rows.map((r) => r.id));
  }

  return {
    nodes: nodeRows.map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      href: ioUnitIds.has(n.id) ? `/io?unit=${encodeURIComponent(n.id)}` : undefined,
    })),
    edges: edgeRows.map((e, i) => ({
      id: `${e.source}->${e.target}#${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  };
}

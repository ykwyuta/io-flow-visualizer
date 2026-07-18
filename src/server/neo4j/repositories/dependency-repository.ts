import 'server-only';
import type { GraphData } from '@/components/graph/types';
import { readQuery } from '@/server/neo4j/driver';
import {
  DEPENDENCY_QUERIES,
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

  return {
    nodes: nodeRows.map((n) => ({ id: n.id, label: n.label, kind: n.kind })),
    edges: edgeRows.map((e, i) => ({
      id: `${e.source}->${e.target}#${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  };
}

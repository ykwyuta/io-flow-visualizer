import 'server-only';
import type { GraphData } from '@/components/graph/types';
import { readQuery } from '@/server/neo4j/driver';
import { SCREEN_EDGES, SCREEN_NODES } from '@/server/neo4j/queries/screen';

interface NodeRow {
  id: string;
  label: string;
  kind: string;
}
interface EdgeRow {
  source: string;
  target: string;
  trigger: string | null;
}

/**
 * 画面遷移グラフを取得する。画面が 1 つも無ければ null。
 */
export async function getScreenGraph(): Promise<GraphData | null> {
  const [nodeRows, edgeRows] = await Promise.all([
    readQuery<NodeRow>(SCREEN_NODES),
    readQuery<EdgeRow>(SCREEN_EDGES),
  ]);

  if (nodeRows.length === 0) return null;

  return {
    nodes: nodeRows.map((n) => ({ id: n.id, label: n.label, kind: n.kind })),
    edges: edgeRows.map((e, i) => ({
      id: `${e.source}->${e.target}#${i}`,
      source: e.source,
      target: e.target,
      label: e.trigger ?? undefined,
    })),
  };
}

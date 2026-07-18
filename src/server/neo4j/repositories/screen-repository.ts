import 'server-only';
import type { GraphData } from '@/components/graph/types';
import { readQuery } from '@/server/neo4j/driver';
import { SCREEN_EDGES, SCREEN_IO_HANDLERS, SCREEN_NODES } from '@/server/neo4j/queries/screen';

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
 * IO 実行計画を持つ担当コード（HANDLED_BY）がある画面には、IO 分析モードへの横断リンク（href）を付与する。
 */
export async function getScreenGraph(): Promise<GraphData | null> {
  const [nodeRows, edgeRows, handlerRows] = await Promise.all([
    readQuery<NodeRow>(SCREEN_NODES),
    readQuery<EdgeRow>(SCREEN_EDGES),
    readQuery<{ screenId: string; handlerId: string }>(SCREEN_IO_HANDLERS),
  ]);

  if (nodeRows.length === 0) return null;

  const handlerByScreen = new Map(handlerRows.map((h) => [h.screenId, h.handlerId]));

  return {
    nodes: nodeRows.map((n) => {
      const handlerId = handlerByScreen.get(n.id);
      return {
        id: n.id,
        label: n.label,
        kind: n.kind,
        href: handlerId ? `/io?unit=${encodeURIComponent(handlerId)}` : undefined,
      };
    }),
    edges: edgeRows.map((e, i) => ({
      id: `${e.source}->${e.target}#${i}`,
      source: e.source,
      target: e.target,
      label: e.trigger ?? undefined,
    })),
  };
}

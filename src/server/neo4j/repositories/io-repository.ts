import 'server-only';
import type { AccessMode, IoOperationType, IoTargetLabel } from '@graph-model';
import type { PlanNode, PlanTree } from '@/features/io-analysis/types';
import { readQuery } from '@/server/neo4j/driver';
import {
  IO_PLAN_ACCESSES,
  IO_PLAN_EDGES,
  IO_PLAN_OPERATIONS,
  LIST_IO_ROOT_UNITS,
} from '@/server/neo4j/queries/io';

export interface IoRootUnit {
  id: string;
  kind: string;
  name: string;
}

/** IO 実行計画を持つ処理単位の一覧を取得する。 */
export async function listIoRootUnits(): Promise<IoRootUnit[]> {
  return readQuery<IoRootUnit>(LIST_IO_ROOT_UNITS);
}

interface OpRow {
  rootOpId: string;
  id: string;
  type: IoOperationType;
  label: string | null;
  estimatedRows: number | null;
  estimatedCost: number | null;
}
interface EdgeRow {
  parentId: string;
  childId: string;
  order: number;
}
interface AccessRow {
  opId: string;
  label: IoTargetLabel;
  name: string;
  mode: AccessMode;
}

/**
 * 指定した処理単位配下の実行計画ツリーを組み立てて返す。
 * データが無ければ null。
 */
export async function getIoPlanTree(
  rootUnit: IoRootUnit,
): Promise<PlanTree | null> {
  const [ops, edges, accesses] = await Promise.all([
    readQuery<OpRow>(IO_PLAN_OPERATIONS, { rootUnitId: rootUnit.id }),
    readQuery<EdgeRow>(IO_PLAN_EDGES, { rootUnitId: rootUnit.id }),
    readQuery<AccessRow>(IO_PLAN_ACCESSES, { rootUnitId: rootUnit.id }),
  ]);

  if (ops.length === 0) return null;
  const rootOpId = ops[0].rootOpId;

  // ノードを id で引けるようにする
  const nodes = new Map<string, PlanNode>();
  for (const op of ops) {
    nodes.set(op.id, {
      id: op.id,
      type: op.type,
      label: op.label ?? undefined,
      estimatedRows: op.estimatedRows ?? undefined,
      estimatedCost: op.estimatedCost ?? undefined,
      targets: [],
      children: [],
    });
  }

  // ACCESSES をノードに載せる
  for (const a of accesses) {
    nodes.get(a.opId)?.targets.push({ label: a.label, name: a.name, mode: a.mode });
  }

  // CHILD エッジで親子を組み立て（order 昇順）
  const sortedEdges = [...edges].sort((x, y) => x.order - y.order);
  for (const e of sortedEdges) {
    const parent = nodes.get(e.parentId);
    const child = nodes.get(e.childId);
    if (parent && child) parent.children.push(child);
  }

  const root = nodes.get(rootOpId);
  if (!root) return null;

  return { rootUnit, root };
}

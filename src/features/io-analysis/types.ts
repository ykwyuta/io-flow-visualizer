import type { AccessMode, IoOperationType, IoTargetLabel } from '@graph-model';

/** 実行計画ノードがアクセスする IO 対象 */
export interface PlanTarget {
  label: IoTargetLabel;
  name: string;
  mode: AccessMode;
}

/** 実行計画ツリーの 1 ノード（IOOperation に対応） */
export interface PlanNode {
  id: string;
  type: IoOperationType;
  label?: string;
  estimatedRows?: number;
  estimatedCost?: number;
  targets: PlanTarget[];
  children: PlanNode[];
}

/** 実行計画ツリー（1 つの処理単位の EXECUTES を根とする） */
export interface PlanTree {
  /** 根となる処理単位（Function / Method / Section） */
  rootUnit: { id: string; kind: string; name: string };
  root: PlanNode;
}

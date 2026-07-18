/**
 * Neo4j に登録するノードのラベルとプロパティ型定義。
 * 一次定義は docs/graph-model.md。
 */

import type { IoOperationType } from './enums/io-operations';

/** ノードラベルの一覧 */
export const NODE_LABELS = [
  // 構造・依存系
  'System',
  'File',
  'Program',
  'Section',
  'Class',
  'Method',
  'Function',
  // IO 対象系（併せて共通ラベル IOTarget を付与する）
  'Table',
  'DataFile',
  'ExternalSystem',
  'MessageQueue',
  'Session',
  // 処理系
  'IOOperation',
  // 画面系
  'Screen',
] as const;

export type NodeLabel = (typeof NODE_LABELS)[number];

/** すべてのノードが持つ共通プロパティ */
export interface BaseNode {
  id: string;
}

// --- 構造・依存系 ---

export interface SystemNode extends BaseNode {
  name: string;
}

export interface FileNode extends BaseNode {
  path: string;
  name: string;
  language?: string;
}

export interface ProgramNode extends BaseNode {
  name: string;
}

export interface SectionNode extends BaseNode {
  name: string;
}

export interface ClassNode extends BaseNode {
  name: string;
  namespace?: string;
}

export interface MethodNode extends BaseNode {
  name: string;
  signature?: string;
}

export interface FunctionNode extends BaseNode {
  name: string;
  signature?: string;
}

// --- IO 対象系（共通ラベル IOTarget を併せ持つ） ---

export interface TableNode extends BaseNode {
  name: string;
  schema?: string;
}

export interface DataFileNode extends BaseNode {
  name: string;
  path?: string;
}

export interface ExternalSystemNode extends BaseNode {
  name: string;
}

export interface MessageQueueNode extends BaseNode {
  name: string;
}

export interface SessionNode extends BaseNode {
  name: string;
}

// --- 処理系 ---

export interface IOOperationNode extends BaseNode {
  type: IoOperationType;
  label?: string;
  estimatedRows?: number;
  estimatedCost?: number;
}

// --- 画面系 ---

export interface ScreenNode extends BaseNode {
  name: string;
  route?: string;
}

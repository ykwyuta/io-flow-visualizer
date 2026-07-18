/**
 * Neo4j に登録するリレーションの型とプロパティ定義。
 * 一次定義は docs/graph-model.md。
 */

import type { AccessMode } from './enums/io-targets';

/** リレーションタイプの一覧 */
export const RELATIONSHIP_TYPES = [
  'CONTAINS', // (System)-[:CONTAINS]->(File)
  'DEFINES', // (File)-[:DEFINES]->(Program|Class|Function)
  'HAS_SECTION', // (Program)-[:HAS_SECTION]->(Section)
  'HAS_METHOD', // (Class)-[:HAS_METHOD]->(Method)
  'DEPENDS_ON', // (System)-[:DEPENDS_ON]->(System) / (File)->(File)
  'CALLS', // (Function|Method|Section)-[:CALLS]->(同種)
  'EXECUTES', // (Function|Method|Section)-[:EXECUTES]->(IOOperation)
  'CHILD', // (IOOperation)-[:CHILD]->(IOOperation)
  'ACCESSES', // (IOOperation)-[:ACCESSES]->(IOTarget)
  'TRANSITIONS_TO', // (Screen)-[:TRANSITIONS_TO]->(Screen)
  'HANDLED_BY', // (Screen)-[:HANDLED_BY]->(Function|Method)
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/** DEPENDS_ON のプロパティ */
export interface DependsOnProps {
  /** 依存の種別（import / include / call 集約 など）。任意。 */
  kind?: string;
}

/** CHILD のプロパティ（実行計画ツリーの兄弟間実行順） */
export interface ChildProps {
  order: number;
}

/** ACCESSES のプロパティ（IO 対象への入出力方向） */
export interface AccessesProps {
  mode: AccessMode;
}

/** TRANSITIONS_TO のプロパティ（画面遷移のきっかけ） */
export interface TransitionsToProps {
  trigger?: string;
}

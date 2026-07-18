/**
 * IO 演算子（IOOperation.type）の定義。
 * SQL Server の実行計画の演算子に相当する。
 * 詳細は docs/graph-model.md / docs/io-plan-model.md を参照。
 */

/** 走査・探索系 */
export const SCAN_OPERATIONS = ['scan', 'lookup', 'filter', 'loop'] as const;

/** 整形・集約系 */
export const SHAPE_OPERATIONS = ['sort', 'project', 'merge', 'aggregate'] as const;

/** 更新系 */
export const WRITE_OPERATIONS = ['insert', 'update', 'upsert', 'delete'] as const;

/** 制御系 */
export const CONTROL_OPERATIONS = ['if'] as const;

/** リソース・トランザクション制御系 */
export const RESOURCE_OPERATIONS = ['open', 'close', 'commit', 'rollback'] as const;

/** すべての IO 演算子 */
export const IO_OPERATIONS = [
  ...SCAN_OPERATIONS,
  ...SHAPE_OPERATIONS,
  ...WRITE_OPERATIONS,
  ...CONTROL_OPERATIONS,
  ...RESOURCE_OPERATIONS,
] as const;

export type IoOperationType = (typeof IO_OPERATIONS)[number];

/** 更新系かどうか（既定の ACCESSES.mode 判定などに利用） */
export function isWriteOperation(type: IoOperationType): boolean {
  return (WRITE_OPERATIONS as readonly string[]).includes(type);
}

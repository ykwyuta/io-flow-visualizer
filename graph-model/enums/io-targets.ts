/**
 * IO 対象（ACCESSES の終点）の種別定義。
 * ファイル・テーブル・外部システム・MQ・セッション。
 */

export const IO_TARGET_LABELS = [
  'Table',
  'DataFile',
  'ExternalSystem',
  'MessageQueue',
  'Session',
] as const;

export type IoTargetLabel = (typeof IO_TARGET_LABELS)[number];

/** ACCESSES の入出力方向 */
export const ACCESS_MODES = ['read', 'write'] as const;
export type AccessMode = (typeof ACCESS_MODES)[number];

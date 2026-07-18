import type { IoOperationType, IoTargetLabel } from '@graph-model';

export interface OperationMeta {
  icon: string;
  /** 演算子グループ（色分けに使用） */
  group: 'scan' | 'shape' | 'write' | 'control' | 'resource';
}

const META: Record<IoOperationType, OperationMeta> = {
  scan: { icon: '🔍', group: 'scan' },
  lookup: { icon: '🔎', group: 'scan' },
  filter: { icon: '🧹', group: 'scan' },
  loop: { icon: '🔁', group: 'scan' },
  sort: { icon: '↕️', group: 'shape' },
  project: { icon: '🧾', group: 'shape' },
  merge: { icon: '🔀', group: 'shape' },
  aggregate: { icon: 'Σ', group: 'shape' },
  insert: { icon: '➕', group: 'write' },
  update: { icon: '✏️', group: 'write' },
  upsert: { icon: '⤴️', group: 'write' },
  delete: { icon: '🗑️', group: 'write' },
  if: { icon: '❓', group: 'control' },
  open: { icon: '📂', group: 'resource' },
  close: { icon: '📁', group: 'resource' },
  commit: { icon: '✅', group: 'resource' },
  rollback: { icon: '↩️', group: 'resource' },
};

export function operationMeta(type: IoOperationType): OperationMeta {
  return META[type] ?? { icon: '•', group: 'control' };
}

const TARGET_ICON: Record<IoTargetLabel, string> = {
  Table: '🗄️',
  DataFile: '📄',
  ExternalSystem: '🌐',
  MessageQueue: '📮',
  Session: '🔌',
};

export function targetIcon(label: IoTargetLabel): string {
  return TARGET_ICON[label] ?? '📦';
}

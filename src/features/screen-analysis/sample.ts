import type { GraphData } from '@/components/graph/types';

/**
 * DB 未接続時のフォールバック用サンプル。
 * neo4j/seed/sample.cypher の画面遷移と一致させている。
 */
export const SCREEN_SAMPLE: GraphData = {
  nodes: [
    { id: 'screen:order-list', label: '受注一覧', kind: 'Screen' },
    { id: 'screen:order-new', label: '受注登録', kind: 'Screen', href: '/io?unit=fn%3Aregister-order' },
    { id: 'screen:order-done', label: '登録完了', kind: 'Screen' },
  ],
  edges: [
    {
      id: 'screen:order-list->screen:order-new',
      source: 'screen:order-list',
      target: 'screen:order-new',
      label: '新規ボタン',
    },
    {
      id: 'screen:order-new->screen:order-done',
      source: 'screen:order-new',
      target: 'screen:order-done',
      label: '登録ボタン',
    },
  ],
};

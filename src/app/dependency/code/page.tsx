import { DependencyView } from '@/features/dependency-analysis/DependencyView';

// Neo4j を毎リクエスト参照するため静的プリレンダリングしない
export const dynamic = 'force-dynamic';

export default function CodeDependencyPage() {
  return <DependencyView granularity="code" />;
}

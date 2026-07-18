import { DependencyView } from '@/features/dependency-analysis/DependencyView';

export default function CodeDependencyPage() {
  return <DependencyView granularity="code" />;
}

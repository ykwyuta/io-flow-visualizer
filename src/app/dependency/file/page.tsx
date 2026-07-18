import { DependencyView } from '@/features/dependency-analysis/DependencyView';

export default function FileDependencyPage() {
  return <DependencyView granularity="file" />;
}

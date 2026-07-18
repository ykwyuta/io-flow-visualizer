import { DependencyView } from '@/features/dependency-analysis/DependencyView';

export default function SystemDependencyPage() {
  return <DependencyView granularity="system" />;
}

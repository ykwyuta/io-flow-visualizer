import { NextResponse } from 'next/server';
import type { DependencyGranularity } from '@/server/neo4j/queries/dependency';
import { getDependencyGraph } from '@/server/neo4j/repositories/dependency-repository';

const VALID: DependencyGranularity[] = ['system', 'file', 'code'];

/**
 * 依存関係分析モード用データ取得。
 * granularity（system | file | code）に応じたグラフ（nodes/edges）を返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const granularity = (searchParams.get('granularity') ?? 'system') as DependencyGranularity;
  if (!VALID.includes(granularity)) {
    return NextResponse.json({ error: 'invalid granularity' }, { status: 400 });
  }

  const graph = await getDependencyGraph(granularity);
  return NextResponse.json({ graph });
}

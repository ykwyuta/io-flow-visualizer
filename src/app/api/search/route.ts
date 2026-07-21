import { NextResponse } from 'next/server';
import { structuredSearch } from '@/server/neo4j/repositories/search-repository';

// Neo4j を毎リクエスト参照するため静的化しない
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * 構造化検索（検索窓＋種別絞り込み）。
 * クエリ: q（キーワード）, kinds（カンマ区切りラベル）, offset, limit。
 * 大規模アプリでも通用するよう、常に境界付き（ページング）で返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const kinds = (searchParams.get('kinds') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const offset = Math.max(0, Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0);
  const rawLimit = Number.parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit));

  const response = await structuredSearch({ q, kinds, offset, limit });
  return NextResponse.json(response);
}

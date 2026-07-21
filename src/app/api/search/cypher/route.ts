import { NextResponse } from 'next/server';
import { readRawQuery } from '@/server/neo4j/driver';

// Neo4j を毎リクエスト参照するため静的化しない
export const dynamic = 'force-dynamic';

/** 返却行数の上限（巨大結果の抑制）。超過分は truncated=true で通知。 */
const MAX_ROWS = 1000;
/** トランザクションタイムアウト（暴走クエリの抑制）。 */
const TIMEOUT_MS = 5000;

/**
 * 書き込み系クロージャを弾く（多層防御）。
 * 実行自体は READ セッションで行うためサーバー側でも書き込みは拒否されるが、
 * 明確な書き込みキーワードは早期に分かりやすいエラーにする。
 */
const WRITE_KEYWORDS = [
  'create',
  'merge',
  'delete',
  'set',
  'remove',
  'drop',
  'foreach',
  'detach',
  'load\\s+csv',
];

function findWriteKeyword(cypher: string): string | null {
  for (const kw of WRITE_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(cypher)) return kw.replace('\\s+', ' ');
  }
  return null;
}

/**
 * 生 Cypher を「読み取り専用」で実行する（検索システムの「クエリ直接投入」用）。
 * ボディ: { cypher: string, params?: object }。
 */
export async function POST(request: Request) {
  let body: { cypher?: unknown; params?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const cypher = typeof body.cypher === 'string' ? body.cypher.trim() : '';
  if (!cypher) {
    return NextResponse.json({ error: 'cypher is required' }, { status: 400 });
  }

  const writeKw = findWriteKeyword(cypher);
  if (writeKw) {
    return NextResponse.json(
      { error: `書き込み系キーワード「${writeKw}」は使用できません（読み取り専用）。` },
      { status: 400 },
    );
  }

  const params =
    body.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};

  try {
    const { keys, rows } = await readRawQuery(cypher, params, TIMEOUT_MS);
    const truncated = rows.length > MAX_ROWS;
    return NextResponse.json({ keys, rows: rows.slice(0, MAX_ROWS), truncated });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import 'server-only';
import type { GraphData } from '@/components/graph/types';
import {
  SEARCH_SAMPLE_EDGES,
  SEARCH_SAMPLE_NODES,
  type SampleNode,
} from '@/features/search/sample';
import type {
  Facet,
  NeighborhoodResponse,
  SearchResponse,
  SearchResult,
} from '@/features/search/types';
import { readQuery } from '@/server/neo4j/driver';
import {
  CONTAINS_FACETS,
  CONTAINS_SEARCH,
  FULLTEXT_FACETS,
  FULLTEXT_SEARCH,
  IO_PLAN_UNITS_IN,
  NEIGHBORHOOD,
  SEARCHABLE_LABELS,
} from '@/server/neo4j/queries/search';

/** ファセット集計の上限（大規模グラフでの過負荷防止。概算表示になる）。 */
const FACET_CAP = 2000;

export interface SearchParams {
  q: string;
  kinds: string[];
  offset: number;
  limit: number;
}

interface ResultRow {
  id: string;
  label: string;
  kind: string;
  score: number;
}

/** Lucene 検索文字列を組み立てる（各トークンを前方一致にする）。 */
function toLucene(q: string): string {
  const escapeRe = /([+\-&|!(){}[\]^"~*?:\\/])/g;
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t.replace(escapeRe, '\\$1')}*`)
    .join(' ');
}

/** 検索結果に IO 分析モードへのドリルダウン先（ioHref）を付与する。 */
async function annotateIoHref(results: SearchResult[]): Promise<void> {
  const ids = results.map((r) => r.id);
  if (ids.length === 0) return;
  const rows = await readQuery<{ id: string }>(IO_PLAN_UNITS_IN, { ids });
  const ioUnits = new Set(rows.map((r) => r.id));
  for (const r of results) {
    if (ioUnits.has(r.id)) r.ioHref = `/io?unit=${encodeURIComponent(r.id)}`;
  }
}

function buildResponse(
  rows: ResultRow[],
  facetRows: Facet[],
  limit: number,
  fulltext: boolean,
): Omit<SearchResponse, 'fallback'> {
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const facetsTotal = facetRows.reduce((s, f) => s + f.count, 0);
  return {
    results: page.map((r) => ({ id: r.id, label: r.label, kind: r.kind, score: r.score })),
    facets: facetRows,
    hasMore,
    fulltext,
    facetsApprox: facetsTotal >= FACET_CAP,
  };
}

/**
 * 構造化検索（検索窓＋種別絞り込み）。
 * 全文検索インデックス → CONTAINS → サンプルの順にフォールバックする。
 */
export async function structuredSearch(params: SearchParams): Promise<SearchResponse> {
  const { q, kinds, offset, limit } = params;
  // hasMore 判定のため limit+1 件取得
  const fetchLimit = limit + 1;

  try {
    // キーワードがあれば全文検索を優先（高速・スケーラブル）
    if (q.trim() !== '') {
      try {
        const lucene = toLucene(q);
        const [rows, facetRows] = await Promise.all([
          readQuery<ResultRow>(FULLTEXT_SEARCH, { lucene, kinds, offset, limit: fetchLimit }),
          readQuery<Facet>(FULLTEXT_FACETS, { lucene, facetCap: FACET_CAP }),
        ]);
        const res = buildResponse(rows, facetRows, limit, true);
        await annotateIoHref(res.results);
        return { ...res, fallback: false };
      } catch {
        // 全文検索インデックス未作成などは CONTAINS フォールバックへ
      }
    }

    // CONTAINS ベース（キーワード無しの種別ブラウズもここ）
    const [rows, facetRows] = await Promise.all([
      readQuery<ResultRow>(CONTAINS_SEARCH, {
        q: q.trim().toLowerCase(),
        searchable: [...SEARCHABLE_LABELS],
        kinds,
        offset,
        limit: fetchLimit,
      }),
      readQuery<Facet>(CONTAINS_FACETS, {
        q: q.trim().toLowerCase(),
        searchable: [...SEARCHABLE_LABELS],
        facetCap: FACET_CAP,
      }),
    ]);
    const res = buildResponse(rows, facetRows, limit, false);
    await annotateIoHref(res.results);
    return { ...res, fallback: false };
  } catch {
    // Neo4j 未接続などはサンプルで in-memory 検索
    return sampleSearch(params);
  }
}

// ============================================================
// サンプル（in-memory）フォールバック
// ============================================================

function sampleSearch(params: SearchParams): SearchResponse {
  const { q, kinds, offset, limit } = params;
  const kw = q.trim().toLowerCase();
  const matched = SEARCH_SAMPLE_NODES.filter((n) => {
    if (kinds.length > 0 && !kinds.includes(n.kind)) return false;
    if (kw === '') return true;
    return `${n.label} ${n.id}`.toLowerCase().includes(kw);
  });

  // ファセットは種別絞り込み前の（キーワードのみ適用した）集合で数える
  const facetBase = SEARCH_SAMPLE_NODES.filter(
    (n) => kw === '' || `${n.label} ${n.id}`.toLowerCase().includes(kw),
  );
  const facetMap = new Map<string, number>();
  for (const n of facetBase) facetMap.set(n.kind, (facetMap.get(n.kind) ?? 0) + 1);
  const facets: Facet[] = [...facetMap.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));

  const page = matched.slice(offset, offset + limit);
  const results: SearchResult[] = page.map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.kind,
    score: 0,
    ioHref: n.ioPlan ? `/io?unit=${encodeURIComponent(n.id)}` : undefined,
  }));

  return {
    results,
    facets,
    hasMore: matched.length > offset + limit,
    fulltext: false,
    fallback: true,
    facetsApprox: false,
  };
}

// ============================================================
// 近傍グラフ（ドリルダウン）
// ============================================================

interface NeighborRow {
  centerKind: string;
  centerLabel: string;
  relType: string | null;
  relSource: string | null;
  relTarget: string | null;
  neighborId: string | null;
  neighborLabel: string | null;
  neighborKind: string | null;
}

/** 指定ノードの近傍（1 ホップ）を境界付きで取得し、グラフに整形する。 */
export async function getNeighborhood(id: string, limit: number): Promise<NeighborhoodResponse> {
  try {
    const rows = await readQuery<NeighborRow>(NEIGHBORHOOD, { id, limit });
    if (rows.length === 0) return sampleNeighborhood(id);

    const graph = assembleNeighborhood(id, rows);
    return { graph, fallback: false };
  } catch {
    return sampleNeighborhood(id);
  }
}

function assembleNeighborhood(id: string, rows: NeighborRow[]): GraphData {
  const nodes = new Map<string, { id: string; label: string; kind: string; center: boolean }>();
  const edges = new Map<string, { id: string; source: string; target: string; label: string }>();

  const first = rows[0];
  nodes.set(id, { id, label: first.centerLabel, kind: first.centerKind, center: true });

  for (const r of rows) {
    if (r.neighborId && r.neighborKind) {
      if (!nodes.has(r.neighborId)) {
        nodes.set(r.neighborId, {
          id: r.neighborId,
          label: r.neighborLabel ?? r.neighborId,
          kind: r.neighborKind,
          center: false,
        });
      }
    }
    if (r.relType && r.relSource && r.relTarget) {
      const key = `${r.relSource}->${r.relTarget}:${r.relType}`;
      if (!edges.has(key)) {
        edges.set(key, {
          id: key,
          source: r.relSource,
          target: r.relTarget,
          label: r.relType,
        });
      }
    }
  }

  return {
    nodes: [...nodes.values()].map((n) => ({
      id: n.id,
      label: n.center ? `★ ${n.label}` : n.label,
      kind: n.kind,
      href: `/search?focus=${encodeURIComponent(n.id)}`,
    })),
    edges: [...edges.values()],
  };
}

function sampleNeighborhood(id: string): NeighborhoodResponse {
  const byId = new Map<string, SampleNode>(SEARCH_SAMPLE_NODES.map((n) => [n.id, n]));
  const center = byId.get(id);
  if (!center) {
    return { graph: { nodes: [], edges: [] }, fallback: true };
  }

  const incident = SEARCH_SAMPLE_EDGES.filter((e) => e.source === id || e.target === id);
  const nodeIds = new Set<string>([id]);
  for (const e of incident) {
    nodeIds.add(e.source);
    nodeIds.add(e.target);
  }

  return {
    graph: {
      nodes: [...nodeIds].map((nid) => {
        const n = byId.get(nid);
        return {
          id: nid,
          label: nid === id ? `★ ${n?.label ?? nid}` : n?.label ?? nid,
          kind: n?.kind ?? 'Unknown',
          href: `/search?focus=${encodeURIComponent(nid)}`,
        };
      }),
      edges: incident.map((e, i) => ({
        id: `${e.source}->${e.target}#${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    },
    fallback: true,
  };
}

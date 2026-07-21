'use client';

import { useCallback, useEffect, useState } from 'react';
import { GraphView } from '@/components/graph/GraphView';
import type {
  Facet,
  NeighborhoodResponse,
  RawCypherResponse,
  SearchResponse,
  SearchResult,
} from './types';

const PAGE_SIZE = 20;

type Tab = 'filter' | 'cypher';

const banner = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  padding: 8,
  borderRadius: 6,
  fontSize: 13,
  margin: '8px 0',
});

export function SearchView({ initialFocus }: { initialFocus?: string }) {
  const [tab, setTab] = useState<Tab>('filter');

  return (
    <div>
      <h1>検索システム</h1>
      <p style={{ fontSize: 14, color: '#475569' }}>
        巨大なアプリケーションでも通用するよう、全件をロードせず境界付き（ページング／近傍）で探索します。
        検索窓・種別での絞り込みと、グラフDBへの Cypher 直接投入の両方に対応します。
      </p>

      <nav style={{ display: 'flex', gap: 8, margin: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
        <TabButton active={tab === 'filter'} onClick={() => setTab('filter')}>
          絞り込み検索
        </TabButton>
        <TabButton active={tab === 'cypher'} onClick={() => setTab('cypher')}>
          Cypher 直接クエリ
        </TabButton>
      </nav>

      {tab === 'filter' ? <FilterSearch initialFocus={initialFocus} /> : <CypherSearch />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: 'none',
        borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
        background: 'transparent',
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// 絞り込み検索
// ============================================================

function FilterSearch({ initialFocus }: { initialFocus?: string }) {
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [kinds, setKinds] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | undefined>(initialFocus);

  const runSearch = useCallback(async (kw: string, ks: string[], off: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: kw, offset: String(off), limit: String(PAGE_SIZE) });
      if (ks.length > 0) params.set('kinds', ks.join(','));
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(`検索に失敗しました (${res.status})`);
      setData((await res.json()) as SearchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回・条件変更時に検索
  useEffect(() => {
    runSearch(submitted, kinds, offset);
  }, [submitted, kinds, offset, runSearch]);

  // 近傍フォーカス（URL の ?focus= からのドリルダウン）
  useEffect(() => {
    setFocusId(initialFocus);
  }, [initialFocus]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSubmitted(keyword);
  };

  const toggleKind = (kind: string) => {
    setOffset(0);
    setKinds((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));
  };

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="キーワード（ノード名 / パス / id を全文検索）"
          style={{
            flex: '1 1 320px',
            padding: '8px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          検索
        </button>
      </form>

      {data && (
        <FacetFilter facets={data.facets} selected={kinds} onToggle={toggleKind} approx={data.facetsApprox} />
      )}

      {data?.fallback && (
        <p style={banner('#fffbeb', '#fde68a')}>
          Neo4j に接続できないため、サンプル（neo4j/seed/sample.cypher）で検索しています。
        </p>
      )}
      {data && !data.fallback && !data.fulltext && submitted.trim() !== '' && (
        <p style={banner('#f0f9ff', '#bae6fd')}>
          全文検索インデックス（nodeSearch）が未作成のため、CONTAINS 検索で代替しています。
          大規模データでは neo4j/schema/indexes.cypher の適用を推奨します。
        </p>
      )}
      {error && <p style={banner('#fef2f2', '#fecaca')}>{error}</p>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 380px', minWidth: 320 }}>
          <ResultList
            data={data}
            loading={loading}
            offset={offset}
            onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            onNext={() => setOffset((o) => o + PAGE_SIZE)}
            onFocus={setFocusId}
            focusId={focusId}
          />
        </div>
        <div style={{ flex: '2 1 480px', minWidth: 360 }}>
          {focusId && <Neighborhood id={focusId} />}
        </div>
      </div>
    </div>
  );
}

function FacetFilter({
  facets,
  selected,
  onToggle,
  approx,
}: {
  facets: Facet[];
  selected: string[];
  onToggle: (kind: string) => void;
  approx: boolean;
}) {
  if (facets.length === 0) return null;
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        種別で絞り込み{approx ? '（件数は概算）' : ''}:
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {facets.map((f) => {
          const active = selected.includes(f.kind);
          return (
            <button
              key={f.kind}
              type="button"
              onClick={() => onToggle(f.kind)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                background: active ? '#eff6ff' : '#fff',
                color: active ? '#1d4ed8' : '#334155',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {f.kind} <span style={{ color: '#94a3b8' }}>({f.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultList({
  data,
  loading,
  offset,
  onPrev,
  onNext,
  onFocus,
  focusId,
}: {
  data: SearchResponse | null;
  loading: boolean;
  offset: number;
  onPrev: () => void;
  onNext: () => void;
  onFocus: (id: string) => void;
  focusId?: string;
}) {
  if (loading && !data) return <p style={{ color: '#64748b' }}>検索中…</p>;
  if (!data) return null;
  if (data.results.length === 0) {
    return <p style={{ color: '#64748b' }}>該当するノードがありません。</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {offset + 1}–{offset + data.results.length} 件目
          {loading ? '（更新中…）' : ''}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <PagerButton disabled={offset === 0} onClick={onPrev}>
            ← 前へ
          </PagerButton>
          <PagerButton disabled={!data.hasMore} onClick={onNext}>
            次へ →
          </PagerButton>
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
        {data.results.map((r) => (
          <ResultItem key={r.id} r={r} active={r.id === focusId} onFocus={onFocus} />
        ))}
      </ul>
    </div>
  );
}

function ResultItem({
  r,
  active,
  onFocus,
}: {
  r: SearchResult;
  active: boolean;
  onFocus: (id: string) => void;
}) {
  return (
    <li
      style={{
        border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
        background: active ? '#eff6ff' : '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: '#475569',
          }}
        >
          {r.kind}
        </span>
        <strong style={{ fontSize: 14 }}>{r.label}</strong>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, wordBreak: 'break-all' }}>{r.id}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12 }}>
        <button
          type="button"
          onClick={() => onFocus(r.id)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
          }}
        >
          近傍グラフを表示
        </button>
        {r.ioHref && (
          <a href={r.ioHref} style={{ color: '#ea580c' }}>
            IO 実行計画へ ↗
          </a>
        )}
      </div>
    </li>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        border: '1px solid #cbd5e1',
        background: disabled ? '#f8fafc' : '#fff',
        color: disabled ? '#cbd5e1' : '#334155',
        borderRadius: 6,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function Neighborhood({ id }: { id: string }) {
  const [data, setData] = useState<NeighborhoodResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/search/neighborhood?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`近傍の取得に失敗しました (${res.status})`);
        return res.json();
      })
      .then((json: NeighborhoodResponse) => {
        if (active) setData(json);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0' }}>近傍グラフ（★ = 中心 / クリックで展開）</div>
      {loading && <p style={{ color: '#64748b' }}>読み込み中…</p>}
      {error && <p style={banner('#fef2f2', '#fecaca')}>{error}</p>}
      {data && data.graph.nodes.length === 0 && (
        <p style={{ color: '#64748b' }}>このノードに隣接する要素がありません。</p>
      )}
      {data && data.graph.nodes.length > 0 && <GraphView data={data.graph} direction="LR" />}
    </div>
  );
}

// ============================================================
// Cypher 直接クエリ
// ============================================================

const CYPHER_EXAMPLES = [
  {
    label: 'ラベル別ノード数',
    cypher: 'MATCH (n) RETURN labels(n) AS labels, count(*) AS count ORDER BY count DESC',
  },
  {
    label: 'あるテーブルに書き込む処理単位',
    cypher:
      "MATCH (u)-[:EXECUTES]->(:IOOperation)-[:CHILD*0..]->(op:IOOperation)-[:ACCESSES {mode:'write'}]->(t:Table {name:'ORDERS'})\nRETURN DISTINCT u.id AS unit LIMIT 50",
  },
  {
    label: 'システムの依存（2 ホップ）',
    cypher: 'MATCH p=(a:System)-[:DEPENDS_ON*1..2]->(b:System) RETURN p LIMIT 25',
  },
];

function CypherSearch() {
  const [cypher, setCypher] = useState(CYPHER_EXAMPLES[0].cypher);
  const [data, setData] = useState<RawCypherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch('/api/search/cypher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cypher }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `実行に失敗しました (${res.status})`);
      setData(json as RawCypherResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [cypher]);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#475569' }}>
        グラフDBへ Cypher を直接投入します（<strong>読み取り専用</strong>。書き込み系キーワードは拒否、
        実行はタイムアウトと行数上限で保護）。
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0' }}>
        {CYPHER_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setCypher(ex.cypher)}
            style={{
              padding: '4px 10px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <textarea
        value={cypher}
        onChange={(e) => setCypher(e.target.value)}
        rows={6}
        spellCheck={false}
        style={{
          width: '100%',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          padding: 10,
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ margin: '6px 0' }}>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: loading ? '#93c5fd' : '#2563eb',
            color: '#fff',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer',
            fontSize: 14,
          }}
        >
          {loading ? '実行中…' : '実行'}
        </button>
      </div>

      {error && <p style={banner('#fef2f2', '#fecaca')}>{error}</p>}
      {data && <CypherResult data={data} />}
    </div>
  );
}

function CypherResult({ data }: { data: RawCypherResponse }) {
  if (data.rows.length === 0) {
    return <p style={{ color: '#64748b' }}>結果は 0 行です。</p>;
  }
  return (
    <div>
      {data.truncated && (
        <p style={banner('#fffbeb', '#fde68a')}>
          結果が多いため先頭 1000 行のみ表示しています。LIMIT の付与を検討してください。
        </p>
      )}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              {data.keys.map((k) => (
                <th
                  key={k}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderBottom: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                {data.keys.map((k) => (
                  <td
                    key={k}
                    style={{
                      padding: '6px 10px',
                      borderBottom: '1px solid #f1f5f9',
                      verticalAlign: 'top',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {renderCell(row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{data.rows.length} 行</div>
    </div>
  );
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (v._type === 'node') {
      const labels = Array.isArray(v.labels) ? (v.labels as string[]).join(':') : '';
      return `(:${labels} ${JSON.stringify(v.properties)})`;
    }
    if (v._type === 'relationship') {
      return `[:${String(v.relType)} ${JSON.stringify(v.properties)}]`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

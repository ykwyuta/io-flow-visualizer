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

export function SearchView({ initialFocus }: { initialFocus?: string }) {
  const [tab, setTab] = useState<Tab>('filter');

  return (
    <div>
      <div className="eyebrow">検索システム</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        グラフを検索する
      </h1>
      <p className="page-subtitle">
        巨大なアプリケーションでも通用するよう、全件をロードせず境界付き（ページング／近傍）で探索します。
        検索窓・種別での絞り込みと、グラフDBへの Cypher 直接クエリの両方に対応します。
      </p>

      <div className="tabs">
        <button
          type="button"
          className={`tab${tab === 'filter' ? ' active' : ''}`}
          onClick={() => setTab('filter')}
        >
          絞り込み検索
        </button>
        <button
          type="button"
          className={`tab${tab === 'cypher' ? ' active' : ''}`}
          onClick={() => setTab('cypher')}
        >
          Cypher 直接クエリ
        </button>
      </div>

      {tab === 'filter' ? <FilterSearch initialFocus={initialFocus} /> : <CypherSearch />}
    </div>
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

  useEffect(() => {
    runSearch(submitted, kinds, offset);
  }, [submitted, kinds, offset, runSearch]);

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
      <form onSubmit={onSubmit} className="row" style={{ gap: 10 }}>
        <div className="search-field">
          <span className="search-icon" aria-hidden>
            🔎
          </span>
          <input
            type="text"
            className="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワード（ノード名 / パス / id を全文検索）"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          検索
        </button>
      </form>

      {data && (
        <FacetFilter
          facets={data.facets}
          selected={kinds}
          onToggle={toggleKind}
          approx={data.facetsApprox}
        />
      )}

      {data?.fallback && (
        <div className="banner banner-warn">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>Neo4j に接続できないため、サンプル（neo4j/seed/sample.cypher）で検索しています。</span>
        </div>
      )}
      {data && !data.fallback && !data.fulltext && submitted.trim() !== '' && (
        <div className="banner banner-info">
          <span className="banner-ico" aria-hidden>
            ℹ
          </span>
          <span>
            全文検索インデックス（nodeSearch）が未作成のため CONTAINS 検索で代替しています。大規模データでは
            neo4j/schema/indexes.cypher の適用を推奨します。
          </span>
        </div>
      )}
      {error && (
        <div className="banner banner-error">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}

      <div className="search-layout">
        <ResultList
          data={data}
          loading={loading}
          offset={offset}
          onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
          onFocus={setFocusId}
          focusId={focusId}
        />
        <div>{focusId && <Neighborhood id={focusId} />}</div>
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
    <div style={{ marginTop: 14 }}>
      <div className="subtle" style={{ fontSize: 12, marginBottom: 2 }}>
        種別で絞り込み{approx ? '（件数は概算）' : ''}
      </div>
      <div className="facet-bar">
        {facets.map((f) => {
          const active = selected.includes(f.kind);
          return (
            <button
              key={f.kind}
              type="button"
              className={`chip${active ? ' active' : ''}`}
              onClick={() => onToggle(f.kind)}
            >
              {f.kind} <span className="count">{f.count}</span>
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
  if (loading && !data) {
    return (
      <div className="muted" style={{ padding: 8 }}>
        <span className="spinner" /> 検索中…
      </div>
    );
  }
  if (!data) return <div />;
  if (data.results.length === 0) {
    return (
      <div className="card card-pad muted" style={{ textAlign: 'center' }}>
        該当するノードがありません。
      </div>
    );
  }

  return (
    <div>
      <div className="between">
        <span className="count-line">
          {offset + 1}–{offset + data.results.length} 件目
          {loading && (
            <>
              {' '}
              <span className="spinner" />
            </>
          )}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-sm" disabled={offset === 0} onClick={onPrev}>
            ← 前へ
          </button>
          <button type="button" className="btn btn-sm" disabled={!data.hasMore} onClick={onNext}>
            次へ →
          </button>
        </span>
      </div>
      <ul className="result-list">
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
      className={`result-item${active ? ' active' : ''}`}
      onClick={() => onFocus(r.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFocus(r.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="badge">{r.kind}</span>
        <strong style={{ fontSize: 14 }}>{r.label}</strong>
      </div>
      <div className="result-id">{r.id}</div>
      <div className="result-actions">
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>近傍グラフを表示 →</span>
        {r.ioHref && (
          <a
            href={r.ioHref}
            style={{ color: '#ea580c' }}
            onClick={(e) => e.stopPropagation()}
          >
            IO 実行計画へ ↗
          </a>
        )}
      </div>
    </li>
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
      <div className="panel-label">
        近傍グラフ <span className="subtle" style={{ fontWeight: 400 }}>（★ = 中心 / クリックで展開）</span>
      </div>
      {loading && (
        <div className="muted" style={{ padding: 8 }}>
          <span className="spinner" /> 読み込み中…
        </div>
      )}
      {error && (
        <div className="banner banner-error">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}
      {data && data.graph.nodes.length === 0 && !loading && (
        <div className="card card-pad muted" style={{ textAlign: 'center' }}>
          このノードに隣接する要素がありません。
        </div>
      )}
      {data && data.graph.nodes.length > 0 && (
        <GraphView data={data.graph} direction="LR" compact />
      )}
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
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        グラフDBへ Cypher を直接投入します（<strong>読み取り専用</strong>。書き込み系キーワードは拒否、
        実行はタイムアウトと行数上限で保護）。
      </p>
      <div className="example-bar">
        {CYPHER_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            className="chip"
            onClick={() => setCypher(ex.cypher)}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <textarea
        className="textarea"
        value={cypher}
        onChange={(e) => setCypher(e.target.value)}
        rows={6}
        spellCheck={false}
      />
      <div style={{ margin: '10px 0' }}>
        <button type="button" className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> 実行中…
            </>
          ) : (
            '実行'
          )}
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}
      {data && <CypherResult data={data} />}
    </div>
  );
}

function CypherResult({ data }: { data: RawCypherResponse }) {
  if (data.rows.length === 0) {
    return <div className="card card-pad muted">結果は 0 行です。</div>;
  }
  return (
    <div>
      {data.truncated && (
        <div className="banner banner-warn">
          <span className="banner-ico" aria-hidden>
            ⚠
          </span>
          <span>結果が多いため先頭 1000 行のみ表示しています。LIMIT の付与を検討してください。</span>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {data.keys.map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                {data.keys.map((k) => (
                  <td key={k}>{renderCell(row[k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="count-line" style={{ marginTop: 6 }}>
        {data.rows.length} 行
      </div>
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

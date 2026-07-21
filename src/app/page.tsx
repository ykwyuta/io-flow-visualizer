import Link from 'next/link';

const CARDS = [
  {
    href: '/search',
    icon: '🔎',
    accent: '#4f46e5',
    title: '検索システム',
    desc: '巨大アプリ向け。検索窓・種別での絞り込みと、グラフDBへの Cypher 直接クエリ。',
    tag: '大規模対応',
  },
  {
    href: '/io',
    icon: '🧭',
    accent: '#2563eb',
    title: 'IO 分析',
    desc: 'IO 処理構造を SQL 実行計画のようなツリーで可視化。対象・読み書き・推定行数を表示。',
  },
  {
    href: '/dependency/system',
    icon: '🕸️',
    accent: '#0891b2',
    title: '依存関係分析',
    desc: 'システム / ファイル / コードの 3 粒度で依存関係を可視化。上位から下位へドリルダウン。',
  },
  {
    href: '/screen',
    icon: '🖥️',
    accent: '#ea580c',
    title: '画面関係分析',
    desc: '画面間の遷移関係を有向グラフで可視化。遷移のきっかけを矢印ラベルに表示。',
  },
];

export default function HomePage() {
  return (
    <div>
      <section style={{ marginBottom: 28 }}>
        <div className="eyebrow">Neo4j × Next.js</div>
        <h1 className="page-title" style={{ fontSize: 30, marginTop: 6 }}>
          プログラムの処理構造を、3 つの視点で可視化する
        </h1>
        <p className="page-subtitle" style={{ fontSize: 15 }}>
          IO 分析・依存関係分析・画面関係分析の 3 モードと、大規模アプリでも破綻しない検索システムを
          備えたビジュアライザです。まずは検索から対象を絞り込むのがおすすめです。
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card card-pad home-card"
            style={{ color: 'inherit', display: 'block' }}
          >
            <div
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `color-mix(in srgb, ${c.accent} 14%, transparent)`,
                fontSize: 20,
                marginBottom: 12,
              }}
            >
              {c.icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 16 }}>{c.title}</strong>
              {c.tag && <span className="badge">{c.tag}</span>}
            </div>
            <p className="muted" style={{ fontSize: 13.5, margin: '6px 0 0' }}>
              {c.desc}
            </p>
            <div
              style={{ marginTop: 12, fontSize: 13, color: c.accent, fontWeight: 600 }}
              aria-hidden
            >
              開く →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

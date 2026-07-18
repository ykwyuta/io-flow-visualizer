import Link from 'next/link';

export default function FileDependencyPage() {
  return (
    <div>
      <h1>依存関係分析モード — ファイル単位</h1>
      <p>File 間の DEPENDS_ON、および System→File の CONTAINS を描画します。</p>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link href="/dependency/system">システム</Link>
        <Link href="/dependency/file">ファイル</Link>
        <Link href="/dependency/code">コード（関数/クラス/メソッド/セクション）</Link>
      </nav>
    </div>
  );
}

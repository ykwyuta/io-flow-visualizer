import Link from 'next/link';

export default function CodeDependencyPage() {
  return (
    <div>
      <h1>依存関係分析モード — コード単位</h1>
      <p>
        Function / Class / Method / Section 間の CALLS と、定義関係（DEFINES / HAS_METHOD /
        HAS_SECTION）を描画します。
      </p>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link href="/dependency/system">システム</Link>
        <Link href="/dependency/file">ファイル</Link>
        <Link href="/dependency/code">コード（関数/クラス/メソッド/セクション）</Link>
      </nav>
    </div>
  );
}

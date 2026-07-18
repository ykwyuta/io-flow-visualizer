import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1>IO Flow Visualizer</h1>
      <p>プログラムの処理構造を 3 つの視点で可視化します。</p>
      <ul>
        <li>
          <Link href="/io">IO分析モード</Link> — IO処理構造を実行計画風に可視化
        </li>
        <li>
          <Link href="/dependency/system">依存関係分析モード</Link> — システム/ファイル/コード単位の依存
        </li>
        <li>
          <Link href="/screen">画面関係分析モード</Link> — 画面間の遷移関係
        </li>
      </ul>
    </div>
  );
}

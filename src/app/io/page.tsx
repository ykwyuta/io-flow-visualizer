export default function IoAnalysisPage() {
  return (
    <div>
      <h1>IO分析モード</h1>
      <p>
        IOOperation の実行計画ツリー（EXECUTES を根に CHILD で連なる）と、ACCESSES による対象
        （テーブル/ファイル/外部システム/MQ/セッション）を、SQL Server の実行計画風に描画します。
      </p>
      <p>実装予定: src/features/io-analysis/, src/components/plan/</p>
    </div>
  );
}

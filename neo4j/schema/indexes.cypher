// 可視化クエリを支える索引。
// 名前検索や IO 演算子種別での絞り込みを想定。

// 名前による検索・表示用
CREATE INDEX system_name IF NOT EXISTS FOR (n:System) ON (n.name);
CREATE INDEX file_path IF NOT EXISTS FOR (n:File) ON (n.path);
CREATE INDEX class_name IF NOT EXISTS FOR (n:Class) ON (n.name);
CREATE INDEX function_name IF NOT EXISTS FOR (n:Function) ON (n.name);
CREATE INDEX screen_name IF NOT EXISTS FOR (n:Screen) ON (n.name);

// IO 演算子の種別で絞り込む用
CREATE INDEX iooperation_type IF NOT EXISTS FOR (n:IOOperation) ON (n.type);

// IO 対象を横断検索する用（共通ラベル IOTarget を併せ持つ前提）
CREATE INDEX iotarget_name IF NOT EXISTS FOR (n:IOTarget) ON (n.name);

// ============================================================
// 全文検索インデックス（検索システム用）
// ============================================================
// 大規模アプリでは全ノードをロードせず、キーワードで境界付きに絞り込む。
// name / label / path / id を横断的に全文検索するためのインデックス。
// このインデックスが存在すると検索 API は全文検索（高速・スケーラブル）を用い、
// 無い場合は CONTAINS ベースのフォールバックに切り替わる。
CREATE FULLTEXT INDEX nodeSearch IF NOT EXISTS
FOR (n:System|File|Program|Section|Class|Method|Function|Table|DataFile|ExternalSystem|MessageQueue|Session|IOOperation|Screen)
ON EACH [n.name, n.label, n.path, n.id];

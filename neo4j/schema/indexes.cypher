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

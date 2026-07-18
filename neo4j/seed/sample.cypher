// 構造を示すサンプルグラフ（登録例）。
// 3 モードすべてのデータを含む最小例。冪等に投入できるよう MERGE を用いる。
// 事前に neo4j/schema/constraints.cypher を適用しておくこと。
//
// 注意: cypher-shell は「;」区切りの文ごとに変数スコープが切れる。
// そのためリレーションは各文で id により MATCH し直し、自己完結させている。

// ============================================================
// ノード
// ============================================================
// ② 依存: システム / ファイル / コード
MERGE (n:System {id: 'sys:order'}) SET n.name = '受注システム';
MERGE (n:System {id: 'sys:stock'}) SET n.name = '在庫システム';
MERGE (n:File {id: 'file:order.cbl'}) SET n.name = 'order.cbl', n.path = 'src/order.cbl', n.language = 'cobol';
MERGE (n:File {id: 'file:stock.cbl'}) SET n.name = 'stock.cbl', n.path = 'src/stock.cbl', n.language = 'cobol';
MERGE (n:Function {id: 'fn:register-order'}) SET n.name = 'REGISTER-ORDER';
MERGE (n:Function {id: 'fn:check-stock'}) SET n.name = 'CHECK-STOCK';

// ① IO 対象（共通ラベル IOTarget を併せ付与）
MERGE (n:Table {id: 'tbl:orders'}) SET n:IOTarget, n.name = 'ORDERS', n.schema = 'dbo';
MERGE (n:Table {id: 'tbl:stock'}) SET n:IOTarget, n.name = 'STOCK', n.schema = 'dbo';
MERGE (n:Session {id: 'sess:db'}) SET n:IOTarget, n.name = 'DB-SESSION';

// ① IO 実行計画ノード
MERGE (n:IOOperation {id: 'op:0'}) SET n.type = 'open', n.label = 'セッション開始';
MERGE (n:IOOperation {id: 'op:1'}) SET n.type = 'if', n.label = '在庫あり判定';
MERGE (n:IOOperation {id: 'op:2'}) SET n.type = 'scan', n.label = 'STOCK 走査', n.estimatedRows = 1000;
MERGE (n:IOOperation {id: 'op:3'}) SET n.type = 'insert', n.label = 'ORDERS 追加';
MERGE (n:IOOperation {id: 'op:4'}) SET n.type = 'update', n.label = 'STOCK 更新';
MERGE (n:IOOperation {id: 'op:5'}) SET n.type = 'commit', n.label = 'コミット';

// ③ 画面
MERGE (n:Screen {id: 'screen:order-list'}) SET n.name = '受注一覧', n.route = '/orders';
MERGE (n:Screen {id: 'screen:order-new'}) SET n.name = '受注登録', n.route = '/orders/new';
MERGE (n:Screen {id: 'screen:order-done'}) SET n.name = '登録完了', n.route = '/orders/done';

// ============================================================
// ② 依存関係のリレーション
// ============================================================
MATCH (a:System {id: 'sys:order'}), (b:System {id: 'sys:stock'}) MERGE (a)-[:DEPENDS_ON {kind: 'call'}]->(b);
MATCH (a:System {id: 'sys:order'}), (b:File {id: 'file:order.cbl'}) MERGE (a)-[:CONTAINS]->(b);
MATCH (a:System {id: 'sys:stock'}), (b:File {id: 'file:stock.cbl'}) MERGE (a)-[:CONTAINS]->(b);
MATCH (a:File {id: 'file:order.cbl'}), (b:File {id: 'file:stock.cbl'}) MERGE (a)-[:DEPENDS_ON {kind: 'copy'}]->(b);
MATCH (a:File {id: 'file:order.cbl'}), (b:Function {id: 'fn:register-order'}) MERGE (a)-[:DEFINES]->(b);
MATCH (a:File {id: 'file:stock.cbl'}), (b:Function {id: 'fn:check-stock'}) MERGE (a)-[:DEFINES]->(b);
MATCH (a:Function {id: 'fn:register-order'}), (b:Function {id: 'fn:check-stock'}) MERGE (a)-[:CALLS]->(b);

// ============================================================
// ① IO 実行計画ツリー（EXECUTES / CHILD / ACCESSES）
// ============================================================
MATCH (u:Function {id: 'fn:register-order'}), (op:IOOperation {id: 'op:0'}) MERGE (u)-[:EXECUTES]->(op);
MATCH (p:IOOperation {id: 'op:0'}), (c:IOOperation {id: 'op:1'}) MERGE (p)-[:CHILD {order: 0}]->(c);
MATCH (p:IOOperation {id: 'op:1'}), (c:IOOperation {id: 'op:2'}) MERGE (p)-[:CHILD {order: 0}]->(c);
MATCH (p:IOOperation {id: 'op:1'}), (c:IOOperation {id: 'op:3'}) MERGE (p)-[:CHILD {order: 1}]->(c);
MATCH (p:IOOperation {id: 'op:1'}), (c:IOOperation {id: 'op:4'}) MERGE (p)-[:CHILD {order: 2}]->(c);
MATCH (p:IOOperation {id: 'op:0'}), (c:IOOperation {id: 'op:5'}) MERGE (p)-[:CHILD {order: 1}]->(c);
MATCH (op:IOOperation {id: 'op:0'}), (t:Session {id: 'sess:db'}) MERGE (op)-[:ACCESSES {mode: 'write'}]->(t);
MATCH (op:IOOperation {id: 'op:2'}), (t:Table {id: 'tbl:stock'}) MERGE (op)-[:ACCESSES {mode: 'read'}]->(t);
MATCH (op:IOOperation {id: 'op:3'}), (t:Table {id: 'tbl:orders'}) MERGE (op)-[:ACCESSES {mode: 'write'}]->(t);
MATCH (op:IOOperation {id: 'op:4'}), (t:Table {id: 'tbl:stock'}) MERGE (op)-[:ACCESSES {mode: 'write'}]->(t);

// ============================================================
// ③ 画面遷移 + ②×③ 横断
// ============================================================
MATCH (a:Screen {id: 'screen:order-list'}), (b:Screen {id: 'screen:order-new'}) MERGE (a)-[:TRANSITIONS_TO {trigger: '新規ボタン'}]->(b);
MATCH (a:Screen {id: 'screen:order-new'}), (b:Screen {id: 'screen:order-done'}) MERGE (a)-[:TRANSITIONS_TO {trigger: '登録ボタン'}]->(b);
MATCH (s:Screen {id: 'screen:order-new'}), (f:Function {id: 'fn:register-order'}) MERGE (s)-[:HANDLED_BY]->(f);

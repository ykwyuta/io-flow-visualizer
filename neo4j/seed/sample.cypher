// 構造を示すサンプルグラフ（登録例）。
// 3 モードすべてのデータを含む最小例。冪等に投入できるよう MERGE を用いる。
// 事前に neo4j/schema/constraints.cypher を適用しておくこと。

// ============================================================
// ② 依存関係: システム / ファイル / コード
// ============================================================
MERGE (sysOrder:System {id: 'sys:order'})   SET sysOrder.name = '受注システム';
MERGE (sysStock:System {id: 'sys:stock'})   SET sysStock.name = '在庫システム';
MERGE (sysOrder)-[:DEPENDS_ON {kind: 'call'}]->(sysStock);

MERGE (fOrder:File {id: 'file:order.cbl'})  SET fOrder.name = 'order.cbl', fOrder.path = 'src/order.cbl', fOrder.language = 'cobol';
MERGE (fStock:File {id: 'file:stock.cbl'})  SET fStock.name = 'stock.cbl', fStock.path = 'src/stock.cbl', fStock.language = 'cobol';
MERGE (sysOrder)-[:CONTAINS]->(fOrder);
MERGE (sysStock)-[:CONTAINS]->(fStock);
MERGE (fOrder)-[:DEPENDS_ON {kind: 'copy'}]->(fStock);

MERGE (fnRegister:Function {id: 'fn:register-order'}) SET fnRegister.name = 'REGISTER-ORDER';
MERGE (fnCheck:Function {id: 'fn:check-stock'})       SET fnCheck.name = 'CHECK-STOCK';
MERGE (fOrder)-[:DEFINES]->(fnRegister);
MERGE (fStock)-[:DEFINES]->(fnCheck);
MERGE (fnRegister)-[:CALLS]->(fnCheck);

// ============================================================
// ① IO 分析: 実行計画ツリー + IO 対象
// ============================================================
// IO 対象（共通ラベル IOTarget を併せ付与）
MERGE (tOrder:Table:IOTarget {id: 'tbl:orders'})       SET tOrder.name = 'ORDERS', tOrder.schema = 'dbo';
MERGE (tStock:Table:IOTarget {id: 'tbl:stock'})        SET tStock.name = 'STOCK', tStock.schema = 'dbo';
MERGE (sess:Session:IOTarget {id: 'sess:db'})          SET sess.name = 'DB-SESSION';

// REGISTER-ORDER の実行計画ツリー
MERGE (op0:IOOperation {id: 'op:0'}) SET op0.type = 'open',   op0.label = 'セッション開始';
MERGE (op1:IOOperation {id: 'op:1'}) SET op1.type = 'if',     op1.label = '在庫あり判定';
MERGE (op2:IOOperation {id: 'op:2'}) SET op2.type = 'scan',   op2.label = 'STOCK 走査', op2.estimatedRows = 1000;
MERGE (op3:IOOperation {id: 'op:3'}) SET op3.type = 'insert', op3.label = 'ORDERS 追加';
MERGE (op4:IOOperation {id: 'op:4'}) SET op4.type = 'update', op4.label = 'STOCK 更新';
MERGE (op5:IOOperation {id: 'op:5'}) SET op5.type = 'commit', op5.label = 'コミット';

MERGE (fnRegister)-[:EXECUTES]->(op0);
MERGE (op0)-[:CHILD {order: 0}]->(op1);
MERGE (op1)-[:CHILD {order: 0}]->(op2);
MERGE (op1)-[:CHILD {order: 1}]->(op3);
MERGE (op1)-[:CHILD {order: 2}]->(op4);
MERGE (op0)-[:CHILD {order: 1}]->(op5);

MERGE (op0)-[:ACCESSES {mode: 'write'}]->(sess);
MERGE (op2)-[:ACCESSES {mode: 'read'}]->(tStock);
MERGE (op3)-[:ACCESSES {mode: 'write'}]->(tOrder);
MERGE (op4)-[:ACCESSES {mode: 'write'}]->(tStock);

// ============================================================
// ③ 画面関係: 遷移
// ============================================================
MERGE (scList:Screen {id: 'screen:order-list'})     SET scList.name = '受注一覧', scList.route = '/orders';
MERGE (scNew:Screen {id: 'screen:order-new'})       SET scNew.name = '受注登録', scNew.route = '/orders/new';
MERGE (scDone:Screen {id: 'screen:order-done'})     SET scDone.name = '登録完了', scDone.route = '/orders/done';
MERGE (scList)-[:TRANSITIONS_TO {trigger: '新規ボタン'}]->(scNew);
MERGE (scNew)-[:TRANSITIONS_TO {trigger: '登録ボタン'}]->(scDone);

// ②×③ 横断: 画面を担うコードへ接続
MERGE (scNew)-[:HANDLED_BY]->(fnRegister);

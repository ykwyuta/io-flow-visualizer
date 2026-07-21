import type { PlanNode, PlanTree } from '@/features/io-analysis/types';
import { operationMeta, targetIcon } from '@/features/io-analysis/operation-meta';
import styles from './PlanTree.module.css';

function PlanNodeView({ node }: { node: PlanNode }) {
  const meta = operationMeta(node.type);
  const hasStats = node.estimatedRows != null || node.estimatedCost != null;

  return (
    <div className={styles.subtree}>
      <div className={`${styles.nodeBox} ${styles[meta.group]}`}>
        <div className={styles.head}>
          <span className={styles.icon}>{meta.icon}</span>
          <span className={styles.type}>{node.type}</span>
        </div>
        {node.label && <div className={styles.label}>{node.label}</div>}
        {hasStats && (
          <div className={styles.stats}>
            {node.estimatedRows != null && <>推定行数 {node.estimatedRows.toLocaleString()}</>}
            {node.estimatedRows != null && node.estimatedCost != null && <> / </>}
            {node.estimatedCost != null && <>コスト {node.estimatedCost}</>}
          </div>
        )}
        {node.targets.length > 0 && (
          <div className={styles.targets}>
            {node.targets.map((t, i) => (
              <span
                key={`${t.label}:${t.name}:${i}`}
                className={`${styles.target} ${t.mode === 'read' ? styles.read : styles.write_mode}`}
              >
                {targetIcon(t.label)} {t.name}（{t.mode === 'read' ? '読' : '書'}）
              </span>
            ))}
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <div className={styles.child} key={child.id}>
              <PlanNodeView node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanTreeView({ tree }: { tree: PlanTree }) {
  return (
    <div>
      <div className={styles.planHeader}>
        <span className="badge">{tree.rootUnit.kind}</span>
        <span>
          処理単位 <strong>{tree.rootUnit.name}</strong>
        </span>
      </div>
      <div className={styles.tree}>
        <PlanNodeView node={tree.root} />
      </div>
    </div>
  );
}

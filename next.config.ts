import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // graph-model はアプリ外のディレクトリを参照するため、型チェックの対象に含める
  typescript: {
    // 開発初期は import 経路の解決を優先。CI で `npm run typecheck` を回す。
  },
};

export default nextConfig;

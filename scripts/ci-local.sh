#!/usr/bin/env bash
# 逐条复现 .github/workflows/ci.yml 的验证步骤，用于在没有 CI runner 的情况下本地校验流水线能否跑通。
# 只做只读校验（validate / typecheck / test / build），不写入任何仓库文件。
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> openspec validate --specs"
npx --yes @fission-ai/openspec@1 validate --specs

echo
echo "==> openspec validate --changes --strict"
npx --yes @fission-ai/openspec@1 validate --changes --strict

echo
echo "==> npm run typecheck"
npm run typecheck

echo
echo "==> npm run test:run"
npm run test:run

echo
echo "==> npm run build"
npm run build

echo
echo "全部 CI 步骤本地通过。"

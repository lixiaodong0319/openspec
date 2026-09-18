# Proposal

## Why

当前项目是 Vite 的 Vue 3 模板，`src/components/HelloWorld.vue` 只是一个计数器示例，没有任何真实业务功能。项目需要第一个可用的真实功能来验证 OpenSpec 规范流程本身——从 proposal、spec、design 到 TDD 任务书是否跑得通。待办清单（todo list）是这类验证的合适载体：行为边界清晰、可被规格化为 `SHALL` 语句、能在单组件内完整实现与测试。

## What Changes

- 新增 `TodoList` 组件（`src/components/TodoList.vue`），提供待办清单的最小可用集合：新增、列表展示、勾选完成、删除，以及按完成状态筛选（全部 / 未完成 / 已完成）与剩余未完成数量展示。
- 新增 `useTodos` composable（`src/composables/useTodos.ts`），把增删改查与筛选的状态逻辑从组件中抽出，便于独立单元测试。
- `src/App.vue` 改为渲染 `TodoList`，替代原有的 `HelloWorld` 示例。
- 移除 `src/components/HelloWorld.vue` 及其测试 —— 该文件是脚手架示例，被真实功能取代后不再有存在价值。
- 数据仅存于内存（组件内 `ref`），刷新即丢失；不引入 localStorage、不引入路由、不引入状态管理库。

## Capabilities

### New Capabilities

- `todo-list`: 待办清单的核心行为——新增待办、展示待办列表、切换完成状态、删除待办、按完成状态筛选列表、展示剩余未完成数量，含空标题拒绝、空列表态、已完成项视觉区分、筛选子集为空、新增后回到全部筛选等可观察行为。

### Modified Capabilities

无。项目当前 `openspec/specs/` 为空（`openspec list --specs` 返回 `No specs found.`），本次是首个能力引入，不存在需要修改的既有 spec。

## Impact

**新增文件**

- `src/components/TodoList.vue` —— 清单 UI、筛选控件与交互
- `src/components/TodoList.spec.ts` —— 组件行为测试
- `src/composables/useTodos.ts` —— 增删改查与筛选状态逻辑
- `src/composables/useTodos.spec.ts` —— 逻辑层单元测试

**修改文件**

- `src/App.vue` —— 改为渲染 `TodoList`

**删除文件**

- `src/components/HelloWorld.vue`
- `src/components/HelloWorld.spec.ts`

**不受影响**

- 依赖：不新增任何 npm 依赖，`package.json` 的 `dependencies` / `devDependencies` 不变。
- 构建：`vite.config.ts`、`tsconfig*.json`、`index.html` 均不改动。
- 样式：`src/style.css` 的既有 CSS 变量（`--accent`、`--border`、`--text` 等）可直接复用，只做增量样式，不重写全局样式。
- 删除 `HelloWorld.vue` 后 `src/assets/hero.png` 不再被引用；本变更保留该文件不做清理，避免把资源清理混进功能变更。

**风险**

- `HelloWorld.spec.ts` 是当前唯一的测试文件，删除它会让「测试套件全绿」在短期内变成「测试套件只有新增用例」。这是刻意的：示例计数器的测试随其实现一起移除，新增的 `useTodos.spec.ts` 与 `TodoList.spec.ts` 接替成为回归防线。

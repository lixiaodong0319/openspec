# Proposal

## Why

当前待办清单的数据只活在内存里，刷新页面即全部丢失（`openspec/specs/todo-list/spec.md` 中的 `### Requirement: 数据仅存在于当前会话` 正是这一约束）。这让清单在真实使用中几乎不可用——用户关掉标签页或误刷新一次，记录的工作就没了。项目已经在浏览器里跑，浏览器本身提供了够用的本地存储，因此把待办落盘不需要引入任何服务端或新依赖。

## What Changes

- `useTodos` 在初始化时从 `localStorage` 读取待办列表，读取成功后作为初始数据；读取失败或数据不可用时退回空列表。
- `useTodos` 在待办数据发生任何变化（新增、切换完成状态、删除）后把整份列表写回 `localStorage`。
- 读取时对存储内容做结构校验：非法 JSON、非数组、条目缺字段或字段类型不对的内容一律丢弃，绝不因为脏数据让应用崩掉。
- 新增 2 条 Requirement（持久化行为、降级行为），移除 1 条与持久化相冲突的旧 Requirement（`数据仅存在于当前会话`）。
- **BREAKING**（对本项目自身的行为而言）：`### Requirement: 数据仅存在于当前会话` 被移除，其 `刷新后不保留数据` 场景随之作废，行为反转为「刷新后恢复」。该项目无对外接口、无已发布产物，因此不涉及外部兼容性。
- 筛选状态（全部 / 未完成 / 已完成）**不**持久化，刷新后仍回到「全部」。
- 不引入任何 npm 依赖，不改动 `package.json`、`vite.config.ts`、`tsconfig*.json`。

## Capabilities

### New Capabilities

无。本次不引入新能力，只修改既有 `todo-list` 能力的行为。

### Modified Capabilities

- `todo-list`: `数据仅存在于当前会话` 这条 Requirement 被移除，替换为「待办数据持久化到浏览器本地存储」与「存储不可用或数据损坏时静默降级」两条新 Requirement。其余 6 条 Requirement（新增待办、展示待办列表、切换完成状态、删除待办、按完成状态筛选列表、展示剩余未完成数量）的行为不变。

## Impact

**修改文件**

- `src/composables/useTodos.ts` —— 初始化时读取存储、变更后写入存储、读取时的结构校验与降级
- `src/composables/useTodos.spec.ts` —— 新增持久化相关用例；既有的「实例隔离」用例需调整（存储是跨实例共享的，不再是天然隔离）
- `src/components/TodoList.spec.ts` —— 组件挂载后会读存储，测试需保证每个用例从干净的存储开始

**不受影响**

- `src/components/TodoList.vue` —— 组件只消费 `useTodos()` 的返回值，持久化完全发生在 composable 内，组件代码不需要改
- `src/App.vue`、`src/main.ts`、`src/style.css`、`index.html` —— 不涉及
- 依赖、构建配置、类型配置 —— 全部不变

**风险**

- **测试污染**：`jsdom` 提供真实的 `localStorage`，且它在同一测试文件内跨用例共享。若不清理，前一个用例写入的数据会渗进后一个用例。缓解：在 `beforeEach` 中清空存储，并在测试中显式设置存储内容来构造「已有数据」的场景。
- **既有测试的语义变化**：`useTodos.spec.ts` 的「实例隔离」用例原本断言两个 `useTodos()` 互不可见；引入持久化后，在同一存储下两个实例会看到同一份数据。这不是 bug，而是持久化的题中之义，但必须显式改写该用例而不是让它悄悄失败。
- **存储写入的时机**：若采用「在 `addTodo`/`toggleTodo`/`removeTodo` 内各写一次」的写法，容易漏掉某条路径（例如将来新增的修改路径）。缓解：用 `watch(todos, ..., { deep: true })` 统一落盘，让写入点只有一处。

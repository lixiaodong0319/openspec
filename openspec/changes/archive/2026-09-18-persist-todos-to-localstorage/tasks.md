# Tasks

## 1. 测试环境准备：隔离存储

- [x] 1.1 在 `src/composables/useTodos.spec.ts` 顶部增加 `beforeEach`，清空 `localStorage`，确保每个用例从干净存储开始。验证：`npm run test:run` 中 `useTodos.spec.ts` 的既有 17 个用例仍全部通过（此时实现未改，清空存储对它们无影响）
- [x] 1.2 在 `src/components/TodoList.spec.ts` 顶部增加 `beforeEach`，清空 `localStorage`。验证：`npm run test:run` 中 `TodoList.spec.ts` 的既有 13 个用例仍全部通过

## 2. 存储读写与降级（Red → Green）

- [x] 2.1 **Red**：在 `src/composables/useTodos.spec.ts` 新增 `describe('持久化到本地存储')`，编写写入侧用例：调用 `addTodo` 后 `await nextTick()`，断言 `localStorage` 中存在内容且能解析出刚新增的待办；`toggleTodo` 与 `removeTodo` 后同样断言存储已同步。验证：`npm run test:run`，新用例必须**失败**（当前实现不写存储），记录失败信息
- [x] 2.2 **Green**：在 `src/composables/useTodos.ts` 中实现写入：定义存储键常量与 `{ version: 1, todos }` 信封结构，用 `watch(todos, ..., { deep: true })` 统一落盘，整体包 `try/catch`，写入失败时忽略异常。验证：`npm run test:run`，2.1 的用例转绿
- [x] 2.3 **Red**：在同一 `describe` 中编写读取侧用例：预置存储为合法信封（含两条待办，其中一条已完成），调用 `useTodos()` 后断言 `todos` 恢复了这两条且完成状态正确、`activeCount` 正确、`filter` 为 `{ kind: 'all' }`。验证：`npm run test:run`，新用例失败（当前实现不读存储）
- [x] 2.4 **Green**：在 `useTodos.ts` 中实现读取：初始化时解析存储，返回 `{ version: 1, todos: [...] }` 时用其作为 `todos` 初值，其余情况退回空列表，整体包 `try/catch`。验证：`npm run test:run`，2.3 的用例转绿
- [x] 2.5 **Red**：编写脏数据用例：存储分别为「非法 JSON」「合法 JSON 但不是对象/不是数组」「`version` 非 1」「`todos` 不是数组」「数组含缺 `title`、缺 `completed`、`completed` 为字符串、`id` 非数字的条目」，断言均不抛异常、页面可用，且非法条目被过滤掉而合法条目保留。验证：`npm run test:run`，新用例失败
- [x] 2.6 **Green**：在 `useTodos.ts` 的读取路径中实现逐条校验与过滤（`title` 必须为非空字符串、`completed` 必须为布尔、`id` 必须为数字），整份不可解析时退回空列表。验证：`npm run test:run`，2.5 的用例转绿
- [x] 2.7 **Red**：编写存储不可用用例：用 `vi.spyOn` 让 `localStorage.getItem` 抛异常，断言 `useTodos()` 正常返回空列表；让 `setItem` 抛异常，断言 `addTodo` 后待办仍出现在内存中的 `todos` 里。验证：`npm run test:run`，新用例失败
- [x] 2.8 **Green**：确认读写两侧的 `try/catch` 已覆盖上述路径（必要时补齐），使 `getItem`/`setItem` 抛异常时静默降级。验证：`npm run test:run`，2.7 的用例转绿

## 3. id 冲突修复（Red → Green）

- [x] 3.1 **Red**：在 `useTodos.spec.ts` 新增用例：预置存储含一条 `id` 为 7 的待办，调用 `useTodos()` 后新增一条，断言新增条目的 `id` 不等于 7；再对该条执行 `toggleTodo` / `removeTodo`，断言只作用在它自己身上、id 为 7 的条目不受影响。验证：`npm run test:run`，新用例失败（当前 `nextId` 从 0 开始，恢复数据后新增会撞 id）
- [x] 3.2 **Green**：在 `useTodos.ts` 读取路径中把 `nextId` 初始化为已恢复条目 `id` 的最大值加一（无恢复数据时为 0）。验证：`npm run test:run`，3.1 的用例转绿

## 4. 既有用例语义修正

- [x] 4.1 改写 `useTodos.spec.ts` 的「实例隔离」用例：原断言为「两个 `useTodos()` 互不可见」，改为断言「两个实例共享同一份持久化数据（一方写入后另一方重新调用 `useTodos()` 能看到）」，并在用例名中体现这是持久化的预期行为而非缺陷。验证：`npm run test:run`，该用例通过且用例名不再声称「隔离」
- [x] 4.2 复核 `useTodos.spec.ts` 与 `TodoList.spec.ts` 中依赖「新实例初始为空列表」的用例，确认 `beforeEach` 清空存储后其前提仍成立；若有用例被存储污染，改为显式清空或预置存储。验证：`npm run test:run`，两个文件全部用例通过

## 5. 重构与收口

- [x] 5.1 **Refactor**：把 `useTodos.ts` 中的存储读写抽为模块内私有函数（如 `readTodos()` / `writeTodos()`），让 `useTodos()` 主体只保留编排逻辑；键名与校验函数同样收敛为模块内常量/私有函数。验证：`npm run test:run` 与 `npm run typecheck` 全绿，且本组未新增或删改用例（行为不变）
- [x] 5.2 确认「刷新」这一行为的测试诚实性：单测只能覆盖「新实例从存储恢复」与「写入落盘」，无法真正驱动浏览器刷新。在 `tasks.md` 或 `design.md` 中如实记录该覆盖边界，不声称已测到真实刷新。验证：产出记录，且明确指认哪些场景由哪些用例覆盖、哪一部分属实现事实保证

## 6. 全量验证

- [x] 6.1 逐条对照 `openspec/changes/persist-todos-to-localstorage/specs/todo-list/spec.md` 的全部 Scenario，确认每条都有对应用例或明确的实现事实说明（尤其 `刷新后筛选回到全部`、`写入失败不影响当前会话`、`条目结构不合法时被丢弃` 三条）。验证：产出对照结论，指明每条 Scenario 对应的用例名
- [x] 6.2 运行 `npm run test:run`，确认全部用例通过且总数大于变更前的 30。验证：命令输出全绿，记录最终用例数
- [x] 6.3 运行 `npm run typecheck`，确认无类型错误。验证：命令退出码为 0
- [x] 6.4 运行 `openspec validate --changes --strict`，确认该变更通过校验。验证：输出 `✓` 且无警告

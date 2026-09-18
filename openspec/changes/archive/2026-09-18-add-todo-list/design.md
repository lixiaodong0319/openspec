# Design

## Context

见 `proposal.md` 的 Why。技术上下文：

- 项目是 Vite + Vue 3（`^3.5.42`）+ TypeScript（`~6.0.2`）的单页应用，无路由、无状态管理库。
- 测试栈已就绪：`vitest` + `@vue/test-utils` + `jsdom`，命令为 `npm run test:run`；类型检查为 `npm run typecheck`（`vue-tsc -b --noEmit`）。
- 唯一的现有测试 `src/components/HelloWorld.spec.ts` 展示了本项目已有的测试写法：`mount()` 挂载组件、用 `wrapper.get(selector)` 取节点、`await trigger('click')` 驱动交互、断言用中文 `it` 描述。
- `src/style.css` 已定义一套 CSS 变量（`--accent`、`--border`、`--text`、`--code-bg` 等）与 light/dark 配色，新组件直接复用。

## Goals / Non-Goals

**Goals:**

- 把 spec 里的 7 条 Requirement 落成可被单元测试逐条覆盖的实现。
- 让「状态逻辑」与「DOM 渲染」分开测试：逻辑层的边界条件（空标题、trim、切换只影响目标项、筛选子集、计数）不需要经过 DOM。
- 保持项目现有的测试与代码风格，不引入新的约定。

**Non-Goals:**

- 不做持久化、不做跨标签同步、不做服务端交互、不做筛选状态的持久化（刷新后筛选回到「全部」）。
- 不做计数以外的统计（如完成率、按日期分组）、不做优先级、截止日期、编辑标题、批量操作。
- 不重写 `src/style.css` 的全局样式，只做增量。
- 不清理 `src/assets/hero.png` 等因删除 `HelloWorld.vue` 而失去引用的资源。

## Decisions

### 决策 1：状态逻辑抽成 composable，而非全部写在组件里

**做法**：新增 `src/composables/useTodos.ts`，导出一个返回 `{ todos, filter, filteredTodos, activeCount, addTodo, toggleTodo, removeTodo }` 的函数；`TodoList.vue` 只负责输入框、筛选控件、列表渲染与事件绑定。

**理由**：

- spec 中「拒绝空白标题」「trim 后入列」「切换只影响目标条目」「删除后不影响其余」「筛选子集为空」「计数不受筛选影响」这类断言本质是数据操作，用 DOM 断言表达会把测试写得很绕（需要反复数 `wrapper.findAll` 的下标）。
- 逻辑层可用纯函数式测试覆盖边界，组件测试只验证「渲染与事件接线」是否正确，两层职责清晰。

**考虑过的替代方案**：

- *全部写在 `TodoList.vue` 的 `<script setup>` 里*——文件更少，但测试只能走 DOM，边界用例的测试成本明显更高。
- *引入 Pinia*——本项目只有一个功能，为一个内存数组引入状态管理库属于过度设计，与 proposal 中「不引入状态管理库」的约束冲突。

**取舍**：多一个文件、多一次 props/emit 的思考成本，换取测试可读性。

### 决策 2：筛选状态与派生数据放在 composable 内

**做法**：

- `filter` 为 `ref<TodoFilter>({ kind: 'all' })`，`TodoFilter` 为 `{ kind: 'all' | 'active' | 'completed' }`。用对象而非裸字符串，是为了让「筛选」这个值将来能携带参数（如按标签筛选）而不改变类型形状。
- `filteredTodos` 为 `computed`，按 `filter` 过滤 `todos`。
- `activeCount` 为 `computed`，等于 `todos` 中 `completed === false` 的条数 —— 基于全量 `todos` 而非 `filteredTodos`，因此天然不受筛选影响（spec 明确要求）。
- `addTodo` 在成功入列后把 `filter` 重置为 `{ kind: 'all' }`（spec 要求「提交后回到全部筛选」）。注意只有真正新增成功才重置：空白标题被拒绝时不得改动筛选。
- `toggleTodo` 不触碰 `filter`：在「未完成」筛选下勾选一条，该条目会因 `filteredTodos` 重算而自动从列表消失（spec 明确要求）。

**理由**：

- 计数的两条约束（不受筛选影响、随增删改变化）用「基于全量数据的 computed」一行表达，比在组件里手写 watch/增减计数更不容易错，也不需要额外的测试来防止计数漂移。
- 「新增后回到全部」是一条会改变用户可见状态的副作用，放在 `addTodo` 内而非组件的事件处理器里，可以让它在逻辑层被测试覆盖，而不必通过 DOM 触发。

**考虑过的替代方案**：

- *`filter` 用裸字符串 `'all' | 'active' | 'completed'`*——类型更短，但后续要加筛选参数时得改类型、改所有断言，形状成本不划算。
- *`activeCount` 由组件从 `filteredTodos` 计算*——会让「计数不受筛选影响」这条直接失效，与 spec 冲突。
- *把「回到全部」放在组件的提交处理器里*——则逻辑层测试测不到这条行为，只能靠组件测试兜底。

**取舍**：`useTodos` 承担了一点「用户操作后的视图重置」职责，不纯粹是数据层。这是刻意的选择——换取该行为可被逻辑层测试覆盖。

### 决策 2：待办项用 `{ id, title, completed }` 对象表示

**做法**：`todos` 为对象数组，`id` 由模块级自增计数器生成（每次调用 `useTodos()` 时从 0 开始）。

**理由**：

- 切换与删除必须精确作用于目标条目，用数组下标作为身份在删除后会错位。
- 不需要 UUID：数据不出内存、不做持久化，自增整数已足够唯一。

**取舍**：`id` 在多次 `useTodos()` 调用间会重复。这在本设计下不成问题，因为每个组件实例持有自己的列表，不做跨列表引用。

### 决策 3：测试选择器依赖语义化 class，不依赖文案

**做法**：
- 输入框用 `.todo-input`，提交按钮用 `.todo-add`，条目用 `.todo-item`，条目标题用 `.todo-title`，切换控件用 `.todo-toggle`，删除按钮用 `.todo-delete`，空列表提示用 `.todo-empty`。
- 三个筛选按钮用 `.todo-filter`，各按钮通过 `data-filter="all" | "active" | "completed"` 区分；当前选中的筛选按钮带 `.todo-filter--active` 类。
- 剩余未完成数量用 `.todo-count`。
- 条目的完成状态通过 `.todo-item--completed` 类体现，测试断言该类是否存在，而不是断言删除线样式。

**理由**：`HelloWorld.spec.ts` 已在用 `button.counter` 这类 class 选择器，保持同一风格。断言 class 而非文案，可以让文案调整不破坏测试；而「已完成项视觉可区分」「筛选下的空子集」这类 spec 要求，用 class 是否挂载来断言是最稳定、最不依赖具体 CSS 的验证方式。

筛选按钮用 `data-filter` 而非三个独立 class，是因为测试需要「选中某个筛选」这个动作有稳定的寻址方式；用 `data-filter="active"` 定位比依赖按钮在 DOM 中的顺序更稳。

`.todo-count` 的文本内容约定为纯数字（如 `2`），不含「剩余」等文案 —— 这样测试可以直接断言数字，而文案调整不破坏测试。

**考虑过的替代方案**：用 `data-testid`。更规范，但与项目现有写法不一致，且为一个演示功能引入新约定不划算。

### 决策 5：删除 `HelloWorld.vue` 与其测试

**做法**：本次变更同时删除 `src/components/HelloWorld.vue` 和 `src/components/HelloWorld.spec.ts`，`App.vue` 改为渲染 `TodoList`。

**理由**：脚手架示例保留下来会与真实功能并存，让「首屏是什么」这件事长期含糊。删除它让项目从「模板」变成「应用」。

**取舍**：见 proposal 的 Impact —— 短期内测试套件只剩新增用例。这是可接受的，因为示例计数器的行为不值得长期守护。

## Risks / Trade-offs

- **[风险] 空列表提示与列表容器可能被实现成同一个节点，导致「不渲染任何条目」的断言含糊** → 缓解：`.todo-empty` 与 `.todo-item` 用并列节点，测试断言空态下 `.todo-item` 数量为 0 且 `.todo-empty` 存在。注意「空列表」与「筛选下子集为空」是两种不同的空态，两者都应落入同一个 `.todo-empty` 分支，不可只处理前者。

- **[风险] `filteredTodos` 与 `activeCount` 若都从 `filteredTodos` 派生，会让「计数不受筛选影响」这条静默失效** → 缓解：`activeCount` 明确基于全量 `todos` 计算，并在 `useTodos.spec.ts` 与 `TodoList.spec.ts` 中各写一条「切换筛选后计数不变」的断言，任何一侧写错都会被测试拦住。

- **[风险] 严格模式下 Vue 的响应式更新是异步的，测试忘记 `await` 会得到过期的 DOM** → 缓解：所有交互后的断言前都 `await`；`tasks.md` 中明确要求测试先跑成 Red 再实现，Red 阶段就会暴露漏 `await` 的问题。

- **[风险] 删除 `HelloWorld.vue` 后 `src/assets/hero.png`、`vite.svg`、`vue.svg` 成为无引用资源，`vue-tsc` 或构建可能报未使用** → 缓解：这些是 `assets/` 下的静态资源而非 TS 模块，`vue-tsc -b --noEmit` 不会对未被 import 的资源报错；本次保留不清理，若后续要清理应另开一个纯清理 change。

- **[取舍] 逐条 Requirement 都有测试，但「数据仅存在于当前会话」这条无法用单元测试真正验证** → 缓解：该条通过「不引入 localStorage 等持久化 API」这一实现事实来保证，测试层面只覆盖「新挂载的实例初始为空列表」。这一点在 tasks 中如实标注，不假装测到了刷新行为。

## Migration Plan

无需迁移。本次是本项目首个功能变更：无既有数据、无对外接口、无部署产物依赖。回滚方式即 `git revert` 对应提交。
